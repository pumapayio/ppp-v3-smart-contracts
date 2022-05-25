const { getDeployedContract } = require('../libs/utils');
const { saveAddress } = require('../scripts/saveAddress');
const { UniswapV2Router02Address } = require('../configurations/config');

module.exports = async (deployer) => {
	try {
		const networkId = deployer.network_id.toString();
		const registryContract = await getDeployedContract('Registry', artifacts);

		await registryContract.setAddressFor('UniswapV2Router02', UniswapV2Router02Address[networkId]);

		await saveAddress('UniswapV2Router02', UniswapV2Router02Address[networkId], networkId);
	} catch (error) {
		console.log('error: ', error);
	}
};
