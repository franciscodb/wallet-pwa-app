import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { useP2PLending, useLoanRequestFlow } from '../hooks/useP2PLending'
import CreditScoringService from '../services/creditScoring'

import './RequestLoan.css'

function RequestLoan() {
    const navigate = useNavigate()
    const { address, isConnected } = useAccount()
    const { useUserProfile } = useP2PLending()
    // Actualizar la desestructuración del hook al inicio del componente
    const {
        currentStep,
        transactionHash,  // AÑADIR ESTA LÍNEA
        loanRequestId,    // AÑADIR ESTA LÍNEA TAMBIÉN
        submitLoanRequest,
        isConfirming,
        isConfirmed,
        setCurrentStep,
        resetFlow
    } = useLoanRequestFlow()

    // Estados del formulario
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Datos del préstamo
    const [loanData, setLoanData] = useState({
        loanAmount: 5000,
        loanTerm: 6, // meses
        purpose: 'education',
        description: '',

        // Datos personales
        fullName: '',
        email: '',
        monthlyIncome: 25000,
        occupation: 'Software Developer',
        employmentType: 'full_time',

        // Scores de evaluación crediticia (0-100)
        ocupacion: 70,
        antiguedadLaboral: 60,
        ingresosEstimados: 70,
        pagosServicios: 75,
        frecuenciaApertura: 65,
        cumplimientoKyc: 80,
        puntualidadPagos: 75, // Más importante
        ratiosFinancieros: 70, // Segundo más importante
        tipoColateral: 50,

        // Datos Web3 (se pueden obtener automáticamente)
        walletAge: 200,
        txHistory: 150,
        defiScore: 60
    })

    // Resultados del credit scoring
    const [creditAnalysis, setCreditAnalysis] = useState(null)

    // Obtener perfil del usuario
    const { profile, isRegistered } = useUserProfile(address)

    useEffect(() => {
        if (profile && isRegistered) {
            // Si ya tiene un credit score, usarlo como base
            const baseScore = parseInt( Math.min(100, Math.max(0, parseInt(profile.creditScore) / 8.5)))

            setLoanData(prev => ({
                ...prev,
                puntualidadPagos: baseScore
            }))
        }
    }, [profile, isRegistered])

    // Función para calcular el credit score
    const analyzeCreditworthiness = async () => {
        if (!isConnected) {
            setError('Please connect your wallet first')
            return
        }

        setLoading(true)
        setError('')

        try {
            const analysisData = {
                ...loanData,
                walletAddress: address,
                saveToDatabase: true
            }

            console.log('🔍 Analyzing creditworthiness...', analysisData)
            const result = await CreditScoringService.calculateCreditScore(analysisData)
            console.log('✅ Credit analysis result:', result)

            // Validar que los números sean válidos
            const invalidFields = []
            if (isNaN(result.interestRate) || result.interestRate <= 0) invalidFields.push('interestRate')
            if (isNaN(result.approvedAmount) || result.approvedAmount <= 0) invalidFields.push('approvedAmount')
            if (isNaN(result.monthlyPayment)) invalidFields.push('monthlyPayment')

            if (invalidFields.length > 0) {
                throw new Error(`Invalid calculated values: ${invalidFields.join(', ')}`)
            }

            setCreditAnalysis(result)
            setCurrentStep(2)

        } catch (err) {
            setError('Error analyzing creditworthiness: ' + err.message)
            console.error('Credit analysis error:', err)
        } finally {
            setLoading(false)
        }
    }

    // Función para crear la solicitud en el smart contract
    // Función para crear la solicitud en el smart contract
    const handleCreateLoanRequest = async () => {
        if (!creditAnalysis) return

        setError('')

        try {
            // Añadir wallet address a los datos
            const loanDataWithWallet = {
                ...loanData,
                walletAddress: address  // ← Añadir esta línea
            }

            const result = await submitLoanRequest(loanDataWithWallet, creditAnalysis)

            if (!result.success) {
                throw result.error
            }

            console.log('✅ Loan request created:', result.hash)

        } catch (err) {
            setError('Error creating loan request: ' + err.message)
            console.error('Contract error:', err)
        }
    }

    // Función para calcular pago mensual estimado
    const calculateMonthlyPayment = (amount, rate, term) => {
        if (!amount || !rate || !term) return 0
        const monthlyRate = rate / 12 / 100
        const payment = (amount * monthlyRate * Math.pow(1 + monthlyRate, term)) /
            (Math.pow(1 + monthlyRate, term) - 1)
        return payment
    }

    // Render del Step 1: Formulario
    const renderForm = () => (
        <div className="loan-form">
            <div className="form-header">
                <h2>Loan Application</h2>
                <p>Fill out your information to get pre-approved</p>
            </div>

            {/* Datos del préstamo */}
            <div className="form-section">
                <h3>Loan Details</h3>

                <div className="form-group">
                    <label>Requested Amount</label>
                    <div className="amount-display">${loanData.loanAmount.toLocaleString()}</div>
                    <input
                        type="range"
                        min="1000"
                        max="100000"
                        step="1000"
                        value={loanData.loanAmount}
                        onChange={(e) => setLoanData({ ...loanData, loanAmount: Number(e.target.value) })}
                        className="slider"
                    />
                    <div className="slider-labels">
                        <span>$1,000</span>
                        <span>$100,000</span>
                    </div>
                </div>

                <div className="form-group">
                    <label>Loan Term</label>
                    <div className="amount-display">{loanData.loanTerm} months</div>
                    <input
                        type="range"
                        min="1"
                        max="60"
                        step="1"
                        value={loanData.loanTerm}
                        onChange={(e) => setLoanData({ ...loanData, loanTerm: Number(e.target.value) })}
                        className="slider"
                    />
                    <div className="slider-labels">
                        <span>1 month</span>
                        <span>60 months</span>
                    </div>
                </div>

                <div className="form-group">
                    <label>Monthly Income</label>
                    <input
                        type="number"
                        placeholder="25000"
                        value={loanData.monthlyIncome}
                        onChange={(e) => setLoanData({ ...loanData, monthlyIncome: Number(e.target.value) })}
                        className="form-input"
                    />
                </div>

                <div className="form-group">
                    <label>Loan Purpose</label>
                    <select
                        value={loanData.purpose}
                        onChange={(e) => setLoanData({ ...loanData, purpose: e.target.value })}
                        className="form-select"
                    >
                        <option value="education">Education</option>
                        <option value="business">Business</option>
                        <option value="home_improvement">Home Improvement</option>
                        <option value="medical">Medical</option>
                        <option value="debt_consolidation">Debt Consolidation</option>
                        <option value="other">Other</option>
                    </select>
                </div>
            </div>

            {/* Información personal */}
            <div className="form-section">
                <h3>Personal Information</h3>

                <div className="form-group">
                    <label>Full Name</label>
                    <input
                        type="text"
                        placeholder="Your full name"
                        value={loanData.fullName}
                        onChange={(e) => setLoanData({ ...loanData, fullName: e.target.value })}
                        className="form-input"
                    />
                </div>

                <div className="form-group">
                    <label>Email</label>
                    <input
                        type="email"
                        placeholder="your@email.com"
                        value={loanData.email}
                        onChange={(e) => setLoanData({ ...loanData, email: e.target.value })}
                        className="form-input"
                    />
                </div>

                <div className="form-group">
                    <label>Occupation</label>
                    <input
                        type="text"
                        placeholder="Software Developer"
                        value={loanData.occupation}
                        onChange={(e) => setLoanData({ ...loanData, occupation: e.target.value })}
                        className="form-input"
                    />
                </div>
            </div>

            {/* Factores crediticios */}
            <div className="form-section">
                <h3>Credit Factors</h3>
                <p className="section-subtitle">Help us assess your creditworthiness (0-100 scale)</p>

                <div className="credit-factors-grid">
                    <div className="factor-item">
                        <label>Payment History: {loanData.puntualidadPagos}</label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={loanData.puntualidadPagos}
                            onChange={(e) => setLoanData({ ...loanData, puntualidadPagos: Number(e.target.value) })}
                            className="factor-slider"
                        />
                        <span className="factor-weight">Most Important (18%)</span>
                    </div>

                    <div className="factor-item">
                        <label>Financial Ratios: {loanData.ratiosFinancieros}</label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={loanData.ratiosFinancieros}
                            onChange={(e) => setLoanData({ ...loanData, ratiosFinancieros: Number(e.target.value) })}
                            className="factor-slider"
                        />
                        <span className="factor-weight">Very Important (22%)</span>
                    </div>

                    <div className="factor-item">
                        <label>Bill Payment History: {loanData.pagosServicios}</label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={loanData.pagosServicios}
                            onChange={(e) => setLoanData({ ...loanData, pagosServicios: Number(e.target.value) })}
                            className="factor-slider"
                        />
                        <span className="factor-weight">Important (13%)</span>
                    </div>

                    <div className="factor-item">
                        <label>KYC Compliance: {loanData.cumplimientoKyc}</label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={loanData.cumplimientoKyc}
                            onChange={(e) => setLoanData({ ...loanData, cumplimientoKyc: Number(e.target.value) })}
                            className="factor-slider"
                        />
                        <span className="factor-weight">Moderate (10%)</span>
                    </div>
                </div>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            <button
                className="primary-btn"
                onClick={analyzeCreditworthiness}
                disabled={loading || !isConnected}
            >
                {loading ? 'Analyzing...' : 'Analyze Creditworthiness'}
            </button>
        </div>
    )

    // Render del Step 2: Análisis de crédito
    const renderCreditAnalysis = () => (
        <div className="credit-analysis">
            <div className="analysis-header">
                <h2>Credit Analysis Results</h2>
                <div className="score-display">
                    <div className="score-circle" data-score={creditAnalysis.finalScore}>
                        <span className="score-number">{creditAnalysis.finalScore}</span>
                        <span className="score-label">Credit Score</span>
                    </div>
                </div>
            </div>

            <div className="analysis-details">
                <div className="detail-card">
                    <h3>Loan Decision</h3>
                    <div className="status-badge" data-status={creditAnalysis.status}>
                        {creditAnalysis.status}
                    </div>
                    <p className="category">{creditAnalysis.category}</p>
                </div>

                <div className="detail-card">
                    <h3>Approved Terms</h3>
                    <div className="terms-grid">
                        <div className="term-item">
                            <label>Approved Amount</label>
                            <span className="amount">${creditAnalysis.approvedAmount?.toLocaleString()}</span>
                        </div>
                        <div className="term-item">
                            <label>Interest Rate</label>
                            <span className="rate">{creditAnalysis.interestRate}% annual</span>
                        </div>
                        <div className="term-item">
                            <label>Monthly Payment</label>
                            <span className="payment">${creditAnalysis.monthlyPayment?.toLocaleString()}</span>
                        </div>
                        <div className="term-item">
                            <label>Total Interest</label>
                            <span className="interest">${creditAnalysis.totalInterest?.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="detail-card">
                    <h3>ROI for Investors</h3>
                    <div className="roi-info">
                        <span className="roi-percentage">{creditAnalysis.roiPercentage}%</span>
                        <span className="roi-profit">Estimated Profit: ${creditAnalysis.netProfit?.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Desglose de contribuciones */}
            <div className="contributions-section">
                <h3>Score Breakdown</h3>
                <div className="contributions-list">
                    {Object.entries(creditAnalysis.contributions || {}).map(([factor, data]) => (
                        <div key={factor} className="contribution-item">
                            <span className="factor-name">{factor.replace(/_/g, ' ')}</span>
                            <div className="contribution-bar">
                                <div
                                    className="contribution-fill"
                                    style={{ width: `${data.score}%` }}
                                ></div>
                            </div>
                            <span className="contribution-value">
                                {data.score}/100 → +{data.contribution} points
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="action-buttons">
                <button
                    className="secondary-btn"
                    onClick={() => setCurrentStep(1)}
                >
                    Modify Application
                </button>

                {creditAnalysis.finalScore >= 45 && (
                    <button
                        className="primary-btn"
                        onClick={() => setCurrentStep(3)}
                    >
                        Accept Terms
                    </button>
                )}
            </div>
        </div>
    )

    // Render del Step 3: Confirmación
    // En renderConfirmation() de RequestLoan.jsx
    // Render del Step 3: Confirmación
    const renderConfirmation = () => (
        <div className="confirmation">
            <h2>Confirm Loan Request</h2>

            {/* Si ya se envió la transacción */}
            {transactionHash ? (
                <div className="transaction-status">
                    <div className="status-pending">
                        <div className="spinner"></div>
                        <p>Processing your loan request...</p>
                        <p>Transaction submitted to blockchain</p>
                        <small>Hash: {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}</small>
                        <p className="info-text">Saving to database...</p>
                    </div>
                </div>
            ) : (
                <>
                    {creditAnalysis && (
                        <div className="confirmation-summary">
                            <div className="summary-item">
                                <label>Amount to be funded:</label>
                                <span>{(creditAnalysis.approvedAmount / 1000).toFixed(3)} MON</span>
                            </div>
                            <div className="summary-item">
                                <label>In USD equivalent:</label>
                                <span>${creditAnalysis.approvedAmount?.toLocaleString()}</span>
                            </div>
                            <div className="summary-item">
                                <label>Interest Rate:</label>
                                <span>{creditAnalysis.interestRate}% annual</span>
                            </div>
                            <div className="summary-item">
                                <label>Term:</label>
                                <span>{loanData.loanTerm} months</span>
                            </div>
                            <div className="summary-item">
                                <label>Monthly Payment:</label>
                                <span>${creditAnalysis.monthlyPayment?.toLocaleString()}</span>
                            </div>
                            <div className="summary-item">
                                <label>Total Repayment:</label>
                                <span>${((creditAnalysis.monthlyPayment || 0) * loanData.loanTerm).toLocaleString()}</span>
                            </div>
                        </div>
                    )}

                    <div className="terms-acceptance">
                        <p>By proceeding, you agree to:</p>
                        <ul>
                            <li>Repay the loan according to the terms specified</li>
                            <li>Allow your credit data to be stored on-chain</li>
                            <li>Pay platform fees (1%)</li>
                            <li>Have your loan request listed for investors</li>
                        </ul>
                    </div>

                    <div className="action-buttons">
                        <button
                            className="secondary-btn"
                            onClick={() => setCurrentStep(2)}
                        >
                            Back to Analysis
                        </button>

                        <button
                            className="primary-btn"
                            onClick={handleCreateLoanRequest}
                            disabled={isConfirming || !creditAnalysis}
                        >
                            Create Loan Request
                        </button>
                    </div>
                </>
            )}

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}
        </div>
    )

    // Render del Step 4: Transacción completada
    const renderSuccess = () => (
        <div className="success-screen">
            <div className="success-icon">✅</div>
            <h2>Loan Request Created Successfully!</h2>
            <p>Your loan request has been submitted to the blockchain and is now available for investors.</p>

            <div className="success-details">
                <p>Credit Score: <strong>{creditAnalysis.finalScore}/100</strong></p>
                <p>Approved Amount: <strong>${creditAnalysis.approvedAmount?.toLocaleString()}</strong></p>
                <p>Interest Rate: <strong>{creditAnalysis.interestRate}%</strong></p>
            </div>

            <div className="action-buttons">
                <button
                    className="primary-btn"
                    onClick={() => navigate('/home')}
                >
                    View Dashboard
                </button>
                <button
                    className="secondary-btn"
                    onClick={() => navigate('/investments')}
                >
                    Browse Investments
                </button>
            </div>
        </div>
    )

    return (
        <div className="request-loan">
            <div className="screen-header">
                <button className="back-btn" onClick={() => navigate('/home')}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <h1>Request Loan</h1>
                <div className="step-indicator">
                    <span className={currentStep >= 1 ? 'active' : ''}>1</span>
                    <span className={currentStep >= 2 ? 'active' : ''}>2</span>
                    <span className={currentStep >= 3 ? 'active' : ''}>3</span>
                    <span className={currentStep >= 4 ? 'active' : ''}>4</span>
                </div>
            </div>

            <div className="request-loan-content">
                {currentStep === 1 && renderForm()}
                {currentStep === 2 && renderCreditAnalysis()}
                {currentStep === 3 && renderConfirmation()}
                {currentStep === 4 && renderSuccess()}
            </div>
        </div>
    )
}

export default RequestLoan