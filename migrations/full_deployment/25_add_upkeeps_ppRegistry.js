const { getPPRegistry } = require('../libs/utils');

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
    const pullPaymentRegistry = await getPPRegistry(networkId, artifacts);
    await pullPaymentRegistry.setUpkeepId(addresses[networkId]['RecurringPullPayment'], upKeepIds['RecurringPullPayment']);
    await pullPaymentRegistry.setUpkeepId(addresses[networkId]['RecurringPullPaymentWithFreeTrial'], upKeepIds['RecurringPullPaymentWithFreeTrial']);
    await pullPaymentRegistry.setUpkeepId(addresses[networkId]['RecurringPullPaymentWithPaidTrial'], upKeepIds['RecurringPullPaymentWithPaidTrial']);
    await pullPaymentRegistry.setUpkeepId(addresses[networkId]['RecurringDynamicPullPayment'], upKeepIds['RecurringDynamicPullPayment']);

  } catch (error) {
    console.log('error: ', error);
  }
};
