const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🔍 Checking balance for:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", hre.ethers.formatEther(balance), "MON");
  
  if (balance === 0n) {
    console.log("❌ No tienes MON! Ve a: https://faucet.testnet.monad.xyz");
  } else {
    console.log("✅ Tienes suficiente MON para deploy");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});