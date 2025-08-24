const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("📊 Getting Complete P2PLending Contract History\n");

  // Cargar dirección del contrato
  const configPath = path.join(__dirname, "../src/config/contractAddress.json");
  if (!fs.existsSync(configPath)) {
    console.error("❌ No contract address found. Deploy first!");
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const contractAddress = config.address;
  console.log("📄 Contract Address:", contractAddress);
  console.log("🌐 Explorer:", `https://explorer.testnet.monad.xyz/address/${contractAddress}`);

  // Conectar al contrato
  const P2PLending = await hre.ethers.getContractFactory("P2PLending");
  const lending = P2PLending.attach(contractAddress);

  console.log("\n--- OBTENIENDO HISTORIAL COMPLETO ---\n");

  try {
    const currentBlock = await hre.ethers.provider.getBlockNumber();
    const maxBlockRange = 99; // Monad limita a 100 bloques
    const totalBlocksToSearch = 2000; // Buscar en los últimos 2000 bloques
    const startBlock = Math.max(0, currentBlock - totalBlocksToSearch);
    
    console.log(`🔍 Buscando eventos desde bloque ${startBlock} hasta ${currentBlock}`);
    console.log(`📦 Usando consultas de ${maxBlockRange} bloques por limitaciones de Monad`);
    
    // Arrays para almacenar todos los eventos
    let allUserEvents = [];
    let allRequestEvents = [];
    let allInvestmentEvents = [];
    let allFundedEvents = [];
    let allRepaidEvents = [];

    // Hacer múltiples consultas
    let searchedBlocks = 0;
    for (let fromBlock = startBlock; fromBlock < currentBlock; fromBlock += maxBlockRange) {
      const toBlock = Math.min(fromBlock + maxBlockRange - 1, currentBlock);
      searchedBlocks += (toBlock - fromBlock + 1);
      
      process.stdout.write(`\r🔄 Progreso: ${Math.round((searchedBlocks / Math.min(totalBlocksToSearch, currentBlock - startBlock)) * 100)}% `);
      
      try {
        // Obtener eventos por lotes
        const userEvents = await lending.queryFilter(lending.filters.UserRegistered(), fromBlock, toBlock);
        const requestEvents = await lending.queryFilter(lending.filters.LoanRequestCreated(), fromBlock, toBlock);
        const investmentEvents = await lending.queryFilter(lending.filters.InvestmentMade(), fromBlock, toBlock);
        const fundedEvents = await lending.queryFilter(lending.filters.LoanFunded(), fromBlock, toBlock);
        const repaidEvents = await lending.queryFilter(lending.filters.LoanRepaid(), fromBlock, toBlock);

        allUserEvents.push(...userEvents);
        allRequestEvents.push(...requestEvents);
        allInvestmentEvents.push(...investmentEvents);
        allFundedEvents.push(...fundedEvents);
        allRepaidEvents.push(...repaidEvents);

        // Pequeña pausa para no saturar el RPC
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.log(`\n⚠️  Error en rango ${fromBlock}-${toBlock}: ${error.message}`);
        continue;
      }
    }
    
    console.log(`\n✅ Búsqueda completada! Analizados ${searchedBlocks} bloques.\n`);

    // Ahora mostrar todos los resultados
    console.log("1️⃣ === USUARIOS REGISTRADOS ===");
    if (allUserEvents.length > 0) {
      allUserEvents.forEach((event, index) => {
        console.log(`👤 Usuario ${index + 1}:`);
        console.log(`   Dirección: ${event.args.user}`);
        console.log(`   Credit Score: ${event.args.creditScore}`);
        console.log(`   Bloque: ${event.blockNumber}`);
        console.log(`   Hash: ${event.transactionHash}`);
        console.log("");
      });
    } else {
      console.log("   ℹ️ No hay usuarios registrados en el rango consultado");
    }

    console.log("2️⃣ === SOLICITUDES DE PRÉSTAMO ===");
    if (allRequestEvents.length > 0) {
      for (let i = 0; i < allRequestEvents.length; i++) {
        const event = allRequestEvents[i];
        console.log(`💰 Solicitud ${i + 1}:`);
        console.log(`   Request ID: ${event.args.requestId}`);
        console.log(`   Prestatario: ${event.args.borrower}`);
        console.log(`   Cantidad: ${hre.ethers.formatEther(event.args.amount)} MON`);
        console.log(`   Bloque: ${event.blockNumber}`);
        console.log(`   Hash: ${event.transactionHash}`);
        
        try {
          const requestDetails = await lending.getLoanRequest(event.args.requestId);
          console.log(`   Interés: ${(Number(requestDetails[3]) / 100).toFixed(2)}%`);
          console.log(`   Duración: ${Math.round(Number(requestDetails[4]) / (24 * 60 * 60))} días`);
          console.log(`   Propósito: ${requestDetails[6]}`);
          console.log(`   Activa: ${requestDetails[7]}`);
          console.log(`   Financiado: ${hre.ethers.formatEther(requestDetails[8])} MON`);
        } catch (error) {
          console.log(`   ⚠️ Error obteniendo detalles`);
        }
        console.log("");
      }
    } else {
      console.log("   ℹ️ No hay solicitudes de préstamo en el rango consultado");
    }

    console.log("3️⃣ === INVERSIONES REALIZADAS ===");
    if (allInvestmentEvents.length > 0) {
      allInvestmentEvents.forEach((event, index) => {
        console.log(`💵 Inversión ${index + 1}:`);
        console.log(`   Request ID: ${event.args.requestId}`);
        console.log(`   Inversor: ${event.args.investor}`);
        console.log(`   Cantidad: ${hre.ethers.formatEther(event.args.amount)} MON`);
        console.log(`   Bloque: ${event.blockNumber}`);
        console.log(`   Hash: ${event.transactionHash}`);
        console.log("");
      });
    } else {
      console.log("   ℹ️ No hay inversiones en el rango consultado");
    }

    console.log("4️⃣ === PRÉSTAMOS FINANCIADOS ===");
    if (allFundedEvents.length > 0) {
      for (let i = 0; i < allFundedEvents.length; i++) {
        const event = allFundedEvents[i];
        console.log(`✅ Préstamo Financiado ${i + 1}:`);
        console.log(`   Loan ID: ${event.args.loanId}`);
        console.log(`   Prestatario: ${event.args.borrower}`);
        console.log(`   Cantidad: ${hre.ethers.formatEther(event.args.amount)} MON`);
        console.log(`   Bloque: ${event.blockNumber}`);
        console.log(`   Hash: ${event.transactionHash}`);
        console.log("");
      }
    } else {
      console.log("   ℹ️ No hay préstamos financiados en el rango consultado");
    }

    console.log("5️⃣ === PRÉSTAMOS PAGADOS ===");
    if (allRepaidEvents.length > 0) {
      allRepaidEvents.forEach((event, index) => {
        console.log(`💚 Préstamo Pagado ${index + 1}:`);
        console.log(`   Loan ID: ${event.args.loanId}`);
        console.log(`   Prestatario: ${event.args.borrower}`);
        console.log(`   Cantidad Pagada: ${hre.ethers.formatEther(event.args.amount)} MON`);
        console.log(`   Bloque: ${event.blockNumber}`);
        console.log(`   Hash: ${event.transactionHash}`);
        console.log("");
      });
    } else {
      console.log("   ℹ️ No hay préstamos pagados en el rango consultado");
    }

    // Estadísticas finales
    console.log("📊 === RESUMEN ESTADÍSTICO ===");
    console.log(`📈 Eventos encontrados:`);
    console.log(`   Usuarios Registrados: ${allUserEvents.length}`);
    console.log(`   Solicitudes de Préstamo: ${allRequestEvents.length}`);
    console.log(`   Inversiones: ${allInvestmentEvents.length}`);
    console.log(`   Préstamos Financiados: ${allFundedEvents.length}`);
    console.log(`   Préstamos Pagados: ${allRepaidEvents.length}`);
    console.log(`   Total Transacciones: ${allUserEvents.length + allRequestEvents.length + allInvestmentEvents.length + allFundedEvents.length + allRepaidEvents.length}`);

    // Estado actual del contrato
    console.log(`\n🏗️ Estado actual del contrato:`);
    const loanCounter = await lending.loanCounter();
    const requestCounter = await lending.requestCounter();
    const platformFee = await lending.platformFee();
    
    console.log(`   Contador de Préstamos: ${loanCounter}`);
    console.log(`   Contador de Solicitudes: ${requestCounter}`);
    console.log(`   Comisión Plataforma: ${(Number(platformFee) / 100).toFixed(2)}%`);

    // Si no encontramos eventos, dar sugerencias
    if (allUserEvents.length + allRequestEvents.length + allInvestmentEvents.length + allFundedEvents.length + allRepaidEvents.length === 0) {
      console.log(`\n💡 SUGERENCIAS:`);
      console.log(`   - El contrato podría haber sido desplegado hace más de ${totalBlocksToSearch} bloques`);
      console.log(`   - Intenta incrementar 'totalBlocksToSearch' en el script`);
      console.log(`   - Verifica la dirección del contrato: ${contractAddress}`);
      console.log(`   - Revisa el explorador: ${`https://explorer.testnet.monad.xyz/address/${contractAddress}`}`);
    }

  } catch (error) {
    console.error("❌ Error general:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });