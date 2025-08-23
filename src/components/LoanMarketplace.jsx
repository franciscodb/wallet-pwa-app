import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

function LoanMarketplace() {
  const navigate = useNavigate()
  const { loans } = useApp()
  const [filter, setFilter] = useState('all')

  const filteredLoans = filter === 'all' 
    ? loans 
    : loans.filter(loan => loan.risk === filter)

  const getRiskColor = (risk) => {
    switch(risk) {
      case 'low': return '#27AE60'
      case 'medium': return '#F2994A'
      case 'high': return '#EB5757'
      default: return '#2D9CDB'
    }
  }

  return (
    <div className="loan-marketplace">
      <div className="screen-header">
        <button className="back-btn" onClick={() => navigate('/home')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1>Invest</h1>
        <div style={{width: 24}}></div>
      </div>

      <div className="filter-tabs">
        <button 
          className={filter === 'all' ? 'active' : ''} 
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button 
          className={filter === 'low' ? 'active' : ''} 
          onClick={() => setFilter('low')}
        >
          Low Risk
        </button>
        <button 
          className={filter === 'medium' ? 'active' : ''} 
          onClick={() => setFilter('medium')}
        >
          Medium Risk
        </button>
        <button 
          className={filter === 'high' ? 'active' : ''} 
          onClick={() => setFilter('high')}
        >
          High Risk
        </button>
      </div>

      <div className="loans-list">
        {filteredLoans.map(loan => (
          <div key={loan.id} className="loan-card" onClick={() => navigate(`/loan/${loan.id}`)}>
            <div className="loan-card-header">
              <div className="loan-icon">{loan.image}</div>
              <div className="loan-info">
                <span className="loan-category">{loan.category}</span>
                <h3>{loan.title}</h3>
                <span className="loan-borrower">by {loan.borrower}</span>
              </div>
            </div>
            
            <div className="loan-details">
              <div className="detail-item">
                <span className="detail-label">Amount</span>
                <span className="detail-value">${loan.amount.toLocaleString()}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">APR</span>
                <span className="detail-value">{loan.interestRate}%</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Term</span>
                <span className="detail-value">{loan.term} months</span>
              </div>
            </div>

            <div className="loan-footer">
              <div className="risk-badge" style={{backgroundColor: getRiskColor(loan.risk)}}>
                {loan.risk.charAt(0).toUpperCase() + loan.risk.slice(1)} Risk
              </div>
              <div className="funding-progress">
                <div className="progress-info">
                  <span>{loan.funded}% funded</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{width: `${loan.funded}%`, backgroundColor: '#2D9CDB'}}
                  ></div>
                </div>
              </div>
            </div>

            <button className="invest-btn" onClick={(e) => {
              e.stopPropagation()
              alert(`Investment in ${loan.title} successful! 🎉`)
            }}>
              Invest Now
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default LoanMarketplace