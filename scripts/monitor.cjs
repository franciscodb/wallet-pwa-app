const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const configPath = path.join(__dirname, "../src/config/contractAddress.json");
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const contractAddress = config.address;
  
  console.log("📊 Monitoring Contract:", contractAddress);
  console.log("🔄 Press Ctrl+C to stop\n");
  
  const P2PLending = await hre.ethers.getContractFactory("P2PLending");
  const lending = P2PLending.attach(contractAddress);
  
  // Monitor events
  lending.on("UserRegistered", (user, creditScore) => {
    console.log(`✅ New User: ${user} | Score: ${creditScore}`);
  });
  
  lending.on("LoanRequestCreated", (requestId, borrower, amount) => {
    console.log(`📝 New Request #${requestId}: ${hre.ethers.formatEther(amount)} MON from ${borrower}`);
  });
  
  lending.on("InvestmentMade", (requestId, investor, amount) => {
    console.log(`💰 Investment in #${requestId}: ${hre.ethers.formatEther(amount)} MON from ${investor}`);
  });
  
  // Keep running
  await new Promise(() => {});
}

main().catch(console.error);