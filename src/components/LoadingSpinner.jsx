export default function LoadingSpinner({ label = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-900 rounded-full animate-spin" />
      <p className="text-gray-500 text-sm">{label}</p>
    </div>
  )
}
