import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import OrganizerNavbar from '../components/OrganizerNavbar';
import { Scanner } from '../components/Scanner';
import '../styles/AttendanceDashboard.css';

export default function AttendanceDashboard() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'attended' | 'not-attended'>('all');
  const [showScanner, setShowScanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'organizer') {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, [eventId, filter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch event details
      const eventRes = await api.get(`/events/${eventId}`);
      setEvent(eventRes.data);

      // Fetch attendance stats
      const statsRes = await api.get(`/attendance/event/${eventId}/stats`);
      setStats(statsRes.data);

      // Fetch attendance list
      const listRes = await api.get(`/attendance/event/${eventId}/list`, {
        params: { filter }
      });
      setAttendanceList(listRes.data.attendanceList);

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleScanSuccess = () => {
    // Refresh data after successful scan
    fetchData();
    setShowScanner(false);
  };

  const handleManualOverride = async (registrationId: string, attended: boolean) => {
    const notes = prompt(`${attended ? 'Mark' : 'Unmark'} attendance manually. Enter notes (optional):`);
    
    if (notes === null) return; // User cancelled

    try {
      await api.post(`/attendance/manual/${registrationId}`, {
        attended,
        notes: notes || `Manual ${attended ? 'mark' : 'unmark'} by organizer`
      });
      
      alert('Attendance updated successfully!');
      fetchData();
    } catch (err: any) {
      alert('Error: ' + (err.response?.data?.message || 'Failed to update attendance'));
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.get(`/attendance/event/${eventId}/export`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance-${event?.name || 'event'}-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      alert('Attendance report exported successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to export report');
    }
  };

  const filteredList = attendanceList.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.participantName?.toLowerCase().includes(query) ||
      item.participantEmail?.toLowerCase().includes(query) ||
      item.ticketId?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <OrganizerNavbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="attendance-header">
          <button
            onClick={() => navigate(`/organizer/event/${eventId}`)}
            className="back-button"
          >
            ← Back to Event
          </button>
          <h1>Attendance Tracking</h1>
          <p className="event-name">{event?.name}</p>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <p className="stat-label">Total Registered</p>
              <p className="stat-value">{stats?.totalRegistrations || 0}</p>
            </div>
          </div>

          <div className="stat-card attended">
            <div className="stat-icon"></div>
            <div className="stat-content">
              <p className="stat-label">Attended</p>
              <p className="stat-value">{stats?.attended || 0}</p>
            </div>
          </div>

          <div className="stat-card not-attended">
            <div className="stat-icon"></div>
            <div className="stat-content">
              <p className="stat-label">Not Attended</p>
              <p className="stat-value">{stats?.notAttended || 0}</p>
            </div>
          </div>

          <div className="stat-card rate">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <p className="stat-label">Attendance Rate</p>
              <p className="stat-value">{stats?.attendanceRate || 0}%</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button
            onClick={() => setShowScanner(!showScanner)}
            className="btn-primary"
          >
            <i className="bi bi-qr-code-scan"></i>
            {showScanner ? 'Hide Scanner' : 'Scan QR Code'}
          </button>

          <button
            onClick={handleExportCSV}
            className="btn-export"
          >
            <i className="bi bi-download"></i>
            Export CSV
          </button>
        </div>

        {/* QR Scanner */}
        {showScanner && (
          <div className="scanner-section">
            <Scanner eventId={eventId || ''} onScanSuccess={handleScanSuccess} />
          </div>
        )}

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button
            onClick={() => setFilter('all')}
            className={`tab ${filter === 'all' ? 'active' : ''}`}
          >
            All ({stats?.totalRegistrations || 0})
          </button>
          <button
            onClick={() => setFilter('attended')}
            className={`tab ${filter === 'attended' ? 'active' : ''}`}
          >
            Attended ({stats?.attended || 0})
          </button>
          <button
            onClick={() => setFilter('not-attended')}
            className={`tab ${filter === 'not-attended' ? 'active' : ''}`}
          >
            Not Attended ({stats?.notAttended || 0})
          </button>
        </div>

        {/* Search Bar */}
        <div className="search-bar">
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Search by name, email, or ticket ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Attendance List */}
        <div className="attendance-list">
          {filteredList.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"></div>
              <p>No participants found</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Participant</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th>Attendance Time</th>
                    <th>Method</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((item) => (
                    <tr key={item._id} className={item.attended ? 'attended' : ''}>
                      <td className="ticket-id">{item.ticketId}</td>
                      <td>
                        <div className="participant-info">
                          <div className="participant-name">{item.participantName}</div>
                          <div className="participant-email">{item.participantEmail}</div>
                        </div>
                      </td>
                      <td>{item.participantContact || 'N/A'}</td>
                      <td>
                        <span className={`status-badge ${item.attended ? 'success' : 'pending'}`}>
                          {item.attended ? '✅ Attended' : '⏳ Pending'}
                        </span>
                      </td>
                      <td>
                        {item.attendanceTimestamp ? (
                          <div className="timestamp">
                            {new Date(item.attendanceTimestamp).toLocaleString()}
                          </div>
                        ) : (
                          <span className="text-muted">Not scanned</span>
                        )}
                      </td>
                      <td>
                        {item.attendanceMethod ? (
                          <span className={`method-badge ${item.attendanceMethod}`}>
                            {item.attendanceMethod === 'qr-camera' && '📷 Camera'}
                            {item.attendanceMethod === 'qr-upload' && '📤 Upload'}
                            {item.attendanceMethod === 'manual' && '✏️ Manual'}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => handleManualOverride(item._id, !item.attended)}
                          className={`btn-manual ${item.attended ? 'unmark' : 'mark'}`}
                          title={item.attended ? 'Unmark attendance' : 'Mark attendance manually'}
                        >
                          {item.attended ? '↩️ Unmark' : '✓ Mark'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Method Stats */}
        {stats?.byMethod && (stats.byMethod.qrCamera + stats.byMethod.qrUpload + stats.byMethod.manual > 0) && (
          <div className="method-stats">
            <h3>Attendance by Method</h3>
            <div className="method-breakdown">
              <div className="method-item">
                <span className="method-label">📷 Camera Scan</span>
                <span className="method-count">{stats.byMethod.qrCamera}</span>
              </div>
              <div className="method-item">
                <span className="method-label">📤 Image Upload</span>
                <span className="method-count">{stats.byMethod.qrUpload}</span>
              </div>
              <div className="method-item">
                <span className="method-label">✏️ Manual Override</span>
                <span className="method-count">{stats.byMethod.manual}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
