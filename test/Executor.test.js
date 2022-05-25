// Load dependencies

const {deploySmartContracts, getDeployedContract} = require('../libs/utils');
const {expect} = require('chai');
require('chai').should();
const {timeTravel} = require('./helpers/timeHelper');

const {MaxUint256} = require('@ethersproject/constants');
const {web3} = require('@openzeppelin/test-environment');

const {expectEvent, expectRevert} = require('@openzeppelin/test-helpers');

const BlockData = artifacts.require('BlockData');
// Start test block
contract.skip('Executor', (accounts) => {
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

	before(async () => {
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
		ethToken = contracts.ethereum.contract;
		adaToken = contracts.cardano.contract;

		console.log(
			'ETH Balance for ...',
			customer,
			web3.utils.fromWei(String(await ethToken.balanceOf(customer)))
		);
		await ethToken.approve(executor.address, MaxUint256, {from: customer});
		await adaToken.approve(executor.address, MaxUint256, {from: customer});
		await pmaToken.approve(executor.address, MaxUint256, {from: customer});

		//recurringPP contract
		this.contract = contracts.recurringPP.contract;
		billingModel.token = contracts.pmaToken.address; //adaToken.address; //contracts.pmaToken.address;
	});

	describe('Executor', () => {
		before(async () => {
			//crete billing model
			await this.contract.createBillingModel(
				billingModel.payee,
				billingModel.name,
				billingModel.amount,
				billingModel.token,
				billingModel.frequency,
				billingModel.numberOfPayments,
				{from: merchant}
			);

			this.bmType = await this.contract.getBillingModelIdsByAddress(merchant);
			console.log('billing model IDs', this.bmType.toString());

			await pmaToken.mint(customer, '1000000000000000000000000', {
				from: owner
			});
		});

		it('should subscribe to model and execute the transafer correctly', async () => {
			//pmaToken -> pmaToken swap
			const x = await this.contract.subscribeToBillingModel(1, pmaToken.address, {
				from: customer
			});

			await expectEvent(x, 'NewSubscription');
		});

		it('should execute a pullPayment correctly', async () => {
			//pmaToken -> pmaToken swap
			const x = await this.contract.subscribeToBillingModel(1, pmaToken.address, {
				from: customer
			});

			//incrase time by frequency
			await timeTravel(billingModel.frequency + 600);

			//execute the pullPayment
			const tx = await executor.execute('RecurringPullPayment', 1);

			await expectRevert(
				executor.execute('RecurringPullPayment', 1),
				'RecurringPullPayment: INVALID_EXECUTION_TIME'
			);

			await expectRevert(
				executor.execute('SinglePullPayment', 1),
				'PullPaymentRegistry: IDENTIFIER_NOT_REGISTERED'
			);

			await expectRevert(
				executor.execute('RecurringPullPayment', 5),
				'RecurringPullPayment: INVALID_SUBSCRIPTION_ID'
			);
		});
	});
});
