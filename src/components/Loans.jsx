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
    if (address) {
      loadLoans()
    } else {
      setLoading(false)
      setLoans([])
    }
  }, [address])

  const loadLoans = async () => {
    if (!address) {
      console.log('No wallet connected')
      setLoading(false)
      return
    }
    
    setLoading(true)
    try {
      console.log('Loading loans for address:', address)
      
      // LLAMADA REAL A TU SERVICIO
      const userLoans = await CreditScoringService.getUserLoanHistory(address)
      
      console.log('Loans received from service:', userLoans)
      
      // Asegurarse de que userLoans es un array
      if (Array.isArray(userLoans)) {
        setLoans(userLoans)
      } else {
        console.warn('Service did not return an array:', userLoans)
        setLoans([])
      }
      
    } catch (error) {
      console.error('Error loading loans:', error)
      setLoans([])
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

  const getLoanIcon = (loanPurpose) => {
    switch(loanPurpose) {
      case 'education': return '👨‍🎓'
      case 'business': return '🏢'
      case 'home': return '🏠'
      case 'personal': return '💰'
      case 'vehicle': return '🚗'
      case 'medical': return '🏥'
      default: return '💳'
    }
  }

  const getStatusBadge = (status) => {
    const statusStyles = {
      active: { backgroundColor: '#E8F4FD', color: '#2D9CDB' },
      completed: { backgroundColor: '#E6F6E6', color: '#27AE60' },
      pending: { backgroundColor: '#FFF5E6', color: '#F2994A' },
      defaulted: { backgroundColor: '#FFE6E6', color: '#EB5757' }
    }
    
    return statusStyles[status] || statusStyles.pending
  }

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="loans-screen">
      <div className="screen-header">
        <h1>Loans</h1>
        <button className="filter-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 4H21M3 4L10 12V19L14 21V12L21 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <div className="filter-section">
        <div className="filter-group">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button 
            className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
        </div>

        <div className="risk-filter">
          <select 
            value={riskFilter} 
            onChange={(e) => setRiskFilter(e.target.value)}
          >
            <option value="all">All Risk Levels</option>
            <option value="low">Low Risk (75+)</option>
            <option value="medium">Medium Risk (55-74)</option>
            <option value="high">High Risk (&lt;55)</option>
          </select>
        </div>
      </div>

      {!address ? (
        <div className="empty-state">
          <div className="empty-icon">🔌</div>
          <h3>Wallet Not Connected</h3>
          <p>Please connect your wallet to view your loans</p>
        </div>
      ) : loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your loans...</p>
        </div>
      ) : loans.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No loans found</h3>
          <p>Start your credit journey today</p>
          <button 
            className="request-loan-btn"
            onClick={() => navigate('/request-loan')}
          >
            Request New Loan
          </button>
        </div>
      ) : filteredLoans.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No loans match your filters</h3>
          <p>Try adjusting your filter settings</p>
        </div>
      ) : (
        <div className="loans-grid">
          {filteredLoans.map(loan => (
            <div 
              key={loan.id} 
              className="loan-item"
              onClick={() => navigate(`/loan/${loan.id}`)}
            >
              <div className="loan-item-header">
                <div className="loan-icon-container">
                  <span>{getLoanIcon(loan.loan_purpose)}</span>
                </div>
                <div className="loan-meta">
                  <span className="loan-type">{loan.loan_purpose?.toUpperCase()}</span>
                  <h3 className="loan-title">
                    {loan.loan_description || `${loan.loan_purpose} Loan`}
                  </h3>
                  <div className="loan-stats">
                    <span className="loan-amount">
                      {formatCurrency(loan.approved_amount || loan.requested_amount)}
                    </span>
                    <span className="apr">{loan.interest_rate || 0}% APR</span>
                    <span className="term">for {loan.loan_term_months || 0} months</span>
                  </div>
                </div>
              </div>
              <div 
                className="status-badge"
                style={getStatusBadge(loan.status)}
              >
                {loan.status?.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      )}

   
    </div>
  )
}

export default Loans