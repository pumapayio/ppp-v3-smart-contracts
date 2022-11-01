# Single Dynamic PullPayment Contract

## Introduction

The Single Dynamic PullPayment contract simplifies the one time payment for the businesses. Using the Single Dynamic PullPayment contract, any merchant can create the billing model with required configuration for their business to simplify the payment. Customers can subscribe to the billing model to make the payments for the service.

In this case, the payment properties (currency, price, name) can be injected straight onto merchant websites and not through the Business Console. The rest of the details of the billing model are provided dynamically through the code-snippet when the customer subscribes to the billing model.

This type of billing model is most suited to merchants who sell tens / hundreds / thousands of products with different descriptions and prices.

## Contract version

```solidity
pragma solidity 0.8.0;
```

## Contract constructor

The Single Dynamic PullPayment contract`s constructor takes one argument i.e the main registry contract address which is used to access the registry methods.

#### Constructor Signature:

```solidity
constructor(address registryAddress) RegistryHelper(registryAddress);
```
#### Constructor Parameters:

1. **registryAddress:**  
indicates the address of the registry contract which keeps the record of all the contract addresses in the ecosystem and the required configurations.

## Contract Methods

### createBillingModel()

#### Method detail:

- This method allows merchants to create a new billing model for their business with required configurations.
- The unique Id is created for each billing model.
- Merchant can create as many billing models as he wants.
- Creator specifies the payee address, merchant name, unique reference and the merchant url for the billing model. Rest of the details(ex. Amount, settlement token, name etc.) are provided by the customer at the time of subscription through the code-snippet.
- This emits the **BillingModelCreated** event after creating a billing model.

#### Method signature:

```solidity
function createBillingModel(
  address _payee,
  string memory _merchantName,
  string memory _reference,
  string memory _merchantURL
  ) public virtual override returns (uint256 billingModelID)
```

#### Method parameters:
1. **\_payee:**  
Indicates the address of the receiver(merchant) who will receive the pull payments.
2. **\_merchantName**:  
Indicates the optional merchant name
3. **\_reference:**  
Indicates the unique reference for the billing model. It can be kept empty.  
If an external unique reference is not given then the contract creates the unique reference for the billing model.
4. **\_merchantURL:**  
Indicates the optional merchant`s personal URL.

#### Returned data:
This method returns the unique billing model Id.

### subscribeToBillingModel()

#### Method detail:

- This method allows any customer to subscribe to the billing model with a given billing model Id, name, settlement token address, payment token address, payment amount and the unique reference for the subscription.
- Here the billing model details i.e billing model name, settlement token and payment amount are provided dynamically through the code snippet.
- The user must approve the payment tokens to the Executor contract before subscribing to the billing model.
- The unique subscription id and PullPayment id is created on each subscription.
- When a customer subscribes to the billing model with a given payment token, Immediately the direct PullPayment is executed with the help of the Executor contract.
- This method emits the **NewSubscription** event.

#### Method signature:

```solidity
function subscribeToBillingModel(
  uint256 _billingModelID,
  bytes32 _name,
  address _settlementToken,
  address _paymentToken,
  uint256 _paymentAmount,
  string memory _reference
  ) public override returns (uint256 subscriptionID)
```

#### Method parameters:
1. **\_billingModelID:**  
Indicates the unique billing model id that the customer wants to subscribe.
2. **\_name:**  
Indicates the optional name for the billing model.
3. **\_settlementToken:**  
Indicate the settlement token address in which the payee wants to receive the payment.
4. **\_paymentToken:**  
Indicates the payment token address in which the customer wants to pay for the subscription.
5. **\_paymentAmount:**  
Indicates the amount to pay for the subscription.
6. **\_reference:**  
Indicates the unique reference for the subscription.
If not provided, the contract creates a unique reference for the subscription.

#### Returned data:
This method returns the unique subscription id after subscription.

### editBillingModel()

#### Method detail:

- This method allows the billing model creator i.e payee to edit the details of the billing model details.
- It allows the payee to update the payee address, merchant name and the merchant url of the billing model.
- Only the owner of the billing model can edit the billing model details.
- This method emits the **BillingModelEdited** event after updating the billing model.

#### Method signature:

```solidity
function editBillingModel(
  uint256 _billingModelID,
  address _newPayee,
  string memory _newMerchantName, 
  string memory _newMerchantURL
  ) public virtual override returns (uint256 billingModelID)
```

#### Method parameters:

1. **\_billingModelID:**  
Indicates the unique valid billing model id which the merchant wants to edit.
2. **\_newPayee:**  
Indicates the new payee address for the billing model.
Merchants cannot use Zero address as payee address.
3. **\_newMerchantName:**  
Indicates the new merchant name for the billing model. It can be kept empty.
4. **\_newMerchantURL:**  
Indicates the updated merchant`s personal URL. It can be kept empty as well.

#### Returned data:
This method returns the id of the billing model whose details are updated.

### getBillingModel()

#### Method detail:
- This method retrieves all the details of the specified billing model.
- Only the payee of a particular billing model can retrieve the subscription ids of the billing model.

#### Method signature:
```solidity
function getBillingModel(uint256 _billingModelID) external
  view
  override
  returns (BillingModelData memory bm)
```

#### Method parameters:

- **\_billingModelID:**  
Indicates the valid billing model id.

#### Returned data:
This method returns the details of the billing model which includes the following:
- Payee address
- Merchant name
- The unique reference of billing model
- Merchant URL
- Subscription Ids (only payee can retrieve)
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
Indicates the valid subscription id

#### Returned data:
This method returns the subscription data which includes the following data:
- Payee address of the billing model
- Subscriber address
- Name of billing model
- Settlement token address
- Payment token address
- PullPayment IDs(only payee or subscriber gets the ids)
- The unique reference of subscription.

### getPullPayment()

#### Method detail:
- This method retrieves the PullPayment details for given PullPayment id.
- It gives the payment amount, the PullPayment timestamp, billing model id and the subscription id of the PullPayment.
- Only the granted executor, payee and the subscriber of PullPayment can see the payment amount and execution timestamp.

#### Method signature:
```solidity
function getPullPayment(uint256 _PullPaymentID) external
  view
  returns (PullPayment memory PullPayment)
```

#### Method parameters:

1. **\_PullPaymentID:**  
Indicates the valid PullPayment id.

#### Returned data:
This method returns the PullPayment data for given PullPayment id which includes:
- Payment amount
- Timestamp when PullPayment executed.
- The billing model id to which PullPayment belongs
- The subscription id to which PullPayment belongs.

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
This method returns the lists of billing model ids that a creator has created.

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
This method retrieves the list of PullPayment ids for a given subscriber.

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
This method returns the current billing model id.

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
);
```

#### Event data:
1. **billingModelID:**  
Indicates the newly created unique billing model id.
2. **Payee:**  
Indicates the payee address which will receive the payment for subscription.

### NewSubscription

#### Event detail:
This event is emitted when a subscriber subscribes to the billing model using **subscribeBillingModel()** method.

#### Event signature:

```solidity
event NewSubscription(
    uint256 indexed billingModelID, 
    uint256 indexed subscriptionID, 
    uint256 indexed PullPaymentID, 
    address payee,
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
Indicates the payee address of the billing model.
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
This event is emitted when the billing model is edited using the **editBillingModel()** method.

#### Event signature:

```solidity
event BillingModelEdited(
    uint256 indexed billingModelID, 
    address indexed newPayee, 
    address indexed oldPayee,
    string newMerchantName, 
    string newMerchantUrl
);
```

#### Event data:

1. **billingModelID:**  
Indicates the edited billing model id.
2. **newPayee:**  
Indicates the updated payee address.
3. **oldPayee:**  
Indicates the old payee address
4. **newMerchantName:**  
Indicates the updated merchant`s name
5. **newMerchantUrl:**  
Indicates the updated merchant`s personal URL.

## Flow of Execution:

1. First merchant creates the billing model with required configuration for his business. Only the basic information(payee address, merchant name, reference and merchant url) of the billing model is stored on the blockchain when the merchant creates the billing model.
1. Subscriber should approve the unlimited payment tokens to the Executor contract before subscribing to the billing model.
1. Subscriber subscribes the required billing model with payment token that he wants to pay in to avail the services offered by the merchant. Also, the remaining details of the billing model(i.e amount, settlement token and the bm name) are provided dynamically from the code-snippet at the time of subscription.
1. When a Subscriber subscribes to the billing model, immediately a single PullPayment is executed.
1. Executor is the contract which gets the tokens from the subscriber, swaps the payment token to the settlement token, transfers the execution fee to the fee receiver and then transfers the settlement tokens to the payee.
1. Whenever you want to avail the service you subscribe to the billing model and make the single PullPayment.
1. Merchants can edit the billing model details i.e payee address, merchant name and merchant url.
