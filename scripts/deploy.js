const { ethers } = require("hardhat");

/**
 * @title MetaSign Deployment Script
 * @dev Hardhat deployment script for MetaSign contract
 */
async function main() {
  console.log("Deploying MetaSign contract...");
  
  const MetaSign = await ethers.getContractFactory("MetaSign");
  const metaSign = await MetaSign.deploy();
  
  await metaSign.deployed();
  
  console.log("MetaSign deployed to:", metaSign.address);
  console.log("Transaction hash:", metaSign.deployTransaction.hash);
  
  // Verify on Etherscan (optional)
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    await metaSign.deployTransaction.wait(6);
    
    console.log("Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: metaSign.address,
        constructorArguments: [],
      });
    } catch (error) {
      console.log("Verification failed:", error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });