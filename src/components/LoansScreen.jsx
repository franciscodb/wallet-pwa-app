import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import CreditScoringService from '../services/creditScoring'

function LoansScreen() {
  const navigate = useNavigate()
  const { address } = useAccount()
  const [loans, setLoans] = useState([])
  const [filter, setFilter] = useState('all')
  const [riskFilter, setRiskFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMarketplaceLoans()
  }, [address])

  const loadMarketplaceLoans = async () => {
    setLoading(true)
    try {
      console.log('Loading marketplace loans, current user:', address)
      
      // Obtener todos los préstamos del marketplace (excluyendo los del usuario actual)
      const marketplaceLoans = await CreditScoringService.getAvailableLoansToInvest(address)
      
      console.log('Marketplace loans received:', marketplaceLoans)
      
      if (Array.isArray(marketplaceLoans)) {
        // Filtrar solo préstamos activos o pendientes que necesitan inversión
        const activeLoans = marketplaceLoans.filter(loan => 
          loan.status === 'pending' || loan.status === 'active'
        )
        setLoans(activeLoans)
      } else {
        console.warn('Service did not return an array:', marketplaceLoans)
        setLoans([])
      }
      
    } catch (error) {
      console.error('Error loading marketplace loans:', error)
      setLoans([])
    } finally {
      setLoading(false)
    }
  }

  // Función para obtener el emoji según el tipo de préstamo
  const getLoanIcon = (loanPurpose) => {
    switch(loanPurpose) {
      case 'education': return '🎓'
      case 'business': return '🏢'
      case 'home': return '🏠'
      case 'personal': return '💰'
      case 'vehicle': return '🚗'
      case 'medical': return '🏥'
      case 'retail': return '🏪'
      default: return '💳'
    }
  }

  // Función para calcular el nivel de riesgo basado en credit_score
  const getRiskLevel = (creditScore) => {
    if (!creditScore) return 'medium'
    if (creditScore >= 75) return 'low'
    if (creditScore >= 55) return 'medium'
    return 'high'
  }

  // Aplicar filtros
  const filteredLoans = loans.filter(loan => {
    // Filtro por estado
    if (filter !== 'all' && loan.status !== filter) {
      return false
    }
    
    // Filtro por nivel de riesgo
    if (riskFilter !== 'all') {
      const loanRisk = getRiskLevel(loan.credit_score)
      if (riskFilter === 'low' && loanRisk !== 'low') return false
      if (riskFilter === 'high' && loanRisk !== 'high') return false
    }
    
    return true
  })

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="loans-screen">
        <div className="screen-header">
          <h1>Marketplace</h1>
          <button className="filter-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 4H21M3 4L10 12V19L14 21V12L21 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading investment opportunities...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="loans-screen">
      <div className="screen-header">
        <h1>Marketplace</h1>
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
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
        </div>

        <div className="risk-filter">
          <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
            <option value="all">All Risk Levels</option>
            <option value="low">Low Risk (75+ score)</option>
            <option value="high">High Risk (&lt;55 score)</option>
          </select>
        </div>
      </div>

      {!address ? (
        <div className="empty-state">
          <div className="empty-icon">🔌</div>
          <h3>Wallet Not Connected</h3>
          <p>Please connect your wallet to view investment opportunities</p>
        </div>
      ) : filteredLoans.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No investment opportunities found</h3>
          <p>Check back later or adjust your filters</p>
        </div>
      ) : (
        <div className="loans-grid">
          {filteredLoans.map(loan => {
            const loanRisk = getRiskLevel(loan.credit_score)
            const fundedPercentage = loan.requested_amount > 0 
              ? Math.min(100, Math.round((loan.approved_amount || 0) / loan.requested_amount * 100))
              : 0
            
            return (
              <div 
                key={loan.id} 
                className="loan-item"
                onClick={() => navigate(`/loan/${loan.id}`)}
              >
                <div className="loan-item-header">
                  <div className="loan-icon-container">
                    <span className="loan-emoji">{getLoanIcon(loan.loan_purpose)}</span>
                  </div>
                  <div className="loan-meta">
                    <span className="loan-type">{loan.loan_purpose}</span>
                    <h3 className="loan-title">
                      {loan.loan_description || `${loan.loan_purpose} Loan`}
                    </h3>
                    <div className="loan-stats">
                      <span>{formatCurrency(loan.requested_amount)}</span>
                      <span className="apr">{loan.interest_rate || 0}% APR</span>
                      <span>for {loan.loan_term_months || 0} months</span>
                    </div>
                    {/* Mostrar progreso de financiamiento */}
                    {fundedPercentage > 0 && (
                      <div className="funding-info">
                        <div className="progress-bar-mini">
                          <div 
                            className="progress-fill-mini" 
                            style={{
                              width: `${fundedPercentage}%`,
                              backgroundColor: '#2D9CDB',
                              height: '4px',
                              borderRadius: '2px',
                              transition: 'width 0.3s ease'
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {/* Badge de estado */}
                {loan.status === 'active' && (
                  <div className="status-badge active">Active</div>
                )}
                {loan.status === 'pending' && (
                  <div className="status-badge pending">Pending</div>
                )}
                {/* Badge de riesgo */}
                <div 
                  className={`risk-indicator risk-${loanRisk}`}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: '600',
                    backgroundColor: loanRisk === 'low' ? '#E6F6E6' : loanRisk === 'high' ? '#FFE6E6' : '#FFF5E6',
                    color: loanRisk === 'low' ? '#27AE60' : loanRisk === 'high' ? '#EB5757' : '#F2994A'
                  }}
                >
                  {loanRisk.toUpperCase()}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default LoansScreen