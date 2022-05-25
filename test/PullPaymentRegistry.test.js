// Load dependencies

const { deploySmartContracts, getDeployedContract } = require("../libs/utils");
const { expect } = require("chai");
require("chai").should();
const { timeTravel } = require("./helpers/timeHelper");

const { MaxUint256 } = require("@ethersproject/constants");
const { web3 } = require("@openzeppelin/test-environment");

const { expectEvent, expectRevert } = require("@openzeppelin/test-helpers");
const { ZERO_ADDRESS } = require("@openzeppelin/test-helpers/src/constants");

const BlockData = artifacts.require("BlockData");
// Start test block
contract("PullPaymentRegistry", (accounts) => {
  let [owner, merchant, customer, user, fundRceiver] = accounts;

  const billingModel = {
    payee: merchant,
    name: web3.utils.padRight(web3.utils.fromAscii("some name"), 64),
    amount: "15", // web3.utils.toWei("15", "ether"),
    frequency: 600, // 10 minutes
    numberOfPayments: 5,
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

    //pullPayment registry contract
    this.contract = contracts.ppRegistry.contract;
    billingModel.token = contracts.pmaToken.address; //adaToken.address;
  });

  describe("addPullPaymentContract()", () => {
    before("", async () => {
      this.addPullPaymentContractTx =
        await this.contract.addPullPaymentContract(
          "pmaToken",
          pmaToken.address,
          {
            from: owner,
          }
        );
    });

    it("it should add the pullPayment contract correctly", async () => {
      const pullPaymentAddress = await this.contract.getPPAddressForStringOrDie(
        "pmaToken"
      );
      expect(pullPaymentAddress).to.be.eq(pmaToken.address);
    });

    it("should emit an event after adding the pullPayment contract", async () => {
      await expectEvent(this.addPullPaymentContractTx, "RegistryUpdated");
      await expectEvent(this.addPullPaymentContractTx, "ExecutorGranted");
    });

    it("should revert when owner tries to add the zero address as pullPayment address", async () => {
      await expectRevert(
        this.contract.addPullPaymentContract("pmaToken", ZERO_ADDRESS),
        "PullPaymentRegistry: INVALID_EXECUTOR_ADDRESS"
      );
    });

    it("should revert when non-owner tries to add the pullPayment contract", async () => {
      await expectRevert(
        this.contract.addPullPaymentContract("pmaToken", ZERO_ADDRESS, {
          from: merchant,
        }),
        "Ownable: caller is not the owner"
      );
    });
  });

  describe("grantExecutor()", () => {
    before("", async () => {
      this.grantExecutorTx = await this.contract.grantExecutor(merchant, {
        from: owner,
      });
    });

    it("should grant the executor correctly", async () => {
      const isGranted = await this.contract.isExecutorGranted(merchant);
      expect(isGranted).to.be.eq(true);
    });

    it("shoud revert when owner tries to grant executor role to zero address", async () => {
      await expectRevert(
        this.contract.grantExecutor(ZERO_ADDRESS),
        "PullPaymentRegistry: INVALID_EXECUTOR_ADDRESS"
      );
    });

    it("should revert when non-owner tries to grant the executor", async () => {
      await expectRevert(
        this.contract.grantExecutor(customer, { from: merchant }),
        "Ownable: caller is not the owner"
      );
    });
  });

  describe("revokeExecutor()", () => {
    before("", async () => {
      let tx = await this.contract.grantExecutor(merchant, { from: owner });
      tx = await this.contract.revokeExecutor(merchant, { from: owner });
    });

    it("should revoke executor correctly", async () => {
      const isExecutor = await this.contract.isExecutorGranted(merchant);
      expect(isExecutor).to.be.eq(false);
    });

    it("should revert when owner tries to revoke executor role for zero address", async () => {
      await expectRevert(
        this.contract.revokeExecutor(ZERO_ADDRESS),
        "PullPaymentRegistry: INVALID_EXECUTOR_ADDRESS"
      );
    });

    it("should revert when owner tries to revoke executor role for non-executor role", async () => {
      await expectRevert(
        this.contract.revokeExecutor(merchant),
        "PullPaymentRegistry: EXECUTOR_ALREADY_REVOKED"
      );
    });

    it("should revert when non-owner tries to revoke executor role", async () => {
      await expectRevert(
        this.contract.revokeExecutor(ZERO_ADDRESS, { from: merchant }),
        "Ownable: caller is not the owner"
      );
    });
  });

  describe("PullPaymentRegistry", () => {
    describe("Getters", () => {
      beforeEach(async () => {
        await this.contract.addPullPaymentContract(
          "pmaToken",
          pmaToken.address,
          {
            from: owner,
          }
        );
      });

      it("should get a address of pullpayment contract or die with given identifier hash correctly", async () => {
        const ppAddress = await this.contract.getPPAddressForOrDie(
          web3.utils.keccak256(web3.utils.encodePacked("pmaToken"))
        );

        expect(ppAddress).to.be.eq(pmaToken.address);
        await expectRevert(
          this.contract.getPPAddressForOrDie(
            web3.utils.keccak256(web3.utils.encodePacked(ZERO_ADDRESS))
          ),
          "PullPaymentRegistry: IDENTIFIER_NOT_REGISTERED"
        );
      });

      it("should get a address of pullpayment contract with given identifier hash correctly", async () => {
        let ppAddress = await this.contract.getPPAddressFor(
          web3.utils.keccak256(web3.utils.encodePacked("pmaToken"))
        );
        console.log("ppAddress: ", ppAddress);

        expect(ppAddress).to.be.eq(pmaToken.address);
        ppAddress = await this.contract.getPPAddressFor(
          web3.utils.keccak256(web3.utils.encodePacked(ZERO_ADDRESS))
        );
        expect(ppAddress).to.be.eq(ZERO_ADDRESS);
      });

      it("should get a address of pullpayment contract or die with given identifier  correctly", async () => {
        const ppAddress = await this.contract.getPPAddressForStringOrDie(
          "pmaToken"
        );
        console.log("ppAddress: ", ppAddress);

        expect(ppAddress).to.be.eq(pmaToken.address);
        await expectRevert(
          this.contract.getPPAddressForStringOrDie(ZERO_ADDRESS),
          "PullPaymentRegistry: IDENTIFIER_NOT_REGISTERED"
        );
      });

      it("should get a address of pullpayment contract with given identifier hash correctly", async () => {
        let ppAddress = await this.contract.getPPAddressForString("pmaToken");
        console.log("ppAddress: ", ppAddress);

        expect(ppAddress).to.be.eq(pmaToken.address);
        ppAddress = await this.contract.getPPAddressForString(ZERO_ADDRESS);
        expect(ppAddress).to.be.eq(ZERO_ADDRESS);
      });
    });
  });
});
