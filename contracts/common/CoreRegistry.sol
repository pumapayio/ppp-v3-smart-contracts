// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';

import './interfaces/ICoreRegistry.sol';

/**
 * @title Registry - Routes identifiers to addresses.
 * @author - The Pumapay Team
 * @notice The core registry which stores routes for contracts
 */
contract CoreRegistry is OwnableUpgradeable, ICoreRegistry {
	using SafeMathUpgradeable for uint256;

	/*
   	=======================================================================
   	======================== Public Variables ============================
   	=======================================================================
 	*/
	/// @notice encoded contract name => contract name
	mapping(bytes32 => address) public mainRegistry;

	/*
   	=======================================================================
   	======================== Constructor/Initializer ======================
   	=======================================================================
 	*/
	/**
	 * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
	 */
	function _init_coreRegistry() internal virtual onlyInitializing {
		__Ownable_init();
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

	/*
   	=======================================================================
   	======================== Public Methods ===============================
   	=======================================================================
 	*/
	/**
	 * @notice Associates the given address with the given identifier.
	 * @param identifier - Identifier of contract whose address we want to set.
	 * @param addr 			 - Address of contract.
	 */
	function setAddressFor(string calldata identifier, address addr)
		public
		virtual
		override
		onlyOwner
	{
		bytes32 identifierHash = keccak256(abi.encodePacked(identifier));
		mainRegistry[identifierHash] = addr;
		emit RegistryUpdated(identifier, identifierHash, addr);
	}

	/*
   	=======================================================================
   	======================== Getter Methods ===============================
   	=======================================================================
 	*/

	/**
	 * @notice Gets address associated with the given identifierHash.
	 * @param identifierHash - Identifier hash of contract whose address we want to look up.
	 * @dev Throws if address not set.
	 */
	function getAddressForOrDie(bytes32 identifierHash)
		public
		view
		virtual
		override
		returns (address)
	{
		require(mainRegistry[identifierHash] != address(0), 'identifier has no registry entry');
		return mainRegistry[identifierHash];
	}

	/**
	 * @notice Gets address associated with the given identifierHash.
	 * @param identifierHash - Identifier hash of contract whose address we want to look up.
	 */
	function getAddressFor(bytes32 identifierHash) public view virtual override returns (address) {
		return mainRegistry[identifierHash];
	}

	/**
	 * @notice Gets address associated with the given identifier.
	 * @param identifier - Identifier of contract whose address we want to look up.
	 * @dev Throws if address not set.
	 */
	function getAddressForStringOrDie(string calldata identifier)
		public
		view
		virtual
		returns (address)
	{
		bytes32 identifierHash = keccak256(abi.encodePacked(identifier));
		require(mainRegistry[identifierHash] != address(0), 'identifier has no registry entry');
		return mainRegistry[identifierHash];
	}

	/**
	 * @notice Gets address associated with the given identifier.
	 * @param identifier - Identifier of contract whose address we want to look up.
	 */
	function getAddressForString(string calldata identifier) public view virtual returns (address) {
		bytes32 identifierHash = keccak256(abi.encodePacked(identifier));
		return mainRegistry[identifierHash];
	}

	/**
	 * @notice Iterates over provided array of identifiers, getting the address for each.
	 *         Returns true if `sender` matches the address of one of the provided identifiers.
	 * @param identifierHashes - Array of hashes of approved identifiers.
	 * @param sender -  Address in question to verify membership.
	 * @return True if `sender` corresponds to the address of any of `identifiers`
	 *         registry entries.
	 */
	function isOneOf(bytes32[] memory identifierHashes, address sender)
		public
		view
		virtual
		override
		returns (bool)
	{
		for (uint256 i = 0; i < identifierHashes.length; i = i.add(1)) {
			if (mainRegistry[identifierHashes[i]] == sender) {
				return true;
			}
		}
		return false;
	}
}
