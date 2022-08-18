const { getDeployedContract } = require('../libs/utils');

module.exports = async (deployer) => {
  try {
    const networkId = deployer.network_id.toString();
    const addresses = require(`../configurations/${networkId}/Addresses.json`);

    // TODO- Get correct upkeep ids
    const upKeepIds = {
      RecurringPullPayment: 1,
      RecurringPullPaymentWithFreeTrial: 2,
      RecurringPullPaymentWithPaidTrial: 3,
      RecurringDynamicPullPayment: 4
    };

    // Register executor
    const registry = await getDeployedContract('PullPaymentsRegistry', artifacts);
    await registry.setUpkeepId(addresses[networkId]['RecurringPullPayment'], upKeepIds['RecurringPullPayment']);
    await registry.setUpkeepId(addresses[networkId]['RecurringPullPaymentWithFreeTrial'], upKeepIds['RecurringPullPaymentWithFreeTrial']);
    await registry.setUpkeepId(addresses[networkId]['RecurringPullPaymentWithPaidTrial'], upKeepIds['RecurringPullPaymentWithPaidTrial']);
    await registry.setUpkeepId(addresses[networkId]['RecurringDynamicPullPayment'], upKeepIds['RecurringDynamicPullPayment']);

  } catch (error) {
    console.log('error: ', error);
  }
};
