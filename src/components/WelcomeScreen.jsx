import { useAccount, useDisconnect, useBalance } from 'wagmi'
import { useAppKit } from '@reown/appkit/react'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { formatEther } from 'viem'

function WelcomeScreen() {
    const { address, chain } = useAccount()
    const { disconnect } = useDisconnect()
    const navigate = useNavigate()
    const { open } = useAppKit()
    const [copied, setCopied] = useState(false)

    const { data: balance } = useBalance({
        address: address,
    })

    const handleDisconnect = () => {
        disconnect()
        navigate('/')
    }

    const copyAddress = () => {
        if (address) {
            navigator.clipboard.writeText(address)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const shortenAddress = (addr) => {
        if (!addr) return ''
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`
    }

    return (
        <div className="welcome-screen">
            <div className="welcome-container">
                {/* Header con opciones */}
                <div className="welcome-header">
                    <button className="menu-button" onClick={() => open()}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                    <h2>Mi Wallet</h2>
                    <button className="logout-button" onClick={handleDisconnect}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9M16 17L21 12M21 12L16 7M21 12H9"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>

                {/* Success Icon */}
                <div className="success-icon">
                    <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                        <circle cx="50" cy="50" r="45" fill="#4ADE80" fillOpacity="0.1" />
                        <circle cx="50" cy="50" r="35" stroke="#4ADE80" strokeWidth="3" />
                        <path d="M30 50 L45 65 L70 35" stroke="#4ADE80" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>

                {/* Mensaje de éxito */}
                <div className="success-message">
                    <h1>¡Conexión Exitosa!</h1>
                    <p>Tu wallet está conectada correctamente</p>
                </div>

                {/* Información de la wallet */}
                <div className="wallet-info">
                    <div className="info-card">
                        <span className="info-label">Dirección</span>
                        <div className="address-container">
                            <span className="info-value">{shortenAddress(address)}</span>
                            <button className="copy-button" onClick={copyAddress}>
                                {copied ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <path d="M20 6L9 17L4 12" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
                                        <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5"
                                            stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="info-card">
                        <span className="info-label">Red</span>
                        <span className="info-value network">{chain?.name || 'Desconocida'}</span>
                    </div>

                    {balance && (
                        <div className="info-card">
                            <span className="info-label">Balance</span>
                            <span className="info-value balance">
                                {parseFloat(formatEther(balance.value)).toFixed(4)} MON
                            </span>
                        </div>
                    )}
                </div>

                {/* Acciones rápidas */}
                <div className="quick-actions">
                    <button className="action-button" onClick={() => open({ view: 'Account' })}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                            <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        Ver Cuenta
                    </button>

                    <button className="action-button" onClick={() => open({ view: 'Networks' })}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="2" />
                            <circle cx="6" cy="16" r="3" stroke="currentColor" strokeWidth="2" />
                            <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2" />
                            <path d="M12 11V13M6 13L8 11M16 11L18 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        Cambiar Red
                    </button>
                </div>

                {/* Footer informativo */}
                <div className="welcome-footer">
                    <div className="status-indicator">
                        <span className="status-dot"></span>
                        <span>Conectado de forma segura</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default WelcomeScreen