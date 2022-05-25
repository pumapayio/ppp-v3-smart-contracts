const { saveAddress } = require("../../scripts/saveAddress");
const { faucets } = require("../../configurations/config");

const name = "Faucet";
const Faucets = artifacts.require("Faucet");

module.exports = async (deployer, network, accounts) => {
  try {
    const network_id = deployer.network_id.toString();
    if (network_id === "97" || network_id === "1111") {
      let faucetList = [];
      let faucetAmountList = [];
      for (let faucet of faucets[network_id]) {
        faucetList.push(faucet.TokenAddress);
        faucetAmountList.push(faucet.Amount);
      }

      await deployer.deploy(Faucets, faucetList, faucetAmountList);

      const deployedContract = await Faucets.deployed();

      console.log("Faucet Address: ", deployedContract.address);

      await saveAddress(name, deployedContract.address, network_id);
    }
  } catch (error) {
    console.log("error: ", error);
  }
};
