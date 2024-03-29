// Load dependencies
const { web3 } = require('@openzeppelin/test-environment');
const { ether } = require('@openzeppelin/test-helpers');
const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const {
	PMATokenAddress,
	UniswapFactoryAddress,
	UniswapV2Router02Address,
	WBNB_ADDRESS,
	BUSD_ADDRESS,
	keeperRegistry,
} = require('../configurations/config');

const PMA = artifacts.require('BEP20PMA');
const WBNB = artifacts.require('WBNB');
const Factory = artifacts.require('PancakeFactory');
const RouterV2 = artifacts.require('PancakeRouter');
const Cardano = artifacts.require('BEP20Cardano');
const Ethereum = artifacts.require('BEP20Ethereum');
const Registry = artifacts.require('Registry');
const Executor = artifacts.require('Executor');
const PullPaymentRegistry = artifacts.require('PullPaymentsRegistry');
const RecurringPullPayment = artifacts.require('RecurringPullPayment');
const RecurringPPWithFreeTrial = artifacts.require('RecurringPullPaymentWithFreeTrial');
const RecurringPPWithPaidTrial = artifacts.require('RecurringPullPaymentWithPaidTrial');
const SinglePullPayment = artifacts.require('SinglePullPayment');
const SingleDynamicPullPayment = artifacts.require('SingleDynamicPullPayment');
const RecurringDynamicPullPayment = artifacts.require('RecurringDynamicPullPayment');
const TokenConverter = artifacts.require('TokenConverter');
const KeeperRegistryMock = artifacts.require('KeeperRegistryMock');

const oneMillionPMA = web3.utils.toWei('1000000', 'ether');

const deploySmartContracts = async (owner, customer, user, networkId) => {

	// Registry
	const registry = await deployProxy(Registry, [1000], { initializer: 'initialize' });

	// PullPayment Registry
	const ppRegistry = await deployProxy(PullPaymentRegistry, [], { initializer: 'initialize' });

	// RecurringPullPayment
	const recurringPP = await RecurringPullPayment.new(registry.address);

	// RecurringPullPayment
	const recurringPPWithFreeTrial = await RecurringPPWithFreeTrial.new(registry.address);

	// RecurringPullPaymentWithPaidTrial
	const recurringPPWithPaidTrial = await RecurringPPWithPaidTrial.new(registry.address);

	// SinglePullPayment
	const singlePullPayment = await SinglePullPayment.new(registry.address);

	// SingleDynamicPullPayment
	const singleDynamicPullPayment = await SingleDynamicPullPayment.new(registry.address);

	// RecurringDynamicPullPayment
	const recurringDynamicPullPayment = await RecurringDynamicPullPayment.new(registry.address);


	// BEP20 ADA Token
	const cardano = await Cardano.new({ from: owner });
	// BEP20 ETHEREUM Token
	const ethereum = await Ethereum.new({ from: owner });

	let PMAContract;
	let wbnb;
	let busd;
	let factory;
	let router;
	console.log('network ID: ', networkId);
	if (networkId == '1111' || networkId == '1') {
		// BEP20 PMA Token
		PMAContract = await PMA.new({ from: owner });
		wbnb = await WBNB.new();
		busd = await PMA.new();
		factory = await Factory.new(owner);
		router = await RouterV2.new(factory.address, wbnb.address);

		// Token balances -> Mint tokens for customer
		// TODO: Uncomment below once PMA token is in BSC
		await PMAContract.mint(customer, oneMillionPMA, { from: owner });
		await PMAContract.mint(user, oneMillionPMA, { from: owner });
	} else {
		PMAContract = await PMA.at(PMATokenAddress[networkId]);
		wbnb = await WBNB.at(WBNB_ADDRESS[networkId]);
		busd = await PMA.at(BUSD_ADDRESS[networkId]);
		factory = await Factory.at(UniswapFactoryAddress[networkId]);
		router = await RouterV2.at(UniswapFactoryAddress[networkId]);
	}

	// Registry Setup
	await registry.setAddressFor('PMAToken', PMAContract.address, { from: owner });
	await registry.setAddressFor('WrappedNative', wbnb.address, { from: owner });

	// network id 1 for coverage
	if (networkId == '1111' || networkId == '1') {
		await registry.setAddressFor('UniswapFactory', factory.address);
		await registry.setAddressFor('UniswapV2Router02', router.address);
	} else {
		await registry.setAddressFor('UniswapFactory', UniswapFactoryAddress[networkId]);
		await registry.setAddressFor('UniswapV2Router02', UniswapV2Router02Address[networkId]);
	}

	await registry.setAddressFor('PullPaymentsRegistry', ppRegistry.address);
	await registry.setAddressFor('KeeperRegistry', keeperRegistry[networkId], { from: owner });

	const tokenConverter = await TokenConverter.new(registry.address);
	await registry.setAddressFor('TokenConverter', tokenConverter.address, { from: owner });

	// update extension period
	await registry.updateExtensionPeriod('120');

	// Executor
	const executor = await Executor.new(registry.address);

	// Register Executor
	await registry.setAddressFor('Executor', executor.address, { from: owner });

	const balance = await PMAContract.balanceOf(customer);
	// Customer approves executor
	await PMAContract.approve(executor.address, balance, { from: customer });

	// add supported token
	await registry.addToken(PMAContract.address);
	await registry.addToken(ethereum.address);
	await registry.addToken(cardano.address);
	await registry.addToken(wbnb.address);
	await registry.addToken(busd.address);

	// Register pullpayment contract on pullPayment registry
	await ppRegistry.addPullPaymentContract('RecurringPullPayment', recurringPP.address, {
		from: owner
	});

	// Register pullpayment with free trial contract on pullPayment registry
	await ppRegistry.addPullPaymentContract(
		'RecurringPPWithFreeTrial',
		recurringPPWithFreeTrial.address
	);

	// Register pullpayment with paid trial contract on pullPayment registry
	await ppRegistry.addPullPaymentContract(
		'recurringPPWithPaidTrial',
		recurringPPWithPaidTrial.address
	);

	// Register single dynamic pullpayment contract on pullPayment registry
	await ppRegistry.addPullPaymentContract(
		'SingleDynamicPullPayment',
		singleDynamicPullPayment.address
	);

	// Register Recurring Dynamic pullpayment contract on pullPayment registry
	await ppRegistry.addPullPaymentContract(
		'RecurringDynamicPullPayment',
		recurringDynamicPullPayment.address,
		{
			from: owner
		}
	);

	// Register single pullpayment contract on pullPayment registry
	await ppRegistry.addPullPaymentContract('SinglePullPayment', singlePullPayment.address, {
		from: owner
	});


	const keeperRegistryContract = await KeeperRegistryMock.new(ethereum.address);
	await registry.setAddressFor('KeeperRegistry', keeperRegistryContract.address);
	await keeperRegistryContract.addFunds(1, ether('10'));
	await keeperRegistryContract.addFunds(2, ether('10'));
	await keeperRegistryContract.addFunds(3, ether('10'));
	await keeperRegistryContract.addFunds(4, ether('10'));

	await ppRegistry.setUpkeepId(recurringPP.address, 1);
	await ppRegistry.setUpkeepId(recurringPPWithFreeTrial.address, 2);
	await ppRegistry.setUpkeepId(recurringPPWithPaidTrial.address, 3);
	await ppRegistry.setUpkeepId(recurringDynamicPullPayment.address, 4);

	return {
		registry: {
			contract: registry,
			address: registry.address
		},
		ppRegistry: {
			contract: ppRegistry,
			address: ppRegistry.address
		},
		pmaToken: {
			contract: PMAContract,
			address: PMAContract.address
		},
		executor: {
			contract: executor,
			address: executor.address
		},
		singlePullPayment: {
			contract: singlePullPayment,
			address: singlePullPayment.address
		},
		singleDynamicPullPayment: {
			contract: singleDynamicPullPayment,
			address: singleDynamicPullPayment.address
		},
		recurringPP: {
			contract: recurringPP,
			address: recurringPP.address
		},
		recurringPPWithFreeTrial: {
			contract: recurringPPWithFreeTrial,
			address: recurringPPWithFreeTrial.address
		},
		recurringPPWithPaidTrial: {
			contract: recurringPPWithPaidTrial,
			address: recurringPPWithPaidTrial.address
		},
		recurringDynamicPullPayment: {
			contract: recurringDynamicPullPayment,
			address: recurringDynamicPullPayment.address
		},
		tokenConverter: {
			contract: tokenConverter,
			address: tokenConverter.address
		},
		cardano: {
			contract: cardano,
			address: cardano.address
		},
		ethereum: {
			contract: ethereum,
			address: ethereum.address
		},
		wbnb: {
			contract: wbnb,
			address: wbnb.address
		},
		busd: {
			contract: busd,
			address: busd.address
		},
		router: {
			contract: router,
			address: router.address
		},
		factory: {
			contract: factory,
			address: factory.address
		}
	};
};

const getDeployedContract = async (contractName, artifacts) => {
	const Contract = artifacts.require(contractName);
	const contract = await Contract.deployed();

	return Contract.at(contract.address);
};

const getRegistry = async (networkId, artifacts) => {
	const Contract = artifacts.require('Registry');
	const addresses = require(`../configurations/${networkId}/Addresses.json`);

	return await Contract.at(addresses[networkId]['Registry']);
};

const getPPRegistry = async (networkId, artifacts) => {
	const Contract = artifacts.require('PullPaymentsRegistry');
	const addresses = require(`../configurations/${networkId}/Addresses.json`);

	return await Contract.at(addresses[networkId]['PullPaymentsRegistry']);
};

module.exports = {
	deploySmartContracts,
	getDeployedContract,
	getRegistry,
	getPPRegistry
};
