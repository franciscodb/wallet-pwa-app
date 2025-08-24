const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting deployment to Monad Testnet...\n");

  // Obtener deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Deployer address:", deployer.address);

  // Verificar balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", hre.ethers.formatEther(balance), "MON\n");

  if (balance === 0n) {
    console.error("❌ No tienes MON para deploy!");
    process.exit(1);
  }

  // Deploy del contrato
  console.log("📄 Deploying P2PLending contract...");
  const P2PLending = await hre.ethers.getContractFactory("P2PLending");
  const lending = await P2PLending.deploy();
  
  console.log("⏳ Waiting for deployment...");
  await lending.waitForDeployment();
  
  const contractAddress = await lending.getAddress();
  console.log("✅ Contract deployed to:", contractAddress);
  console.log("🔗 Explorer: https://explorer.testnet.monad.xyz/address/" + contractAddress);

  // Guardar info para el frontend
  const configDir = path.join(__dirname, "../src/config");
  
  if (!fs.existsSync(configDir)){
    fs.mkdirSync(configDir, { recursive: true });
  }

  // Guardar dirección
  const addressData = {
    address: contractAddress,
    network: "monad-testnet",
    chainId: 10143,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address
  };

  fs.writeFileSync(
    path.join(configDir, "contractAddress.json"),
    JSON.stringify(addressData, null, 2)
  );

  // Guardar ABI
  const artifact = await hre.artifacts.readArtifact("P2PLending");
  fs.writeFileSync(
    path.join(configDir, "P2PLendingABI.json"),
    JSON.stringify(artifact.abi, null, 2)
  );

  console.log("\n📁 Contract info saved to src/config/");
  console.log("✅ Deployment complete!\n");
  
  // Mostrar siguiente paso
  console.log("📝 Next steps:");
  console.log("1. Run: npm run test:contract");
  console.log("2. Update .env with: VITE_CONTRACT_ADDRESS=" + contractAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });