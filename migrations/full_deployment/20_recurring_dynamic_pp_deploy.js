const { saveAddress } = require('../scripts/saveAddress');

const name = 'RecurringDynamicPullPayment';
const Contract = artifacts.require(name);

module.exports = async (deployer) => {
	try {
		const networkId = deployer.network_id.toString();
		const addresses = require(`../configurations/${networkId}/Addresses.json`);

		await deployer.deploy(Contract, addresses[networkId]['Registry']);

		const contract = await Contract.deployed();

		console.log('RecurringDynamicPullPayment Address: ', contract.address);
		await saveAddress(name, contract.address, networkId);
	} catch (error) {
		console.log('error: ', error);
	}
};
