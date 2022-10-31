// Load dependencies
const { deploySmartContracts } = require('../libs/utils');
const { expect } = require('chai');
const { MaxUint256 } = require('@ethersproject/constants');
const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { BN } = require('@openzeppelin/test-helpers/src/setup');
const { web3 } = require('@openzeppelin/test-environment');
const { ZERO_ADDRESS } = require('@openzeppelin/test-helpers/src/constants');
const { getGasCost } = require('./helpers/gasCost');

const BlockData = artifacts.require('BlockData');
// Start test block
contract('SingleDynamicPullPayment', (accounts) => {
	let [owner, merchant, customer, user] = accounts;
	const name = web3.utils.padRight(web3.utils.fromAscii('some name'), 64);

	const billingModel = {
		payee: merchant,
		merchantName: 'Merchant',
		reference: 'Ref1',
		merchantURL: 'url1'
	};

	let contracts = {};
	let pmaToken = {};
	let ethToken = {};
	let adaToken = {};
	let executor = {};

	let fundRceiver;

	before(async () => {
		this.BlockData = await BlockData.new();
		this.chainId = await this.BlockData.getChainId();

		// Deploy a set of smart contracts...
		contracts = await deploySmartContracts(
			owner,
			customer,
			user,
			this.chainId.toString()
		);
		executor = contracts.executor.contract;

		pmaToken = contracts.pmaToken.contract;
		ethToken = contracts.ethereum.contract;
		adaToken = contracts.cardano.contract;
		fundRceiver = contracts.tokenConverter.address;

		await ethToken.approve(executor.address, MaxUint256, { from: customer });
		await adaToken.approve(executor.address, MaxUint256, { from: customer });
		await pmaToken.approve(executor.address, MaxUint256, { from: customer });

		this.contract = contracts.singleDynamicPullPayment.contract;
		billingModel.token = contracts.pmaToken.address;
	});

	describe('createBillingModel()', () => {
		let currentBillingModelId;
		before('', async () => {
			this.createBillingModelTx = await this.contract.createBillingModel(
				billingModel.payee,
				billingModel.merchantName,
				billingModel.reference,
				billingModel.merchantURL,
				{
					from: merchant
				}
			);

			await getGasCost(
				'SingleDynamicPullPayment',
				'createBillingModel',
				this.createBillingModelTx.receipt.cumulativeGasUsed
			);

			currentBillingModelId = await this.contract.getCurrentBillingModelId();
		});

		it('should create billing model correctly', async () => {
			const bmId = await this.contract.getBillingModelIdsByAddress(merchant);
			expect(bmId.toString()).to.be.eq('1');

			const bm = await this.contract.getBillingModel(currentBillingModelId);
			expect(bm.payee).to.be.eq(billingModel.payee);
		});

		it('should emit an event after creating billing model', async () => {
			await expectEvent(this.createBillingModelTx, 'BillingModelCreated');
		});

		it('should revert when invalid payee address specified while creating billing model', async () => {
			await expectRevert(
				this.contract.createBillingModel(
					ZERO_ADDRESS,
					billingModel.merchantName,
					billingModel.reference,
					billingModel.merchantURL,
					{ from: merchant }
				),
				'SingleDynamicPullPayment: INVALID_PAYEE_ADDRESS'
			);
		});

		it('should create billing model with empty merchant name and bm reference', async () => {
			await this.contract.createBillingModel(billingModel.payee, '', '', billingModel.merchantURL, {
				from: merchant
			});
			const currentBillingModelId = await this.contract.getCurrentBillingModelId();

			const bmDetails = await this.contract.getBillingModel(currentBillingModelId);
			expect(bmDetails.merchantName).to.be.eq('');
			expect(bmDetails.uniqueReference).to.be.eq(
				`SingleDynamicPullPayment_${currentBillingModelId}`
			);
		});

		it('should revert when existing reference is passed while creating bm', async () => {
			const currentBillingModelId = await this.contract.getCurrentBillingModelId();

			await expectRevert(
				this.contract.createBillingModel(
					billingModel.payee,
					billingModel.merchantName,
					`SingleDynamicPullPayment_${currentBillingModelId}`,
					billingModel.merchantURL,
					{ from: merchant }
				),
				'SingleDynamicPullPayment: REFERENCE_ALREADY_EXISTS'
			);
		});
	});

	describe('subscribeToBillingModel()', async () => {
		let currentBillingModelId;
		let currentSubscriptionId;
		let customerBalBefore;

		before('', async () => {
			currentBillingModelId = await this.contract.getCurrentBillingModelId();

			customerBalBefore = await pmaToken.balanceOf(customer);
			merchantBalBefore = await pmaToken.balanceOf(merchant);
			fundRceiverBalBefore = await pmaToken.balanceOf(fundRceiver);

			this.subscribeToBillingModelTx = await this.contract.subscribeToBillingModel(
				currentBillingModelId,
				name,
				billingModel.token,
				billingModel.token,
				15,
				'subscriptionRef1',
				{
					from: customer
				}
			);

			await getGasCost(
				'SingleDynamicPullPayment',
				'subscribeToBillingModel',
				this.subscribeToBillingModelTx.receipt.cumulativeGasUsed
			);

			currentSubscriptionId = await this.contract.getCurrentSubscriptionId();
		});

		it('should subscribe the billing correctly', async () => {
			const subscritionId = await this.contract.getSubscriptionIdsByAddress(customer);
			expect(subscritionId[subscritionId.length - 1]).to.bignumber.be.eq(currentSubscriptionId);

			const subscription = await this.contract.getSubscription(currentSubscriptionId);

			expect(subscription.subscriber).to.be.eq(customer);
			expect(subscription.name).to.be.eq(name);
			expect(subscription.settlementToken).to.be.eq(billingModel.token);
			expect(subscription.paymentToken).to.be.eq(billingModel.token);
			expect(subscription.uniqueReference).to.be.eq('subscriptionRef1');

			const customerBalAfter = await pmaToken.balanceOf(customer);
			const merchantBalAfter = await pmaToken.balanceOf(merchant);

			expect(customerBalAfter).to.bignumber.be.eq(customerBalBefore.sub(new BN('15')));
			expect(merchantBalAfter).to.bignumber.be.eq(new BN('14'));
		});

		it('should emit an event after subscribing the billing model', async () => {
			await expectEvent(this.subscribeToBillingModelTx, 'NewSubscription');
		});

		it('should revert when invalid billing model id is specified while subscription', async () => {
			await expectRevert(
				this.contract.subscribeToBillingModel(
					5,
					name,
					billingModel.token,
					billingModel.token,
					15,
					'subscriptionRef1',
					{
						from: customer
					}
				),
				'SingleDynamicPullPayment: INVALID_BILLING_MODEL_ID'
			);
			await expectRevert(
				this.contract.subscribeToBillingModel(
					0,
					name,
					billingModel.token,
					billingModel.token,
					15,
					'subscriptionRef1',
					{
						from: customer
					}
				),
				'SingleDynamicPullPayment: INVALID_BILLING_MODEL_ID'
			);
		});

		it('should revert when unsupported token is specified as settlement token', async () => {
			await expectRevert(
				this.contract.subscribeToBillingModel(
					currentBillingModelId,
					name,
					ZERO_ADDRESS,
					billingModel.token,
					15,
					'subscriptionRef1',
					{
						from: customer
					}
				),
				'SingleDynamicPullPayment: UNSUPPORTED_TOKEN'
			);
		});

		it('should revert when unsupported token is specified as payment token', async () => {
			await expectRevert(
				this.contract.subscribeToBillingModel(
					currentBillingModelId,
					name,
					billingModel.token,
					ZERO_ADDRESS,
					15,
					'',
					{
						from: customer
					}
				),
				'Executor: PAYMENT_TOKEN_NOT_SUPPORTED'
			);
		});

		it('should revert when invalid amount is specified while subscribing', async () => {
			await expectRevert(
				this.contract.subscribeToBillingModel(
					currentBillingModelId,
					name,
					billingModel.token,
					billingModel.token,
					0,
					'subscriptionRef1',
					{
						from: customer
					}
				),
				'SingleDynamicPullPayment: INVALID_AMOUNT'
			);
		});

		it('should subscribe to billing model with empty reference', async () => {
			await this.contract.subscribeToBillingModel(
				currentBillingModelId,
				name,
				billingModel.token,
				billingModel.token,
				15,
				'',
				{
					from: customer
				}
			);

			currentSubscriptionId = await this.contract.getCurrentSubscriptionId();

			const subscriptionDetails = await this.contract.getSubscription(currentSubscriptionId);
			expect(subscriptionDetails.uniqueReference).to.be.eq(
				`SingleDynamicPullPayment_${currentBillingModelId}_${currentSubscriptionId}`
			);
		});

		it('should revert when invalid reference is passed while subscribing', async () => {
			await expectRevert(
				this.contract.subscribeToBillingModel(
					currentBillingModelId,
					name,
					billingModel.token,
					billingModel.token,
					15,
					`SingleDynamicPullPayment_${currentBillingModelId}_${currentSubscriptionId}`,
					{
						from: customer
					}
				),
				'SingleDynamicPullPayment: REFERENCE_ALREADY_EXISTS'
			);
		});
	});

	describe('editBillingModel()', () => {
		let currentBillingModelId;
		before('', async () => {
			await this.contract.createBillingModel(
				billingModel.payee,
				billingModel.merchantName,
				'',
				billingModel.merchantURL,
				{
					from: merchant
				}
			);

			currentBillingModelId = await this.contract.getCurrentBillingModelId();

			this.editBillingModelTx = await this.contract.editBillingModel(
				currentBillingModelId,
				owner,
				'Merchant2',
				'Url2',
				{
					from: merchant
				}
			);

			await getGasCost(
				'SingleDynamicPullPayment',
				'editBillingModel',
				this.editBillingModelTx.receipt.cumulativeGasUsed
			);
		});

		it('should edit billing model correctly', async () => {
			const bm = await this.contract.getBillingModel(currentBillingModelId);
			expect(bm.payee).to.be.eq(owner);
			expect(bm.merchantName).to.be.eq('Merchant2');
			expect(bm.merchantURL).to.be.eq('Url2');
		});

		it('should emti an event after editing billing model', async () => {
			await expectEvent(this.editBillingModelTx, 'BillingModelEdited');
		});

		it('should revert when invalid bm id is specified while editing billing model', async () => {
			await expectRevert(
				this.contract.editBillingModel(0, owner, 'Merchant2', 'Url2', {
					from: owner
				}),
				'SingleDynamicPullPayment: INVALID_BILLING_MODEL_ID'
			);

			await expectRevert(
				this.contract.editBillingModel(5, owner, 'Merchant2', 'Url2', {
					from: owner
				}),
				'SingleDynamicPullPayment: INVALID_BILLING_MODEL_ID'
			);
		});

		it('should revert when invalid editor tries to edit the billing model', async () => {
			await expectRevert(
				this.contract.editBillingModel(currentBillingModelId, owner, 'Merchant2', 'Url2', {
					from: customer
				}),
				'SingleDynamicPullPayment: INVALID_EDITOR'
			);
		});
		it('should revert when invalid payee address is specified while eiditing the billing model', async () => {
			await expectRevert(
				this.contract.editBillingModel(currentBillingModelId, ZERO_ADDRESS, 'Merchant2', {
					from: owner
				}),
				'SingleDynamicPullPayment: INVALID_PAYEE_ADDRESS'
			);
		});
	});

	describe('Getters', async () => {
		let currentBillingModelId;
		let currentSubscriptionId;
		let currentPullPaymentId;
		before(async () => {
			await this.contract.createBillingModel(
				billingModel.payee,
				billingModel.merchantName,
				'',
				billingModel.merchantURL,
				{
					from: merchant
				}
			);

			currentBillingModelId = await this.contract.getCurrentBillingModelId();
		});

		it('Should get subscription correctly', async () => {
			const customerBalBefore = await pmaToken.balanceOf(customer);
			const merchantBalBefore = await pmaToken.balanceOf(merchant);
			const fundReceiverBalBefore = await pmaToken.balanceOf(fundRceiver);

			await this.contract.subscribeToBillingModel(
				currentBillingModelId,
				name,
				billingModel.token,
				billingModel.token,
				15,
				'',
				{
					from: customer
				}
			);

			currentSubscriptionId = await this.contract.getCurrentSubscriptionId();
			currentPullPaymentId = await this.contract.getCurrentPullPaymentId();

			let subscription = await this.contract.getSubscription(currentSubscriptionId);

			expect(subscription.subscriber).to.be.eq(customer);
			expect(subscription.name).to.be.eq(name);
			expect(subscription.settlementToken).to.be.eq(billingModel.token);
			expect(subscription.paymentToken).to.be.eq(billingModel.token);

			const customerBalAfter = await pmaToken.balanceOf(customer);
			const merchantBalAfter = await pmaToken.balanceOf(merchant);
			const fundReceiverBalAfter = await pmaToken.balanceOf(fundRceiver);

			expect(customerBalAfter).to.bignumber.be.lt(customerBalBefore);
			expect(merchantBalAfter).to.bignumber.be.eq(merchantBalBefore.add(new BN('14')));
			expect(fundReceiverBalAfter).to.bignumber.be.eq(fundReceiverBalBefore.add(new BN('1')));

			await expectRevert(
				this.contract.getSubscription(0),
				'SingleDynamicPullPayment: INVALID_SUBSCRIPTION_ID'
			);
			await expectRevert(
				this.contract.getSubscription(15),
				'SingleDynamicPullPayment: INVALID_SUBSCRIPTION_ID'
			);
		});

		it('should get billing model correctly', async () => {
			const bm = await this.contract.getBillingModel(currentBillingModelId);

			expect(bm.payee).to.be.eq(merchant);
			expect(bm.creationTime).to.bignumber.be.gt(new BN('0'));
			expect(bm.merchantName).to.be.eq('Merchant');
			expect(bm.uniqueReference).to.be.eq(`SingleDynamicPullPayment_${currentBillingModelId}`);
			expect(bm.merchantURL).to.be.eq(billingModel.merchantURL);

			await expectRevert(
				this.contract.getBillingModel(15),
				'SingleDynamicPullPayment: INVALID_BILLING_MODEL_ID'
			);
			await expectRevert(
				this.contract.getBillingModel(0),
				'SingleDynamicPullPayment: INVALID_BILLING_MODEL_ID'
			);
		});

		it('should get pullPayment correctly', async () => {
			await this.contract.subscribeToBillingModel(
				currentBillingModelId,
				name,
				billingModel.token,
				billingModel.token,
				15,
				'',
				{
					from: customer
				}
			);
			const ppIds = await this.contract.getPullPaymentsIdsByAddress(customer);

			currentPullPaymentId = await this.contract.getCurrentPullPaymentId();

			console.log('ppIds: ', ppIds);

			let pullPayment = await this.contract.getPullPayment(currentPullPaymentId);

			expect(pullPayment.paymentAmount).to.bignumber.be.eq(new BN('0'));

			pullPayment = await this.contract.getPullPayment(currentPullPaymentId, {
				from: customer
			});

			console.log('pullPayment: ', pullPayment);

			await expectRevert(
				this.contract.getPullPayment(0),
				'RecurringPullPayment: INVALID_PULLPAYMENT_ID'
			);
			await expectRevert(
				this.contract.getPullPayment(15),
				'RecurringPullPayment: INVALID_PULLPAYMENT_ID'
			);
		});

		it('should get version number correcntly', async () => {
			const version = await this.contract.getVersionNumber();
			expect(version[0]).to.bignumber.be.eq(new BN('1'));
			expect(version[1]).to.bignumber.be.eq(new BN('0'));
			expect(version[2]).to.bignumber.be.eq(new BN('0'));
			expect(version[3]).to.bignumber.be.eq(new BN('0'));
		});
	});
});
