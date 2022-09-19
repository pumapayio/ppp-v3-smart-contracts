const { getRegistry } = require('../../libs/utils');
const { UniswapV2Router02Address } = require('../configurations/config');

module.exports = async (deployer) => {
	try {
		const networkId = deployer.network_id.toString();
		const registryContract = await getRegistry(networkId, artifacts);

		await registryContract.setAddressFor('UniswapV2Router02', UniswapV2Router02Address[networkId]);

	} catch (error) {
		console.log('error: ', error);
	}
};
