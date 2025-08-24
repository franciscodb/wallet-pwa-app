import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import contractAddress from '../config/contractAddress.json'
import P2PLendingABI from '../config/P2PLendingABI.json'
import {
    useState, useEffect

} from 'react'
export function useP2PLending() {
    const CONTRACT_ADDRESS = contractAddress.address

    // Hook para escribir contratos (versión wagmi v2)
    const { writeContract, data: writeData, isPending: isWritePending, error: writeError } = useWriteContract()

    // Registrar usuario
    const registerUser = async (creditScore) => {
        try {
            const hash = await writeContract({
                address: CONTRACT_ADDRESS,
                abi: P2PLendingABI,
                functionName: 'registerUser',
                args: [creditScore]
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

        try {
            const hash = await writeContract({
                address: CONTRACT_ADDRESS,
                abi: P2PLendingABI,
                functionName: 'createLoanRequest',
                args: [
                    parseEther(amount.toString()),
                    Math.round(rate * 100), // Convertir a basis points
                    days, // días directamente
                    purpose
                ]
            })
            return { hash, success: true }
        } catch (error) {
            console.error('Error creating loan request:', error)
            return { error, success: false }
        }
    }

    // Invertir en préstamo
    const investInLoan = async (requestId, amount) => {
        try {
            const hash = await writeContract({
                address: CONTRACT_ADDRESS,
                abi: P2PLendingABI,
                functionName: 'investInLoan',
                args: [requestId],
                value: parseEther(amount.toString())
            })
            return { hash, success: true }
        } catch (error) {
            console.error('Error investing in loan:', error)
            return { error, success: false }
        }
    }

    // Pagar préstamo
    const repayLoan = async (loanId, amount) => {
        try {
            const hash = await writeContract({
                address: CONTRACT_ADDRESS,
                abi: P2PLendingABI,
                functionName: 'repayLoan',
                args: [loanId],
                value: parseEther(amount.toString())
            })
            return { hash, success: true }
        } catch (error) {
            console.error('Error repaying loan:', error)
            return { error, success: false }
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
            amount: data ? formatEther(data[2]) : '0', // data[2] es amount
            interestRate: data ? (Number(data[3]) / 100).toFixed(2) : '0', // data[3] es interestRate
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

    // Obtener contador de préstamos (para saber el total)
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
        writeData
    }
}

// Hook personalizado para el flujo completo de solicitud de préstamo
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

            const amountInMon = creditAnalysis.approvedAmount / 10000; // Si 1000 USD = 1 MON

            // El interest rate ya viene como porcentaje (ej: 57.2%)
            // No necesita multiplicación adicional
            const interestRateClean = Math.round(creditAnalysis.interestRate * 100) / 1000;


            const result = await createLoanRequest(
                amountInMon, // Convertir wei a ETH
                interestRateClean,
                loanData.loanTerm * 30, // meses a días
                loanData.purpose
            )

            if (result.success) {
                console.log('✅ Transaction submitted:', result.hash)
                setTransactionHash(result.hash)
                const newLoanRequestId = requestCounter + 1
                setLoanRequestId(newLoanRequestId)

                // GUARDAR INMEDIATAMENTE EN SUPABASE (para hackathon)
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
                        approvedAmountMon: amountInMon, // Añadir el monto en MON
                        loanTerm: loanData.loanTerm,
                        interestRate: creditAnalysis.interestRate,
                        monthlyPayment: creditAnalysis.monthlyPayment,
                        purpose: loanData.purpose,
                        description: loanData.description || '',

                        finalScore: creditAnalysis.finalScore,
                        category: creditAnalysis.category,
                        status: creditAnalysis.status,

                        transactionHash: result.hash,
                        contractRequestId: newLoanRequestId, // ID del contrato
                        blockchain_network: 'monad_testnet',

                        // Incluir todos los scores para la evaluación crediticia
                        ocupacion: loanData.ocupacion,
                        antiguedadLaboral: loanData.antiguedadLaboral,
                        ingresosEstimados: loanData.ingresosEstimados,
                        pagosServicios: loanData.pagosServicios,
                        frecuenciaApertura: loanData.frecuenciaApertura,
                        cumplimientoKyc: loanData.cumplimientoKyc,
                        puntualidadPagos: loanData.puntualidadPagos,
                        ratiosFinancieros: loanData.ratiosFinancieros,
                        tipoColateral: loanData.tipoColateral,

                        // Métricas adicionales
                        totalInterest: creditAnalysis.totalInterest,
                        netProfit: creditAnalysis.netProfit,
                        roiPercentage: creditAnalysis.roiPercentage,
                        contributions: creditAnalysis.contributions
                    }

                    const saveResult = await CreditScoringService.saveLoanRequestToSupabase(dataToSave)
                    console.log('✅ Saved to Supabase:', saveResult)

                    // Ir directamente a success
                    setTimeout(() => {
                        setCurrentStep(4)
                    }, 2000) // Dar tiempo para ver el mensaje

                } catch (error) {
                    console.error('❌ Error saving to Supabase:', error)
                    // Aún así mostrar success ya que la transacción se envió
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