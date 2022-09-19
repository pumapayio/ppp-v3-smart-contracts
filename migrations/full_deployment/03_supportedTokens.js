const { getRegistry } = require('../../libs/utils');

const { supportedTokens } = require('../configurations/config');


module.exports = async (deployer) => {
	try {
		const networkId = deployer.network_id.toString();

		// Register supported token in registry
		const registryContract = await getRegistry(networkId, artifacts);

		// add supported tokens
		for (let supportedToken of supportedTokens[networkId]) {
			await registryContract.addToken(supportedToken);
			console.log(`Added supported token: ${supportedToken}`);
		}
	} catch (error) {
		console.log('error: ', error);
	}
};
