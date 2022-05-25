const { getDeployedContract } = require('../libs/utils');

module.exports = async (deployer) => {
	try {
		const networkId = deployer.network_id.toString();
		const addresses = require(`../configurations/${networkId}/Addresses.json`);

		// Register executor
		const registry = await getDeployedContract('Registry', artifacts);
		await registry.setAddressFor('Executor', addresses[networkId]['Executor']);
	} catch (error) {
		console.log('error: ', error);
	}
};
