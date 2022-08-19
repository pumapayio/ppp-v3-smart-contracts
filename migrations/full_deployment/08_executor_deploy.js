const { saveAddress } = require('../scripts/saveAddress');

const name = 'Executor';
const ExecutorContract = artifacts.require(name);

module.exports = async (deployer) => {
	try {
		const networkId = deployer.network_id.toString();
		const addresses = require(`../configurations/${networkId}/Addresses.json`);

		await deployer.deploy(
			ExecutorContract,
			addresses[networkId]['Registry']
		);

		const executorDeployed = await ExecutorContract.deployed();

		console.log('Executor Address: ', executorDeployed.address);
		await saveAddress(name, executorDeployed.address, networkId);
	} catch (error) {
		console.log('error: ', error);
	}
};
