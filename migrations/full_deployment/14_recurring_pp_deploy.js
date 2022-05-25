const { deployProxy } = require('@openzeppelin/truffle-upgrades');
const { saveAddress } = require('../scripts/saveAddress');

const name = 'RecurringPullPayment';
const Contract = artifacts.require(name);

module.exports = async (deployer) => {
	try {
		const networkId = deployer.network_id.toString();
		const addresses = require(`../configurations/${networkId}/Addresses.json`);

		const contract = await deployProxy(Contract, [addresses[networkId]['Registry']], {
			initializer: 'initialize'
		});

		console.log('RecurringPullPayment Address: ', contract.address);
		await saveAddress(name, contract.address, networkId);
	} catch (error) {
		console.log('error: ', error);
	}
};
