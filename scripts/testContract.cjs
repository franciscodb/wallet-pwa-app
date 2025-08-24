const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🧪 Testing P2PLending Contract\n");

  // Cargar dirección del contrato
  const configPath = path.join(__dirname, "../src/config/contractAddress.json");
  if (!fs.existsSync(configPath)) {
    console.error("❌ No contract address found. Deploy first!");
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const contractAddress = config.address;
  console.log("📄 Contract address:", contractAddress);

  // Conectar al contrato
  const [user] = await hre.ethers.getSigners();
  console.log("👤 Testing with account:", user.address);

  const P2PLending = await hre.ethers.getContractFactory("P2PLending");
  const lending = P2PLending.attach(contractAddress);

  console.log("\n--- TEST 1: Register User ---");
  try {
    console.log("📝 Registering user with credit score 700...");
    const tx1 = await lending.registerUser(700);
    await tx1.wait();
    console.log("✅ User registered successfully!");
    
    // Verificar registro
    const profile = await lending.getUserProfile(user.address);
    console.log("👤 User Profile:");
    console.log("  - Credit Score:", profile.creditScore.toString());
    console.log("  - Is Registered:", profile.isRegistered);
  } catch (error) {
    if (error.message.includes("Already registered")) {
      console.log("ℹ️ User already registered");
    } else {
      console.error("❌ Registration failed:", error.message);
    }
  }

  console.log("\n--- TEST 2: Create Loan Request ---");
  try {
    console.log("📝 Creating loan request...");
    console.log("  - Amount: 100 MON");
    console.log("  - Interest: 10%");
    console.log("  - Duration: 30 days");
    
    const amount = hre.ethers.parseEther("100"); // 100 MON
    const interestRate = 1000; // 10% (in basis points)
    const duration = 30 * 24 * 60 * 60; // 30 days in seconds
    
    const tx2 = await lending.createLoanRequest(
      amount,
      interestRate,
      duration,
      "Test loan for development"
    );
    const receipt = await tx2.wait();
    
    console.log("✅ Loan request created!");
    console.log("  - Transaction hash:", receipt.hash);
    
    // Obtener el ID del request desde los eventos
    const requestId = await lending.requestCounter();
    console.log("  - Request ID:", requestId.toString());
    
    // Verificar el request
    const request = await lending.getLoanRequest(requestId);
    console.log("\n📊 Loan Request Details:");
    console.log("  - Borrower:", request[1]);
    console.log("  - Amount:", hre.ethers.formatEther(request[2]), "MON");
    console.log("  - Interest Rate:", (Number(request[3]) / 100).toFixed(2) + "%");
    console.log("  - Active:", request[7]);
    
  } catch (error) {
    console.error("❌ Loan request failed:", error.message);
  }

  console.log("\n--- TEST 3: Read Contract State ---");
  try {
    const loanCounter = await lending.loanCounter();
    const requestCounter = await lending.requestCounter();
    const platformFee = await lending.platformFee();
    const owner = await lending.owner();
    
    console.log("📊 Contract State:");
    console.log("  - Total Loans:", loanCounter.toString());
    console.log("  - Total Requests:", requestCounter.toString());
    console.log("  - Platform Fee:", (Number(platformFee) / 100).toFixed(2) + "%");
    console.log("  - Owner:", owner);
    
  } catch (error) {
    console.error("❌ Error reading state:", error.message);
  }

  console.log("\n✅ All tests completed!");
  console.log("\n📝 You can now:");
  console.log("1. Check the explorer: https://explorer.testnet.monad.xyz/address/" + contractAddress);
  console.log("2. Update your frontend to use the contract");
  console.log("3. Test from the UI");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });