// scripts/checkData.cjs
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const configPath = path.join(__dirname, "../src/config/contractAddress.json");
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const contractAddress = config.address;
  
  const P2PLending = await hre.ethers.getContractFactory("P2PLending");
  const lending = P2PLending.attach(contractAddress);
  
  // Ver cuántos préstamos hay
  const loanCounter = await lending.loanCounter();
  console.log("Total loans:", loanCounter.toString());
  
  // Ver detalles de un préstamo específico
  if (loanCounter > 0) {
    const loan = await lending.getLoan(1);
    console.log("\nLoan #1:");
    console.log("- Borrower:", loan.borrower);
    console.log("- Amount:", hre.ethers.formatEther(loan.amount), "MON");
    console.log("- Lenders:", loan.lenders);
    
    // Ver cuánto invirtió cada lender
    for (const lender of loan.lenders) {
      const amount = await lending.lenderAmounts(1, lender);
      console.log(`  ${lender}: ${hre.ethers.formatEther(amount)} MON`);
    }
  }
}

main().catch(console.error);