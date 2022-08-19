const { saveAddress } = require('../scripts/saveAddress');

const ADA = artifacts.require('BEP20Cardano');
const ETH = artifacts.require('BEP20Ethereum');
const PMA = artifacts.require('BEP20PMA');
const WBNB = artifacts.require('WBNB');

module.exports = async (deployer) => {
  try {
    const networkId = deployer.network_id.toString();

    await deployer.deploy(ADA);
    await deployer.deploy(ETH);
    await deployer.deploy(PMA);
    await deployer.deploy(WBNB);

    const adaContract = await ADA.deployed();
    const ethContract = await ETH.deployed();
    const pmaContract = await PMA.deployed();
    const wbnbContract = await WBNB.deployed();

    console.log('adaContract Address: ', adaContract.address);
    console.log('ethContract Address: ', ethContract.address);
    console.log('pmaContract Address: ', pmaContract.address);
    console.log('wbnbContract Address: ', wbnbContract.address);

    await saveAddress('BEP20Cardano', adaContract.address, networkId);
    await saveAddress('BEP20Ethereum', ethContract.address, networkId);
    await saveAddress('BEP20PMA', pmaContract.address, networkId);
    await saveAddress('WBNB', wbnbContract.address, networkId);

  } catch (error) {
    console.log('error: ', error);
  }
};