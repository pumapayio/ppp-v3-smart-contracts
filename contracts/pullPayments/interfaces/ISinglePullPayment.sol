// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ISinglePullPayment {
	struct BillingModelData {
		address payee;
		string name;
		string merchantName;
		string uniqueReference;
		string merchantURL;
		uint256 amount;
		address settlementToken;
		uint256[] subscriptionIDs;
		uint256 creationTime;
	}

	struct SwappableBillingModel {
		address payee;
		string name;
		string merchantName;
		string uniqueReference;
		string merchantURL;
		uint256 settlementAmount;
		address settlementToken;
		uint256 paymentAmount;
		address paymentToken;
		uint256 creationTime;
	}

	struct SubscriptionData {
		address subscriber;
		uint256 paymentAmount;
		address settlementToken;
		address paymentToken;
		uint256[] pullPaymentIDs;
		uint256 billingModelID;
		string uniqueReference;
	}

	function createBillingModel(
		address _payee,
		string memory _name,
		string memory _merchantName,
		string memory _reference,
		string memory _merchantURL,
		uint256 _amount,
		address _token
	) external returns (uint256 billingModelID);

	function subscribeToBillingModel(
		uint256 _billingModelID,
		address _paymentToken,
		string memory _reference
	) external returns (uint256 subscriptionID);

	function editBillingModel(
		uint256 _billingModelID,
		address _newPayee,
		string memory _newName,
		uint256 _newAmount,
		address _newSettlementToken,
		string memory _newMerchantName,
		string memory _newMerchantURL
	) external returns (uint256);

	function getBillingModel(uint256 _billingModelID) external view returns (BillingModelData memory);

	function getSubscription(uint256 _subscriptionID) external view returns (SubscriptionData memory);

	function getBillingModel(uint256 _billingModelID, address _token)
		external
		view
		returns (SwappableBillingModel memory bm);
}
