const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  // Deploy MockERC20
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const mockToken = await MockERC20.deploy("Mock PAXG", "mPAXG");
  await mockToken.deployed();
  console.log("MockERC20 deployed to:", mockToken.address);

  // Mint tokens to deployer (you can mint more later)
  const mintAmount = ethers.utils.parseEther("100");
  await mockToken.mint(deployer.address, mintAmount);
  console.log(`Minted 100 mPAXG to deployer (${deployer.address})`);

  // Deploy GoldRushDuel with deployer as treasury
  const GoldRushDuel = await ethers.getContractFactory("GoldRushDuel");
  const duel = await GoldRushDuel.deploy(mockToken.address, deployer.address);
  await duel.deployed();
  console.log("GoldRushDuel deployed to:", duel.address);
  
  console.log("\n=== DEPLOYMENT SUMMARY ===");
  console.log("MockERC20:", mockToken.address);
  console.log("GoldRushDuel:", duel.address);
  console.log("Deployer:", deployer.address);
  console.log("Treasury:", deployer.address);
  console.log("===========================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 