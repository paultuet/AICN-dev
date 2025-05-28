import { Link } from 'react-router-dom'

const NotFoundPage = () => {
  return (
    <div className="max-w-md mx-auto text-center py-12">
      <h1 className="text-6xl font-bold text-gray-600 mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-4">Page introuvable</h2>
      <p className="mb-6">La page que vous cherchez n'existe pas (ou plus).</p>
      <Link to="/" className="underline text-xl">
        Retour à l'accueil
      </Link>
    </div>
  )
}

export default NotFoundPage
