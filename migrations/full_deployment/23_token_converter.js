const { saveAddress } = require('../scripts/saveAddress');
const { getRegistry } = require('../libs/utils');
const { keeperRegistry } = require('../configurations/config');

const name = 'TokenConverter';
const Contract = artifacts.require(name);

module.exports = async (deployer) => {
  try {
    const networkId = deployer.network_id.toString();
    const addresses = require(`../configurations/${networkId}/Addresses.json`);

    const registry = await getRegistry(networkId, artifacts);
    await registry.setAddressFor('KeeperRegistry', keeperRegistry[networkId]);

    await deployer.deploy(Contract, addresses[networkId]['Registry']);
    const contract = await Contract.deployed();

    console.log('TokenConverter Address: ', contract.address);
    await saveAddress(name, contract.address, networkId);
  } catch (error) {
    console.log('error: ', error);
  }
};
