const { getDeployedContract } = require('../libs/utils');
const { keeperRegistry } = require('../../configurations/config');

module.exports = async (deployer) => {
  try {
    const networkId = deployer.network_id.toString();

    // Register executor
    const registry = await getDeployedContract('Registry', artifacts);
    await registry.setAddressFor('KeeperRegistry', keeperRegistry[networkId]);
  } catch (error) {
    console.log('error: ', error);
  }
};
