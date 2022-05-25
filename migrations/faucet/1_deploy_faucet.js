const { saveAddress } = require('../../scripts/saveAddress');
const { faucets } = require('../../configurations/config');

const name = 'Faucet';
const Faucets = artifacts.require('Faucet');

module.exports = async (deployer) => {
	try {
		const networkId = deployer.network_id.toString();
		if (networkId === '97' || networkId === '1111') {
			let faucetList = [];
			let faucetAmountList = [];
			for (let faucet of faucets[networkId]) {
				faucetList.push(faucet.TokenAddress);
				faucetAmountList.push(faucet.Amount);
			}

			await deployer.deploy(Faucets, faucetList, faucetAmountList);

			const deployedContract = await Faucets.deployed();

			console.log('Faucet Address: ', deployedContract.address);

			await saveAddress(name, deployedContract.address, networkId);
		}
	} catch (error) {
		console.log('error: ', error);
	}
};
