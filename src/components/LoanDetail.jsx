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
  const { repayLoan } = useP2PLending()
  
  const [loan, setLoan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [repayAmount, setRepayAmount] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadLoanDetails()
  }, [id])

  const loadLoanDetails = async () => {
    try {
      const loanData = await CreditScoringService.getLoanById(id)
      setLoan(loanData)
      
      // Set default repay amount to monthly payment
      if (loanData.monthly_payment) {
        setRepayAmount(loanData.monthly_payment.toString())
      }
    } catch (error) {
      console.error('Error loading loan:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRepayment = async () => {
    if (!loan || !repayAmount) return
    
    setProcessing(true)
    try {
      const result = await repayLoan(loan.contract_address, repayAmount)
      if (result.success) {
        alert('Payment successful!')
        loadLoanDetails() // Reload to update status
      }
    } catch (error) {
      alert('Payment failed: ' + error.message)
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

  if (loading) {
    return <div className="loading-screen">Loading loan details...</div>
  }

  if (!loan) {
    return <div className="error-screen">Loan not found</div>
  }

  const totalDue = loan.approved_amount + (loan.approved_amount * loan.interest_rate / 100)
  const remaining = totalDue - (loan.total_repaid || 0)
  const progress = calculateProgress()

  return (
    <div className="loan-detail">
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate('/loans')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>
        <h1>Loan Details</h1>
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
          </div>
        </div>

        <div className="amount-section">
          <div className="amount-item">
            <span className="label">Loan Amount</span>
            <span className="value">${loan.approved_amount?.toLocaleString()}</span>
          </div>
          <div className="amount-item">
            <span className="label">Interest Rate</span>
            <span className="value">{loan.interest_rate}% APR</span>
          </div>
          <div className="amount-item">
            <span className="label">Term</span>
            <span className="value">{loan.loan_term_months} months</span>
          </div>
        </div>
      </div>

      {loan.status === 'active' && (
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
                  style={{ width: `${progress}%` }}
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
                <span>${loan.monthly_payment?.toLocaleString()}</span>
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
                  max={remaining}
                />
              </div>
              <div className="quick-amounts">
                <button onClick={() => setRepayAmount(loan.monthly_payment?.toString())}>
                  Monthly ({loan.monthly_payment})
                </button>
                <button onClick={() => setRepayAmount((loan.monthly_payment * 2).toString())}>
                  2x Monthly
                </button>
                <button onClick={() => setRepayAmount(remaining.toString())}>
                  Pay in Full
                </button>
              </div>
              <button 
                className="pay-btn"
                onClick={handleRepayment}
                disabled={processing || !repayAmount || parseFloat(repayAmount) <= 0}
              >
                {processing ? 'Processing...' : `Pay $${parseFloat(repayAmount || 0).toLocaleString()}`}
              </button>
            </div>
          </div>
        </>
      )}

      <div className="loan-details-grid">
        <div className="detail-card">
          <h3>Loan Information</h3>
          <div className="detail-row">
            <span>Loan ID</span>
            <span className="mono">{loan.id.slice(0, 8)}...</span>
          </div>
          <div className="detail-row">
            <span>Contract Address</span>
            <span className="mono">{loan.contract_address?.slice(0, 10)}...</span>
          </div>
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
      </div>
    </div>
  )
}

export default LoanDetail