const { getDeployedContract } = require("../libs/utils");
const { saveAddress } = require("../scripts/saveAddress");
const { UniswapFactoryAddress } = require("../configurations/config");

module.exports = async (deployer, _networkName, _accounts) => {
  try {
    const network_id = deployer.network_id.toString();
    const registryContract = await getDeployedContract("Registry", artifacts);

    await registryContract.setAddressFor(
      "UniswapFactory",
      UniswapFactoryAddress[network_id]
    );

    await saveAddress(
      "UniswapFactory",
      UniswapFactoryAddress[network_id],
      network_id
    );
  } catch (error) {
    console.log("error: ", error);
  }
};
