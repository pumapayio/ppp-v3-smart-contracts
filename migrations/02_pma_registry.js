const Registry = artifacts.require('Registry');

module.exports = async (deployer) => {
  try {
    const networkId = deployer.network_id.toString();
    const addresses = require(`../configurations/${networkId}/Addresses.json`);

    const registryContract = await Registry.at(addresses[networkId]['Registry']);

    await registryContract.setAddressFor('PMAToken', addresses[networkId]['PumaPay']);
  } catch (error) {
    console.log('error: ', error);
  }
};
