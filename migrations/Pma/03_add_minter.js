const { MPC_ADDRESS } = require('../configurations/config');
const PMA = artifacts.require('MultichainPMA');

module.exports = async (deployer) => {
  try {
    const networkId = deployer.network_id.toString();

    const PMAContract = await PMA.at(addresses[networkId]['MultichainPMA']);

    // add mpc address as a minter
    await PMAContract.initVault(MPC_ADDRESS[networkId]);

  } catch (error) {
    console.log('error: ', error);
  }
};
