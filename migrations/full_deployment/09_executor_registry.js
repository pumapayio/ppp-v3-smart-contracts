const { getDeployedContract } = require("../libs/utils");
const { saveAddress } = require("../scripts/saveAddress");

module.exports = async (deployer, _networkName, _accounts) => {
  try {
    const network_id = deployer.network_id.toString();
    const addresses = require(`../configurations/${network_id}/Addresses.json`);

    // Register executor
    const registry = await getDeployedContract("Registry", artifacts);
    await registry.setAddressFor("Executor", addresses[network_id]["Executor"]);
  } catch (error) {
    console.log("error: ", error);
  }
};
