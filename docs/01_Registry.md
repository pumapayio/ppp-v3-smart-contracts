# Registry Contract

## Introduction
This Registry contract is a central contract which keeps the record of all the contracts in the ecosystem.   
It stores the contract name associated with the contract addresses.   
Anyone can get the addresses of any contract.  
The Registry also stores the configurations for the ecosystem ex. Execution fee, supported tokens, extension period etc.

## Contract version
pragma solidity 0.8.0

## Contract constructor - Initializer
In this contract the `initialize()` method is used in place of the constructor to allow the contract to be upgradable via proxy.

#### Method detail:
The initialize method is used to initialize the Registry contract and transfers the ownership of the registry to the admin who deploys the registry.

#### Method signature:
`function initialize(uint256 _executionFee) external;`

#### Method parameters:
1. **\_executionFee:**:
   Indicates the execution fee percentage. here 1% is equal to 100.

## Contract Methods

### setAddressFor()
#### Method Detail:
This method registers the given contract address with the given name.  
Only the registry owner can register the contract.

#### Method signature:
`function setAddressFor(string calldata identifier, address addr) external override`

#### Method parameters:
1. **\_identifier:**  
   Indicates the  name of the contract in the ecosystem that we want to register.  
   Identifier is specified in the readable string format
2. **\_addr:**  
   Indicates the address of the contract.

#### Returned Data: 
This method does not return any data.

### getAddressForOrDie()
#### Method detail:
This method retrieves the contract's address associated with the given identifier hash.  
If it does not find the contract's address for a given identifier hash, it throws an error.

#### Method signature:
`function getAddressForOrDie(bytes32 _identifierHash) external
override
view
returns (address)`

#### Method parameters:
1. **\_identifierHash:**  
Indicates the contract name in bytes32 format.

#### Returned data:
This method returns the address of the contract associated with the identifier.

### getAddressFor()
#### Method detail:
This method retrieves the contract address for the given identifier hash.  
If it does not get the address for the given identifier, it returns the default zero address.

#### Method signature:
`function getAddressFor(bytes32 _identifierHash) external
override
view
returns (address)`

#### Method parameters:
1.  **\_identifierHash:**  
Indicates the PullPayment contract name in bytes32 format.

#### Returned data:
This method returns the PullPayment contract address if it exists or it returns the zero-address.

### getAddressForStringOrDie()
#### Method detail:
This method returns the contract address for the given contract name.  
It throws an error if it does not find the address for the given contract name.

#### Method signature:
`function getAddressForStringOrDie(string calldata _identifier) external
view
override
returns (address)`

#### Method parameters:
1. **\_identifier:**
- Indicates the PullPayment contract name in string format.

#### Returned data:
This method returns the PullPayment contract address if it exists.

### getAddressForString()
#### Method detail:
This method retrieves the address of the PullPayment contract for a given contract name.
It returns the zero-address if it does not find the contract address associated with the given contract name.

#### Method signature:
`function getAddressForString(string calldata _identifier) external
view
override
returns (address)`

#### Method parameters:
1. **\_identifier:**  
Indicates the name of the PullPayment contract in string format.

#### Returned data:
This method returns the address of the PullPayment contract.

### isOneOf()
#### Method detail:
This method tells you whether the given address is registered in the registry or not.  
We need to provide the list of contract identifier hashes and the sender address whose membership to be verified.

#### Method Signature:
`function isOneOf(bytes32[] calldata identifierHashes, address sender) external
override
view
returns (bool)`

#### Method parameters:
1. **identifierHashes:**  
Indicates the list of contract identifier hashes.
2. **sender:**  
Indicates the contract address.

#### Returned data:
This method returns true if the given address is one of the registered contract otherwise it returns false.

### addToken()

#### Method Detail:
This method allows the contract owner to add new tokens for the PullPayments.  
Only the owner can add the supported tokens.  
This method emits a SupportedTokenAdded event.

#### Method signature
`function addToken(address tokenAddress) external override;`

#### Method parameters:
1. **tokenAddress:**  
Indicates the token contract address which is to add for the PullPayments

#### Returned Data:
This method does not return any data.

### removeToken()
#### Method Detail:
This method allows the contract owner to remove from the list of supported tokens.  
Only the owner can remove the supported tokens.  
This method emits a **SupportedTokenRemoved** event

#### Method signature
`function removeToken(address tokenAddress) external override;`

#### Method parameters:
1. **tokenAddress:** 
Indicates the token contract address which is to be removed.

#### Returned Data:
This method does not return any data.

### updateExecutionFee()
#### Method Detail:  
This method allows the admin to update the execution fee which is used to calculate the amount of PMA tokens to charge for the PullPayment execution.  
This method emits a **UpdatedExecutionFee** event.

#### Method signature
`function updateExecutionFee(uint256 _newFee) public virtual`

#### Method parameters:
1. **\_newFee:**  
Indicates the new execution fee.  
New fee must be less than 10000. i.e 100%  
Here, 100 equals 1%.

#### Returned Data: 
This method does not return any data.

### updateExtensionPeriod()
#### Method Detail:  
This method allows admin to update the extension period duration.  
The extension period is the duration in seconds given to the subscribers in order to top up their account in case of low balance subscription.

#### Method signature
`function updateExtensionPeriod(uint256 _newPeriod) external virtual`

#### Method parameters:
2. **\_newPeriod:**  
Indicates the new extension period in seconds.

#### Returned Data: 
This method does not return any data.

### getSupportedTokens()

#### Method Detail:
This method retrieves the list of supported token addresses.

#### Method signature
`function getSupportedTokens() external override view returns (address[] memory)`

#### Method parameters:
This method does not take any parameters.

#### Returned Data:
This method returns the list of token addresses which supports the PullPayment.

### getPMAToken()
#### Method Detail:
This method returns the address of the PMA token.

#### Method signature
`function getPMAToken() public view virtual returns (address)`

### getWrappedNative()
#### Method Detail:
This method returns the address of the WBNB token.

#### Method signature
`function getWrappedNative() public view virtual returns (address)`

### getExecutor()
#### Method Detail:
This method returns the address of the Executor contract.

#### Method signature
`function getExecutor() public view virtual returns (address)`

### getUniswapFactory()
#### Method Detail:
This method returns the address of the Dex Factory contract.

#### Method signature
`function getUniswapFactory() public view virtual returns (address)`

### getUniswapRouter()
#### Method Detail:
This method returns the address of the Dex Router contract.

#### Method signature
`function getUniswapRouter() public view virtual returns (address)`

### getPullPaymentRegistry()
#### Method Detail:
This method returns the address of the PullPayment Registry contract.

#### Method signature
`function getPullPaymentRegistry() public view virtual returns (address)`

### getKeeperRegistry()
#### Method Detail:
This method returns the address of the Keeper Registry contract.
#### Method signature
`function getKeeperRegistry() public view virtual returns (address)`

### getTokenConverter()
#### Method Detail:
This method returns the address of theToken Converter contract.

#### Method signature
`function getTokenConverter() public view virtual returns (address)`

### executionFee()
#### Method Detail:
Τhis method returns the execution fee percentage.

#### Method signature
`function executionFee() public view returns (uint256)`

### extensionPeriod()
#### Method Detail:
This method returns the extension period value in seconds.

#### Method signature
`function extensionPeriod() public view returns (uint256)`

## Events

### RegistryUpdated
#### Event detail:
This event is emitted when a new contract is registered using the **setAddressFor()** method.

#### Event signature:
`event RegistryUpdated(
string identifier,
bytes32 indexed identifierHash, address indexed addr
);`

#### Event data:

1. **identifier:**  
Indicates the name of the contract.
2. **identifierHash:**  
Indicates the contract name in bytes32 format.
3. **Addr:**  
Indicates the address of the registered  contract.

### SupportedTokenAdded
#### Event detail:
This event is emitted when a supported ERC20/BEP20 token is added in the list using the **addToken()** method

#### Event signature:
`event SupportedTokenAdded(address indexed _token);`

#### Event data:
1. **\_token:**  
Indicates the supported token`s address.

### SupportedTokenRemoved
#### Event detail:
This event is emitted when a supported  ERC20/BEP20 token is removed from the list using the **removeToken()** method

#### Event signature:
`event SupportedTokenRemoved(address indexed _token);`

#### Event data:
1. **\_token:**  
Indicates the supported token`s address.

### UpdatedExecutionFee
#### Event detail:
This event is emitted when the admin updates the execution fee using the **updateExecutionFee** method.

#### Event signature:
`event UpdatedExecutionFee(uint256 indexed _newFee);`

#### Event data:
1. **\_newFee:**  
Indicates the new execution fee.