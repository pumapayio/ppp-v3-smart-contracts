const { getPPRegistry } = require('../../libs/utils');

module.exports = async (deployer) => {
	try {
		const networkId = deployer.network_id.toString();
		const addresses = require(`../configurations/${networkId}/Addresses.json`);

		// Register recurring pullpayment contract on pullPayment registry
		const pullPaymentRegistry = await getPPRegistry(networkId, artifacts);

		await pullPaymentRegistry.addPullPaymentContract(
			'SinglePullPayment',
			addresses[networkId]['SinglePullPayment']
		);
	} catch (error) {
		console.log('error: ', error);
	}
};
