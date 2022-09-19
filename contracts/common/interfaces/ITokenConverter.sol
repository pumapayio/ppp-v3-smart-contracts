// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ITokenConverter {
	function isLowBalance(uint256 _upkeepId) external view returns (bool isLow);

	function topupUpkeep(uint256 _upkeepId) external returns (bool topupPerform);
}
