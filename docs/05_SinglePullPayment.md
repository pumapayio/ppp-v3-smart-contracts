# Single PullPayment Contract

## Introduction

The Single PullPayment contract simplifies the one time payment for the businesses. Using the Single PullPayment contract any merchant can create the billing model with required configuration for their business to simplify the payment. Customers can subscribe to the billing model to make the one time payments for the service.

## Contract version

pragma solidity 0.8.0

## Contract constructor

The Single PullPayment contract`s constructor takes one argument i.e the main registry contract address which is used to access the registry methods.

#### Constructor Signature:

- constructor(address registryAddress) RegistryHelper(registryAddress);

#### Constructor Parameters:

1. **registryAddress:**

- indicates the address of the registry contract which keeps the record of all the contract addresses in the ecosystem and the required configurations.

## Contract Methods

### createBillingModel()

#### Method detail:

- This method allows merchants to create a new billing model for their business with required configurations.
- The unique Id is created for each billing model.
- Merchant can create as many billing models as he wants.
- Creator needs to specify the payee address, name of billing model, merchant name, billing model reference, merchant url, amount to charge and the token address in which amount should be transferred.
- The unique reference is generated if external reference is not given.
- This method emits **BillingModelCreated** event after successfully creating billing model

#### Method signature:
```solidity
function createBillingModel(
    address _payee,
    string memory _name,
    string memory _merchantName,
    string memory _reference,
    string memory _merchantURL,
    uint256 _amount,
    address _token
) external virtual override returns (uint256 billingModelID)
```

#### Method parameters:

1. **\_payee:**  
Indicates the address of the receiver(merchant) who will receive the pull payments.
2. **\_name:**  
**a.** Indicates the name for a billing model that can be injected from the creator of the billing model for any future reference. It can be empty.
3. **\_merchantName:**  
Indicates the name of the merchant. It can be empty.
4. **\_reference:**  
Indicates the unique reference for the billing model.
The Unique reference is generated if external reference is not given.
5. **\_merchantURL:**  
Indicates the merchant`s personal url.
6. **\_amount:**  
Indicates the amount of settlement tokens that customer needs to pay to the merchant.
7. **\_token:**  
Indicates the settlement token address in which the merchant wants to get paid in.

#### Returned data:
This method returns the unique billing model Id.

### subscribeToBillingModel()

#### Method detail:
- This method allows any customer to subscribe to the billing model with a given billing model Id, supported payment token address and optional unique reference for subscription.
- The user must approve the payment tokens to the Executor contract before subscribing to the billing model if not approved.
- The unique subscription id and PullPayment id is created on each subscription.
- The unique subscription reference is created if external reference is not given.
- When a customer subscribes to the billing model with a given payment token, Immediately the direct PullPayment is executed with the help of the Executor contract.
- This method emits the **NewSubscription** event after subscription.

#### Method signature:

```solidity
function subscribeToBillingModel(
    uint256 _billingModelID,
    address _paymentToken,
    string memory _reference
) public override returns (uint256 subscriptionID)
```

#### Method parameters:

1. **\_billingModelID:**  
Indicates the unique billing model Id that customer wants to subscribe.
2. **\_paymentToken:**  
Indicates the payment token address in which the customer wants to pay for the subscription.
3. **\_reference:**  
Indicates the unique reference for the subscription.  
Contract generates the unique reference for the subscription if external reference is not given.

#### Returned data:

- This method returns the unique subscription id after subscription.

### editBillingModel()

#### Method detail:
- This method Allows merchants to edit their billing models.
- Editing a billing model allows the creator of the billing model to update only attributes that do not affect the billing cycle of the customer, i.e. the name and the payee address etc.
- It allows the payee to update some of the details of the billing model i.e name, payee address, amount, settlement token address, merchant name and merchant url.
- This method emits the **BillingModelEdited** event after editing the billing model.

#### Method signature:

```solidity
function editBillingModel(
    uint256 _billingModelID,
    address _newPayee,
    string memory _newName,
    uint256 _newAmount,
    address _newSettlementToken,
    string memory _newMerchantName,
    string memory _newMerchantURL
) external virtual override returns (uint256 billingModelID);
```

#### Method parameters:
1. **\_billingModelID:**  
Indicates the unique valid billing model id which the merchant wants to edit.
2. **\_newPayee:**  
Indicates the new payee address for the billing model.  
Merchants cannot set Zero address as payee address.
3. **\_newName:**  
Indicates the new name for the billing model. Can be kept empty.
4. **\_newAmount:**  
Indicates the new amount for the billing model.
5. **\_newSettlementToken:**    
Indicates the new supported settlement token address.
6. **\_newMerchantName:**    
Indicates the new merchant name. Can be kept empty.
7. **\_newMerchantURL:**  
Indicates the new merchant url. Can be kept empty.

#### Returned data:
This method returns the id of the billing model whose details are updated.

### getBillingModel()

#### Method detail:
This method retrieves all the details of the specified billing model.  
Only the payee of a particular billing model can get the subscription ids of the billing model.

#### Method signature:

```solidity
function getBillingModel(uint256 _billingModelID) external
view
override
returns (BillingModelData memory bm)
```

#### Method parameters:

1. **\_billingModelID:**
Indicates the valid billing model id.

#### Returned data:
- This method returns the details of the billing model which includes the-
- Payee address
- Name of billing model
- Name of the merchant
- Then unique reference of billing model
- Amount of billing model
- Settlement token address
- Subscription Ids (only payee can retrieve)
- Billing model creation time.

### getBillingModel()

#### Method detail:

- This method returns the details of the specified billing model.
- User specifies the payment token in which he wants to pay for subscription.
- It tells you the optimal number of payment tokens needed to pay to settle the payment for the billing model.
- It uses the QuickSwap router to calculate the optimal payment amount for a given payment token.

#### Method signature:

```solidity
function getBillingModel(uint256 _billingModelID, address _token) external
view
override
returns (SwappableBillingModel memory bm)
```

#### Method parameters:

1. **\_billingModelID:**  
Indicates the valid billing model id.
2. **\_token:**  
Indicates the supported payment token.

#### Returned data:

- This method returns the details of the billing model which includes the-
- Payee address
- Name of the billing model
- Merchant name
- Unique reference of billing model
- Merchant URL
- Settlement token amount
- Settlement token address
- Optimal amount of payment tokens
- Payment token address
- Billing model creation time


### getSubscription()

#### Method detail:

- This method returns the subscription data for a given subscription id.
- Only the payee and subscriber of the billing model can see the PullPayment ids of subscription.

#### Method signature:

```solidity
function getSubscription(uint256 _subscriptionID) external
view
override
returns (SubscriptionData memory sb)
```

#### Method parameters:

1. **\_subscriptionID:**
- Indicates the valid subscription id

#### Returned data:

- This method returns the subscription data which includes the following data-
- Subscriber address
- Payment amount
- Settlement token address
- Payment token address
- PullPayment IDs(only payee or subscriber gets the ids)
- Billing model id
- Unique reference of subscription.

### getPullPayment()

#### Method detail:

- This method retrieves the PullPayment details for given PullPayment id.
- Only the payee and the subscriber of PullPayment can see the payment amount and execution timestamp.

#### Method signature:

```solidity
function getPullPayment(uint256 _PullPaymentID) external
view
returns (PullPaymentData memory PullPayment)
```

#### Method parameters:

1. **\_PullPaymentID:**  
Indicates the valid PullPayment id.

#### Returned data:
- This method returns the PullPayment data for given PullPayment id which includes-
- Payment amount
- Timestamp when PullPayment executed.
- Billing model id
- Subscription id

### getBillingModelIdsByAddress()

#### Method detail:
This method retrieves the billing model ids for a given creator address.

#### Method signature:

```solidity
function getBillingModelIdsByAddress(address _creator) external
view
returns (uint256[] memory billingModelIDs)
```

#### Method parameters:

1. **\_creator:**  
Indicates the billing model creator address whose billing model id is to retrieve.

#### Returned data:

- This method returns the lists of billing model ids that a creator has created.

### getSubscriptionIdsByAddress()

#### Method detail:

This method retrieves the subscription ids for a given subscriber address.

#### Method signature:

```solidity
function getSubscriptionIdsByAddress(address _subscriber) external
view
returns (uint256[] memory subscriptionIDs)
```

#### Method parameters:

1. **\_subscriber:**  
Indicates the subscriber address whose subscription id is to retrieve.

#### Returned data:

This method returns the lists of subscription ids that a subscriber has subscribed.

### getPullPaymentsIdsByAddress()

#### Method detail:
This method retrieves the list  of PullPayment ids for a given subscriber.

#### Method signature:

```solidity
function getPullPaymentsIdsByAddress(address _subscriber) external
view
returns (uint256[] memory PullPaymentIDs)
```

#### Method parameters:

1. **\_subscriber:**  
Indicates the subscriber address whose PullPayment ids to be retrieved.

#### Returned data:
This method returns a list of PullPayment ids for a given subscriber.

### getCurrentBillingModelId()

#### Method detail:
This method returns the current billing model id of the PullPayment

#### Method signature:

```solidity
function getCurrentBillingModelId() external view virtual returns (uint256);
```

#### Returned data:

- This method returns the current billing model id.

### getCurrentSubscriptionId()

#### Method detail:

This method returns the current subscription id of the PullPayment

#### Method signature:
```solidity
function getCurrentSubscriptionId() external view virtual returns (uint256);
```

#### Returned data:
This method returns the current subscription id.

### getCurrentPullPaymentId()

#### Method detail:

This method returns the current id of the PullPayment

#### Method signature:

```solidity
function getCurrentPullPaymentId() external view virtual returns (uint256);
```

#### Returned data:
This method returns the current PullPayment id.

## Events

### BillingModelCreated

#### Event detail:

This event is emitted when the creator creates a new billing model using **createBillingModel()** method.

#### Event signature:

```solidity
event BillingModelCreated(
uint256 indexed billingModelID, address indexed payee
); #### Event data:
```

1. **billingModelID:**  
Indicates the newly created billing model id.
2. **Payee:**  
Indicates the payee address who created the billing model.

### NewSubscription

#### Event detail:

This event is emitted when a subscriber subscribes to the billing model using **subscribeBillingModel()** method.

#### Event signature:

```solidity
event NewSubscription(
uint256 indexed billingModelID, uint256 indexed subscriptionID, uint256 indexed PullPaymentID, address payee,
address payer,
uint256 executionFee,
uint256 userAmount,
uint256 receiverAmount
);
```
#### Event data:

1. **billingModelID:**  
Indicates the valid billing model id that subscriber has subscribed to.
2. **subscriptionID:**  
Indicates the subscription id when a subscriber subscribes to a given billing model.
3. **PullPaymentID:**  
Indicates the PullPayment id for the subscription.
4. **payee:**  
Indicates the payee address of  the billing model.
5. **payer:**  
Indicates the subscriber address.
6. **executionFee:**  
Indicates the execution fee charged for executing the PullPayment
7. **userAmount:**  
Indicates the amount of tokens that the user paid for subscription.
8. **receiverAmount:**  
Indicates the amount of tokens that payee receives from the PullPayment.

### BillingModelEdited

#### Event detail:
This event is emitted when the billing model is edited using **editBillingModel()** method.

#### Event signature:

```solidity
event BillingModelEdited( uint256 indexed billingModelID, address indexed newPayee, string indexed newName,
string newMerchantName, uint256 amount,
address settlementToken, address oldPayee,
string newMerchantUrl
);
```

#### Event data:

1. **billingModelID:**  
Indicates the edited billing model id.
2. **newPayee:**  
Indicates the updated payee address.
3. **newName:**  
Indicates the updated billing model name.
4. **newMerchantName:**  
Indicates the new merchant name address.
5. **amount:**  
Indicates the updated amount.
6. **settlementToken:**  
Indicates the settlement token address.
7. **oldPayee:**  
Indicates the payee address who edits the billing model.
8. **newMerchantUrl:**  
Indicates the updated merchant url.

## Flow of Execution:

1. First merchant creates the billing model with required configuration for his business.
1. Subscriber should approve the unlimited payment tokens to the Executor contract before subscribing to the billing model.
1. Executor is the contract which gets the tokens from the subscriber, swaps the payment token to the settlement token, transfers the execution fee to the execution fee receiver and then transfers the settlement tokens to the payee.
1. Subscriber subscribes the required billing model with payment token that he wants to pay in to avail the services offered by the merchant.
1. When a Subscriber subscribes to the billing model, immediately a single PullPayment is executed.
1. Whenever you want to avail the service you subscribe to the billing model and make the single PullPayment.
1. Merchants can edit the billing model details i.e name, settlement token address, amount and payee address etc.