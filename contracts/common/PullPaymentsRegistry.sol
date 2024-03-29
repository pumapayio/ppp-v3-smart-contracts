// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import './interfaces/IPullPaymentRegistry.sol';

/**
 * @title PullPaymentsRegistry - Routes identifiers to pullpayment contracts.
 * @author The Pumapay Team
 * @notice This contract manages the routes for the different pullpayment contracts.
 * Also it manages the executor roles for the executor contract.
 */
contract PullPaymentsRegistry is OwnableUpgradeable, IPullPaymentRegistry {
	/*
   	=======================================================================
   	======================== Public Variables ============================
   	=======================================================================
 	*/
	/// @dev Indicates the number of pullpayments to execute in one batch
	uint256 public BATCH_SIZE;

	/// @notice PP Contract name => PP Address
	mapping(bytes32 => address) public registry;

	/// @notice account(PP) address => isExecutor
	mapping(address => bool) private executors;

	/// @notice upkeep contract address => upkeepId
	mapping(address => uint256) public upkeepIds;

	/// @notice userAddress => subscriptionId => true/false
	mapping(address => mapping(uint256 => bool)) public isLowBalanceSubscription;

	/*
   	=======================================================================
   	======================== Constructor/Initializer ======================
   	=======================================================================
 	*/

	/**
	 * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
	 */
	function initialize() external virtual initializer {
		__Ownable_init();

		BATCH_SIZE = 20;
	}

	/*
   	=======================================================================
   	======================== Events =======================================
 		=======================================================================
 	*/

	event RegistryUpdated(
		string indexed identifier,
		bytes32 indexed identifierHash,
		address indexed addr
	);
	event ExecutorGranted(address indexed executor);
	event ExecutorRevoked(address indexed executor);
	/*
   	=======================================================================
   	======================== Modifiers ====================================
 		=======================================================================
 	*/

	modifier onlyValidExecutorAddress(address _executor) {
		require(_executor != address(0), 'PullPaymentRegistry: INVALID_EXECUTOR_ADDRESS');
		_;
	}

	/*
   	=======================================================================
   	======================== Public Methods ===============================
   	=======================================================================
 	*/

	/**
	 * @notice This method allows pullpayment contracts to add the low balance subscription ids in order to prevent the pullpayment execution
	 * @param _subscriptionId - indicates the low balance subscription id
	 */
	function addLowBalanceSubscription(uint256 _subscriptionId)
		public
		virtual
		onlyValidExecutorAddress(msg.sender)
	{
		isLowBalanceSubscription[msg.sender][_subscriptionId] = true;
	}

	/**
	 * @notice This method allows pullpayment contracts to remove the low balance subscription ids in order to allow the pullpayment execution
	 * @param _subscriptionId - indicates the low balance subscription id
	 */
	function removeLowBalanceSubscription(uint256 _subscriptionId)
		public
		virtual
		onlyValidExecutorAddress(msg.sender)
	{
		delete isLowBalanceSubscription[msg.sender][_subscriptionId];
	}

	/**
	 * @notice This method allows owner to add the upkeeps in the core registry
	 * @param upkeepAddress - indicates the upkeep address(pullPaynent contract which is keeper compatible)
	 * @param upkeepId 			- indicates the upkeep id which is received after registering the upkeep in keeper registry.
	 */
	function setUpkeepId(address upkeepAddress, uint256 upkeepId) external virtual onlyOwner {
		require(upkeepAddress != address(0), 'INVALID_UPKEEP_ADDRESS');
		require(upkeepId > 0, 'INVALID_UPKEEP_ID');
		upkeepIds[upkeepAddress] = upkeepId;
	}

	/**
	 *	@notice Grant executor role account to call the execute function on the Executor.
	 *	@dev only owner can grant executor role
	 *	@param _executor - Address of the executor
	 */
	function grantExecutor(address _executor)
		external
		virtual
		override
		onlyOwner
		onlyValidExecutorAddress(_executor)
	{
		executors[_executor] = true;
		emit ExecutorGranted(_executor);
	}

	/**
	 *	@notice Revoke the executor from calling execute function.
	 *	@dev only owner can revoke executor role
	 *	@param _executor - Address of the executor
	 */
	function revokeExecutor(address _executor)
		external
		virtual
		override
		onlyOwner
		onlyValidExecutorAddress(_executor)
	{
		require(executors[_executor] == true, 'PullPaymentRegistry: EXECUTOR_ALREADY_REVOKED');
		executors[_executor] = false;
		emit ExecutorRevoked(_executor);
	}

	/**
	 *	@notice Associates the given pullpayment contract`s address with the given identifier.
	 *	@dev only owner can add pullpayment contract route
	 * 	@param _identifier 	- Identifier of the pullpayment contract whose address we want to set.
	 * 	@param _addr 				- Address of contract.
	 */
	function addPullPaymentContract(string calldata _identifier, address _addr)
		external
		virtual
		override
		onlyOwner
		onlyValidExecutorAddress(_addr)
	{
		bytes32 identifierHash = keccak256(abi.encodePacked(_identifier));
		registry[identifierHash] = _addr;
		//set the pullpayment contract as executor
		executors[_addr] = true;
		emit RegistryUpdated(_identifier, identifierHash, _addr);
		emit ExecutorGranted(_addr);
	}

	/**
	 * @notice This method allows owner to update the batch size for executing the subscriptions in batch
	 */
	function updateBatchSize(uint256 _batchSize) external onlyOwner {
		BATCH_SIZE = _batchSize;
	}

	/*
   	=======================================================================
   	======================== Getter Methods ===============================
   	=======================================================================
 	*/

	/**
	 * @notice Gets pullPayment contract`s address associated with the given identifierHash.
	 * @param _identifierHash	- Identifier hash of contract whose address we want to look up.
	 * @dev Throws if address not set.
	 */
	function getPPAddressForOrDie(bytes32 _identifierHash)
		external
		view
		virtual
		override
		returns (address)
	{
		require(
			registry[_identifierHash] != address(0),
			'PullPaymentRegistry: IDENTIFIER_NOT_REGISTERED'
		);
		return registry[_identifierHash];
	}

	/**
	 * @notice Gets pullPayment contract`s address associated with the given identifierHash.
	 * @param _identifierHash - Identifier hash of contract whose address we want to look up.
	 */
	function getPPAddressFor(bytes32 _identifierHash)
		external
		view
		virtual
		override
		returns (address)
	{
		return registry[_identifierHash];
	}

	/**
	 * @notice Gets address associated with the given identifier.
	 * @param _identifier - Identifier of contract whose address we want to look up.
	 * @dev Throws if address not set.
	 */
	function getPPAddressForStringOrDie(string calldata _identifier)
		external
		view
		virtual
		override
		returns (address)
	{
		bytes32 identifierHash = keccak256(abi.encodePacked(_identifier));
		require(
			registry[identifierHash] != address(0),
			'PullPaymentRegistry: IDENTIFIER_NOT_REGISTERED'
		);
		return registry[identifierHash];
	}

	/**
	 * @notice Gets address associated with the given identifier.
	 * @param _identifier Identifier of contract whose address we want to look up.
	 */
	function getPPAddressForString(string calldata _identifier)
		external
		view
		virtual
		override
		returns (address)
	{
		bytes32 identifierHash = keccak256(abi.encodePacked(_identifier));
		return registry[identifierHash];
	}

	/**
	 * @notice This method checks whether executor is granted or not.
	 * @param _executor - executor address
	 */
	function isExecutorGranted(address _executor) external view virtual override returns (bool) {
		return executors[_executor];
	}
}
