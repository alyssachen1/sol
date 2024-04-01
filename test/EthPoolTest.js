const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EthPool", function () {
  let ethPool;
  let owner;
  let user1;
  let user2;
  let addrs;

  beforeEach(async function () {
    // Get signers
    [owner, user1, user2, ...addrs] = await ethers.getSigners();

    // Deploy the EthPool contract
    const EthPool = await ethers.getContractFactory("EthPool");
    ethPool = await EthPool.deploy();
    await ethPool.deployed();
  });


  describe("Depositing Rewards", function () {
    it("Should allow the owner to deposit rewards", async function () {
        await ethPool.connect(user1).deposit({ value: ethers.utils.parseEther("1.0") });
        await expect(ethPool.connect(owner).depositRewards({ value: ethers.utils.parseEther("1.0") }))
            .to.emit(ethPool, "RewardAdded")
            .withArgs(ethPool.address, "Added rewards to pool!");
    });
    

    it("Should reject non-owner depositing rewards", async function () {
        await expect(ethPool.connect(user1).depositRewards({ value: ethers.utils.parseEther("1.0") }))
            .to.be.revertedWith("Only the team can call this function.");
        });
    });


    describe("Making Deposits", function () {
        it("Should allow users to deposit ETH", async function () {
            await expect(ethPool.connect(user1).deposit({ value: ethers.utils.parseEther("0.5") }))
                .to.emit(ethPool, "DepositMade")
                .withArgs(user1.address, ethers.utils.parseEther("0.5"));
        });

        it("Should revert when attempting to deposit zero rewards", async function() {
            await ethPool.connect(user1).deposit({ value: ethers.utils.parseEther("1.0") });
            await expect(ethPool.connect(owner).depositRewards({ value: 0 }))
                .to.be.revertedWith("Reward must be greater than 0");
        });
        

        it("Should correctly handle multiple deposits and withdrawals by the same user", async function() {
            await ethPool.connect(user1).deposit({ value: ethers.utils.parseEther("0.5") });
            await ethPool.connect(owner).depositRewards({ value: ethers.utils.parseEther("0.5") });
            await ethPool.connect(user1).deposit({ value: ethers.utils.parseEther("1.0") });
        
            // Assuming the reward should now be proportionally allocated including the second deposit
            await expect(() => ethPool.connect(user1).withdraw())
                .to.changeEtherBalance(user1, ethers.utils.parseEther("2.0")); // Adjust based on your contract's logic
        });        
        
    });


    describe("Withdrawing", function () {
        it("Should allow users to withdraw their balance including rewards", async function () {
            // User1 deposit
            await ethPool.connect(user1).deposit({ value: ethers.utils.parseEther("0.5") });
            // Deposit rewards
            await ethPool.connect(owner).depositRewards({ value: ethers.utils.parseEther("1.0") });
            // Assuming no User2 deposit for now since User2 deposits after rewards based on the scenario
            
            // Now calculating expected withdrawal for User1 based on your scenario
            // User1 should get 0.5 (their deposit) + 1.0 (all the rewards) = 1.5 ETH
            await expect(() => ethPool.connect(user1).withdraw())
                .to.changeEtherBalance(user1, ethers.utils.parseEther("1.5"));
        });

        it("Should distribute multiple rewards correctly", async function () {
            await ethPool.connect(user1).deposit({ value: ethers.utils.parseEther("2.0") });
            await ethPool.connect(owner).depositRewards({ value: ethers.utils.parseEther("2.0") });
            await ethPool.connect(user2).deposit({ value: ethers.utils.parseEther("2.0") });
            await ethPool.connect(owner).depositRewards({ value: ethers.utils.parseEther("2.0") });
            
            const user1BalanceBefore = await ethers.provider.getBalance(user1.address);
            await ethPool.connect(user1).withdraw();
            const user1BalanceAfter = await ethers.provider.getBalance(user1.address);
            
            // Assuming reward distribution is done correctly, user1 should have more than their initial deposit
            expect(user1BalanceAfter.sub(user1BalanceBefore)).to.be.gt(ethers.utils.parseEther("2.0"));
        });

        it("Should revert or do nothing when a user without deposits attempts to withdraw", async function() {
            await expect(ethPool.connect(user1).withdraw()).to.be.revertedWith("User has no balance to withdraw");
            // Or if your contract allows for a no-op, check the balance remains unchanged
        });        

        it("Should not allocate previous rewards to deposits made after those rewards were distributed", async function() {
            // First, ensure there's an initial deposit to be eligible for rewards.
            await ethPool.connect(user1).deposit({ value: ethers.utils.parseEther("1.0") });
            
            // Deposit rewards, which should be allocated to user1's deposit.
            await ethPool.connect(owner).depositRewards({ value: ethers.utils.parseEther("1.0") });
            
            // Now, user2 makes a deposit, which should not be eligible for the rewards just distributed.
            await ethPool.connect(user2).deposit({ value: ethers.utils.parseEther("1.0") });
            
            // Withdraw by user1, expecting to receive both the deposit and the rewards.
            await expect(() => ethPool.connect(user1).withdraw())
                .to.changeEtherBalance(user1, ethers.utils.parseEther("2.0"));
            
            // Withdraw by user2, expecting to receive only the deposit, as their deposit was made after the rewards were distributed.
            await expect(() => ethPool.connect(user2).withdraw())
                .to.changeEtherBalance(user2, ethers.utils.parseEther("1.0"));
        });
             
        
    });
    

  describe("Balance Of", function () {
    it("Should return the correct balance", async function () {
      // User1 deposit
      await ethPool.connect(user1).deposit({ value: ethers.utils.parseEther("0.5") });
      // Check balance
      expect(await ethPool.balanceOf(user1.address)).to.equal(ethers.utils.parseEther("0.5"));
    });
  });
});
