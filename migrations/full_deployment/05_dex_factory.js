const { getDeployedContract } = require('../libs/utils');
const { saveAddress } = require('../scripts/saveAddress');
const { UniswapFactoryAddress } = require('../configurations/config');

module.exports = async (deployer) => {
	try {
		const networkId = deployer.network_id.toString();
		const registryContract = await getDeployedContract('Registry', artifacts);

		await registryContract.setAddressFor('UniswapFactory', UniswapFactoryAddress[networkId]);

		await saveAddress('UniswapFactory', UniswapFactoryAddress[networkId], networkId);
	} catch (error) {
		console.log('error: ', error);
	}
};
