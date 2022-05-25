const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const { saveAddress } = require("../scripts/saveAddress");

const pullPaymentRegistryName = "PullPaymentsRegistry";
const pullPaymentRegistryContract = artifacts.require(pullPaymentRegistryName);

module.exports = async (deployer) => {
  try {
    const network_id = deployer.network_id.toString();

    // deploy pullPaymentRegistry contract
    const pullPaymentRegistryDeployed = await deployProxy(
      pullPaymentRegistryContract,
      [],
      {
        initializer: "initialize",
      }
    );

    console.log(
      "PullPaymentRegistry Address: ",
      pullPaymentRegistryDeployed.address
    );

    await saveAddress(
      pullPaymentRegistryName,
      pullPaymentRegistryDeployed.address,
      network_id
    );
  } catch (error) {
    console.log("error: ", error);
  }
};
