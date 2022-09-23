const { saveAddress } = require('../scripts/saveAddress');
const { TotalMintCapForWrapper, PumaPayWrapperAdmin } = require('../configurations/config');

const PMA = artifacts.require('PumaPayWrapper');

module.exports = async (deployer) => {
  try {
    const networkId = deployer.network_id.toString();
    const addresses = require(`../configurations/${networkId}/Addresses.json`);

    // enum TokenType {
    //   MintBurnAny, // mint and burn(address from, uint256 amount), don't need approve
    //   MintBurnFrom, // mint and burnFrom(address from, uint256 amount), need approve
    //   MintBurnSelf, // mint and burn(uint256 amount), call transferFrom first, need approve
    //   Transfer, // transfer and transferFrom, need approve
    //   TransferDeposit, // transfer and transferFrom, deposit and withdraw, need approve, block when lack of liquidity
    //   TransferDeposit2 // transfer and transferFrom, deposit and withdraw, need approve, don't block when lack of liquidity
    // }

    const TokenType = 2; // MintBurnSelf

    // PumaPayWrapper Token
    await deployer.deploy(PumaPayWrapper, addresses[networkId]['PumaPay'], TokenType, TotalMintCapForWrapper, PumaPayWrapperAdmin);
    const pmaWrapper = await PMA.deployed();

    await saveAddress('PumaPayWrapper', pmaWrapper.address, networkId);
  } catch (error) {
    console.log('error: ', error);
  }
};
