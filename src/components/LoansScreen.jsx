import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function LoansScreen() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const [riskFilter, setRiskFilter] = useState('all')

  const loans = [
    {
      id: 1,
      type: 'education',
      title: 'Tuition for Software Engineering Course',
      amount: 5000,
      apr: 8,
      term: 12,
      image: '👨‍🎓',
      status: 'active'
    },
    {
      id: 2,
      type: 'business',
      title: 'Startup Capital for a Tech Company',
      amount: 10000,
      apr: 12,
      term: 24,
      image: '🏢',
      status: 'active'
    },
    {
      id: 3,
      type: 'home',
      title: 'Renovation Loan for Kitchen Upgrade',
      amount: 7500,
      apr: 6,
      term: 18,
      image: '🏠',
      status: 'completed'
    },
    {
      id: 4,
      type: 'education',
      title: 'Funding for a Master\'s Degree in Data Science',
      amount: 12000,
      apr: 8,
      term: 36,
      image: '🎓',
      status: 'active'
    },
    {
      id: 5,
      type: 'business',
      title: 'Expansion Loan for a Retail Store',
      amount: 15000,
      apr: 10,
      term: 48,
      image: '🏪',
      status: 'active'
    }
  ]

  const filteredLoans = loans.filter(loan => {
    if (filter === 'all') return true
    return loan.status === filter
  })

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
          <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
            <option value="all">All Risk Levels</option>
            <option value="low">Low Risk</option>
            <option value="high">High Risk</option>
          </select>
        </div>
      </div>

      <div className="loans-grid">
        {filteredLoans.map(loan => (
          <div 
            key={loan.id} 
            className="loan-item"
            onClick={() => navigate(`/loan/${loan.id}`)}
          >
            <div className="loan-item-header">
              <div className="loan-icon-container">
                <span className="loan-emoji">{loan.image}</span>
              </div>
              <div className="loan-meta">
                <span className="loan-type">{loan.type}</span>
                <h3 className="loan-title">{loan.title}</h3>
                <div className="loan-stats">
                  <span>${loan.amount.toLocaleString()}</span>
                  <span className="apr">{loan.apr}% APR</span>
                  <span>for {loan.term} months</span>
                </div>
              </div>
            </div>
            {loan.status === 'active' && (
              <div className="status-badge active">Active</div>
            )}
            {loan.status === 'completed' && (
              <div className="status-badge completed">Completed</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default LoansScreen