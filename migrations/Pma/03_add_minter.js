const { MPC_ADDRESS } = require('../configurations/config');
const PumaPay = artifacts.require('PumaPay');

module.exports = async (deployer) => {
  try {
    const networkId = deployer.network_id.toString();

    const PMAContract = await PumaPay.at(addresses[networkId]['PumaPay']);

    // add mpc address as a minter
    await PMAContract.initVault(MPC_ADDRESS[networkId]);

  } catch (error) {
    console.log('error: ', error);
  }
};
