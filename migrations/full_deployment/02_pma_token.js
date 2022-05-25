const { getDeployedContract } = require('../libs/utils');
const { saveAddress } = require('../scripts/saveAddress');
const { PMATokenAddress } = require('../configurations/config');

const PMA = artifacts.require('BEP20PMA');

module.exports = async (deployer) => {
	try {
		let PMAContract;
		const networkId = deployer.network_id.toString();
		if (networkId == '1111') {
			// BEP20 PMA Token
			PMAContract = await PMA.new();
		} else {
			PMAContract = await PMA.at(PMATokenAddress[networkId]);
		}

		const registryContract = await getDeployedContract('Registry', artifacts);
		await registryContract.setAddressFor('PMAToken', PMAContract.address);

		await saveAddress('BEP20PMA', PMAContract.address, networkId);
	} catch (error) {
		console.log('error: ', error);
	}
};
