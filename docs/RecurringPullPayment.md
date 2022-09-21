# Recurring PullPayment Contract

## Introduction

The Recurring PullPayment contract simplifies the recurring payments that customers need to do on a regular interval to avail the services offered by the merchants.

Using the Recurring PullPayment contract any merchant can create a billing model with required configuration for their business and Customers can subscribe to a specific billing model to avail the service.

A typical example is a monthly payment of $5.00 for 12 months.

## Contract version

pragma solidity 0.8.0

## Contract constructor

The Recurring Pullpayment contract`s constructor takes one argument i.e the main registry contract address which is used to access the registry methods.

#### Constructor Signature:

- constructor(address registryAddress) RegistryHelper(registryAddress);

#### Constructor Parameters:

1. **registryAddress:**

- indicates the address of the registry contract which keeps the record of all the contract addresses in the ecosystem and the required configurations.

## Contract Methods

### createBillingModel()

#### Method name:

- createBillingModel

#### Method detail:

- This method allows merchants to create a new billing model for their business.
- The unique Id is created for each billing model.
- Merchant can create as many billing models as he wants.
- The **BillingModelCreated** event is emitted after creating the billing model.

#### Method signature:

- function createBillingModel(
address \_payee,
string memory \_name,
string memory \_merchantName,
string memory \_reference,
string memory \_merchantURL,
uint256 \_amount,
address \_token,
uint256 \_frequency,
uint256 \_numberOfPayments
) external virtual override returns (uint256 billingModelID)

#### Method parameters:

1. **\_payee:**
- Indicates the address of the receiver(merchant) who will receive the pull payments.
2. **\_name:**
- Indicates the name of the billing model. It can be kept empty.
3. **\_merchantName:**
- Indicates the name of the merchant. It can be kept empty.
4. **\_reference:**
- Indicates the unique reference for the billing model.
- If it is not passed externally, then the contract creates the unique reference for the billing model.
5. **\_merchantURL:**
- Indicates the merchant`s personal URL. It can be kept empty.
6. **\_amount:**
- Indicates the amount of settlement tokens that customer wants to get paid for the subscription.
7. **\_token:**
- Indicates the settlement token address in which the merchant wants to get paid in.
8. **\_frequency:**
- Indicates the interval time in seconds after which pullPayment will get executed.
9. **\_numberOfPayments:**
- Indicates the number of pullPayments to execute after a specified interval.

#### Returned data:

- This method returns the unique billing model Id.

### subscribeToBillingModel()

#### Method name:

- subscribeToBillingmodel

#### Method detail:

- This method allows any customer to subscribe to the billing model with a given billing model Id, payment token and the unique reference for subscription.
- When a customer subscribes to the billing model with a given payment token, the first pullPayment is executed immediately.
- The user must approve the payment tokens to the Executor contract before subscribing to the billing model.
- The unique subscription id is created on each subscription.
- This method emits a **NewSubscription** event after subscribing to the billing model.

#### Method signature:

- function subscribeToBillingModel( uint256 \_billingModelID, address \_paymentToken,
string memory \_reference
)
external
virtual
override
nonReentrant
returns (uint256 subscriptionID)

#### Method parameters:

1. **\_billingModelID:**
- Indicates the unique billing model Id that customer wants to subscribe.
2. **\_paymentToken:**
- Indicates the supported payment token address in which the customer wants to pay for the subscription.
3. **\_reference:**
- Indicates the unique reference string for the subscription.
- If not provided externally, the contract generates the unique one for the subscription.

#### Returned data:

- This method returns the unique subscription id after subscription.

### executePullPayment()

#### Method name:

- executePullPayment

#### Method detail:

- This method allows anyone to execute the pullPayment for the given subscription id.
- It ensures pullPayment execution time is correct, subscription is not cancelled and no. of payments are not exceeded.
- Internally this method calls the execute method of the Executor contract to transfer the tokens from customer to merchant.
- It updates the next payment timestamp, number of payments remaining, pullPayment execution timestamp and last payment timestamp.
- The unique pullPayment id is created for each pullPayment and added to the list of pullpayment ids of subscription.
- This method emits the **PullPaymentExecuted** event after executing pullpayment.

#### Method signature:

- function executePullPayment(uint256 \_subscriptionID) public override returns (uint256 pullPaymentID)

#### Method parameters:

1. **\_subscriptionID:**
- Indicates the unique subscription id.

#### Returned data:

- This method returns the unique pullPayment id after pullPayment execution.

### cancelSubscription()

#### Method name:

- cancelSubscription

#### Method detail:

- This method allows subscribers to cancel their subscription to stop the pull payments.
- It updates the cancel timestamp, adds the address of the account who cancelled the subscription and makes the subscription inactive.
- Only the merchant and subscriber can cancel the subscription.
- Subscription gets automatically cancelled after a specific period of time when there are not enough tokens in the subscriber's account for the pullpayment.
- This method emits a **SubscriptionCancelled** event after cancelling the subscription.

#### Method signature:

- function cancelSubscription(uint256 \_subscriptionID) public
virtual
override
returns (uint256 subscriptionID)

#### Method parameters:

1. **\_subscriptionID:**
- Indicates the unique subscription id.

#### Returned data:

- This method returns the id of the cancelled subscription.

### editBillingModel()

#### Method name:

- editBillingModel

#### Method detail:

- This method allows the billing model creator i.e payee to edit the details of the billing model.
- It allows the owner of the billing model to update the billing model name, payee address, merchant name and merchant URL.
- This method emits the **BillingModelEdited** event after updating the billing model details.

#### Method signature:

- function editBillingModel(
uint256 \_billingModelID,
address \_newPayee,
string memory \_newName,
string memory \_newMerchantName,
string memory \_newMerchantURL )
public
virtual
override
returns (uint256 billingModelID)

#### Method parameters:

1. **\_billingModelID:**
- Indicates the unique valid billing model id which the merchant wants to edit.
2. **\_newPayee:**
- Indicates the new payee address for the billing model.
- Merchants cannot set Zero address as payee address.
3. **\_newName:**
- Indicates the new name for the billing model.
4. **\_newMerchantName:**
- Indicates the new merchant name for the billing model. It can be kept empty.
- **\_newMerchantURL:**
- Indicates the new merchant`s personal URL.

#### Returned data:

- This method returns the id of the billing model whose details are updated.

### checkUpkeep()

#### Method name:

- checkUpkeep

#### Method detail:

- This method is used to make the Recurring Pull Payment contract as keeper compatible contract.
- This method is periodically called by the Upkeep network after 1 block interval of time.
- It returns the encoded data which contains a list of subscription ids and their count which needs to be executed through the performUpkeep() method.
- It also returns the boolean value based on which keeper network decides whether to call performUpkeep() method or not.
- The subscription ids included in the list satisfies the criteria of pullpayment execution.

#### Method signature:

- function checkUpkeep(bytes calldata checkData)
external
view
override
returns (bool upkeepNeeded, bytes memory performData)

#### Method parameters:

1. **checkData:**
- This argument is specified in the upkeep registration so it is always the same for a registered upkeep.

#### Returned data:

- This method returns the following values
1. **upkeepNeeded:**
- This boolean value is set to true when there is at least one subscription in the list of subscription ids.
2. **performData:**
- This is the encoded data in the bytes format which contains the list of subscription ids and the count of subscription ids in the list.

### performUpkeep()

#### Method name:

- performUpkeep

#### Method detail:

- This method is used to make the Recurring Pull Payment contract as keeper compatible contract.
- This method is called by the Keeper network when the checkUpkeep() method returns a boolean true value.
- This method executes the pullpayment for the list of subscriptions provided in performData.
- If the subscriber does not have the enough payment tokens in his account to make the pullpayment, then this method adds that subscription in the list of low balance subscriptions which is stored on the PullPaymentRegistry contract.
- The low balance subscription is not considered for the execution until the extension period ends. The Extension period is the duration in seconds which is given to the subscriber to top up their account.
- Once this extension period is passed, the low balance subscription is added again for the execution.
- If the subscriber still doesn't have the enough amount of payment tokens in his account then it cancels the subscription.
- If the subscriber has top up his account during the extension period, then it removes the subscription from the low balance subscription ids and continues the pullpayment.

#### Method signature:

- function performUpkeep(bytes calldata performData) external override

#### Method parameters:

1. **performData:**
- This is the encoded value which contains the list of subscription ids and their count which needs to be executed.
- The value of this performData is returned by the checkUpkeep() method.

#### Returned data:

- This method does not return anything.

### getSubscriptionIds()

#### Method name:

- getSubscriptionIds

#### Method detail:

- This method is used to get the list of subscription ids and their count whose pull payment should be executed.
- It checks every subscription for the pullpayment criteria. it adds the subscription in the list if it satisfies the condition of pullpayment.
- The criteria for adding the subscription in the list is -
- Subscription is not added in the list of low balance subscriptions.
- Subscription is added in the low balance subscription list but has passed the extension period.
- Adheres to pull payment execution criteria. i.e
- Remaining number of payments are not zero
- Subscription is not cancelled
- Next payment time is in the past.
- This returns the subscription ids in batches to avoid the out of gas errors while execution.

#### Method signature:

- function getSubscriptionIds()
public
view
returns (uint256[] memory subscriptionIds, uint256 count)

#### Method parameters:

- N/A

#### Returned data:

- This method returns the-
- List of subscription ids
- Count of subscriptions in the list.

### isPullPayment()

#### Method name:

- isPullPayment

#### Method detail:

- This method tells whether to execute the pullpayment for the given subscription id or not based on the pullpayment execution criteria.
- The pull payment execution criteria is-
  - Remaining number of payments are not zero
  - Subscription is not cancelled
  - Next payment time is in the past.
- Returns true if the subscription passes the execution criteria.

#### Method signature:

- function isPullpayment(uint256 \_subscriptionId) public view returns (bool)

#### Method parameters:

1. **\_subscriptionId:**
- Indicates the subscription id.

#### Returned data:

- This method returns true if if subscription passes the execution criteria otherwise returns false.

### getBillingModel()

#### Method name:

- getBillingModel

#### Method detail:

- This method returns all the details of the specified billing model.
- Only the payee of a particular billing model can get the subscription ids of the billing model.

#### Method signature:

- function getBillingModel(uint256 \_billingModelID) external
view
override
returns (BillingModelData memory bm)

#### Method parameters:

1. **\_billingModelID:**
- Indicates the valid billing model id.

#### Returned data:

- This method returns the details of the billing model which includes the-
- Payee address
- Name of billing model
- Name of the merchant
- The unique reference of billing model
- Merchant`s personal URL
- Amount of settlement tokens to charge for the billing model
- Settlement token address
- Frequency of pullPayments
- Number of PullPayments
- Subscription Ids (returned only for payee)
- The billing model creation time

### getBillingModel()

#### Method name:

- getBillingModel

#### Method detail:

- This method returns the details of the specified billing model.
- User specifies the payment token in which he wants to pay for subscription.
- It tells you the optimal number of payment tokens needed to pay to settle the payment for the billing model.
- It uses the quickswap router to calculate the optimal payment amount for a given payment token.

#### Method signature:

- function getBillingModel(uint256 \_billingModelID, address \_token) external
view
override
returns (SwappableBillingModel memory bm)

#### Method parameters:

1. **\_billingModelID:**
- Indicates the valid billing model id.
2. **\_token:**
- Indicates the supported payment token.

#### Returned data:

- This method returns the details of the billing model which includes the-
- Payee address
- Billing model name
- Name of the Merchant
- The unique reference for billing model
- Merchant`s personal URL
- Settlement token amount
- Settlement token address
- Optimal amount of payment tokens
- Payment token address
- Frequency of pullPayments
- Number of PullPayments
- Billing model creation time

### getSubscription()

#### Method name:

- getSubscription

#### Method detail:

- This method returns the subscription data for a given subscription id.
- Only the payee and subscriber of the billing model can see the pullPayment ids of subscription.

#### Method signature:

- function getSubscription(uint256 \_subscriptionID) external
view
override
returns (SubscriptionData memory sb)

#### Method parameters:

1. **\_subscriptionID:**
- Indicates the valid subscription id

#### Returned data:

- This method returns the subscription data which includes the following data-
- Subscriber address
- Payment amount
- Settlement token address
- Payment token address
- Remaining number of payments
- Start timestamp of subscription
- Cancelled timestamp of subscription
- NextPayment timestamp
- LastPayment timestamp
- PullPayment IDs(only payee or subscriber gets the ids)
- Billing model Id to which subscription belongs
- The unique subscription reference
- The Address of the account who cancelled the subscription.

### getPullPayment()

#### Method name:

- getPullPayment

#### Method detail:

- This method retrieves the pullPayment details for given pullPayment id.
- It gives the payment amount, pullPayment timestamp, billing model id and the subscription id.
- Only the granted executor, payee and the subscriber of pullPayment can see the payment amount and execution timestamp.

#### Method signature:

- function getPullPayment(uint256 \_pullPaymentID) external
view
returns (PullPaymentData memory pullPayment)

#### Method parameters:

1. **\_pullPaymentID:**
- Indicates the valid pullPayment id.

#### Returned data:

- This method returns the pullPayment data for given pullPayment id which includes-
- Payment amount
- Timestamp when pullPayment executed.
- Billing model to which this pullpayment belongs to
- Subscription id to which this pullpayment belongs to

### getBillingModelIdsByAddress()

#### Method name:

- getBillingModelIdsByAddress

#### Method detail:

- This method retrieves the billing model ids for a given creator address.

#### Method signature:

- function getBillingModelIdsByAddress(address \_creator) external
view
returns (uint256[] memory billingModelIDs)

#### Method parameters:

1. **\_creator:**
- Indicates the billing model creator address whose billing model id is to retrieve.

#### Returned data:

- This method returns the lists of billing model ids that a creator has created.

### getSubscriptionIdsByAddress()

#### Method name:

- getSubscriptionIdsByAddress

#### Method detail:

- This method retrieves the subscription ids for a given subscriber address.

#### Method signature:

- function getSubscriptionIdsByAddress(address \_subscriber) external
view
returns (uint256[] memory subscriptionIDs)

#### Method parameters:

1. **\_subscriber:**
- Indicates the subscriber address whose subscription id is to retrieve.

#### Returned data:

- This method returns the lists of subscription ids that a subscriber has subscribed.

### getCanceledSubscriptionIdsByAddress()

#### Method name:

- getCanceledSubscriptionIdsByAddress

#### Method detail:

- This method retrieves the subscription ids which the subscriber has cancelled.

#### Method signature:

- function getCanceledSubscriptionIdsByAddress(address \_subscriber) external
view
returns (uint256[] memory subscriptionIDs)

#### Method parameters:

1. **\_subscriber:**
- Indicates the subscriber address whose cancelled subscription ids to be retrieved.

#### Returned data:

- This method returns the list of subscription ids which the subscriber has cancelled.

### getPullPaymentsIdsByAddress()

#### Method name:

- getPullPaymentsIdsByAddress

#### Method detail:

- This method retrieves the list  of pullPayment ids for a given subscriber.

#### Method signature:

- function getPullPaymentsIdsByAddress(address \_subscriber) external
view
returns (uint256[] memory pullPaymentIDs)

#### Method parameters:

1. **\_subscriber:**
- Indicates the subscriber address whose pullPayment ids to be retrieved.

#### Returned data:

- This method returns a list of pullPayment ids for a given subscriber.

### getCurrentBillingModelId()

#### Method name:

- getCurrentBillingModelId

#### Method detail:

- This method returns the current billing model id of the pullpayment

#### Method signature:

- function getCurrentBillingModelId() external view virtual returns (uint256);

#### Returned data:

- This method returns the current billing model id.

### getCurrentSubscriptionId()

#### Method name:

- getCurrentSubscriptionId

#### Method detail:

- This method returns the current subscription id of the pullpayment

#### Method signature:

- function getCurrentSubscriptionId() external view virtual returns (uint256);

#### Returned data:

- This method returns the current subscription id.

### getCurrentPullPaymentId()

#### Method name:

- getCurrentPullPaymentId

#### Method detail:

- This method returns the current id of the pullpayment

#### Method signature:

- function getCurrentPullPaymentId() external view virtual returns (uint256);

#### Returned data:

- This method returns the current pullpayment id.

## Events

### BillingModelCreated

#### Event Name:

- BillingModelCreated

#### Event detail:

- This event is emitted when the creator creates a new billing model using **createBillingModel()** method.

#### Event signature:

event BillingModelCreated(
uint256 indexed billingModelID, address indexed payee
); 

#### Event data:

1. **billingModelID:**
- Indicates the newly created billing model id.
2. **Payee:**
- Indicates the payee address who created the billing model.

### NewSubscription

#### Event Name:

- NewSubscription

#### Event detail:

- This event is emitted when a subscriber subscribes to the billing model using **subscribeBillingModel()** method.

#### Event signature:

event NewSubscription(
uint256 indexed billingModelID,
uint256 indexed subscriptionID, address payee,
address payer
); 

#### Event data:

1. **billingModelID:**
- Indicates the valid billing model id that subscriber has subscribed to.
2. **subscriptionID:**
- Indicates the subscription id when a subscriber subscribes to a given billing model.
3. **Payee:**
- Indicates the address of the merchant.
4. **payer:**
- Indicates the subscriber address who subscribed to the billing model.

### PullPaymentExecuted

#### Event Name:

- PullPaymentExecuted

#### Event detail:

- This event is emitted when the pullPayment is executed for a given subscription.
- This event is emitted inside the **executePullPayment()** method.

#### Event signature:

- event PullPaymentExecuted( uint256 indexed subscriptionID, uint256 indexed pullPaymentID, uint256 indexed billingModelID, address payee,
address payer,
uint256 executionFee,
uint256 userAmount,
uint256 receiverAmount
);

#### Event data:

1. **subscriptionID:**
- Indicates the subscription id whose pullPayment is executed.
2. **pullPaymentID:**
- Indicates the id of executed pullPayment.
3. **billingModelID:**
- Indicates the billing model id for which pullPayment is executed.
4. **payee:**
- Indicates the merchant address
5. **payer:**
- Indicates the subscriber address who paid for the subscription.
6. **executionFee:**
- Indicates the execution fee charged in PMA token.
7. **userAmount:**
- Indicates the amount of payment tokens that subscriber paid for the subscription
8. **receiverAmount:**
- Indicates the amount of settlement tokens that merchant received.

### SubscriptionCancelled

#### Event Name:

- SubscriptionCancelled

#### Event detail:

- This event is emitted when a subscriber cancels the subscription using **cancelSubscription()** method or due to the low balance in subscriber`s account.

#### Event signature:

event SubscriptionCancelled(
uint256 indexed billingModelID, uint256 indexed subscriptionID, address payee,
address payer
); 

#### Event data:

1. **billingModelID:**
- Indicates the billing model id to which cancelled subscription belongs.
2. **subscriptionID:**
- Indicates the cancelled subscription id.
3. **payee:**
- Indicates the merchant address
4. **payer:**
- Indicates the subscriber address whose subscription is cancelled.

### BillingModelEdited

#### Event Name:

- BillingModelEdited

#### Event detail:

- This event is emitted when the billing model is edited using the **editBillingModel()** method.

#### Event signature:

- event BillingModelEdited( uint256 indexed billingModelID, address indexed newPayee, string indexed newName,
string newMerchantName, address oldPayee,
string newMerchantUrl
);

#### Event data:

1. **billingModelID:**
- Indicates the edited billing model id.
2. **newPayee:**
- Indicates the updated payee address.
3. **newName:**
- Indicates the updated billing model name.
4. **newMerchantName:**
- Indicates the updated merchant`s name.
5. **oldPayee:**
- Indicates the payee address who edited the billing model.
6. **newMerchantUrl:**
- Indicates the merchant`s new personal URL.

## Flow of Execution:

1. First merchant creates the billing model with required configuration for his business.
1. Subscriber should approve the unlimited payment tokens to the Executor contract before subscribing to the billing model.
1. Executor is the contract which gets the tokens from the subscriber, swaps the payment token to the settlement token and then transfers the settlement tokens to the payee.
1. Subscriber subscribes the required billing model with payment token that he wants to pay in to avail the services offered by the merchant.
1. When a Subscriber subscribes to the billing model, the first pullPayment is executed immediately.
1. After the first pullPayment, The next pullPayment is executed after the fixed interval specified in the billing model.
1. The pullPayments are executed until the subscriber cancels the subscription, the subscriber has enough tokens in his account or the total number of pullPayments gets completed.
1. Users can cancel the subscription if they don't want to continue the service offered by the merchant.
1. Merchants can edit the billing model name and payee address if they want.

## Flow of Execution with Chainlink Keepers:

1. First merchant creates the billing model with required configuration for his business.
1. Subscriber approves the enough payment tokens to Executor contract if not approved already.
1. Subscriber subscribes the billing model
1. First pullpayment is executed at the time of subscription
1. Keeper Nodes continuously calls the checkUpkeep() method to know whether there are pullpayments to execute or not.
1. If there are subscriptions in the list returned by checkUpkeep(), Keeper node calls the perfornUpkeep() method with the performData returned by checkUpkeep().
1. Perform upkeep executes pull payment for each of the subscriptions specified in the list.
1. If any subscriber does not have the enough amount of payment tokens in his wallet, then that subscirption is added to the low balance subscriptions list
1. This low balance subscription is again considered for the execution only after the extension period.
1. After the extension period, if the subscriber still does not have enough tokens then it cancels the subscription.
1. If a subscriber has added the tokens to his account during the extension period then the subscription is removed from the low balance subscriptions list and pullpayment is executed normally.