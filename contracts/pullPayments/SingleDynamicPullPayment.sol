// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import '@openzeppelin/contracts/utils/Strings.sol';
import '../common/RegistryHelper.sol';

import './interfaces/ISingleDynamicPullPayment.sol';
import '../common/interfaces/IPullPaymentRegistry.sol';
import '../common/interfaces/IVersionedContract.sol';
import '../common/interfaces/IExecutor.sol';

/**
 * @title SingleDynamicPullPayment - The billing model for dynamic one time payment
 * @author The Pumapay Team
 * @notice A Dynamic PullPayment, like a Single PullPayment is a one-time payment.
 * However, in this case, the payment properties (currency, price, name) can be injected straight onto merchant websites and not through the Business Console.
 * This type of billing model is most suited to merchants who sell tens/hundreds/thousands of products with different descriptions and prices.
 */
contract SingleDynamicPullPayment is
	RegistryHelper,
	ReentrancyGuard,
	ISingleDynamicPullPayment,
	IVersionedContract
{
	using Counters for Counters.Counter;

	/*
   	=======================================================================
   	======================== Structures ===================================
   	=======================================================================
 	*/
	struct PullPayment {
		uint256 paymentAmount;
		uint256 executionTimestamp;
	}

	struct Subscription {
		address subscriber;
		string name;
		address settlementToken;
		address paymentToken;
		uint256[] pullPaymentIDs;
		mapping(uint256 => PullPayment) pullPayments;
		string uniqueReference;
	}

	struct BillingModel {
		address payee;
		string merchantName;
		string uniqueReference;
		string merchantURL;
		uint256[] subscriptionIDs;
		mapping(uint256 => Subscription) subscriptions;
		uint256 creationTime;
	}
	/*
   	=======================================================================
   	======================== Private Variables ============================
   	=======================================================================
 	*/
	/// @dev The couter for billing model ids
	Counters.Counter private _billingModelIDs;
	/// @dev The couter for subscription ids
	Counters.Counter private _subscriptionIDs;
	/// @dev The couter for pullpayment ids
	Counters.Counter private _pullPaymentIDs;

	/// @notice Mappings by ids

	/// @dev billing model ID => billing model details
	mapping(uint256 => BillingModel) private _billingModels;
	/// @dev subscription ID => billing model ID
	mapping(uint256 => uint256) private _subscriptionToBillingModel;
	/// @dev pull payment ID => subscription ID
	mapping(uint256 => uint256) private _pullPaymentToSubscription;

	/// @notice Mappings by address

	// Billing Model Creator => billing model IDs
	mapping(address => uint256[]) private _billingModelIdsByAddress;
	// Customer address => subscription IDs
	mapping(address => uint256[]) private _subscriptionIdsByAddress;
	// Customer address => pull payment IDs
	mapping(address => uint256[]) private _pullPaymentIdsByAddress;

	/// @notice Mappings by strings

	/// @dev bm unique reference => bmId
	mapping(string => uint256) private _bmReferences;
	/// @dev subscription unique reference => bmId
	mapping(string => uint256) private _subscriptionReferences;

	/*
   	=======================================================================
   	======================== Constructor/Initializer ======================
   	=======================================================================
 	*/
	/**
	 * @dev This method initializes registry helper to be able to access method of core registry
	 */
	constructor(address registryAddress) {
		_init_registryHelper(registryAddress);
	}

	/*
   	=======================================================================
   	======================== Events =======================================
    =======================================================================
 	*/
	event BillingModelCreated(uint256 indexed billingModelID, address indexed payee);
	event NewSubscription(
		uint256 indexed billingModelID,
		uint256 indexed subscriptionID,
		uint256 indexed pullPaymentID,
		address payee,
		address payer
	);

	event BillingModelEdited(
		uint256 indexed billingModelID,
		address indexed newPayee,
		address indexed oldPayee,
		string newMerhantName
	);
	/*
   	=======================================================================
   	======================== Modifiers ====================================
    =======================================================================
 	*/
	modifier onlyValidSubscriptionId(uint256 _subscriptionID) {
		require(
			_subscriptionID > 0 && _subscriptionID <= _subscriptionIDs.current(),
			'SingleDynamicPullPayment: INVALID_SUBSCRIPTION_ID'
		);
		_;
	}

	modifier onlyValidBillingModelId(uint256 _billingModelID) {
		require(
			_billingModelID > 0 && _billingModelID <= _billingModelIDs.current(),
			'SingleDynamicPullPayment: INVALID_BILLING_MODEL_ID'
		);
		_;
	}

	/*
   	=======================================================================
   	======================== Public Methods ===============================
   	=======================================================================
 	*/
	/**
	 * @notice Allows merchants to create a new billing model with required configurations
	 * @dev _merchantName, _reference and _merchantURL can be kept empty
	 * @param _payee 						- payee (receiver) address for pull payment
	 * @param _merchantName		 	- name of the merchant
	 * @param _reference				- unique refernce for billing model. if no external reference is passed, unique reference is generated on chain.
	 * @param _merchantURL			- merchant` personal url
	 * @return billingModelID 	- newly generated billing model id
	 */
	function createBillingModel(
		address _payee,
		string memory _merchantName,
		string memory _reference,
		string memory _merchantURL
	) public virtual override returns (uint256 billingModelID) {
		require(_payee != address(0), 'SingleDynamicPullPayment: INVALID_PAYEE_ADDRESS');

		_billingModelIDs.increment();
		uint256 newBillingModelID = _billingModelIDs.current();
		BillingModel storage bm = _billingModels[newBillingModelID];

		// Billing Model Details
		bm.payee = _payee;
		bm.creationTime = block.timestamp;
		bm.merchantName = _merchantName;
		bm.merchantURL = _merchantURL;

		// Owner/Creator of the billing model
		_billingModelIdsByAddress[msg.sender].push(newBillingModelID);

		if (bytes(_reference).length > 0) {
			require(_bmReferences[_reference] == 0, 'SingleDynamicPullPayment: REFERENCE_ALREADY_EXISTS');
			_bmReferences[_reference] = newBillingModelID;
			bm.uniqueReference = _reference;
		} else {
			string memory newReference = string(
				abi.encodePacked('SingleDynamicPullPayment_', Strings.toString(newBillingModelID))
			);
			_bmReferences[newReference] = newBillingModelID;
			bm.uniqueReference = newReference;
		}

		// emit event for new billing model
		emit BillingModelCreated(newBillingModelID, _payee);

		return newBillingModelID;
	}

	/**
	 * @notice Allows users to subscribe to a new billing model
	 * @dev One time payment is done at the time of subscription itself.
	 * @param _billingModelID    - the ID of the billing model
	 * @param _name              - the name that can be injected from the creator of the billing model for any future reference
	 * @param _settlementToken   - the token address that payee wants to get paid in
	 * @param _paymentToken      - the token address the customer wants to pay in
	 * @param _paymentAmount     - the amount for billing model that needs to be paid
	 * @param _reference 				 - the unique reference for the subscription.
	 */
	function subscribeToBillingModel(
		uint256 _billingModelID,
		string memory _name,
		address _settlementToken,
		address _paymentToken,
		uint256 _paymentAmount,
		string memory _reference
	)
		public
		virtual
		override
		nonReentrant
		onlyValidBillingModelId(_billingModelID)
		returns (uint256 subscriptionID)
	{
		require(
			registry.isSupportedToken(_settlementToken),
			'SingleDynamicPullPayment: UNSUPPORTED_TOKEN'
		);
		require(_paymentAmount > 0, 'SingleDynamicPullPayment: INVALID_AMOUNT');

		//update counters
		_subscriptionIDs.increment();
		_pullPaymentIDs.increment();
		uint256 newSubscriptionID = _subscriptionIDs.current();
		uint256 newPullPaymentID = _pullPaymentIDs.current();

		BillingModel storage bm = _billingModels[_billingModelID];
		Subscription storage suscription = bm.subscriptions[newSubscriptionID];
		//update the data
		suscription.subscriber = msg.sender;
		suscription.name = _name;
		suscription.settlementToken = _settlementToken;
		suscription.paymentToken = _paymentToken;

		bm
			.subscriptions[newSubscriptionID]
			.pullPayments[newPullPaymentID]
			.paymentAmount = _paymentAmount;
		suscription.pullPayments[newPullPaymentID].executionTimestamp = block.timestamp;

		//update the ids
		bm.subscriptionIDs.push(newSubscriptionID);
		suscription.pullPaymentIDs.push(newPullPaymentID);

		_subscriptionToBillingModel[newSubscriptionID] = _billingModelID;
		_subscriptionIdsByAddress[msg.sender].push(newSubscriptionID);

		// link pull payment with subscription
		_pullPaymentToSubscription[newPullPaymentID] = newSubscriptionID;
		// link pull payment with "payer"
		_pullPaymentIdsByAddress[msg.sender].push(newPullPaymentID);

		if (bytes(_reference).length > 0) {
			require(
				_subscriptionReferences[_reference] == 0,
				'SingleDynamicPullPayment: REFERENCE_ALREADY_EXISTS'
			);
			_subscriptionReferences[_reference] = newSubscriptionID;
			suscription.uniqueReference = _reference;
		} else {
			string memory newReference = string(
				abi.encodePacked(
					'SingleDynamicPullPayment_',
					Strings.toString(_billingModelID),
					'_',
					Strings.toString(newSubscriptionID)
				)
			);
			_subscriptionReferences[newReference] = newSubscriptionID;
			bm.subscriptions[newSubscriptionID].uniqueReference = newReference;
		}

		emit NewSubscription(
			_billingModelID,
			newSubscriptionID,
			newPullPaymentID,
			bm.payee,
			msg.sender
		);

		//execute the payment
		require(
			IExecutor(registry.getExecutor()).execute(
				_settlementToken,
				_paymentToken,
				msg.sender,
				bm.payee,
				_paymentAmount
			)
		);
		return newSubscriptionID;
	}

	/**
	 * @notice Allows merchants to edit their billing models
	 * Editing a billing model allows the creator of the billing model to update only attributes
	 * that does not affect the billing cycle of the customer, i.e. the name and the payee address etc.
	 * @dev _newMerchantName and _newMerchantURL can be empty
	 * @param _billingModelID 	- the ID of the billing model
	 * @param _newPayee 				- the address of new payee
	 * @param _newMerchantName 	- new name for merchant
	 * @param _newMerchantURL  	- merchant` new personal url
	 * @return billingModelID  	- billing model id edited
	 */
	function editBillingModel(
		uint256 _billingModelID,
		address _newPayee,
		string memory _newMerchantName,
		string memory _newMerchantURL
	)
		public
		virtual
		override
		onlyValidBillingModelId(_billingModelID)
		returns (uint256 billingModelID)
	{
		BillingModel storage bm = _billingModels[_billingModelID];

		require(msg.sender == bm.payee, 'SingleDynamicPullPayment: INVALID_EDITOR');
		require(_newPayee != address(0), 'SingleDynamicPullPayment: INVALID_PAYEE_ADDRESS');
		bm.payee = _newPayee;
		bm.merchantName = _newMerchantName;
		bm.merchantURL = _newMerchantURL;

		emit BillingModelEdited(_billingModelID, _newPayee, msg.sender, _newMerchantName);
		return _billingModelID;
	}

	/*
   	=======================================================================
   	======================== Getter Methods ===============================
   	=======================================================================
 	*/

	/**
	 * @notice Retrieves a billing model
	 * @dev shows subscription ids of billing model to only bm creator
	 * @param _billingModelID - the ID of the billing model
	 * @return bm							- returns the Billing model data struct
	 */
	function getBillingModel(uint256 _billingModelID)
		external
		view
		virtual
		override
		onlyValidBillingModelId(_billingModelID)
		returns (BillingModelData memory bm)
	{
		BillingModel storage bmDetails = _billingModels[_billingModelID];

		// If the caller is the address owning this billing model, then return the array with the
		// subscription IDs as well
		bm.payee = bmDetails.payee;
		bm.creationTime = bmDetails.creationTime;
		bm.merchantName = bmDetails.merchantName;
		bm.uniqueReference = bmDetails.uniqueReference;
		bm.merchantURL = bmDetails.merchantURL;

		if (msg.sender == bmDetails.payee) {
			bm.subscriptionIDs = bmDetails.subscriptionIDs;
		} else {
			// Otherwise, return an empty array for `_bmSubscriptionIDs`
			uint256[] memory emptyArray;
			bm.subscriptionIDs = emptyArray;
		}
	}

	/**
	 * @notice Retrieves subscription details
	 * @dev shows pullpayment ids of subscription to merchant of bm and subscriber only
	 * @param _subscriptionID - the ID of the subscription
	 * @return sb 						- the subscription information
	 */
	function getSubscription(uint256 _subscriptionID)
		external
		view
		virtual
		override
		onlyValidSubscriptionId(_subscriptionID)
		returns (SubscriptionData memory sb)
	{
		uint256 bmID = _subscriptionToBillingModel[_subscriptionID];
		BillingModel storage bm = _billingModels[bmID];
		Subscription storage subscription = bm.subscriptions[_subscriptionID];

		sb.payee = bm.payee;
		sb.name = subscription.name;
		sb.subscriber = subscription.subscriber;
		sb.settlementToken = subscription.settlementToken;
		sb.paymentToken = subscription.paymentToken;
		sb.uniqueReference = subscription.uniqueReference;

		if (msg.sender == bm.payee || msg.sender == subscription.subscriber) {
			sb.pullPaymentIDs = subscription.pullPaymentIDs;
		} else {
			// Return an empty array for `_subscriptionPullPaymentIDs`in case the caller is not
			// the payee or the subscriber
			uint256[] memory emptyArray;
			sb.pullPaymentIDs = emptyArray;
		}
	}

	/**
	 * @notice Returns the details of a pull payment
	 * @dev shows pullpayment amount and timestamp to granted executor, bm creator and subscriber only
	 * @param _pullPaymentID 	- the Id of the pull payment
	 * @return pullPayment 		- the pullpayment informations
	 */
	function getPullPayment(uint256 _pullPaymentID)
		external
		view
		virtual
		returns (PullPayment memory pullPayment)
	{
		require(
			_pullPaymentID > 0 && _pullPaymentID <= _pullPaymentIDs.current(),
			'RecurringPullPayment: INVALID_PULLPAYMENT_ID'
		);
		uint256 bmID = _subscriptionToBillingModel[_pullPaymentToSubscription[_pullPaymentID]];
		BillingModel storage bm = _billingModels[bmID];
		Subscription storage subscription = bm.subscriptions[
			_pullPaymentToSubscription[_pullPaymentID]
		];
		pullPayment.paymentAmount = bm
			.subscriptions[_pullPaymentToSubscription[_pullPaymentID]]
			.pullPayments[_pullPaymentID]
			.paymentAmount;
		pullPayment.executionTimestamp = bm
			.subscriptions[_pullPaymentToSubscription[_pullPaymentID]]
			.pullPayments[_pullPaymentID]
			.executionTimestamp;

		if (
			msg.sender != bm.payee &&
			msg.sender != subscription.subscriber &&
			IPullPaymentRegistry(registry.getPullPaymentRegistry()).isExecutorGranted(msg.sender) == false
		) {
			pullPayment.paymentAmount = 0;
			pullPayment.executionTimestamp = 0;
		}
	}

	/**
	 * @notice Retrieves billing model IDs for an address
	 * @dev Returns an array with the billing model IDs related with that address
	 * @param _creator 					- address that created the billing model
	 * @return billingModelIDs 	- returns list of billing model ids for merchant
	 */
	function getBillingModelIdsByAddress(address _creator)
		external
		view
		returns (uint256[] memory billingModelIDs)
	{
		return _billingModelIdsByAddress[_creator];
	}

	/**
	 * @notice Retrieves subscription ids for an address
	 * @dev Returns an array with the subscription IDs related with that address
	 * @param _subscriber 			- address the pull payment relates to
	 * @return subscriptionIDs 	- the list of subscription ids for subscriber
	 */
	function getSubscriptionIdsByAddress(address _subscriber)
		external
		view
		returns (uint256[] memory subscriptionIDs)
	{
		return _subscriptionIdsByAddress[_subscriber];
	}

	/**
	 * @notice Retrieves pull payment ids for an address
	 * @dev Returns an array with the pull payment IDs related with that address
	 * @param _subscriber 		- address the pull payment relates to
	 * @return pullPaymentIDs - the list of pullpayment ids
	 */
	function getPullPaymentsIdsByAddress(address _subscriber)
		external
		view
		returns (uint256[] memory pullPaymentIDs)
	{
		return _pullPaymentIdsByAddress[_subscriber];
	}

	/**
	 * @notice Gives current billing model id
	 */
	function getCurrentBillingModelId() external view virtual returns (uint256) {
		return _billingModelIDs.current();
	}

	/**
	 * @notice Gives current subscription id
	 */
	function getCurrentSubscriptionId() external view virtual returns (uint256) {
		return _subscriptionIDs.current();
	}

	/**
	 * @notice Gives current pullpayment id
	 */
	function getCurrentPullPaymentId() external view virtual returns (uint256) {
		return _pullPaymentIDs.current();
	}

	/**
	 * @notice Returns the storage, major, minor, and patch version of the contract.
	 * @return The storage, major, minor, and patch version of the contract.
	 */
	function getVersionNumber()
		external
		pure
		override
		returns (
			uint256,
			uint256,
			uint256,
			uint256
		)
	{
		return (1, 0, 0, 0);
	}
}
