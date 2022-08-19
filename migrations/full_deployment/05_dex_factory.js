const { getRegistry } = require('../../libs/utils');
const { UniswapFactoryAddress } = require('../configurations/config');

module.exports = async (deployer) => {
	try {
		const networkId = deployer.network_id.toString();
		const registryContract = await getRegistry(networkId, artifacts);

		await registryContract.setAddressFor('UniswapFactory', UniswapFactoryAddress[networkId]);
	} catch (error) {
		console.log('error: ', error);
	}
};
