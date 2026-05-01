export default function ErrorMessage({ message }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-sm">
      {message || 'Something went wrong.'}
    </div>
  )
}
