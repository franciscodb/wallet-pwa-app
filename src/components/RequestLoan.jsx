import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function RequestLoan() {
  const navigate = useNavigate()
  const [loanAmount, setLoanAmount] = useState(5000)
  const [loanTerm, setLoanTerm] = useState(3)
  const [risk, setRisk] = useState('moderate')

  const calculateMonthlyPayment = () => {
    const interestRate = risk === 'low' ? 0.06 : risk === 'moderate' ? 0.08 : 0.12
    const monthlyRate = interestRate / 12
    const months = loanTerm
    const payment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                   (Math.pow(1 + monthlyRate, months) - 1)
    return payment.toFixed(2)
  }

  const getRiskColor = () => {
    switch(risk) {
      case 'low': return '#27AE60'
      case 'moderate': return '#F2994A'
      case 'high': return '#EB5757'
      default: return '#2D9CDB'
    }
  }

  const handleConfirm = () => {
    // Aquí iría la lógica para crear el préstamo
    alert('Loan request submitted successfully! 🎉')
    navigate('/home')
  }

  return (
    <div className="request-loan">
      <div className="screen-header">
        <button className="back-btn" onClick={() => navigate('/home')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1>New Loan</h1>
        <div style={{width: 24}}></div>
      </div>

      <div className="loan-form">
        <div className="form-section">
          <h3>Loan Details</h3>
          
          <div className="form-group">
            <label>Loan Amount</label>
            <div className="amount-display">${loanAmount}</div>
            <input
              type="range"
              min="1000"
              max="20000"
              step="500"
              value={loanAmount}
              onChange={(e) => setLoanAmount(Number(e.target.value))}
              className="slider"
            />
            <div className="slider-labels">
              <span>$1,000</span>
              <span>$20,000</span>
            </div>
          </div>

          <div className="form-group">
            <label>Loan Term</label>
            <div className="amount-display">{loanTerm} months</div>
            <input
              type="range"
              min="1"
              max="12"
              step="1"
              value={loanTerm}
              onChange={(e) => setLoanTerm(Number(e.target.value))}
              className="slider"
            />
            <div className="slider-labels">
              <span>1 month</span>
              <span>12 months</span>
            </div>
          </div>

          <div className="form-group">
            <label>Risk Assessment</label>
            <div className="risk-indicator" style={{backgroundColor: getRiskColor()}}>
              <span>{risk.charAt(0).toUpperCase() + risk.slice(1)} Risk</span>
            </div>
            <div className="risk-info">
              <span>Interest Rate: {risk === 'low' ? '6%' : risk === 'moderate' ? '8%' : '12%'}</span>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Repayment Schedule</h3>
          <div className="repayment-card">
            <div className="repayment-item">
              <span>Monthly Repayment</span>
              <span className="repayment-amount">${calculateMonthlyPayment()}</span>
            </div>
            <div className="repayment-item">
              <span>Total Repayment</span>
              <span className="repayment-total">
                ${(parseFloat(calculateMonthlyPayment()) * loanTerm).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="loan-purpose">
          <label>Loan Purpose</label>
          <select className="purpose-select">
            <option>Education</option>
            <option>Business</option>
            <option>Home Improvement</option>
            <option>Medical</option>
            <option>Other</option>
          </select>
        </div>

        <button className="confirm-btn" onClick={handleConfirm}>
          Confirm Loan
        </button>
      </div>
    </div>
  )
}

export default RequestLoan