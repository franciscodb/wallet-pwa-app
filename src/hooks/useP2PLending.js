import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther, parseGwei } from 'viem'
import contractAddress from '../config/contractAddress.json'
import P2PLendingABI from '../config/P2PLendingABI.json'
import { useState, useEffect } from 'react'

// CONFIGURACIÓN BALANCEADA: Bajo costo pero funcional
const GAS_CONFIG = {
    development: {
        // Valores que funcionan en la mayoría de testnets
        gas: 300000n, // Gas limit suficiente para la función
        gasPrice: parseGwei('200'), // 1 Gwei - bajo pero aceptable
    },
    // Configuración alternativa para redes EIP-1559
    eip1559: {
        gas: 300000n,
        maxFeePerGas: parseGwei('20'),
        maxPriorityFeePerGas: parseGwei('0.1')
    }
}

// Variable para cambiar entre modos
const USE_EIP1559 = false // Cambiar a true si tu red soporta EIP-1559
const ENVIRONMENT = 'development'

export function useP2PLending() {
    const CONTRACT_ADDRESS = contractAddress.address
    const gasConfig = USE_EIP1559 ? GAS_CONFIG.eip1559 : GAS_CONFIG[ENVIRONMENT]

    // Hook para escribir contratos
    const { writeContract, data: writeData, isPending: isWritePending, error: writeError } = useWriteContract()

    // Registrar usuario
    const registerUser = async (creditScore) => {
        try {
            console.log('📝 Registering user with gas config:', gasConfig)
            const hash = await writeContract({
                address: CONTRACT_ADDRESS,
                abi: P2PLendingABI,
                functionName: 'registerUser',
                args: [creditScore],
                ...gasConfig
            })
            return { hash, success: true }
        } catch (error) {
            console.error('Error registering user:', error)
            return { error, success: false }
        }
    }

    // Crear solicitud de préstamo
    const createLoanRequest = async (amount, rate, days, purpose) => {
        console.log("PROPUESTA", amount, rate, days, purpose)
        console.log("Gas config:", gasConfig)

        try {
            const hash = await writeContract({
                address: CONTRACT_ADDRESS,
                abi: P2PLendingABI,
                functionName: 'createLoanRequest',
                args: [
                    parseEther(amount.toString()),
                    Math.round(rate * 100),
                    days,
                    purpose
                ],
                ...gasConfig
            })
            return { hash, success: true }
        } catch (error) {
            console.error('Error creating loan request:', error)
            return { error, success: false }
        }
    }

    // Invertir en préstamo - FUNCIÓN CRÍTICA
    const investInLoan = async (requestId, amount) => {
        try {
            // ASEGURAR QUE requestId ES UN NÚMERO
            const requestIdNumber = typeof requestId === 'number' ? requestId : parseInt(requestId, 10)

            if (isNaN(requestIdNumber)) {
                throw new Error('Invalid request ID: must be a number')
            }

            console.log('💸 Investment Configuration:')
            console.log('  Request ID (number):', requestIdNumber)
            console.log('  Type:', typeof requestIdNumber)
            console.log('  Amount in MON:', amount)
            console.log('  Contract:', CONTRACT_ADDRESS)

            const gasConfig = {
                gas: 500000n, // Aumentar gas limit
                gasPrice: parseGwei('30') // 30 Gwei
            }

            const hash = await writeContract({
                address: CONTRACT_ADDRESS,
                abi: P2PLendingABI,
                functionName: 'investInLoan',
                args: [requestIdNumber], // Pasar como número, wagmi lo convertirá a BigInt
                value: parseEther(amount.toString()),
                ...gasConfig
            })

            console.log('✅ Transaction sent:', hash)
            return { hash, success: true }

        } catch (error) {
            console.error('❌ Transaction error:', error)

            // Mensajes de error más específicos
            if (error.message?.includes('execution reverted')) {
                // El contrato rechazó la transacción
                const reasons = [
                    'Request not active',
                    'Cannot invest in own loan',
                    'User not registered',
                    'Insufficient value'
                ]
                return {
                    success: false,
                    error: 'Contract rejected transaction. Possible reasons: ' + reasons.join(', ')
                }
            }

            return {
                success: false,
                error: error.shortMessage || error.message || 'Transaction failed'
            }
        }
    }

    // Pagar préstamo
    const repayLoan = async (loanId, amount) => {
        try {
            console.log('💳 Repaying loan:', loanId, 'Amount:', amount)
            const hash = await writeContract({
                address: CONTRACT_ADDRESS,
                abi: P2PLendingABI,
                functionName: 'repayLoan',
                args: [loanId],
                value: parseEther(amount.toString()),
                ...gasConfig
            })
            return { hash, success: true }
        } catch (error) {
            console.error('Error repaying loan:', error)
            return { error: error.message, success: false }
        }
    }

    // Hook para esperar confirmación de transacción
    const useTransactionStatus = (hash) => {
        const { isLoading: isConfirming, isSuccess: isConfirmed, error } = useWaitForTransactionReceipt({
            hash,
        })

        return { isConfirming, isConfirmed, error }
    }

    // Leer perfil de usuario
    const useUserProfile = (address) => {
        const { data, isLoading, error, refetch } = useReadContract({
            address: CONTRACT_ADDRESS,
            abi: P2PLendingABI,
            functionName: 'getUserProfile',
            args: address ? [address] : undefined,
            query: {
                enabled: !!address,
            }
        })

        return {
            profile: data,
            isRegistered: data?.isRegistered || false,
            creditScore: data?.creditScore?.toString() || '0',
            totalBorrowed: data?.totalBorrowed ? formatEther(data.totalBorrowed) : '0',
            totalRepaid: data?.totalRepaid ? formatEther(data.totalRepaid) : '0',
            activeLoans: data?.activeLoans?.toString() || '0',
            isLoading,
            error,
            refetch
        }
    }

    // Obtener solicitud de préstamo
    const useLoanRequest = (requestId) => {
        const { data, isLoading, error, refetch } = useReadContract({
            address: CONTRACT_ADDRESS,
            abi: P2PLendingABI,
            functionName: 'getLoanRequest',
            args: requestId ? [requestId] : undefined,
            query: {
                enabled: !!requestId,
            }
        })

        return {
            loanRequest: data,
            amount: data ? formatEther(data[2]) : '0',
            interestRate: data ? (Number(data[3]) / 100).toFixed(2) : '0',
            isLoading,
            error,
            refetch
        }
    }

    // Obtener préstamo
    const useLoan = (loanId) => {
        const { data, isLoading, error, refetch } = useReadContract({
            address: CONTRACT_ADDRESS,
            abi: P2PLendingABI,
            functionName: 'getLoan',
            args: loanId ? [loanId] : undefined,
            query: {
                enabled: !!loanId,
            }
        })

        return {
            loan: data,
            amount: data ? formatEther(data.amount) : '0',
            interestRate: data ? (Number(data.interestRate) / 100).toFixed(2) : '0',
            isLoading,
            error,
            refetch
        }
    }

    // Obtener contador de préstamos
    const useLoanCounter = () => {
        const { data, isLoading, error } = useReadContract({
            address: CONTRACT_ADDRESS,
            abi: P2PLendingABI,
            functionName: 'loanCounter'
        })

        return {
            loanCounter: data ? Number(data) : 0,
            isLoading,
            error
        }
    }

    // Obtener contador de solicitudes
    const useRequestCounter = () => {
        const { data, isLoading, error } = useReadContract({
            address: CONTRACT_ADDRESS,
            abi: P2PLendingABI,
            functionName: 'requestCounter'
        })

        return {
            requestCounter: data ? Number(data) : 0,
            isLoading,
            error
        }
    }

    return {
        // Funciones de escritura
        registerUser,
        createLoanRequest,
        investInLoan,
        repayLoan,

        // Hooks de lectura
        useUserProfile,
        useLoanRequest,
        useLoan,
        useLoanCounter,
        useRequestCounter,
        useTransactionStatus,

        // Estados de escritura
        isWritePending,
        writeError,
        writeData,

        // Configuración actual (para debugging)
        gasConfig,
        environment: ENVIRONMENT
    }
}

// Hook para el flujo completo de solicitud de préstamo
export function useLoanRequestFlow() {
    const [currentStep, setCurrentStep] = useState(1)
    const [transactionHash, setTransactionHash] = useState(null)
    const [loanRequestId, setLoanRequestId] = useState(null)
    const [savedData, setSavedData] = useState(null)

    const { createLoanRequest, useTransactionStatus, useRequestCounter } = useP2PLending()
    const { isConfirming, isConfirmed } = useTransactionStatus(transactionHash)
    const { requestCounter } = useRequestCounter()

    const submitLoanRequest = async (loanData, creditAnalysis) => {
        try {
            console.log('📝 Starting loan request submission...')
            setCurrentStep(3)

            const amountInMon = creditAnalysis.approvedAmount / 10000;
            const interestRateClean = Math.round(creditAnalysis.interestRate * 100) / 1000;

            const result = await createLoanRequest(
                amountInMon,
                interestRateClean,
                loanData.loanTerm * 30,
                loanData.purpose
            )

            if (result.success) {
                console.log('✅ Transaction submitted:', result.hash)
                setTransactionHash(result.hash)
                const newLoanRequestId = requestCounter + 1
                setLoanRequestId(newLoanRequestId)

                // Guardar en Supabase
                try {
                    const { default: CreditScoringService } = await import('../services/creditScoring')

                    const dataToSave = {
                        walletAddress: loanData.walletAddress,
                        fullName: loanData.fullName || '',
                        email: loanData.email || '',
                        monthlyIncome: loanData.monthlyIncome,
                        occupation: loanData.occupation || '',
                        employmentType: loanData.employmentType || 'unemployed',
                        loanAmount: loanData.loanAmount,
                        approvedAmount: creditAnalysis.approvedAmount,
                        approvedAmountMon: amountInMon,
                        loanTerm: loanData.loanTerm,
                        interestRate: creditAnalysis.interestRate,
                        monthlyPayment: creditAnalysis.monthlyPayment,
                        purpose: loanData.purpose,
                        description: loanData.description || '',
                        finalScore: creditAnalysis.finalScore,
                        category: creditAnalysis.category,
                        status: creditAnalysis.status,
                        transactionHash: result.hash,
                        contractRequestId: newLoanRequestId,
                        blockchain_network: 'monad_testnet',
                        ocupacion: loanData.ocupacion,
                        antiguedadLaboral: loanData.antiguedadLaboral,
                        ingresosEstimados: loanData.ingresosEstimados,
                        pagosServicios: loanData.pagosServicios,
                        frecuenciaApertura: loanData.frecuenciaApertura,
                        cumplimientoKyc: loanData.cumplimientoKyc,
                        puntualidadPagos: loanData.puntualidadPagos,
                        ratiosFinancieros: loanData.ratiosFinancieros,
                        tipoColateral: loanData.tipoColateral,
                        totalInterest: creditAnalysis.totalInterest,
                        netProfit: creditAnalysis.netProfit,
                        roiPercentage: creditAnalysis.roiPercentage,
                        contributions: creditAnalysis.contributions
                    }

                    const saveResult = await CreditScoringService.saveLoanRequestToSupabase(dataToSave)
                    console.log('✅ Saved to Supabase:', saveResult)

                    setTimeout(() => {
                        setCurrentStep(4)
                    }, 2000)

                } catch (error) {
                    console.error('❌ Error saving to Supabase:', error)
                    setTimeout(() => {
                        setCurrentStep(4)
                    }, 2000)
                }

                return { success: true, hash: result.hash }
            } else {
                throw result.error
            }
        } catch (error) {
            console.error('❌ Error in loan request flow:', error)
            setCurrentStep(2)
            return { success: false, error }
        }
    }

    const resetFlow = () => {
        setCurrentStep(1)
        setTransactionHash(null)
        setLoanRequestId(null)
        setSavedData(null)
    }

    return {
        currentStep,
        transactionHash,
        loanRequestId,
        isConfirming,
        isConfirmed,
        submitLoanRequest,
        resetFlow,
        setCurrentStep
    }
}

export default useP2PLending