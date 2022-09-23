// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IBridge {
	function Swapin(
		bytes32 txhash,
		address account,
		uint256 amount
	) external returns (bool);

	function Swapout(uint256 amount, address bindaddr) external returns (bool);

	event LogSwapin(bytes32 indexed txhash, address indexed account, uint256 amount);
	event LogSwapout(address indexed account, address indexed bindaddr, uint256 amount);
}
