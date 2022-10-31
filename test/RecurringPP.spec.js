// Load dependencies

const { deploySmartContracts } = require('../libs/utils');
require('chai').should();

const { MaxUint256 } = require('@ethersproject/constants');

// Load compiled artifacts

const ADAToken = artifacts.require('BEP20Cardano');
const ETHToken = artifacts.require('BEP20Ethereum');

const ADA_ADDRESS = '0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47';
const ETH_ADDRESS = '0x2170ed0880ac9a755fd29b2688956bd959f933f8';

const BlockData = artifacts.require('BlockData');
// Start test block
contract.skip('RecurringPullPayment', (accounts) => {
	let [owner, merchant, customer, user] = accounts;

	const billingModel = {
		payee: merchant,
		name: web3.utils.padRight(web3.utils.fromAscii('some name'), 64),
		amount: '15', // web3.utils.toWei("15", "ether"),
		frequency: 600, // 10 minutes
		numberOfPayments: 5
	};

	let contracts = {};
	let pmaToken = {};
	let ethToken = {};
	let adaToken = {};
	let executor = {};
	let fundRceiver;

	beforeEach(async () => {
		this.BlockData = await BlockData.new();
		this.chainId = await this.BlockData.getChainId();

		// Deploy a set of smart contracts...
		contracts = await deploySmartContracts(
			owner,
			merchant,
			customer,
			user,
			this.chainId.toString()
		);
		executor = contracts.executor.contract;

		pmaToken = contracts.pmaToken.contract;
		ethToken = await ETHToken.at(ETH_ADDRESS);
		adaToken = await ADAToken.at(ADA_ADDRESS);
		fundRceiver = contracts.tokenConverter.address;

		const importedAccount = await web3.eth.personal.importRawKey(
			'0x6b6194405ccbda230dc4bde23889b0cffc1b8874567033b5f275460d2d18e40f',
			''
		);
		customer = importedAccount;
		await web3.eth.personal.unlockAccount(importedAccount, '', 1000000000000000000);

		console.log(
			'ETH Balance for ...',
			customer,
			web3.utils.fromWei(String(await ethToken.balanceOf(customer)))
		);
		await ethToken.approve(executor.address, MaxUint256, { from: customer });
		await adaToken.approve(executor.address, MaxUint256, { from: customer });
		await pmaToken.approve(executor.address, MaxUint256, { from: customer });

		this.contract = contracts.recurringPP.contract;
		billingModel.token = adaToken.address; // contracts.pmaToken.address;
	});

	// it('should create a Billing Model', async () => {});

	// it('should return the version of the smart contract', async () => {
	//     const version = await this.contract.getVersionNumber();
	//     // TODO: Actual validation on the version
	//     expect(true).to.eql(true);
	// });

	// Test case
	it('should create a Billing Model', async () => {
		console.log(billingModel);
		await this.contract.createBillingModel(
			billingModel.payee,
			billingModel.name,
			billingModel.amount,
			billingModel.token,
			billingModel.frequency,
			billingModel.numberOfPayments,
			{ from: merchant }
		);
		await this.contract.createBillingModel(
			billingModel.payee,
			billingModel.name,
			billingModel.amount,
			billingModel.token,
			billingModel.frequency,
			billingModel.numberOfPayments,
			{ from: merchant }
		);

		console.log('merchant', merchant);
		console.log('pp contract', this.contract.address);
		console.log('pma contract', pmaToken.address);
		console.log('Executor', executor.address);
		// Test if the returned value is the same one
		const x = await this.contract.getBillingModel(1);
		const y = await this.contract.getBillingModel(1, ethToken.address);
		// const z = await this.contract.getBillingModel(1, adaToken.address);
		console.log('billing model details', x);
		console.log('billing model details - Y ->', y);
		// console.log("billing model details - Z ->", z);

		const b = await this.contract.getBillingModelIdsByAddress(merchant);
		console.log('billing model IDs', b);
		// TODO: Fully test the expected behaviour..
		// Note that we need to use strings to compare the 256 bit integers
		// expect((await this.contract.getBillingModel(1)).toString()).to.equal('42');
	});

	it('should allow a customer to subscribe to a Billing Model', async () => {
		// const customerBefore = await pmaToken.balanceOf(customer);
		// const merchantBefore = await pmaToken.balanceOf(merchant);
		// console.log(String(customerBefore));
		// console.log(String(merchantBefore));
		await this.contract.createBillingModel(
			billingModel.payee,
			billingModel.name,
			billingModel.amount,
			billingModel.token,
			billingModel.frequency,
			billingModel.numberOfPayments,
			{ from: merchant }
		);

		const customerEthBefore = await ethToken.balanceOf(customer);
		const customerEthAllowance = await ethToken.allowance(customer, executor.address);
		const merchantEthBefore = await ethToken.balanceOf(merchant);
		console.log('customerEthAllowance', String(customerEthAllowance));
		console.log('customerEthBefore', String(customerEthBefore));
		console.log('merchantEthBefore', String(merchantEthBefore));
		const customerAdaBefore = await adaToken.balanceOf(customer);
		const merchantAdaBefore = await adaToken.balanceOf(merchant);
		console.log('customerAdaBefore', String(customerAdaBefore));
		console.log('merchantAdaBefore', String(merchantAdaBefore));

		// const x = await this.contract.subscribeToBillingModel(1, adaToken.address, {
		const x = await this.contract.subscribeToBillingModel(1, ethToken.address, {
			from: customer
		});
		console.log(x);
		await this.contract.getSubscription(1);

		// const customerAfter = await pmaToken.balanceOf(customer);
		// const merchantAfter = await pmaToken.balanceOf(merchant);
		// console.log(String(customerAfter));
		// console.log(String(merchantAfter));

		it('should return the details of a pull payment', async () => {
			const x = await this.contract.getPullPayment(1);
			console.log(x);
			const customerEthAfter = await ethToken.balanceOf(customer);
			const merchantEthAfter = await ethToken.balanceOf(merchant);
			console.log('customerEthAfter', String(customerEthAfter));
			console.log('merchantEthAfter', String(merchantEthAfter));
			const customerAdaAfter = await adaToken.balanceOf(customer);
			const merchantAdaAfter = await adaToken.balanceOf(merchant);
			console.log('customerAdaAfter', String(customerAdaAfter));
			console.log('merchantAdaAfter', String(merchantAdaAfter));
		});

		it('should allow the cancellation of a pull payment', async () => {
			await this.contract.cancelSubscription(1);
			const subscription = await this.contract.getSubscription(1);
			console.log(subscription);
		});

		it('should return the details of a pull payment', async () => {
			const x = await this.contract.getPullPayment(1);
			console.log(x);
		});
	});
});
