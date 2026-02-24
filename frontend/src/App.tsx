import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import OrganizerEvents from './pages/OrganizerEvents';
import ParticipantEvents from './pages/ParticipantEvents';
import BrowseEvents from './pages/BrowseEvents';
import EventDetails from './pages/EventDetails';
import Clubs from './pages/Clubs';
import OrganizerDetail from './pages/OrganizerDetail';
import OrganizerEventDetail from './pages/OrganizerEventDetail';
import EventEdit from './pages/EventEdit';
import CreateEvent from './pages/CreateEvent';
import PaymentApprovals from './pages/PaymentApprovals';
import AttendanceDashboard from './pages/AttendanceDashboard';
import SecurityDashboard from './pages/SecurityDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/browse" element={<BrowseEvents />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/admin/security" element={<SecurityDashboard />} />
        <Route path="/create-event" element={<CreateEvent />} />
        <Route path="/organizer/events" element={<OrganizerEvents />} />
        <Route path="/organizer-events" element={<OrganizerEvents />} />
        <Route path="/my-events" element={<ParticipantEvents />} />
        <Route path="/browse-events" element={<BrowseEvents />} />
        <Route path="/events/:id" element={<EventDetails />} />
        <Route path="/events/edit/:id" element={<EventEdit />} />
        <Route path="/clubs" element={<Clubs />} />
        <Route path="/clubs/:id" element={<OrganizerDetail />} />
        <Route path="/organizer/event/:id" element={<OrganizerEventDetail />} />
        <Route path="/organizer/event/:eventId/payments" element={<PaymentApprovals />} />
        <Route path="/organizer/event/:eventId/attendance" element={<AttendanceDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;