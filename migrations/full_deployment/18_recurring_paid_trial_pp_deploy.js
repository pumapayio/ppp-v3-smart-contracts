const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const { saveAddress } = require("../scripts/saveAddress");

const name = "RecurringPullPaymentWithPaidTrial";
const Contract = artifacts.require(name);

module.exports = async (deployer, _networkName, _accounts) => {
  try {
    const network_id = deployer.network_id.toString();
    const addresses = require(`../configurations/${network_id}/Addresses.json`);

    const contract = await deployProxy(
      Contract,
      [addresses[network_id]["Registry"]],
      {
        initializer: "initialize",
      }
    );

    console.log(
      "RecurringPullPaymentWithPaidTrial Address: ",
      contract.address
    );
    await saveAddress(name, contract.address, network_id);
  } catch (error) {
    console.log("error: ", error);
  }
};
