const { getRegistry } = require('../../libs/utils');

module.exports = async (deployer) => {
	try {
		const networkId = deployer.network_id.toString();
		const addresses = require(`../configurations/${networkId}/Addresses.json`);

		// Register executor
		const registryContract = await getRegistry(networkId, artifacts);

		await registryContract.setAddressFor('Executor', addresses[networkId]['Executor']);
	} catch (error) {
		console.log('error: ', error);
	}
};
