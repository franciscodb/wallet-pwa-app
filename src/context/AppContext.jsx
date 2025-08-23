import { createContext, useContext, useState, useEffect } from 'react'

const AppContext = createContext()

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState({
    name: 'Ethan Carter',
    email: 'ethan.carter@email.com',
    joinDate: 'January 2024',
    score: 72,
    activeLoans: 12,
    pastLoans: 3,
    balance: 1234.56,
    interestEarned: 234.56
  })

  const [loans, setLoans] = useState([
    {
      id: 1,
      category: 'Education',
      title: 'Tuition for Software Engineering Course',
      amount: 5000,
      interestRate: 8,
      term: 12,
      risk: 'low',
      borrower: 'Maria S.',
      funded: 78,
      description: 'Funding for professional development course',
      image: '👨‍🎓'
    },
    {
      id: 2,
      category: 'Business',
      title: 'Startup Capital for a Tech Company',
      amount: 10000,
      interestRate: 12,
      term: 24,
      risk: 'medium',
      borrower: 'Carlos M.',
      funded: 45,
      description: 'Initial capital for tech startup',
      image: '🏢'
    },
    {
      id: 3,
      category: 'Home',
      title: 'Renovation Loan for Kitchen Upgrade',
      amount: 7500,
      interestRate: 6,
      term: 18,
      risk: 'low',
      borrower: 'Ana L.',
      funded: 92,
      description: 'Home improvement project',
      image: '🏠'
    },
    {
      id: 4,
      category: 'Education',
      title: 'Funding for a Master\'s Degree in Data Science',
      amount: 12000,
      interestRate: 8,
      term: 36,
      risk: 'low',
      borrower: 'Luis R.',
      funded: 65,
      description: 'Advanced degree funding',
      image: '🎓'
    },
    {
      id: 5,
      category: 'Business',
      title: 'Expansion Loan for a Retail Store',
      amount: 15000,
      interestRate: 10,
      term: 48,
      risk: 'high',
      borrower: 'Sofia P.',
      funded: 30,
      description: 'Business expansion capital',
      image: '🏪'
    }
  ])

  const [myLoans, setMyLoans] = useState([
    {
      id: 1,
      amount: 5000,
      interestRate: 8.5,
      term: 12,
      status: 'active',
      repaymentProgress: 60,
      nextPayment: new Date('2024-08-15'),
      monthlyPayment: 450
    }
  ])

  const [investments, setInvestments] = useState([])

  const value = {
    user,
    setUser,
    loans,
    setLoans,
    myLoans,
    setMyLoans,
    investments,
    setInvestments
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}