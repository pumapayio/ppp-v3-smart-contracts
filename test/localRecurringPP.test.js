// Load dependencies

const { deploySmartContracts } = require('../libs/utils');
const { expect } = require('chai');
const { timeTravel } = require('./helpers/timeHelper');
const { MaxUint256 } = require('@ethersproject/constants');
const { expectEvent, expectRevert, ether } = require('@openzeppelin/test-helpers');
const { BN } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS, MAX_UINT256 } = require('@openzeppelin/test-helpers/src/constants');
const { getGasCost } = require('./helpers/gasCost');
const BlockData = artifacts.require('BlockData');

// Start test block
contract('RecurringPullPayment', (accounts) => {
	let [owner, merchant, customer, user, user1,] = accounts;

	const billingModel = {
		payee: merchant,
		name: 'some name',
		merchantName: 'Merchant',
		merchantURL: 'url1',
		reference: 'Ref1',
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
		fundRceiver = contracts.tokenConverter.address;

		await ethToken.approve(executor.address, MaxUint256, { from: customer });
		await adaToken.approve(executor.address, MaxUint256, { from: customer });
		await pmaToken.approve(executor.address, MaxUint256, { from: customer });

		// pullPayment registry contract
		this.contract = contracts.recurringPP.contract;
		billingModel.token = contracts.pmaToken.address; // adaToken.address;
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
				billingModel.numberOfPayments,
				{ from: merchant }
			);

			await getGasCost(
				'RecurringPullPayment',
				'createBillingModel',
				this.createBillingModelTx.receipt.cumulativeGasUsed
			);
		});

		it('should create the billing model correctly', async () => {
			const bmId = await this.contract.getBillingModelIdsByAddress(merchant);
			currentBillingModelId = await this.contract.getCurrentBillingModelId();
			expect(bmId.toString()).to.be.eq('1');
			expect(currentBillingModelId).to.bignumber.be.eq(new BN('1'));
		});

		it('should revert when invalid payee address is specified while creating bm', async () => {
			await expectRevert(
				this.contract.createBillingModel(
					ZERO_ADDRESS,
					billingModel.name,
					billingModel.merchantName,
					billingModel.reference,
					billingModel.merchantURL,
					billingModel.amount,
					billingModel.token,
					billingModel.frequency,
					billingModel.numberOfPayments,
					{ from: merchant }
				),
				'RecurringPullPayment: INVALID_PAYEE_ADDRESS'
			);
		});

		it('should revert when invalid amount is specified while creating bm', async () => {
			await expectRevert(
				this.contract.createBillingModel(
					billingModel.payee,
					billingModel.name,
					billingModel.merchantName,
					billingModel.reference,
					billingModel.merchantURL,
					0,
					billingModel.token,
					billingModel.frequency,
					billingModel.numberOfPayments,
					{ from: merchant }
				),
				'RecurringPullPayment: INVALID_AMOUNT'
			);
		});

		it('should revert when invalid frequency is specified while creating bm', async () => {
			await expectRevert(
				this.contract.createBillingModel(
					billingModel.payee,
					billingModel.name,
					billingModel.merchantName,
					billingModel.reference,
					billingModel.merchantURL,
					billingModel.amount,
					billingModel.token,
					0,
					billingModel.numberOfPayments,
					{ from: merchant }
				),
				'RecurringPullPayment: INVALID_FREQUENCY'
			);
		});

		it('should revert when invalid no. of payments is specified while creating bm', async () => {
			await expectRevert(
				this.contract.createBillingModel(
					billingModel.payee,
					billingModel.name,
					billingModel.merchantName,
					billingModel.reference,
					billingModel.merchantURL,
					billingModel.amount,
					billingModel.token,
					billingModel.frequency,
					0,
					{ from: merchant }
				),
				'RecurringPullPayment: INVALID_NO_OF_PAYMENTS'
			);
		});

		it('should revert when invalid supported token is specified while creating bm', async () => {
			await expectRevert(
				this.contract.createBillingModel(
					billingModel.payee,
					billingModel.name,
					billingModel.merchantName,
					billingModel.reference,
					billingModel.merchantURL,
					billingModel.amount,
					ZERO_ADDRESS,
					billingModel.frequency,
					billingModel.numberOfPayments,
					{ from: merchant }
				),
				'RecurringPullPayment: UNSUPPORTED_TOKEN'
			);
		});

		it('should emit an event after creating the billing model', async () => {
			await expectEvent(this.createBillingModelTx, 'BillingModelCreated');
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
				billingModel.numberOfPayments,
				{ from: merchant }
			);
			const currentBillingModelId = await this.contract.getCurrentBillingModelId();

			const bmDetails = await this.contract.getBillingModel(currentBillingModelId);
			expect(bmDetails.merchantName).to.be.eq('');
			expect(bmDetails.uniqueReference).to.be.eq(`RecurringPullPayment_${currentBillingModelId}`);
		});

		it('should revert when existing reference is passed while creating bm', async () => {
			const currentBillingModelId = await this.contract.getCurrentBillingModelId();

			await expectRevert(
				this.contract.createBillingModel(
					billingModel.payee,
					billingModel.name,
					billingModel.merchantName,
					`RecurringPullPayment_${currentBillingModelId}`,
					billingModel.merchantURL,
					billingModel.amount,
					billingModel.token,
					billingModel.frequency,
					billingModel.numberOfPayments,
					{ from: merchant }
				),
				'RecurringPullPayment: REFERENCE_ALREADY_EXISTS'
			);
		});
	});

	describe('subscribeToBillingModel()', () => {
		let currentSubscriptionId;
		let currentBillingModelId;
		before('', async () => {
			currentBillingModelId = await this.contract.getCurrentBillingModelId();

			this.subscribeToBillingModelTx = await this.contract.subscribeToBillingModel(
				currentBillingModelId,
				billingModel.token,
				'subscriptionRef1',
				{
					from: customer
				}
			);

			await getGasCost(
				'RecurringPullPayment',
				'subscribeToBillingModel',
				this.subscribeToBillingModelTx.receipt.cumulativeGasUsed
			);
		});

		it('should subscribe to billing model correctly', async () => {
			const subscritionId = await this.contract.getSubscriptionIdsByAddress(customer);
			currentSubscriptionId = await this.contract.getCurrentSubscriptionId();

			expect(subscritionId.toString()).to.be.eq('1');
			expect(currentSubscriptionId).to.bignumber.be.eq(new BN('1'));
		});

		it('should emit an event correctly', async () => {
			await expectEvent(this.subscribeToBillingModelTx, 'NewSubscription');
			await expectEvent(this.subscribeToBillingModelTx, 'PullPaymentExecuted');
		});
		it('should revert when Invalid billing model is specified for subscription', async () => {
			await expectRevert(
				this.contract.subscribeToBillingModel(5, billingModel.token, 'subscriptionRef1', {
					from: customer
				}),
				'RecurringPullPayment: INVALID_BILLING_MODEL_ID'
			);
			await expectRevert(
				this.contract.subscribeToBillingModel(0, billingModel.token, 'subscriptionRef1', {
					from: customer
				}),
				'RecurringPullPayment: INVALID_BILLING_MODEL_ID'
			);
		});

		it('should subscribe to billing model with empty reference', async () => {
			await this.contract.subscribeToBillingModel(currentBillingModelId, billingModel.token, '', {
				from: customer
			});

			currentSubscriptionId = await this.contract.getCurrentSubscriptionId();

			const subscriptionDetails = await this.contract.getSubscription(currentSubscriptionId);
			expect(subscriptionDetails.uniqueReference).to.be.eq(
				`RecurringPullPayment_${currentBillingModelId}_${currentSubscriptionId}`
			);
		});

		it('should revert when invalid subscriber tries to cancel the subscription', async () => {
			await expectRevert(
				this.contract.cancelSubscription(2, { from: user }),
				'RecurringPullPayment: INVALID_CANCELER'
			);
		});

		it('should revert when invalid reference is passed while subscribing', async () => {
			currentSubscriptionId = await this.contract.getCurrentSubscriptionId();

			await expectRevert(
				this.contract.subscribeToBillingModel(
					currentBillingModelId,
					billingModel.token,
					`RecurringPullPayment_${currentBillingModelId}_${currentSubscriptionId}`,
					{
						from: customer
					}
				),
				'RecurringPullPayment: REFERENCE_ALREADY_EXISTS'
			);
		});
	});

	describe('cancelSubscription()', async () => {
		before('', async () => {
			this.cancelSubscriptionTx = await this.contract.cancelSubscription(1, {
				from: customer
			});

			await getGasCost(
				'RecurringPullPayment',
				'cancelSubscription',
				this.cancelSubscriptionTx.receipt.cumulativeGasUsed
			);
		});

		it('should cancel subscription correctly', async () => {
			const canceledIds = await this.contract.getCanceledSubscriptionIdsByAddress(customer);
			const subscription = await this.contract.getSubscription(1);
			console.log('subscription: ', subscription);
			expect(subscription.cancelledBy).to.be.eq(customer);

			expect(canceledIds.toString()).to.be.eq('1');
		});

		it('should cancel subscription by the merchant correctly', async () => {
			await this.contract.cancelSubscription(2, {
				from: merchant
			});

			const subscription = await this.contract.getSubscription(2);
			expect(subscription.cancelledBy).to.be.eq(merchant);
		});

		it('should emit an event after cancelling subscription', async () => {
			await expectEvent(this.cancelSubscriptionTx, 'SubscriptionCancelled');
		});
		it('should revert when invalid subscription id is specified while cancelling the subscription', async () => {
			await expectRevert(
				this.contract.cancelSubscription(0, { from: customer }),
				'RecurringPullPayment: INVALID_SUBSCRIPTION_ID'
			);
			await expectRevert(
				this.contract.cancelSubscription(5, { from: customer }),
				'RecurringPullPayment: INVALID_SUBSCRIPTION_ID'
			);
		});
	});

	describe('editBillingModel()', () => {
		let currentBillingModelId;
		let billingModelBefore;

		before('', async () => {
			currentBillingModelId = await this.contract.getCurrentBillingModelId();

			billingModelBefore = await this.contract.getBillingModel(currentBillingModelId);

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
				'RecurringPullPayment',
				'editBillingModel',
				this.editBillingModelTx.receipt.cumulativeGasUsed
			);
		});

		it('should edit the billing model correctly', async () => {
			const billingModelAfter = await this.contract.getBillingModel(currentBillingModelId);

			expect(billingModelBefore.payee).to.be.eq(merchant);
			expect(billingModelBefore.name).to.be.eq('some name');
			expect(billingModelBefore.merchantName).to.be.eq('');
			expect(billingModelBefore.settlementToken).to.be.eq(contracts.pmaToken.address);
			expect(billingModelBefore.frequency).to.bignumber.be.eq(new BN('600'));
			expect(billingModelBefore.numberOfPayments).to.bignumber.be.eq(new BN('5'));
			expect(billingModelBefore.merchantURL).to.be.eq('url1');

			expect(billingModelAfter.payee).to.be.eq(owner);
			expect(billingModelAfter.name).to.be.eq('model-1');
			expect(billingModelAfter.merchantName).to.be.eq('Merchant2');
			expect(billingModelAfter.settlementToken).to.be.eq(contracts.pmaToken.address);
			expect(billingModelAfter.frequency).to.bignumber.be.eq(new BN('600'));
			expect(billingModelAfter.numberOfPayments).to.bignumber.be.eq(new BN('5'));
			expect(billingModelAfter.merchantURL).to.be.eq('Url2');
		});

		it('should revert when non-payee tries to edit the billing model', async () => {
			await expectRevert(
				this.contract.editBillingModel(
					currentBillingModelId,
					owner,
					'model-1',
					'Merchant2',
					'Url2',
					{
						from: user1
					}
				),
				'RecurringPullPayment: INVALID_EDITOR'
			);
		});

		it('should revert when  no data is provided while editing the billing model', async () => {
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
				'RecurringPullPayment: INVALID_OPERATION'
			);
		});

		it('should revert when payee tries to edit the billing model with existing name', async () => {
			await expectRevert(
				this.contract.editBillingModel(currentBillingModelId, merchant, 'model-1', '', 'Url2', {
					from: owner
				}),
				'RecurringPullPayment: NAME_EXISTS'
			);
		});
		it('should revert when payee tries to edit the billing model with invalid billing model id', async () => {
			await expectRevert(
				this.contract.editBillingModel(5, merchant, 'model-2', 'Merchant2', 'Url2', {
					from: owner
				}),
				'RecurringPullPayment: INVALID_BILLING_MODEL_ID'
			);

			await expectRevert(
				this.contract.editBillingModel(0, merchant, 'model-2', 'Merchant2', 'Url2', {
					from: owner
				}),
				'RecurringPullPayment: INVALID_BILLING_MODEL_ID'
			);
		});

		it('should emit an event after editing the billing model details', async () => {
			await expectEvent(this.editBillingModelTx, 'BillingModelEdited');
		});
	});

	describe('executePullPayment()', () => {
		let currentBillingModelId;
		let currentSubscriptionId;
		let customerBalBefore;
		let merchantBalBefore;

		before('', async () => {
			this.executePullPaymentTx = await this.contract.createBillingModel(
				billingModel.payee,
				billingModel.name,
				billingModel.merchantName,
				billingModel.reference + '1',
				billingModel.merchantURL,
				billingModel.amount,
				billingModel.token,
				billingModel.frequency,
				billingModel.numberOfPayments,
				{ from: merchant }
			);

			await getGasCost(
				'RecurringPullPayment',
				'executePullPayment',
				this.executePullPaymentTx.receipt.cumulativeGasUsed
			);

			currentBillingModelId = await this.contract.getCurrentBillingModelId();

			customerBalBefore = await pmaToken.balanceOf(customer);
			merchantBalBefore = await pmaToken.balanceOf(merchant);

			// subscribe to billing model
			await this.contract.subscribeToBillingModel(
				currentBillingModelId,
				billingModel.token,
				'subscriptionRef2',
				{
					from: customer
				}
			);

			currentSubscriptionId = await this.contract.getCurrentSubscriptionId();
		});

		it('it should execute the first PullPayment correctly', async () => {
			const customerBalAfter = await pmaToken.balanceOf(customer);
			const merchantBalAfter = await pmaToken.balanceOf(merchant);

			expect(customerBalAfter).to.bignumber.be.lt(customerBalBefore);
			expect(merchantBalAfter).to.bignumber.be.gt(merchantBalBefore);
		});

		it('should execute the pullPayment after nextPaymentTimeStamp only', async () => {
			customerBalBefore = await pmaToken.balanceOf(customer);
			merchantBalBefore = await pmaToken.balanceOf(merchant);

			await expectRevert(
				this.contract.executePullPayment(currentSubscriptionId),
				'RecurringPullPayment: INVALID_EXECUTION_TIME'
			);

			// incrase time by frequency
			await timeTravel(billingModel.frequency + 600);
			this.executePullPaymentTx = await this.contract.executePullPayment(currentSubscriptionId);

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

		it('Should not execute PullPayment if subscription is cancelled', async () => {
			const customerBalBefore = await pmaToken.balanceOf(customer);
			const merchantBalBefore = await pmaToken.balanceOf(merchant);

			// incrase time by frequency
			await timeTravel(billingModel.frequency + 600);

			await expectRevert(
				this.contract.executePullPayment(1),
				'RecurringPullPayment: SUBSCRIPTION_CANCELED'
			);

			const customerBalAfter = await pmaToken.balanceOf(customer);
			const merchantBalAfter = await pmaToken.balanceOf(merchant);

			expect(customerBalAfter).to.bignumber.be.eq(customerBalBefore);
			expect(merchantBalAfter).to.bignumber.be.eq(merchantBalBefore);
		});

		it('Should not execute PullPayment if no. of payments are exceeded', async () => {
			const customerBalBefore = await pmaToken.balanceOf(customer);
			const merchantBalBefore = await pmaToken.balanceOf(merchant);

			// incrase time by frequency
			await timeTravel(billingModel.frequency + 600);
			await expectRevert(
				this.contract.executePullPayment(currentSubscriptionId),
				'RecurringPullPayment: NO_OF_PAYMENTS_EXCEEDED'
			);

			const customerBalAfter = await pmaToken.balanceOf(customer);
			const merchantBalAfter = await pmaToken.balanceOf(merchant);

			expect(customerBalAfter).to.bignumber.be.eq(customerBalBefore);
			expect(merchantBalAfter).to.bignumber.be.eq(merchantBalBefore);
		});

		it('should emit an event after executing the pullPayment', async () => {
			await expectEvent(this.executePullPaymentTx, 'PullPaymentExecuted');
		});
	});

	describe('checkUpkeep()', async () => {
		before('', async () => {
			billingModel.frequency = 60; // 1 minute

			this.createBillingModelTx = await this.contract.createBillingModel(
				billingModel.payee,
				billingModel.name,
				billingModel.merchantName,
				billingModel.reference + '34',
				billingModel.merchantURL,
				billingModel.amount,
				billingModel.token,
				billingModel.frequency,
				billingModel.numberOfPayments,
				{ from: merchant }
			);

			await pmaToken.mint(user1, ether('30'), { from: owner });
		});

		it('should cancel the upkeep after extension period', async () => {
			await pmaToken.approve(executor.address, MAX_UINT256, { from: user1 });

			currentBillingModelId = await this.contract.getCurrentBillingModelId();

			await this.contract.subscribeToBillingModel(
				currentBillingModelId,
				billingModel.token,
				'subscriptionRef6',
				{
					from: user1
				}
			);

			await timeTravel(billingModel.frequency);

			let upkeepData = await this.contract.checkUpkeep('0x');

			console.log('upkeepData: ', upkeepData);

			await this.contract.performUpkeep(upkeepData.performData);

			const currentSubscriptionId = await this.contract.getCurrentSubscriptionId();
			let subscriptionInfo = await this.contract.getSubscription(currentSubscriptionId);

			expect(subscriptionInfo.numberOfPayments).to.bignumber.be.eq(new BN('3'));

			await timeTravel(billingModel.frequency);

			upkeepData = await this.contract.checkUpkeep('0x');
			await this.contract.performUpkeep(upkeepData.performData);
			subscriptionInfo = await this.contract.getSubscription(currentSubscriptionId);
			expect(subscriptionInfo.numberOfPayments).to.bignumber.be.eq(new BN('2'));

			await timeTravel(billingModel.frequency);

			const bal = await pmaToken.balanceOf(user1);
			await pmaToken.transfer(owner, bal, { from: user1 });

			upkeepData = await this.contract.checkUpkeep('0x');
			await this.contract.performUpkeep(upkeepData.performData);
			subscriptionInfo = await this.contract.getSubscription(currentSubscriptionId);
			expect(subscriptionInfo.numberOfPayments).to.bignumber.be.eq(new BN('2'));
			expect(subscriptionInfo.cancelTimestamp).to.bignumber.be.eq(new BN('0'));

			await timeTravel(120);

			upkeepData = await this.contract.checkUpkeep('0x');
			await this.contract.performUpkeep(upkeepData.performData);
			subscriptionInfo = await this.contract.getSubscription(currentSubscriptionId);
			expect(subscriptionInfo.numberOfPayments).to.bignumber.be.eq(new BN('2'));
			expect(subscriptionInfo.cancelTimestamp).to.bignumber.be.gt(new BN('0'));
			expect(subscriptionInfo.cancelledBy).to.be.eq(owner);
		});
	});

	describe('Getters', async () => {
		describe('getBillingModel()', () => {
			let currentBillingModelId;
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
					billingModel.numberOfPayments,
					{ from: merchant }
				);
				currentBillingModelId = await this.contract.getCurrentBillingModelId();

				await this.contract.subscribeToBillingModel(currentBillingModelId, pmaToken.address, '', {
					from: customer
				});
				currentSubscriptionId = await this.contract.getCurrentSubscriptionId();
			});

			it('should get the billing model details correctly for bm creator', async () => {
				const bmModel = await this.contract.getBillingModel(currentBillingModelId);

				expect(bmModel.payee).to.be.eq(merchant);
				expect(bmModel.name).to.be.eq('some name');
				expect(bmModel.merchantName).to.be.eq('Merchant');
				expect(bmModel.uniqueReference).to.be.eq(`RecurringPullPayment_${currentBillingModelId}`);
				expect(bmModel.merchantURL).to.be.eq(billingModel.merchantURL);
				expect(bmModel.amount).to.bignumber.be.eq(bmModel.amount);
				expect(bmModel.settlementToken).to.be.eq(billingModel.token);
				expect(bmModel.frequency).to.bignumber.be.eq(new BN('60'));
				expect(bmModel.numberOfPayments).to.bignumber.be.eq(new BN('5'));
				expect(bmModel.creationTime).to.bignumber.be.gt(new BN('0'));
			});

			it('should get the billing model details correctly for bm creator', async () => {
				const bmModel = await this.contract.getBillingModel(
					currentBillingModelId,
					pmaToken.address
				);

				expect(bmModel.payee).to.be.eq(merchant);
				expect(bmModel.name).to.be.eq('some name');
				expect(bmModel.merchantName).to.be.eq('Merchant');
				expect(bmModel.uniqueReference).to.be.eq(`RecurringPullPayment_${currentBillingModelId}`);
				expect(bmModel.merchantURL).to.be.eq(billingModel.merchantURL);
				expect(bmModel.paymentAmount).to.bignumber.be.eq(bmModel.amount);
				expect(bmModel.settlementToken).to.be.eq(billingModel.token);
				expect(bmModel.frequency).to.bignumber.be.eq(new BN('600'));
				expect(bmModel.numberOfPayments).to.bignumber.be.eq(new BN('5'));
				expect(bmModel.creationTime).to.bignumber.be.gt(new BN('0'));
			});

			it('should revert when invalid billing model id is specified', async () => {
				await expectRevert(
					this.contract.getBillingModel(15),
					'RecurringPullPayment: INVALID_BILLING_MODEL_ID'
				);
				await expectRevert(
					this.contract.getBillingModel(0),
					'RecurringPullPayment: INVALID_BILLING_MODEL_ID'
				);
			});
		});

		describe('getSubscription()', () => {
			let currentSubscriptionId;
			let currentPullPaymentId;

			before('', async () => {
				currentSubscriptionId = await this.contract.getCurrentSubscriptionId();
				currentPullPaymentId = await this.contract.getCurrentPullPaymentId();
			});

			it('should get the subscription details correctly for subscriber', async () => {
				const subscriptionData = await this.contract.getSubscription(currentSubscriptionId, {
					from: customer
				});
				currentBillingModelId = await this.contract.getCurrentBillingModelId();

				expect(subscriptionData.subscriber).to.be.eq(customer);
				expect(subscriptionData.paymentToken).to.be.eq(billingModel.token);
				expect(subscriptionData.numberOfPayments).to.bignumber.be.eq(new BN('4'));
				expect(subscriptionData.startTimestamp).to.bignumber.be.gt(new BN('1'));
				expect(subscriptionData.cancelTimestamp).to.bignumber.be.eq(new BN('0'));
				expect(subscriptionData.nextPaymentTimestamp).to.bignumber.be.gt(new BN('1'));
				expect(subscriptionData.lastPaymentTimestamp).to.bignumber.be.gt(new BN('1'));
				expect(subscriptionData.pullPaymentIDs[0]).to.bignumber.be.eq(currentPullPaymentId);
				expect(subscriptionData.uniqueReference).to.be.eq(
					`RecurringPullPayment_${currentBillingModelId}_${currentSubscriptionId}`
				);
			});

			it('should revert when invalid subscription id is specified', async () => {
				await expectRevert(
					this.contract.getSubscription(0),
					'RecurringPullPayment: INVALID_SUBSCRIPTION_ID'
				);
				await expectRevert(
					this.contract.getSubscription(15),
					'RecurringPullPayment: INVALID_SUBSCRIPTION_ID'
				);
			});
		});

		describe('getPullPayment()', () => {
			let currentBillingModelId;
			let currentSubscriptionId;
			let currentPullPaymentId;

			before('', async () => {
				currentBillingModelId = await this.contract.getCurrentBillingModelId();
				currentSubscriptionId = await this.contract.getCurrentSubscriptionId();
				currentPullPaymentId = await this.contract.getCurrentPullPaymentId();
			});

			it('should get the pullPayment details correctly', async () => {
				const pullPayment = await this.contract.getPullPayment(currentPullPaymentId);

				expect(pullPayment.paymentAmount).to.bignumber.be.eq(new BN('0'));
				expect(pullPayment.executionTimestamp).to.bignumber.be.eq(new BN('0'));
				expect(pullPayment.billingModelID).to.bignumber.be.eq(currentBillingModelId);
				expect(pullPayment.subscriptionID).to.bignumber.be.eq(currentSubscriptionId);
			});
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
