const { upgradeProxy } = require('@openzeppelin/truffle-upgrades');

const name = 'SingleDynamicPullPayment';
const Contract = artifacts.require(name);

module.exports = async (deployer) => {
	try {
		const networkId = deployer.network_id.toString();
		const addresses = require(`../configurations/${networkId}/Addresses.json`);

		await upgradeProxy(addresses[networkId][name], Contract);
	} catch (error) {
		console.log('error: ', error);
	}
};
