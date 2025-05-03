import { useState } from 'react'
import { Link } from 'react-router-dom'
import authService from '@/services/auth'

const ResendVerificationPage = () => {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setStatus('error')
      setMessage('Veuillez entrer votre adresse email.')
      return
    }
    
    setStatus('loading')
    
    try {
      const response = await authService.resendVerification(email)
      setStatus('success')
      setMessage(response.message)
    } catch (error: any) {
      setStatus('error')
      setMessage(error.response?.data?.message || 'Une erreur est survenue lors de l\'envoi de l\'email de vérification.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white shadow-lg rounded-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Renvoyer l'email de vérification
          </h2>
        </div>
        
        {status === 'success' ? (
          <div className="mt-8 text-center">
            <div className="text-green-500 text-xl mb-4">✓ Email envoyé</div>
            <p className="text-gray-600">{message}</p>
            <div className="mt-6">
              <Link
                to="/login"
                className="text-indigo-600 hover:text-indigo-500"
              >
                Retour à la page de connexion
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Adresse email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="votre@email.com"
                />
              </div>
            </div>
            
            {status === 'error' && (
              <div className="text-red-500 text-sm mt-2">{message}</div>
            )}
            
            <div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {status === 'loading' ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Envoi en cours...
                  </span>
                ) : 'Envoyer l\'email de vérification'}
              </button>
            </div>
            
            <div className="text-center">
              <Link
                to="/login"
                className="text-indigo-600 hover:text-indigo-500"
              >
                Retour à la page de connexion
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ResendVerificationPage
