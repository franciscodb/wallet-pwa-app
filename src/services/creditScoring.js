import { createClient } from '@supabase/supabase-js'

// Configuración de Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY


const supabase = createClient(supabaseUrl, supabaseAnonKey)

export class CreditScoringService {
    constructor() {
        // Configuración del sistema de scoring
        this.config = {
            TASA_MINIMA: 20.0,
            TASA_MAXIMA: 100.0,
            SCORE_OPTIMO: 90,
            SCORE_MINIMO: 45,

            // Pesos de las variables (suman 100%)
            weights: {
                ratios_financieros: 22,
                puntualidad_pagos: 18,
                pagos_servicios: 13,
                monto_vs_ingresos: 12,  // calculado dinámicamente
                cumplimiento_kyc: 10,
                plazo_solicitado: 8,    // calculado dinámicamente
                ingresos_estimados: 7,
                frecuencia_apertura: 4,
                antiguedad_laboral: 3,
                ocupacion: 2,
                tipo_colateral: 1
            }
        }
    }

    // =====================================================
    // MÉTODOS DE BASE DE DATOS
    // =====================================================

    // Obtener o crear usuario
    async getOrCreateUser(walletAddress, userData = {}) {
        try {
            // Primero intentar obtener el usuario existente
            const { data: existingUser, error: fetchError } = await supabase
                .from('users')
                .select('*')
                .eq('wallet_address', walletAddress)
                .single()

            if (existingUser && !fetchError) {
                return { user: existingUser, isNew: false }
            }

            // Si no existe, crear nuevo usuario
            const newUser = {
                wallet_address: walletAddress,
                full_name: userData.fullName || '',
                email: userData.email || '',
                monthly_income: userData.monthlyIncome || 0,
                occupation: userData.occupation || '',
                employment_type: userData.employmentType || 'unemployed',
                education_level: userData.educationLevel || 0,
                wallet_age_days: userData.walletAge || 0,
                total_transactions: userData.txHistory || 0,
                defi_score: userData.defiScore || 0,
                social_score: userData.socialScore || 0,
                app_usage_score: userData.appUsage || 0,
                professional_connections: userData.connections || 0,
                kyc_status: userData.kycStatus || 'pending',
                is_verified: userData.isVerified || false
            }

            const { data: createdUser, error: createError } = await supabase
                .from('users')
                .insert([newUser])
                .select()
                .single()

            if (createError) {
                throw new Error(`Error creating user: ${createError.message}`)
            }

            return { user: createdUser, isNew: true }
        } catch (error) {
            console.error('Error in getOrCreateUser:', error)
            throw error
        }
    }

    // Guardar evaluación de crédito
    async saveCreditEvaluation(userId, evaluationData) {
        try {
            const evaluationRecord = {
                user_id: userId,
                loan_amount: evaluationData.loanAmount,
                loan_term_months: evaluationData.loanTerm,
                monthly_income: evaluationData.monthlyIncome,

                // Scores individuales
                ocupacion_score: evaluationData.ocupacion || 0,
                antiguedad_laboral_score: evaluationData.antiguedadLaboral || 0,
                ingresos_estimados_score: evaluationData.ingresosEstimados || 0,
                pagos_servicios_score: evaluationData.pagosServicios || 0,
                frecuencia_apertura_score: evaluationData.frecuenciaApertura || 0,
                cumplimiento_kyc_score: evaluationData.cumplimientoKyc || 0,
                puntualidad_pagos_score: evaluationData.puntualidadPagos || 0,
                ratios_financieros_score: evaluationData.ratiosFinancieros || 0,
                tipo_colateral_score: evaluationData.tipoColateral || 0,

                // Scores calculados
                monto_vs_ingresos_score: evaluationData.montoVsIngresosScore || 0,
                plazo_score: evaluationData.plazoScore || 0,

                // Resultados
                final_score: evaluationData.finalScore,
                interest_rate: evaluationData.interestRate,
                category: evaluationData.category,
                status: evaluationData.status,

                // Métricas financieras
                approved_amount: evaluationData.approvedAmount,
                approved_ratio: evaluationData.approvedAmount / evaluationData.loanAmount,
                monthly_payment: evaluationData.monthlyPayment || 0,
                total_interest: evaluationData.totalInterest || 0,
                net_profit: evaluationData.netProfit || 0,
                roi_percentage: evaluationData.roiPercentage || 0,
                monthly_payment_ratio: evaluationData.monthlyPaymentRatio || 0,

                // Metadatos
                model_version: evaluationData.modelVersion || 'v2.0-hackathon',
                confidence: evaluationData.confidence || 0.85,
                source: evaluationData.source || 'advanced_algorithm',
                contributions: evaluationData.contributions || {}
            }

            const { data, error } = await supabase
                .from('credit_evaluations')
                .insert([evaluationRecord])
                .select()
                .single()

            if (error) {
                throw new Error(`Error saving credit evaluation: ${error.message}`)
            }

            return data
        } catch (error) {
            console.error('Error saving credit evaluation:', error)
            throw error
        }
    }

    // Obtener historial de evaluaciones de un usuario
    async getUserCreditHistory(walletAddress, limit = 10) {
        try {
            const { data, error } = await supabase
                .from('credit_evaluations')
                .select(`
          *,
          users!inner(wallet_address, full_name)
        `)
                .eq('users.wallet_address', walletAddress)
                .order('evaluation_date', { ascending: false })
                .limit(limit)

            if (error) {
                throw new Error(`Error fetching credit history: ${error.message}`)
            }

            return data || []
        } catch (error) {
            console.error('Error in getUserCreditHistory:', error)
            return []
        }
    }

    // Guardar simulación de escenarios
    async saveSimulation(userId, simulationData) {
        try {
            const simulationRecord = {
                user_id: userId,
                base_scenario: simulationData.baseScenario,
                base_score: simulationData.baseScore,
                variations: simulationData.variations,
                simulation_type: simulationData.type || 'improvement_analysis'
            }

            const { data, error } = await supabase
                .from('scoring_simulations')
                .insert([simulationRecord])
                .select()
                .single()

            if (error) {
                throw new Error(`Error saving simulation: ${error.message}`)
            }

            return data
        } catch (error) {
            console.error('Error saving simulation:', error)
            throw error
        }
    }

    // =====================================================
    // ALGORITMO DE CREDIT SCORING (IGUAL QUE ANTES)
    // =====================================================

    // Función principal de credit scoring adaptada de Python
    async calculateAdvancedCreditScore(loanData) {
        try {
            const {
                // Parámetros del préstamo
                loanAmount,
                loanTerm, // meses
                monthlyIncome,

                // Variables de evaluación (0-100)
                ocupacion = 0,
                antiguedadLaboral = 0,
                ingresosEstimados = 0,
                pagosServicios = 0,
                frecuenciaApertura = 0,
                cumplimientoKyc = 0,
                puntualidadPagos = 0,
                ratiosFinancieros = 0,
                tipoColateral = 0,

                // Datos adicionales del usuario
                walletAddress,
                saveToDatabase = true
            } = loanData

            // Calcular score dinámico monto vs ingresos
            let montoScore = 0
            if (monthlyIncome > 0) {
                const monthlyPaymentRatio = (loanAmount / loanTerm) / monthlyIncome
                if (monthlyPaymentRatio <= 0.15) montoScore = 95
                else if (monthlyPaymentRatio <= 0.25) montoScore = 85
                else if (monthlyPaymentRatio <= 0.35) montoScore = 70
                else if (monthlyPaymentRatio <= 0.45) montoScore = 50
                else if (monthlyPaymentRatio <= 0.60) montoScore = 25
                else montoScore = 5
            }

            // Calcular score dinámico del plazo
            let plazoScore = 0
            if (loanTerm <= 6) plazoScore = 85
            else if (loanTerm <= 12) plazoScore = 95
            else if (loanTerm <= 24) plazoScore = 90
            else if (loanTerm <= 36) plazoScore = 80
            else if (loanTerm <= 48) plazoScore = 65
            else if (loanTerm <= 60) plazoScore = 45
            else plazoScore = 25

            // Compilar todos los scores
            const scores = {
                ratios_financieros: ratiosFinancieros,
                puntualidad_pagos: puntualidadPagos,
                pagos_servicios: pagosServicios,
                monto_vs_ingresos: montoScore,
                cumplimiento_kyc: cumplimientoKyc,
                plazo_solicitado: plazoScore,
                ingresos_estimados: ingresosEstimados,
                frecuencia_apertura: frecuenciaApertura,
                antiguedad_laboral: antiguedadLaboral,
                ocupacion: ocupacion,
                tipo_colateral: tipoColateral
            }

            // Calcular score final ponderado
            let totalScore = 0
            const contributions = {}

            for (const [variable, score] of Object.entries(scores)) {
                const weight = this.config.weights[variable]
                const contribution = (score * weight) / 100
                totalScore += contribution
                contributions[variable] = {
                    score,
                    weight,
                    contribution: Math.round(contribution * 10) / 10
                }
            }

            const finalScore = Math.round(totalScore)

            // Calcular tasa de interés y categoría
            const riskAnalysis = this.calculateInterestRateAndCategory(finalScore)

            // Calcular métricas financieras
            const approvedAmount = Math.round(loanAmount * riskAnalysis.approvedRatio)
            const financialMetrics = this.calculateFinancialMetrics(
                approvedAmount,
                riskAnalysis.interestRate,
                loanTerm
            )

            // Preparar resultado completo
            const scoringResult = {
                // Score y decisión
                finalScore,
                category: riskAnalysis.category,
                status: riskAnalysis.status,
                interestRate: riskAnalysis.interestRate,

                // Datos originales
                loanAmount,
                loanTerm,
                monthlyIncome,

                // Métricas calculadas
                approvedAmount,
                monthlyPaymentRatio: monthlyIncome > 0 ? Math.round((loanAmount / loanTerm / monthlyIncome) * 100 * 10) / 10 : 0,
                montoVsIngresosScore: montoScore,
                plazoScore,

                // Métricas financieras
                ...financialMetrics,

                // Análisis detallado
                contributions,

                // Scores individuales
                ocupacion,
                antiguedadLaboral,
                ingresosEstimados,
                pagosServicios,
                frecuenciaApertura,
                cumplimientoKyc,
                puntualidadPagos,
                ratiosFinancieros,
                tipoColateral,

                // Metadatos
                timestamp: Date.now(),
                modelVersion: 'v2.0-hackathon',
                source: 'advanced_scoring_algorithm',
                confidence: finalScore >= this.config.SCORE_MINIMO ? 0.95 : 0.8
            }

            // Guardar en Supabase si se requiere y hay wallet address
            if (saveToDatabase && walletAddress) {
                try {
                    // Obtener o crear usuario
                    const { user } = await this.getOrCreateUser(walletAddress, loanData)

                    // Guardar evaluación
                    const savedEvaluation = await this.saveCreditEvaluation(user.id, {
                        ...loanData,
                        ...scoringResult
                    })

                    scoringResult.databaseId = savedEvaluation.id
                    scoringResult.userId = user.id

                } catch (dbError) {
                    console.warn('Error guardando en Supabase, continuando sin DB:', dbError.message)
                }
            }

            return scoringResult

        } catch (error) {
            console.error('Error en calculateAdvancedCreditScore:', error)
            // Fallback al método básico
            return this.basicCreditScore(loanData)
        }
    }

    // Calcular tasa de interés logarítmica y categoría de riesgo
    calculateInterestRateAndCategory(finalScore) {
        const { TASA_MINIMA, TASA_MAXIMA, SCORE_OPTIMO, SCORE_MINIMO } = this.config

        if (finalScore < SCORE_MINIMO) {
            return {
                interestRate: 0,
                approvedRatio: 0,
                category: "C - Rechazado",
                status: "NO APROBADO"
            }
        }

        if (finalScore >= SCORE_OPTIMO) {
            return {
                interestRate: TASA_MINIMA,
                approvedRatio: 1.0,
                category: "AAA - Premium",
                status: "APROBADO INMEDIATAMENTE"
            }
        }

        // CORREGIR: Asegurar que la tasa nunca sea menor a TASA_MINIMA
        const riesgoNormalizado = Math.max(0, Math.min(1, (SCORE_OPTIMO - finalScore) / (SCORE_OPTIMO - SCORE_MINIMO)))
        const factorLogaritmico = Math.log(1 + (riesgoNormalizado * Math.E)) / Math.log(1 + Math.E)
        let interestRate = TASA_MINIMA + (TASA_MAXIMA - TASA_MINIMA) * factorLogaritmico

        // VALIDACIÓN CRÍTICA: Asegurar valores mínimos válidos
        interestRate = Math.max(TASA_MINIMA, Math.round(interestRate * 100) / 100) // Redondear a 2 decimales

        // Determinar categoría y ratio de aprobación
        if (finalScore >= 85) {
            return {
                interestRate,
                approvedRatio: 1.0,
                category: "AAA - Premium",
                status: "APROBADO INMEDIATAMENTE"
            }
        } else if (finalScore >= 75) {
            return {
                interestRate,
                approvedRatio: 0.95,
                category: "AA - Excelente",
                status: "APROBADO"
            }
        } else if (finalScore >= 65) {
            return {
                interestRate,
                approvedRatio: 0.90,
                category: "A - Muy Bueno",
                status: "APROBADO CON VERIFICACIÓN"
            }
        } else if (finalScore >= 55) {
            return {
                interestRate,
                approvedRatio: 0.80,
                category: "BBB - Bueno",
                status: "APROBADO CON CONDICIONES"
            }
        } else {
            return {
                interestRate,
                approvedRatio: 0.65,
                category: "BB - Alto Riesgo",
                status: "REVISIÓN ESPECIALIZADA"
            }
        }
    }
    // Añadir este método en CreditScoringService
    async saveLoanRequestToSupabase(data) {
        try {
            console.log('📝 Saving loan request with data:', data)

            const {
                walletAddress,
                fullName,
                email,
                monthlyIncome,
                occupation,
                employmentType,

                loanAmount,
                approvedAmount,
                approvedAmountMon, // Monto en MON para el contrato
                loanTerm,
                interestRate,
                monthlyPayment,
                purpose,
                description,

                finalScore,
                category,
                status,

                transactionHash,
                contractRequestId, // ID del request en el contrato
                blockchain_network,
            } = data

            // 1. Obtener o crear usuario
            const { user, isNew } = await this.getOrCreateUser(walletAddress, {
                fullName,
                email,
                monthlyIncome,
                occupation,
                employmentType
            })

            console.log('👤 User:', user.id, isNew ? '(nuevo)' : '(existente)')

            // 2. Crear nueva evaluación crediticia
            const evaluation = await this.saveCreditEvaluation(user.id, data)
            console.log('📊 Credit evaluation saved:', evaluation.id)

            // 3. Crear loan request con los valores correctos
            const loanRequestRecord = {
                borrower_id: user.id,
                credit_evaluation_id: evaluation.id,
                requested_amount: loanAmount, // Monto original solicitado en USD
                approved_amount: approvedAmount, // Monto aprobado en USD
                loan_term_months: loanTerm,
                interest_rate: interestRate,
                monthly_payment: monthlyPayment || 0,
                loan_purpose: purpose || 'other',
                loan_description: description || '',
                status: 'active', // Para hackathon, marcar como activo inmediatamente
                approval_date: new Date().toISOString(),
                funding_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                contract_address: contractRequestId ? `request_${contractRequestId}` : null,
                blockchain_network: blockchain_network || 'monad_testnet',
                transaction_hash: transactionHash || null,
                start_date: new Date().toISOString(),
                end_date: new Date(Date.now() + (loanTerm * 30 * 24 * 60 * 60 * 1000)).toISOString(),

                // Campos adicionales que podrías querer guardar
                collateral_type: 'none',
                collateral_value: 0,
                wallet_address: walletAddress
            }

            console.log('💾 Saving loan request record:', loanRequestRecord)

            const { data: loanRequest, error } = await supabase
                .from('loan_requests')
                .insert([loanRequestRecord])
                .select()
                .single()

            if (error) {
                console.error('❌ Supabase error:', error)
                throw new Error(`Error saving loan request: ${error.message}`)
            }

            console.log('💰 Loan request saved successfully:', loanRequest.id)

            return {
                success: true,
                userId: user.id,
                evaluationId: evaluation.id,
                loanRequestId: loanRequest.id,
                isNewUser: isNew
            }

        } catch (error) {
            console.error('❌ Error in saveLoanRequestToSupabase:', error)
            throw error
        }
    }

    // Calcular métricas financieras
    calculateFinancialMetrics(approvedAmount, interestRate, loanTerm) {
        if (approvedAmount <= 0 || interestRate <= 0) {
            return {
                monthlyPayment: 0,
                totalInterest: 0,
                netProfit: 0,
                roiPercentage: 0
            }
        }

        const monthlyRate = interestRate / 12 / 100
        const monthlyPayment = Math.round((approvedAmount * monthlyRate *
            Math.pow(1 + monthlyRate, loanTerm)) /
            (Math.pow(1 + monthlyRate, loanTerm) - 1))

        const totalInterest = (monthlyPayment * loanTerm) - approvedAmount
        const netProfit = Math.round(totalInterest * 0.65) // 65% margen
        const roiPercentage = approvedAmount > 0 ? Math.round((totalInterest / approvedAmount) * 100 * 10) / 10 : 0

        return {
            monthlyPayment,
            totalInterest,
            netProfit,
            roiPercentage
        }
    }

    // Método principal que usa directamente el algoritmo avanzado (TU MODELO)
    async calculateCreditScore(userData) {
        // Usar directamente tu algoritmo de Python adaptado
        return this.calculateAdvancedCreditScore(userData)
    }

    // Categorizar riesgo basado en score
    getRiskCategory(score) {
        if (score >= 750) return 'excellent'
        if (score >= 700) return 'good'
        if (score >= 650) return 'fair'
        if (score >= 600) return 'poor'
        return 'very_poor'
    }

    // Cálculo básico de respaldo mejorado
    basicCreditScore(userData) {
        let score = 600 // Base score

        // Ajustes basados en datos disponibles
        if (userData.walletAge > 365) score += 50
        if (userData.txHistory > 100) score += 30
        if (userData.previousLoans > 0 && userData.repaymentRate === 100) score += 100
        if (userData.education >= 3) score += 40
        if (userData.employment === 'full_time') score += 50

        // Bonus por datos específicos del algoritmo avanzado
        if (userData.puntualidadPagos > 80) score += 60
        if (userData.ratiosFinancieros > 70) score += 40
        if (userData.cumplimientoKyc > 85) score += 30

        // Limitar entre 300 y 850
        score = Math.max(300, Math.min(850, score))

        // Usar la misma lógica de categorización que el algoritmo principal
        const riskAnalysis = this.calculateInterestRateAndCategory(score)
        const approvedAmount = userData.loanAmount ? Math.round(userData.loanAmount * riskAnalysis.approvedRatio) : 0

        return {
            creditScore: score,
            finalScore: score,
            category: riskAnalysis.category,
            status: riskAnalysis.status,
            interestRate: riskAnalysis.interestRate,
            approvedAmount,
            confidence: 0.6,
            source: 'basic_fallback',
            timestamp: Date.now(),
            modelVersion: 'v2.0-fallback'
        }
    }

    // Verificar elegibilidad para préstamo usando TU ALGORITMO
    async checkLoanEligibility(userAddress, loanData) {
        // Calcular elegibilidad usando directamente tu algoritmo avanzado
        const scoringResult = await this.calculateAdvancedCreditScore({
            ...loanData,
            walletAddress: userAddress
        })

        return {
            eligible: scoringResult.finalScore >= this.config.SCORE_MINIMO,
            maxAmount: scoringResult.approvedAmount,
            suggestedInterestRate: scoringResult.interestRate,
            reasons: [
                `Score crediticio: ${scoringResult.finalScore}`,
                `Categoría: ${scoringResult.category}`,
                `Estado: ${scoringResult.status}`
            ],
            scoringDetails: scoringResult,
            source: 'advanced_algorithm'
        }
    }

    // Método para simular diferentes escenarios CON SUPABASE
    async simulateScenarios(baseLoanData, variations = []) {
        const scenarios = []

        // Escenario base
        const baseResult = await this.calculateAdvancedCreditScore({
            ...baseLoanData,
            saveToDatabase: false // No guardar simulaciones automáticamente
        })
        scenarios.push({
            name: 'Escenario Base',
            data: baseLoanData,
            result: baseResult
        })

        // Simular variaciones
        for (const variation of variations) {
            const modifiedData = { ...baseLoanData, ...variation.changes }
            const result = await this.calculateAdvancedCreditScore({
                ...modifiedData,
                saveToDatabase: false
            })

            scenarios.push({
                name: variation.name,
                data: modifiedData,
                result,
                improvement: result.finalScore - baseResult.finalScore
            })
        }

        // Guardar simulación en Supabase si hay wallet address
        if (baseLoanData.walletAddress) {
            try {
                const { user } = await this.getOrCreateUser(baseLoanData.walletAddress, baseLoanData)

                await this.saveSimulation(user.id, {
                    baseScenario: baseLoanData,
                    baseScore: baseResult.finalScore,
                    variations: scenarios.slice(1), // Excluir escenario base
                    type: 'improvement_analysis'
                })
            } catch (dbError) {
                console.warn('Error guardando simulación:', dbError.message)
            }
        }

        return scenarios
    }

    // Método utilitario para validar datos de entrada
    validateLoanData(loanData) {
        const required = ['loanAmount', 'loanTerm', 'monthlyIncome']
        const missing = required.filter(field => !loanData[field] || loanData[field] <= 0)

        if (missing.length > 0) {
            throw new Error(`Campos requeridos faltantes o inválidos: ${missing.join(', ')}`)
        }

        if (loanData.loanTerm > 120) {
            throw new Error('El plazo del préstamo no puede exceder 120 meses')
        }

        if (loanData.loanAmount < 1000) {
            throw new Error('El monto mínimo del préstamo es $1,000')
        }

        return true
    }

    // =====================================================
    // MÉTODOS NUEVOS PARA ANALYTICS Y DASHBOARD
    // =====================================================

    // Obtener estadísticas de la plataforma
    async getPlatformStats() {
        try {
            const [usersResult, evaluationsResult, loansResult] = await Promise.all([
                supabase.from('users').select('id', { count: 'exact', head: true }),
                supabase.from('credit_evaluations').select('final_score'),
                supabase.from('loan_requests').select('status, approved_amount')
            ])

            const totalUsers = usersResult.count || 0
            const evaluations = evaluationsResult.data || []
            const loans = loansResult.data || []

            const avgCreditScore = evaluations.length > 0
                ? Math.round(evaluations.reduce((sum, e) => sum + e.final_score, 0) / evaluations.length)
                : 0

            const totalLoanVolume = loans.reduce((sum, l) => sum + (l.approved_amount || 0), 0)
            const activeLoanCount = loans.filter(l => l.status === 'active').length

            return {
                totalUsers,
                totalEvaluations: evaluations.length,
                avgCreditScore,
                totalLoanVolume,
                activeLoanCount,
                completedLoans: loans.filter(l => l.status === 'completed').length,
                defaultRate: loans.length > 0
                    ? (loans.filter(l => l.status === 'defaulted').length / loans.length * 100).toFixed(2)
                    : 0
            }
        } catch (error) {
            console.error('Error getting platform stats:', error)
            return null
        }
    }

    // Obtener historial de préstamos del usuario
    async getUserLoanHistory(walletAddress) {
        try {
            const { data, error } = await supabase
                .from('loan_requests')
                .select(`
                *,
                credit_evaluations (
                    final_score,
                    interest_rate,
                    category
                ),
                users!inner (
                    wallet_address
                )
            `)
                .eq('users.wallet_address', walletAddress)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error fetching loan history:', error)
                return []
            }

            return data || []
        } catch (error) {
            console.error('Error in getUserLoanHistory:', error)
            return []
        }
    }

    async getAvailableLoansToInvest(walletAddress) {
        try {
            // Solo obtener préstamos que no sean de este wallet
            const { data, error } = await supabase
                .from('loan_requests')
                .select('*')
                .neq('wallet_address', walletAddress)  // Asumiendo que loan_requests tiene wallet_address
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error fetching available loans:', error)
                return []
            }

            return data || []
        } catch (error) {
            console.error('Error in getAvailableLoansToInvest:', error)
            return []
        }
    }
    // Obtener un préstamo por ID
    async getLoanById(loanId) {
        try {
            const { data, error } = await supabase
                .from('loan_requests')
                .select(`
                *,
                credit_evaluations (
                    final_score,
                    category,
                    contributions
                )
            `)
                .eq('id', loanId)
                .single()

            if (error) throw error

            // Mapear credit score si existe
            if (data?.credit_evaluations) {
                data.credit_score = data.credit_evaluations.final_score
                data.category = data.credit_evaluations.category
            }

            return data
        } catch (error) {
            console.error('Error fetching loan:', error)
            return null
        }
    }

    // Obtener historial de préstamos del usuario
    // Obtener historial de préstamos del usuario
    async getUserLoanHistory(walletAddress) {
        try {
            // Primero obtener el user_id basado en wallet_address
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id')
                .eq('wallet_address', walletAddress)
                .single()

            if (userError || !userData) {
                console.log('User not found for wallet:', walletAddress)
                return []
            }

            // Obtener solo los loan_requests sin el join problemático
            const { data: loans, error: loansError } = await supabase
                .from('loan_requests')
                .select('*')
                .eq('wallet_address', walletAddress)
                .order('created_at', { ascending: false })

            if (loansError) {
                console.error('Error fetching loans:', loansError)
                return []
            }

            // Si necesitas los credit_evaluations, hazlo en una consulta separada
            if (loans && loans.length > 0) {
                // Obtener las evaluaciones crediticias por separado
                const evaluationIds = loans
                    .map(loan => loan.credit_evaluation_id)
                    .filter(id => id !== null)

                if (evaluationIds.length > 0) {
                    const { data: evaluations } = await supabase
                        .from('credit_evaluations')
                        .select('id, final_score, interest_rate, category')
                        .in('id', evaluationIds)

                    // Combinar los datos manualmente
                    if (evaluations) {
                        loans.forEach(loan => {
                            const evaluation = evaluations.find(e => e.id === loan.credit_evaluation_id)
                            if (evaluation) {
                                loan.credit_score = evaluation.final_score
                                loan.category = evaluation.category
                            }
                        })
                    }
                }
            }

            return loans || []

        } catch (error) {
            console.error('Error in getUserLoanHistory:', error)
            return []
        }
    }
    // Obtener mejores oportunidades de inversión
    async getInvestmentOpportunities(limit = 10) {
        try {
            const { data, error } = await supabase
                .from('loan_requests')
                .select(`
          *,
          credit_evaluations(final_score, interest_rate, category),
          users(wallet_address, full_name)
        `)
                .eq('status', 'approved')
                .gte('credit_evaluations.final_score', 65)
                .order('credit_evaluations.final_score', { ascending: false })
                .limit(limit)

            if (error) {
                throw new Error(`Error fetching investment opportunities: ${error.message}`)
            }

            return data || []
        } catch (error) {
            console.error('Error in getInvestmentOpportunities:', error)
            return []
        }
    }

    // Agregar este método a tu archivo CreditScoringService.js

    async getMarketplaceLoans(currentUserAddress) {
        try {
            const { data, error } = await supabase
                .from('loan_requests')
                .select(`
                *,
                credit_evaluations (
                    final_score,
                    interest_rate,
                    category
                ),
                users!inner (
                    wallet_address
                )
            `)
                .neq('users.wallet_address', currentUserAddress)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error fetching loan history:', error)
                return []
            }

            return data || []
        } catch (error) {
            console.error('Error in getUserLoanHistory:', error)
            return []
        }
    }

    // Método adicional para invertir en un préstamo (opcional)
    async investInLoan(loanId, investmentAmount, investorAddress) {
        console.log('Processing investment:', { loanId, investmentAmount, investorAddress })

        try {
            // Primero obtener el préstamo actual
            const { data: loan, error: fetchError } = await supabase
                .from('loan_requests')
                .select('*')
                .eq('id', loanId)
                .single()

            if (fetchError) throw fetchError

            // Verificar que el préstamo acepta inversiones
            if (loan.status !== 'pending' && loan.status !== 'active') {
                throw new Error('Loan is not accepting investments')
            }

            // Calcular el nuevo monto aprobado
            const newApprovedAmount = (loan.approved_amount || 0) + investmentAmount

            // Verificar que no exceda el monto solicitado
            if (newApprovedAmount > loan.requested_amount) {
                throw new Error('Investment exceeds requested amount')
            }

            // Actualizar el préstamo con el nuevo monto
            const { data: updatedLoan, error: updateError } = await supabase
                .from('loan_requests')
                .update({
                    approved_amount: newApprovedAmount,
                    status: newApprovedAmount >= loan.requested_amount ? 'funded' : loan.status,
                    updated_at: new Date().toISOString()
                })
                .eq('id', loanId)
                .select()
                .single()

            if (updateError) throw updateError

            // Opcionalmente, crear un registro de la inversión en una tabla separada
            const { error: investmentError } = await supabase
                .from('investments')
                .insert({
                    loan_id: loanId,
                    investor_address: investorAddress,
                    amount: investmentAmount,
                    invested_at: new Date().toISOString()
                })

            // Si no tienes tabla de investments, puedes omitir esto
            if (investmentError) {
                console.warn('Could not record investment:', investmentError)
            }

            return updatedLoan

        } catch (error) {
            console.error('Error investing in loan:', error)
            throw error
        }
    }

    // Método para obtener todos los préstamos (sin filtrar por usuario)
    async getAllLoans() {
        try {
            const { data, error } = await supabase
                .from('loan_requests')
                .select(`
        *,
        credit_evaluations (
          credit_score,
          risk_level
        )
      `)
                .order('created_at', { ascending: false })

            if (error) throw error

            return data || []
        } catch (error) {
            console.error('Error fetching all loans:', error)
            throw error
        }
    }

    // Agregar este método a tu archivo services/creditScoring.js

    async getMarketplaceLoans(currentUserAddress) {
        console.log('Getting marketplace loans, excluding address:', currentUserAddress)

        try {
            // Query para obtener todos los préstamos excepto los del usuario actual
            let query = supabase
                .from('loan_requests')
                .select('*')
                .order('created_at', { ascending: false })

            // Si hay un usuario conectado, excluir sus préstamos
            if (currentUserAddress) {
                query = query.neq('wallet_address', currentUserAddress.toLowerCase())
            }

            const { data, error } = await query

            if (error) {
                console.error('Supabase error:', error)
                throw error
            }

            console.log(`Fetched ${data?.length || 0} marketplace loans`)
            return data || []

        } catch (error) {
            console.error('Error fetching marketplace loans:', error)
            return []
        }
    }

    // Alternativamente, si tu tabla usa borrower_id en lugar de wallet_address:
    async getMarketplaceLoansWithBorrowerId(currentUserId) {
        console.log('Getting marketplace loans, excluding user:', currentUserId)

        try {
            let query = supabase
                .from('loan_requests')
                .select(`
        *,
        credit_evaluations (
          credit_score,
          risk_level
        )
      `)
                .order('created_at', { ascending: false })

            // Si hay un usuario conectado, excluir sus préstamos
            if (currentUserId) {
                query = query.neq('borrower_id', currentUserId)
            }

            const { data, error } = await query

            if (error) {
                console.error('Supabase error:', error)
                throw error
            }

            // Mapear los datos si tienen credit_evaluations anidado
            const loansWithScore = data?.map(loan => ({
                ...loan,
                credit_score: loan.credit_evaluations?.credit_score || loan.credit_score || 0,
                risk_level: loan.credit_evaluations?.risk_level || null
            })) || []

            console.log(`Fetched ${loansWithScore.length} marketplace loans with scores`)
            return loansWithScore

        } catch (error) {
            console.error('Error fetching marketplace loans:', error)
            return []
        }
    }
}

export default new CreditScoringService()