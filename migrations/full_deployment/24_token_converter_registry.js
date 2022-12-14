const { getRegistry } = require('../libs/utils');

module.exports = async (deployer) => {
  try {
    const networkId = deployer.network_id.toString();
    const addresses = require(`../configurations/${networkId}/Addresses.json`);

    // Register executor
    const registry = await getRegistry(networkId, artifacts);
    await registry.setAddressFor('TokenConverter', addresses[networkId]['TokenConverter']);
  } catch (error) {
    console.log('error: ', error);
  }
};
