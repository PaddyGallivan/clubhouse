import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import Verify from './pages/Verify.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Fixtures from './pages/Fixtures.jsx'
import Roster from './pages/Roster.jsx'
import Teams from './pages/Teams.jsx'
import Chat from './pages/Chat.jsx'
import MatchDay from './pages/MatchDay.jsx'
import BestAndFairest from './pages/BestAndFairest.jsx'
import PlayerProfile from './pages/PlayerProfile.jsx'
import Events from './pages/Events.jsx'
import Admin from './pages/Admin.jsx'
import Training from './pages/Training.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/:slug/login" element={<Login />} />
      <Route path="/:slug/verify" element={<Verify />} />
      <Route path="/:slug/dashboard" element={<Dashboard />} />
      <Route path="/:slug/fixtures" element={<Fixtures />} />
      <Route path="/:slug/roster" element={<Roster />} />
      <Route path="/:slug/teams" element={<Teams />} />
      <Route path="/:slug/chat" element={<Chat />} />
      <Route path="/:slug/matchday" element={<MatchDay />} />
      <Route path="/:slug/bf" element={<BestAndFairest />} />
      <Route path="/:slug/player/:userId" element={<PlayerProfile />} />
      <Route path="/:slug/events" element={<Events />} />
      <Route path="/:slug/admin" element={<Admin />} />
      <Route path="/:slug/training" element={<Training />} />
    </Routes>
  )
}
