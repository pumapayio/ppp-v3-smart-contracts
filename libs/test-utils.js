// Load dependencies
const { web3 } = require('@openzeppelin/test-environment');

const oneMillionPMA = web3.utils.toWei('1000000', 'ether');

// Testnet // TODO: Check on the testnet addresses...
const UniswapFactoryAddressT = '0x2b95AF02397FC36967E816eA09c84F665c464e3b';
const UniswapV2PairAddressT = '0xe4546b4001207117dfa2b566dc1930074939dc45';
const UniswapV2Router02AddressT = '0x0dde06f3440e585c01f015e6e7568d84505e8429';

const deploySmartContracts = async (owner, merchant, customer, user) => {
	// Registry
	const Registry = artifacts.require('Registry');
	const registry = await Registry.new({ from: owner });
	await registry.initialize({ from: owner });

	// PullPayment Registry
	const PullPaymentRegistry = artifacts.require('PullPaymentsRegistry');
	const ppRegistry = await PullPaymentRegistry.new({ from: owner });
	await ppRegistry.initialize({ from: owner });

	// RecurringPullPayment
	const RecurringPullPayment = artifacts.require('RecurringPullPayment');
	const recurringPP = await RecurringPullPayment.new({ from: owner });
	await recurringPP.initialize(registry.address, { from: owner });

	// RecurringPullPayment
	const RecurringPPWithFreeTrial = artifacts.require('RecurringPullPaymentWithFreeTrial');
	const recurringPPWithFreeTrial = await RecurringPPWithFreeTrial.new({ from: owner });
	await recurringPPWithFreeTrial.initialize(registry.address, { from: owner });
	// RecurringPullPaymentWithPaidTrial
	const RecurringPPWithPaidTrial = artifacts.require('RecurringPullPaymentWithPaidTrial');
	const recurringPPWithPaidTrial = await RecurringPPWithPaidTrial.new({ from: owner });
	await recurringPPWithPaidTrial.initialize(registry.address, { from: owner });
	// SinglePullPayment
	const SinglePullPayment = artifacts.require('SinglePullPayment');
	const singlePullPayment = await SinglePullPayment.new({ from: owner });
	await singlePullPayment.initialize(registry.address, { from: owner });
	// SingleDynamicPullPayment
	const SingleDynamicPullPayment = artifacts.require('SingleDynamicPullPayment');
	const singleDynamicPullPayment = await SingleDynamicPullPayment.new({ from: owner });
	await singleDynamicPullPayment.initialize(registry.address, { from: owner });
	// RecurringDynamicPullPayment
	const RecurringDynamicPullPayment = artifacts.require('RecurringDynamicPullPayment');
	const recurringDynamicPullPayment = await RecurringDynamicPullPayment.new({ from: owner });
	await recurringDynamicPullPayment.initialize(registry.address, { from: owner });

	// BEP20 ADA Token
	const Cardano = artifacts.require('BEP20Cardano');
	const cardano = await Cardano.new({ from: owner });

	// BEP20 ETHEREUM Token
	const Ethereum = artifacts.require('BEP20Ethereum');
	const ethereum = await Ethereum.new({ from: owner });

	// TODO: We are using CAKE as the PMA token for the mainnet test at the moment - Need to change this once we have the PMA token to BSC
	// PMAToken
	const PMAToken = artifacts.require('PMAToken');
	const token = await PMAToken.new(registry.address, 'PumaPay', 'PMA', {
		from: owner
	});

	// // Cake Token
	// const CakeToken = artifacts.require("CakeToken");
	// const token = await CakeToken.at(CAKE_ADDRESS);
	// token.address = CAKE_ADDRESS;

	// Executor
	const Executor = artifacts.require('Executor');
	const executor = await Executor.new({ from: owner });

	// Registry Setup
	registry.setAddressFor('PMAToken', token.address, { from: owner });
	registry.setAddressFor('Executor', executor.address, { from: owner });
	registry.setAddressFor('UniswapFactory', UniswapFactoryAddressT);
	registry.setAddressFor('UniswapV2Pair', UniswapV2PairAddressT);
	registry.setAddressFor('UniswapV2Router02', UniswapV2Router02AddressT);

	await executor.initialize(registry.address, ppRegistry.address, {
		from: owner
	});

	// Register pullpayment contract on pullPayment registry
	await ppRegistry.addPullPaymentContract('RecurringPullPayment', recurringPP.address, {
		from: owner
	});

	// Register pullpayment with free trial contract on pullPayment registry
	await ppRegistry.addPullPaymentContract;
	'RecurringPPWithFreeTrial',
		recurringPPWithFreeTrial.address,
		// Register pullpayment with paid trial contract on pullPayment registry
		await ppRegistry.addPullPaymentContract;
	'recurringPPWithPaidTrial',
		recurringPPWithPaidTrial.address,
		// Register single dynamic pullpayment contract on pullPayment registry
		await ppRegistry.addPullPaymentContract;
	'SingleDynamicPullPayment',
		singleDynamicPullPayment.address,
		// Register Recurring Dynamic pullpayment contract on pullPayment registry
		await ppRegistry.addPullPaymentContract(
			'RecurringDynamicPullPayment',
			recurringDynamicPullPayment.address,
			{
				from: owner
			}
		);

	// Token balances -> Mint tokens for customer
	// TODO: Uncomment below once PMA token is in BSC
	await token.mint(customer, oneMillionPMA, { from: owner });
	await token.mint(user, oneMillionPMA, { from: owner });
	const balance = await token.balanceOf(customer);
	// Customer approves executor
	await token.approve(executor.address, balance, { from: customer });

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
			contract: token,
			address: token.address
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
		cardano: {
			contract: cardano,
			address: cardano.address
		},
		ethereum: {
			contract: ethereum,
			address: ethereum.address
		}
	};
};

const getDeployedContract = async (contractName, artifacts) => {
	const Contract = artifacts.require(contractName);
	const contract = await Contract.deployed();

	return Contract.at(contract.address);
};

module.exports = {
	deploySmartContracts,
	getDeployedContract
};
