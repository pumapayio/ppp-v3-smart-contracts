// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/utils/Address.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol';

contract MultichainERC20 is IERC20Metadata {
	using SafeERC20 for IERC20Metadata;
	string public override name;
	string public override symbol;
	uint8 public immutable override decimals;

	address public immutable underlying;
	bool public constant underlyingIsMinted = false;

	/// @dev Records amount of AnyswapV6ERC20 token owned by account.
	mapping(address => uint256) public override balanceOf;
	uint256 private _totalSupply;

	// init flag for setting immediate vault, needed for CREATE2 support
	bool private _init;

	// flag to enable/disable swapout vs vault.burn so multiple events are triggered
	bool private _vaultOnly;

	// delay for timelock functions
	uint256 public constant DELAY = 2 days;

	// set of minters, can be this bridge or other bridges
	mapping(address => bool) public isMinter;
	address[] public minters;

	// primary controller of the token contract
	address public vault;

	address public pendingMinter;
	uint256 public delayMinter;

	address public pendingVault;
	uint256 public delayVault;

	modifier onlyAuth() {
		require(isMinter[msg.sender], 'MultichainERC20: FORBIDDEN');
		_;
	}

	modifier onlyVault() {
		require(msg.sender == vault, 'MultichainERC20: FORBIDDEN');
		_;
	}

	function owner() external view returns (address) {
		return vault;
	}

	function mpc() external view returns (address) {
		return vault;
	}

	function setVaultOnly(bool enabled) external onlyVault {
		_vaultOnly = enabled;
	}

	function initVault(address _vault) external onlyVault {
		require(_init);
		_init = false;
		vault = _vault;
		isMinter[_vault] = true;
		minters.push(_vault);
	}

	function setVault(address _vault) external onlyVault {
		require(_vault != address(0), 'MultichainERC20: address(0)');
		pendingVault = _vault;
		delayVault = block.timestamp + DELAY;
	}

	function applyVault() external onlyVault {
		require(pendingVault != address(0) && block.timestamp >= delayVault);
		vault = pendingVault;

		pendingVault = address(0);
		delayVault = 0;
	}

	function setMinter(address _auth) external onlyVault {
		require(_auth != address(0), 'MultichainERC20: address(0)');
		pendingMinter = _auth;
		delayMinter = block.timestamp + DELAY;
	}

	function applyMinter() external onlyVault {
		require(pendingMinter != address(0) && block.timestamp >= delayMinter);
		isMinter[pendingMinter] = true;
		minters.push(pendingMinter);

		pendingMinter = address(0);
		delayMinter = 0;
	}

	// No time delay revoke minter emergency function
	function revokeMinter(address _auth) external onlyVault {
		isMinter[_auth] = false;
	}

	function getAllMinters() external view returns (address[] memory) {
		return minters;
	}

	function changeVault(address newVault) external onlyVault returns (bool) {
		require(newVault != address(0), 'MultichainERC20: address(0)');
		emit LogChangeVault(vault, newVault, block.timestamp);
		vault = newVault;
		pendingVault = address(0);
		delayVault = 0;
		return true;
	}

	function mint(address to, uint256 amount) external onlyAuth returns (bool) {
		_mint(to, amount);
		return true;
	}

	function burn(address from, uint256 amount) external onlyAuth returns (bool) {
		_burn(from, amount);
		return true;
	}

	function Swapin(
		bytes32 txhash,
		address account,
		uint256 amount
	) external onlyAuth returns (bool) {
		if (underlying != address(0) && IERC20Metadata(underlying).balanceOf(address(this)) >= amount) {
			IERC20Metadata(underlying).safeTransfer(account, amount);
		} else {
			_mint(account, amount);
		}
		emit LogSwapin(txhash, account, amount);
		return true;
	}

	function Swapout(uint256 amount, address bindaddr) external returns (bool) {
		require(!_vaultOnly, 'MultichainERC20: vaultOnly');
		require(bindaddr != address(0), 'MultichainERC20: address(0)');
		if (underlying != address(0) && balanceOf[msg.sender] < amount) {
			IERC20Metadata(underlying).safeTransferFrom(msg.sender, address(this), amount);
		} else {
			_burn(msg.sender, amount);
		}
		emit LogSwapout(msg.sender, bindaddr, amount);
		return true;
	}

	/// @dev Records number of AnyswapV6ERC20 token that account (second) will be allowed to spend on behalf of another account (first) through {transferFrom}.
	mapping(address => mapping(address => uint256)) public override allowance;

	event LogChangeVault(
		address indexed oldVault,
		address indexed newVault,
		uint256 indexed effectiveTime
	);
	event LogSwapin(bytes32 indexed txhash, address indexed account, uint256 amount);
	event LogSwapout(address indexed account, address indexed bindaddr, uint256 amount);

	constructor(
		string memory _name,
		string memory _symbol,
		uint8 _decimals,
		address _underlying,
		address _vault
	) {
		name = _name;
		symbol = _symbol;
		decimals = _decimals;
		underlying = _underlying;
		if (_underlying != address(0)) {
			require(_decimals == IERC20Metadata(_underlying).decimals());
		}

		// Use init to allow for CREATE2 accross all chains
		_init = true;

		// Disable/Enable swapout for v1 tokens vs mint/burn for v3 tokens
		_vaultOnly = false;

		vault = _vault;
	}

	/// @dev Returns the total supply of AnyswapV6ERC20 token as the ETH held in this contract.
	function totalSupply() external view override returns (uint256) {
		return _totalSupply;
	}

	function deposit() external returns (uint256) {
		uint256 _amount = IERC20Metadata(underlying).balanceOf(msg.sender);
		IERC20Metadata(underlying).safeTransferFrom(msg.sender, address(this), _amount);
		return _deposit(_amount, msg.sender);
	}

	function deposit(uint256 amount) external returns (uint256) {
		IERC20Metadata(underlying).safeTransferFrom(msg.sender, address(this), amount);
		return _deposit(amount, msg.sender);
	}

	function deposit(uint256 amount, address to) external returns (uint256) {
		IERC20Metadata(underlying).safeTransferFrom(msg.sender, address(this), amount);
		return _deposit(amount, to);
	}

	function depositVault(uint256 amount, address to) external onlyVault returns (uint256) {
		return _deposit(amount, to);
	}

	function _deposit(uint256 amount, address to) internal returns (uint256) {
		require(!underlyingIsMinted);
		require(underlying != address(0) && underlying != address(this));
		_mint(to, amount);
		return amount;
	}

	function withdraw() external returns (uint256) {
		return _withdraw(msg.sender, balanceOf[msg.sender], msg.sender);
	}

	function withdraw(uint256 amount) external returns (uint256) {
		return _withdraw(msg.sender, amount, msg.sender);
	}

	function withdraw(uint256 amount, address to) external returns (uint256) {
		return _withdraw(msg.sender, amount, to);
	}

	function withdrawVault(
		address from,
		uint256 amount,
		address to
	) external onlyVault returns (uint256) {
		return _withdraw(from, amount, to);
	}

	function _withdraw(
		address from,
		uint256 amount,
		address to
	) internal returns (uint256) {
		require(!underlyingIsMinted);
		require(underlying != address(0) && underlying != address(this));
		_burn(from, amount);
		IERC20Metadata(underlying).safeTransfer(to, amount);
		return amount;
	}

	/** @dev Creates `amount` tokens and assigns them to `account`, increasing
	 * the total supply.
	 *
	 * Emits a {Transfer} event with `from` set to the zero address.
	 *
	 * Requirements
	 *
	 * - `to` cannot be the zero address.
	 */
	function _mint(address account, uint256 amount) internal {
		require(account != address(0), 'ERC20: mint to the zero address');

		_totalSupply += amount;
		balanceOf[account] += amount;
		emit Transfer(address(0), account, amount);
	}

	/**
	 * @dev Destroys `amount` tokens from `account`, reducing the
	 * total supply.
	 *
	 * Emits a {Transfer} event with `to` set to the zero address.
	 *
	 * Requirements
	 *
	 * - `account` cannot be the zero address.
	 * - `account` must have at least `amount` tokens.
	 */
	function _burn(address account, uint256 amount) internal {
		require(account != address(0), 'ERC20: burn from the zero address');

		uint256 balance = balanceOf[account];
		require(balance >= amount, 'ERC20: burn amount exceeds balance');

		balanceOf[account] = balance - amount;
		_totalSupply -= amount;
		emit Transfer(account, address(0), amount);
	}

	/// @dev Sets `value` as allowance of `spender` account over caller account's AnyswapV6ERC20 token.
	/// Emits {Approval} event.
	/// Returns boolean value indicating whether operation succeeded.
	function approve(address spender, uint256 value) external override returns (bool) {
		allowance[msg.sender][spender] = value;
		emit Approval(msg.sender, spender, value);

		return true;
	}

	/// @dev Moves `value` AnyswapV6ERC20 token from caller's account to account (`to`).
	/// Emits {Transfer} event.
	/// Returns boolean value indicating whether operation succeeded.
	/// Requirements:
	///   - caller account must have at least `value` AnyswapV6ERC20 token.
	function transfer(address to, uint256 value) external override returns (bool) {
		require(to != address(0) && to != address(this));
		uint256 balance = balanceOf[msg.sender];
		require(balance >= value, 'MultichainERC20: transfer amount exceeds balance');

		balanceOf[msg.sender] = balance - value;
		balanceOf[to] += value;
		emit Transfer(msg.sender, to, value);

		return true;
	}

	/// @dev Moves `value` AnyswapV6ERC20 token from account (`from`) to account (`to`) using allowance mechanism.
	/// `value` is then deducted from caller account's allowance, unless set to `type(uint256).max`.
	/// Emits {Approval} event to reflect reduced allowance `value` for caller account to spend from account (`from`),
	/// unless allowance is set to `type(uint256).max`
	/// Emits {Transfer} event.
	/// Returns boolean value indicating whether operation succeeded.
	/// Requirements:
	///   - `from` account must have at least `value` balance of AnyswapV6ERC20 token.
	///   - `from` account must have approved caller to spend at least `value` of AnyswapV6ERC20 token, unless `from` and caller are the same account.
	function transferFrom(
		address from,
		address to,
		uint256 value
	) external override returns (bool) {
		require(to != address(0) && to != address(this));
		if (from != msg.sender) {
			uint256 allowed = allowance[from][msg.sender];
			if (allowed != type(uint256).max) {
				require(allowed >= value, 'MultichainERC20: request exceeds allowance');
				uint256 reduced = allowed - value;
				allowance[from][msg.sender] = reduced;
				emit Approval(from, msg.sender, reduced);
			}
		}

		uint256 balance = balanceOf[from];
		require(balance >= value, 'MultichainERC20: transfer amount exceeds balance');

		balanceOf[from] = balance - value;
		balanceOf[to] += value;
		emit Transfer(from, to, value);

		return true;
	}
}
