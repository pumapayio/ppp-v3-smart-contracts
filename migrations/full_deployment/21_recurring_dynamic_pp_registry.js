const { getDeployedContract } = require('../libs/utils');

module.exports = async (deployer) => {
	try {
		const networkId = deployer.network_id.toString();
		const addresses = require(`../configurations/${networkId}/Addresses.json`);

		// Register recurring pullpayment contract on pullPayment registry
		const pullPaymentRegistry = await getDeployedContract('PullPaymentsRegistry', artifacts);
		await pullPaymentRegistry.addPullPaymentContract(
			'RecurringDynamicPullPayment',
			addresses[networkId]['RecurringDynamicPullPayment']
		);
	} catch (error) {
		console.log('error: ', error);
	}
};
