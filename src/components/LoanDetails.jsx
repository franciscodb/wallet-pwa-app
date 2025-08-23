import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

function LoanDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { myLoans } = useApp()
  
  // Para demo, usamos el primer préstamo
  const loan = myLoans[0]

  const payments = [
    { id: 7, date: 'July 15, 2024', amount: 450, status: 'paid' },
    { id: 8, date: 'August 15, 2024', amount: 450, status: 'upcoming' },
    { id: 9, date: 'September 15, 2024', amount: 450, status: 'future' },
    { id: 10, date: 'October 15, 2024', amount: 450, status: 'future' }
  ]

  return (
    <div className="loan-details">
      <div className="screen-header">
        <button className="back-btn" onClick={() => navigate('/loans')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1>Loan Details</h1>
        <div style={{width: 24}}></div>
      </div>

      <div className="details-content">
        <div className="progress-section">
          <h3>Repayment Progress</h3>
          <div className="progress-circle">
            <svg width="120" height="120">
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke="#E5E7EB"
                strokeWidth="10"
                fill="none"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke="#2D9CDB"
                strokeWidth="10"
                fill="none"
                strokeDasharray={`${loan.repaymentProgress * 3.14} 314`}
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div className="progress-text">
              <span className="progress-percent">{loan.repaymentProgress}%</span>
              <span className="progress-label">Complete</span>
            </div>
          </div>
          <p className="progress-info">6 of 10 payments made</p>
        </div>

        <div className="overview-section">
          <h3>Loan Overview</h3>
          <div className="overview-card">
            <div className="overview-item">
              <span className="overview-label">Loan Amount</span>
              <span className="overview-value">${loan.amount.toLocaleString()}</span>
            </div>
            <div className="overview-item">
              <span className="overview-label">Interest Rate</span>
              <span className="overview-value">{loan.interestRate}%</span>
            </div>
            <div className="overview-item">
              <span className="overview-label">Loan Term</span>
              <span className="overview-value">{loan.term} months</span>
            </div>
            <div className="overview-item">
              <span className="overview-label">Repayment Schedule</span>
              <span className="overview-value">Monthly</span>
            </div>
          </div>
        </div>

        <div className="timeline-section">
          <h3>Payment Timeline</h3>
          <div className="timeline">
            {payments.map((payment, index) => (
              <div key={payment.id} className={`timeline-item ${payment.status}`}>
                <div className="timeline-marker">
                  {payment.status === 'paid' ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17L4 12" stroke="#27AE60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <div className="marker-dot"></div>
                  )}
                </div>
                <div className="timeline-content">
                  <h4>Payment {payment.id}</h4>
                  <p>Due: {payment.date}</p>
                  <span className="payment-amount">${payment.amount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button className="make-payment-btn">
          Make Next Payment
        </button>
      </div>
    </div>
  )
}

export default LoanDetails