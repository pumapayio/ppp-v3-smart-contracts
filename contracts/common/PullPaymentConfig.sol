// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import './libraries/PullPaymentUtils.sol';

/**
 * @title PullPaymentConfig - contains all the configurations related with the pullpayments
 * @author The Pumapay Team
 * @notice This contracts contains configurations for the pullpayments i.e supported tokens, execution fee, execution fee receiver
 * @dev All the configurations can only be configured by owner only
 */
contract PullPaymentConfig is OwnableUpgradeable {
	/*
   	=======================================================================
   	======================== Public Variables ============================
   	=======================================================================
 	*/

	/// @notice Pullpayment Execution fee receiver address
	address public executionFeeReceiver;

	/// @notice Executopm fee percentage. 1 - 100%
	uint256 public executionFee;

	/// @notice list of supported tokens for pullPayments
	address[] public supportedTokens;

	/// @notice Extension period for pullpayments
	uint256 public extensionPeriod;

	/*
   	=======================================================================
   	======================== Constructor/Initializer ======================
   	=======================================================================
 	*/
	/**
	 * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
	 * @param _executionFeeReceiver - indiactes the execution fee receiver address
	 * @param _executionFee 				- indicates the execution fee percentage. 1% - 99%
	 */
	function init_PullPaymentConfig(address _executionFeeReceiver, uint256 _executionFee)
		public
		virtual
		initializer
	{
		require(_executionFeeReceiver != address(0), 'PullPaymentConfig: INVALID_FEE_RECEIVER');

		__Ownable_init();

		updateExecutionFeeReceiver(_executionFeeReceiver);
		updateExecutionFee(_executionFee);

		extensionPeriod = 1 days;
	}

	/*
   	=======================================================================
   	======================== Events =======================================
 	  =======================================================================
 	*/
	event SupportedTokenAdded(address indexed _token);
	event SupportedTokenRemoved(address indexed _token);
	event UpdatedExecutionFeeReceiver(address indexed _newReceiver);
	event UpdatedExecutionFee(uint256 indexed _newFee);

	/*
   	=======================================================================
   	======================== Public Methods ===============================
   	=======================================================================
 	*/

	/**
	 * @dev Add a token to the supported token list. only owner can add the supported token.
	 * @param _tokenAddress - The address of the token to add.
	 */
	function addToken(address _tokenAddress) external virtual onlyOwner {
		PullPaymentUtils.addAddressInList(supportedTokens, _tokenAddress);
		emit SupportedTokenAdded(_tokenAddress);
	}

	/**
	 * @dev Remove a token from the supported token list. only owner can remove the supported token.
	 * @param _tokenAddress - The address of the token to remove.
	 */
	function removeToken(address _tokenAddress) external virtual onlyOwner {
		PullPaymentUtils.removeAddressFromList(supportedTokens, _tokenAddress);
		emit SupportedTokenRemoved(_tokenAddress);
	}

	/**
	 * @dev This method allows owner to update the execution fee receiver address. only owner can update this address.
	 * @param _newReceiver - address of new execution fee receiver
	 */
	function updateExecutionFeeReceiver(address _newReceiver) public virtual onlyOwner {
		require(_newReceiver != address(0), 'PullPaymentConfig: INVALID_FEE_RECEIVER');
		executionFeeReceiver = _newReceiver;
		emit UpdatedExecutionFeeReceiver(_newReceiver);
	}

	/**
	 * @notice This method allows owner to update the execution fee. only owner can update execution fee.
	 * @param _newFee - new execution fee. 1% - 99%
	 */
	function updateExecutionFee(uint256 _newFee) public virtual onlyOwner {
		// 0 < 100
		require(_newFee < 10000, 'PullPaymentConfig: INVALID_FEE_PERCENTAGE');
		executionFee = _newFee;
		emit UpdatedExecutionFee(_newFee);
	}

	/**
	 * @notice allows owner to update the extension period for the pullpayment execution
	 */
	function updateExtensionPeriod(uint256 _newPeriod) external virtual onlyOwner {
		extensionPeriod = _newPeriod;
	}

	/*
   	=======================================================================
   	======================== Getter Methods ===============================
   	=======================================================================
 	*/

	/**
	 * @notice Get the list of supported tokens
	 */
	function getSupportedTokens() external view virtual returns (address[] memory) {
		return supportedTokens;
	}

	/**
	 * @notice Checks if given token is supported token or not. returns true if supported otherwise returns false.
	 * @param _tokenAddress - ERC20 token address.
	 */
	function isSupportedToken(address _tokenAddress) external view virtual returns (bool isExists) {
		(isExists, ) = PullPaymentUtils.isAddressExists(supportedTokens, _tokenAddress);
	}
}
