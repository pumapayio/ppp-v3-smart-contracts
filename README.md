# Pull Payment Protocol V3

[![Docs](https://img.shields.io/badge/docs-%F0%9F%93%84-blue)](https://docs.openzeppelin.com/contracts)
[![built-with openzeppelin](https://img.shields.io/badge/built%20with-OpenZeppelin-3677FF)](https://docs.openzeppelin.com/)
![Coverage](./coverage_badge.svg)

## Intro

This is the repository with the Proof of Concept of the Pull Payment Protocol V3. It includes smart contracts, Decentralized Application (
DApp) Backend and Off-chain service which are required for the whole system to run.

## Prerequisites

1. [NodeJS](https://nodejs.org/en/download/)
   > Once you’re done, run node --version on a terminal to check your installation: any version of the 10.x or 12.x line should be compatible with most Ethereum software.
2. The rest of the stuff should come through the `package.json` as dev dependencies.
   > If something is missing, please add to the `package.json` and update README accordingly!

## Repository Structure

The root of the repository includes whatever is required for the smart contracts development, testing and migration/deployments. The actual
smart contracts can be found in `./contracts` and their corresponding tests can be found in `./tests`.

In `./scripts` you can find some useful scripts for running the tests or starting a local ganache instance.

## Smart Contracts Setup

First, you need to duplicate the `secrets.example.json` as `secrets.json` and add a seed phrase which will be used for the smart contract development. You can
use the one provided, no worries. You can get a new seed phrase [here](https://iancoleman.io/bip39/).

The below should run from the root dir and in the order specified above, i.e. start local ganache,
compile smart contracts and run the tests.

##### To install smart contact dependencies:

```shell
  # from root dir
  yarn install
  # OR
  npm install
```

##### To start the local ganache:

```shell
  # for plain blockchain
  yarn run ganache
  # OR for TestNet Fork
  yarn run ganache_test
  # OR for MainNet Fork
  yarn run ganache_main
```

_Info on local blockchain forking using ganache-cli [here](https://github.com/trufflesuite/ganache-cli#options)_

##### To compile the smart contracts:

```shell
  npx truffle compile
```

##### To run the tests:

```shell
  yarn run test
  # OR
  npm run test
  # OR
  ./scripts/test.sh
```

## Verify Contracts

To verify contracts on test network following command can be used-

```bash
npm run verify_test CONTRACT_NAME@CONTRACT_ADDDRESS
```

To verify contracts on main network following command can be used-

```bash
npm run verify_main CONTRACT_NAME@CONTRACT_ADDDRESS
```
