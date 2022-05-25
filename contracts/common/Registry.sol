// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import './CoreRegistry.sol';
import './PullPaymentConfig.sol';

/**
 * @title Registry - The core registry of pumapay ecosystem
 * @author The Pumapay Teams
 * @notice This core registry contains routes to varioud contracts of pumapay ecosystem.
 * @dev This Registry extends the features of core registry and pullpayment configs contracts.
 */
contract Registry is OwnableUpgradeable, CoreRegistry, PullPaymentConfig {
	/*
   	=======================================================================
   	======================== Constants ====================================
   	=======================================================================
 	*/
	bytes32 constant PMA_TOKEN_REGISTRY_ID = keccak256(abi.encodePacked('PMAToken'));
	bytes32 constant WBNB_TOKEN_REGISTRY_ID = keccak256(abi.encodePacked('WBNBToken'));
	bytes32 constant EXECUTOR_REGISTRY_ID = keccak256(abi.encodePacked('Executor'));
	bytes32 constant UNISWAP_FACTORY_REGISTRY_ID = keccak256(abi.encodePacked('UniswapFactory'));
	bytes32 constant UNISWAP_ROUTER_REGISTRY_ID = keccak256(abi.encodePacked('UniswapV2Router02'));
	bytes32 constant PULLPAYMENT_REGISTRY_ID = keccak256(abi.encodePacked('PullPaymentsRegistry'));

	/*
   	=======================================================================
   	======================== Constructor/Initializer ======================
   	=======================================================================
 	*/
	/**
	 * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
	 * @dev This initializes the core registry and the pullpayment contracts.
	 */
	function initialize(address _executionFeeReceiver, uint256 _executionFee)
		external
		virtual
		initializer
	{
		__Ownable_init();
		_init_coreRegistry();
		init_PullPaymentConfig(_executionFeeReceiver, _executionFee);
	}

	/*
   	=======================================================================
   	======================== Modifiers ====================================
 		=======================================================================
 	*/
	modifier onlyRegisteredContract(bytes32 identifierHash) {
		require(
			getAddressForOrDie(identifierHash) == msg.sender,
			'UsingRegistry: ONLY_REGISTERED_CONTRACT'
		);
		_;
	}

	modifier onlyRegisteredContracts(bytes32[] memory identifierHashes) {
		require(isOneOf(identifierHashes, msg.sender), 'UsingRegistry: ONLY_REGISTERED_CONTRACTS');
		_;
	}

	/*
   	=======================================================================
   	======================== Getter Methods ===============================
   	=======================================================================
 	*/

	/**
	 * @notice This method returns the address of the PMA token contract
	 */
	function getPMAToken() public view virtual returns (address) {
		return getAddressForOrDie(PMA_TOKEN_REGISTRY_ID);
	}

	/**
	 * @notice This method returns the address of the WBNB token contract
	 */
	function getWBNBToken() public view virtual returns (address) {
		return getAddressForOrDie(WBNB_TOKEN_REGISTRY_ID);
	}

	/**
	 * @notice This method returns the address of the Executor contract
	 */
	function getExecutor() public view virtual returns (address) {
		return getAddressForOrDie(EXECUTOR_REGISTRY_ID);
	}

	/**
	 * @notice This method returns the address of the uniswap/pancakeswap factory contract
	 */
	function getUniswapFactory() public view virtual returns (address) {
		return getAddressForOrDie(UNISWAP_FACTORY_REGISTRY_ID);
	}

	/**
	 * @notice This method returns the address of the uniswap/pancakeswap router contract
	 */
	function getUniswapRouter() public view virtual returns (address) {
		return getAddressForOrDie(UNISWAP_ROUTER_REGISTRY_ID);
	}

	/**
	 * @notice This method returns the address of the pullpayment registry contract
	 */
	function getPullPaymentRegistry() public view virtual returns (address) {
		return getAddressForOrDie(PULLPAYMENT_REGISTRY_ID);
	}
}
