// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';
import '../common/libraries/PullPaymentUtils.sol';

interface IERC20 {
	function transfer(address to, uint256 value) external returns (bool);

	event Transfer(address indexed from, address indexed to, uint256 value);
}

/**
 * @notice Faucet
 * @author - The Pumapay Team
 * @notice This contract allows users to claim the faucets using which they can explore the features of our billing models.
 * User can claim the tokens once in a day.
 */
contract Faucet is Ownable {
	using PullPaymentUtils for address[];

	/*
   	=======================================================================
   	======================== Public variatibles ===========================
   	=======================================================================
 	*/
	/// @dev The waiting period for users to be able to claim tokens
	uint256 public constant waitTime = 1 days;

	/// @dev list of faucet tokens
	address[] public faucetTokens;

	/// @dev faucet address => faucet amount for claim
	mapping(address => uint256) public faucetAmount;

	/// @dev userAddress => last claimed time
	mapping(address => uint256) public lastAccessTime;

	/*
   	=======================================================================
   	======================== Constructor/Initializer ======================
   	=======================================================================
 	*/
	/**
	 * @notice The constructor for initializing the faucet contrct.
	 * @dev Faucet can be initialized with no faucets tokens
	 * @param _tokenInstances - The list of faucet token addresses
	 * @param _tokenAmounts 	- The list of faucet token amount for claim
	 */
	constructor(address[] memory _tokenInstances, uint256[] memory _tokenAmounts) public {
		addFaucets(_tokenInstances, _tokenAmounts);
	}

	/*
   	=======================================================================
   	======================== Events =======================================
 	  =======================================================================
 	*/
	event FaucetAdded(address faucet, uint256 amount);
	event FaucetRemoved(address faucet);
	event FaucetClaimed(address account, uint256 amount, uint256 timestamp);

	/*
   	=======================================================================
   	======================== Public Methods ===============================
   	=======================================================================
 	*/

	/**
	 * @notice This function allows owner to add new list of faucets for claiming
	 * @param _tokenInstances		- faucet token address
	 * @param _tokenAmounts			- amount of faucets to be claimed
	 */
	function addFaucets(address[] memory _tokenInstances, uint256[] memory _tokenAmounts)
		public
		onlyOwner
	{
		require(_tokenInstances.length == _tokenAmounts.length, 'Faucet: INVALID_TOKEN_DATA');
		for (uint256 i = 0; i < _tokenInstances.length; i++) {
			addFaucet(_tokenInstances[i], _tokenAmounts[i]);
		}
	}

	/**
	 * @notice This function allows owner to add new faucet for claiming
	 * @param _tokenAddress		- faucet token address
	 * @param _amount					- amount of faucets to be claimed
	 */
	function addFaucet(address _tokenAddress, uint256 _amount) public onlyOwner {
		require(_amount > 0, 'Faucet:INVALID_FAUCET_AMOUNT');
		faucetTokens.addAddressInList(_tokenAddress);
		faucetAmount[_tokenAddress] = _amount;
		emit FaucetAdded(_tokenAddress, _amount);
	}

	/**
	 * @notice This function allows owner to remove faucet from claiming
	 * @param _tokenAddress 	- faucet token address
	 */
	function removeFaucet(address _tokenAddress) external onlyOwner {
		faucetTokens.removeAddressFromList(_tokenAddress);
		delete faucetAmount[_tokenAddress];
		emit FaucetRemoved(_tokenAddress);
	}

	/**
	 * @notice This function allows owner to update faucet claiming amount
	 * @param _faucet				- faucet token address
	 * @param _newAmount		- new faucet amount
	 */
	function updateFaucetAmount(address _faucet, uint256 _newAmount) external onlyOwner {
		require(_newAmount > 0, 'Faucet:INVALID_FAUCET_AMOUNT');
		(bool exists, ) = faucetTokens.isAddressExists(_faucet);
		require(exists, 'Faucet: INVALID_CLAIM');
		faucetAmount[_faucet] = _newAmount;
	}

	/**
	 * @notice This function allows users to claim the faucets. user can claim any token once in day.
	 * @param _faucetToken		- faucet token to claim
	 */
	function requestTokens(address _faucetToken) external {
		(bool exists, ) = faucetTokens.isAddressExists(_faucetToken);
		require(exists, 'Faucet: INVALID_CLAIM');
		require(allowedToWithdraw(msg.sender), 'Faucet: MUST_WAIT');
		IERC20(_faucetToken).transfer(msg.sender, faucetAmount[_faucetToken]);
		lastAccessTime[msg.sender] = block.timestamp + waitTime;
		emit FaucetClaimed(msg.sender, faucetAmount[_faucetToken], block.timestamp);
	}

	/**
	 * @notice This function tells whether user is applicable for claiming faucets or not
	 * @param _address - indicates the user address
	 */
	function allowedToWithdraw(address _address) public view returns (bool) {
		return block.timestamp >= lastAccessTime[_address];
	}

	/**
	 * @notice gives the list of available faucet tokens
	 */
	function getFaucetList() external view returns (address[] memory) {
		return faucetTokens;
	}

	/**
	 * @notice tells whether given token is faucet or not
	 */
	function isFaucetSupported(address _token) external view returns (bool supported) {
		(supported, ) = faucetTokens.isAddressExists(_token);
	}
}
