const API_URL = process.env.API_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const contract = require("../build/contracts/contracts/EthPool.sol/EthPool.json");
const userAddress = process.env.USER_ADDRESS;
const ethers = require("ethers");

const alchemyProvider = new ethers.providers.JsonRpcProvider(API_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, alchemyProvider);
const EthPoolContract = new ethers.Contract(CONTRACT_ADDRESS, contract.abi, signer);


async function main() {
    let balance = await EthPoolContract.balanceOf(userAddress);
    console.log(`Total balance for ${userAddress}:`, ethers.utils.formatEther(balance), "ETH");

    // user1 deposits
    await EthPoolContract.connect(signer).deposit({value: ethers.utils.parseEther("0.001")});
    balance = await EthPoolContract.balanceOf(userAddress); // Now it's fine to reassign 'balance'
    console.log(`User 1's balance after deposit: ${ethers.utils.formatEther(balance)} ETH`);


}
main();