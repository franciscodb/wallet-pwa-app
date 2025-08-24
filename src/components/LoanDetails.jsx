import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { useP2PLending } from '../hooks/useP2PLending'
import CreditScoringService from '../services/creditScoring'
import './LoanPaymentDetail.css'

function LoanPaymentDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { address } = useAccount()
  const { repayLoan, useTransactionStatus } = useP2PLending()

  const [loan, setLoan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [repayAmount, setRepayAmount] = useState('')
  const [processing, setProcessing] = useState(false)
  const [txHash, setTxHash] = useState(null)
  const [paymentHistory, setPaymentHistory] = useState([])

  // Hook para monitorear estado de transacción
  const { isConfirming, isConfirmed } = useTransactionStatus(txHash)

  useEffect(() => {
    console.log('Component mounted with ID:', id)
    console.log('User address:', address)
    if (id) {
      loadLoanDetails()
      loadPaymentHistory()
    }
  }, [id, address])

  useEffect(() => {
    if (isConfirmed && txHash) {
      console.log('Transaction confirmed:', txHash)
      loadLoanDetails()
      loadPaymentHistory()
      setTxHash(null)
      setRepayAmount('')
    }
  }, [isConfirmed, txHash])

  const loadLoanDetails = async () => {
    try {
      setLoading(true)
      console.log('Loading loan details for ID:', id)

      const loanData = await CreditScoringService.getLoanById(id)
      console.log('Loan data received:', loanData)

      if (!loanData) {
        console.error('No loan data returned')
        setLoan(null)
        return
      }

      // Verificar que el usuario es el dueño del préstamo
      if (loanData.wallet_address?.toLowerCase() !== address?.toLowerCase()) {
        console.error('User is not the owner of this loan')
        navigate('/loans-personal')
        return
      }

      setLoan(loanData)

      // Set default payment amount
      if (loanData?.monthly_payment) {
        setRepayAmount(loanData.monthly_payment.toString())
      }

    } catch (error) {
      console.error('Error loading loan:', error)
      setLoan(null)
    } finally {
      setLoading(false)
    }
  }

  const loadPaymentHistory = async () => {
    try {
      // Aquí cargarías el historial de pagos desde tu servicio
      const history = await CreditScoringService.getPaymentHistory(id)
      setPaymentHistory(history || [])
    } catch (error) {
      console.error('Error loading payment history:', error)
      setPaymentHistory([])
    }
  }

  const handleRepayment = async () => {
    if (!loan || !repayAmount || !address) {
      alert('Please enter a valid payment amount')
      return
    }

    const amount = parseFloat(repayAmount)
    if (amount <= 0) {
      alert('Payment amount must be greater than 0')
      return
    }

    setProcessing(true)
    try {
      console.log('Processing repayment...')

      // Obtener el ID correcto para el contrato
      let loanIdForContract = loan.contract_loan_id || loan.id

      // Si es un número en string, convertir
      if (typeof loanIdForContract === 'string' && !isNaN(loanIdForContract)) {
        loanIdForContract = parseInt(loanIdForContract)
      }

      const amountInMon = amount / 10000 // Convertir USD a MON
      console.log('Repaying loan ID:', loanIdForContract, 'Amount in MON:', amountInMon)

      const result = await repayLoan(loanIdForContract, amountInMon.toString())

      if (result.success) {
        setTxHash(result.hash)
        console.log('Repayment transaction sent:', result.hash)

        // Actualizar en Supabase
        await CreditScoringService.updateLoanRepayment(loan.id, {
          amount: amount,
          payer_address: address,
          transaction_hash: result.hash,
          payment_date: new Date().toISOString()
        })

        alert(`Payment successful! Transaction hash: ${result.hash}`)
      } else {
        throw new Error(result.error || 'Transaction failed')
      }
    } catch (error) {
      console.error('Repayment error:', error)
      alert(`Payment failed: ${error.message || 'Unknown error'}`)
    } finally {
      setProcessing(false)
    }
  }

  const calculateProgress = () => {
    if (!loan) return 0
    const totalDue = loan.approved_amount + (loan.approved_amount * loan.interest_rate / 100)
    const paid = loan.total_repaid || 0
    return Math.min(100, Math.round((paid / totalDue) * 100))
  }

  const calculateNextPaymentDate = () => {
    if (!loan?.start_date) return 'N/A'
    const startDate = new Date(loan.start_date)
    const today = new Date()
    const monthsPassed = Math.floor((today - startDate) / (30 * 24 * 60 * 60 * 1000))
    const nextDate = new Date(startDate)
    nextDate.setMonth(nextDate.getMonth() + monthsPassed + 1)
    return nextDate.toLocaleDateString()
  }

  const calculateRemainingPayments = () => {
    if (!loan) return 0
    const totalPayments = loan.loan_term_months || 0
    const paidPayments = Math.floor((loan.total_repaid || 0) / (loan.monthly_payment || 1))
    return Math.max(0, totalPayments - paidPayments)
  }

  const getPaymentStatus = () => {
    const nextPaymentDate = new Date(calculateNextPaymentDate())
    const today = new Date()
    const daysUntilDue = Math.ceil((nextPaymentDate - today) / (1000 * 60 * 60 * 24))

    if (daysUntilDue < 0) {
      return { text: 'Overdue', color: '#ff4444', icon: '⚠️' }
    } else if (daysUntilDue <= 7) {
      return { text: 'Due Soon', color: '#f5a623', icon: '⏰' }
    } else {
      return { text: 'On Track', color: '#00c896', icon: '✓' }
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="loan-payment-detail">
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>Loading loan details...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (!loan) {
    return (
      <div className="loan-payment-detail">
        <div className="error-screen">
          <h2>Loan not found</h2>
          <p>Unable to load loan details</p>
          <button onClick={() => navigate('/loans-personal')} className="back-btn-large">
            Back to My Loans
          </button>
        </div>
      </div>
    )
  }

  const totalDue = loan.approved_amount + (loan.approved_amount * loan.interest_rate / 100)
  const remaining = totalDue - (loan.total_repaid || 0)
  const progress = calculateProgress()
  const paymentStatus = getPaymentStatus()

  return (
    <div className="loan-payment-detail">
      {/* Header */}
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate('/loans-personal')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
        <h1>Loan Payment Details</h1>
        <div className="payment-status" style={{ color: paymentStatus.color }}>
          {paymentStatus.icon} {paymentStatus.text}
        </div>
      </div>

   {/* Make Payment Section */}
      <div className="make-payment-section">
        <div className="section-header">
          <h3>Make a Payment</h3>
          <span className="next-due">Next payment due: {calculateNextPaymentDate()}</span>
        </div>

        <div className="payment-form-card">
          <div className="payment-input-section">
            <label>Payment Amount (USD)</label>
            <div className="amount-input-wrapper">
              <span className="currency-symbol">$</span>
              <input
                type="number"
                value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value)}
                placeholder="Enter amount"
                min="0"
                step="0.01"
                className="amount-input"
              />
            </div>
          </div>

          <div className="quick-payment-options">
            <button 
              className="quick-option"
              onClick={() => setRepayAmount(loan.monthly_payment?.toString() || '0')}
            >
              <span className="option-label">Monthly Payment</span>
              <span className="option-amount">${loan.monthly_payment?.toLocaleString()}</span>
            </button>
            <button 
              className="quick-option"
              onClick={() => setRepayAmount(((loan.monthly_payment || 0) * 2).toString())}
            >
              <span className="option-label">Double Payment</span>
              <span className="option-amount">${((loan.monthly_payment || 0) * 2).toLocaleString()}</span>
            </button>
            <button 
              className="quick-option"
              onClick={() => setRepayAmount(remaining.toString())}
            >
              <span className="option-label">Pay in Full</span>
              <span className="option-amount">${remaining.toLocaleString()}</span>
            </button>
          </div>

          <button
            className="payment-button"
            onClick={handleRepayment}
            disabled={processing || !repayAmount || parseFloat(repayAmount) <= 0 || isConfirming || !address}
          >
            {!address ? 'Connect Wallet to Pay' :
              isConfirming ? 'Confirming Transaction...' :
                processing ? 'Processing Payment...' :
                  `Pay $${parseFloat(repayAmount || 0).toLocaleString()}`}
          </button>

          {txHash && (
            <div className="transaction-status-card">
              <p className="tx-status">
                {isConfirming ? '⏳ Confirming transaction...' : 
                 isConfirmed ? '✓ Payment confirmed!' : '⏳ Transaction pending...'}
              </p>
              <a 
                href={`https://explorer.testnet.monad.xyz/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="tx-link"
              >
                View on Explorer →
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Loan Overview Card */}
      <div className="loan-overview-card">
        <div className="overview-header">
          <div>
            <h2>{loan.loan_description || `${loan.loan_purpose} Loan`}</h2>
            <p className="loan-id">Loan ID: {loan.id?.slice(0, 8)}...</p>
          </div>
          <div className="loan-status-badge" data-status={loan.status}>
            {loan.status}
          </div>
        </div>

        <div className="key-metrics">
          <div className="metric">
            <span className="metric-label">Original Amount</span>
            <span className="metric-value">${loan.approved_amount?.toLocaleString()}</span>
          </div>
          <div className="metric">
            <span className="metric-label">Interest Rate</span>
            <span className="metric-value">{loan.interest_rate}% APR</span>
          </div>
          <div className="metric">
            <span className="metric-label">Term</span>
            <span className="metric-value">{loan.loan_term_months} months</span>
          </div>
          <div className="metric">
            <span className="metric-label">Monthly Payment</span>
            <span className="metric-value">${loan.monthly_payment?.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Payment Progress */}
      <div className="payment-progress-section">
        <h3>Payment Progress</h3>
        
        <div className="progress-visualization">
          <div className="circular-progress">
            <svg width="160" height="160">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="#e0e0e0"
                strokeWidth="12"
                fill="none"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="#4a90e2"
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${progress * 4.4} 440`}
                strokeLinecap="round"
                transform="rotate(-90 80 80)"
              />
            </svg>
            <div className="progress-center">
              <span className="progress-percent">{progress}%</span>
              <span className="progress-label">Complete</span>
            </div>
          </div>

          <div className="progress-details">
            <div className="progress-stat">
              <span className="stat-label">Total Due</span>
              <span className="stat-value">${totalDue.toLocaleString()}</span>
            </div>
            <div className="progress-stat">
              <span className="stat-label">Amount Paid</span>
              <span className="stat-value positive">${(loan.total_repaid || 0).toLocaleString()}</span>
            </div>
            <div className="progress-stat">
              <span className="stat-label">Remaining Balance</span>
              <span className="stat-value">${remaining.toLocaleString()}</span>
            </div>
            <div className="progress-stat">
              <span className="stat-label">Remaining Payments</span>
              <span className="stat-value">{calculateRemainingPayments()}</span>
            </div>
          </div>
        </div>
      </div>

   

      {/* Payment History */}
      {paymentHistory.length > 0 && (
        <div className="payment-history-section">
          <h3>Recent Payments</h3>
          <div className="history-list">
            {paymentHistory.slice(0, 5).map((payment, index) => (
              <div key={index} className="history-item">
                <div className="history-date">
                  {new Date(payment.payment_date).toLocaleDateString()}
                </div>
                <div className="history-amount">
                  ${payment.amount.toLocaleString()}
                </div>
                <div className="history-status">
                  <span className="status-badge confirmed">Confirmed</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      
    </div>
  )
}

export default LoanPaymentDetail