// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

library TokenOperation {
	using Address for address;

	function safeMint(
		address token,
		address to,
		uint256 value
	) internal {
		// mint(address,uint256)
		_callOptionalReturn(token, abi.encodeWithSelector(0x40c10f19, to, value));
	}

	function safeBurnAny(
		address token,
		address from,
		uint256 value
	) internal {
		// burn(address,uint256)
		_callOptionalReturn(token, abi.encodeWithSelector(0x9dc29fac, from, value));
	}

	function safeBurnSelf(address token, uint256 value) internal {
		// burn(uint256)
		_callOptionalReturn(token, abi.encodeWithSelector(0x42966c68, value));
	}

	function safeBurnFrom(
		address token,
		address from,
		uint256 value
	) internal {
		// burnFrom(address,uint256)
		_callOptionalReturn(token, abi.encodeWithSelector(0x79cc6790, from, value));
	}

	function _callOptionalReturn(address token, bytes memory data) private {
		bytes memory returndata = token.functionCall(data, 'TokenOperation: low-level call failed');
		if (returndata.length > 0) {
			// Return data is optional
			require(abi.decode(returndata, (bool)), 'TokenOperation: did not succeed');
		}
	}
}
