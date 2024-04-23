const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');


describe("EthPool", function () {
  let ethPool;
  let owner;
  let user1;
  let user2;
  let addrs;

  async function deployPool() {
    // Get signers

    // Deploy the EthPool contract
    const EthPool = await ethers.getContractFactory("EthPool");
    const ethPool = await EthPool.deploy();
    
    
    
    const [owner] = await ethers.getSigners();

    console.log('Signer 1 address: ', owner.address);

    await ethPool.deployed();
    return { ethPool, owner };
  };

  describe("Test Deploy", function () {
    it('should deploy and set the owner correctly', async function () {
        const EthPool = await ethers.getContractFactory("EthPool");
        const ethPool = await EthPool.deploy();
        const [owner] = await ethers.getSigners();
        console.log('Signer 1 address: ', owner.address);

        expect(await ethPool.signer.address).to.equal(owner.address);
      });
  })


  describe("Depositing Rewards", function () {

    it("Should allow the owner to deposit rewards", async function () {
         EthPool = await ethers.getContractFactory("EthPool");
         ethPool = await EthPool.deploy();
         const [owner, other] = await ethers.getSigners();
         console.log('Signer 1 address: ', owner.address);
 
         await expect(ethPool.connect(owner).depositRewards(1))
        // await expect(ethPool.depositRewards(10))
        //     .to.emit(ethPool, "RewardAdded")
        //     .withArgs(ethPool.address, "Added rewards to pool!");
    });
    

    // it("Should reject non-owner depositing rewards", async function () {
    //     await expect(ethPool.connect(user1).depositRewards(1))
    //         .to.be.revertedWith("Only the team can call this function.");
    //     });
    });


    describe("Making Deposits", function () {
        it("Should allow users to deposit ETH", async function () {
            await expect(ethPool.connect(user1).deposit(100))
                .to.emit(ethPool, "DepositMade")
                .withArgs(user1.address, 100);
        });

        it("Should revert when attempting to deposit zero rewards", async function() {
            await ethPool.connect(user1).deposit(100);
            await expect(ethPool.connect(owner).depositRewards(0))
                .to.be.revertedWith("Reward must be greater than 0");
        });
        

        it("Should correctly handle multiple deposits and withdrawals by the same user", async function() {
            await ethPool.connect(user1).deposit(100);
            await ethPool.connect(owner).depositRewards(100);
            await ethPool.connect(user1).deposit(200);
        

            await expect(() => ethPool.connect(user1).withdraw(100))
                .to.changeEtherBalance(user1, 200); 
        });        
        
    });


    describe("Withdrawing", function () {
        it("Should allow users to withdraw their balance including rewards", async function () {
            // User1 deposit
            await ethPool.connect(user1).deposit(100);
            // Deposit rewards
            await ethPool.connect(owner).depositRewards(100);
           
            await expect(() => ethPool.connect(user1).withdraw(200))
                .to.changeEtherBalance(user1, ethers.utils.parseEther(0));
        });

        it("Should distribute multiple rewards correctly", async function () {
            await ethPool.connect(user1).deposit(100);
            await ethPool.connect(owner).depositRewards(100);
            // user1 can withdraw 200
            await ethPool.connect(user2).deposit(100);
            //user2 can only withdraw 100
            
            const user1BalanceBefore = await ethers.provider.getBalance(user1.address);
            await ethPool.connect(user1).withdraw(200);
            const user1BalanceAfter = await ethers.provider.getBalance(user1.address);
            
            // User1 should have more than their initial deposit
            expect(user1BalanceAfter.sub(user1BalanceBefore)).to.be.gt(ethers.utils.parseEther("2.0"));
        });

        it("Should revert or do nothing when a user without deposits attempts to withdraw", async function() {
            await expect(ethPool.connect(user1).withdraw()).to.be.revertedWith("User has no balance to withdraw");
        });        

        it("Should not allocate previous rewards to deposits made after those rewards were distributed", async function() {
            // Initial deposit to be eligible for rewards.
            await ethPool.connect(user1).deposit(100);
            
            await ethPool.connect(owner).depositRewards(100);
            
            // User2 makes a deposit not be eligible for reward.
            await ethPool.connect(user2).deposit(100);
            
            // Withdraw by user1, expecting to receive both the deposit and the rewards.
            await expect(() => ethPool.connect(user1).withdraw(200))
                .to.changeEtherBalance(user1, 0);
            
            // Withdraw by user2, expecting to receive only the deposit, since deposit was made after rewards were distributed.
            await expect(() => ethPool.connect(user2).withdraw(100))
                .to.changeEtherBalance(user2, 100);
        });
             
        
    });
    

  describe("Balance Of", function () {
    it("Should return the correct balance", async function () {
      // User1 deposit
      await ethPool.connect(user1).deposit(100);
      // Check balance
      expect(await ethPool.balanceOf(user1.address)).to.equal(100);
    });
  });
});
