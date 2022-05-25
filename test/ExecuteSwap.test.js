// Load dependencies
const { deploySmartContracts, getDeployedContract } = require("../libs/utils");
const { expect } = require("chai");
require("chai").should();
const { addLiquidity, swap, getPair, createPair } = require("./helpers/swap");

const { MaxUint256 } = require("@ethersproject/constants");
const { web3 } = require("@openzeppelin/test-environment");

const {
  expectEvent,
  expectRevert,
  ether,
} = require("@openzeppelin/test-helpers");

const ADAToken = artifacts.require("BEP20Cardano");
const ETHToken = artifacts.require("BEP20Ethereum");
//const Exchange = artifacts.require('Exchange');
const BlockData = artifacts.require("BlockData");

const IBEP20 = artifacts.require("IBEP20");
const IUniswapFactory = artifacts.require("IUniswapV2Factory");
const IUniswapRouter = artifacts.require("IUniswapV2Router02");
const IWBNB = artifacts.require("IWBNB");

const { ZERO_ADDRESS } = require("@openzeppelin/test-helpers/src/constants");

// Start test block
contract.skip("Executor", (accounts) => {
  let [owner, merchant, customer, user] = accounts;

  const billingModel = {
    payee: merchant,
    name: "some name",
    amount: "1", // web3.utils.toWei("15", "ether"),
    frequency: 600, // 10 minutes
    numberOfPayments: 5,
  };

  let contracts = {};
  let pmaToken = {};
  let ethToken = {};
  let adaToken = {};
  let executor = {};

  const UniswapFactoryAddress = "0xBCfCcbde45cE874adCB698cC183deBcF17952812";
  const UniswapV2Router02Address = "0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F";
  const CAKE_ADDRESS = "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82";

  const ADA_ADDRESS = "0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47";
  const ETH_ADDRESS = "0x2170ed0880ac9a755fd29b2688956bd959f933f8";
  const WBNB_ADDRESS = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
  const BUSD_ADDRESS = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56";

  const WBNB_ADA_PAIR = "0xBA51D1AB95756ca4eaB8737eCD450cd8F05384cF";
  const WBNB_BUSD_PAIR = "0x1B96B92314C44b159149f7E0303511fB2Fc4774f";
  const WBNB_CAKE_PAIR = "0xA527a61703D82139F8a06Bc30097cC9CAA2df5A6";

  beforeEach(async () => {
    this.BlockData = BlockData.new();
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

    this.wbnb = await IWBNB.at(WBNB_ADDRESS);
    this.cake = contracts.cakeToken.contract;

    //recurringPP contract
    this.contract = contracts.recurringPP.contract;

    //	this.exchange = await Exchange.new({from: owner});
    this.factory = await IUniswapFactory.at(UniswapFactoryAddress);
    this.router = await IUniswapRouter.at(UniswapV2Router02Address);
  });

  describe("Swap with PMA (CAKE)", () => {
    beforeEach(async () => {
      //set CAKE as a PMA token
      await contracts.registry.contract.setAddressFor(
        "PMAToken",
        contracts.cakeToken.address,
        {
          from: owner,
        }
      );
    });

    it("should subscribe billing model with WBNB when ADA is settlement token ", async () => {
      billingModel.token = adaToken.address;
      await this.contract.createBillingModel(
        billingModel.payee,
        billingModel.name,
        billingModel.amount,
        billingModel.token,
        billingModel.frequency,
        billingModel.numberOfPayments,
        { from: merchant }
      );

      await this.wbnb.deposit({ from: customer, value: ether("15") });

      const adaTokenBalBefore = await adaToken.balanceOf(merchant);
      console.log("adaTokenBalBefore: ", adaTokenBalBefore.toString());

      await this.wbnb.approve(executor.address, MaxUint256, { from: customer });
      const tx = await this.contract.subscribeToBillingModel(1, WBNB_ADDRESS, {
        from: customer,
      });

      const adaTokenBalAfter = await adaToken.balanceOf(merchant);
      console.log("adaTokenBalAfter: ", adaTokenBalAfter.toString());

      await expectEvent(tx, "PullPaymentExecuted");
      expect(adaTokenBalAfter).to.bignumber.be.gt(adaTokenBalBefore);
    });

    it("should subscribe billing model with WBNB when PMA(CAKE) is settlement token ", async () => {
      billingModel.token = this.cake.address;
      await this.contract.createBillingModel(
        billingModel.payee,
        billingModel.name,
        billingModel.amount,
        billingModel.token,
        billingModel.frequency,
        billingModel.numberOfPayments,
        { from: merchant }
      );

      await this.wbnb.deposit({ from: customer, value: ether("15") });

      const pmaTokenBalBefore = await this.cake.balanceOf(merchant);
      console.log("pmaTokenBalBefore: ", pmaTokenBalBefore.toString());

      await this.wbnb.approve(executor.address, MaxUint256, { from: customer });
      const tx = await this.contract.subscribeToBillingModel(1, WBNB_ADDRESS, {
        from: customer,
      });

      const pmaTokenAfter = await this.cake.balanceOf(merchant);
      console.log("pmaTokenAfter: ", pmaTokenAfter.toString());
      expect(pmaTokenAfter).to.bignumber.be.gt(pmaTokenBalBefore);
      await expectEvent(tx, "PullPaymentExecuted");
    });
  });

  describe("Swap with PMA", () => {
    it("should subscribe billing model with WBNB when ADA is settlement token ", async () => {
      let pair = await createPair(this.factory, WBNB_ADDRESS, pmaToken.address);
      //console.log("WBNB_PMA_PAIR: ", pair);

      await this.wbnb.deposit({ from: customer, value: ether("10") });

      //add liquidity to WBNB_PMA pool
      await addLiquidity(
        this.factory,
        this.router,
        customer,
        this.wbnb,
        pmaToken,
        ether("10"),
        ether("10")
      );

      await this.wbnb.deposit({ from: customer, value: ether("10") });

      //swap wbnb to get ada tokens
      await swap(this.router, customer, this.wbnb, adaToken, ether("10"));

      pair = await createPair(this.factory, ADA_ADDRESS, pmaToken.address);
      //console.log("ADA_PMA_PAIR: ", pair);

      //add liquidity to ADA_PMA pool
      await addLiquidity(
        this.factory,
        this.router,
        customer,
        adaToken,
        pmaToken,
        ether("10"),
        ether("10")
      );

      billingModel.token = adaToken.address;
      await this.contract.createBillingModel(
        billingModel.payee,
        billingModel.name,
        billingModel.amount,
        billingModel.token,
        billingModel.frequency,
        billingModel.numberOfPayments,
        { from: merchant }
      );

      await this.wbnb.deposit({ from: customer, value: ether("10") });

      const adaTokenBalBefore = await adaToken.balanceOf(merchant);
      console.log("adaTokenBalBefore: ", adaTokenBalBefore.toString());

      await this.wbnb.approve(executor.address, MaxUint256, { from: customer });
      const tx = await this.contract.subscribeToBillingModel(1, WBNB_ADDRESS, {
        from: customer,
      });

      const adaTokenBalAfter = await adaToken.balanceOf(merchant);
      console.log("adaTokenBalAfter: ", adaTokenBalAfter.toString());

      await expectEvent(tx, "PullPaymentExecuted");
      expect(adaTokenBalAfter).to.bignumber.be.gt(adaTokenBalBefore);
    });

    it("should subscribe billing model with WBNB when PMA is settlement token ", async () => {
      const pair = await createPair(
        this.factory,
        WBNB_ADDRESS,
        pmaToken.address
      );
      //console.log("WBNB_PMA_PAIR: ", pair);

      await this.wbnb.deposit({ from: customer, value: ether("10") });

      //add liquidity to WBNB_PMA pool
      await addLiquidity(
        this.factory,
        this.router,
        customer,
        this.wbnb,
        pmaToken,
        ether("10"),
        ether("10")
      );

      billingModel.token = pmaToken.address;
      await this.contract.createBillingModel(
        billingModel.payee,
        billingModel.name,
        billingModel.amount,
        billingModel.token,
        billingModel.frequency,
        billingModel.numberOfPayments,
        { from: merchant }
      );

      await this.wbnb.deposit({ from: customer, value: ether("10") });

      const pmaTokenBalBefore = await pmaToken.balanceOf(merchant);
      console.log("pmaTokenBalBefore: ", pmaTokenBalBefore.toString());

      await this.wbnb.approve(executor.address, MaxUint256, { from: customer });
      const tx = await this.contract.subscribeToBillingModel(1, WBNB_ADDRESS, {
        from: customer,
      });

      const pmaTokenAfter = await pmaToken.balanceOf(merchant);
      console.log("pmaTokemAfter: ", pmaTokenAfter.toString());

      await expectEvent(tx, "PullPaymentExecuted");
      expect(pmaTokenAfter).to.bignumber.be.gt(pmaTokenBalBefore);
    });

    it("should subscribe billing model with PMA when WBNB is settlement token ", async () => {
      const pair = await createPair(
        this.factory,
        WBNB_ADDRESS,
        pmaToken.address
      );
      //console.log("WBNB_PMA_PAIR: ", pair);

      await this.wbnb.deposit({ from: customer, value: ether("10") });

      //add liquidity to WBNB_PMA pool
      await addLiquidity(
        this.factory,
        this.router,
        customer,
        this.wbnb,
        pmaToken,
        ether("10"),
        ether("10")
      );

      billingModel.token = this.wbnb.address;
      await this.contract.createBillingModel(
        billingModel.payee,
        billingModel.name,
        billingModel.amount,
        billingModel.token,
        billingModel.frequency,
        billingModel.numberOfPayments,
        { from: merchant }
      );

      const wbnbTokenBalBefore = await this.wbnb.balanceOf(merchant);
      console.log("wbnbTokenBalBefore: ", wbnbTokenBalBefore.toString());

      await pmaToken.approve(executor.address, MaxUint256, { from: customer });
      const tx = await this.contract.subscribeToBillingModel(
        1,
        pmaToken.address,
        {
          from: customer,
        }
      );

      const wbnbTokenAfter = await this.wbnb.balanceOf(merchant);
      console.log("wbnbTokenAfter: ", wbnbTokenAfter.toString());
      await expectEvent(tx, "PullPaymentExecuted");
    });
  });
});
