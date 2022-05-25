const { getDeployedContract } = require("../libs/utils");
const { saveAddress } = require("../scripts/saveAddress");
const { UniswapV2Router02Address } = require("../configurations/config");

module.exports = async (deployer, _networkName, _accounts) => {
  try {
    const network_id = deployer.network_id.toString();
    const registryContract = await getDeployedContract("Registry", artifacts);

    await registryContract.setAddressFor(
      "UniswapV2Router02",
      UniswapV2Router02Address[network_id]
    );

    await saveAddress(
      "UniswapV2Router02",
      UniswapV2Router02Address[network_id],
      network_id
    );
  } catch (error) {
    console.log("error: ", error);
  }
};
