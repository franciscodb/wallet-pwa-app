import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { useP2PLending } from '../hooks/useP2PLending'
import CreditScoringService from '../services/creditScoring'
import './LoanDetail.css'

function LoanDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { address } = useAccount()
  const { repayLoan, investInLoan, useTransactionStatus } = useP2PLending()

  const [loan, setLoan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [repayAmount, setRepayAmount] = useState('')
  const [investAmount, setInvestAmount] = useState('')
  const [processing, setProcessing] = useState(false)
  const [txHash, setTxHash] = useState(null)
  const [isOwner, setIsOwner] = useState(false)

  // Hook para monitorear estado de transacción
  const { isConfirming, isConfirmed } = useTransactionStatus(txHash)

  useEffect(() => {
    console.log('Component mounted with ID:', id)
    console.log('User address:', address)
    if (id) {
      loadLoanDetails()
    }
  }, [id, address])

  useEffect(() => {
    if (isConfirmed && txHash) {
      console.log('Transaction confirmed:', txHash)
      loadLoanDetails()
      setTxHash(null)
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

      setLoan(loanData)

      // Verificar si el usuario actual es el dueño del préstamo
      if (loanData && address) {
        const isLoanOwner = loanData.wallet_address?.toLowerCase() === address.toLowerCase()
        setIsOwner(isLoanOwner)
        console.log('Is owner:', isLoanOwner)
      }

      // Set default amounts
      if (loanData?.monthly_payment && isOwner) {
        setRepayAmount(loanData.monthly_payment.toString())
      } else if (!isOwner) {
        // Default investment amount
        setInvestAmount('1000')
      }

    } catch (error) {
      console.error('Error loading loan:', error)
      setLoan(null)
    } finally {
      setLoading(false)
    }
  }

  const handleRepayment = async () => {
    if (!loan || !repayAmount || !address) {
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

      const amountInMon = parseFloat(repayAmount) / 10000 // Convertir USD a MON
      console.log('Repaying loan ID:', loanIdForContract, 'Amount in MON:', amountInMon)

      const result = await repayLoan(loanIdForContract, amountInMon.toString())

      if (result.success) {
        setTxHash(result.hash)
        console.log('Repayment transaction sent:', result.hash)

        // Actualizar en Supabase
        await CreditScoringService.updateLoanRepayment(loan.id, {
          amount: parseFloat(repayAmount),
          payer_address: address,
          transaction_hash: result.hash
        })

        await loadLoanDetails()
      } else {
        throw new Error(result.error || 'Transaction failed')
      }
    } catch (error) {
      console.error('Repayment error:', error)
    } finally {
      setProcessing(false)
    }
  }

  const handleInvestment = async () => {
    if (!loan || !investAmount || !address) {
      alert('Please enter an investment amount')
      return
    }

    const amount = parseFloat(investAmount)

    setProcessing(true)
    try {
      console.log('Starting investment process...')
      console.log('Loan data:', loan)

      // CRÍTICO: Convertir contract_request_id a número
      let contractRequestId = loan.contract_request_id

      // Si es string, convertir a número
      if (typeof contractRequestId === 'string') {
        contractRequestId = parseInt(contractRequestId, 10)
      }

      // Si no existe, extraer del contract_address
      if (!contractRequestId && loan.contract_address) {
        const match = loan.contract_address.match(/request_(\d+)/)
        if (match) {
          contractRequestId = parseInt(match[1], 10)
        }
      }

      // VALIDACIÓN CRÍTICA
      if (!contractRequestId || isNaN(contractRequestId)) {
        console.error('Invalid contract request ID:', loan.contract_request_id)
        alert('Error: Invalid loan request ID. Cannot proceed with investment.')
        setProcessing(false)
        return
      }

      console.log('Using contract request ID (as number):', contractRequestId)
      console.log('Type of request ID:', typeof contractRequestId)

      // Primero verificar que el request existe y está activo
      try {
        const { useLoanRequest } = useP2PLending()
        const { loanRequest } = useLoanRequest(contractRequestId)

        console.log('Loan request from contract:', loanRequest)

        // Si no existe o no está activo, mostrar error
        if (!loanRequest || !loanRequest[7]) { // índice 7 es 'active'
          alert('This loan request is not active or does not exist in the contract.')
          setProcessing(false)
          return
        }
      } catch (verifyError) {
        console.warn('Could not verify request status:', verifyError)
        // Continuar de todos modos
      }

      // Convertir cantidad a MON
      const amountInMon = (amount / 10000).toString()
      console.log('Investment amount in USD:', amount)
      console.log('Investment amount in MON:', amountInMon)

      // LLAMAR AL CONTRATO CON EL ID COMO NÚMERO
      const result = await investInLoan(contractRequestId, amountInMon)

      if (result.success) {
        setTxHash(result.hash)
        console.log('Investment transaction sent:', result.hash)

        // Actualizar en Supabase SOLO si la transacción fue exitosa
        try {
          await CreditScoringService.recordInvestment({
            loan_id: loan.id,
            investor_address: address,
            amount: amount,
            transaction_hash: result.hash,
            investment_date: new Date().toISOString()
          })
          console.log('Investment recorded in database')
        } catch (dbError) {
          console.error('Error saving to database:', dbError)
        }

        alert(`Investment successful! Transaction hash: ${result.hash}`)
        await loadLoanDetails()

      } else {
        // Analizar el error específico
        console.error('Investment failed:', result.error)

        let errorMessage = 'Investment failed: '
        if (result.error?.includes('not active')) {
          errorMessage += 'This loan is not accepting investments.'
        } else if (result.error?.includes('Cannot invest')) {
          errorMessage += 'You cannot invest in your own loan.'
        } else if (result.error?.includes('Not registered')) {
          errorMessage += 'You need to register first.'
        } else {
          errorMessage += result.error || 'Unknown error'
        }

        alert(errorMessage)
      }
    } catch (error) {
      console.error('Investment error:', error)
      alert('Investment failed: ' + (error.message || 'Unknown error'))
    } finally {
      setProcessing(false)
    }
  }

  const calculateProgress = () => {
    if (!loan) return 0

    if (isOwner) {
      // Para el dueño: progreso de repago
      const totalDue = loan.approved_amount + (loan.approved_amount * loan.interest_rate / 100)
      const paid = loan.total_repaid || 0
      return Math.min(100, Math.round((paid / totalDue) * 100))
    } else {
      // Para inversores: progreso de financiamiento
      const funded = loan.approved_amount || 0
      const requested = loan.requested_amount || 1
      // Permitir más del 100% en modo testing
      return Math.round((funded / requested) * 100)
    }
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

  const getRiskIndicator = (creditScore) => {
    const score = creditScore || 0
    if (score >= 85) return { label: 'Low Risk', color: '#00c896' }
    if (score >= 75) return { label: 'Medium-Low', color: '#4a90e2' }
    if (score >= 65) return { label: 'Medium', color: '#f5a623' }
    if (score >= 55) return { label: 'Medium-High', color: '#ff7043' }
    return { label: 'High Risk', color: '#ff4444' }
  }

  // Loading state
  if (loading) {
    return (
      <div className="loan-detail">
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
      <div className="loan-detail">
        <div className="error-screen">
          <h2>Loan not found</h2>
          <p>Unable to load loan details for ID: {id}</p>
          <button onClick={() => navigate('/loans')} className="back-btn-large">
            Back to Marketplace
          </button>
        </div>
      </div>
    )
  }

  const totalDue = loan.approved_amount + (loan.approved_amount * loan.interest_rate / 100)
  const remaining = totalDue - (loan.total_repaid || 0)
  const fundingRemaining = Math.max(0, (loan.requested_amount || 0) - (loan.approved_amount || 0))
  const progress = calculateProgress()
  const riskInfo = getRiskIndicator(loan.credit_score)

  return (
    <div className="loan-detail">
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate(isOwner ? '/loans-personal' : '/loans')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
        <h1>{isOwner ? 'My Loan Details' : 'Investment Opportunity'}</h1>
        <div className="status-indicator" data-status={loan.status}>
          {loan.status}
        </div>
      </div>

      <div className="loan-summary-card">
        <div className="summary-header">
          <div className="loan-type">
            <span className="type-icon">
              {loan.loan_purpose === 'education' ? '🎓' :
                loan.loan_purpose === 'business' ? '💼' :
                  loan.loan_purpose === 'home' ? '🏠' : '💰'}
            </span>
            <div>
              <h2>{loan.loan_description || `${loan.loan_purpose} Loan`}</h2>
              <p>{loan.loan_purpose}</p>
            </div>
          </div>
          <div className="credit-score">
            <span className="score-label">Credit Score</span>
            <span className="score-value">{loan.credit_score || 'N/A'}</span>
            <div className="risk-indicator" style={{ color: riskInfo.color }}>
              {riskInfo.label}
            </div>
          </div>
        </div>

        <div className="amount-section">
          <div className="amount-item">
            <span className="label">{isOwner ? 'Loan Amount' : 'Requested Amount'}</span>
            <span className="value">${(loan.requested_amount || 0).toLocaleString()}</span>
          </div>
          <div className="amount-item">
            <span className="label">Interest Rate</span>
            <span className="value">{loan.interest_rate || 0}% APR</span>
          </div>
          <div className="amount-item">
            <span className="label">Term</span>
            <span className="value">{loan.loan_term_months || 0} months</span>
          </div>
        </div>
      </div>

      {/* SECCIÓN PARA EL DUEÑO DEL PRÉSTAMO */}
      {isOwner && (loan.status === 'active' || loan.status === 'funded') && (
        <>
          <div className="repayment-progress">
            <h3>Repayment Progress</h3>
            <div className="progress-stats">
              <div className="stat">
                <span className="label">Total Due</span>
                <span className="value">${totalDue.toLocaleString()}</span>
              </div>
              <div className="stat">
                <span className="label">Paid</span>
                <span className="value">${(loan.total_repaid || 0).toLocaleString()}</span>
              </div>
              <div className="stat">
                <span className="label">Remaining</span>
                <span className="value">${remaining.toLocaleString()}</span>
              </div>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>
              <span className="progress-text">{progress}% Complete</span>
            </div>
          </div>

          <div className="payment-section">
            <h3>Make a Payment</h3>
            <div className="payment-info">
              <div className="info-row">
                <span>Monthly Payment</span>
                <span>${(loan.monthly_payment || 0).toLocaleString()}</span>
              </div>
              <div className="info-row">
                <span>Next Payment Due</span>
                <span>{calculateNextPaymentDate()}</span>
              </div>
            </div>

            <div className="payment-form">
              <label>Payment Amount</label>
              <div className="input-group">
                <span className="currency">$</span>
                <input
                  type="number"
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="0"
                />
              </div>
              <div className="quick-amounts">
                <button onClick={() => setRepayAmount(loan.monthly_payment?.toString() || '100')}>
                  Monthly ({loan.monthly_payment || 100})
                </button>
                <button onClick={() => setRepayAmount(((loan.monthly_payment || 100) * 2).toString())}>
                  2x Monthly
                </button>
                <button onClick={() => setRepayAmount(remaining.toString())}>
                  Pay in Full
                </button>
              </div>
              <button
                className="pay-btn"
                onClick={handleRepayment}
                disabled={processing || !repayAmount || parseFloat(repayAmount) <= 0 || isConfirming}
              >
                {isConfirming ? 'Confirming...' :
                  processing ? 'Processing...' :
                    `Pay $${parseFloat(repayAmount || 0).toLocaleString()}`}
              </button>
            </div>
          </div>
        </>
      )}

      {/* SECCIÓN PARA INVERSORES - SIEMPRE MOSTRAR */}
      {!isOwner && (
        <>
          <div className="investment-opportunity">
            <h3>Investment Opportunity</h3>

            <div className="opportunity-metrics">
              <div className="metric-card">
                <span className="metric-label">Expected Return</span>
                <span className="metric-value">{loan.interest_rate || 0}%</span>
                <span className="metric-detail">Annual Percentage Rate</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Duration</span>
                <span className="metric-value">{loan.loan_term_months || 0} months</span>
                <span className="metric-detail">Investment Period</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Credit Rating</span>
                <span className="metric-value" style={{ color: riskInfo.color }}>
                  {loan.category || riskInfo.label}
                </span>
                <span className="metric-detail">Risk Assessment</span>
              </div>
            </div>

            <div className="funding-progress">
              <h4>Funding Progress</h4>
              <div className="progress-stats">
                <div className="stat">
                  <span className="label">Requested</span>
                  <span className="value">${(loan.requested_amount || 0).toLocaleString()}</span>
                </div>
                <div className="stat">
                  <span className="label">Funded</span>
                  <span className="value">${(loan.approved_amount || 0).toLocaleString()}</span>
                </div>
                <div className="stat">
                  <span className="label">
                    {fundingRemaining > 0 ? 'Remaining' : 'Over-funded'}
                  </span>
                  <span className="value">
                    ${fundingRemaining > 0 ? fundingRemaining.toLocaleString() :
                      ((loan.approved_amount || 0) - (loan.requested_amount || 0)).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar">
                  <div
                    className="progress-fill funding-fill"
                    style={{
                      width: `${Math.min(100, progress)}%`,
                      backgroundColor: progress > 100 ? '#27ae60' : undefined
                    }}
                  />
                </div>
                <span className="progress-text">
                  {progress}% Funded {progress > 100 && '(Over-funded)'}
                </span>
              </div>
            </div>

            <div className="investment-form">
              <h4>Invest in this Loan (Testing Mode)</h4>
              <div className="investment-info">
                <div className="info-row">
                  <span>Min Investment (Testing)</span>
                  <span>$1</span>
                </div>
                <div className="info-row">
                  <span>Max Investment</span>
                  <span>No Limit (Testing)</span>
                </div>
                <div className="info-row">
                  <span>Expected Monthly Return</span>
                  <span>${((parseFloat(investAmount || 0) * (loan.interest_rate || 0) / 100) / 12).toFixed(2)}</span>
                </div>
              </div>

              <label>Investment Amount</label>
              <div className="input-group">
                <span className="currency">$</span>
                <input
                  type="number"
                  value={investAmount}
                  onChange={(e) => setInvestAmount(e.target.value)}
                  placeholder="Enter any amount (testing)"
                  min="1"
                />
              </div>

              <div className="quick-amounts">
                <button onClick={() => setInvestAmount('100')}>$100</button>
                <button onClick={() => setInvestAmount('500')}>$500</button>
                <button onClick={() => setInvestAmount('1000')}>$1,000</button>
                <button onClick={() => setInvestAmount('5000')}>$5,000</button>
              </div>

              <button
                className="invest-btn"
                onClick={handleInvestment}
                disabled={
                  processing ||
                  !investAmount ||
                  parseFloat(investAmount) <= 0 ||
                  isConfirming ||
                  !address
                }
                style={{
                  backgroundColor: progress > 100 ? '#27ae60' : undefined
                }}
              >
                {!address ? 'Connect Wallet to Invest' :
                  isConfirming ? 'Confirming Transaction...' :
                    processing ? 'Processing...' :
                      `Invest $${parseFloat(investAmount || 0).toLocaleString()} (Testing)`}
              </button>

              <div className="investment-disclaimer">
                <p>⚠️ Testing Mode Active</p>
                <p>Any investment amount is allowed for testing purposes.
                  In production, minimum would be $100.</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* DETALLES GENERALES */}
      <div className="loan-details-grid">
        <div className="detail-card">
          <h3>Loan Information</h3>
          <div className="detail-row">
            <span>Loan ID</span>
            <span className="mono">{loan.id?.slice(0, 8)}...</span>
          </div>
          <div className="detail-row">
            <span>Contract Request ID</span>
            <span className="mono">{loan.contract_request_id || 'Not set'}</span>
          </div>
          {loan.transaction_hash && (
            <div className="detail-row">
              <span>Transaction Hash</span>
              <a
                href={`https://explorer.testnet.monad.xyz/tx/${loan.transaction_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="link"
              >
                View on Explorer →
              </a>
            </div>
          )}
        </div>

        <div className="detail-card">
          <h3>Important Dates</h3>
          <div className="detail-row">
            <span>Created</span>
            <span>{new Date(loan.created_at).toLocaleDateString()}</span>
          </div>
          <div className="detail-row">
            <span>Start Date</span>
            <span>{new Date(loan.start_date).toLocaleDateString()}</span>
          </div>
          <div className="detail-row">
            <span>End Date</span>
            <span>{new Date(loan.end_date).toLocaleDateString()}</span>
          </div>
        </div>

        {!isOwner && (
          <div className="detail-card">
            <h3>Borrower Information</h3>
            <div className="detail-row">
              <span>Credit Score</span>
              <span>{loan.credit_score || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span>Risk Category</span>
              <span>{loan.category || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span>Purpose</span>
              <span>{loan.loan_purpose || 'N/A'}</span>
            </div>
          </div>
        )}
      </div>

   

      {/* Estado de transacción */}
      {txHash && (
        <div className="transaction-status">
          <p>Transaction Hash: {txHash.slice(0, 10)}...</p>
          <p>Status: {isConfirming ? 'Confirming...' : isConfirmed ? 'Confirmed ✓' : 'Pending...'}</p>
        </div>
      )}
    </div>
  )
}

export default LoanDetail