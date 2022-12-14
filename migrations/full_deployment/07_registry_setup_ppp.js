const { getRegistry } = require('../../libs/utils');

module.exports = async (deployer) => {
	try {
		const networkId = deployer.network_id.toString();
		const addresses = require(`../configurations/${networkId}/Addresses.json`);

		const registryContract = await getRegistry(networkId, artifacts);

		// register pullPaymentRegistry in main registry
		await registryContract.setAddressFor(
			'PullPaymentsRegistry',
			addresses[networkId]['PullPaymentsRegistry']
		);
	} catch (error) {
		console.log('error: ', error);
	}
};
