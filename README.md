# Pull Payment Protocol V3

[![Docs](https://img.shields.io/badge/docs-%F0%9F%93%84-blue)](https://docs.openzeppelin.com/contracts)
[![built-with openzeppelin](https://img.shields.io/badge/built%20with-OpenZeppelin-3677FF)](https://docs.openzeppelin.com/)
![Coverage](https://raw.githubusercontent.com/la-cucina/la-cucina-contracts/master/coverage_badge.svg)

## Intro

This is the repository with the Proof of Concept of the Pull Payment Protocol V3. It includes smart contracts, Decentralized Application (
DApp) Backend and Off-chain service which are required for the whole system to run.

## Prerequisites

1. [NodeJS (v10 or v12)](https://nodejs.org/en/download/)
   > Once you’re done, run node --version on a terminal to check your installation: any version of the 10.x or 12.x line should be compatible with most Ethereum software.
2. The rest of the stuff should come through the `package.json` as dev dependencies.
   > If something is missing, please add to the `package.json` and update README accordingly!

## Repository Structure

The root of the repository includes whatever is required for the smart contracts development, testing and migration/deployments. The actual
smart contracts can be found in `./contracts` and their corresponding tests can be found in `./tests`.

In `./scripts` you can find some useful scripts for running the tests or starting a local ganache instance.

The dApp can be found in `./dapp` dir. It is a React application, which is developed based on the
[BscSwap interface](https://github.com/bscswap/bscswap-interface) (similar to Uniswap, but on Binance Smart Chain).

A `./service` dir is missing, which will include the off-chain component which will be responsible for monitoring the blockchain, store pull
payments for future execution and trigger their execution. The service will be developed using NestJS - same as with the existing PP
Services.

## Smart Contracts Setup

First, you need to duplicate the `secrets.example.json` as `secrets.json` and add a seed phrase which will be used for the smart contract development. You can
use the one provided, no worries. You can get a new seed phrase [here](https://iancoleman.io/bip39/).

The below should run from the root dir and in the order specified above, i.e. start local ganache,
compile smart contracts and run the tests.

> **If there updates on the smart contracts, then the following process need to be
> followed again in order to get the latest and updated version.**

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

## DApp Start

For DApp Development, you need to navigate to `./dapp` and install the dependencies there:

```shell
  yarn install
```

##### Dapp Setup

In order for the DApp to work, you need to provide some smart contract addresses as env variables in
`./dapp/.env` file.

```shell
REACT_APP_RECURRING_PP_SC_ADDRESS_TESTNET=""
REACT_APP_PMA_TOKEN_SC_ADDRESS_TESTNET=""
REACT_APP_EXECUTOR_SC_ADDRESS_TESTNET=""
REACT_APP_RECURRING_PP_SC_ADDRESS_MAINNET=""
REACT_APP_PMA_TOKEN_SC_ADDRESS_MAINNET=""
REACT_APP_EXECUTOR_SC_ADDRESS_MAINNET=""
REACT_APP_NETWORK_URL="http://localhost:8545" //since we are using a local ganache instance
```

You will be able to obtain those values by following the Smart Contracts Setup guide.
By running those steps, from the test command you'll get the following in the console

```shell
pp contract 0x0a63faf18e0F191AE11579Bc28551fcb39BA095A
pma contract 0x48B4CAacD6A9AdA88d0Ade7572e32CeE92729019
Executor 0x7f5883A08169F8fCdc35BdeA9cA8a598356B1036
```

you can use the above addresses for the `.env` configuration of the DApp.

```shell
   yarn start
   # app will run on localhost:3000
```

### Smart Contract Updates

If there are any smart contract updates, then the process as described in the respective
section must be followed. In addition to that, and for the smart contracts to be updated
within the Dapp as well, then the new smart contracts ABI should be copied in the
Dapp.

To do that you need to:

1. Copy the ABI from `./build/contracts/<SMART_CONTRACT>.json` - you need ONLY the `abi` key!!
2. Paste the ABI to the `./dapp/src/constants/contracts/<SMART_CONTRACT>/<SMART_CONTRACT>.json`
3. Make sure you update the smart contarct address that can be found in `./dapp/src/constants/contracts/<SMART_CONTRACT>/<SMART_CONTRACT>.ts`

### Metamask Setup - Local Network

You need to setup your Metamask to work with the local blockchain provided through ganache-cli.
To do so, you need to add a new local network, which will point to your localhost.

**Chain ID**

- 97 for Testnet fork
- 56 for Mainnet fork
- find chainID if you start a local plain blockchain network

![img.png](imgs/metamask.png)

> NOTE: The local ganache is a fork of either BSC Mainnet or TestNet, therefore any
> assets held on those chain will be reflected there

> NOTE 2: Eventually, there won't be a need to deploy smart contracts for using the Dapp
> since those smart contracts will be deployed on Mainnet or Testnet.

## Blockchain Monitor Service (v2.0-alpha) (Backend)

This service acts as backend and monitors the contract events to trigger and execute pull payments.

## Installation

```bash
$ yarn install
```

## Running the app

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Running With Docker

```bash
docker-compose build
docker-compose up -d
```

This will start the backend nestJS service in watch mode and also start redis and postgres.
The backend service runs on port **5000**

## Creating and Running Migrations

### Generating Migrations

Whenever we have some db changes in place, we will need to add the respective migration scripts.
The migrations can be generated by the following command -

```bash
yarn run typeorm:generate {enterAnyNameForMigrationFile}
```

P.S. Make sure that the db syncronization in the configuration is set to false.

### Running the Migrations

We can apply the added migrations present in src/migrations/\*.ts
The following command can be used -

```bash
yarn run typeorm:run
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
