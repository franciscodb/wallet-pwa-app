import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import CreditScoringService from '../services/creditScoring'
import './LoanMarketplace.css'

function LoanMarketplace() {
  const navigate = useNavigate()
  const { address } = useAccount()
  const [loans, setLoans] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('🔄 useEffect triggered, address:', address)
    loadMarketplaceLoans()
  }, [address])

  const loadMarketplaceLoans = async () => {
    console.log('🚀 loadMarketplaceLoans called')
    setLoading(true)
    try {
      console.log('Loading marketplace loans, excluding address:', address)
      
      // TEMPORAL: Si no tienes el método en tu servicio, usa esto para testear
      // Comenta este bloque cuando tengas el método real en CreditScoringService
      const dummyLoans = [
        {
          id: '1',
          loan_purpose: 'education',
          loan_description: 'Tuition for Software Engineering Course',
          requested_amount: 5000,
          approved_amount: 2500,
          interest_rate: 8,
          loan_term_months: 12,
          status: 'active',
          credit_score: 78,
          wallet_address: '0x1234...5678'
        },
        {
          id: '2',
          loan_purpose: 'business',
          loan_description: 'Startup Capital for Tech Company',
          requested_amount: 10000,
          approved_amount: 3000,
          interest_rate: 12,
          loan_term_months: 24,
          status: 'pending',
          credit_score: 65,
          wallet_address: '0xabcd...efgh'
        },
        {
          id: '3',
          loan_purpose: 'home',
          loan_description: 'Home Renovation Loan',
          requested_amount: 7500,
          approved_amount: 0,
          interest_rate: 6,
          loan_term_months: 18,
          status: 'pending',
          credit_score: 82,
          wallet_address: '0x9876...5432'
        }
      ]
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 1000))
      setLoans(dummyLoans)
      
      // DESCOMENTAR ESTO cuando tengas el método en tu servicio:
      /*
      const allLoans = await CreditScoringService.getMarketplaceLoans(address)
      
      console.log('Marketplace loans received:', allLoans)
      
      if (Array.isArray(allLoans)) {
        const marketplaceLoans = allLoans.filter(loan => 
          loan.status === 'pending' || loan.status === 'active'
        )
        setLoans(marketplaceLoans)
      } else {
        console.warn('Service did not return an array:', allLoans)
        setLoans([])
      }
      */
      
    } catch (error) {
      console.error('Error loading marketplace loans:', error)
      setLoans([])
    } finally {
      setLoading(false)
    }
  }

  // Función para calcular el nivel de riesgo basado en credit_score
  const getRiskLevel = (creditScore) => {
    if (!creditScore) return 'medium'
    if (creditScore >= 75) return 'low'
    if (creditScore >= 55) return 'medium'
    return 'high'
  }

  // Filtrar préstamos según el filtro de riesgo
  const filteredLoans = filter === 'all' 
    ? loans 
    : loans.filter(loan => {
        const risk = getRiskLevel(loan.credit_score)
        return risk === filter
      })

  const getRiskColor = (risk) => {
    switch(risk) {
      case 'low': return '#27AE60'
      case 'medium': return '#F2994A'
      case 'high': return '#EB5757'
      default: return '#2D9CDB'
    }
  }

  // Función para obtener el emoji según el tipo de préstamo
  const getLoanIcon = (loanPurpose) => {
    switch(loanPurpose) {
      case 'education': return '🎓'
      case 'business': return '💼'
      case 'home': return '🏠'
      case 'personal': return '💰'
      case 'vehicle': return '🚗'
      case 'medical': return '🏥'
      default: return '💳'
    }
  }

  // Calcular porcentaje de financiamiento
  const calculateFundedPercentage = (loan) => {
    if (!loan.requested_amount || loan.requested_amount === 0) return 0
    if (!loan.approved_amount) return 0
    return Math.min(100, Math.round((loan.approved_amount / loan.requested_amount) * 100))
  }

  // Formatear la dirección del wallet para mostrar
  const formatAddress = (address) => {
    if (!address) return 'Anonymous'
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const handleInvest = async (e, loanId) => {
    e.stopPropagation()
    try {
      // Aquí puedes agregar la lógica para invertir
      console.log('Investing in loan:', loanId)
      // await CreditScoringService.investInLoan(loanId, amount)
      alert('Investment feature coming soon! 🚀')
    } catch (error) {
      console.error('Error investing:', error)
      alert('Error processing investment')
    }
  }

  if (loading) {
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
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading investment opportunities...</p>
        </div>
      </div>
    )
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
          <p>Check back later for new lending opportunities</p>
        </div>
      ) : (
        <div className="loans-list">
          {filteredLoans.map(loan => {
            const risk = getRiskLevel(loan.credit_score)
            const fundedPercentage = calculateFundedPercentage(loan)
            
            return (
              <div key={loan.id} className="loan-card" onClick={() => navigate(`/loan/${loan.id}`)}>
                <div className="loan-card-header">
                  <div className="loan-icon">{getLoanIcon(loan.loan_purpose)}</div>
                  <div className="loan-info">
                    <span className="loan-category">{loan.loan_purpose?.toUpperCase()}</span>
                    <h3>{loan.loan_description || `${loan.loan_purpose} Loan`}</h3>
                    <span className="loan-borrower">by {formatAddress(loan.wallet_address)}</span>
                  </div>
                </div>
                
                <div className="loan-details">
                  <div className="detail-item">
                    <span className="detail-label">Amount</span>
                    <span className="detail-value">${(loan.requested_amount || 0).toLocaleString()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">APR</span>
                    <span className="detail-value">{loan.interest_rate || 0}%</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Term</span>
                    <span className="detail-value">{loan.loan_term_months || 0} months</span>
                  </div>
                </div>

                <div className="loan-footer">
                  <div className="risk-badge" style={{backgroundColor: getRiskColor(risk)}}>
                    {risk.charAt(0).toUpperCase() + risk.slice(1)} Risk
                  </div>
                  <div className="funding-progress">
                    <div className="progress-info">
                      <span>{fundedPercentage}% funded</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{width: `${fundedPercentage}%`, backgroundColor: '#2D9CDB'}}
                      ></div>
                    </div>
                  </div>
                </div>

                <button 
                  className="invest-btn" 
                  onClick={(e) => handleInvest(e, loan.id)}
                >
                  Invest Now
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default LoanMarketplace