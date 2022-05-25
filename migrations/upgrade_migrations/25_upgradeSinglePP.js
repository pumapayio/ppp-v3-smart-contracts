const {upgradeProxy} = require('@openzeppelin/truffle-upgrades');

const name = 'SinglePullPayment';
const Contract = artifacts.require(name);

module.exports = async (deployer, _networkName, _accounts) => {
	try {
		const network_id = deployer.network_id.toString();
		const addresses = require(`../configurations/${network_id}/Addresses.json`);

		await upgradeProxy(addresses[network_id][name], Contract);
	} catch (error) {
		console.log('error: ', error);
	}
};
