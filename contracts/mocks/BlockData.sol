// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title BlockData
 * @author The Pumapay Team
 */
contract BlockData {
	function getChainId() external view returns (uint256) {
		return block.chainid;
	}

	function getTime() external view returns (uint256) {
		return block.timestamp;
	}
}
