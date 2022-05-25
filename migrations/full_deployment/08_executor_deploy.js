const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const { saveAddress } = require("../scripts/saveAddress");

const name = "Executor";
const ExecutorContract = artifacts.require(name);

module.exports = async (deployer, _networkName, _accounts) => {
  try {
    const network_id = deployer.network_id.toString();
    const addresses = require(`../configurations/${network_id}/Addresses.json`);

    const executorDeployed = await deployProxy(
      ExecutorContract,
      [addresses[network_id]["Registry"]],
      {
        initializer: "initialize",
      }
    );

    console.log("Executor Address: ", executorDeployed.address);
    await saveAddress(name, executorDeployed.address, network_id);
  } catch (error) {
    console.log("error: ", error);
  }
};
