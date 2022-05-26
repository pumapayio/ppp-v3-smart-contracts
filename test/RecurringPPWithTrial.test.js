// Load dependencies

const { deploySmartContracts } = require('../libs/utils');
const { expect } = require('chai');
const { timeTravel } = require('./helpers/timeHelper');
const { MaxUint256 } = require('@ethersproject/constants');
const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { BN } = require('@openzeppelin/test-helpers/src/setup');
const { web3 } = require('@openzeppelin/test-environment');
const { ZERO_ADDRESS } = require('@openzeppelin/test-helpers/src/constants');
const { getGasCost } = require('./helpers/gasCost');

const BlockData = artifacts.require('BlockData');
// Start test block
contract('RecurringPPWithFreeTrial', (accounts) => {
	let [owner, merchant, customer, user, fundRceiver] = accounts;

	const billingModel = {
		payee: merchant,
		name: web3.utils.padRight(web3.utils.fromAscii('some name'), 64),
		merchantName: 'Merchant',
		reference: 'Ref1',
		merchantURL: 'url1',
		amount: '15', // web3.utils.toWei("15", "ether"),
		frequency: 600, // 10 minutes
		trialPeriod: 120, // 2 minutes
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
			fundRceiver,
			this.chainId.toString()
		);
		executor = contracts.executor.contract;

		pmaToken = contracts.pmaToken.contract;
		ethToken = contracts.ethereum.contract;
		adaToken = contracts.cardano.contract;

		await ethToken.approve(executor.address, MaxUint256, { from: customer });
		await adaToken.approve(executor.address, MaxUint256, { from: customer });
		await pmaToken.approve(executor.address, MaxUint256, { from: customer });

		// pullPayment registry contract
		this.contract = contracts.recurringPPWithFreeTrial.contract;
		billingModel.token = contracts.pmaToken.address;
	});

	describe('createBillingModel()', () => {
		let currentBillingModelId;
		before('', async () => {
			this.createBillingModelTx = await this.contract.createBillingModel(
				billingModel.payee,
				billingModel.name,
				billingModel.merchantName,
				billingModel.reference,
				billingModel.merchantURL,
				billingModel.amount,
				billingModel.token,
				billingModel.frequency,
				billingModel.trialPeriod,
				billingModel.numberOfPayments,
				{ from: merchant }
			);

			await getGasCost(
				'RecurringPullPaymentWithFreeTrial',
				'createBillingModel',
				this.createBillingModelTx.receipt.cumulativeGasUsed
			);

			currentBillingModelId = await this.contract.getCurrentBillingModelId();
		});

		it('should create the billing model correctly', async () => {
			const bmId = await this.contract.getBillingModelIdsByAddress(merchant);
			expect(bmId.toString()).to.be.eq('1');

			const bm = await this.contract.getBillingModel(currentBillingModelId);

			expect(bm.payee).to.be.eq(billingModel.payee);
			expect(bm.name).to.be.eq(billingModel.name);
			expect(bm.merchantName).to.be.eq('Merchant');
			expect(bm.uniqueReference).to.be.eq('Ref1');
			expect(bm.amount).to.bignumber.be.eq(billingModel.amount);
			expect(bm.settlementToken).to.be.eq(billingModel.token);
			expect(bm.frequency.toString()).to.be.eq(billingModel.frequency.toString());
			expect(bm.trialPeriod.toString()).to.be.eq(billingModel.trialPeriod.toString());
			expect(bm.numberOfPayments.toString()).to.be.eq(billingModel.numberOfPayments.toString());
			expect(bm.subscriptionIDs.length).to.be.eq(0);
		});

		it('should emit an event after creating billing model correctly', async () => {
			await expectEvent(this.createBillingModelTx, 'BillingModelCreated');
		});

		it('should revert when invalid payee address is specified while creating billing model', async () => {
			await expectRevert(
				this.contract.createBillingModel(
					ZERO_ADDRESS,
					billingModel.name,
					billingModel.merchantName,
					billingModel.reference + '1',
					billingModel.merchantURL,
					billingModel.amount,
					billingModel.token,
					billingModel.frequency,
					billingModel.trialPeriod,
					billingModel.numberOfPayments,
					{ from: merchant }
				),
				'RecurringPullPaymentWithFreeTrial: INVALID_PAYEE_ADDRESS'
			);
		});

		it('should revert when invalid settlement token  address is specified while creating billing model', async () => {
			await expectRevert(
				this.contract.createBillingModel(
					billingModel.payee,
					billingModel.name,
					billingModel.merchantName,
					billingModel.reference + '2',
					billingModel.merchantURL,
					billingModel.amount,
					ZERO_ADDRESS,
					billingModel.frequency,
					billingModel.trialPeriod,
					billingModel.numberOfPayments,
					{ from: merchant }
				),
				'RecurringPullPaymentWithFreeTrial: UNSUPPORTED_TOKEN'
			);
		});

		it('should revert when invalid amount is specified for the bm', async () => {
			await expectRevert(
				this.contract.createBillingModel(
					billingModel.payee,
					billingModel.name,
					billingModel.merchantName,
					billingModel.reference + '3',
					billingModel.merchantURL,
					0,
					billingModel.token,
					billingModel.frequency,
					billingModel.trialPeriod,
					billingModel.numberOfPayments,
					{ from: merchant }
				),
				'RecurringPullPaymentWithFreeTrial: INVALID_AMOUNT'
			);
		});

		it('should revert when invalid frequency is specified for the bm', async () => {
			await expectRevert(
				this.contract.createBillingModel(
					billingModel.payee,
					billingModel.name,
					billingModel.merchantName,
					billingModel.reference + '4',
					billingModel.merchantURL,
					billingModel.amount,
					billingModel.token,
					0,
					billingModel.trialPeriod,
					billingModel.numberOfPayments,
					{ from: merchant }
				),
				'RecurringPullPaymentWithFreeTrial: INVALID_FREQUENCY'
			);
		});
		it('should revert when invalid trial period is specified for the bm', async () => {
			await expectRevert(
				this.contract.createBillingModel(
					billingModel.payee,
					billingModel.name,
					billingModel.merchantName,
					billingModel.reference + '5',
					billingModel.merchantURL,
					billingModel.amount,
					billingModel.token,
					billingModel.frequency,
					0,
					billingModel.numberOfPayments,
					{ from: merchant }
				),
				'RecurringPullPaymentWithFreeTrial: INVALID_TRIAL_PERIOD'
			);
		});

		it('should revert when invalid no. of payments is specified for the bm', async () => {
			await expectRevert(
				this.contract.createBillingModel(
					billingModel.payee,
					billingModel.name,
					billingModel.merchantName,
					billingModel.reference + '6',
					billingModel.merchantURL,
					billingModel.amount,
					billingModel.token,
					billingModel.frequency,
					billingModel.trialPeriod,
					0,
					{ from: merchant }
				),
				'RecurringPullPaymentWithFreeTrial: INVALID_NO_OF_PAYMENTS'
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
				billingModel.frequency,
				billingModel.trialPeriod,
				billingModel.numberOfPayments,
				{ from: merchant }
			);
			const currentBillingModelId = await this.contract.getCurrentBillingModelId();

			const bmDetails = await this.contract.getBillingModel(currentBillingModelId);
			expect(bmDetails.merchantName).to.be.eq('');
			expect(bmDetails.uniqueReference).to.be.eq(
				`RecurringPullPaymentWithFreeTrial_${currentBillingModelId}`
			);
		});
	});

	describe('subscribeToBillingModel()', () => {
		let currentBillingModelId;
		let currentSubscriptionId;
		before('', async () => {
			await this.contract.createBillingModel(
				billingModel.payee,
				billingModel.name,
				billingModel.merchantName,
				'',
				billingModel.merchantURL,
				billingModel.amount,
				billingModel.token,
				billingModel.frequency,
				billingModel.trialPeriod,
				billingModel.numberOfPayments,
				{ from: merchant }
			);

			currentBillingModelId = await this.contract.getCurrentBillingModelId();
			this.customerBalBefore = await pmaToken.balanceOf(customer);
			this.merchantBalBefore = await pmaToken.balanceOf(merchant);

			this.subscribeToBillingModelTx = await this.contract.subscribeToBillingModel(
				currentBillingModelId,
				billingModel.token,
				'subscriptionRef1',
				{
					from: customer
				}
			);

			await getGasCost(
				'RecurringPullPaymentWithFreeTrial',
				'subscribeToBillingModel',
				this.subscribeToBillingModelTx.receipt.cumulativeGasUsed
			);
		});

		it('should subscribe billing model correctly', async () => {
			const subscritionIds = await this.contract.getSubscriptionIdsByAddress(customer);
			currentSubscriptionId = await this.contract.getCurrentSubscriptionId();

			const subscription = await this.contract.getSubscription(currentSubscriptionId);

			const customerBalAfter = await pmaToken.balanceOf(customer);
			const merchantBalAfter = await pmaToken.balanceOf(merchant);

			expect(subscription.subscriber).to.be.eq(customer);
			expect(subscription.paymentToken).to.be.eq(billingModel.token);
			expect(subscription.numberOfPayments.toString()).to.be.eq(
				billingModel.numberOfPayments.toString()
			);

			expect(subscription.startTimestamp).to.bignumber.be.gt(new BN('0'));
			expect(subscription.cancelTimestamp).to.bignumber.be.eq(new BN('0'));
			expect(subscription.nextPaymentTimestamp).to.bignumber.be.gt(new BN('0'));
			expect(subscription.lastPaymentTimestamp).to.bignumber.be.eq(new BN('0'));
			expect(subscritionIds.length.toString()).to.be.eq('1');
			expect(customerBalAfter).to.bignumber.be.eq(this.customerBalBefore);
			expect(merchantBalAfter).to.bignumber.be.eq(this.merchantBalBefore);
		});

		it('should emit an event after subscription', async () => {
			await expectEvent(this.subscribeToBillingModelTx, 'NewSubscription');
		});

		it('should revert when invalid billing model id is specified while subscribing', async () => {
			await expectRevert(
				this.contract.subscribeToBillingModel(15, billingModel.token, 'subscriptionRef1', {
					from: customer
				}),
				'RecurringPullPaymentWithFreeTrial: INVALID_BILLING_MODEL_ID'
			);
			await expectRevert(
				this.contract.subscribeToBillingModel(0, billingModel.token, 'subscriptionRef1', {
					from: customer
				}),
				'RecurringPullPaymentWithFreeTrial: INVALID_BILLING_MODEL_ID'
			);
		});

		it('should subscribe to billing model with empty reference', async () => {
			await this.contract.subscribeToBillingModel(currentBillingModelId, billingModel.token, '', {
				from: customer
			});
			currentSubscriptionId = await this.contract.getCurrentSubscriptionId();

			const subscriptionDetails = await this.contract.getSubscription(currentSubscriptionId);
			expect(subscriptionDetails.uniqueReference).to.be.eq(
				`RecurringPullPaymentWithFreeTrial_${currentBillingModelId}_${currentSubscriptionId}`
			);
		});

		it('should revert invalid subscriber tries to cancel the subscription', async () => {
			await expectRevert(
				this.contract.cancelSubscription(currentSubscriptionId, {
					from: user
				}),
				'RecurringPullPaymentWithFreeTrial: INVALID_CANCELER'
			);
		});
	});

	describe('cancelSubscription()', async () => {
		let currentSubscriptionId;

		before('', async () => {
			currentBillingModelId = await this.contract.getCurrentBillingModelId();
			currentSubscriptionId = await this.contract.getCurrentSubscriptionId();

			this.cancelSubscriptionTx = await this.contract.cancelSubscription(currentSubscriptionId, {
				from: customer
			});

			await getGasCost(
				'RecurringPullPaymentWithFreeTrial',
				'cancelSubscription',
				this.cancelSubscriptionTx.receipt.cumulativeGasUsed
			);
		});

		it('should cancel the subscription correctly', async () => {
			const canceledIds = await this.contract.getCanceledSubscriptionIdsByAddress(customer);
			expect(canceledIds[0]).to.bignumber.be.eq(currentSubscriptionId);

			const subscription = await this.contract.getSubscription(currentSubscriptionId);
			expect(subscription.cancelTimestamp).to.bignumber.be.gt(new BN('0'));
			expect(subscription.cancelledBy).to.be.eq(customer);
		});

		it('should cancel subscription by the merchant correctly', async () => {
			await this.contract.cancelSubscription(1, {
				from: merchant
			});

			const subscription = await this.contract.getSubscription(1);
			expect(subscription.cancelledBy).to.be.eq(merchant);
		});

		it('should emit an event after cancelling subscription', async () => {
			await expectEvent(this.cancelSubscriptionTx, 'SubscriptionCancelled');
		});

		it('should revert when user tries to cancel subscription with invalid subscription id', async () => {
			await expectRevert(
				this.contract.cancelSubscription(0, { from: customer }),
				'RecurringPullPaymentWithFreeTrial: INVALID_SUBSCRIPTION_ID'
			);
			await expectRevert(
				this.contract.cancelSubscription(15, { from: customer }),
				'RecurringPullPaymentWithFreeTrial: INVALID_SUBSCRIPTION_ID'
			);
		});
	});

	describe('editBillingModel()', () => {
		let currentBillingModelId;

		before('', async () => {
			currentBillingModelId = await this.contract.getCurrentBillingModelId();
			currentSubscriptionId = await this.contract.getCurrentSubscriptionId();

			this.editBillingModelTx = await this.contract.editBillingModel(
				currentBillingModelId,
				owner,
				'model-1',
				'Merchant2',
				'Url2',
				{
					from: merchant
				}
			);
			await getGasCost(
				'RecurringPullPaymentWithFreeTrial',
				'editBillingModel',
				this.editBillingModelTx.receipt.cumulativeGasUsed
			);
		});

		it('should edit the billing model correctly', async () => {
			const bm = await this.contract.getBillingModel(currentBillingModelId);

			expect(bm.payee).to.be.eq(owner);
			expect(bm.name).to.be.eq('model-1');
			expect(bm.merchantName).to.be.eq('Merchant2');
			expect(bm.merchantURL).to.be.eq('Url2');
		});

		it('should emit the event after editing bm correctly', async () => {
			await expectEvent(this.editBillingModelTx, 'BillingModelEdited');
		});

		it('should revert when invalid bm id is specified while eiditing', async () => {
			await expectRevert(
				this.contract.editBillingModel(0, owner, 'model-1', 'Merchant2', 'Url2', {
					from: owner
				}),
				'RecurringPullPaymentWithFreeTrial: INVALID_BILLING_MODEL_ID'
			);

			await expectRevert(
				this.contract.editBillingModel(15, owner, 'model-1', 'Merchant2', 'Url2', {
					from: owner
				}),
				'RecurringPullPaymentWithFreeTrial: INVALID_BILLING_MODEL_ID'
			);
		});

		it('should revert when invalid bm editor tries to edit the bm', async () => {
			await expectRevert(
				this.contract.editBillingModel(
					currentBillingModelId,
					owner,
					'model-1',
					'Merchant2',
					'Url2',
					{
						from: customer
					}
				),
				'RecurringPullPaymentWithFreeTrial: INVALID_EDITOR'
			);
		});

		it('should revert when editor sets the already existing name for bm', async () => {
			await expectRevert(
				this.contract.editBillingModel(
					currentBillingModelId,
					merchant,
					'model-1',
					'Merchant2',
					'Url2',
					{
						from: owner
					}
				),
				'RecurringPullPaymentWithFreeTrial: NAME_EXISTS'
			);
		});

		it('should revert when editor sets empty values while eiditing bm', async () => {
			await expectRevert(
				this.contract.editBillingModel(
					currentBillingModelId,
					ZERO_ADDRESS,
					'',
					'Merchant2',
					'Url2',
					{
						from: owner
					}
				),
				'RecurringPullPaymentWithFreeTrial: INVALID_OPERATION'
			);
		});
	});

	describe('executePullPayment()', () => {
		let currentSubscriptionId;

		before('', async () => {
			await this.contract.createBillingModel(
				billingModel.payee,
				billingModel.name,
				billingModel.merchantName,
				'',
				billingModel.merchantURL,
				billingModel.amount,
				billingModel.token,
				billingModel.frequency,
				billingModel.trialPeriod,
				billingModel.numberOfPayments,
				{ from: merchant }
			);

			currentBillingModelId = await this.contract.getCurrentBillingModelId();
		});

		it('Should not Execute PullPayment after the subscription', async () => {
			const customerBalBefore = await pmaToken.balanceOf(customer);
			const merchantBalBefore = await pmaToken.balanceOf(merchant);

			currentSubscriptionId = await this.contract.getCurrentSubscriptionId();

			await expectRevert(
				this.contract.executePullPayment(0),
				'RecurringPullPaymentWithFreeTrial: INVALID_SUBSCRIPTION_ID'
			);

			await this.contract.subscribeToBillingModel(currentSubscriptionId, billingModel.token, '', {
				from: customer
			});

			const customerBalAfter = await pmaToken.balanceOf(customer);
			const merchantBalAfter = await pmaToken.balanceOf(merchant);

			expect(customerBalAfter).to.bignumber.be.eq(customerBalBefore);
			expect(merchantBalAfter).to.bignumber.be.eq(merchantBalBefore);
		});

		it('Should Execute PullPayment after free trial period only', async () => {
			const customerBalBefore = await pmaToken.balanceOf(customer);
			const merchantBalBefore = await pmaToken.balanceOf(merchant);
			currentSubscriptionId = await this.contract.getCurrentSubscriptionId();

			await expectRevert(
				this.contract.executePullPayment(currentSubscriptionId),
				'RecurringPullPaymentWithFreeTrial: INVALID_EXECUTION_TIME'
			);

			// incrase time by trial period
			await timeTravel(120);

			this.executePullPaymentTx = await this.contract.executePullPayment(currentSubscriptionId);
			await getGasCost(
				'RecurringPullPaymentWithFreeTrial',
				'executePullPayment',
				this.executePullPaymentTx.receipt.cumulativeGasUsed
			);

			const customerBalAfter = await pmaToken.balanceOf(customer);
			const merchantBalAfter = await pmaToken.balanceOf(merchant);

			expect(customerBalAfter).to.bignumber.be.lt(customerBalBefore);
			expect(merchantBalAfter).to.bignumber.be.gt(merchantBalBefore);
		});

		it('Should Execute PullPayment correctly', async () => {
			const customerBalBefore = await pmaToken.balanceOf(customer);
			const merchantBalBefore = await pmaToken.balanceOf(merchant);

			// should not execute pullPayment during trial period
			await expectRevert(
				this.contract.executePullPayment(currentSubscriptionId),
				'RecurringPullPaymentWithFreeTrial: INVALID_EXECUTION_TIME'
			);

			// incrase time to complete trial period
			await timeTravel(billingModel.frequency + 120);
			await this.contract.executePullPayment(currentSubscriptionId);

			await expectRevert(
				this.contract.executePullPayment(currentSubscriptionId),
				'RecurringPullPaymentWithFreeTrial: INVALID_EXECUTION_TIME'
			);
			// incrase time by frequency
			await timeTravel(billingModel.frequency + 600);
			await this.contract.executePullPayment(currentSubscriptionId);

			// incrase time by frequency
			await timeTravel(billingModel.frequency + 600);
			await this.contract.executePullPayment(currentSubscriptionId);

			// incrase time by frequency
			await timeTravel(billingModel.frequency + 600);
			await this.contract.executePullPayment(currentSubscriptionId);

			const customerBalAfter = await pmaToken.balanceOf(customer);
			const merchantBalAfter = await pmaToken.balanceOf(merchant);

			expect(customerBalAfter).to.bignumber.be.lt(customerBalBefore);
			expect(merchantBalAfter).to.bignumber.be.gt(merchantBalBefore);
		});

		it('Should not execute PullPayment if no. of payments are exceeded', async () => {
			const customerBalBefore = await pmaToken.balanceOf(customer);
			const merchantBalBefore = await pmaToken.balanceOf(merchant);

			// incrase time by frequency
			await timeTravel(billingModel.frequency + 600);
			await expectRevert(
				this.contract.executePullPayment(currentSubscriptionId),
				'RecurringPullPaymentWithFreeTrial: NO_OF_PAYMENTS_EXCEEDED'
			);

			const customerBalAfter = await pmaToken.balanceOf(customer);
			const merchantBalAfter = await pmaToken.balanceOf(merchant);

			expect(customerBalAfter).to.bignumber.be.eq(customerBalBefore);
			expect(merchantBalAfter).to.bignumber.be.eq(merchantBalBefore);
		});

		it('Should not execute PullPayment if subscription is cancelled', async () => {
			const customerBalBefore = await pmaToken.balanceOf(customer);
			const merchantBalBefore = await pmaToken.balanceOf(merchant);

			// Cancel the subscription
			await this.contract.cancelSubscription(currentSubscriptionId, {
				from: customer
			});

			// incrase time to complete paid trial
			await timeTravel(billingModel.frequency + 120);

			await expectRevert(
				this.contract.executePullPayment(currentSubscriptionId),
				'RecurringPullPaymentWithFreeTrial: SUBSCRIPTION_CANCELED'
			);

			const customerBalAfter = await pmaToken.balanceOf(customer);
			const merchantBalAfter = await pmaToken.balanceOf(merchant);

			expect(customerBalAfter).to.bignumber.be.eq(customerBalBefore);
			expect(merchantBalAfter).to.bignumber.be.eq(merchantBalBefore);
		});

		it('Should emit event for executePullPayment', async () => {
			await expectEvent(this.executePullPaymentTx, 'PullPaymentExecuted');
		});
	});

	describe('Getters', async () => {
		let currentBillingModelId;
		let currentSubscriptionId;
		let currentPullPaymentId;
		before(async () => {
			await this.contract.createBillingModel(
				billingModel.payee,
				billingModel.name,
				billingModel.merchantName,
				'',
				billingModel.merchantURL,
				billingModel.amount,
				billingModel.token,
				billingModel.frequency,
				billingModel.trialPeriod,
				billingModel.numberOfPayments,
				{ from: merchant }
			);

			currentBillingModelId = await this.contract.getCurrentBillingModelId();

			this.bmIds = await this.contract.getBillingModelIdsByAddress(merchant);

			await pmaToken.mint(customer, '1000000000000000000000000', {
				from: owner
			});
		});

		it('Should get subscription correctly', async () => {
			await this.contract.subscribeToBillingModel(currentBillingModelId, pmaToken.address, '', {
				from: customer
			});
			currentSubscriptionId = await this.contract.getCurrentSubscriptionId();

			let subscription = await this.contract.getSubscription(currentSubscriptionId);

			expect(subscription.pullPaymentIDs.length).to.be.eq(0);
			expect(subscription.isFreeTrialEnded).to.be.eq(false);

			subscription = await this.contract.getSubscription(currentSubscriptionId, {
				from: customer
			});
			currentPullPaymentId = await this.contract.getCurrentPullPaymentId();

			expect(subscription.isFreeTrialEnded).to.be.eq(false);

			await expectRevert(
				this.contract.getSubscription(0),
				'RecurringPullPaymentWithFreeTrial: INVALID_SUBSCRIPTION_ID'
			);
			await expectRevert(
				this.contract.getSubscription(15),
				'RecurringPullPaymentWithFreeTrial: INVALID_SUBSCRIPTION_ID'
			);
		});

		it('should get billing model correctly', async () => {
			this.bm = await this.contract.getBillingModel(currentBillingModelId);

			expect(this.bm.payee).to.be.eq(merchant);
			expect(this.bm.trialPeriod).to.bignumber.be.eq(new BN('120'));
			expect(this.bm.creationTime).to.bignumber.be.gt(new BN('0'));
			expect(this.bm.merchantURL).to.be.eq(billingModel.merchantURL);

			await expectRevert(
				this.contract.getBillingModel(15),
				'RecurringPullPaymentWithFreeTrial: INVALID_BILLING_MODEL_ID'
			);
			await expectRevert(
				this.contract.getBillingModel(0),
				'RecurringPullPaymentWithFreeTrial: INVALID_BILLING_MODEL_ID'
			);
		});

		it('should get pullPayment correctly', async () => {
			await this.contract.subscribeToBillingModel(currentBillingModelId, pmaToken.address, '', {
				from: customer
			});
			currentSubscriptionId = await this.contract.getCurrentSubscriptionId();

			// incrase time to complete trial period
			await timeTravel(billingModel.frequency + 120);
			await this.contract.executePullPayment(currentSubscriptionId);

			const ppIds = await this.contract.getPullPaymentsIdsByAddress(customer);

			currentPullPaymentId = await this.contract.getCurrentPullPaymentId();

			let pullPayment = await this.contract.getPullPayment(currentPullPaymentId);

			expect(pullPayment.paymentAmount).to.bignumber.be.eq(new BN('0'));
			expect(ppIds[ppIds.length - 1]).to.bignumber.be.eq(currentPullPaymentId);

			pullPayment = await this.contract.getPullPayment(currentPullPaymentId, {
				from: customer
			});

			expect(pullPayment.paymentAmount).to.bignumber.be.eq(new BN(billingModel.amount));

			await expectRevert(
				this.contract.getPullPayment(0),
				'RecurringPullPaymentWithFreeTrial: INVALID_PULLPAYMENT_ID'
			);
			await expectRevert(
				this.contract.getPullPayment(25),
				'RecurringPullPaymentWithFreeTrial: INVALID_PULLPAYMENT_ID'
			);
		});

		it('should check whether paid trial has ended or not', async () => {
			await this.contract.subscribeToBillingModel(currentBillingModelId, pmaToken.address, '', {
				from: customer
			});
			currentSubscriptionId = await this.contract.getCurrentSubscriptionId();

			let subscription = await this.contract.getSubscription(currentSubscriptionId, {
				from: customer
			});

			expect(subscription.isFreeTrialEnded).to.be.eq(false);
			expect(subscription.uniqueReference).to.be.eq(
				`RecurringPullPaymentWithFreeTrial_${currentBillingModelId}_${currentSubscriptionId}`
			);

			// incrase time to complete trial period
			await timeTravel(billingModel.frequency + 120);

			subscription = await this.contract.getSubscription(currentSubscriptionId, {
				from: customer
			});

			expect(subscription.isFreeTrialEnded).to.be.eq(true);
		});

		describe('getVersionNumber()', () => {
			it('should get version number correcntly', async () => {
				const version = await this.contract.getVersionNumber();
				expect(version[0]).to.bignumber.be.eq(new BN('1'));
				expect(version[1]).to.bignumber.be.eq(new BN('0'));
				expect(version[2]).to.bignumber.be.eq(new BN('0'));
				expect(version[3]).to.bignumber.be.eq(new BN('0'));
			});
		});
	});
});
