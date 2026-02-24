import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import ParticipantNavbar from '../components/ParticipantNavbar';
import OrganizerNavbar from '../components/OrganizerNavbar';
import '../styles/Dashboard.css';

type TabType = 'upcoming' | 'normal' | 'merchandise' | 'completed' | 'cancelled';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [showPreferencesBanner, setShowPreferencesBanner] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Organizer-specific state
  const [organizerEvents, setOrganizerEvents] = useState<any[]>([]);
  const [organizerStats, setOrganizerStats] = useState({
    totalEvents: 0,
    totalRegistrations: 0,
    totalRevenue: 0,
    upcomingEvents: 0
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
    
    if (userData.role === 'admin') {
      // Redirect admin to admin panel
      navigate('/admin');
      return;
    } else if (userData.role === 'organizer') {
      fetchOrganizerDashboard();
    } else {
      fetchMyRegistrations();
      checkPreferences();
    }
  }, []);

  const checkPreferences = async () => {
    try {
      const res = await api.get('/user/profile');
      const hasInterests = res.data.profile?.interests?.length > 0;
      const hasFollowing = res.data.profile?.following?.length > 0;
      
      if (res.data.role === 'participant' && !hasInterests && !hasFollowing) {
        setShowPreferencesBanner(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrganizerDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/events/my-events');
      const events = res.data;
      setOrganizerEvents(events);

      // Calculate stats
      const now = new Date();
      const upcoming = events.filter((e: any) => new Date(e.startDate) > now);
      
      let totalRegs = 0;
      let totalRev = 0;
      
      for (const event of events) {
        const regCount = event.registeredParticipants?.length || 0;
        totalRegs += regCount;
        totalRev += regCount * (event.registrationFee || 0);
      }

      setOrganizerStats({
        totalEvents: events.length,
        totalRegistrations: totalRegs,
        totalRevenue: totalRev,
        upcomingEvents: upcoming.length
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRegistrations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/registrations/my-registrations');
      setRegistrations(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredRegistrations = () => {
    const now = new Date();
    
    switch (activeTab) {
      case 'upcoming':
        return registrations.filter(reg => 
          (reg.status === 'Registered' || reg.status === 'Waitlisted') && 
          new Date(reg.eventId?.startDate) > now
        );
      case 'normal':
        return registrations.filter(reg => 
          reg.eventId?.type === 'Normal' && 
          (reg.status === 'Registered' || reg.status === 'Completed')
        );
      case 'merchandise':
        return registrations.filter(reg => 
          reg.eventId?.type === 'Merchandise'
        );
      case 'completed':
        return registrations.filter(reg => 
          reg.status === 'Completed' || 
          (reg.status === 'Registered' && new Date(reg.eventId?.endDate) < now)
        );
      case 'cancelled':
        return registrations.filter(reg => 
          reg.status === 'Cancelled' || reg.status === 'Rejected'
        );
      default:
        return registrations;
    }
  };

  const filteredRegistrations = getFilteredRegistrations();

  const getStatusClassName = (status: string) => {
    switch (status.toLowerCase()) {
      case 'registered':
        return 'status-badge status-registered';
      case 'waitlisted':
        return 'status-badge status-waitlisted';
      case 'completed':
        return 'status-badge status-completed';
      case 'cancelled':
      case 'rejected':
        return 'status-badge status-cancelled';
      default:
        return 'status-badge';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!user) return <div className="loading-container"><div className="loading-spinner"></div></div>;

  // Organizer Dashboard
  if (user.role === 'organizer') {
    return (
      <div className="dashboard-page">
        <OrganizerNavbar />
        
        <div className="dashboard-content">
          <div className="dashboard-header">
            <h2 className="dashboard-title">Organizer Dashboard</h2>
            <button onClick={fetchOrganizerDashboard} className="refresh-button">
              🔄 Refresh
            </button>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
            </div>
          ) : (
            <>
              {/* Analytics Cards */}
              <div className="organizer-stats-grid">
                <div className="stat-card stat-card-blue">
                  <div className="stat-icon">📊</div>
                  <div className="stat-content">
                    <div className="stat-label">Total Events</div>
                    <div className="stat-value">{organizerStats.totalEvents}</div>
                  </div>
                </div>
                <div className="stat-card stat-card-green">
                  <div className="stat-icon">👥</div>
                  <div className="stat-content">
                    <div className="stat-label">Total Registrations</div>
                    <div className="stat-value">{organizerStats.totalRegistrations}</div>
                  </div>
                </div>
                <div className="stat-card stat-card-purple">
                  <div className="stat-icon">💰</div>
                  <div className="stat-content">
                    <div className="stat-label">Total Revenue</div>
                    <div className="stat-value">₹{organizerStats.totalRevenue.toLocaleString()}</div>
                  </div>
                </div>
                <div className="stat-card stat-card-orange">
                  <div className="stat-icon">📅</div>
                  <div className="stat-content">
                    <div className="stat-label">Upcoming Events</div>
                    <div className="stat-value">{organizerStats.upcomingEvents}</div>
                  </div>
                </div>
              </div>

              {/* Events Carousel */}
              <div className="events-section">
                <div className="events-section-header">
                  <h3 className="events-section-title">My Events</h3>
                  <button 
                    onClick={() => navigate('/organizer/events')} 
                    className="view-all-button"
                  >
                    View All Events →
                  </button>
                </div>

                {organizerEvents.length === 0 ? (
                  <div className="dashboard-empty-state">
                    <div className="empty-icon">🎪</div>
                    <h3 className="empty-title">No Events Created Yet</h3>
                    <p className="empty-message">
                      Create your first event to start managing registrations and engaging with participants.
                    </p>
                    <button 
                      onClick={() => navigate('/organizer/events')} 
                      className="create-event-button"
                    >
                      + Create Event
                    </button>
                  </div>
                ) : (
                  <div className="events-carousel">
                    {organizerEvents.map((event) => {
                      const now = new Date();
                      const isUpcoming = new Date(event.startDate) > now;
                      const isPast = new Date(event.endDate) < now;
                      const registrationCount = event.registeredParticipants?.length || 0;
                      const registrationPercentage = event.registrationLimit 
                        ? Math.round((registrationCount / event.registrationLimit) * 100)
                        : 0;

                      // Determine event status
                      let eventStatus = event.status || 'Draft';
                      if (isPast) {
                        eventStatus = 'Closed';
                      } else if (isUpcoming && new Date(event.startDate) <= new Date(Date.now() + 24 * 60 * 60 * 1000)) {
                        eventStatus = 'Ongoing';
                      } else if (event.status === 'Published') {
                        eventStatus = 'Published';
                      }

                      return (
                        <div key={event._id} className="event-card">
                          <div className="event-card-header">
                            <h4 className="event-card-title">{event.name}</h4>
                            <span className={`event-type-badge ${event.type === 'Merchandise' ? 'badge-merchandise' : 'badge-normal'}`}>
                              {event.type}
                            </span>
                          </div>
                          
                          <div className="event-status-container">
                            <span className={`event-status-badge status-${eventStatus.toLowerCase()}`}>
                              {eventStatus}
                            </span>
                          </div>
                          
                          <p className="event-card-description">{event.description}</p>
                          
                          <div className="event-card-stats">
                            <div className="event-stat">
                              <span className="event-stat-label">📅 Start Date</span>
                              <span className="event-stat-value">
                                {new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            </div>
                            <div className="event-stat">
                              <span className="event-stat-label">👥 Registrations</span>
                              <span className="event-stat-value">
                                {registrationCount} / {event.registrationLimit || '∞'}
                              </span>
                            </div>
                            <div className="event-stat">
                              <span className="event-stat-label">💰 Revenue</span>
                              <span className="event-stat-value">
                                ₹{(registrationCount * (event.registrationFee || 0)).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          {event.registrationLimit && (
                            <div className="registration-progress">
                              <div className="progress-bar-bg">
                                <div 
                                  className="progress-bar-fill"
                                  style={{ width: `${registrationPercentage}%` }}
                                />
                              </div>
                              <span className="progress-text">{registrationPercentage}% full</span>
                            </div>
                          )}

                          <div className="event-card-footer">
                            {isUpcoming && (
                              <span className="upcoming-badge">🔥 Upcoming</span>
                            )}
                            <button 
                              onClick={() => navigate(`/organizer/event/${event._id}`)}
                              className="event-detail-button"
                            >
                              View Details →
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Participant Dashboard

  return (
    <div className="dashboard-page">
      {user?.role === 'organizer' ? <OrganizerNavbar /> : <ParticipantNavbar />}

      {showPreferencesBanner && (
        <div className="preferences-banner">
          <div className="preferences-banner-content">
            <div className="banner-info">
              <span className="banner-icon">⚠️</span>
              <div>
                <p className="banner-text-title">
                  Set your preferences to get personalized event recommendations!
                </p>
                <p className="banner-text-subtitle">
                  Tell us your interests and follow clubs you like.
                </p>
              </div>
            </div>
            <button onClick={() => navigate('/profile')} className="banner-button">
              Set Now
            </button>
          </div>
        </div>
      )}

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h2 className="dashboard-title">My Events Dashboard</h2>
          <button onClick={fetchMyRegistrations} className="refresh-button">
            🔄 Refresh
          </button>
        </div>

        <div className="tabs-container">
          <button 
            className={activeTab === 'upcoming' ? 'tab-button tab-active' : 'tab-button'}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming Events
          </button>
          <button 
            className={activeTab === 'normal' ? 'tab-button tab-active' : 'tab-button'}
            onClick={() => setActiveTab('normal')}
          >
            Normal
          </button>
          <button 
            className={activeTab === 'merchandise' ? 'tab-button tab-active' : 'tab-button'}
            onClick={() => setActiveTab('merchandise')}
          >
            Merchandise
          </button>
          <button 
            className={activeTab === 'completed' ? 'tab-button tab-active' : 'tab-button'}
            onClick={() => setActiveTab('completed')}
          >
            Completed
          </button>
          <button 
            className={activeTab === 'cancelled' ? 'tab-button tab-active' : 'tab-button'}
            onClick={() => setActiveTab('cancelled')}
          >
            Cancelled/Rejected
          </button>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <div className="dashboard-empty-state">
            <div className="empty-icon">📅</div>
            <h3 className="empty-title">No Events Found</h3>
            <p className="empty-message">
              {activeTab === 'upcoming' && "You don't have any upcoming events. Browse and register for events!"}
              {activeTab === 'normal' && "You haven't registered for any normal events yet."}
              {activeTab === 'merchandise' && "You haven't registered for any merchandise events yet."}
              {activeTab === 'completed' && "You don't have any completed events yet."}
              {activeTab === 'cancelled' && "You don't have any cancelled or rejected registrations."}
            </p>
          </div>
        ) : (
          <div className="registrations-table-container">
            <table className="registrations-table">
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Type</th>
                  <th>Organizer</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Team Name</th>
                  <th>Payment Status</th>
                  <th>Ticket ID</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.map((registration) => {
                  // For merchandise without approved payment, clicking should go to My Events for payment upload
                  const needsPayment = registration.eventId?.type === 'Merchandise' && 
                                      registration.paymentStatus !== 'Approved';
                  
                  return (
                    <tr 
                      key={registration._id} 
                      className="registration-row clickable-row"
                      onClick={() => needsPayment ? navigate('/my-events') : navigate(`/events/${registration.eventId?._id}`)}
                      style={{ cursor: 'pointer' }}
                      title={needsPayment ? 'Click to upload payment proof in My Events' : 'Click to view event details'}
                    >
                      <td className="event-name-cell">
                        {registration.eventId?.name || 'N/A'}
                      </td>
                    <td>
                      <span className="type-badge">{registration.eventId?.type || 'N/A'}</span>
                    </td>
                    <td className="organizer-cell">
                      {registration.eventId?.organizerName || 
                       registration.eventId?.organizerId?.profile?.organizerName || 
                       'N/A'}
                    </td>
                    <td className="date-cell">
                      {registration.eventId?.startDate 
                        ? formatDate(registration.eventId.startDate)
                        : 'N/A'}
                    </td>
                    <td>
                      <span className={getStatusClassName(registration.status)}>
                        {registration.status}
                      </span>
                    </td>
                    <td className="team-name-cell">
                      {registration.teamName || '-'}
                    </td>
                    <td>
                      {registration.eventId?.type === 'Merchandise' ? (
                        <span className={`payment-status-badge ${
                          registration.paymentStatus === 'Approved' ? 'payment-approved' :
                          registration.paymentStatus === 'Pending' ? 'payment-pending' :
                          registration.paymentStatus === 'Rejected' ? 'payment-rejected' :
                          'payment-required'
                        }`}>
                          {registration.paymentStatus === 'Approved' ? '✅ Approved' :
                           registration.paymentStatus === 'Pending' ? '⏳ Pending' :
                           registration.paymentStatus === 'Rejected' ? '❌ Rejected' :
                           '📝 Upload Required'}
                        </span>
                      ) : (
                        <span className="payment-status-badge payment-na">N/A</span>
                      )}
                    </td>
                    <td>
                      {/* Only show ticket ID if it's not merchandise OR payment is approved */}
                      {registration.eventId?.type !== 'Merchandise' || registration.paymentStatus === 'Approved' ? (
                        <span className="ticket-id-display" title="Click row to view full ticket details">
                          {registration.ticketId}
                        </span>
                      ) : (
                        <span className="ticket-pending" title="Ticket will be available after payment approval">
                          {registration.paymentStatus === 'Pending' ? '⏳ Pending Approval' :
                           registration.paymentStatus === 'Rejected' ? '❌ Payment Rejected' :
                           '📸 Upload Payment Proof'}
                        </span>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
