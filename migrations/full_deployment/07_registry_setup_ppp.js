const { getDeployedContract } = require('../libs/utils');

module.exports = async (deployer) => {
	try {
		const networkId = deployer.network_id.toString();
		const addresses = require(`../configurations/${networkId}/Addresses.json`);

		const registry = await getDeployedContract('Registry', artifacts);

		// register pullPaymentRegistry in main registry
		await registry.setAddressFor(
			'PullPaymentsRegistry',
			addresses[networkId]['PullPaymentsRegistry']
		);
	} catch (error) {
		console.log('error: ', error);
	}
};
