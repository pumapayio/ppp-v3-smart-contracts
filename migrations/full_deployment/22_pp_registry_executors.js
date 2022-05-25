const { getDeployedContract } = require('../../libs/utils');
const { executors } = require('../../configurations/config');

module.exports = async (deployer) => {
	try {
		const networkId = deployer.network_id.toString();

		const ppRegistry = await getDeployedContract('PullPaymentsRegistry', artifacts);

		for (let executor of executors[networkId]) {
			await ppRegistry.grantExecutor(executor);
			console.log(`Added executor address: ${executor}`);
		}
	} catch (error) {
		console.log('error: ', error);
	}
};
