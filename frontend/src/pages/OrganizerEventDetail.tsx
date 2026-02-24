import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import OrganizerNavbar from '../components/OrganizerNavbar';
import '../styles/OrganizerEventDetail.css';

export default function OrganizerEventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventDetails();
    fetchAnalytics();
    fetchParticipants();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      const res = await api.get(`/events/${id}`);
      setEvent(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await api.get(`/events/${id}/analytics`);
      setAnalytics(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchParticipants = async () => {
    try {
      const res = await api.get(`/registrations/event/${id}`);
      setParticipants(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Registration Date', 'Payment', 'Team', 'Attended'];
    const rows = participants.map(p => [
      `${p.userId?.profile?.firstName || ''} ${p.userId?.profile?.lastName || ''}`,
      p.userId?.email || '',
      new Date(p.registrationDate).toLocaleDateString(),
      `₹${p.amountPaid || 0}`,
      p.teamName || 'N/A',
      p.attended ? 'Yes' : 'No'
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event?.name || 'event'}_participants.csv`;
    a.click();
  };

  const filteredParticipants = participants.filter(p => {
    const name = `${p.userId?.profile?.firstName || ''} ${p.userId?.profile?.lastName || ''}`.toLowerCase();
    const email = (p.userId?.email || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  if (loading) {
    return (
      <div className="event-detail-loading">
        <div className="event-detail-spinner"></div>
      </div>
    );
  }

  return (
    <div className="organizer-event-detail-page">
      <OrganizerNavbar />
      
      {/* Header */}
      <div className="event-detail-header">
        <div className="event-detail-header-content">
          <div className="event-detail-header-info">
            <h1 className="event-detail-title">
              🎪 {event?.name}
            </h1>
            <p className="event-detail-subtitle">
              <span>📋</span> {event?.type} Event
            </p>
          </div>
          <button 
            onClick={() => navigate('/dashboard')}
            className="back-button"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      <div className="event-detail-main">
        {/* Event Overview */}
        <div className="event-overview-card">
          <h2 className="event-overview-title">📋 Event Overview</h2>
          <div className="event-overview-grid">
            <div className="event-overview-item">
              <span className="event-overview-label">Event Name</span>
              <span className="event-overview-value">{event?.name}</span>
            </div>
            <div className="event-overview-item">
              <span className="event-overview-label">Event Type</span>
              <span className="event-overview-value">{event?.type}</span>
            </div>
            <div className="event-overview-item">
              <span className="event-overview-label">Start Date</span>
              <span className="event-overview-value">{new Date(event?.startDate).toLocaleString()}</span>
            </div>
            <div className="event-overview-item">
              <span className="event-overview-label">End Date</span>
              <span className="event-overview-value">{new Date(event?.endDate).toLocaleString()}</span>
            </div>
            <div className="event-overview-item">
              <span className="event-overview-label">Eligibility</span>
              <span className="event-overview-value">{event?.eligibility}</span>
            </div>
            <div className="event-overview-item">
              <span className="event-overview-label">Registration Fee</span>
              <span className="event-overview-value">₹{event?.registrationFee || 0}</span>
            </div>
            <div className="event-overview-item">
              <span className="event-overview-label">Registration Deadline</span>
              <span className="event-overview-value">{new Date(event?.registrationDeadline).toLocaleString()}</span>
            </div>
            <div className="event-overview-item">
              <span className="event-overview-label">Registration Limit</span>
              <span className="event-overview-value">{event?.registrationLimit || 'Unlimited'}</span>
            </div>
          </div>
          <div className="event-description-section">
            <p className="event-description-label">Description:</p>
            <p className="event-description-text">{event?.description}</p>
          </div>
        </div>

        {/* Analytics */}
        {analytics && (
          <div className="analytics-card">
            <h2 className="analytics-title">📊 Analytics</h2>
            <div className="analytics-stats-grid">
              <div className="analytics-stat-card analytics-stat-card-blue">
                <p className="analytics-stat-label">Total Registrations</p>
                <p className="analytics-stat-value analytics-stat-value-blue">{analytics.totalRegistrations}</p>
              </div>
              <div className="analytics-stat-card analytics-stat-card-green">
                <p className="analytics-stat-label">Total Revenue</p>
                <p className="analytics-stat-value analytics-stat-value-green">₹{analytics.totalRevenue}</p>
              </div>
              <div className="analytics-stat-card analytics-stat-card-purple">
                <p className="analytics-stat-label">Attendance</p>
                <p className="analytics-stat-value analytics-stat-value-purple">{analytics.attendanceCount}</p>
                <p className="analytics-stat-subtext">{analytics.attendanceRate}% attendance rate</p>
              </div>
              <div className="analytics-stat-card analytics-stat-card-orange">
                <p className="analytics-stat-label">Available Slots</p>
                <p className="analytics-stat-value analytics-stat-value-orange">
                  {analytics.availableSlots !== null ? analytics.availableSlots : '∞'}
                </p>
              </div>
            </div>

            {analytics.teamStats && (
              <div className="team-stats-section">
                <p className="team-stats-title">Team Completion Statistics</p>
                <div className="team-stats-grid">
                  <div className="team-stat-item">
                    <p className="team-stat-label">Total Teams</p>
                    <p className="team-stat-value">{analytics.teamStats.totalTeams}</p>
                  </div>
                  <div className="team-stat-item">
                    <p className="team-stat-label">Complete Teams</p>
                    <p className="team-stat-value team-stat-value-green">{analytics.teamStats.completeTeams}</p>
                  </div>
                  <div className="team-stat-item">
                    <p className="team-stat-label">Incomplete Teams</p>
                    <p className="team-stat-value team-stat-value-yellow">{analytics.teamStats.incompleteTeams}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payment Approvals Button for Merchandise Events */}
        {event?.type === 'Merchandise' && (
          <div className="bg-purple-50 rounded-lg shadow-md p-6 mb-6 border-2 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-purple-900 mb-2">💳 Merchandise Payment Approvals</h3>
                <p className="text-purple-700 text-sm">
                  Manage payment proofs, approve or reject orders for merchandise
                </p>
              </div>
              <button
                onClick={() => navigate(`/organizer/event/${id}/payments`)}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 font-semibold transition flex items-center gap-2"
              >
                💳 Manage Payments
              </button>
            </div>
          </div>
        )}

        {/* Attendance Tracking Button */}
        <div className="bg-blue-50 rounded-lg shadow-md p-6 mb-6 border-2 border-blue-200">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-xl font-bold text-blue-900 mb-2">🎟️ Attendance Tracking</h3>
              <p className="text-blue-700 text-sm">
                Scan QR codes, mark attendance, and export attendance reports
              </p>
            </div>
            <button
              onClick={() => navigate(`/organizer/event/${id}/attendance`)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold transition flex items-center gap-2"
            >
              🎟️ Track Attendance
            </button>
          </div>
        </div>

        {/* Participants List */}
        <div className="participants-card">
          <div className="participants-header">
            <h2 className="participants-title">👥 Participants ({participants.length})</h2>
            <div className="participants-actions">
              <input
                type="text"
                placeholder="Search participants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button
                onClick={handleExportCSV}
                className="export-button"
              >
                📥 Export CSV
              </button>
            </div>
          </div>

          {filteredParticipants.length === 0 ? (
            <p className="participants-empty">No participants found</p>
          ) : (
            <div className="participants-table-container">
              <table className="participants-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Registration Date</th>
                    <th>Payment</th>
                    {event?.type === 'Team' && (
                      <th>Team</th>
                    )}
                    <th>Attended</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParticipants.map((p) => (
                    <tr key={p._id}>
                      <td>
                        {p.userId?.profile?.firstName} {p.userId?.profile?.lastName}
                      </td>
                      <td>{p.userId?.email}</td>
                      <td>
                        {new Date(p.registrationDate).toLocaleDateString()}
                      </td>
                      <td>₹{p.amountPaid || 0}</td>
                      {event?.type === 'Team' && (
                        <td>{p.teamName || 'N/A'}</td>
                      )}
                      <td>
                        {p.attended ? (
                          <span className="attendance-badge-yes">✓ Yes</span>
                        ) : (
                          <span className="attendance-badge-no">✗ No</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
