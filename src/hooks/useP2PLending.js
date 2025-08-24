import { useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import contractAddress from '../config/contractAddress.json'
import P2PLendingABI from '../config/P2PLendingABI.json'

export function useP2PLending() {
  const CONTRACT_ADDRESS = contractAddress.address

  // Registrar usuario
  const registerUser = (creditScore) => {
    const { write, data, isLoading } = useContractWrite({
      address: CONTRACT_ADDRESS,
      abi: P2PLendingABI,
      functionName: 'registerUser',
      args: [creditScore]
    })
    
    const { isSuccess } = useWaitForTransaction({ hash: data?.hash })
    return { register: write, isLoading, isSuccess }
  }

  // Crear solicitud de préstamo
  const createLoanRequest = (amount, rate, days, purpose) => {
    const { write, data, isLoading } = useContractWrite({
      address: CONTRACT_ADDRESS,
      abi: P2PLendingABI,
      functionName: 'createLoanRequest',
      args: [
        parseEther(amount.toString()),
        rate * 100, // Convertir a basis points
        days * 86400, // Convertir a segundos
        purpose
      ]
    })
    
    const { isSuccess } = useWaitForTransaction({ hash: data?.hash })
    return { create: write, isLoading, isSuccess }
  }

  // Invertir en préstamo
  const investInLoan = (requestId, amount) => {
    const { write, data, isLoading } = useContractWrite({
      address: CONTRACT_ADDRESS,
      abi: P2PLendingABI,
      functionName: 'investInLoan',
      args: [requestId],
      value: parseEther(amount.toString())
    })
    
    const { isSuccess } = useWaitForTransaction({ hash: data?.hash })
    return { invest: write, isLoading, isSuccess }
  }

  // Pagar préstamo
  const repayLoan = (loanId, amount) => {
    const { write, data, isLoading } = useContractWrite({
      address: CONTRACT_ADDRESS,
      abi: P2PLendingABI,
      functionName: 'repayLoan',
      args: [loanId],
      value: parseEther(amount.toString())
    })
    
    const { isSuccess } = useWaitForTransaction({ hash: data?.hash })
    return { repay: write, isLoading, isSuccess }
  }

  // Leer perfil de usuario
  const getUserProfile = (address) => {
    const { data, isLoading } = useContractRead({
      address: CONTRACT_ADDRESS,
      abi: P2PLendingABI,
      functionName: 'getUserProfile',
      args: [address],
      watch: true
    })
    
    return { 
      profile: data,
      isRegistered: data?.isRegistered || false,
      creditScore: data?.creditScore?.toString() || '0',
      isLoading 
    }
  }

  return {
    registerUser,
    createLoanRequest,
    investInLoan,
    repayLoan,
    getUserProfile
  }
}