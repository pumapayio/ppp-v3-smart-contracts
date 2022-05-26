// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import '@openzeppelin/contracts/utils/Strings.sol';
import '../common/RegistryHelper.sol';

import './interfaces/IRecurringPPWithPaidTrial.sol';
import '../common/interfaces/IPullPaymentRegistry.sol';
import '../common/interfaces/IVersionedContract.sol';
import '../common/interfaces/IExecutor.sol';
import '../common/interfaces/IUniswapV2Router02.sol';

/**
 * @title RecurringPullPaymentWithPaidTrial - The billing model for subscription based payments with paid trial
 * @author The Pumapay Team
 * @notice A Subscription PullPayment with Paid Trial is a recurring payment subscription, that includes an option for merchants to set up a paid trial period before the recurring payments begin.
 * This billing model allows merchants the flexibility to offer customers a paid trial for a pre-defined interval of time before the full subscription payments begin.
 * A typical example of this type of billing model is a monthly membership payment of $50.00 for 12 months with a one-time registration fee of $10.00 paid first.
 */
contract RecurringPullPaymentWithPaidTrial is
	ReentrancyGuard,
	RegistryHelper,
	IRecurringPPWithPaidTrial,
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
		address paymentToken;
		uint256 numberOfPayments;
		uint256 startTimestamp;
		uint256 cancelTimestamp;
		uint256 nextPaymentTimestamp;
		uint256 lastPaymentTimestamp;
		uint256[] pullPaymentIDs;
		mapping(uint256 => PullPayment) pullPayments;
		string uniqueReference;
		address cancelledBy;
	}

	struct BillingModel {
		address payee;
		string name;
		string merchantName;
		string uniqueReference;
		string merchantURL;
		uint256 amount;
		address settlementToken;
		uint256 frequency;
		uint256 trialPeriod;
		uint256 initialAmount;
		uint256 numberOfPayments;
		uint256[] subscriptionIDs;
		mapping(uint256 => Subscription) subscriptions;
		uint256 creationTime;
	}

	struct PullPaymentData {
		uint256 paymentAmount;
		uint256 executionTimestamp;
		uint256 billingModelID;
		uint256 subscriptionID;
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

	/// @dev Billing Model Creator => billing model IDs
	mapping(address => uint256[]) private _billingModelIdsByAddress;
	/// @dev Customer address => subscription IDs
	mapping(address => uint256[]) private _subscriptionIdsByAddress;
	/// @dev Customer address => pull payment IDs
	mapping(address => uint256[]) private _pullPaymentIdsByAddress;
	/// @dev customer address => list of inactive subscription Ids
	mapping(address => uint256[]) private _inactiveSubscriptionsByAddress;

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
		address payee,
		address payer
	);
	event PullPaymentExecuted(
		uint256 indexed subscriptionID,
		uint256 indexed pullPaymentID,
		uint256 indexed billingModelID,
		address payee,
		address payer
	);
	event SubscriptionCancelled(
		uint256 indexed billingModelID,
		uint256 indexed subscriptionID,
		address payee,
		address payer
	);

	event BillingModelEdited(
		uint256 indexed billingModelID,
		address indexed newPayee,
		string indexed newName,
		string newMerchantName,
		address oldPayee
	);

	/*
   	=======================================================================
   	======================== Modifiers ====================================
    =======================================================================
 	*/
	modifier onlyValidSubscriptionId(uint256 _subscriptionID) {
		require(
			_subscriptionID > 0 && _subscriptionID <= _subscriptionIDs.current(),
			'RecurringPullPaymentWithPaidTrial: INVALID_SUBSCRIPTION_ID'
		);
		_;
	}

	modifier onlyValidBillingModelId(uint256 _billingModelID) {
		require(
			_billingModelID > 0 && _billingModelID <= _billingModelIDs.current(),
			'RecurringPullPaymentWithPaidTrial: INVALID_BILLING_MODEL_ID'
		);
		_;
	}

	/*
   	=======================================================================
   	======================== Public Methods ===============================
   	=======================================================================
 	*/
	/**
	 * @notice Allows merchants to create a new billing model with required configurations.
	 * here merchant specifies the paid trial duration and amount for paid trial.
	 * @dev _name, _merchantName, _reference and _merchantURL can be empty.
	 * @param _payee             - payee (receiver) address for pull payment
	 * @param _name              - name that can be injected from the creator of the billing model for any future reference
	 * @param _merchantName		 	 - name of the merchant
	 * @param _reference				 - unique refernce for billing model. unique reference is generated if external reference is not given.
	 * @param _merchantURL			 - merchant` personal url
	 * @param _amount            - amount that the payee requests / amount that the payer needs to pay
	 * @param _token             - token address in which the payee defines the amount
	 * @param _frequency         - billing cycle in seconds i.e. monthly = 30d * 24h * 60m * 60s
	 * @param _trialPeriod       - free trial period in seconds i.e monthly = 30d * 24h * 60m * 60s
	 * @param _initialAmount     - Initial amount for paid trial.
	 * @param _numberOfPayments  - number of payments the customer will pay i.e. 12 to cover a monthly subscription for a year.
	 * @return billingModelID 	 - newly generated billing model id
	 */
	function createBillingModel(
		address _payee,
		string memory _name,
		string memory _merchantName,
		string memory _reference,
		string memory _merchantURL,
		uint256 _amount,
		address _token,
		uint256 _frequency,
		uint256 _trialPeriod,
		uint256 _initialAmount,
		uint256 _numberOfPayments
	) public virtual override returns (uint256 billingModelID) {
		require(_payee != address(0), 'RecurringPPWithPaidTrial: INVALID_PAYEE_ADDRESS');
		require(_amount > 0, 'RecurringPPWithPaidTrial: INVALID_AMOUNT');

		require(_frequency > 0, 'RecurringPPWithPaidTrial: INVALID_FREQUENCY');
		require(_trialPeriod > 0, 'RecurringPPWithPaidTrial: INVALID_TRIAL_PERIOD');
		require(_initialAmount > 0, 'RecurringPPWithPaidTrial: INVALID_INITIAL_AMOUNT');
		require(_numberOfPayments > 0, 'RecurringPPWithPaidTrial: INVALID_NO_OF_PAYMENTS');
		require(registry.isSupportedToken(_token), 'RecurringPPWithPaidTrial: UNSUPPORTED_TOKEN');

		_billingModelIDs.increment();
		uint256 newBillingModelID = _billingModelIDs.current();
		BillingModel storage bm = _billingModels[newBillingModelID];

		// Billing Model Details
		bm.payee = _payee;
		bm.name = _name;
		bm.merchantName = _merchantName;
		bm.amount = _amount;
		bm.settlementToken = _token;
		bm.frequency = _frequency;
		bm.trialPeriod = _trialPeriod;
		bm.initialAmount = _initialAmount;
		bm.numberOfPayments = _numberOfPayments;
		bm.creationTime = block.timestamp;
		bm.merchantURL = _merchantURL;

		// Owner/Creator of the billing model
		_billingModelIdsByAddress[msg.sender].push(newBillingModelID);

		if (bytes(_reference).length > 0) {
			require(
				_bmReferences[_reference] == 0,
				'RecurringPullPaymentWithPaidTrial_: REFERENCE_ALREADY_EXISTS'
			);
			_bmReferences[_reference] = newBillingModelID;
			bm.uniqueReference = _reference;
		} else {
			string memory newReference = string(
				abi.encodePacked('RecurringPullPaymentWithPaidTrial_', Strings.toString(newBillingModelID))
			);
			_bmReferences[newReference] = newBillingModelID;
			bm.uniqueReference = newReference;
		}

		// emit event for new billing model
		emit BillingModelCreated(newBillingModelID, _payee);

		return newBillingModelID;
	}

	/**
	 * @notice Allows users to subscribe to a new billing model.
	 * @dev the paid trial payment is done at the time of subscription. The recurring payments are charged when paid trial ends
	 * @param _billingModelID    - the ID of the billing model
	 * @param _paymentToken      - the token address the customer wants to pay in
	 * @param _reference 				 - the unique reference for the subscription. if given empty, a unique reference is generated on chain
	 * @return subscriptionID 	 - newly generated subscription id
	 */
	function subscribeToBillingModel(
		uint256 _billingModelID,
		address _paymentToken,
		string memory _reference
	)
		public
		virtual
		override
		nonReentrant
		onlyValidBillingModelId(_billingModelID)
		returns (uint256 subscriptionID)
	{
		_subscriptionIDs.increment();
		uint256 newSubscriptionID = _subscriptionIDs.current();

		BillingModel storage bm = _billingModels[_billingModelID];
		Subscription storage subscription = bm.subscriptions[newSubscriptionID];

		subscription.subscriber = msg.sender;
		subscription.paymentToken = _paymentToken;
		subscription.startTimestamp = block.timestamp;

		//set lastPaymentTimestamp to current time
		subscription.lastPaymentTimestamp = block.timestamp;
		//set the nextPaymentTimestamp to startTime + paid trial period
		subscription.nextPaymentTimestamp = block.timestamp + bm.trialPeriod;

		subscription.numberOfPayments = bm.numberOfPayments;
		bm.subscriptionIDs.push(newSubscriptionID);

		_subscriptionToBillingModel[newSubscriptionID] = _billingModelID;
		_subscriptionIdsByAddress[msg.sender].push(newSubscriptionID);

		if (bytes(_reference).length > 0) {
			require(
				_subscriptionReferences[_reference] == 0,
				'RecurringPullPaymentWithPaidTrial: REFERENCE_ALREADY_EXISTS'
			);
			_subscriptionReferences[_reference] = newSubscriptionID;
			subscription.uniqueReference = _reference;
		} else {
			string memory newReference = string(
				abi.encodePacked(
					'RecurringPullPaymentWithPaidTrial_',
					Strings.toString(_billingModelID),
					'_',
					Strings.toString(newSubscriptionID)
				)
			);
			_subscriptionReferences[newReference] = newSubscriptionID;
			subscription.uniqueReference = newReference;
		}

		//execute the payment for paid trial
		require(
			IExecutor(registry.getExecutor()).execute(
				bm.settlementToken,
				_paymentToken,
				msg.sender,
				bm.payee,
				bm.initialAmount
			)
		);

		emit NewSubscription(_billingModelID, newSubscriptionID, bm.payee, msg.sender);
		return newSubscriptionID;
	}

	/**
	 * @notice This method allows anyone to execute the recurring pullpayment for the subscription.
	 * The pullpayment for subscription will be executed only after the paid trial ends
	 * @dev our backend will call this method to execute the recurring payment for the subscription at regular interval of time.
	 * @param _subscriptionID 	- The subscription id for which recurring pullpayment to execute.
	 * @return pullPaymentID		- The newly generated pullPayment id
	 */
	function executePullPayment(uint256 _subscriptionID)
		public
		virtual
		override
		nonReentrant
		onlyValidSubscriptionId(_subscriptionID)
		returns (uint256 pullPaymentID)
	{
		return _executePullPayment(_subscriptionID);
	}

	/**
	 * @dev This method contains actual logic for executing the pull payment for the subscription.
	 * Requirements-
	 * 1. current time should exceed next payment` time. i.e paid trial should be completed
	 * 2. subscription is not cancelled.
	 * 3. total number of payments are not completed.
	 * @param _subscriptionID 	- The subscription id for which recurring pullpayment to execute.
	 * @return pullPaymentID		- The newly generated pullPayment id
	 */
	function _executePullPayment(uint256 _subscriptionID) private returns (uint256 pullPaymentID) {
		BillingModel storage bm = _billingModels[_subscriptionToBillingModel[_subscriptionID]];
		Subscription storage subscription = bm.subscriptions[_subscriptionID];
		uint256 billingModelID = _subscriptionToBillingModel[_subscriptionID];

		require(
			block.timestamp >= subscription.startTimestamp &&
				block.timestamp >= subscription.nextPaymentTimestamp,
			'RecurringPullPaymentWithPaidTrial: INVALID_EXECUTION_TIME'
		);
		require(
			subscription.cancelTimestamp == 0 || block.timestamp < subscription.cancelTimestamp,
			'RecurringPullPaymentWithPaidTrial: SUBSCRIPTION_CANCELED'
		);
		require(
			subscription.numberOfPayments > 0,
			'RecurringPullPaymentWithPaidTrial: NO_OF_PAYMENTS_EXCEEDED'
		);

		_pullPaymentIDs.increment();
		uint256 newPullPaymentID = _pullPaymentIDs.current();
		// update subscription
		subscription.numberOfPayments = subscription.numberOfPayments - 1;
		subscription.lastPaymentTimestamp = block.timestamp;
		subscription.nextPaymentTimestamp = subscription.nextPaymentTimestamp + bm.frequency;
		subscription.pullPaymentIDs.push(newPullPaymentID);
		// update pull payment
		subscription.pullPayments[newPullPaymentID].paymentAmount = bm.amount;
		subscription.pullPayments[newPullPaymentID].executionTimestamp = block.timestamp;
		// link pull payment with subscription
		_pullPaymentToSubscription[newPullPaymentID] = _subscriptionID;
		// link pull payment with "payer"
		_pullPaymentIdsByAddress[subscription.subscriber].push(newPullPaymentID);

		require(
			IExecutor(registry.getExecutor()).execute(
				bm.settlementToken,
				subscription.paymentToken,
				subscription.subscriber,
				bm.payee,
				bm.amount
			)
		);

		emit PullPaymentExecuted(
			_subscriptionID,
			newPullPaymentID,
			billingModelID,
			bm.payee,
			subscription.subscriber
		);

		return newPullPaymentID;
	}

	/**
	 * @notice This method allows customer / merchant to cancel the on going subscription.
	 * @dev cancelling subscription adds the subscription to inactive subscriptions list of subscriber
	 * @param _subscriptionID - the id of the subscription to cancel
	 * @return subscriptionID - the id of the cancelled subscription
	 */
	function cancelSubscription(uint256 _subscriptionID)
		public
		virtual
		override
		onlyValidSubscriptionId(_subscriptionID)
		returns (uint256 subscriptionID)
	{
		BillingModel storage bm = _billingModels[_subscriptionToBillingModel[_subscriptionID]];
		Subscription storage subscription = bm.subscriptions[_subscriptionID];

		require(
			subscription.cancelTimestamp == 0,
			'RecurringPullPaymentWithPaidTrial: ALREADY_CANCELLED'
		);

		require(
			msg.sender == subscription.subscriber || msg.sender == bm.payee,
			'RecurringPullPaymentWithPaidTrial: INVALID_CANCELER'
		);

		subscription.cancelTimestamp = block.timestamp;
		subscription.cancelledBy = msg.sender;

		_inactiveSubscriptionsByAddress[msg.sender].push(_subscriptionID);

		emit SubscriptionCancelled(
			_subscriptionToBillingModel[_subscriptionID],
			_subscriptionID,
			bm.payee,
			bm.subscriptions[_subscriptionID].subscriber
		);

		return _subscriptionID;
	}

	/**
	 * @notice Edit a billing model
	 * Editing a billing model allows the creator of the billing model to update only attributes
	 * that does not affect the billing cycle of the customer, i.e. the name and the payee address.
	 * Any other changes are not allowed.
	 * @dev _newName, _newMerchantName and _newMerchantURL can be empty.
	 *
	 * @param _billingModelID 	- the ID of the billing model
	 * @param _newPayee 				- the address of new payee
	 * @param _newName 					- new name for billing model
	 * @param _newMerchantName 	- new name for merchant
	 * @param _newMerchantURL  	- merchant` new personal url
	 * @return billingModelID  	- billing model id edited
	 */
	function editBillingModel(
		uint256 _billingModelID,
		address _newPayee,
		string memory _newName,
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

		require(msg.sender == bm.payee, 'RecurringPullPaymentWithPaidTrial: INVALID_EDITOR');

		require(
			_newPayee != address(0) || bytes(_newName).length > 0,
			'RecurringPullPaymentWithPaidTrial: INVALID_OPERATION'
		);

		if (_newPayee != address(0)) {
			bm.payee = _newPayee;
		}

		if (bytes(_newName).length > 0) {
			require(
				keccak256(bytes(_newName)) != keccak256(bytes(bm.name)),
				'RecurringPullPaymentWithPaidTrial: NAME_EXISTS'
			);
			bm.name = _newName;
		}

		bm.merchantName = _newMerchantName;
		bm.merchantURL = _newMerchantURL;

		emit BillingModelEdited(_billingModelID, _newPayee, _newName, _newMerchantName, msg.sender);
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
		bm.name = bmDetails.name;
		bm.merchantName = bmDetails.merchantName;
		bm.uniqueReference = bmDetails.uniqueReference;
		bm.amount = bmDetails.amount;
		bm.settlementToken = bmDetails.settlementToken;
		bm.frequency = bmDetails.frequency;
		bm.trialPeriod = bmDetails.trialPeriod;
		bm.initialAmount = bmDetails.initialAmount;
		bm.numberOfPayments = bmDetails.numberOfPayments;
		bm.creationTime = bmDetails.creationTime;
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
	 * @notice Retrieves a billing model with given token as payment token
	 * @param _billingModelID - the ID of the billing model
	 * @param _token 					- the token used for payment
	 * @return bm							- returns the Billing model data struct which contains exact amount to pay in given token.
	 */
	function getBillingModel(uint256 _billingModelID, address _token)
		external
		view
		virtual
		override
		onlyValidBillingModelId(_billingModelID)
		returns (SwappableBillingModel memory bm)
	{
		BillingModel storage bmDetails = _billingModels[_billingModelID];

		address[] memory path = new address[](2);
		path[0] = _token;
		path[1] = bmDetails.settlementToken;

		uint256[] memory amountsIn = IUniswapV2Router02(registry.getUniswapRouter()).getAmountsIn(
			bmDetails.amount,
			path
		);

		bm.payee = bmDetails.payee;
		bm.settlementAmount = bmDetails.amount;
		bm.settlementToken = bmDetails.settlementToken;
		bm.paymentAmount = amountsIn[0];
		bm.paymentToken = _token;
		bm.frequency = bmDetails.frequency;
		bm.trialPeriod = bmDetails.trialPeriod;
		bm.initialAmount = bmDetails.initialAmount;
		bm.numberOfPayments = bmDetails.numberOfPayments;
		bm.creationTime = bmDetails.creationTime;
		bm.merchantName = bmDetails.merchantName;
		bm.uniqueReference = bmDetails.uniqueReference;
		bm.merchantURL = bmDetails.merchantURL;

		return bm;
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

		sb.subscriber = subscription.subscriber;
		sb.amount = bm.amount;
		sb.settlementToken = bm.settlementToken;
		sb.paymentToken = subscription.paymentToken;
		sb.numberOfPayments = subscription.numberOfPayments;
		sb.startTimestamp = subscription.startTimestamp;
		sb.cancelTimestamp = subscription.cancelTimestamp;
		sb.nextPaymentTimestamp = subscription.nextPaymentTimestamp;
		sb.lastPaymentTimestamp = subscription.lastPaymentTimestamp;
		sb.uniqueReference = subscription.uniqueReference;
		sb.cancelledBy = subscription.cancelledBy;

		if (isPaidTrialEnded(_subscriptionID)) {
			sb.isPaidTrialEnded = true;
		} else {
			sb.isPaidTrialEnded = false;
		}

		if (msg.sender == bm.payee || msg.sender == subscription.subscriber) {
			sb.pullPaymentIDs = subscription.pullPaymentIDs;
		} else {
			// Return an empty array for `_subscriptionPullPaymentIDs`in case the caller is not
			// the payee or the subscriber
			uint256[] memory emptyArray;
			sb.pullPaymentIDs = emptyArray;
		}
		sb.billingModelID = bmID;
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
		returns (PullPaymentData memory pullPayment)
	{
		require(
			_pullPaymentID > 0 && _pullPaymentID <= _pullPaymentIDs.current(),
			'RecurringPullPaymentWithPaidTrial: INVALID_PULLPAYMENT_ID'
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

		pullPayment.billingModelID = bmID;
		pullPayment.subscriptionID = _pullPaymentToSubscription[_pullPaymentID];
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
	 * @notice Retrieves canceled subscription ids for an address
	 * @dev Returns an array with the subscription IDs related with that address
	 * @param _subscriber 			- address the pull payment relates to
	 * @return subscriptionIDs 	- contains the list of cancelled subscriptions
	 */
	function getCanceledSubscriptionIdsByAddress(address _subscriber)
		external
		view
		returns (uint256[] memory subscriptionIDs)
	{
		return _inactiveSubscriptionsByAddress[_subscriber];
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
	 *@notice This method tells you whether user`s paid trial is ended or not.
	 *@param _subscriptionID indicates the subscription ID.
	 *@return returns true if trial period ended. otherwise returns false.
	 */
	function isPaidTrialEnded(uint256 _subscriptionID)
		public
		view
		onlyValidSubscriptionId(_subscriptionID)
		returns (bool)
	{
		uint256 bmID = _subscriptionToBillingModel[_subscriptionID];
		BillingModel storage bm = _billingModels[bmID];
		Subscription storage subscription = bm.subscriptions[_subscriptionID];

		if (block.timestamp > (subscription.startTimestamp + bm.trialPeriod)) {
			return true;
		}
		return false;
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
