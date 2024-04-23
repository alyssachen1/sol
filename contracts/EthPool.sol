// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.15;
// import "hardhat/console.sol";
import "./SafeMath.sol";

contract EthPool {

    address owner;
    uint public poolBalance;
    uint public reward;
    uint countDeposit;
    uint countWithdraw;

    mapping(address => uint) userDeposit_COMPUTE;
    mapping(address => uint) public userDeposit;
    mapping(address => uint) public userEarned;
    mapping(address => uint) public lastRun;

    constructor() {
        owner = msg.sender;
    }
    
    function deposit() public payable {
        if(msg.sender == owner) {
            reward = msg.value;

        }
        else {
            userDeposit_COMPUTE[msg.sender] += msg.value;
            userDeposit[msg.sender] += msg.value;
            poolBalance += msg.value;
            countDeposit++; 
            lastRun[msg.sender] = block.timestamp;
        }
        require(msg.value > 0, "Can't deposit nothing!");
    }

    function ifTheAllRewardsAreWithdraw() private {
        if(countWithdraw == countDeposit)
            poolBalance = 0;
    }

    function withdraw() public {
        
        require(msg.sender != owner, "Owner can't withdra!"); 
        require(countDeposit >= countWithdraw, "All rewards are cleaned!"); 
        require(userDeposit_COMPUTE[msg.sender] > 0, "You withdraw befor!"); 

        if(block.timestamp - lastRun[msg.sender] > 45 seconds) {
            uint temp1 = userDeposit_COMPUTE[msg.sender]; 
            uint temp2 = (((userDeposit_COMPUTE[msg.sender]*100) / poolBalance) * reward) / 100;

            payable(msg.sender).transfer(temp1 + temp2);

            userDeposit_COMPUTE[msg.sender] = 0; 
            userEarned[msg.sender] += temp2; 
            countWithdraw++; 

            
            ifTheAllRewardsAreWithdraw();
        }
        else {
            uint temp1 = userDeposit_COMPUTE[msg.sender]; 
            uint temp2 = (((userDeposit_COMPUTE[msg.sender]*100) / poolBalance) * reward) / 100;
            temp2 = temp2 / 2; 

            payable(msg.sender).transfer(temp1 + temp2);

            userDeposit_COMPUTE[msg.sender] = 0; 
            userEarned[msg.sender] += temp2;
            countWithdraw++;

            ifTheAllRewardsAreWithdraw();
        }

    }

    function cleanPool() public {
        require(msg.sender == owner, "Only owner can clean the pool!");
        require(poolBalance == 0 && address(this).balance > 0);

        payable(owner).transfer(address(this).balance);

    }
}
