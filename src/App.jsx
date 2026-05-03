import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import ClubHome from './pages/ClubHome.jsx'
import Fixtures from './pages/Fixtures.jsx'
import Roster from './pages/Roster.jsx'
import Teams from './pages/Teams.jsx'
import TeamDetail from './pages/TeamDetail.jsx'
import News from './pages/News.jsx'
import Sponsors from './pages/Sponsors.jsx'
import Login from './pages/Login.jsx'
import Verify from './pages/Verify.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Profile from './pages/Profile.jsx'
import Chat from './pages/Chat.jsx'
import BFVoting from './pages/BFVoting.jsx'
import MatchDay from './pages/MatchDay.jsx'
import PlayerProfile from './pages/PlayerProfile.jsx'
import Events from './pages/Events.jsx'
import Admin from './pages/Admin.jsx'
import Training from './pages/Training.jsx'
import Ladder from './pages/Ladder.jsx'
import Superadmin from './pages/Superadmin.jsx'
import Onboarding from './pages/Onboarding.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/superadmin" element={<Superadmin />} />
      <Route path="/onboard" element={<Onboarding />} />
      <Route path="/:slug" element={<ClubHome />} />
      <Route path="/:slug/fixtures" element={<Fixtures />} />
      <Route path="/:slug/roster" element={<Roster />} />
      <Route path="/:slug/teams" element={<Teams />} />
      <Route path="/:slug/teams/:teamId" element={<TeamDetail />} />
      <Route path="/:slug/news" element={<News />} />
      <Route path="/:slug/sponsors" element={<Sponsors />} />
      <Route path="/:slug/chat" element={<Chat />} />
      <Route path="/:slug/voting" element={<BFVoting />} />
      <Route path="/:slug/matchday" element={<MatchDay />} />
      <Route path="/:slug/player/:userId" element={<PlayerProfile />} />
      <Route path="/:slug/events" element={<Events />} />
      <Route path="/:slug/admin" element={<Admin />} />
      <Route path="/:slug/training" element={<Training />} />
      <Route path="/:slug/ladder" element={<Ladder />} />
      <Route path="/:slug/login" element={<Login />} />
      <Route path="/:slug/verify" element={<Verify />} />
      <Route path="/:slug/dashboard" element={<Dashboard />} />
      <Route path="/:slug/profile" element={<Profile />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
