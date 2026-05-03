export default function Avatar({ url, name, size = 'md', className = '' }) {
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-2xl' }
  const initials = (name || '?').charAt(0).toUpperCase()
  const sz = sizes[size] || sizes.md
  if (url) {
    return <img src={url} alt={name || 'Avatar'} className={`${sz} rounded-full object-cover ${className}`} />
  }
  return (
    <div className={`${sz} rounded-full club-bg flex items-center justify-center text-white font-black flex-shrink-0 ${className}`}>
      {initials}
    </div>
  )
}
