import { useAppKit } from '@reown/appkit/react'
import { useAccount } from 'wagmi'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function LoginScreen() {
  const { open } = useAppKit()
  const { isConnected } = useAccount()
  const navigate = useNavigate()

  useEffect(() => {
    if (isConnected) {
      navigate('/welcome')
    }
  }, [isConnected, navigate])

  const handleConnect = async () => {
    await open()
  }

  return (
    <div className="login-screen">
      <div className="login-container">
        {/* Logo/Icono */}
        <div className="logo-container">
          <div className="logo">
            <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="45" stroke="#4A90E2" strokeWidth="3"/>
              <path d="M30 50 L45 65 L70 35" stroke="#4A90E2" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* Título y descripción */}
        <div className="login-header">
          <h1>Bienvenido</h1>
          <p>Conecta tu wallet para comenzar</p>
        </div>

        {/* Botón de conexión */}
        <button className="connect-button" onClick={handleConnect}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="wallet-icon">
            <path d="M21 18V19C21 20.1 20.1 21 19 21H5C3.89 21 3 20.1 3 19V5C3 3.9 3.89 3 5 3H19C20.1 3 21 3.9 21 5V6H12C10.89 6 10 6.9 10 8V16C10 17.1 10.89 18 12 18H21ZM12 16H22V8H12V16ZM16 13.5C15.17 13.5 14.5 12.83 14.5 12C14.5 11.17 15.17 10.5 16 10.5C16.83 10.5 17.5 11.17 17.5 12C17.5 12.83 16.83 13.5 16 13.5Z" 
              fill="white"/>
          </svg>
          Conectar Wallet
        </button>

        {/* Features */}
        <div className="features">
          <div className="feature">
            <div className="feature-icon">🔒</div>
            <div className="feature-text">
              <h3>Seguro</h3>
              <p>Conexión encriptada</p>
            </div>
          </div>
          <div className="feature">
            <div className="feature-icon">⚡</div>
            <div className="feature-text">
              <h3>Rápido</h3>
              <p>Acceso instantáneo</p>
            </div>
          </div>
          <div className="feature">
            <div className="feature-icon">🌐</div>
            <div className="feature-text">
              <h3>Multi-chain</h3>
              <p>Soporte múltiples redes</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <p>Compatible con MetaMask, WalletConnect y más</p>
        </div>
      </div>
    </div>
  )
}

export default LoginScreen