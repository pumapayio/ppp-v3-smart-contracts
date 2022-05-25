const { getDeployedContract } = require("../libs/utils");

module.exports = async (deployer, _networkName, _accounts) => {
  try {
    const network_id = deployer.network_id.toString();
    const addresses = require(`../configurations/${network_id}/Addresses.json`);

    // Register recurring pullpayment contract on pullPayment registry
    const pullPaymentRegistry = await getDeployedContract(
      "PullPaymentsRegistry",
      artifacts
    );
    await pullPaymentRegistry.addPullPaymentContract(
      "RecurringPullPaymentWithFreeTrial",
      addresses[network_id]["RecurringPullPaymentWithFreeTrial"]
    );
  } catch (error) {
    console.log("error: ", error);
  }
};
