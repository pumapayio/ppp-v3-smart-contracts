// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

abstract contract ISupportedTokens {
	function addToken(address) external virtual;

	function getSupported() external view virtual returns (address[] memory);
}
