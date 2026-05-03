import { Link } from 'react-router-dom'

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link to="/" className="text-sm text-gray-400 hover:text-gray-600">← Back to Clubhouse</Link>
        </div>
        <div className="card prose prose-sm max-w-none">
          <h1 className="text-2xl font-black text-gray-900 mb-1">Privacy Policy</h1>
          <p className="text-xs text-gray-400 mb-6">Last updated: May 2026</p>

          <h2 className="font-bold text-gray-800 mt-6 mb-2">Who we are</h2>
          <p className="text-gray-600 text-sm">Clubhouse is a sport club management platform operated by Luck Dragon. We help community sport clubs manage fixtures, rosters, training, and member communications.</p>

          <h2 className="font-bold text-gray-800 mt-6 mb-2">What we collect</h2>
          <ul className="text-gray-600 text-sm space-y-1 list-disc pl-5">
            <li>Email address (used for login and club communications)</li>
            <li>Name and profile information you choose to provide</li>
            <li>Club membership details (role, jumper number, positions)</li>
            <li>Training attendance and availability records</li>
            <li>Fee payment status (amounts and dates — not payment card details)</li>
            <li>In-app chat messages within your team</li>
            <li>Event RSVP responses</li>
            <li>Best &amp; Fairest votes you cast</li>
            <li>Push notification subscription data (browser endpoint, not personal)</li>
          </ul>

          <h2 className="font-bold text-gray-800 mt-6 mb-2">How we use it</h2>
          <ul className="text-gray-600 text-sm space-y-1 list-disc pl-5">
            <li>To provide and operate the Clubhouse service for your club</li>
            <li>To send login links to your email address</li>
            <li>To send club announcements and match notifications (only if you subscribe)</li>
            <li>We do not sell your data, share it with advertisers, or use it for marketing</li>
          </ul>

          <h2 className="font-bold text-gray-800 mt-6 mb-2">Data storage</h2>
          <p className="text-gray-600 text-sm">Your data is stored in Cloudflare's D1 database infrastructure, hosted in data centres that may include locations in Australia and internationally. Data is encrypted at rest and in transit. Session tokens are stored locally in your browser.</p>

          <h2 className="font-bold text-gray-800 mt-6 mb-2">Your rights</h2>
          <p className="text-gray-600 text-sm">Under the Australian Privacy Act 1988, you have the right to access, correct, or request deletion of your personal information. Contact your club administrator or email <a href="mailto:paddy@luckdragon.io" className="text-blue-600 hover:underline">paddy@luckdragon.io</a> to exercise these rights.</p>

          <h2 className="font-bold text-gray-800 mt-6 mb-2">Cookies &amp; local storage</h2>
          <p className="text-gray-600 text-sm">We use browser local storage to keep you logged in (session token only). We do not use tracking cookies or third-party analytics.</p>

          <h2 className="font-bold text-gray-800 mt-6 mb-2">Data retention</h2>
          <p className="text-gray-600 text-sm">Your data is retained for as long as you are an active member of a club on Clubhouse. Expired login links are retained for 30 days then eligible for deletion. You can request full deletion at any time.</p>

          <h2 className="font-bold text-gray-800 mt-6 mb-2">Contact</h2>
          <p className="text-gray-600 text-sm">Questions about this policy? Email <a href="mailto:paddy@luckdragon.io" className="text-blue-600 hover:underline">paddy@luckdragon.io</a>.</p>
        </div>
      </div>
    </div>
  )
}
