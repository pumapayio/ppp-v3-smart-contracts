// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.0;

// // OpenZeppelin Contracts v4.4.1 (utils/Counters.sol)

// /**
//  * @title Counters
//  * @author Matt Condon (@shrugs)
//  * @dev Provides counters that can only be incremented, decremented or reset. This can be used e.g. to track the number
//  * of elements in a mapping, issuing ERC721 ids, or counting request ids.
//  *
//  * Include with `using Counters for Counters.Counter;`
//  */
// library CountersUpgradeable {
// 	struct Counter {
// 		// This variable should never be directly accessed by users of the library: interactions must be restricted to
// 		// the library's function. As of Solidity v0.5.2, this cannot be enforced, though there is a proposal to add
// 		// this feature: see https://github.com/ethereum/solidity/issues/4637
// 		uint256 _value; // default: 0
// 	}

// 	function current(Counter storage counter) internal view returns (uint256) {
// 		return counter._value;
// 	}

// 	function increment(Counter storage counter) internal {
// 		unchecked {
// 			counter._value += 1;
// 		}
// 	}

// 	function decrement(Counter storage counter) internal {
// 		uint256 value = counter._value;
// 		require(value > 0, 'Counter: decrement overflow');
// 		unchecked {
// 			counter._value = value - 1;
// 		}
// 	}

// 	function reset(Counter storage counter) internal {
// 		counter._value = 0;
// 	}
// }

// // File: @openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol

// // OpenZeppelin Contracts (last updated v4.5.0) (utils/Address.sol)

// pragma solidity ^0.8.1;

// /**
//  * @dev Collection of functions related to the address type
//  */
// library AddressUpgradeable {
// 	/**
// 	 * @dev Returns true if `account` is a contract.
// 	 *
// 	 * [IMPORTANT]
// 	 * ====
// 	 * It is unsafe to assume that an address for which this function returns
// 	 * false is an externally-owned account (EOA) and not a contract.
// 	 *
// 	 * Among others, `isContract` will return false for the following
// 	 * types of addresses:
// 	 *
// 	 *  - an externally-owned account
// 	 *  - a contract in construction
// 	 *  - an address where a contract will be created
// 	 *  - an address where a contract lived, but was destroyed
// 	 * ====
// 	 *
// 	 * [IMPORTANT]
// 	 * ====
// 	 * You shouldn't rely on `isContract` to protect against flash loan attacks!
// 	 *
// 	 * Preventing calls from contracts is highly discouraged. It breaks composability, breaks support for smart wallets
// 	 * like Gnosis Safe, and does not provide security since it can be circumvented by calling from a contract
// 	 * constructor.
// 	 * ====
// 	 */
// 	function isContract(address account) internal view returns (bool) {
// 		// This method relies on extcodesize/address.code.length, which returns 0
// 		// for contracts in construction, since the code is only stored at the end
// 		// of the constructor execution.

// 		return account.code.length > 0;
// 	}

// 	/**
// 	 * @dev Replacement for Solidity's `transfer`: sends `amount` wei to
// 	 * `recipient`, forwarding all available gas and reverting on errors.
// 	 *
// 	 * https://eips.ethereum.org/EIPS/eip-1884[EIP1884] increases the gas cost
// 	 * of certain opcodes, possibly making contracts go over the 2300 gas limit
// 	 * imposed by `transfer`, making them unable to receive funds via
// 	 * `transfer`. {sendValue} removes this limitation.
// 	 *
// 	 * https://diligence.consensys.net/posts/2019/09/stop-using-soliditys-transfer-now/[Learn more].
// 	 *
// 	 * IMPORTANT: because control is transferred to `recipient`, care must be
// 	 * taken to not create reentrancy vulnerabilities. Consider using
// 	 * {ReentrancyGuard} or the
// 	 * https://solidity.readthedocs.io/en/v0.5.11/security-considerations.html#use-the-checks-effects-interactions-pattern[checks-effects-interactions pattern].
// 	 */
// 	function sendValue(address payable recipient, uint256 amount) internal {
// 		require(address(this).balance >= amount, 'Address: insufficient balance');

// 		(bool success, ) = recipient.call{value: amount}('');
// 		require(success, 'Address: unable to send value, recipient may have reverted');
// 	}

// 	/**
// 	 * @dev Performs a Solidity function call using a low level `call`. A
// 	 * plain `call` is an unsafe replacement for a function call: use this
// 	 * function instead.
// 	 *
// 	 * If `target` reverts with a revert reason, it is bubbled up by this
// 	 * function (like regular Solidity function calls).
// 	 *
// 	 * Returns the raw returned data. To convert to the expected return value,
// 	 * use https://solidity.readthedocs.io/en/latest/units-and-global-variables.html?highlight=abi.decode#abi-encoding-and-decoding-functions[`abi.decode`].
// 	 *
// 	 * Requirements:
// 	 *
// 	 * - `target` must be a contract.
// 	 * - calling `target` with `data` must not revert.
// 	 *
// 	 * _Available since v3.1._
// 	 */
// 	function functionCall(address target, bytes memory data) internal returns (bytes memory) {
// 		return functionCall(target, data, 'Address: low-level call failed');
// 	}

// 	/**
// 	 * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`], but with
// 	 * `errorMessage` as a fallback revert reason when `target` reverts.
// 	 *
// 	 * _Available since v3.1._
// 	 */
// 	function functionCall(
// 		address target,
// 		bytes memory data,
// 		string memory errorMessage
// 	) internal returns (bytes memory) {
// 		return functionCallWithValue(target, data, 0, errorMessage);
// 	}

// 	/**
// 	 * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
// 	 * but also transferring `value` wei to `target`.
// 	 *
// 	 * Requirements:
// 	 *
// 	 * - the calling contract must have an ETH balance of at least `value`.
// 	 * - the called Solidity function must be `payable`.
// 	 *
// 	 * _Available since v3.1._
// 	 */
// 	function functionCallWithValue(
// 		address target,
// 		bytes memory data,
// 		uint256 value
// 	) internal returns (bytes memory) {
// 		return functionCallWithValue(target, data, value, 'Address: low-level call with value failed');
// 	}

// 	/**
// 	 * @dev Same as {xref-Address-functionCallWithValue-address-bytes-uint256-}[`functionCallWithValue`], but
// 	 * with `errorMessage` as a fallback revert reason when `target` reverts.
// 	 *
// 	 * _Available since v3.1._
// 	 */
// 	function functionCallWithValue(
// 		address target,
// 		bytes memory data,
// 		uint256 value,
// 		string memory errorMessage
// 	) internal returns (bytes memory) {
// 		require(address(this).balance >= value, 'Address: insufficient balance for call');
// 		require(isContract(target), 'Address: call to non-contract');

// 		(bool success, bytes memory returndata) = target.call{value: value}(data);
// 		return verifyCallResult(success, returndata, errorMessage);
// 	}

// 	/**
// 	 * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
// 	 * but performing a static call.
// 	 *
// 	 * _Available since v3.3._
// 	 */
// 	function functionStaticCall(address target, bytes memory data)
// 		internal
// 		view
// 		returns (bytes memory)
// 	{
// 		return functionStaticCall(target, data, 'Address: low-level static call failed');
// 	}

// 	/**
// 	 * @dev Same as {xref-Address-functionCall-address-bytes-string-}[`functionCall`],
// 	 * but performing a static call.
// 	 *
// 	 * _Available since v3.3._
// 	 */
// 	function functionStaticCall(
// 		address target,
// 		bytes memory data,
// 		string memory errorMessage
// 	) internal view returns (bytes memory) {
// 		require(isContract(target), 'Address: static call to non-contract');

// 		(bool success, bytes memory returndata) = target.staticcall(data);
// 		return verifyCallResult(success, returndata, errorMessage);
// 	}

// 	/**
// 	 * @dev Tool to verifies that a low level call was successful, and revert if it wasn't, either by bubbling the
// 	 * revert reason using the provided one.
// 	 *
// 	 * _Available since v4.3._
// 	 */
// 	function verifyCallResult(
// 		bool success,
// 		bytes memory returndata,
// 		string memory errorMessage
// 	) internal pure returns (bytes memory) {
// 		if (success) {
// 			return returndata;
// 		} else {
// 			// Look for revert reason and bubble it up if present
// 			if (returndata.length > 0) {
// 				// The easiest way to bubble the revert reason is using memory via assembly

// 				assembly {
// 					let returndata_size := mload(returndata)
// 					revert(add(32, returndata), returndata_size)
// 				}
// 			} else {
// 				revert(errorMessage);
// 			}
// 		}
// 	}
// }

// // File: @openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol

// // OpenZeppelin Contracts (last updated v4.5.0) (proxy/utils/Initializable.sol)

// /**
//  * @dev This is a base contract to aid in writing upgradeable contracts, or any kind of contract that will be deployed
//  * behind a proxy. Since proxied contracts do not make use of a constructor, it's common to move constructor logic to an
//  * external initializer function, usually called `initialize`. It then becomes necessary to protect this initializer
//  * function so it can only be called once. The {initializer} modifier provided by this contract will have this effect.
//  *
//  * TIP: To avoid leaving the proxy in an uninitialized state, the initializer function should be called as early as
//  * possible by providing the encoded function call as the `_data` argument to {ERC1967Proxy-constructor}.
//  *
//  * CAUTION: When used with inheritance, manual care must be taken to not invoke a parent initializer twice, or to ensure
//  * that all initializers are idempotent. This is not verified automatically as constructors are by Solidity.
//  *
//  * [CAUTION]
//  * ====
//  * Avoid leaving a contract uninitialized.
//  *
//  * An uninitialized contract can be taken over by an attacker. This applies to both a proxy and its implementation
//  * contract, which may impact the proxy. To initialize the implementation contract, you can either invoke the
//  * initializer manually, or you can include a constructor to automatically mark it as initialized when it is deployed:
//  *
//  * [.hljs-theme-light.nopadding]
//  * ```
//  * /// @custom:oz-upgrades-unsafe-allow constructor
//  * constructor() initializer {}
//  * ```
//  * ====
//  */
// abstract contract Initializable {
// 	/**
// 	 * @dev Indicates that the contract has been initialized.
// 	 */
// 	bool private _initialized;

// 	/**
// 	 * @dev Indicates that the contract is in the process of being initialized.
// 	 */
// 	bool private _initializing;

// 	/**
// 	 * @dev Modifier to protect an initializer function from being invoked twice.
// 	 */
// 	modifier initializer() {
// 		// If the contract is initializing we ignore whether _initialized is set in order to support multiple
// 		// inheritance patterns, but we only do this in the context of a constructor, because in other contexts the
// 		// contract may have been reentered.
// 		require(
// 			_initializing ? _isConstructor() : !_initialized,
// 			'Initializable: contract is already initialized'
// 		);

// 		bool isTopLevelCall = !_initializing;
// 		if (isTopLevelCall) {
// 			_initializing = true;
// 			_initialized = true;
// 		}

// 		_;

// 		if (isTopLevelCall) {
// 			_initializing = false;
// 		}
// 	}

// 	/**
// 	 * @dev Modifier to protect an initialization function so that it can only be invoked by functions with the
// 	 * {initializer} modifier, directly or indirectly.
// 	 */
// 	modifier onlyInitializing() {
// 		require(_initializing, 'Initializable: contract is not initializing');
// 		_;
// 	}

// 	function _isConstructor() private view returns (bool) {
// 		return !AddressUpgradeable.isContract(address(this));
// 	}
// }

// // File: @openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol

// // OpenZeppelin Contracts v4.4.1 (security/ReentrancyGuard.sol)

// /**
//  * @dev Contract module that helps prevent reentrant calls to a function.
//  *
//  * Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
//  * available, which can be applied to functions to make sure there are no nested
//  * (reentrant) calls to them.
//  *
//  * Note that because there is a single `nonReentrant` guard, functions marked as
//  * `nonReentrant` may not call one another. This can be worked around by making
//  * those functions `private`, and then adding `external` `nonReentrant` entry
//  * points to them.
//  *
//  * TIP: If you would like to learn more about reentrancy and alternative ways
//  * to protect against it, check out our blog post
//  * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
//  */
// abstract contract ReentrancyGuardUpgradeable is Initializable {
// 	// Booleans are more expensive than uint256 or any type that takes up a full
// 	// word because each write operation emits an extra SLOAD to first read the
// 	// slot's contents, replace the bits taken up by the boolean, and then write
// 	// back. This is the compiler's defense against contract upgrades and
// 	// pointer aliasing, and it cannot be disabled.

// 	// The values being non-zero value makes deployment a bit more expensive,
// 	// but in exchange the refund on every call to nonReentrant will be lower in
// 	// amount. Since refunds are capped to a percentage of the total
// 	// transaction's gas, it is best to keep them low in cases like this one, to
// 	// increase the likelihood of the full refund coming into effect.
// 	uint256 private constant _NOT_ENTERED = 1;
// 	uint256 private constant _ENTERED = 2;

// 	uint256 private _status;

// 	function __ReentrancyGuard_init() internal onlyInitializing {
// 		__ReentrancyGuard_init_unchained();
// 	}

// 	function __ReentrancyGuard_init_unchained() internal onlyInitializing {
// 		_status = _NOT_ENTERED;
// 	}

// 	/**
// 	 * @dev Prevents a contract from calling itself, directly or indirectly.
// 	 * Calling a `nonReentrant` function from another `nonReentrant`
// 	 * function is not supported. It is possible to prevent this from happening
// 	 * by making the `nonReentrant` function external, and making it call a
// 	 * `private` function that does the actual work.
// 	 */
// 	modifier nonReentrant() {
// 		// On the first call to nonReentrant, _notEntered will be true
// 		require(_status != _ENTERED, 'ReentrancyGuard: reentrant call');

// 		// Any calls to nonReentrant after this point will fail
// 		_status = _ENTERED;

// 		_;

// 		// By storing the original value once again, a refund is triggered (see
// 		// https://eips.ethereum.org/EIPS/eip-2200)
// 		_status = _NOT_ENTERED;
// 	}

// 	/**
// 	 * @dev This empty reserved space is put in place to allow future versions to add new
// 	 * variables without shifting down storage in the inheritance chain.
// 	 * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
// 	 */
// 	uint256[49] private __gap;
// }

// // File: @openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol

// // OpenZeppelin Contracts v4.4.1 (utils/Strings.sol)

// /**
//  * @dev String operations.
//  */
// library StringsUpgradeable {
// 	bytes16 private constant _HEX_SYMBOLS = '0123456789abcdef';

// 	/**
// 	 * @dev Converts a `uint256` to its ASCII `string` decimal representation.
// 	 */
// 	function toString(uint256 value) internal pure returns (string memory) {
// 		// Inspired by OraclizeAPI's implementation - MIT licence
// 		// https://github.com/oraclize/ethereum-api/blob/b42146b063c7d6ee1358846c198246239e9360e8/oraclizeAPI_0.4.25.sol

// 		if (value == 0) {
// 			return '0';
// 		}
// 		uint256 temp = value;
// 		uint256 digits;
// 		while (temp != 0) {
// 			digits++;
// 			temp /= 10;
// 		}
// 		bytes memory buffer = new bytes(digits);
// 		while (value != 0) {
// 			digits -= 1;
// 			buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
// 			value /= 10;
// 		}
// 		return string(buffer);
// 	}

// 	/**
// 	 * @dev Converts a `uint256` to its ASCII `string` hexadecimal representation.
// 	 */
// 	function toHexString(uint256 value) internal pure returns (string memory) {
// 		if (value == 0) {
// 			return '0x00';
// 		}
// 		uint256 temp = value;
// 		uint256 length = 0;
// 		while (temp != 0) {
// 			length++;
// 			temp >>= 8;
// 		}
// 		return toHexString(value, length);
// 	}

// 	/**
// 	 * @dev Converts a `uint256` to its ASCII `string` hexadecimal representation with fixed length.
// 	 */
// 	function toHexString(uint256 value, uint256 length) internal pure returns (string memory) {
// 		bytes memory buffer = new bytes(2 * length + 2);
// 		buffer[0] = '0';
// 		buffer[1] = 'x';
// 		for (uint256 i = 2 * length + 1; i > 1; --i) {
// 			buffer[i] = _HEX_SYMBOLS[value & 0xf];
// 			value >>= 4;
// 		}
// 		require(value == 0, 'Strings: hex length insufficient');
// 		return string(buffer);
// 	}
// }

// // File: @openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol

// // OpenZeppelin Contracts v4.4.1 (utils/Context.sol)

// /**
//  * @dev Provides information about the current execution context, including the
//  * sender of the transaction and its data. While these are generally available
//  * via msg.sender and msg.data, they should not be accessed in such a direct
//  * manner, since when dealing with meta-transactions the account sending and
//  * paying for execution may not be the actual sender (as far as an application
//  * is concerned).
//  *
//  * This contract is only required for intermediate, library-like contracts.
//  */
// abstract contract ContextUpgradeable is Initializable {
// 	function __Context_init() internal onlyInitializing {}

// 	function __Context_init_unchained() internal onlyInitializing {}

// 	function _msgSender() internal view virtual returns (address) {
// 		return msg.sender;
// 	}

// 	function _msgData() internal view virtual returns (bytes calldata) {
// 		return msg.data;
// 	}

// 	/**
// 	 * @dev This empty reserved space is put in place to allow future versions to add new
// 	 * variables without shifting down storage in the inheritance chain.
// 	 * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
// 	 */
// 	uint256[50] private __gap;
// }

// // File: @openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol

// // OpenZeppelin Contracts v4.4.1 (access/Ownable.sol)

// /**
//  * @dev Contract module which provides a basic access control mechanism, where
//  * there is an account (an owner) that can be granted exclusive access to
//  * specific functions.
//  *
//  * By default, the owner account will be the one that deploys the contract. This
//  * can later be changed with {transferOwnership}.
//  *
//  * This module is used through inheritance. It will make available the modifier
//  * `onlyOwner`, which can be applied to your functions to restrict their use to
//  * the owner.
//  */
// abstract contract OwnableUpgradeable is Initializable, ContextUpgradeable {
// 	address private _owner;

// 	event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

// 	/**
// 	 * @dev Initializes the contract setting the deployer as the initial owner.
// 	 */
// 	function __Ownable_init() internal onlyInitializing {
// 		__Ownable_init_unchained();
// 	}

// 	function __Ownable_init_unchained() internal onlyInitializing {
// 		_transferOwnership(_msgSender());
// 	}

// 	/**
// 	 * @dev Returns the address of the current owner.
// 	 */
// 	function owner() public view virtual returns (address) {
// 		return _owner;
// 	}

// 	/**
// 	 * @dev Throws if called by any account other than the owner.
// 	 */
// 	modifier onlyOwner() {
// 		require(owner() == _msgSender(), 'Ownable: caller is not the owner');
// 		_;
// 	}

// 	/**
// 	 * @dev Leaves the contract without owner. It will not be possible to call
// 	 * `onlyOwner` functions anymore. Can only be called by the current owner.
// 	 *
// 	 * NOTE: Renouncing ownership will leave the contract without an owner,
// 	 * thereby removing any functionality that is only available to the owner.
// 	 */
// 	function renounceOwnership() public virtual onlyOwner {
// 		_transferOwnership(address(0));
// 	}

// 	/**
// 	 * @dev Transfers ownership of the contract to a new account (`newOwner`).
// 	 * Can only be called by the current owner.
// 	 */
// 	function transferOwnership(address newOwner) public virtual onlyOwner {
// 		require(newOwner != address(0), 'Ownable: new owner is the zero address');
// 		_transferOwnership(newOwner);
// 	}

// 	/**
// 	 * @dev Transfers ownership of the contract to a new account (`newOwner`).
// 	 * Internal function without access restriction.
// 	 */
// 	function _transferOwnership(address newOwner) internal virtual {
// 		address oldOwner = _owner;
// 		_owner = newOwner;
// 		emit OwnershipTransferred(oldOwner, newOwner);
// 	}

// 	/**
// 	 * @dev This empty reserved space is put in place to allow future versions to add new
// 	 * variables without shifting down storage in the inheritance chain.
// 	 * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
// 	 */
// 	uint256[49] private __gap;
// }

// // File: contracts/common/interfaces/ICoreRegistry.sol

// interface ICoreRegistry {
// 	function setAddressFor(string calldata, address) external;

// 	function getAddressForOrDie(bytes32) external view returns (address);

// 	function getAddressFor(bytes32) external view returns (address);

// 	function isOneOf(bytes32[] calldata, address) external view returns (bool);
// }

// // File: contracts/common/interfaces/IPullPaymentConfig.sol

// interface IPullPaymentConfig {
// 	function getSupportedTokens() external view returns (address[] memory);

// 	function isSupportedToken(address _tokenAddress) external view returns (bool isExists);

// 	function executionFeeReceiver() external view returns (address);

// 	function executionFee() external view returns (uint256);
// }

// // File: contracts/common/interfaces/IRegistry.sol

// interface IRegistry is ICoreRegistry, IPullPaymentConfig {
// 	function getPMAToken() external view returns (address);

// 	function getWBNBToken() external view returns (address);

// 	function getFreezer() external view returns (address);

// 	function getExecutor() external view returns (address);

// 	function getUniswapFactory() external view returns (address);

// 	function getUniswapPair() external view returns (address);

// 	function getUniswapRouter() external view returns (address);

// 	function getPullPaymentRegistry() external view returns (address);
// }

// // File: contracts/common/RegistryHelper.sol

// /**
//  * @title RegistryHelper - initializer for core registry
//  * @author The Pumapay Team
//  * @notice This contract helps to initialize the core registry contract in parent contracts.
//  */
// contract RegistryHelper is OwnableUpgradeable {
// 	/*
//    	=======================================================================
//    	======================== Public variatibles ===========================
//    	=======================================================================
//  	*/
// 	/// @notice The core registry contract
// 	IRegistry public registry;

// 	/*
//    	=======================================================================
//    	======================== Constructor/Initializer ======================
//    	=======================================================================
//  	*/
// 	/**
// 	 * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
// 	 * @dev initializes the core registry with registry address
// 	 */
// 	function _init_registryHelper(address _registryAddress) internal virtual onlyInitializing {
// 		__Ownable_init();
// 		setRegistry(_registryAddress);
// 	}

// 	/*
//    	=======================================================================
//    	======================== Events =======================================
//  	=======================================================================
//  	*/
// 	event RegistrySet(address indexed registryAddress);

// 	/*
//    	=======================================================================
//    	======================== Public Methods ===============================
//    	=======================================================================
//  	*/

// 	/**
// 	 * @notice Updates the address pointing to a Registry contract.
// 	 * @dev only owner can set the registry address.
// 	 * @param registryAddress - The address of a registry contract for routing to other contracts.
// 	 */
// 	function setRegistry(address registryAddress) public virtual onlyOwner {
// 		require(registryAddress != address(0), 'RegistryHelper: CANNOT_REGISTER_ZERO_ADDRESS');
// 		registry = IRegistry(registryAddress);
// 		emit RegistrySet(registryAddress);
// 	}
// }

// // File: contracts/pullPayments/interfaces/ISinglePullPayment.sol

// interface ISinglePullPayment {
// 	struct BillingModelData {
// 		address payee;
// 		string name;
// 		string merchantName;
// 		string uniqueReference;
// 		string merchantURL;
// 		uint256 amount;
// 		address settlementToken;
// 		uint256[] subscriptionIDs;
// 		uint256 creationTime;
// 	}

// 	struct SwappableBillingModel {
// 		address payee;
// 		string name;
// 		string merchantName;
// 		string uniqueReference;
// 		string merchantURL;
// 		uint256 settlementAmount;
// 		address settlementToken;
// 		uint256 paymentAmount;
// 		address paymentToken;
// 		uint256 creationTime;
// 	}

// 	struct SubscriptionData {
// 		address subscriber;
// 		uint256 paymentAmount;
// 		address settlementToken;
// 		address paymentToken;
// 		uint256[] pullPaymentIDs;
// 		uint256 billingModelID;
// 		string uniqueReference;
// 	}

// 	function createBillingModel(
// 		address _payee,
// 		string memory _name,
// 		string memory _merchantName,
// 		string memory _reference,
// 		string memory _merchantURL,
// 		uint256 _amount,
// 		address _token
// 	) external returns (uint256 billingModelID);

// 	function subscribeToBillingModel(
// 		uint256 _billingModelID,
// 		address _paymentToken,
// 		string memory _reference
// 	) external returns (uint256 subscriptionID);

// 	function editBillingModel(
// 		uint256 _billingModelID,
// 		address _newPayee,
// 		string memory _newName,
// 		uint256 _newAmount,
// 		address _newSettlementToken,
// 		string memory _newMerchantName,
// 		string memory _newMerchantURL
// 	) external returns (uint256);

// 	function getBillingModel(uint256 _billingModelID) external view returns (BillingModelData memory);

// 	function getSubscription(uint256 _subscriptionID) external view returns (SubscriptionData memory);

// 	function getBillingModel(uint256 _billingModelID, address _token)
// 		external
// 		view
// 		returns (SwappableBillingModel memory bm);
// }

// // File: contracts/common/interfaces/IPullPaymentRegistry.sol

// interface IPullPaymentRegistry {
// 	function grantExecutor(address _executor) external;

// 	function revokeExecutor(address _executor) external;

// 	function addPullPaymentContract(string calldata _identifier, address _addr) external;

// 	function getPPAddressForOrDie(bytes32 _identifierHash) external view returns (address);

// 	function getPPAddressFor(bytes32 _identifierHash) external view returns (address);

// 	function getPPAddressForStringOrDie(string calldata _identifier) external view returns (address);

// 	function getPPAddressForString(string calldata _identifier) external view returns (address);

// 	function isExecutorGranted(address _executor) external view returns (bool);
// }

// // File: contracts/common/interfaces/IVersionedContract.sol

// interface IVersionedContract {
// 	/**
// 	 * @notice Returns the storage, major, minor, and patch version of the contract.
// 	 * @return The storage, major, minor, and patch version of the contract.
// 	 */
// 	function getVersionNumber()
// 		external
// 		pure
// 		returns (
// 			uint256,
// 			uint256,
// 			uint256,
// 			uint256
// 		);
// }

// // File: contracts/common/interfaces/IExecutor.sol

// interface IExecutor {
// 	function execute(
// 		address,
// 		address,
// 		address,
// 		address,
// 		uint256
// 	) external returns (bool);

// 	function execute(string calldata _bmType, uint256 _subscriptionId) external returns (uint256);
// 	//    function executePullPayment(uint256) external;
// }

// // File: contracts/common/interfaces/IUniswapV2Router01.sol

// pragma solidity >=0.6.2;

// interface IUniswapV2Router01 {
// 	function factory() external pure returns (address);

// 	function WETH() external pure returns (address);

// 	function addLiquidity(
// 		address tokenA,
// 		address tokenB,
// 		uint256 amountADesired,
// 		uint256 amountBDesired,
// 		uint256 amountAMin,
// 		uint256 amountBMin,
// 		address to,
// 		uint256 deadline
// 	)
// 		external
// 		returns (
// 			uint256 amountA,
// 			uint256 amountB,
// 			uint256 liquidity
// 		);

// 	function addLiquidityETH(
// 		address token,
// 		uint256 amountTokenDesired,
// 		uint256 amountTokenMin,
// 		uint256 amountETHMin,
// 		address to,
// 		uint256 deadline
// 	)
// 		external
// 		payable
// 		returns (
// 			uint256 amountToken,
// 			uint256 amountETH,
// 			uint256 liquidity
// 		);

// 	function removeLiquidity(
// 		address tokenA,
// 		address tokenB,
// 		uint256 liquidity,
// 		uint256 amountAMin,
// 		uint256 amountBMin,
// 		address to,
// 		uint256 deadline
// 	) external returns (uint256 amountA, uint256 amountB);

// 	function removeLiquidityETH(
// 		address token,
// 		uint256 liquidity,
// 		uint256 amountTokenMin,
// 		uint256 amountETHMin,
// 		address to,
// 		uint256 deadline
// 	) external returns (uint256 amountToken, uint256 amountETH);

// 	function removeLiquidityWithPermit(
// 		address tokenA,
// 		address tokenB,
// 		uint256 liquidity,
// 		uint256 amountAMin,
// 		uint256 amountBMin,
// 		address to,
// 		uint256 deadline,
// 		bool approveMax,
// 		uint8 v,
// 		bytes32 r,
// 		bytes32 s
// 	) external returns (uint256 amountA, uint256 amountB);

// 	function removeLiquidityETHWithPermit(
// 		address token,
// 		uint256 liquidity,
// 		uint256 amountTokenMin,
// 		uint256 amountETHMin,
// 		address to,
// 		uint256 deadline,
// 		bool approveMax,
// 		uint8 v,
// 		bytes32 r,
// 		bytes32 s
// 	) external returns (uint256 amountToken, uint256 amountETH);

// 	function swapExactTokensForTokens(
// 		uint256 amountIn,
// 		uint256 amountOutMin,
// 		address[] calldata path,
// 		address to,
// 		uint256 deadline
// 	) external returns (uint256[] memory amounts);

// 	function swapTokensForExactTokens(
// 		uint256 amountOut,
// 		uint256 amountInMax,
// 		address[] calldata path,
// 		address to,
// 		uint256 deadline
// 	) external returns (uint256[] memory amounts);

// 	function swapExactETHForTokens(
// 		uint256 amountOutMin,
// 		address[] calldata path,
// 		address to,
// 		uint256 deadline
// 	) external payable returns (uint256[] memory amounts);

// 	function swapTokensForExactETH(
// 		uint256 amountOut,
// 		uint256 amountInMax,
// 		address[] calldata path,
// 		address to,
// 		uint256 deadline
// 	) external returns (uint256[] memory amounts);

// 	function swapExactTokensForETH(
// 		uint256 amountIn,
// 		uint256 amountOutMin,
// 		address[] calldata path,
// 		address to,
// 		uint256 deadline
// 	) external returns (uint256[] memory amounts);

// 	function swapETHForExactTokens(
// 		uint256 amountOut,
// 		address[] calldata path,
// 		address to,
// 		uint256 deadline
// 	) external payable returns (uint256[] memory amounts);

// 	function quote(
// 		uint256 amountA,
// 		uint256 reserveA,
// 		uint256 reserveB
// 	) external pure returns (uint256 amountB);

// 	function getAmountOut(
// 		uint256 amountIn,
// 		uint256 reserveIn,
// 		uint256 reserveOut
// 	) external pure returns (uint256 amountOut);

// 	function getAmountIn(
// 		uint256 amountOut,
// 		uint256 reserveIn,
// 		uint256 reserveOut
// 	) external pure returns (uint256 amountIn);

// 	function getAmountsOut(uint256 amountIn, address[] calldata path)
// 		external
// 		view
// 		returns (uint256[] memory amounts);

// 	function getAmountsIn(uint256 amountOut, address[] calldata path)
// 		external
// 		view
// 		returns (uint256[] memory amounts);
// }

// // File: contracts/common/interfaces/IUniswapV2Router02.sol

// pragma solidity >=0.6.2;

// interface IUniswapV2Router02 is IUniswapV2Router01 {
// 	function removeLiquidityETHSupportingFeeOnTransferTokens(
// 		address token,
// 		uint256 liquidity,
// 		uint256 amountTokenMin,
// 		uint256 amountETHMin,
// 		address to,
// 		uint256 deadline
// 	) external returns (uint256 amountETH);

// 	function removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(
// 		address token,
// 		uint256 liquidity,
// 		uint256 amountTokenMin,
// 		uint256 amountETHMin,
// 		address to,
// 		uint256 deadline,
// 		bool approveMax,
// 		uint8 v,
// 		bytes32 r,
// 		bytes32 s
// 	) external returns (uint256 amountETH);

// 	function swapExactTokensForTokensSupportingFeeOnTransferTokens(
// 		uint256 amountIn,
// 		uint256 amountOutMin,
// 		address[] calldata path,
// 		address to,
// 		uint256 deadline
// 	) external;

// 	function swapExactETHForTokensSupportingFeeOnTransferTokens(
// 		uint256 amountOutMin,
// 		address[] calldata path,
// 		address to,
// 		uint256 deadline
// 	) external payable;

// 	function swapExactTokensForETHSupportingFeeOnTransferTokens(
// 		uint256 amountIn,
// 		uint256 amountOutMin,
// 		address[] calldata path,
// 		address to,
// 		uint256 deadline
// 	) external;
// }

// // File: contracts/pullPayments/SinglePullPayment.sol

// /**
//  * @title SinglePullPayment - The Billing model for one time payment.
//  * @author The Pumapay Team
//  * @notice This billing model allows merchants to accept a one-time payment from customers.
//  * A typical example is a one-time payment of $5.00.
//  */
// contract SinglePullPayment is
// 	ReentrancyGuardUpgradeable,
// 	RegistryHelper,
// 	ISinglePullPayment,
// 	IVersionedContract
// {
// 	using CountersUpgradeable for CountersUpgradeable.Counter;

// 	/*
//    	=======================================================================
//    	======================== Structures ===================================
//    	=======================================================================
//  	*/
// 	struct Subscription {
// 		address subscriber;
// 		address paymentToken;
// 		uint256 subscriptionTime;
// 		uint256[] pullPaymentIDs;
// 		mapping(uint256 => PullPayment) pullPayments;
// 		string uniqueReference;
// 	}

// 	struct BillingModel {
// 		address payee;
// 		string name;
// 		string merchantName;
// 		string uniqueReference;
// 		string merchantURL;
// 		uint256 amount;
// 		address settlementToken;
// 		uint256[] subscriptionIDs;
// 		mapping(uint256 => Subscription) subscriptions;
// 		uint256 creationTime;
// 	}

// 	struct PullPayment {
// 		uint256 paymentAmount;
// 		uint256 executionTimestamp;
// 		uint256 billingModelID;
// 		uint256 subscriptionID;
// 	}

// 	/*
//    	=======================================================================
//    	======================== Private Variables ============================
//    	=======================================================================
//  	*/

// 	/// @dev The couter for billing model ids
// 	CountersUpgradeable.Counter private _billingModelIDs;
// 	/// @dev The couter for subscription ids
// 	CountersUpgradeable.Counter private _subscriptionIDs;
// 	/// @dev The couter for pullpayment ids
// 	CountersUpgradeable.Counter private _pullPaymentIDs;

// 	/// @notice Mappings by ids

// 	/// @dev billing model ID => billing model details
// 	mapping(uint256 => BillingModel) private _billingModels;

// 	/// @dev subscription ID => billing model ID
// 	mapping(uint256 => uint256) private _subscriptionToBillingModel;

// 	/// @dev pull payment ID => subscription ID
// 	mapping(uint256 => uint256) private _pullPaymentToSubscription;

// 	/// @notice Mappings by address

// 	/// @dev Billing Model Creator => billing model IDs
// 	mapping(address => uint256[]) private _billingModelIdsByAddress;
// 	/// @dev Customer address => subscription IDs
// 	mapping(address => uint256[]) private _subscriptionIdsByAddress;
// 	/// @dev Customer address => pull payment IDs
// 	mapping(address => uint256[]) private _pullPaymentIdsByAddress;

// 	/// @notice Mappings by strings

// 	/// @dev bm unique reference => bmId
// 	mapping(string => uint256) private _bmReferences;
// 	/// @dev subscription unique reference => bmId
// 	mapping(string => uint256) private _subscriptionReferences;

// 	/*
//    	=======================================================================
//    	======================== Constructor/Initializer ======================
//    	=======================================================================
//  	*/
// 	/**
// 	 * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
// 	 * @dev This method initializes registry helper to be able to access method of core registry
// 	 */
// 	function initialize(address registryAddress) external virtual initializer {
// 		__ReentrancyGuard_init();
// 		_init_registryHelper(registryAddress);
// 	}

// 	/*
//    	=======================================================================
//    	======================== Events =======================================
// 		=======================================================================
//  	*/
// 	event BillingModelCreated(uint256 indexed billingModelID, address indexed payee);
// 	event NewSubscription(
// 		uint256 indexed billingModelID,
// 		uint256 indexed subscriptionID,
// 		uint256 indexed pullPaymentID,
// 		address payee,
// 		address payer
// 	);
// 	event BillingModelEdited(
// 		uint256 indexed billingModelID,
// 		address indexed newPayee,
// 		string indexed newName,
// 		string newMerhantName,
// 		uint256 amount,
// 		address settlementToken,
// 		address oldPayee
// 	);

// 	/*
//    	=======================================================================
//    	======================== Modifiers ====================================
//  		=======================================================================
//  	*/

// 	modifier onlyValidSubscriptionId(uint256 _subscriptionID) {
// 		require(
// 			_subscriptionID > 0 && _subscriptionID <= _subscriptionIDs.current(),
// 			'SinglePullPayment: INVALID_SUBSCRIPTION_ID'
// 		);
// 		_;
// 	}

// 	modifier onlyValidBillingModelId(uint256 _billingModelID) {
// 		require(
// 			_billingModelID > 0 && _billingModelID <= _billingModelIDs.current(),
// 			'SinglePullPayment: INVALID_BILLING_MODEL_ID'
// 		);
// 		_;
// 	}

// 	/*
//    	=======================================================================
//    	======================== Public Methods ===============================
//    	=======================================================================
//  	*/
// 	/**
// 	 * @notice Allows merchants to create a new billing model with required configurations
// 	 * @dev _name, _merchantName, _reference and _merchantURL can be empty. unique reference is generated if external reference is not given.
// 	 * @param _payee             - payee (receiver) address for pull payment
// 	 * @param _name              - name that can be injected from the creator of the billing model for any future reference
// 	 * @param _merchantName		 	 - name of the merchant
// 	 * @param _reference				 - unique refernce for billing model
// 	 * @param _merchantURL			 - merchant` personal url
// 	 * @param _amount            - amount that the payee requests / amount that the payer needs to pay
// 	 * @param _token             - token address in which the payee defines the amount
// 	 * @return billingModelID 	 - newly generated billing model id
// 	 */
// 	function createBillingModel(
// 		address _payee,
// 		string memory _name,
// 		string memory _merchantName,
// 		string memory _reference,
// 		string memory _merchantURL,
// 		uint256 _amount,
// 		address _token
// 	) external virtual override returns (uint256 billingModelID) {
// 		require(_payee != address(0), 'SinglePullPayment: INVALID_PAYEE_ADDRESS');
// 		require(_amount > 0, 'SinglePullPayment: INVALID_AMOUNT');
// 		require(registry.isSupportedToken(_token), 'SinglePullPayment: UNSUPPORTED_TOKEN');

// 		_billingModelIDs.increment();
// 		uint256 newBillingModelID = _billingModelIDs.current();
// 		BillingModel storage bm = _billingModels[newBillingModelID];

// 		// Billing Model Details
// 		bm.payee = _payee;
// 		bm.name = _name;
// 		bm.merchantName = _merchantName;
// 		bm.amount = _amount;
// 		bm.settlementToken = _token;
// 		bm.creationTime = block.timestamp;
// 		bm.merchantURL = _merchantURL;

// 		// Owner/Creator of the billing model
// 		_billingModelIdsByAddress[msg.sender].push(newBillingModelID);

// 		if (bytes(_reference).length > 0) {
// 			require(_bmReferences[_reference] == 0, 'SinglePullPayment: REFERENCE_ALREADY_EXISTS');
// 			_bmReferences[_reference] = newBillingModelID;
// 			_billingModels[newBillingModelID].uniqueReference = _reference;
// 		} else {
// 			string memory newReference = string(
// 				abi.encodePacked('SinglePullPayment_', StringsUpgradeable.toString(newBillingModelID))
// 			);
// 			_bmReferences[newReference] = newBillingModelID;
// 			_billingModels[newBillingModelID].uniqueReference = newReference;
// 		}

// 		// emit event for new billing model
// 		emit BillingModelCreated(newBillingModelID, _payee);

// 		return newBillingModelID;
// 	}

// 	/**
// 	 * @notice Allows users to subscribe to a new billing model
// 	 * @dev One time payment is done at the time of subscription itself.
// 	 * @param _billingModelID    - the ID of the billing model
// 	 * @param _paymentToken      - the token address the customer wants to pay in
// 	 * @param _reference 				 - unique reference for the subscription. if given empty, a unique reference is generated on chain
// 	 */
// 	function subscribeToBillingModel(
// 		uint256 _billingModelID,
// 		address _paymentToken,
// 		string memory _reference
// 	)
// 		external
// 		virtual
// 		override
// 		nonReentrant
// 		onlyValidBillingModelId(_billingModelID)
// 		returns (uint256 subscriptionID)
// 	{
// 		_subscriptionIDs.increment();
// 		_pullPaymentIDs.increment();

// 		uint256 newSubscriptionID = _subscriptionIDs.current();
// 		uint256 newPullPaymentID = _pullPaymentIDs.current();

// 		BillingModel storage bm = _billingModels[_billingModelID];
// 		Subscription storage subscription = bm.subscriptions[newSubscriptionID];

// 		subscription.subscriber = msg.sender;
// 		subscription.paymentToken = _paymentToken;
// 		// update pull payment
// 		subscription.pullPayments[newPullPaymentID].paymentAmount = bm.amount;
// 		subscription.pullPayments[newPullPaymentID].executionTimestamp = block.timestamp;

// 		bm.subscriptionIDs.push(newSubscriptionID);
// 		subscription.pullPaymentIDs.push(newPullPaymentID);

// 		_subscriptionToBillingModel[newSubscriptionID] = _billingModelID;
// 		// link pull payment with subscription
// 		_pullPaymentToSubscription[newPullPaymentID] = newSubscriptionID;

// 		// link pull payment with "payer"
// 		_pullPaymentIdsByAddress[msg.sender].push(newPullPaymentID);
// 		_subscriptionIdsByAddress[msg.sender].push(newSubscriptionID);

// 		if (bytes(_reference).length > 0) {
// 			require(
// 				_subscriptionReferences[_reference] == 0,
// 				'SinglePullPayment: REFERENCE_ALREADY_EXISTS'
// 			);
// 			_subscriptionReferences[_reference] = newSubscriptionID;
// 			subscription.uniqueReference = _reference;
// 		} else {
// 			string memory newReference = string(
// 				abi.encodePacked(
// 					'SinglePullPayment_',
// 					StringsUpgradeable.toString(_billingModelID),
// 					'_',
// 					StringsUpgradeable.toString(newSubscriptionID)
// 				)
// 			);
// 			_subscriptionReferences[newReference] = newSubscriptionID;
// 			subscription.uniqueReference = newReference;
// 		}

// 		emit NewSubscription(
// 			_billingModelID,
// 			newSubscriptionID,
// 			newPullPaymentID,
// 			bm.payee,
// 			msg.sender
// 		);

// 		//execute the payment
// 		require(
// 			IExecutor(registry.getExecutor()).execute(
// 				bm.settlementToken,
// 				_paymentToken,
// 				msg.sender,
// 				bm.payee,
// 				bm.amount
// 			)
// 		);
// 		return newSubscriptionID;
// 	}

// 	/**
// 	 * @notice Allows merchants to edit their billing models
// 	 * Editing a billing model allows the creator of the billing model to update only attributes
// 	 * that does not affect the billing cycle of the customer, i.e. the name and the payee address etc.
// 	 * @dev _newName, _newMerchantName and _newMerchantURL can be empty
// 	 * @param _billingModelID 		- the ID of the billing model
// 	 * @param _newPayee 					- the address of new payee
// 	 * @param _newName 						- new name for billing model
// 	 * @param _newMerchantName 		- new name for merchant
// 	 * @param _newAmount 					- new amount for billing model
// 	 * @param _newSettlementToken - new settlement token for billing model
// 	 * @param _newMerchantURL  		- merchant` new personal url
// 	 * @return billingModelID 		- billing model id edited
// 	 */
// 	function editBillingModel(
// 		uint256 _billingModelID,
// 		address _newPayee,
// 		string memory _newName,
// 		uint256 _newAmount,
// 		address _newSettlementToken,
// 		string memory _newMerchantName,
// 		string memory _newMerchantURL
// 	)
// 		external
// 		virtual
// 		override
// 		onlyValidBillingModelId(_billingModelID)
// 		returns (uint256 billingModelID)
// 	{
// 		BillingModel storage bm = _billingModels[_billingModelID];

// 		require(msg.sender == bm.payee, 'SinglePullPayment: INVALID_EDITOR');
// 		require(_newPayee != address(0), 'SinglePullPayment: INVALID_PAYEE_ADDRESS');
// 		require(_newAmount > 0, 'SinglePullPayment: INVALID_AMOUNT');
// 		require(registry.isSupportedToken(_newSettlementToken), 'SinglePullPayment: UNSUPPORTED_TOKEN');

// 		bm.payee = _newPayee;
// 		bm.name = _newName;
// 		bm.merchantName = _newMerchantName;
// 		bm.amount = _newAmount;
// 		bm.settlementToken = _newSettlementToken;
// 		bm.merchantURL = _newMerchantURL;

// 		emit BillingModelEdited(
// 			_billingModelID,
// 			_newPayee,
// 			_newName,
// 			_newMerchantName,
// 			_newAmount,
// 			_newSettlementToken,
// 			msg.sender
// 		);
// 		return _billingModelID;
// 	}

// 	/*
//    	=======================================================================
//    	======================== Getter Methods ===============================
//    	=======================================================================
//  	*/
// 	/**
// 	 * @notice Retrieves a billing model
// 	 * @dev shows subscription ids of billing model to only bm creator
// 	 * @param _billingModelID - the ID of the billing model
// 	 * @return bm							- returns the Billing model data struct
// 	 */
// 	function getBillingModel(uint256 _billingModelID)
// 		external
// 		view
// 		virtual
// 		override
// 		onlyValidBillingModelId(_billingModelID)
// 		returns (BillingModelData memory bm)
// 	{
// 		BillingModel storage bmDetails = _billingModels[_billingModelID];
// 		// If the caller is the address owning this billing model, then return the array with the
// 		// subscription IDs as well
// 		bm.payee = bmDetails.payee;
// 		bm.name = bmDetails.name;
// 		bm.amount = bmDetails.amount;
// 		bm.settlementToken = bmDetails.settlementToken;
// 		bm.creationTime = bmDetails.creationTime;
// 		bm.merchantName = bmDetails.merchantName;
// 		bm.uniqueReference = bmDetails.uniqueReference;
// 		bm.merchantURL = bmDetails.merchantURL;

// 		if (msg.sender == bmDetails.payee) {
// 			bm.subscriptionIDs = bmDetails.subscriptionIDs;
// 		} else {
// 			// Otherwise, return an empty array for `_bmSubscriptionIDs`
// 			uint256[] memory emptyArray;
// 			bm.subscriptionIDs = emptyArray;
// 		}
// 	}

// 	/**
// 	 * @notice Retrieves a billing model with given token as payment token
// 	 * @param _billingModelID - the ID of the billing model
// 	 * @param _token 					- the token used for payment
// 	 * @return bm							- returns the Billing model data struct which contains exact amount to pay in given token.
// 	 */
// 	function getBillingModel(uint256 _billingModelID, address _token)
// 		external
// 		view
// 		virtual
// 		override
// 		onlyValidBillingModelId(_billingModelID)
// 		returns (SwappableBillingModel memory bm)
// 	{
// 		BillingModel storage bmDetails = _billingModels[_billingModelID];

// 		address[] memory path = new address[](2);
// 		path[0] = _token;
// 		path[1] = bmDetails.settlementToken;

// 		uint256[] memory amountsIn = IUniswapV2Router02(registry.getUniswapRouter()).getAmountsIn(
// 			bmDetails.amount,
// 			path
// 		);

// 		bm.payee = bmDetails.payee;
// 		bm.settlementAmount = bmDetails.amount;
// 		bm.settlementToken = bmDetails.settlementToken;
// 		bm.paymentAmount = amountsIn[0];
// 		bm.paymentToken = _token;
// 		bm.creationTime = bmDetails.creationTime;
// 		bm.merchantName = bmDetails.merchantName;
// 		bm.uniqueReference = bmDetails.uniqueReference;
// 		bm.merchantURL = bmDetails.merchantURL;

// 		return bm;
// 	}

// 	/**
// 	 * @notice Retrieves subscription details
// 	 * @dev shows pullpayment ids of subscription to merchant of bm and subscriber only
// 	 * @param _subscriptionID - the ID of the subscription
// 	 * @return sb 						- the subscription information
// 	 */
// 	function getSubscription(uint256 _subscriptionID)
// 		external
// 		view
// 		virtual
// 		override
// 		onlyValidSubscriptionId(_subscriptionID)
// 		returns (SubscriptionData memory sb)
// 	{
// 		uint256 bmID = _subscriptionToBillingModel[_subscriptionID];
// 		BillingModel storage bm = _billingModels[bmID];
// 		Subscription storage subscription = bm.subscriptions[_subscriptionID];

// 		sb.subscriber = subscription.subscriber;
// 		sb.paymentAmount = bm.amount;
// 		sb.settlementToken = bm.settlementToken;
// 		sb.paymentToken = subscription.paymentToken;
// 		sb.uniqueReference = subscription.uniqueReference;

// 		if (msg.sender == bm.payee || msg.sender == subscription.subscriber) {
// 			sb.pullPaymentIDs = subscription.pullPaymentIDs;
// 		} else {
// 			// Return an empty array for `_subscriptionPullPaymentIDs`in case the caller is not
// 			// the payee or the subscriber
// 			uint256[] memory emptyArray;
// 			sb.pullPaymentIDs = emptyArray;
// 		}

// 		sb.billingModelID = bmID;
// 	}

// 	/**
// 	 * @notice Returns the details of a pull payment
// 	 * @dev shows pullpayment amount and timestamp to granted executor, bm creator and subscriber only
// 	 * @param _pullPaymentID 	- the Id of the pull payment
// 	 * @return pullPayment 		- the pullpayment informations
// 	 */
// 	function getPullPayment(uint256 _pullPaymentID)
// 		external
// 		view
// 		virtual
// 		returns (PullPayment memory pullPayment)
// 	{
// 		require(
// 			_pullPaymentID > 0 && _pullPaymentID <= _pullPaymentIDs.current(),
// 			'RecurringPullPayment: INVALID_PULLPAYMENT_ID'
// 		);
// 		uint256 bmID = _subscriptionToBillingModel[_pullPaymentToSubscription[_pullPaymentID]];
// 		BillingModel storage bm = _billingModels[bmID];
// 		Subscription storage subscription = bm.subscriptions[
// 			_pullPaymentToSubscription[_pullPaymentID]
// 		];
// 		pullPayment.paymentAmount = bm
// 			.subscriptions[_pullPaymentToSubscription[_pullPaymentID]]
// 			.pullPayments[_pullPaymentID]
// 			.paymentAmount;
// 		pullPayment.executionTimestamp = bm
// 			.subscriptions[_pullPaymentToSubscription[_pullPaymentID]]
// 			.pullPayments[_pullPaymentID]
// 			.executionTimestamp;

// 		if (
// 			msg.sender != bm.payee &&
// 			msg.sender != subscription.subscriber &&
// 			IPullPaymentRegistry(registry.getPullPaymentRegistry()).isExecutorGranted(msg.sender) == false
// 		) {
// 			pullPayment.paymentAmount = 0;
// 			pullPayment.executionTimestamp = 0;
// 		}
// 		pullPayment.billingModelID = bmID;
// 		pullPayment.subscriptionID = _pullPaymentToSubscription[_pullPaymentID];
// 	}

// 	/**
// 	 * @notice Retrieves billing model IDs for an address
// 	 * @dev Returns an array with the billing model IDs related with that address
// 	 * @param _creator 					- address that created the billing model
// 	 * @return billingModelIDs 	- returns list of billing model ids for merchant
// 	 */
// 	function getBillingModelIdsByAddress(address _creator)
// 		external
// 		view
// 		virtual
// 		returns (uint256[] memory billingModelIDs)
// 	{
// 		return _billingModelIdsByAddress[_creator];
// 	}

// 	/**
// 	 * @notice Retrieves subscription ids for an address
// 	 * @dev Returns an array with the subscription IDs related with that address
// 	 * @param _subscriber 			- address the pull payment relates to
// 	 * @return subscriptionIDs 	- the list of subscription ids for subscriber
// 	 */
// 	function getSubscriptionIdsByAddress(address _subscriber)
// 		external
// 		view
// 		virtual
// 		returns (uint256[] memory subscriptionIDs)
// 	{
// 		return _subscriptionIdsByAddress[_subscriber];
// 	}

// 	/**
// 	 * @notice Retrieves pull payment ids for an address
// 	 * @dev Returns an array with the pull payment IDs related with that address
// 	 * @param _subscriber 		- address the pull payment relates to
// 	 * @return pullPaymentIDs - the list of pullpayment ids
// 	 */
// 	function getPullPaymentsIdsByAddress(address _subscriber)
// 		external
// 		view
// 		virtual
// 		returns (uint256[] memory pullPaymentIDs)
// 	{
// 		return _pullPaymentIdsByAddress[_subscriber];
// 	}

// 	/**
// 	 * @notice Gives current billing model id
// 	 */
// 	function getCurrentBillingModelId() external view virtual returns (uint256) {
// 		return _billingModelIDs.current();
// 	}

// 	/**
// 	 * @notice Gives current subscription id
// 	 */
// 	function getCurrentSubscriptionId() external view virtual returns (uint256) {
// 		return _subscriptionIDs.current();
// 	}

// 	/**
// 	 * @notice Gives current pullpayment id
// 	 */
// 	function getCurrentPullPaymentId() external view virtual returns (uint256) {
// 		return _pullPaymentIDs.current();
// 	}

// 	/**
// 	 * @notice Returns the storage, major, minor, and patch version of the contract.
// 	 * @return The storage, major, minor, and patch version of the contract.
// 	 */
// 	function getVersionNumber()
// 		external
// 		pure
// 		virtual
// 		override
// 		returns (
// 			uint256,
// 			uint256,
// 			uint256,
// 			uint256
// 		)
// 	{
// 		return (1, 0, 0, 0);
// 	}
// }
