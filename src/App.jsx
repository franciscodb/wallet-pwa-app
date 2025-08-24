import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { useState, useEffect } from 'react'
import LoginScreen from './components/LoginScreen'
import WelcomeScreen from './components/WelcomeScreen'
import HomeDashboard from './components/HomeDashboard'
import RequestLoan from './components/RequestLoan'
import LoanMarketplace from './components/LoanMarketplace'
import LoanDetails from './components/LoanDetails'
import LoansScreen from './components/LoansScreen'
import ProfileScreen from './components/ProfileScreen'
import BottomNavigation from './components/BottomNavigation'
import { AppProvider } from './context/AppContext'

import LoanDetailInvest from './components/LoanDetailInvest'
import Loans from './components/Loans'

function App() {
  const { isConnected } = useAccount()
  const [showWelcome, setShowWelcome] = useState(true)

  // Registrar Service Worker para PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.log('SW registrado:', registration)
          },
          (err) => {
            console.log('SW falló:', err)
          }
        )
      })
    }
  }, [])

  // Ocultar welcome después de 3 segundos
  useEffect(() => {
    if (isConnected && showWelcome) {
      const timer = setTimeout(() => {
        setShowWelcome(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isConnected, showWelcome])

  return (
    <AppProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route
              path="/"
              element={!isConnected ? <LoginScreen /> : <Navigate to="/home" />}
            />
            
            <Route
              path="/welcome"
              element={isConnected && showWelcome ? <WelcomeScreen /> : <Navigate to="/home" />}
            />
            
            <Route
              path="/home"
              element={
                isConnected ? (
                  <>
                    <HomeDashboard />
                    <BottomNavigation />
                  </>
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            <Route
              path="/loans-personal"
              element={
                isConnected ? (
                  <>
                    <Loans />
                    <BottomNavigation />
                  </>
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            <Route
              path="/loaninvest/:id"
              element={
                isConnected ? (
                  <>
                    <LoanDetailInvest />
                    <BottomNavigation />
                  </>
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            <Route
              path="/request-loan"
              element={
                isConnected ? (
                  <>
                    <RequestLoan />
                    <BottomNavigation />
                  </>
                ) : (
                  <Navigate to="/" />
                )
              }
            />
            
            <Route
              path="/invest"
              element={
                isConnected ? (
                  <>
                    <LoanMarketplace />
                    <BottomNavigation />
                  </>
                ) : (
                  <Navigate to="/" />
                )
              }
            />
            
            <Route
              path="/loans"
              element={
                isConnected ? (
                  <>
                    <LoansScreen />
                    <BottomNavigation />
                  </>
                ) : (
                  <Navigate to="/" />
                )
              }
            />
            
            <Route
              path="/loan/:id"
              element={
                isConnected ? (
                  <>
                    <LoanDetails />
                    <BottomNavigation />
                  </>
                ) : (
                  <Navigate to="/" />
                )
              }
            />
            
            <Route
              path="/profile"
              element={
                isConnected ? (
                  <>
                    <ProfileScreen />
                    <BottomNavigation />
                  </>
                ) : (
                  <Navigate to="/" />
                )
              }
            />
            
            {/* Catch all - Ruta por defecto para URLs no encontradas */}
            <Route
              path="*"
              element={<Navigate to="/" replace />}
            />
          </Routes>
        </div>
      </Router>
    </AppProvider>
  )
}

export default App