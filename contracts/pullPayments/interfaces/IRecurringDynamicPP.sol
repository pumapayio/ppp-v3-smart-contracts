// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IRecurringDynamicPullPayment {
	struct BillingModelData {
		address payee;
		string merchantName;
		string uniqueReference;
		string merchantURL;
		uint8 recurringPPType;
		uint256[] subscriptionIDs;
		uint256 creationTime;
	}

	struct SubscriptionData {
		address subscriber;
		string bmName;
		uint256 paymentAmount;
		address settlementToken;
		address paymentToken;
		uint256 totalPayments;
		uint256 remainingPayments;
		uint256 frequency;
		uint256 startTimestamp;
		uint256 cancelTimestamp;
		uint256 nextPaymentTimestamp;
		uint256 lastPaymentTimestamp;
		uint256[] pullPaymentIDs;
		uint256 billingModelID;
		string uniqueReference;
		address cancelledBy;
	}

	struct Data {
		SubscriptionData subscription;
		uint256 trialPeriod;
		uint256 initialAmount;
	}

	function createBillingModel(
		address _payee,
		uint8 _recurringPPType,
		string memory _merchantName,
		string memory _reference,
		string memory _merchantURL
	) external returns (uint256 billingModelID);

	function subscribeToBillingModel(
		uint256 _billingModelID,
		string memory _bmName,
		address _settlementToken,
		address _paymentToken,
		uint256 _paymentAmount,
		uint256 _frequency,
		uint256 _totalPayments,
		uint256 _trialPeriod,
		uint256 _initialAMount,
		string memory _reference
	) external returns (uint256 subscriptionID);

	function executePullPayment(uint256 _subscriptionID) external returns (uint256);

	function cancelSubscription(uint256 _subscriptionID) external returns (uint256);

	function editBillingModel(
		uint256 _billingModelID,
		address _newPayee,
		string memory _newMerchantName,
		string memory _newMerchantURL
	) external returns (uint256);

	function getBillingModel(uint256 _billingModelID) external view returns (BillingModelData memory);

	function getSubscription(uint256 _subscriptionID) external view returns (Data memory);
}
