// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.15;
import "hardhat/console.sol";
import "./SafeMath.sol";


contract EthPool {

    struct Deposit {
        uint256 amount;
        uint256 rewardEligibilityCounter; // track eligibility of rewards
    }

    using SafeMath for uint256;
    address public team;
    uint256 public totalPool;
    mapping(address => Deposit[]) public userDeposits;
    uint256 public accRewardPerEth; 
    uint public rewardCounter = 0;
    
    event RewardAdded(address indexed totalPool, string message);
    event DepositMade(address indexed depositer, uint256 amount);
    event Withdrawn(address indexed depositer, uint256 amount);

    constructor() {
        team = msg.sender;
    }

    modifier onlyTeam() {
        require(msg.sender == team, "Only the team can call this function.");
        _;
    }

    function depositRewards() external payable onlyTeam {
        require(msg.value > 0, "Reward must be greater than 0");
        require(totalPool > 0, "No deposits to reward");

        // Update the accumulated reward per ETH
        uint256 rewardPerEth = msg.value.mul(1e12).div(totalPool);
        accRewardPerEth = accRewardPerEth.add(rewardPerEth);
        totalPool = totalPool.add(msg.value);
        rewardCounter++;

        emit RewardAdded(address(this), "Added rewards to pool!");
    }

    function deposit() external payable {
        require(msg.value > 0, "Deposit must be greater than 0");

        // Track the user's deposit and their share of the rewards at the moment of deposit
        userDeposits[msg.sender].push(Deposit({
            amount: msg.value,
            rewardEligibilityCounter: rewardCounter // Current counter at the time of deposit
        }));
        totalPool = totalPool.add(msg.value);

        emit DepositMade(msg.sender, msg.value);
    }


    function withdraw() external {
        uint256 totalAmount = 0;
        
        for (uint256 i = 0; i < userDeposits[msg.sender].length; i++) {
            Deposit memory userDeposit = userDeposits[msg.sender][i];

            // Calculate total eligible rewards based on deposit timing
            if (userDeposit.rewardEligibilityCounter < rewardCounter) {
                uint256 depositReward = userDeposit.amount.mul(accRewardPerEth).div(1e12);
                totalAmount = totalAmount.add(userDeposit.amount).add(depositReward);
            } else {
                // Deposit not eligible for rewards added after the deposit
                totalAmount = totalAmount.add(userDeposit.amount);
            }
        }

        require(totalAmount > 0, "User has no balance to withdraw");

        delete userDeposits[msg.sender];
        totalPool = totalPool.sub(totalAmount).add(totalAmount);

        (bool sent, ) = msg.sender.call{value: totalAmount}("");
        require(sent, "Failed to send Ether");

        emit Withdrawn(msg.sender, totalAmount);
    }

    function balanceOf(address user) public view returns (uint256) {
    uint256 totalAmount = 0;

    for (uint256 i = 0; i < userDeposits[user].length; i++) {
            Deposit memory userDeposit = userDeposits[user][i];

            if (userDeposit.rewardEligibilityCounter < rewardCounter) {
                uint256 depositReward = userDeposit.amount.mul(accRewardPerEth).div(1e12);
                totalAmount = totalAmount.add(userDeposit.amount).add(depositReward);
            } else {
                totalAmount = totalAmount.add(userDeposit.amount);
            }
        }

    // Reflects initial deposit amounts and their earned rewards
    return totalAmount;
}

    // Fallback function 
    fallback() external payable {
        revert("Please use the deposit function");
    }

    receive() external payable {
        revert("Please use the deposit function");
    }

    // Getter 
    function getPoolValue() public view returns (uint256) {
        return totalPool;
    } 
}