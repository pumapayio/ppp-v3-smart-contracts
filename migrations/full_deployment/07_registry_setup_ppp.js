const { getDeployedContract } = require("../libs/utils");

module.exports = async (deployer) => {
  try {
    const network_id = deployer.network_id.toString();
    const addresses = require(`../configurations/${network_id}/Addresses.json`);

    const registry = await getDeployedContract("Registry", artifacts);

    // register pullPaymentRegistry in main registry
    await registry.setAddressFor(
      "PullPaymentsRegistry",
      addresses[network_id]["PullPaymentsRegistry"]
    );
  } catch (error) {
    console.log("error: ", error);
  }
};
