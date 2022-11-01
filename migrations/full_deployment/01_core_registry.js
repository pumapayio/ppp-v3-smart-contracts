const { deployProxy } = require('@openzeppelin/truffle-upgrades');
const { saveAddress } = require('../scripts/saveAddress');
const { ExecutionFee } = require('../configurations/config');

const name = 'Registry';
const Registry = artifacts.require('Registry');

module.exports = async (deployer) => {
	try {
		const networkId = deployer.network_id.toString();

		// deploy Registry Contract
		const registryDeployed = await deployProxy(Registry, [ExecutionFee], {
			initializer: 'initialize'
		});

		console.log('Registry Address: ', registryDeployed.address);

		await saveAddress(name, registryDeployed.address, networkId);
	} catch (error) {
		console.log('error: ', error);
	}
};
