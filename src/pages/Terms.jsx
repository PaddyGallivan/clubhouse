import { Link } from 'react-router-dom'

export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link to="/" className="text-sm text-gray-400 hover:text-gray-600">← Back to Clubhouse</Link>
        </div>
        <div className="card prose prose-sm max-w-none">
          <h1 className="text-2xl font-black text-gray-900 mb-1">Terms of Service</h1>
          <p className="text-xs text-gray-400 mb-6">Last updated: May 2026</p>

          <h2 className="font-bold text-gray-800 mt-6 mb-2">Acceptance</h2>
          <p className="text-gray-600 text-sm">By logging in to Clubhouse, you agree to these terms. If you do not agree, do not use the service.</p>

          <h2 className="font-bold text-gray-800 mt-6 mb-2">The service</h2>
          <p className="text-gray-600 text-sm">Clubhouse provides community sport club management tools including fixtures, rostering, chat, training tracking, and member communications. The service is provided by Luck Dragon on behalf of your club.</p>

          <h2 className="font-bold text-gray-800 mt-6 mb-2">Your account</h2>
          <ul className="text-gray-600 text-sm space-y-1 list-disc pl-5">
            <li>You must provide a valid email address to access the service</li>
            <li>You are responsible for keeping your login link confidential</li>
            <li>Accounts are tied to club membership — access may be revoked by your club administrator</li>
            <li>You must be a legitimate member of the club to use club-specific features</li>
          </ul>

          <h2 className="font-bold text-gray-800 mt-6 mb-2">Acceptable use</h2>
          <p className="text-gray-600 text-sm">You agree not to:</p>
          <ul className="text-gray-600 text-sm space-y-1 list-disc pl-5">
            <li>Use the service to harass, bully, or harm other members</li>
            <li>Share your login link with others</li>
            <li>Attempt to access data belonging to other clubs or users</li>
            <li>Post offensive, discriminatory, or illegal content in club chat or feeds</li>
            <li>Use automated tools to scrape or abuse the service</li>
          </ul>

          <h2 className="font-bold text-gray-800 mt-6 mb-2">Content</h2>
          <p className="text-gray-600 text-sm">You retain ownership of content you post (chat messages, profile info). By posting, you grant Luck Dragon a limited licence to store and display it within the service. Your club administrator may moderate or remove content.</p>

          <h2 className="font-bold text-gray-800 mt-6 mb-2">Availability</h2>
          <p className="text-gray-600 text-sm">We aim for high availability but do not guarantee uninterrupted service. We reserve the right to perform maintenance, updates, or modify features at any time.</p>

          <h2 className="font-bold text-gray-800 mt-6 mb-2">Limitation of liability</h2>
          <p className="text-gray-600 text-sm">Clubhouse is provided as-is. Luck Dragon is not liable for any loss arising from use of the service, including missed notifications, data errors, or service unavailability. The service is a tool to assist your club — all club decisions remain the responsibility of club officials.</p>

          <h2 className="font-bold text-gray-800 mt-6 mb-2">Governing law</h2>
          <p className="text-gray-600 text-sm">These terms are governed by the laws of Victoria, Australia. Any disputes will be subject to the jurisdiction of Victorian courts.</p>

          <h2 className="font-bold text-gray-800 mt-6 mb-2">Changes</h2>
          <p className="text-gray-600 text-sm">We may update these terms. Continued use of the service after changes constitutes acceptance of the updated terms.</p>

          <h2 className="font-bold text-gray-800 mt-6 mb-2">Contact</h2>
          <p className="text-gray-600 text-sm">Questions? Email <a href="mailto:paddy@luckdragon.io" className="text-blue-600 hover:underline">paddy@luckdragon.io</a>.</p>
        </div>
      </div>
    </div>
  )
}
