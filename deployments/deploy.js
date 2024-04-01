async function main() {
    const EthPool = await ethers.getContractFactory("EthPool");
    const eth_pool = await EthPool.deploy();
    console.log("Contract Deployed to Address:", eth_pool.address);
  }
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });