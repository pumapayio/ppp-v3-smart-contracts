// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/access/AccessControlEnumerable.sol';
import '../common/PausableControl.sol';

import '../common/libraries/TokenOperation.sol';
import '../common/interfaces/IBridge.sol';
import '../common/interfaces/IMultichainRouter.sol';

/// @dev MintBurnWrapper has the following aims:
/// 1. wrap token which does not support interface `IBridge` or `IRouter`
/// 2. wrap token which want to support multiple minters
/// 3. add security enhancement (mint cap, pausable, etc.)
contract MintBurnWrapper is IBridge, IRouter, AccessControlEnumerable, PausableControl {
	using SafeERC20 for IERC20;

	// access control roles
	bytes32 public constant MINTER_ROLE = keccak256('MINTER_ROLE');
	bytes32 public constant BRIDGE_ROLE = keccak256('BRIDGE_ROLE');
	bytes32 public constant ROUTER_ROLE = keccak256('ROUTER_ROLE');

	// pausable control roles
	bytes32 public constant PAUSE_MINT_ROLE = keccak256('PAUSE_MINT_ROLE');
	bytes32 public constant PAUSE_BURN_ROLE = keccak256('PAUSE_BURN_ROLE');
	bytes32 public constant PAUSE_BRIDGE_ROLE = keccak256('PAUSE_BRIDGE_ROLE');
	bytes32 public constant PAUSE_ROUTER_ROLE = keccak256('PAUSE_ROUTER_ROLE');
	bytes32 public constant PAUSE_DEPOSIT_ROLE = keccak256('PAUSE_DEPOSIT_ROLE');
	bytes32 public constant PAUSE_WITHDRAW_ROLE = keccak256('PAUSE_WITHDRAW_ROLE');

	struct Supply {
		uint256 max; // single limit of each mint
		uint256 cap; // total limit of all mint
		uint256 total; // total minted minus burned
		uint256 comintcap; // total limit of cominters which is burned by this minter
	}

	mapping(address => Supply) public minterSupply;
	uint256 public totalMintCap; // total mint cap
	uint256 public totalMinted; // total minted amount

	address public immutable override token; // the target token this contract is wrapping
	TokenType public immutable override tokenType;

	mapping(address => uint256) public depositBalance;

	constructor(
		address _token,
		TokenType _tokenType,
		uint256 _totalMintCap,
		address _admin
	) {
		require(_token != address(0), 'zero token address');
		require(_admin != address(0), 'zero admin address');
		token = _token;
		tokenType = _tokenType;
		totalMintCap = _totalMintCap;
		_grantRole(DEFAULT_ADMIN_ROLE, _admin);
	}

	function owner() external view returns (address) {
		return getRoleMember(DEFAULT_ADMIN_ROLE, 0);
	}

	function pause(bytes32 role) external onlyRole(DEFAULT_ADMIN_ROLE) {
		_pause(role);
	}

	function unpause(bytes32 role) external onlyRole(DEFAULT_ADMIN_ROLE) {
		_unpause(role);
	}

	function _mint(address to, uint256 amount) internal whenNotPaused(PAUSE_MINT_ROLE) {
		require(to != address(this), 'forbid mint to address(this)');

		Supply storage s = minterSupply[msg.sender];
		require(amount <= s.max, 'minter max exceeded');
		s.total += amount;
		require(s.total <= s.cap, 'minter cap exceeded');

		totalMinted += amount;
		require(totalMinted <= totalMintCap, 'total mint cap exceeded');

		if (
			tokenType == TokenType.Transfer ||
			tokenType == TokenType.TransferDeposit ||
			tokenType == TokenType.TransferDeposit2
		) {
			IERC20(token).safeTransfer(to, amount);
		} else {
			TokenOperation.safeMint(token, to, amount);
		}
	}

	function _burn(address from, uint256 amount) internal whenNotPaused(PAUSE_BURN_ROLE) {
		require(from != address(this), 'forbid burn from address(this)');

		if (hasRole(MINTER_ROLE, msg.sender)) {
			Supply storage s = minterSupply[msg.sender];
			require(s.total + s.comintcap >= amount, 'minter burn amount exceeded');
			if (s.total >= amount) {
				s.total -= amount;
			} else if (s.total == 0) {
				s.comintcap -= amount;
			} else {
				s.comintcap -= (amount - s.total);
				s.total = 0;
			}
		}

		require(totalMinted >= amount, 'total burn amount exceeded');
		totalMinted -= amount;

		if (
			tokenType == TokenType.Transfer ||
			tokenType == TokenType.TransferDeposit ||
			tokenType == TokenType.TransferDeposit2
		) {
			IERC20(token).safeTransferFrom(from, address(this), amount);
		} else if (tokenType == TokenType.MintBurnAny) {
			TokenOperation.safeBurnAny(token, from, amount);
		} else if (tokenType == TokenType.MintBurnFrom) {
			TokenOperation.safeBurnFrom(token, from, amount);
		} else if (tokenType == TokenType.MintBurnSelf) {
			IERC20(token).safeTransferFrom(from, address(this), amount);
			TokenOperation.safeBurnSelf(token, amount);
		}
	}

	// impl IRouter `mint`
	function mint(address to, uint256 amount) external override onlyRole(MINTER_ROLE) returns (bool) {
		_mint(to, amount);
		return true;
	}

	// impl IRouter `burn`
	function burn(address from, uint256 amount)
		external
		override
		onlyRole(MINTER_ROLE)
		onlyRole(ROUTER_ROLE)
		whenNotPaused(PAUSE_ROUTER_ROLE)
		returns (bool)
	{
		_burn(from, amount);
		return true;
	}

	// impl IBridge `Swapin`
	function Swapin(
		bytes32 txhash,
		address account,
		uint256 amount
	)
		external
		override
		onlyRole(MINTER_ROLE)
		onlyRole(BRIDGE_ROLE)
		whenNotPaused(PAUSE_BRIDGE_ROLE)
		returns (bool)
	{
		_mint(account, amount);
		emit LogSwapin(txhash, account, amount);
		return true;
	}

	// impl IBridge `Swapout`
	function Swapout(uint256 amount, address bindaddr)
		external
		override
		whenNotPaused(PAUSE_BRIDGE_ROLE)
		returns (bool)
	{
		require(bindaddr != address(0), 'zero bind address');
		_burn(msg.sender, amount);
		emit LogSwapout(msg.sender, bindaddr, amount);
		return true;
	}

	function deposit(uint256 amount, address to)
		external
		whenNotPaused(PAUSE_DEPOSIT_ROLE)
		returns (uint256)
	{
		require(
			tokenType == TokenType.TransferDeposit || tokenType == TokenType.TransferDeposit2,
			'forbid depoist'
		);
		IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
		depositBalance[to] += amount;
		return amount;
	}

	function withdraw(uint256 amount, address to)
		external
		whenNotPaused(PAUSE_WITHDRAW_ROLE)
		returns (uint256)
	{
		require(
			tokenType == TokenType.TransferDeposit || tokenType == TokenType.TransferDeposit2,
			'forbid withdraw'
		);
		depositBalance[msg.sender] -= amount;
		IERC20(token).safeTransfer(to, amount);
		return amount;
	}

	function addMinter(
		address minter,
		uint256 cap,
		uint256 max
	) external onlyRole(DEFAULT_ADMIN_ROLE) {
		_grantRole(MINTER_ROLE, minter);
		minterSupply[minter].cap = cap;
		minterSupply[minter].max = max;
	}

	function removeMinter(address minter) external onlyRole(DEFAULT_ADMIN_ROLE) {
		_revokeRole(MINTER_ROLE, minter);
		minterSupply[minter].cap = 0;
		minterSupply[minter].max = 0;
	}

	function setTotalMintCap(uint256 cap) external onlyRole(DEFAULT_ADMIN_ROLE) {
		totalMintCap = cap;
	}

	function setMinterCap(address minter, uint256 cap) external onlyRole(DEFAULT_ADMIN_ROLE) {
		require(hasRole(MINTER_ROLE, minter), 'not minter');
		minterSupply[minter].cap = cap;
	}

	function setMinterMax(address minter, uint256 max) external onlyRole(DEFAULT_ADMIN_ROLE) {
		require(hasRole(MINTER_ROLE, minter), 'not minter');
		minterSupply[minter].max = max;
	}

	function setMinterTotal(
		address minter,
		uint256 total,
		bool force
	) external onlyRole(DEFAULT_ADMIN_ROLE) {
		require(force || hasRole(MINTER_ROLE, minter), 'not minter');
		minterSupply[minter].total = total;
	}

	function setComintCap(uint256 cap) external {
		require(hasRole(MINTER_ROLE, msg.sender), 'not minter');
		minterSupply[msg.sender].comintcap = cap;
	}

	function setComintCap(address minter, uint256 cap) external onlyRole(DEFAULT_ADMIN_ROLE) {
		require(hasRole(MINTER_ROLE, minter), 'not minter');
		minterSupply[minter].comintcap = cap;
	}
}
