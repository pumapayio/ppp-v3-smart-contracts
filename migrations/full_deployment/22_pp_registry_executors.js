const { getPPRegistry } = require('../../libs/utils');
const { executors } = require('../../configurations/config');

module.exports = async (deployer) => {
	try {
		const networkId = deployer.network_id.toString();

		const pullPaymentRegistry = await getPPRegistry(networkId, artifacts);

		for (let executor of executors[networkId]) {
			await pullPaymentRegistry.grantExecutor(executor);
			console.log(`Added executor address: ${executor}`);
		}
	} catch (error) {
		console.log('error: ', error);
	}
};
