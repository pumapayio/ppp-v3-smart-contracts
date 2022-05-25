const { getDeployedContract } = require('../libs/utils');
const { supportedTokens } = require('../configurations/config');

module.exports = async (deployer) => {
	try {
		const networkId = deployer.network_id.toString();

		// Register supported token in registry
		const registry = await getDeployedContract('Registry', artifacts);

		// add supported tokens
		for (let supportedToken of supportedTokens[networkId]) {
			await registry.addToken(supportedToken);
			console.log(`Added supported token: ${supportedToken}`);
		}
	} catch (error) {
		console.log('error: ', error);
	}
};
