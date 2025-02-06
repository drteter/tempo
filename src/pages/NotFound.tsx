import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-text-primary">404</h1>
      <p className="text-text-secondary mt-2">Page not found</p>
      <Link
        to="/"
        className="mt-4 btn-primary"
      >
        Go back home
      </Link>
    </div>
  )
}

export default NotFound 