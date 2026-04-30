import { useState, useEffect, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from "@/components/ui"
import authService from '@/services/auth'
import { track } from '@/services/telemetry'

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    track('forgot-password-page-viewed')
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    track('forgot-password-submit-clicked', { email: email.trim() })
    setError('')
    setSuccess('')

    if (!email.trim()) {
      setError('Veuillez renseigner votre adresse email.')
      return
    }

    setLoading(true)
    track('forgot-password-request-sent', { email: email.trim() })

    try {
      const response = await authService.forgotPassword(email.trim())
      track('forgot-password-request-success', { email: email.trim() })
      setSuccess(response.message)
      setEmail('')
      // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const status = err.response?.status
      const message = err.response?.data?.message
      track('forgot-password-request-error', {
        email: email.trim(),
        status: status ?? 'network-error',
        message: message ?? null,
      })
      setError(message || 'Une erreur est survenue lors de la demande de réinitialisation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-140px)] px-4 py-8">
      <div className="w-full max-w-md relative">
        {/* Card with contained decoration elements */}
        <div className="relative bg-white rounded-lg shadow-xl p-6 sm:p-8 border border-gray-100 overflow-hidden">
          {/* Decorative elements inside card */}
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/10 rounded-full opacity-70"></div>
          <div className="absolute -bottom-12 -left-12 w-24 h-24 bg-secondary/10 rounded-full opacity-70"></div>
          <div className="relative z-10">
            <div className="flex justify-center mb-6">
              <Logo width={120} />
            </div>
            
            <h1 className="text-2xl font-bold text-center mb-6 text-primary">Mot de passe oublié</h1>
            
            {!success ? (
              <p className="text-center text-gray-600 mb-6">
                Saisissez votre adresse email pour recevoir un lien de réinitialisation de mot de passe.
              </p>
            ) : null}
            
            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{success}</span>
              </div>
            )}
            
            {!success && (
              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-400 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="nom@example.com"
                      required
                    />
                  </div>
                </div>
                
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-white font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary disabled:opacity-60 bg-secondary hover:bg-secondary-hover"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Envoi en cours...
                      </>
                    ) : 'Envoyer le lien de réinitialisation'}
                  </button>
                </div>
              </form>
            )}
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Vous vous souvenez de votre mot de passe ?{' '}
                <Link to="/login" className="font-medium text-secondary hover:text-secondary-hover">
                  Se connecter
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage