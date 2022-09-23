const { saveAddress } = require('../scripts/saveAddress');
const { MPC_ADDRESS } = require('../configurations/config');
const { ZERO_ADDRESS } = require('@openzeppelin/test-helpers/src/constants');

const PumaPay = artifacts.require('PumaPay');

module.exports = async (deployer) => {
  try {
    const networkId = deployer.network_id.toString();

    // AnyswapV6ERC20 PMA Token
    await deployer.deploy(PumaPay, 'PMA Token', 'PMA', '18', ZERO_ADDRESS, MPC_ADDRESS[networkId]);
    const PMAContract = await PumaPay.deployed();

    await saveAddress('PumaPay', PMAContract.address, networkId);
  } catch (error) {
    console.log('error: ', error);
  }
};
