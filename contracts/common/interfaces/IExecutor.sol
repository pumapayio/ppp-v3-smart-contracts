// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IExecutor {
	function execute(
		address,
		address,
		address,
		address,
		uint256
	)
		external
		returns (
			uint256 executionFee,
			uint256 userAmount,
			uint256 receiverAmount
		);

	function execute(string calldata _bmType, uint256 _subscriptionId) external returns (uint256);

	//    function executePullPayment(uint256) external;

	function getReceivingAmount(
		address _paymentToken,
		address _settlementToken,
		uint256 _amount
	)
		external
		view
		returns (
			uint256 receivingAmount,
			uint256 userPayableAmount,
			uint256 executionFee
		);
}
