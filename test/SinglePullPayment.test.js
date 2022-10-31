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
contract('SinglePullPayment', (accounts) => {
	let [owner, merchant, customer, user] = accounts;

	const billingModel = {
		payee: merchant,
		name: web3.utils.padRight(web3.utils.fromAscii('some name'), 64),
		merchantName: 'Merchant',
		reference: 'Ref1',
		merchantURL: 'url1',
		amount: '15' // web3.utils.toWei("15", "ether"),
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

		this.contract = contracts.singlePullPayment.contract;
		billingModel.token = contracts.pmaToken.address;
	});

	describe('Single PullPayment', async () => {
		it('should create a billing model correctly', async () => {
			const tx = await this.contract.createBillingModel(
				billingModel.payee,
				billingModel.name,
				billingModel.merchantName,
				billingModel.reference,
				billingModel.merchantURL,
				billingModel.amount,
				billingModel.token,
				{ from: merchant }
			);

			await getGasCost('SinglePullPayment', 'createBillingModel', tx.receipt.cumulativeGasUsed);

			const bmId = await this.contract.getBillingModelIdsByAddress(merchant);
			expect(bmId.toString()).to.be.eq('1');
			await expectEvent(tx, 'BillingModelCreated');

			await expectRevert(
				this.contract.createBillingModel(
					ZERO_ADDRESS,
					billingModel.name,
					billingModel.merchantName,
					billingModel.reference,
					billingModel.merchantURL,
					billingModel.amount,
					billingModel.token,
					{ from: merchant }
				),
				'SinglePullPayment: INVALID_PAYEE_ADDRESS'
			);
			await expectRevert(
				this.contract.createBillingModel(
					billingModel.payee,
					billingModel.name,
					billingModel.merchantName,
					'',
					billingModel.merchantURL,
					0,
					billingModel.token,
					{ from: merchant }
				),
				'SinglePullPayment: INVALID_AMOUNT'
			);
		});

		it('should create billing model with empty merchant name and bm reference', async () => {
			await this.contract.createBillingModel(
				billingModel.payee,
				billingModel.name,
				'',
				'',
				billingModel.merchantURL,
				billingModel.amount,
				billingModel.token,
				{ from: merchant }
			);
			const currentBillingModelId = await this.contract.getCurrentBillingModelId();

			const bmDetails = await this.contract.getBillingModel(currentBillingModelId);
			expect(bmDetails.merchantName).to.be.eq('');
			expect(bmDetails.uniqueReference).to.be.eq(`SinglePullPayment_${currentBillingModelId}`);
		});

		it('should subscribe Billing model correctly', async () => {
			const customerBalBefore = await pmaToken.balanceOf(customer);
			const merchantBalBefore = await pmaToken.balanceOf(merchant);

			await this.contract.createBillingModel(
				billingModel.payee,
				billingModel.name,
				billingModel.merchantName,
				billingModel.reference,
				billingModel.merchantURL,
				billingModel.amount,
				billingModel.token,
				{ from: merchant }
			);
			const tx = await this.contract.subscribeToBillingModel(
				1,
				billingModel.token,
				'subscriptionRef1',
				{
					from: customer
				}
			);

			await getGasCost(
				'SinglePullPayment',
				'subscribeToBillingModel',
				tx.receipt.cumulativeGasUsed
			);

			await expectEvent(tx, 'NewSubscription');

			const subscritionId = await this.contract.getSubscriptionIdsByAddress(customer);
			expect(subscritionId.toString()).to.be.eq('1');

			const customerBalAfter = await pmaToken.balanceOf(customer);
			const merchantBalAfter = await pmaToken.balanceOf(merchant);

			expect(customerBalAfter).to.bignumber.be.lt(customerBalBefore);
			expect(merchantBalAfter).to.bignumber.be.gt(merchantBalBefore);

			await expectRevert(
				this.contract.subscribeToBillingModel(5, billingModel.token, 'subscriptionRef1', {
					from: customer
				}),
				'SinglePullPayment: INVALID_BILLING_MODEL_ID'
			);
			await expectRevert(
				this.contract.subscribeToBillingModel(0, billingModel.token, 'subscriptionRef1', {
					from: customer
				}),
				'SinglePullPayment: INVALID_BILLING_MODEL_ID'
			);
			await expectRevert(
				this.contract.createBillingModel(
					billingModel.payee,
					billingModel.name,
					billingModel.merchantName,
					billingModel.reference,
					billingModel.merchantURL,
					billingModel.amount,
					ZERO_ADDRESS,
					{ from: merchant }
				),
				'SinglePullPayment: UNSUPPORTED_TOKEN'
			);

			await expectRevert(
				this.contract.createBillingModel(
					billingModel.payee,
					billingModel.name,
					billingModel.merchantName,
					billingModel.reference,
					billingModel.merchantURL,
					billingModel.amount,
					billingModel.token,
					{ from: merchant }
				),
				'SinglePullPayment: REFERENCE_ALREADY_EXISTS'
			);
		});

		it('should subscribe to billing model with empty reference', async () => {
			await this.contract.createBillingModel(
				billingModel.payee,
				billingModel.name,
				'',
				'',
				billingModel.merchantURL,
				billingModel.amount,
				billingModel.token,
				{ from: merchant }
			);

			const currentBillingModelId = await this.contract.getCurrentBillingModelId();
			await this.contract.subscribeToBillingModel(currentBillingModelId, billingModel.token, '', {
				from: customer
			});

			const currentSubscriptionId = await this.contract.getCurrentSubscriptionId();
			const pullPaymentId = await this.contract.getCurrentPullPaymentId();
			expect(pullPaymentId).to.bignumber.be.eq(currentSubscriptionId);

			const subscriptionDetails = await this.contract.getSubscription(currentSubscriptionId);
			expect(subscriptionDetails.uniqueReference).to.be.eq(
				`SinglePullPayment_${currentBillingModelId}_${currentSubscriptionId}`
			);

			await expectRevert(
				this.contract.subscribeToBillingModel(
					currentBillingModelId,
					billingModel.token,
					`SinglePullPayment_${currentBillingModelId}_${currentSubscriptionId}`,
					{
						from: customer
					}
				),
				'SinglePullPayment: REFERENCE_ALREADY_EXISTS'
			);
		});

		it('should edit the billing model correctly', async () => {
			await this.contract.createBillingModel(
				billingModel.payee,
				billingModel.name,
				billingModel.merchantName,
				billingModel.reference,
				billingModel.merchantURL,
				billingModel.amount,
				billingModel.token,
				{ from: merchant }
			);

			const tx = await this.contract.editBillingModel(
				1,
				owner,
				web3.utils.stringToHex('model-1'),
				1,
				adaToken.address,
				'Merchant2',
				'Url2',
				{
					from: merchant
				}
			);

			await getGasCost('SinglePullPayment', 'editBillingModel', tx.receipt.cumulativeGasUsed);

			await expectEvent(tx, 'BillingModelEdited');
			await expectRevert(
				this.contract.editBillingModel(
					0,
					owner,
					web3.utils.stringToHex('model-1'),
					1,
					adaToken.address,
					'Merchant2',
					'Url2',
					{
						from: owner
					}
				),
				'SinglePullPayment: INVALID_BILLING_MODEL_ID'
			);
			await expectRevert(
				this.contract.editBillingModel(
					5,
					owner,
					web3.utils.stringToHex('model-1'),
					1,
					adaToken.address,
					'Merchant2',
					'Url2',
					{
						from: owner
					}
				),
				'SinglePullPayment: INVALID_BILLING_MODEL_ID'
			);
			await expectRevert(
				this.contract.editBillingModel(
					1,
					owner,
					web3.utils.stringToHex('model-1'),
					1,
					adaToken.address,
					'Merchant2',
					'Url2',
					{
						from: customer
					}
				),
				'SinglePullPayment: INVALID_EDITOR'
			);

			await expectRevert(
				this.contract.editBillingModel(
					1,
					ZERO_ADDRESS,
					web3.utils.stringToHex('model-1'),
					1,
					adaToken.address,
					'Merchant2',
					'Url2',
					{
						from: owner
					}
				),
				'SinglePullPayment: INVALID_PAYEE_ADDRESS'
			);

			await expectRevert(
				this.contract.editBillingModel(
					1,
					owner,
					web3.utils.stringToHex('model-1'),
					0,
					adaToken.address,
					'Merchant2',
					'Url2',
					{
						from: owner
					}
				),
				'SinglePullPayment: INVALID_AMOUNT'
			);

			await expectRevert(
				this.contract.editBillingModel(
					1,
					owner,
					web3.utils.stringToHex('model-1'),
					15,
					ZERO_ADDRESS,
					'Merchant2',
					'Url2',
					{
						from: owner
					}
				),
				'SinglePullPayment: UNSUPPORTED_TOKEN'
			);

			const bm = await this.contract.getBillingModel(1);
			expect(bm.merchantURL).to.be.eq('Url2');
		});
	});

	describe('Single PullPayment Execution', () => {
		beforeEach(async () => {
			await this.contract.createBillingModel(
				billingModel.payee,
				billingModel.name,
				billingModel.merchantName,
				billingModel.reference,
				billingModel.merchantURL,
				billingModel.amount,
				billingModel.token,
				{ from: merchant }
			);
		});

		it('Should Execute PullPayment on subscription', async () => {
			const customerBalBefore = await pmaToken.balanceOf(customer);
			const merchantBalBefore = await pmaToken.balanceOf(merchant);

			const tx = await this.contract.subscribeToBillingModel(
				1,
				billingModel.token,
				'subscriptionRef1',
				{
					from: customer
				}
			);
			await expectEvent(tx, 'NewSubscription');

			// execute multiple payments
			await this.contract.subscribeToBillingModel(1, billingModel.token, '', {
				from: customer
			});

			const customerBalAfter = await pmaToken.balanceOf(customer);
			const merchantBalAfter = await pmaToken.balanceOf(merchant);

			expect(customerBalAfter).to.bignumber.be.lt(customerBalBefore);
			expect(merchantBalAfter).to.bignumber.be.gt(merchantBalBefore);
		});

		it('Should not execute PullPayment if customer don`t have the balance', async () => {
			const customerBalBefore = await pmaToken.balanceOf(customer);
			const merchantBalBefore = await pmaToken.balanceOf(merchant);

			await this.contract.subscribeToBillingModel(1, billingModel.token, 'subscriptionRef1', {
				from: customer
			});

			// sets customer balance to zero
			await pmaToken.transfer(merchant, await pmaToken.balanceOf(customer), {
				from: customer
			});

			await expectRevert(
				this.contract.subscribeToBillingModel(1, billingModel.token, '', {
					from: customer
				}),
				'BEP20: transfer amount exceeds balance'
			);

			const customerBalAfter = await pmaToken.balanceOf(customer);
			const merchantBalAfter = await pmaToken.balanceOf(merchant);
			expect(customerBalAfter).to.bignumber.be.lt(customerBalBefore);
			expect(merchantBalAfter).to.bignumber.be.gt(merchantBalBefore);
		});

		it('Should not execute PullPayment if customer don`t approves the tokens', async () => {
			const customerBalBefore = await pmaToken.balanceOf(customer);
			const merchantBalBefore = await pmaToken.balanceOf(merchant);

			await this.contract.subscribeToBillingModel(1, billingModel.token, 'subscriptionRef1', {
				from: customer
			});

			// sets executor allowance to zero
			await pmaToken.approve(executor.address, 0, { from: customer });

			await expectRevert(
				this.contract.subscribeToBillingModel(1, billingModel.token, '', {
					from: customer
				}),
				'BEP20: transfer amount exceeds allowance'
			);

			const customerBalAfter = await pmaToken.balanceOf(customer);
			const merchantBalAfter = await pmaToken.balanceOf(merchant);
			expect(customerBalAfter).to.bignumber.be.lt(customerBalBefore);
			expect(merchantBalAfter).to.bignumber.be.gt(merchantBalBefore);
		});
	});

	describe('Getters', async () => {
		beforeEach(async () => {
			await this.contract.createBillingModel(
				billingModel.payee,
				billingModel.name,
				billingModel.merchantName,
				billingModel.reference,
				billingModel.merchantURL,
				billingModel.amount,
				billingModel.token,
				{ from: merchant }
			);

			this.bmType = await this.contract.getBillingModelIdsByAddress(merchant);
			console.log('billing model IDs', this.bmType);
		});

		it('Should get subscription correctly', async () => {
			const customerBalBefore = await pmaToken.balanceOf(customer);
			const merchantBalBefore = await pmaToken.balanceOf(merchant);

			await this.contract.subscribeToBillingModel(1, pmaToken.address, 'subscriptionRef1', {
				from: customer
			});

			let subscription = await this.contract.getSubscription(1);
			console.log('subscription: ', subscription);

			const customerBalAfter = await pmaToken.balanceOf(customer);
			const merchantBalAfter = await pmaToken.balanceOf(merchant);

			expect(subscription.subscriber).to.be.eq(customer);
			expect(subscription.paymentToken).to.be.eq(pmaToken.address);
			expect(subscription.paymentAmount).to.bignumber.be.eq(new BN('15'));
			expect(subscription.uniqueReference).to.be.eq('subscriptionRef1');

			expect(customerBalAfter).to.bignumber.be.lt(customerBalBefore);
			expect(merchantBalAfter).to.bignumber.be.gt(merchantBalBefore);
			await expectRevert(
				this.contract.getSubscription(0),
				'SinglePullPayment: INVALID_SUBSCRIPTION_ID'
			);
			await expectRevert(
				this.contract.getSubscription(5),
				'SinglePullPayment: INVALID_SUBSCRIPTION_ID'
			);
		});

		it('should get billing model correctly', async () => {
			const bm = await this.contract.getBillingModel(1);
			console.log('billing model: ', bm);

			expect(bm.payee).to.be.eq(merchant);
			expect(bm.name).to.be.eq(billingModel.name);
			expect(bm.merchantName).to.be.eq('Merchant');
			expect(bm.uniqueReference).to.be.eq('Ref1');
			expect(bm.amount).to.be.eq(billingModel.amount);
			expect(bm.settlementToken).to.be.eq(billingModel.token);
			expect(bm.creationTime).to.bignumber.be.gt(new BN('0'));
			expect(bm.merchantURL).to.be.eq(billingModel.merchantURL);

			await expectRevert(
				this.contract.getBillingModel(5),
				'SinglePullPayment: INVALID_BILLING_MODEL_ID'
			);
			await expectRevert(
				this.contract.getBillingModel(0),
				'SinglePullPayment: INVALID_BILLING_MODEL_ID'
			);
		});

		it('should get swappable billing model correctly', async () => {
			const bm = await this.contract.getBillingModel(1, pmaToken.address);
			console.log('billing model: ', bm);

			expect(bm.payee).to.be.eq(merchant);
			expect(bm.name).to.be.eq(billingModel.name);
			expect(bm.merchantName).to.be.eq('Merchant');
			expect(bm.uniqueReference).to.be.eq('Ref1');
			expect(bm.paymentAmount).to.bignumber.be.eq(new BN('15'));
			expect(bm.settlementToken).to.be.eq(billingModel.token);
			expect(bm.creationTime).to.bignumber.be.gt(new BN('0'));
			expect(bm.merchantURL).to.be.eq(billingModel.merchantURL);

			await expectRevert(
				this.contract.getBillingModel(5),
				'SinglePullPayment: INVALID_BILLING_MODEL_ID'
			);
			await expectRevert(
				this.contract.getBillingModel(0),
				'SinglePullPayment: INVALID_BILLING_MODEL_ID'
			);
		});

		it('should get pullPayment correctly', async () => {
			await this.contract.subscribeToBillingModel(1, pmaToken.address, 'subscriptionRef1', {
				from: customer
			});
			const ppId = await this.contract.getPullPaymentsIdsByAddress(customer);
			console.log('pullpayment ids: ', ppId.toString());

			let pullPayment = await this.contract.getPullPayment(1);
			console.log('pullPayment: ', pullPayment);

			pullPayment = await this.contract.getPullPayment(1, {
				from: customer
			});
			console.log('pullPayment: ', pullPayment);

			expect(pullPayment.paymentAmount).to.bignumber.be.eq(new BN(billingModel.amount));

			await expectRevert(
				this.contract.getPullPayment(0),
				'RecurringPullPayment: INVALID_PULLPAYMENT_ID'
			);
			await expectRevert(
				this.contract.getPullPayment(5),
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
