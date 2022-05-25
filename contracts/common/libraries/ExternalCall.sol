// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol';

/**
 * @title ExternalCall 
 * @author The Pumapay Team
 */
library ExternalCall {
	/**
	 * @notice Executes external call.
	 * @param destination The address to call.
	 * @param value The CELO value to be sent.
	 * @param data The data to be sent.
	 * @return The call return value.
	 */
	function execute(
		address destination,
		uint256 value,
		bytes memory data
	) internal returns (bytes memory) {
		if (data.length > 0)
			require(AddressUpgradeable.isContract(destination), 'Invalid contract address');
		bool success;
		bytes memory returnData;
		(success, returnData) = destination.call{value: value}(data);
		require(success, 'Transaction execution failed.');
		return returnData;
	}
}

//The following syntax is deprecated:
//f.gas(...)(), f.value(...)() and (new C).value(...)().
//
//Replace these calls by
//f{gas: ..., value: ...}() and (new C){value: ...}().
