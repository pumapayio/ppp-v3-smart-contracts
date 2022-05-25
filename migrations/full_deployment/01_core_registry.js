const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const { saveAddress } = require("../scripts/saveAddress");
const {
  ExecutionFeeReceiver,
  ExecutionFee,
} = require("../configurations/config");

const name = "Registry";
const Registry = artifacts.require("Registry");

module.exports = async (deployer, network, accounts) => {
  try {
    const network_id = deployer.network_id.toString();
    
    // deploy Registry Contract
    const registryDeployed = await deployProxy(
      Registry,
      [ExecutionFeeReceiver, ExecutionFee],
      {
        initializer: "initialize",
      }
    );

    console.log("Registry Address: ", registryDeployed.address);

    await saveAddress(name, registryDeployed.address, network_id);
  } catch (error) {
    console.log("error: ", error);
  }
};
