// Load dependencies
const { deploySmartContracts } = require('../libs/utils');
const { expect } = require('chai');
require('chai').should();
const { addLiquidity } = require('./helpers/swap');
const { getGasCost } = require('./helpers/gasCost');

const { MaxUint256 } = require('@ethersproject/constants');

const { expectEvent, expectRevert, ether, BN } = require('@openzeppelin/test-helpers');
const { MAX_UINT256 } = require('@openzeppelin/test-helpers/src/constants');

const BlockData = artifacts.require('BlockData');

// Start test block
contract('Swap Executor', (accounts) => {
	let [owner, merchant, customer, user, fundRceiver] = accounts;

	const billingModel = {
		payee: merchant,
		name: 'some name',
		merchantName: 'Merchant',
		reference: 'Ref1',
		merchantURL: 'url1',
		amount: ether('100'), // web3.utils.toWei("15", "ether"),
		frequency: 600, // 10 minutes
		numberOfPayments: 5
	};

	let contracts = {};
	let pmaToken = {};
	let ethToken = {};
	let adaToken = {};
	let executor = {};
	let wbnb = {};

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
		wbnb = contracts.wbnb.contract;

		// singlePullPayment contract
		this.contract = contracts.singlePullPayment.contract;
		this.registry = contracts.registry.contract;
		this.factory = contracts.factory.contract;
		this.router = contracts.router.contract;

		// mint tokens to user
		await ethToken.mint(ether('100000000000000000000000'));
		await adaToken.mint(ether('100000000000000000000000'));
		await wbnb.deposit({ from: owner, value: ether('100000000000') });

		// transfer tokens to user
		await ethToken.transfer(customer, ether('100000000000000'));
		await adaToken.transfer(customer, ether('100000000000000'));
		await wbnb.transfer(customer, ether('1000000000'));

		// create lp Pool
		// PMA-WBNB
		await addLiquidity(
			this.factory,
			this.router,
			owner,
			pmaToken,
			wbnb,
			ether('1000000'),
			ether('1000000')
		);

		// PMA-ADA
		await addLiquidity(
			this.factory,
			this.router,
			owner,
			adaToken,
			pmaToken,
			ether('1000'),
			ether('1000000')
		);

		// ETH-WBNB
		await addLiquidity(
			this.factory,
			this.router,
			owner,
			ethToken,
			wbnb,
			ether('1000000'),
			ether('1000000')
		);

		// // ADA-WBNB
		// await addLiquidity(
		// 	this.factory,
		// 	this.router,
		// 	customer,
		// 	ethToken,
		// 	wbnb,
		// 	ether('1000000'),
		// 	ether('1000000')
		// );
	});

	describe('Swap with PMA', () => {
		it('should subscribe billing model with PMA when PMA is settlement token (PMA -> PMA) ', async () => {
			const amounts = await executor.getReceivingAmount(
				pmaToken.address,
				pmaToken.address,
				billingModel.amount
			);

			console.log(
				'receiverAmount: ',
				amounts[0].toString(),
				' userPayableAmount: ',
				amounts[1].toString(),
				' executionFee: ',
				amounts[2].toString()
			);

			billingModel.token = pmaToken.address;

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

			const pmaTokenBalBefore = await pmaToken.balanceOf(merchant);
			const fundRceiverBalBefore = await pmaToken.balanceOf(fundRceiver);
			const userBalBefore = await pmaToken.balanceOf(customer);

			const currentBillingModelId = await this.contract.getCurrentBillingModelId();
			await pmaToken.approve(executor.address, MaxUint256, { from: customer });

			const tx = await this.contract.subscribeToBillingModel(
				currentBillingModelId,
				pmaToken.address,
				'',
				{
					from: customer
				}
			);

			await getGasCost('SwapTest', 'subscribeToBillingModel(PMA->PMA)', tx.receipt.cumulativeGasUsed);

			const pmaTokenBalAfter = await pmaToken.balanceOf(merchant);
			const fundRceiverBalAfter = await pmaToken.balanceOf(fundRceiver);
			const userBalAfter = await pmaToken.balanceOf(customer);

			await expectEvent(tx, 'NewSubscription');
			expect(pmaTokenBalAfter).to.bignumber.be.eq(pmaTokenBalBefore.add(amounts[0]));
			expect(userBalAfter).to.bignumber.be.eq(userBalBefore.sub(amounts[1]));
			expect(fundRceiverBalAfter).to.bignumber.be.eq(fundRceiverBalBefore.add(amounts[2]));
		});

		it('should subscribe billing model with WBNB when ADA is settlement token (non-PMA -> non-PMA) ', async () => {
			const amounts = await executor.getReceivingAmount(
				wbnb.address,
				adaToken.address,
				billingModel.amount
			);

			console.log(
				'receiverAmount: ',
				amounts[0].toString(),
				' userPayableAmount: ',
				amounts[1].toString(),
				' executionFee: ',
				amounts[2].toString()
			);

			billingModel.token = adaToken.address;
			await this.contract.createBillingModel(
				billingModel.payee,
				billingModel.name,
				billingModel.merchantName,
				'',
				billingModel.merchantURL,
				billingModel.amount,
				billingModel.token,
				{ from: merchant }
			);

			const adaTokenBalBefore = await adaToken.balanceOf(merchant);
			const fundRceiverBalBefore = await wbnb.balanceOf(fundRceiver);
			const userBalBefore = await wbnb.balanceOf(customer);

			const currentBillingModelId = await this.contract.getCurrentBillingModelId();

			await wbnb.approve(executor.address, MaxUint256, { from: customer });

			const tx = await this.contract.subscribeToBillingModel(currentBillingModelId, wbnb.address, '', {
				from: customer
			});
			await getGasCost('SwapTest', 'subscribeToBillingModel(WBNB->ADA)', tx.receipt.cumulativeGasUsed);

			const adaTokenBalAfter = await adaToken.balanceOf(merchant);
			const fundRceiverBalAfter = await pmaToken.balanceOf(fundRceiver);
			const userBalAfter = await wbnb.balanceOf(customer);

			await expectEvent(tx, 'NewSubscription');
			expect(adaTokenBalAfter).to.bignumber.be.eq(adaTokenBalBefore.add(amounts[0]));
			expect(userBalAfter).to.bignumber.be.eq(userBalBefore.sub(amounts[1]));
			expect(fundRceiverBalAfter).to.bignumber.be.eq(fundRceiverBalBefore.add(amounts[2]));
		});

		it('should subscribe billing model with ADA when WBNB is settlement token (non-PMA -> non-PMA) ', async () => {
			const amounts = await executor.getReceivingAmount(
				adaToken.address,
				wbnb.address,
				ether('10')
			);

			console.log(
				'receiverAmount: ',
				amounts[0].toString(),
				' userPayableAmount: ',
				amounts[1].toString(),
				' executionFee: ',
				amounts[2].toString()
			);

			billingModel.token = wbnb.address;
			await this.contract.createBillingModel(
				billingModel.payee,
				billingModel.name,
				billingModel.merchantName,
				'',
				billingModel.merchantURL,
				billingModel.amount,
				billingModel.token,
				{ from: merchant }
			);

			const wbnbTokenBalBefore = await wbnb.balanceOf(merchant);
			const fundRceiverBalBefore = await pmaToken.balanceOf(fundRceiver);
			const userBalBefore = await adaToken.balanceOf(customer);

			const currentBillingModelId = await this.contract.getCurrentBillingModelId();

			await adaToken.approve(executor.address, MaxUint256, { from: customer });

			const tx = await this.contract.subscribeToBillingModel(
				currentBillingModelId,
				adaToken.address,
				'',
				{
					from: customer
				}
			);
			await getGasCost('SwapTest', 'subscribeToBillingModel(ADA->WBNB)', tx.receipt.cumulativeGasUsed);

			const wbnbTokenBalAfter = await wbnb.balanceOf(merchant);
			const fundRceiverBalAfter = await pmaToken.balanceOf(fundRceiver);
			const userBalAfter = await adaToken.balanceOf(customer);

			await expectEvent(tx, 'NewSubscription');
			expect(wbnbTokenBalAfter).to.bignumber.be.eq(wbnbTokenBalBefore.add(amounts[0]));
			expect(userBalAfter).to.bignumber.be.eq(userBalBefore.sub(amounts[1]));
			expect(fundRceiverBalAfter).to.bignumber.be.eq(fundRceiverBalBefore.add(amounts[2]));
		});

		it('should subscribe billing model with ADA when ETH is settlement token (non-PMA -> non-PMA)', async () => {
			const amounts = await executor.getReceivingAmount(adaToken.address, ethToken.address, ether('10'));

			console.log(
				'receiverAmount: ',
				amounts[0].toString(),
				' userPayableAmount: ',
				amounts[1].toString(),
				' executionFee: ',
				amounts[2].toString()
			);

			billingModel.token = ethToken.address;
			await this.contract.createBillingModel(
				billingModel.payee,
				billingModel.name,
				billingModel.merchantName,
				'',
				billingModel.merchantURL,
				billingModel.amount,
				billingModel.token,
				{ from: merchant }
			);

			const adaTokenBalBefore = await adaToken.balanceOf(merchant);
			const fundRceiverBalBefore = await pmaToken.balanceOf(fundRceiver);
			const userBalBefore = await adaToken.balanceOf(customer);

			const currentBillingModelId = await this.contract.getCurrentBillingModelId();

			await adaToken.approve(executor.address, MaxUint256, { from: customer });
			const tx = await this.contract.subscribeToBillingModel(currentBillingModelId, adaToken.address, '', {
				from: customer
			});

			await getGasCost('SwapTest', 'subscribeToBillingModel(ADA->ETH)', tx.receipt.cumulativeGasUsed);

			const adaTokenBalAfter = await adaToken.balanceOf(merchant);
			const fundRceiverBalAfter = await pmaToken.balanceOf(fundRceiver);
			const userBalAfter = await adaToken.balanceOf(customer);

			expect(adaTokenBalAfter).to.bignumber.be.eq(adaTokenBalBefore.add(amounts[0]));
			expect(userBalAfter).to.bignumber.be.eq(userBalBefore.sub(amounts[1]));
			expect(fundRceiverBalAfter).to.bignumber.be.eq(fundRceiverBalBefore.add(amounts[2]));

		});

		it('should subscribe billing model with WBNB when PMA is settlement token (non-PMA -> PMA)', async () => {
			const amounts = await executor.getReceivingAmount(
				wbnb.address,
				pmaToken.address,
				billingModel.amount
			);

			console.log(
				'receiverAmount: ',
				amounts[0].toString(),
				' userPayableAmount: ',
				amounts[1].toString(),
				' executionFee: ',
				amounts[2].toString()
			);

			billingModel.token = pmaToken.address;
			await this.contract.createBillingModel(
				billingModel.payee,
				billingModel.name,
				billingModel.merchantName,
				'',
				billingModel.merchantURL,
				billingModel.amount,
				billingModel.token,
				{ from: merchant }
			);

			const pmaTokenBalBefore = await pmaToken.balanceOf(merchant);
			const fundRceiverBalBefore = await pmaToken.balanceOf(fundRceiver);
			const userBalBefore = await wbnb.balanceOf(customer);

			const currentBillingModelId = await this.contract.getCurrentBillingModelId();

			await wbnb.approve(executor.address, MaxUint256, { from: customer });
			const tx = await this.contract.subscribeToBillingModel(currentBillingModelId, wbnb.address, '', {
				from: customer
			});

			await getGasCost('SwapTest', 'subscribeToBillingModel(WBNB->PMA)', tx.receipt.cumulativeGasUsed);

			const pmaTokenAfter = await pmaToken.balanceOf(merchant);
			const fundRceiverBalAfter = await pmaToken.balanceOf(fundRceiver);
			const userBalAfter = await wbnb.balanceOf(customer);

			expect(pmaTokenAfter).to.bignumber.be.eq(pmaTokenBalBefore.add(amounts[0]));
			expect(userBalAfter).to.bignumber.be.eq(userBalBefore.sub(amounts[1]));
			expect(fundRceiverBalAfter).to.bignumber.be.eq(fundRceiverBalBefore.add(amounts[2]));

			await expectEvent(tx, 'NewSubscription');
		});

		it('should subscribe billing model with ADA when ADA is settlement token (ADA -> ADA)', async () => {
			const amounts = await executor.getReceivingAmount(
				adaToken.address,
				adaToken.address,
				billingModel.amount
			);

			console.log(
				'receiverAmount: ',
				amounts[0].toString(),
				' userPayableAmount: ',
				amounts[1].toString(),
				' executionFee: ',
				amounts[2].toString()
			);

			billingModel.token = adaToken.address;
			await this.contract.createBillingModel(
				billingModel.payee,
				billingModel.name,
				billingModel.merchantName,
				'',
				billingModel.merchantURL,
				billingModel.amount,
				billingModel.token,
				{ from: merchant }
			);

			await adaToken.approve(this.router.address, MAX_UINT256, { from: customer });

			const adaTokenBalBefore = await adaToken.balanceOf(merchant);
			const fundRceiverBalBefore = await adaToken.balanceOf(fundRceiver);
			const userBalBefore = await adaToken.balanceOf(customer);

			const currentBillingModelId = await this.contract.getCurrentBillingModelId();

			await adaToken.approve(executor.address, MaxUint256, { from: customer });
			const tx = await this.contract.subscribeToBillingModel(
				currentBillingModelId,
				adaToken.address,
				'',
				{
					from: customer
				}
			);
			await getGasCost('SwapTest', 'subscribeToBillingModel(ADA->ADA)', tx.receipt.cumulativeGasUsed);

			const adaTokenBalAfter = await adaToken.balanceOf(merchant);
			const fundRceiverBalAfter = await pmaToken.balanceOf(fundRceiver);
			const userBalAfter = await adaToken.balanceOf(customer);

			console.log('beofre: ', adaTokenBalBefore.toString());
			console.log('after: ', adaTokenBalAfter.toString());
			console.log('add: ', adaTokenBalBefore.add(amounts[0]).toString());

			expect(adaTokenBalAfter).to.bignumber.be.eq(adaTokenBalBefore.add(amounts[0]));
			expect(userBalAfter).to.bignumber.be.eq(userBalBefore.sub(amounts[1]));
			expect(fundRceiverBalAfter).to.bignumber.be.eq(fundRceiverBalBefore.add(amounts[2]));

			await expectEvent(tx, 'NewSubscription');
		});

		it('should not subscribe billing model when there is no path through the PMA i.e  when ETH is settlement and payment token (ETH -> ETH)', async () => {
			await expectRevert(executor.getReceivingAmount(
				ethToken.address,
				ethToken.address,
				billingModel.amount
			), 'Executor: NO_SWAP_PATH_EXISTS');


			billingModel.token = ethToken.address;
			await this.contract.createBillingModel(
				billingModel.payee,
				billingModel.name,
				billingModel.merchantName,
				'',
				billingModel.merchantURL,
				billingModel.amount,
				billingModel.token,
				{ from: merchant }
			);

			await ethToken.approve(this.router.address, MAX_UINT256, { from: customer });

			const currentBillingModelId = await this.contract.getCurrentBillingModelId();

			await ethToken.approve(executor.address, MaxUint256, { from: customer });
			await expectRevert(this.contract.subscribeToBillingModel(
				currentBillingModelId,
				ethToken.address,
				'',
				{
					from: customer
				}
			), 'Executor: NO_SWAP_PATH_EXISTS');

		});

		it('should subscribe billing model with PMA when WBNB is settlement token (PMA -> non-PMA)', async () => {
			const amounts = await executor.getReceivingAmount(
				pmaToken.address,
				wbnb.address,
				billingModel.amount
			);
			console.log(
				'receiverAmount: ',
				amounts[0].toString(),
				' userPayableAmount: ',
				amounts[1].toString(),
				' executionFee: ',
				amounts[2].toString()
			);

			billingModel.token = wbnb.address;
			await this.contract.createBillingModel(
				billingModel.payee,
				billingModel.name,
				billingModel.merchantName,
				'',
				billingModel.merchantURL,
				billingModel.amount,
				billingModel.token,
				{ from: merchant }
			);

			const wbnbTokenBalBefore = await wbnb.balanceOf(merchant);
			const fundRceiverBalBefore = await pmaToken.balanceOf(fundRceiver);
			const userBalBefore = await pmaToken.balanceOf(customer);

			const currentBillingModelId = await this.contract.getCurrentBillingModelId();

			await pmaToken.approve(executor.address, MaxUint256, { from: customer });
			const tx = await this.contract.subscribeToBillingModel(
				currentBillingModelId,
				pmaToken.address,
				'',
				{
					from: customer
				}
			);
			await getGasCost('SwapTest', 'subscribeToBillingModel(PMA->WBNB)', tx.receipt.cumulativeGasUsed);

			const wbnbTokenBalAfter = await wbnb.balanceOf(merchant);
			const fundRceiverBalAfter = await pmaToken.balanceOf(fundRceiver);
			const userBalAfter = await pmaToken.balanceOf(customer);

			expect(wbnbTokenBalAfter).to.bignumber.be.eq(wbnbTokenBalBefore.add(amounts[0]));
			expect(userBalAfter).to.bignumber.be.eq(userBalBefore.sub(amounts[1]));
			expect(fundRceiverBalAfter).to.bignumber.be.eq(fundRceiverBalBefore.add(amounts[2]));

			await expectEvent(tx, 'NewSubscription');
		});
	});

	describe('canSwapFromV2()', () => {
		it('can swap ADA -> ADA', async () => {
			const canSwap = await executor.canSwapFromV2(adaToken.address, adaToken.address);
			expect(canSwap[0]).to.be.eq(true);
			expect(canSwap[1]).to.be.eq(true);
			expect(canSwap[2][0]).to.be.eq(adaToken.address.toString());
			expect(canSwap[2][1]).to.be.eq(pmaToken.address.toString());
			expect(canSwap[3][0]).to.be.eq(pmaToken.address.toString());
			expect(canSwap[3][1]).to.be.eq(adaToken.address.toString());
		});

		it('can swap WBNB -> WBNB', async () => {
			const canSwap = await executor.canSwapFromV2(wbnb.address, wbnb.address);

			expect(canSwap[0]).to.be.eq(true);
			expect(canSwap[1]).to.be.eq(true);
			expect(canSwap[2][0]).to.be.eq(wbnb.address.toString());
			expect(canSwap[2][1]).to.be.eq(pmaToken.address.toString());
			expect(canSwap[3][0]).to.be.eq(pmaToken.address.toString());
			expect(canSwap[3][1]).to.be.eq(wbnb.address.toString());
		});

		it('can swap WBNB -> PMA', async () => {
			const canSwap = await executor.canSwapFromV2(wbnb.address, pmaToken.address);
			expect(canSwap[0]).to.be.eq(true);
			expect(canSwap[1]).to.be.eq(false);
			expect(canSwap[2][0]).to.be.eq(wbnb.address);
			expect(canSwap[2][1]).to.be.eq(pmaToken.address);
			expect(canSwap[3]).to.be.empty;
		});

		it('can swap PMA -> ETH', async () => {
			const canSwap = await executor.canSwapFromV2(pmaToken.address, ethToken.address);
			expect(canSwap[0]).to.be.eq(true);
			expect(canSwap[1]).to.be.eq(false);
			expect(canSwap[2][0]).to.be.eq(pmaToken.address);
			expect(canSwap[2][1]).to.be.eq(wbnb.address);
			expect(canSwap[2][2]).to.be.eq(ethToken.address);
			expect(canSwap[3]).to.be.empty;
		});

		it('can swap ADA -> ETH', async () => {
			const canSwap = await executor.canSwapFromV2(adaToken.address, ethToken.address);
			expect(canSwap[0]).to.be.eq(true);
			expect(canSwap[1]).to.be.eq(true);
			expect(canSwap[2][0]).to.be.eq(adaToken.address.toString());
			expect(canSwap[2][1]).to.be.eq(pmaToken.address.toString());
			expect(canSwap[3][0]).to.be.eq(pmaToken.address.toString());
			expect(canSwap[3][1]).to.be.eq(wbnb.address.toString());
			expect(canSwap[3][2]).to.be.eq(ethToken.address.toString());
		});

		it('can swap PMA -> WBNB', async () => {
			const canSwap = await executor.canSwapFromV2(pmaToken.address, wbnb.address);
			expect(canSwap[0]).to.be.eq(true);
			expect(canSwap[1]).to.be.eq(false);
			expect(canSwap[2][0]).to.be.eq(pmaToken.address);
			expect(canSwap[2][1]).to.be.eq(wbnb.address);
			expect(canSwap[3]).to.be.empty;
		});

		it('can swap PMA -> ADA', async () => {
			const canSwap = await executor.canSwapFromV2(pmaToken.address, adaToken.address);
			expect(canSwap[0]).to.be.eq(true);
			expect(canSwap[1]).to.be.eq(false);
			expect(canSwap[2][0]).to.be.eq(pmaToken.address);
			expect(canSwap[2][1]).to.be.eq(adaToken.address);
			expect(canSwap[3]).to.be.empty;
		});

		it('can swap ADA -> PMA', async () => {
			const canSwap = await executor.canSwapFromV2(adaToken.address, pmaToken.address);
			expect(canSwap[0]).to.be.eq(true);
			expect(canSwap[1]).to.be.eq(false);
			expect(canSwap[2][0]).to.be.eq(adaToken.address);
			expect(canSwap[2][1]).to.be.eq(pmaToken.address);
			expect(canSwap[3]).to.be.empty;
		});

		it('can swap ADA -> WBNB', async () => {
			const canSwap = await executor.canSwapFromV2(adaToken.address, wbnb.address);
			expect(canSwap[0]).to.be.eq(true);
			expect(canSwap[1]).to.be.eq(true);
			expect(canSwap[2][0]).to.be.eq(adaToken.address);
			expect(canSwap[2][1]).to.be.eq(pmaToken.address);
			expect(canSwap[3][0]).to.be.eq(pmaToken.address);
			expect(canSwap[3][1]).to.be.eq(wbnb.address);
		});

		it('can swap WBNB -> ADA', async () => {
			const canSwap = await executor.canSwapFromV2(wbnb.address, adaToken.address);
			expect(canSwap[0]).to.be.eq(true);
			expect(canSwap[1]).to.be.eq(true);
			expect(canSwap[2][0]).to.be.eq(wbnb.address);
			expect(canSwap[2][1]).to.be.eq(pmaToken.address);
			expect(canSwap[3][0]).to.be.eq(pmaToken.address);
			expect(canSwap[3][1]).to.be.eq(adaToken.address);
		});


		it('should not swap ETH -> ADA', async () => {
			const canSwap = await executor.canSwapFromV2(ethToken.address, adaToken.address);
			expect(canSwap[0]).to.be.eq(true);
			expect(canSwap[1]).to.be.eq(true);
			expect(canSwap[2][0]).to.be.eq(ethToken.address);
			expect(canSwap[2][1]).to.be.eq(wbnb.address);
			expect(canSwap[2][2]).to.be.eq(pmaToken.address);
			expect(canSwap[3][0]).to.be.eq(pmaToken.address);
			expect(canSwap[3][1]).to.be.eq(adaToken.address);
		});

		it('can swap ETH -> WBNB', async () => {
			const canSwap = await executor.canSwapFromV2(ethToken.address, wbnb.address);
			expect(canSwap[0]).to.be.eq(true);
			expect(canSwap[1]).to.be.eq(true);
			expect(canSwap[2][0]).to.be.eq(ethToken.address);
			expect(canSwap[2][1]).to.be.eq(wbnb.address);
			expect(canSwap[2][2]).to.be.eq(pmaToken.address);
			expect(canSwap[3][0]).to.be.eq(pmaToken.address);
			expect(canSwap[3][1]).to.be.eq(wbnb.address);
		});

		it('should not swap with ETH -> ETH', async () => {
			const canSwap = await executor.canSwapFromV2(ethToken.address, ethToken.address);
			expect(canSwap[0]).to.be.eq(false);
			expect(canSwap[1]).to.be.eq(false);
			expect(canSwap[2]).to.be.empty;
			expect(canSwap[3]).to.be.empty;
		});
	});
});
