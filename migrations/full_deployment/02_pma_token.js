const { saveAddress } = require('../scripts/saveAddress');
const { PMATokenAddress, WBNB_ADDRESS } = require('../configurations/config');

const PMA = artifacts.require('BEP20PMA');
const WBNB = artifacts.require('WBNB');

const Registry = artifacts.require('Registry');

module.exports = async (deployer) => {
	try {
		let PMAContract;
		let WBNBContract;
		const networkId = deployer.network_id.toString();
		const addresses = require(`../configurations/${networkId}/Addresses.json`);



		if (networkId == '1111') {
			// BEP20 PMA Token
			PMAContract = await PMA.new();
			WBNBContract = await WBNB.new();
		} else {
			PMAContract = await PMA.at(PMATokenAddress[networkId]);
			WBNBContract = await WBNB.at(WBNB_ADDRESS[networkId]);
		}

		const registryContract = await Registry.at(addresses[networkId]['Registry']);

		await registryContract.setAddressFor('PMAToken', PMAContract.address);
		await registryContract.setAddressFor('WrappedNative', WBNBContract.address);

		await saveAddress('BEP20PMA', PMAContract.address, networkId);
	} catch (error) {
		console.log('error: ', error);
	}
};
