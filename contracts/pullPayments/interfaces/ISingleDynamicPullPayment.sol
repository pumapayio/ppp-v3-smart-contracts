// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ISingleDynamicPullPayment {
	struct BillingModelData {
		address payee;
		string merchantName;
		string uniqueReference;
		string merchantURL;
		uint256[] subscriptionIDs;
		uint256 creationTime;
	}

	struct SubscriptionData {
		address payee;
		string name;
		address subscriber;
		address settlementToken;
		address paymentToken;
		uint256[] pullPaymentIDs;
		string uniqueReference;
	}

	function createBillingModel(
		address _payee,
		string memory _merchantName,
		string memory _reference,
		string memory _merchantURL
	) external returns (uint256 billingModelID);

	function subscribeToBillingModel(
		uint256 _billingModelID,
		string memory _name,
		address _settlementToken,
		address _paymentToken,
		uint256 _paymentAmount,
		string memory _reference
	) external returns (uint256 subscriptionID);

	function editBillingModel(
		uint256 _billingModelID,
		address _newPayee,
		string memory _newMerchantName,
		string memory _newMerchantURL
	) external returns (uint256);

	function getBillingModel(uint256 _billingModelID) external view returns (BillingModelData memory);

	function getSubscription(uint256 _subscriptionID) external view returns (SubscriptionData memory);
}
