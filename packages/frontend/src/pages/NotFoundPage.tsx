import { Link } from 'react-router-dom'

const NotFoundPage = () => {
  return (
    <div className="max-w-md mx-auto text-center py-12">
      <h1 className="text-4xl font-bold text-red-600 mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
      <p className="mb-6">The page you are looking for doesn't exist or has been moved.</p>
      <Link to="/" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md">
        Go Home
      </Link>
    </div>
  )
}

export default NotFoundPage