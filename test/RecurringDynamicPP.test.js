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
contract('Recurring Dynamic PullPayment', (accounts) => {
	let [owner, merchant, customer, user, fundRceiver] = accounts;

	const billingModel = {
		payee: merchant,
		merchantName: 'Merchant',
		reference: 'Ref1',
		merchantURL: 'url1'
	};

	const name = web3.utils.padRight(web3.utils.fromAscii('some name'), 64);

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
		this.contract = contracts.recurringDynamicPullPayment.contract;
	});

	describe('createBillingModel()', () => {
		let currentBillingModelId;

		before('', async () => {
			this.createBillingModelTx1 = await this.contract.createBillingModel(
				billingModel.payee,
				1,
				billingModel.merchantName,
				billingModel.reference,
				billingModel.merchantURL,
				{
					from: merchant
				}
			);

			this.createBillingModelTx2 = await this.contract.createBillingModel(
				billingModel.payee,
				2,
				billingModel.merchantName,
				billingModel.reference + '1',
				billingModel.merchantURL,
				{
					from: merchant
				}
			);

			this.createBillingModelTx3 = await this.contract.createBillingModel(
				billingModel.payee,
				3,
				billingModel.merchantName,
				billingModel.reference + '2',
				billingModel.merchantURL,
				{
					from: merchant
				}
			);

			currentBillingModelId = await this.contract.getCurrentBillingModelId();

			await getGasCost(
				'RecurringDynamicPullPayment',
				'createBillingModel',
				this.createBillingModelTx1.receipt.cumulativeGasUsed
			);
		});

		it('should create the billing model correctly', async () => {
			const bmIds = await this.contract.getBillingModelIdsByAddress(merchant);

			const bmModel = await this.contract.getBillingModel(currentBillingModelId);

			expect(bmModel.payee).to.be.eq(merchant);
			expect(bmModel.recurringPPType).to.bignumber.be.eq(new BN('3'));
			expect(bmModel.merchantURL).to.be.eq(billingModel.merchantURL);
			expect(bmIds[0]).to.bignumber.be.eq(new BN('1'));
			expect(bmIds[1]).to.bignumber.be.eq(new BN('2'));
			expect(bmIds[2]).to.bignumber.be.eq(new BN('3'));
		});
		it('should revert when invalid payee address is specified for billing model', async () => {
			await expectRevert(
				this.contract.createBillingModel(
					ZERO_ADDRESS,
					1,
					billingModel.merchantName,
					billingModel.reference,
					billingModel.merchantURL,
					{ from: merchant }
				),
				'RecurringDynamicPullPayment: INVALID_PAYEE_ADDRESS'
			);
		});

		it('should revert when invalid recurrent pull payment type is specified for billing model', async () => {
			await expectRevert(
				this.contract.createBillingModel(
					billingModel.payee,
					0,
					billingModel.merchantName,
					billingModel.reference,
					billingModel.merchantURL,
					{
						from: merchant
					}
				),
				'RecurringDynamicPullPayment: INVALID_RECURRING_PP_TYPE'
			);

			await expectRevert(
				this.contract.createBillingModel(
					billingModel.payee,
					4,
					billingModel.merchantName,
					billingModel.reference,
					billingModel.merchantURL,
					{
						from: merchant
					}
				),
				'RecurringDynamicPullPayment: INVALID_RECURRING_PP_TYPE'
			);
		});

		it('should emit an event after creating the billing model', async () => {
			await expectEvent(this.createBillingModelTx1, 'BillingModelCreated', {
				billingModelID: new BN('1'),
				payee: billingModel.payee,
				recurringPPType: new BN('1')
			});

			await expectEvent(this.createBillingModelTx2, 'BillingModelCreated', {
				billingModelID: new BN('2'),
				payee: billingModel.payee,
				recurringPPType: new BN('2')
			});

			await expectEvent(this.createBillingModelTx3, 'BillingModelCreated', {
				billingModelID: new BN('3'),
				payee: billingModel.payee,
				recurringPPType: new BN('3')
			});
		});

		it('should create billing model with empty merchant name and bm reference', async () => {
			await this.contract.createBillingModel(
				billingModel.payee,
				1,
				'',
				'',
				billingModel.merchantURL,
				{
					from: merchant
				}
			);
			const currentBillingModelId = await this.contract.getCurrentBillingModelId();

			const bmDetails = await this.contract.getBillingModel(currentBillingModelId);
			expect(bmDetails.merchantName).to.be.eq('');
			expect(bmDetails.uniqueReference).to.be.eq(
				`RecurringDynamicPullPayment_${currentBillingModelId}`
			);
		});
	});

	describe('subscribeToBillingModel()', () => {
		let currentBillingModelId;

		it('should subscribe normal Billing model correctly', async () => {
			const customerBalBefore = await pmaToken.balanceOf(customer);

			await this.contract.createBillingModel(
				billingModel.payee,
				1,
				billingModel.merchantName,
				billingModel.reference + '3',
				billingModel.merchantURL,
				{
					from: merchant
				}
			);
			currentBillingModelId = await this.contract.getCurrentBillingModelId();

			const tx = await this.contract.subscribeToBillingModel(
				currentBillingModelId,
				name,
				pmaToken.address,
				pmaToken.address,
				15,
				600,
				5,
				0,
				0,
				'subscriptionRef1',
				{
					from: customer
				}
			);

			await getGasCost(
				'RecurringDynamicPullPayment',
				'subscribeToBillingModel',
				tx.receipt.cumulativeGasUsed
			);

			const subscritionId = await this.contract.getSubscriptionIdsByAddress(customer);
			expect(subscritionId.toString()).to.be.eq('1');

			await expectEvent(tx, 'NewSubscription');
			await expectEvent(tx, 'PullPaymentExecuted');

			const customerBalAfter = await pmaToken.balanceOf(customer);
			const merchantBalAfter = await pmaToken.balanceOf(merchant);

			expect(customerBalAfter).to.bignumber.be.lt(customerBalBefore);
			expect(merchantBalAfter).to.bignumber.be.eq(new BN('14'));
		});

		it('should subscribe free trial billing model correctly', async () => {
			const customerBalBefore = await pmaToken.balanceOf(customer);
			const merchantBalBefore = await pmaToken.balanceOf(merchant);

			await this.contract.createBillingModel(
				billingModel.payee,
				2,
				billingModel.merchantName,
				billingModel.reference + '4',
				billingModel.merchantURL,
				{
					from: merchant
				}
			);
			currentBillingModelId = await this.contract.getCurrentBillingModelId();

			const tx = await this.contract.subscribeToBillingModel(
				currentBillingModelId,
				name,
				pmaToken.address,
				pmaToken.address,
				15,
				600,
				5,
				100,
				0,
				'',
				{
					from: customer
				}
			);

			const subscritionId = await this.contract.getSubscriptionIdsByAddress(customer);
			expect(subscritionId[0].toString()).to.be.eq('1');
			await expectEvent(tx, 'NewSubscription');

			const customerBalAfter = await pmaToken.balanceOf(customer);
			const merchantBalAfter = await pmaToken.balanceOf(merchant);

			expect(customerBalAfter).to.bignumber.be.eq(customerBalBefore);
			expect(merchantBalAfter).to.bignumber.be.eq(merchantBalBefore);
		});

		it('should subscribe paid trial billing model correctly', async () => {
			const customerBalBefore = await pmaToken.balanceOf(customer);
			const merchantBalBefore = await pmaToken.balanceOf(merchant);

			await this.contract.createBillingModel(
				billingModel.payee,
				3,
				billingModel.merchantName,
				billingModel.reference + '5',
				billingModel.merchantURL,
				{
					from: merchant
				}
			);
			currentBillingModelId = await this.contract.getCurrentBillingModelId();

			const tx = await this.contract.subscribeToBillingModel(
				currentBillingModelId,
				name,
				pmaToken.address,
				pmaToken.address,
				15,
				600,
				5,
				100,
				5,
				'',
				{
					from: customer
				}
			);

			const subscritionId = await this.contract.getSubscriptionIdsByAddress(customer);
			expect(subscritionId[0].toString()).to.be.eq('1');
			await expectEvent(tx, 'NewSubscription');

			const customerBalAfter = await pmaToken.balanceOf(customer);
			const merchantBalAfter = await pmaToken.balanceOf(merchant);

			expect(customerBalAfter).to.bignumber.be.lt(customerBalBefore);
			expect(merchantBalAfter).to.bignumber.be.eq(merchantBalBefore.add(new BN('5')));
		});

		it('should revert when invalid billing model id is specified while subscribing', async () => {
			await expectRevert(
				this.contract.subscribeToBillingModel(
					0,
					name,
					pmaToken.address,
					pmaToken.address,
					15,
					600,
					5,
					0,
					0,
					'subscriptionRef1',
					{
						from: customer
					}
				),
				'RecurringDynamicPullPayment: INVALID_BILLING_MODEL_ID'
			);
			await expectRevert(
				this.contract.subscribeToBillingModel(
					15,
					name,
					pmaToken.address,
					pmaToken.address,
					15,
					600,
					5,
					0,
					0,
					'subscriptionRef1',
					{
						from: customer
					}
				),
				'RecurringDynamicPullPayment: INVALID_BILLING_MODEL_ID'
			);
		});

		it('should revert when invalid payment amount is specified while subscribing', async () => {
			await expectRevert(
				this.contract.subscribeToBillingModel(
					1,
					name,
					pmaToken.address,
					pmaToken.address,
					0,
					600,
					5,
					0,
					0,
					'subscriptionRef1',
					{
						from: customer
					}
				),
				'RecurringDynamicPullPayment: INVALID_PAYMENT_AMOUNT'
			);
		});

		it('should revert when invalid settlement token is specified while subscribing', async () => {
			await expectRevert(
				this.contract.subscribeToBillingModel(
					1,
					name,
					ZERO_ADDRESS,
					pmaToken.address,
					15,
					600,
					5,
					0,
					0,
					'subscriptionRef1',
					{
						from: customer
					}
				),
				'RecurringDynamicPullPayment: UNSUPPORTED_TOKEN'
			);
		});

		it('should revert when invalid frequency is specified while subscribing', async () => {
			await expectRevert(
				this.contract.subscribeToBillingModel(
					1,
					name,
					pmaToken.address,
					pmaToken.address,
					15,
					0,
					5,
					0,
					0,
					'subscriptionRef1',
					{
						from: customer
					}
				),
				'RecurringDynamicPullPayment: INVALID_FREQUENCY'
			);
		});

		it('should revert when invalid total number of payments are specified while subscribing', async () => {
			await expectRevert(
				this.contract.subscribeToBillingModel(
					1,
					name,
					pmaToken.address,
					pmaToken.address,
					15,
					600,
					0,
					0,
					0,
					'subscriptionRef1',
					{
						from: customer
					}
				),
				'RecurringDynamicPullPayment: INVALID_TOTAL_NO_OF_PAYMENTS'
			);
		});

		it('should revert when invalid trial period is specified while subscribing', async () => {
			await expectRevert(
				this.contract.subscribeToBillingModel(
					2,
					name,
					pmaToken.address,
					pmaToken.address,
					15,
					600,
					5,
					0,
					0,
					'subscriptionRef1',
					{
						from: customer
					}
				),
				'RecurringDynamicPullPayment: INVALID_TRIAL_PERIOD'
			);
		});

		it('should revert when invalid initial amount is specified while subscribing', async () => {
			await expectRevert(
				this.contract.subscribeToBillingModel(
					3,
					name,
					pmaToken.address,
					pmaToken.address,
					15,
					600,
					5,
					100,
					0,
					'subscriptionRef1',
					{
						from: customer
					}
				),
				'RecurringDynamicPullPayment: INVALID_INITIAL_AMOUNT'
			);
		});

		it('should subscribe to billing model with empty reference', async () => {
			await this.contract.subscribeToBillingModel(
				currentBillingModelId,
				name,
				pmaToken.address,
				pmaToken.address,
				15,
				600,
				5,
				100,
				5,
				'',
				{
					from: customer
				}
			);

			currentSubscriptionId = await this.contract.getCurrentSubscriptionId();

			const subscriptionDetails = await this.contract.getSubscription(currentSubscriptionId);
			console.log('subscriptionDetails: ', subscriptionDetails);
			expect(subscriptionDetails[0].uniqueReference).to.be.eq(
				`RecurringDynamicPullPayment_${currentBillingModelId}_${currentSubscriptionId}`
			);
		});

		it('should revert while cancelling subscription when invalid subscriber tries to cancel', async () => {
			await expectRevert(
				this.contract.cancelSubscription(currentSubscriptionId, {
					from: user
				}),
				'RecurringDynamicPullPayment: INVALID_CANCELER'
			);
		});
	});

	describe('cancelSubscription()', () => {
		let currentBillingModelId;
		let currentSubscriptionId;
		before('', async () => {
			await this.contract.createBillingModel(
				billingModel.payee,
				3,
				billingModel.merchantName,
				'',
				billingModel.merchantURL,
				{
					from: merchant
				}
			);

			currentBillingModelId = await this.contract.getCurrentBillingModelId();

			// paid trial subscription
			await this.contract.subscribeToBillingModel(
				currentBillingModelId,
				name,
				pmaToken.address,
				pmaToken.address,
				15,
				600,
				5,
				100,
				10,
				'',
				{
					from: customer
				}
			);

			currentSubscriptionId = await this.contract.getCurrentSubscriptionId();

			this.cancelSubscriptionTx = await this.contract.cancelSubscription(currentSubscriptionId, {
				from: customer
			});

			await getGasCost(
				'RecurringDynamicPullPayment',
				'cancelSubscription',
				this.cancelSubscriptionTx.receipt.cumulativeGasUsed
			);
		});

		it('should cancel subscription correctly', async () => {
			const canceledIds = await this.contract.getCanceledSubscriptionIdsByAddress(customer);
			expect(canceledIds[0]).to.bignumber.be.eq(currentSubscriptionId);

			const subscription3 = await this.contract.getSubscription(currentSubscriptionId, {
				from: customer
			});
			expect(subscription3[0].uniqueReference).to.be.eq(
				`RecurringDynamicPullPayment_${currentBillingModelId}_${currentSubscriptionId}`
			);
			expect(subscription3[0].cancelTimestamp).to.bignumber.be.gt(new BN('0'));
			expect(subscription3[0].cancelledBy).to.be.eq(customer);
		});

		it('should cancel subscription by the merchant correctly', async () => {
			await this.contract.cancelSubscription(2, {
				from: merchant
			});

			const subscription = await this.contract.getSubscription(2);
			expect(subscription[0].cancelledBy).to.be.eq(merchant);
		});

		it('should emit an event after cancelling subscription', async () => {
			await expectEvent(this.cancelSubscriptionTx, 'SubscriptionCancelled');
		});

		it('should revert while cancelling subscription when invalid subscription id is specified', async () => {
			await expectRevert(
				this.contract.cancelSubscription(0, { from: customer }),
				'RecurringDynamicPullPayment: INVALID_SUBSCRIPTION_ID'
			);
			await expectRevert(
				this.contract.cancelSubscription(15, { from: customer }),
				'RecurringDynamicPullPayment: INVALID_SUBSCRIPTION_ID'
			);
		});
	});

	describe('editBillingModel()', () => {
		let currentBillingModelId;
		before('', async () => {
			await this.contract.createBillingModel(
				billingModel.payee,
				1,
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
				'RecurringDynamicPullPayment',
				'editBillingModel',
				this.editBillingModelTx.receipt.cumulativeGasUsed
			);
		});

		it('should edit the billing model correctly', async () => {
			const bm = await this.contract.getBillingModel(currentBillingModelId);

			expect(bm.payee).to.be.eq(owner);
			expect(bm.uniqueReference).to.be.eq(`RecurringDynamicPullPayment_${currentBillingModelId}`);
			expect(bm.merchantName).to.be.eq('Merchant2');
			expect(bm.merchantURL).to.be.eq('Url2');
		});

		it('should emit an event after editing billing model', async () => {
			await expectEvent(this.editBillingModelTx, 'BillingModelEdited', {
				billingModelID: currentBillingModelId,
				newPayee: owner,
				oldPayee: merchant
			});
		});

		it('should revert when invalid billing model id is specified for editing', async () => {
			await expectRevert(
				this.contract.editBillingModel(0, customer, 'Merchant2', 'Url2', {
					from: owner
				}),
				'RecurringDynamicPullPayment: INVALID_BILLING_MODEL_ID'
			);
			await expectRevert(
				this.contract.editBillingModel(15, customer, 'Merchant2', 'Url2', {
					from: owner
				}),
				'RecurringDynamicPullPayment: INVALID_BILLING_MODEL_ID'
			);
		});

		it('should revert when invalid editor is specified while editing bm', async () => {
			await expectRevert(
				this.contract.editBillingModel(currentBillingModelId, customer, '', 'Url2', {
					from: merchant
				}),
				'RecurringDynamicPullPayment: INVALID_EDITOR'
			);
		});
	});

	describe('executePullPayment()', () => {
		let currentBillingModelId;
		let currentSubscriptionId;

		describe('Normal Recurring Dynamic PullPayment Execution', () => {
			before('', async () => {
				this.customerBalBefore = await pmaToken.balanceOf(customer);
				this.merchantBalBefore = await pmaToken.balanceOf(merchant);
				this.fundReceiverBalBefore = await pmaToken.balanceOf(fundRceiver);

				await this.contract.createBillingModel(
					billingModel.payee,
					1,
					billingModel.merchantName,
					'',
					billingModel.merchantURL,
					{
						from: merchant
					}
				);
				currentBillingModelId = await this.contract.getCurrentBillingModelId();

				// normal subscription
				await this.contract.subscribeToBillingModel(
					currentBillingModelId,
					name,
					pmaToken.address,
					pmaToken.address,
					15,
					600,
					5,
					0,
					0,
					'',
					{
						from: customer
					}
				);

				currentSubscriptionId = await this.contract.getCurrentSubscriptionId();
			});

			it('Should Execute PullPayment after the subscription', async () => {
				const customerBalAfter = await pmaToken.balanceOf(customer);
				const merchantBalAfter = await pmaToken.balanceOf(merchant);
				const fundReceiverBalAfter = await pmaToken.balanceOf(fundRceiver);

				expect(customerBalAfter).to.bignumber.be.lt(this.customerBalBefore);
				expect(merchantBalAfter).to.bignumber.be.eq(this.merchantBalBefore.add(new BN('14')));
				expect(fundReceiverBalAfter).to.bignumber.be.eq(
					this.fundReceiverBalBefore.add(new BN('1'))
				);
			});

			it('Should Execute PullPayment after nextPaymentTimeStamp only', async () => {
				await expectRevert(
					this.contract.executePullPayment(currentSubscriptionId),
					'RecurringDynamicPullPayment: INVALID_EXECUTION_TIME'
				);
				this.customerBalBefore = await pmaToken.balanceOf(customer);
				this.merchantBalBefore = await pmaToken.balanceOf(merchant);

				// incrase time by frequency
				await timeTravel(600);

				this.executePullPaymentTx = await this.contract.executePullPayment(currentSubscriptionId);

				await getGasCost(
					'RecurringDynamicPullPayment',
					'executePullPayment',
					this.executePullPaymentTx.receipt.cumulativeGasUsed
				);

				const customerBalAfter = await pmaToken.balanceOf(customer);
				const merchantBalAfter = await pmaToken.balanceOf(merchant);

				expect(customerBalAfter).to.bignumber.be.lt(this.customerBalBefore);
				expect(merchantBalAfter).to.bignumber.be.eq(this.merchantBalBefore.add(new BN('14')));
			});

			it('Should Execute PullPayment correctly', async () => {
				this.customerBalBefore = await pmaToken.balanceOf(customer);
				this.merchantBalBefore = await pmaToken.balanceOf(merchant);

				// incrase time by frequency
				await timeTravel(600);
				await this.contract.executePullPayment(currentSubscriptionId);

				// incrase time by frequency
				await timeTravel(600);
				await this.contract.executePullPayment(currentSubscriptionId);

				// incrase time by frequency
				await timeTravel(600);
				await this.contract.executePullPayment(currentSubscriptionId);

				const customerBalAfter = await pmaToken.balanceOf(customer);
				const merchantBalAfter = await pmaToken.balanceOf(merchant);

				expect(customerBalAfter).to.bignumber.be.lt(this.customerBalBefore);
				expect(merchantBalAfter).to.bignumber.be.gt(this.merchantBalBefore);
			});

			it('Should not execute PullPayment if no. of payments are exceeded', async () => {
				// incrase time by frequency
				await timeTravel(600);
				await expectRevert(
					this.contract.executePullPayment(currentSubscriptionId),
					'RecurringDynamicPullPayment: NO_OF_PAYMENTS_EXCEEDED'
				);
			});

			it('Should not execute PullPayment if subscription is cancelled', async () => {
				// Cancel the subscription
				await this.contract.cancelSubscription(currentSubscriptionId, {
					from: customer
				});

				this.customerBalBefore = await pmaToken.balanceOf(customer);
				this.merchantBalBefore = await pmaToken.balanceOf(merchant);

				// incrase time by frequency
				await timeTravel(600);

				await expectRevert(
					this.contract.executePullPayment(currentSubscriptionId),
					'RecurringDynamicPullPayment: SUBSCRIPTION_CANCELED'
				);

				const customerBalAfter = await pmaToken.balanceOf(customer);
				const merchantBalAfter = await pmaToken.balanceOf(merchant);

				expect(customerBalAfter).to.bignumber.be.eq(this.customerBalBefore);
				expect(merchantBalAfter).to.bignumber.be.eq(this.merchantBalBefore);
			});

			it('Should emit event for executePullPayment', async () => {
				await expectEvent(this.executePullPaymentTx, 'PullPaymentExecuted');
			});
		});
		describe('Free Recurring Dynamic PullPayment Execution', () => {
			before(async () => {
				await this.contract.createBillingModel(
					billingModel.payee,
					2,
					billingModel.merchantName,
					'',
					billingModel.merchantURL,
					{
						from: merchant
					}
				);
				currentBillingModelId = await this.contract.getCurrentBillingModelId();

				this.customerBalBefore = await pmaToken.balanceOf(customer);
				this.merchantBalBefore = await pmaToken.balanceOf(merchant);

				// normal subscription
				this.subscribeToBillingModelTx = await this.contract.subscribeToBillingModel(
					currentBillingModelId,
					name,
					pmaToken.address,
					pmaToken.address,
					15,
					600,
					5,
					100,
					0,
					'',
					{
						from: customer
					}
				);
				currentSubscriptionId = await this.contract.getCurrentSubscriptionId();
			});

			it('Should not Execute PullPayment after the subscription', async () => {
				const customerBalAfter = await pmaToken.balanceOf(customer);
				const merchantBalAfter = await pmaToken.balanceOf(merchant);

				expectEvent.notEmitted(this.subscribeToBillingModelTx, 'PullPaymentExecuted');

				expect(customerBalAfter).to.bignumber.be.eq(this.customerBalBefore);
				expect(merchantBalAfter).to.bignumber.be.eq(this.merchantBalBefore);
			});

			it('Should Execute PullPayment after trial period only', async () => {
				await expectRevert(
					this.contract.executePullPayment(currentSubscriptionId),
					'RecurringDynamicPullPayment: INVALID_EXECUTION_TIME'
				);

				this.customerBalBefore = await pmaToken.balanceOf(customer);
				this.merchantBalBefore = await pmaToken.balanceOf(merchant);

				// incrase time by trial period
				await timeTravel(600);

				await this.contract.executePullPayment(currentSubscriptionId);

				const customerBalAfter = await pmaToken.balanceOf(customer);
				const merchantBalAfter = await pmaToken.balanceOf(merchant);

				expect(customerBalAfter).to.bignumber.be.lt(this.customerBalBefore);
				expect(merchantBalAfter).to.bignumber.be.gt(this.merchantBalBefore);
			});

			it('Should Execute PullPayment correctly', async () => {
				this.customerBalBefore = await pmaToken.balanceOf(customer);
				this.merchantBalBefore = await pmaToken.balanceOf(merchant);

				// should not execute pullPayment during trial period
				await expectRevert(
					this.contract.executePullPayment(currentSubscriptionId),
					'RecurringDynamicPullPayment: INVALID_EXECUTION_TIME'
				);

				// incrase time to complete trial period
				await timeTravel(600);
				this.executePullPaymentTx = await this.contract.executePullPayment(currentSubscriptionId);

				await expectRevert(
					this.contract.executePullPayment(currentSubscriptionId),
					'RecurringDynamicPullPayment: INVALID_EXECUTION_TIME'
				);
				// incrase time by frequency
				await timeTravel(600);
				await this.contract.executePullPayment(currentSubscriptionId);

				// incrase time by frequency
				await timeTravel(600);
				await this.contract.executePullPayment(currentSubscriptionId);

				// incrase time by frequency
				await timeTravel(600);
				await this.contract.executePullPayment(currentSubscriptionId);

				const customerBalAfter = await pmaToken.balanceOf(customer);
				const merchantBalAfter = await pmaToken.balanceOf(merchant);

				expect(customerBalAfter).to.bignumber.be.lt(this.customerBalBefore);
				expect(merchantBalAfter).to.bignumber.be.gt(this.merchantBalBefore);
			});

			it('Should not execute PullPayment if no. of payments are exceeded', async () => {
				this.customerBalBefore = await pmaToken.balanceOf(customer);
				this.merchantBalBefore = await pmaToken.balanceOf(merchant);

				// incrase time by frequency
				await timeTravel(600);
				await expectRevert(
					this.contract.executePullPayment(currentSubscriptionId),
					'RecurringDynamicPullPayment: NO_OF_PAYMENTS_EXCEEDED'
				);

				const customerBalAfter = await pmaToken.balanceOf(customer);
				const merchantBalAfter = await pmaToken.balanceOf(merchant);

				expect(customerBalAfter).to.bignumber.be.eq(this.customerBalBefore);
				expect(merchantBalAfter).to.bignumber.be.eq(this.merchantBalBefore);
			});

			it('Should not execute PullPayment if subscription is cancelled', async () => {
				// Cancel the subscription
				await this.contract.cancelSubscription(currentSubscriptionId, {
					from: customer
				});

				this.customerBalBefore = await pmaToken.balanceOf(customer);
				this.merchantBalBefore = await pmaToken.balanceOf(merchant);

				// incrase time to complete trial period
				await timeTravel(600);

				await expectRevert(
					this.contract.executePullPayment(currentSubscriptionId),
					'RecurringDynamicPullPayment: SUBSCRIPTION_CANCELED'
				);

				const customerBalAfter = await pmaToken.balanceOf(customer);
				const merchantBalAfter = await pmaToken.balanceOf(merchant);

				expect(customerBalAfter).to.bignumber.be.eq(this.customerBalBefore);
				expect(merchantBalAfter).to.bignumber.be.eq(this.merchantBalBefore);
			});

			it('Should emit event for executePullPayment', async () => {
				await expectEvent(this.executePullPaymentTx, 'PullPaymentExecuted');
			});
		});

		describe('Paid Recurring Dynamic PullPayment Execution', () => {
			before(async () => {
				await this.contract.createBillingModel(
					billingModel.payee,
					3,
					billingModel.merchantName,
					'',
					billingModel.merchantURL,
					{
						from: merchant
					}
				);
				currentBillingModelId = await this.contract.getCurrentBillingModelId();

				this.customerBalBefore = await pmaToken.balanceOf(customer);
				this.merchantBalBefore = await pmaToken.balanceOf(merchant);

				// normal subscription
				this.subscribeToBillingModelTx = await this.contract.subscribeToBillingModel(
					currentBillingModelId,
					name,
					pmaToken.address,
					pmaToken.address,
					15,
					600,
					5,
					100,
					5,
					'',
					{
						from: customer
					}
				);

				currentSubscriptionId = await this.contract.getCurrentSubscriptionId();
			});
			it('Should get subscription with paid trial', async () => {
				const customerBalAfter = await pmaToken.balanceOf(customer);
				const merchantBalAfter = await pmaToken.balanceOf(merchant);

				expectEvent.notEmitted(this.subscribeToBillingModelTx, 'PullPaymentExecuted');

				expect(customerBalAfter).to.bignumber.be.lt(this.customerBalBefore);
				expect(merchantBalAfter).to.bignumber.be.eq(this.merchantBalBefore.add(new BN('5')));
			});

			it('Should Execute PullPayment after paid trial only', async () => {
				await expectRevert(
					this.contract.executePullPayment(currentSubscriptionId),
					'RecurringDynamicPullPayment: INVALID_EXECUTION_TIME'
				);
				this.customerBalBefore = await pmaToken.balanceOf(customer);
				this.merchantBalBefore = await pmaToken.balanceOf(merchant);
				this.fundReceiverBalBefore = await pmaToken.balanceOf(fundRceiver);

				// incrase time to complete paid trial
				await timeTravel(600);

				this.executePullPaymentTx = await this.contract.executePullPayment(currentSubscriptionId);

				const customerBalAfter = await pmaToken.balanceOf(customer);
				const merchantBalAfter = await pmaToken.balanceOf(merchant);
				const fundReceiverBalAfter = await pmaToken.balanceOf(fundRceiver);

				expect(customerBalAfter).to.bignumber.be.lt(this.customerBalBefore);
				expect(merchantBalAfter).to.bignumber.be.eq(this.merchantBalBefore.add(new BN('14')));
				expect(fundReceiverBalAfter).to.bignumber.be.eq(
					this.fundReceiverBalBefore.add(new BN('1'))
				);
			});

			it('Should Execute PullPayment correctly', async () => {
				await expectRevert(
					this.contract.executePullPayment(currentSubscriptionId),
					'RecurringDynamicPullPayment: INVALID_EXECUTION_TIME'
				);
				this.customerBalBefore = await pmaToken.balanceOf(customer);
				this.merchantBalBefore = await pmaToken.balanceOf(merchant);

				// incrase time to complete paid trial
				await timeTravel(600);
				// payment-1
				await this.contract.executePullPayment(currentSubscriptionId);

				await expectRevert(
					this.contract.executePullPayment(currentSubscriptionId),
					'RecurringDynamicPullPayment: INVALID_EXECUTION_TIME'
				);

				// incrase time by frequency
				await timeTravel(600);
				// payment-2
				await this.contract.executePullPayment(currentSubscriptionId);

				// incrase time by frequency
				await timeTravel(600);
				// payment-3
				await this.contract.executePullPayment(currentSubscriptionId);

				// incrase time by frequency
				await timeTravel(600);
				// payment-4
				await this.contract.executePullPayment(currentSubscriptionId);

				// incrase time by frequency
				await timeTravel(600);
				await expectRevert(
					this.contract.executePullPayment(currentSubscriptionId),
					'RecurringDynamicPullPayment: NO_OF_PAYMENTS_EXCEEDED'
				);

				const customerBalAfter = await pmaToken.balanceOf(customer);
				const merchantBalAfter = await pmaToken.balanceOf(merchant);

				expect(customerBalAfter).to.bignumber.be.lt(this.customerBalBefore);
				expect(merchantBalAfter).to.bignumber.be.gt(this.merchantBalBefore);
			});

			it('Should not execute PullPayment if no. of payments are exceeded', async () => {
				this.customerBalBefore = await pmaToken.balanceOf(customer);
				this.merchantBalBefore = await pmaToken.balanceOf(merchant);

				// incrase time by frequency
				await timeTravel(600);
				await expectRevert(
					this.contract.executePullPayment(currentSubscriptionId),
					'RecurringDynamicPullPayment: NO_OF_PAYMENTS_EXCEEDED'
				);

				const customerBalAfter = await pmaToken.balanceOf(customer);
				const merchantBalAfter = await pmaToken.balanceOf(merchant);

				expect(customerBalAfter).to.bignumber.be.eq(this.customerBalBefore);
				expect(merchantBalAfter).to.bignumber.be.eq(this.merchantBalBefore);
			});

			it('Should not execute PullPayment if subscription is cancelled', async () => {
				// Cancel the subscription
				await this.contract.cancelSubscription(currentSubscriptionId, {
					from: customer
				});

				this.customerBalBefore = await pmaToken.balanceOf(customer);
				this.merchantBalBefore = await pmaToken.balanceOf(merchant);

				// incrase time to complete paid trial
				await timeTravel(600);

				await expectRevert(
					this.contract.executePullPayment(currentSubscriptionId),
					'RecurringDynamicPullPayment: SUBSCRIPTION_CANCELED'
				);

				const customerBalAfter = await pmaToken.balanceOf(customer);
				const merchantBalAfter = await pmaToken.balanceOf(merchant);

				expect(customerBalAfter).to.bignumber.be.eq(this.customerBalBefore);
				expect(merchantBalAfter).to.bignumber.be.eq(this.merchantBalBefore);
			});

			it('Should emit event for executePullPayment', async () => {
				await expectEvent(this.executePullPaymentTx, 'PullPaymentExecuted');
			});
		});
	});

	describe('Getters', async () => {
		let currentBillingModelId1;
		let currentBillingModelId2;
		let currentBillingModelId3;

		let currentSubscriptionId;
		let currentPullPaymentId;
		before(async () => {
			await this.contract.createBillingModel(
				billingModel.payee,
				1,
				billingModel.merchantName,
				'',
				billingModel.merchantURL,
				{
					from: merchant
				}
			);
			await this.contract.createBillingModel(
				billingModel.payee,
				2,
				billingModel.merchantName,
				'',
				billingModel.merchantURL,
				{
					from: merchant
				}
			);
			await this.contract.createBillingModel(
				billingModel.payee,
				3,
				billingModel.merchantName,
				'',
				billingModel.merchantURL,
				{
					from: merchant
				}
			);

			currentBillingModelId1 = (await this.contract.getCurrentBillingModelId()) - new BN('2');
			currentBillingModelId2 = (await this.contract.getCurrentBillingModelId()) - new BN('1');
			currentBillingModelId3 = await this.contract.getCurrentBillingModelId();

			this.customerBalBefore = await pmaToken.balanceOf(customer);
			this.merchantBalBefore = await pmaToken.balanceOf(merchant);

			this.bmType = await this.contract.getBillingModelIdsByAddress(merchant);
		});

		it('Should get subscription correctly', async () => {
			const customerBalBefore = await pmaToken.balanceOf(customer);
			const merchantBalBefore = await pmaToken.balanceOf(merchant);
			const fundReceiverBalBefore = await pmaToken.balanceOf(fundRceiver);

			await this.contract.subscribeToBillingModel(
				currentBillingModelId1,
				name,
				pmaToken.address,
				pmaToken.address,
				15,
				600,
				5,
				0,
				0,
				'',
				{
					from: customer
				}
			);

			currentSubscriptionId = await this.contract.getCurrentSubscriptionId();
			let subscription = await this.contract.getSubscription(currentSubscriptionId);

			expect(subscription[0].subscriber).to.be.eq(customer);
			expect(subscription[0].paymentAmount).to.bignumber.be.eq(new BN('15'));
			expect(subscription[0].settlementToken).to.be.eq(pmaToken.address);
			expect(subscription[0].paymentToken).to.be.eq(pmaToken.address);
			expect(subscription[0].totalPayments).to.bignumber.be.eq(new BN('5'));
			expect(subscription[0].remainingPayments).to.bignumber.be.eq(new BN('4'));
			expect(subscription[0].frequency).to.bignumber.be.eq(new BN('600'));
			expect(subscription[0].totalPayments).to.bignumber.be.eq(new BN('5'));
			expect(subscription.trialPeriod).to.bignumber.be.eq(new BN('0'));
			expect(subscription.initialAmount).to.bignumber.be.eq(new BN('0'));

			subscription = await this.contract.getSubscription(currentSubscriptionId, {
				from: customer
			});

			currentPullPaymentId = await this.contract.getCurrentPullPaymentId();

			expect(subscription[0].pullPaymentIDs.toString()).to.be.eq(currentPullPaymentId.toString());

			const customerBalAfter = await pmaToken.balanceOf(customer);
			const merchantBalAfter = await pmaToken.balanceOf(merchant);
			const fundReceiverBalAfter = await pmaToken.balanceOf(fundRceiver);

			expect(customerBalAfter).to.bignumber.be.eq(customerBalBefore.sub(new BN('15')));
			expect(merchantBalAfter).to.bignumber.be.eq(merchantBalBefore.add(new BN('14')));
			expect(fundReceiverBalAfter).to.bignumber.be.eq(fundReceiverBalBefore.add(new BN('1')));

			await expectRevert(
				this.contract.getSubscription(0),
				'RecurringDynamicPullPayment: INVALID_SUBSCRIPTION_ID'
			);
			await expectRevert(
				this.contract.getSubscription(45),
				'RecurringDynamicPullPayment: INVALID_SUBSCRIPTION_ID'
			);
		});

		it('Should get subscription for free trial billing model correctly', async () => {
			const customerBalBefore = await pmaToken.balanceOf(customer);
			const merchantBalBefore = await pmaToken.balanceOf(merchant);

			await this.contract.subscribeToBillingModel(
				currentBillingModelId2,
				name,
				pmaToken.address,
				pmaToken.address,
				15,
				600,
				5,
				100,
				0,
				'',
				{
					from: customer
				}
			);
			currentSubscriptionId = await this.contract.getCurrentSubscriptionId();

			let subscription = await this.contract.getSubscription(currentSubscriptionId);

			expect(subscription[0].subscriber).to.be.eq(customer);
			expect(subscription[0].paymentAmount).to.bignumber.be.eq(new BN('15'));
			expect(subscription[0].settlementToken).to.be.eq(pmaToken.address);
			expect(subscription[0].paymentToken).to.be.eq(pmaToken.address);
			expect(subscription[0].totalPayments).to.bignumber.be.eq(new BN('5'));
			expect(subscription[0].remainingPayments).to.bignumber.be.eq(new BN('5'));
			expect(subscription[0].frequency).to.bignumber.be.eq(new BN('600'));
			expect(subscription[0].totalPayments).to.bignumber.be.eq(new BN('5'));
			expect(subscription.trialPeriod).to.bignumber.be.eq(new BN('100'));
			expect(subscription.initialAmount).to.bignumber.be.eq(new BN('0'));

			subscription = await this.contract.getSubscription(currentSubscriptionId, {
				from: customer
			});

			const customerBalAfter = await pmaToken.balanceOf(customer);
			const merchantBalAfter = await pmaToken.balanceOf(merchant);

			expect(customerBalAfter).to.bignumber.be.eq(customerBalBefore);
			expect(merchantBalAfter).to.bignumber.be.eq(merchantBalBefore);
		});

		it('Should get subscription for paid trial billing model correctly', async () => {
			const merchantBalBefore = await pmaToken.balanceOf(merchant);

			await this.contract.subscribeToBillingModel(
				currentBillingModelId3,
				name,
				pmaToken.address,
				pmaToken.address,
				15,
				600,
				5,
				100,
				5,
				'',
				{
					from: customer
				}
			);
			currentSubscriptionId = await this.contract.getCurrentSubscriptionId();

			let subscription = await this.contract.getSubscription(currentSubscriptionId);

			expect(subscription[0].subscriber).to.be.eq(customer);
			expect(subscription[0].paymentAmount).to.bignumber.be.eq(new BN('15'));
			expect(subscription[0].settlementToken).to.be.eq(pmaToken.address);
			expect(subscription[0].paymentToken).to.be.eq(pmaToken.address);
			expect(subscription[0].remainingPayments).to.bignumber.be.eq(new BN('5'));
			expect(subscription[0].frequency).to.bignumber.be.eq(new BN('600'));
			expect(subscription[0].totalPayments).to.bignumber.be.eq(new BN('5'));
			expect(subscription.trialPeriod).to.bignumber.be.eq(new BN('100'));
			expect(subscription.initialAmount).to.bignumber.be.eq(new BN('5'));
			expect(subscription[0].pullPaymentIDs.toString()).to.be.eq('');

			subscription = await this.contract.getSubscription(currentSubscriptionId, {
				from: customer
			});

			const customerBalAfter = await pmaToken.balanceOf(customer);
			const merchantBalAfter = await pmaToken.balanceOf(merchant);

			expect(customerBalAfter).to.bignumber.be.lt(this.customerBalBefore);
			expect(merchantBalAfter).to.bignumber.be.eq(merchantBalBefore.add(new BN('5')));
		});

		it('should get billing model correctly', async () => {
			let bm = await this.contract.getBillingModel(currentBillingModelId1);
			expect(bm.payee).to.be.eq(merchant);
			expect(bm.recurringPPType).to.bignumber.be.eq(new BN('1'));
			expect(bm.creationTime).to.bignumber.be.gt(new BN('0'));

			const bm2 = await this.contract.getBillingModel(currentBillingModelId2);
			expect(bm2.payee).to.be.eq(merchant);
			expect(bm2.recurringPPType).to.bignumber.be.eq(new BN('2'));
			expect(bm2.creationTime).to.bignumber.be.gt(new BN('0'));

			const bm3 = await this.contract.getBillingModel(currentBillingModelId3);
			expect(bm3.payee).to.be.eq(merchant);
			expect(bm3.recurringPPType).to.bignumber.be.eq(new BN('3'));
			expect(bm3.creationTime).to.bignumber.be.gt(new BN('0'));

			await this.contract.subscribeToBillingModel(
				currentBillingModelId1,
				name,
				pmaToken.address,
				pmaToken.address,
				15,
				600,
				5,
				100,
				5,
				'',
				{
					from: customer
				}
			);

			currentSubscriptionId = await this.contract.getCurrentSubscriptionId();

			bm = await this.contract.getBillingModel(currentBillingModelId1, {
				from: merchant
			});
			expect(bm.payee).to.be.eq(merchant);
			expect(bm.merchantName).to.be.eq(billingModel.merchantName);
			expect(bm.uniqueReference).to.be.eq(`RecurringDynamicPullPayment_${currentBillingModelId1}`);
			expect(bm.recurringPPType.toString()).to.bignumber.be.eq('1');
			expect(bm.subscriptionIDs[1].toString()).to.be.eq(currentSubscriptionId.toString());
			expect(bm.creationTime).to.bignumber.be.gt(new BN('0'));

			await expectRevert(
				this.contract.getBillingModel(35),
				'RecurringDynamicPullPayment: INVALID_BILLING_MODEL_ID'
			);
			await expectRevert(
				this.contract.getBillingModel(0),
				'RecurringDynamicPullPayment: INVALID_BILLING_MODEL_ID'
			);
		});

		it('should get pullPayment correctly', async () => {
			await this.contract.subscribeToBillingModel(
				currentBillingModelId1,
				name,
				pmaToken.address,
				pmaToken.address,
				15,
				600,
				5,
				100,
				5,
				'',
				{
					from: customer
				}
			);

			const ppId = await this.contract.getPullPaymentsIdsByAddress(customer);
			const subscriptionID = await this.contract.getCurrentSubscriptionId();
			currentPullPaymentId = await this.contract.getCurrentPullPaymentId();
			expect(ppId[ppId.length - 1]).to.bignumber.be.eq(currentPullPaymentId);

			let pullPayment = await this.contract.getPullPayment(currentPullPaymentId);
			expect(pullPayment.paymentAmount).to.bignumber.be.eq(new BN('0'));
			expect(pullPayment.executionTimestamp).to.bignumber.be.eq(new BN('0'));

			expect(pullPayment.billingModelID.toString()).to.be.eq(currentBillingModelId1.toString());
			expect(pullPayment.subscriptionID.toString()).to.be.eq(subscriptionID.toString());

			pullPayment = await this.contract.getPullPayment(currentPullPaymentId, {
				from: customer
			});

			expect(pullPayment.paymentAmount).to.bignumber.be.eq(new BN('15'));
			expect(pullPayment.executionTimestamp).to.bignumber.be.gt(new BN('0'));

			await expectRevert(
				this.contract.getPullPayment(0),
				'RecurringDynamicPullPayment: INVALID_PULLPAYMENT_ID'
			);
			await expectRevert(
				this.contract.getPullPayment(45),
				'RecurringDynamicPullPayment: INVALID_PULLPAYMENT_ID'
			);
		});
	});
});
