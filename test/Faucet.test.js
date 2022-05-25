const { expect } = require('chai');
const { timeTravel } = require('./helpers/timeHelper');
const { expectRevert, BN, ether, time } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = require('@openzeppelin/test-helpers/src/constants');

const Faucet = artifacts.require('Faucet');
// BEP20 ADA Token
const Cardano = artifacts.require('BEP20Cardano');
// BEP20 ETHEREUM Token
const Ethereum = artifacts.require('BEP20Ethereum');

contract('Faucet', (accounts) => {
	let [owner, user] = accounts;

	before('', async () => {
		this.cardano = await Cardano.new();
		this.ethereum = await Ethereum.new();

		this.faucet = await Faucet.new(
			[this.cardano.address, this.ethereum.address],
			[ether('1'), ether('1')]
		);
	});

	describe('addFaucets()', () => {
		it('should add faucets correctly', async () => {
			const faucetList = await this.faucet.getFaucetList();
			const cardanoAmount = await this.faucet.faucetAmount(this.cardano.address);
			const ethAmount = await this.faucet.faucetAmount(this.ethereum.address);

			expect(cardanoAmount).to.bignumber.be.eq(ether('1'));
			expect(ethAmount).to.bignumber.be.eq(ether('1'));

			expect(faucetList.length).to.be.eq(2);
			expect(faucetList[0]).to.be.eq(this.cardano.address);
			expect(faucetList[1]).to.be.eq(this.ethereum.address);
		});

		it('should revert when invalid data is provided to function', async () => {
			await expectRevert(
				this.faucet.addFaucets([this.cardano.address], [ether('1'), ether('2')], { from: owner }),
				'Faucet: INVALID_TOKEN_DATA'
			);
		});

		it('should revert when non-owner tries to add faucet', async () => {
			await expectRevert(
				this.faucet.addFaucets([this.cardano.address], [ether('1'), ether('2')], { from: user }),
				'Ownable: caller is not the owner'
			);
		});
	});

	describe('requestTokens()', () => {
		before('', async () => {
			await this.cardano.mint(ether('1000'), { from: owner });
			await this.ethereum.mint(ether('1000'), { from: owner });

			await this.cardano.transfer(this.faucet.address, ether('1000'), { from: owner });
			await this.ethereum.transfer(this.faucet.address, ether('1000'), { from: owner });
		});

		it('should allow user to claim tokens correctly', async () => {
			const userToken1BalBefore = await this.cardano.balanceOf(user);

			await this.faucet.requestTokens(this.cardano.address, { from: user });

			const userToken1BalAfter = await this.cardano.balanceOf(user);

			expect(userToken1BalAfter).to.bignumber.be.eq(userToken1BalBefore.add(ether('1')));
		});

		it('should not allow user to claim before waiting time', async () => {
			await expectRevert(
				this.faucet.requestTokens(this.cardano.address, { from: user }),
				'Faucet: MUST_WAIT'
			);
		});

		it('should allow to claim after waiting period only', async () => {
			await timeTravel(time.duration.days('1'));
			const userToken1BalBefore = await this.cardano.balanceOf(user);

			await this.faucet.requestTokens(this.cardano.address, { from: user });

			const userToken1BalAfter = await this.cardano.balanceOf(user);

			expect(userToken1BalAfter).to.bignumber.be.eq(userToken1BalBefore.add(ether('1')));
		});

		it('should revert when user tries to claim unsupported token', async () => {
			await expectRevert(
				this.faucet.requestTokens(ZERO_ADDRESS, { from: user }),
				'Faucet: INVALID_CLAIM'
			);
		});
	});

	describe('removeFaucet()', () => {
		it('should remove the faucet Token correctly', async () => {
			const isFaucetExists = await this.faucet.isFaucetSupported(this.ethereum.address);
			await this.faucet.removeFaucet(this.ethereum.address, { from: owner });
			const isFaucetExistsAfter = await this.faucet.isFaucetSupported(this.ethereum.address);
			expect(isFaucetExists).to.be.eq(true);
			expect(isFaucetExistsAfter).to.be.eq(false);
		});

		it('should revert when non owner tries to remove faucet', async () => {
			await expectRevert(
				this.faucet.removeFaucet(this.ethereum.address, { from: user }),
				'Ownable: caller is not the owner'
			);
		});
	});

	describe('addFaucet()', () => {
		it('should add the faucet Token correctly', async () => {
			const isFaucetExists = await this.faucet.isFaucetSupported(this.ethereum.address);
			const faucetToken = await this.faucet.faucetAmount(this.ethereum.address);
			await this.faucet.addFaucet(this.ethereum.address, ether('2'), { from: owner });
			const isFaucetExistsAfter = await this.faucet.isFaucetSupported(this.ethereum.address);
			const faucetTokenAfter = await this.faucet.faucetAmount(this.ethereum.address);

			expect(isFaucetExists).to.be.eq(false);
			expect(isFaucetExistsAfter).to.be.eq(true);
			expect(faucetToken).to.bignumber.be.eq(new BN('0'));
			expect(faucetTokenAfter).to.bignumber.be.eq(ether('2'));
		});

		it('should revert when non owner tries to add faucet', async () => {
			await expectRevert(
				this.faucet.removeFaucet(this.ethereum.address, { from: user }),
				'Ownable: caller is not the owner'
			);
		});
	});

	describe('updateFaucetAmount()', () => {
		it('should update the faucet amount correctly', async () => {
			const faucetToken = await this.faucet.faucetAmount(this.ethereum.address);
			await this.faucet.updateFaucetAmount(this.ethereum.address, ether('1'), { from: owner });
			const faucetTokenAfter = await this.faucet.faucetAmount(this.ethereum.address);

			expect(faucetToken).to.bignumber.be.eq(ether('2'));
			expect(faucetTokenAfter).to.bignumber.be.eq(ether('1'));
		});

		it('should revert when non owner tries to update faucet amount', async () => {
			await expectRevert(
				this.faucet.updateFaucetAmount(this.ethereum.address, ether('2'), { from: user }),
				'Ownable: caller is not the owner'
			);
		});
	});
});
