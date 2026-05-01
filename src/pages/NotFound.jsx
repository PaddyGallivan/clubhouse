import { Link } from 'react-router-dom'
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
      <div className="text-6xl">🏟️</div>
      <h1 className="text-3xl font-black text-gray-800">Page not found</h1>
      <p className="text-gray-500">That page doesn't exist — or the club hasn't launched yet.</p>
      <Link to="/" className="btn-primary mt-2">Back to Clubhouse</Link>
    </div>
  )
}
