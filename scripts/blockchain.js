// src/index.js
const fs = require("fs");
const Web3 = require("web3");
const { setupLoader } = require("@openzeppelin/contract-loader");

const HDWalletProvider = require("@truffle/hdwallet-provider");

const provider = new HDWalletProvider(
  "xxxxxxxxxxxx",
  "https://data-seed-prebsc-2-s2.binance.org:8545"
  //   "https://speedy-nodes-nyc.moralis.io/7543fe9c4f824d97e73a9a44/bsc/mainnet"
  // "https://speedy-nodes-nyc.moralis.io/5ae80a161b8aab3aa6a48767/bsc/mainnet"
  // `https://bsc-dataseed1.ninicoin.io/`
  // "https://bsc-dataseed.binance.org/"
  // https://bsc-dataseed1.ninicoin.io/
);

async function main() {
  // Set up web3 object
  const web3 = new Web3(provider);
  const loader = setupLoader({ provider: web3 }).web3;

  // Set up a web3 contract, representing a deployed ERC20, using the contract loader
  const contract = loader.fromArtifact(
    "PancakeRouter",
    "0xbfA5273765B9ac128974C15bd9812BD906b66840"
  );
  // testnet - 0x71e675AF27419a2D6BfE5c5E9aFaBe62dBE03989
  // mainnet - 0x2c3f816fB680Bbe745D085dC244CCf0737FcfB9A

  //   const accounts = await web3.eth.getAccounts();
  //   let nonce = await web3.eth.getTransactionCount(accounts[0]);
  //   console.log(nonce);
  //   nonce = await web3.eth.getTransactionCount(accounts[0], "pending");
  //   console.log(nonce);

  try {
    contract.methods
      .factory()
      .call()
      .then((res) => console.log(res))
      .catch((e) => console.log(e));
  } catch (e) {
    console.log(`Failed to get tx receipt. Reason: ${e.message}`);
  }

  // At termination, `provider.engine.stop()' should be called to finish the process elegantly.
  provider.engine.stop();
}

main().catch((e) => console.log(e));
