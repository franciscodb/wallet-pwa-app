import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import CreditScoringService from '../services/creditScoring'
import './Loans.css'

function Loans() {
  const navigate = useNavigate()
  const { address } = useAccount()
  const [loans, setLoans] = useState([])
  const [filter, setFilter] = useState('all')
  const [riskFilter, setRiskFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLoans()
  }, [address])

  const loadLoans = async () => {
    if (!address) return
    
    setLoading(true)
    try {
      const userLoans = await CreditScoringService.getUserLoanHistory(address)
      setLoans(userLoans)
    } catch (error) {
      console.error('Error loading loans:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredLoans = loans.filter(loan => {
    if (filter === 'active' && loan.status !== 'active') return false
    if (filter === 'completed' && loan.status !== 'completed') return false
    
    if (riskFilter !== 'all') {
      const score = loan.credit_score || 0
      if (riskFilter === 'low' && score < 75) return false
      if (riskFilter === 'medium' && (score < 55 || score >= 75)) return false
      if (riskFilter === 'high' && score >= 55) return false
    }
    
    return true
  })

  const getRiskLevel = (score) => {
    if (score >= 75) return { level: 'LOW', color: '#27AE60' }
    if (score >= 55) return { level: 'MEDIUM', color: '#F2994A' }
    return { level: 'HIGH', color: '#EB5757' }
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return '#2D9CDB'
      case 'completed': return '#27AE60'
      case 'pending': return '#F2994A'
      case 'defaulted': return '#EB5757'
      default: return '#828282'
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="loans-page">
      <div className="screen-header">
        <button className="back-btn" onClick={() => navigate('/home')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1>Loans</h1>
        <button className="filter-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 4H21V6.172C21 6.702 20.79 7.21 20.414 7.586L14.414 13.586C14.038 13.962 13.828 14.47 13.828 15V19.5L10.171 21V15C10.171 14.47 9.961 13.962 9.585 13.586L3.585 7.586C3.209 7.21 3 6.702 3 6.172V4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <div className="filter-tabs">
        <button 
          className={filter === 'all' ? 'active' : ''} 
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button 
          className={filter === 'active' ? 'active' : ''} 
          onClick={() => setFilter('active')}
        >
          Active
        </button>
        <button 
          className={filter === 'completed' ? 'active' : ''} 
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
      </div>

      <div className="risk-filter">
        <select 
          value={riskFilter} 
          onChange={(e) => setRiskFilter(e.target.value)}
          className="risk-select"
        >
          <option value="all">All Risk Levels</option>
          <option value="low">Low Risk (75+)</option>
          <option value="medium">Medium Risk (55-74)</option>
          <option value="high">High Risk (&lt;55)</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-state">Loading loans...</div>
      ) : filteredLoans.length === 0 ? (
        <div className="empty-state">
          <p>No loans found</p>
          <button 
            className="primary-btn"
            onClick={() => navigate('/request-loan')}
          >
            Request New Loan
          </button>
        </div>
      ) : (
        <div className="loans-list">
          {filteredLoans.map(loan => {
            const risk = getRiskLevel(loan.credit_score || 0)
            const fundedPercentage = loan.approved_amount > 0 
              ? Math.min(100, Math.round((loan.approved_amount / loan.requested_amount) * 100))
              : 0

            return (
              <div 
                key={loan.id} 
                className="loan-card" 
                onClick={() => navigate(`/loan/${loan.id}`)}
              >
                <div className="loan-card-header">
                  <div className="loan-icon">
                    {loan.loan_purpose === 'education' ? '🎓' :
                     loan.loan_purpose === 'business' ? '💼' :
                     loan.loan_purpose === 'home' ? '🏠' : '💰'}
                  </div>
                  <div className="loan-info">
                    <span className="loan-category">{loan.loan_purpose?.toUpperCase()}</span>
                    <h3>{loan.loan_description || `${loan.loan_purpose} Loan`}</h3>
                    <span className="loan-date">Created {formatDate(loan.created_at)}</span>
                  </div>
                  <span 
                    className="status-badge"
                    style={{ color: getStatusColor(loan.status) }}
                  >
                    {loan.status?.toUpperCase()}
                  </span>
                </div>
                
                <div className="loan-details">
                  <div className="detail-item">
                    <span className="detail-label">Amount</span>
                    <span className="detail-value">${loan.approved_amount?.toLocaleString()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">APR</span>
                    <span className="detail-value">{loan.interest_rate}%</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Term</span>
                    <span className="detail-value">{loan.loan_term_months} months</span>
                  </div>
                </div>

                <div className="loan-footer">
                  <div className="risk-badge" style={{backgroundColor: risk.color}}>
                    {risk.level} Risk
                  </div>
                  {loan.status === 'active' && (
                    <div className="next-payment">
                      Next payment: ${loan.monthly_payment?.toLocaleString()}/mo
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Loans