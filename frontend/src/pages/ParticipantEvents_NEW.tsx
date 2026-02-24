import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import ParticipantNavbar from '../components/ParticipantNavbar';
import PaymentProofUpload from '../components/PaymentProofUpload';
import '../styles/ParticipantEvents.css';

type TabType = 'upcoming' | 'normal' | 'merchandise' | 'completed' | 'cancelled';
type SortType = 'eventDate' | 'registrationDate' | 'name';

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  wrapper: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '2rem',
  },
  header: {
    background: 'linear-gradient(to right, #6366f1, #a855f7, #ec4899)',
    borderRadius: '1rem',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    padding: '2rem',
    color: 'white',
    marginBottom: '2rem',
  },
  statsCard: {
    borderRadius: '1rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    padding: '1.5rem',
    color: 'white',
    transition: 'transform 0.2s',
    cursor: 'pointer',
  },
  searchBox: {
    background: 'white',
    borderRadius: '1.5rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    padding: '1.5rem',
    marginBottom: '2rem',
    border: '1px solid #f3f4f6',
  },
  input: {
    width: '100%',
    paddingLeft: '3rem',
    paddingRight: '1rem',
    paddingTop: '0.75rem',
    paddingBottom: '0.75rem',
    border: '2px solid #e5e7eb',
    borderRadius: '0.75rem',
    fontSize: '1rem',
    background: '#f9fafb',
  },
  tabsContainer: {
    background: 'white',
    borderRadius: '1.5rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    marginBottom: '2rem',
    overflow: 'hidden',
    border: '1px solid #f3f4f6',
  },
  tabButton: (isActive: boolean) => ({
    padding: '1rem 1.5rem',
    fontWeight: '600',
    whiteSpace: 'nowrap' as 'nowrap',
    transition: 'all 0.2s',
    background: isActive ? 'white' : '#f9fafb',
    color: isActive ? '#4f46e5' : '#6b7280',
    borderBottom: isActive ? '4px solid #4f46e5' : 'none',
    cursor: 'pointer',
    border: 'none',
    fontSize: '1rem',
  }),
  eventCard: {
    background: 'white',
    borderRadius: '1.5rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    border: '1px solid #f3f4f6',
    marginBottom: '1.5rem',
    transition: 'all 0.3s',
  },
  badge: (type: string) => ({
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '700',
    display: 'inline-block',
    border: '2px solid',
    ...(type === 'merchandise'
      ? {
          background: 'linear-gradient(to right, #f3e8ff, #fce7f3)',
          color: '#a855f7',
          borderColor: '#e9d5ff',
        }
      : type === 'normal'
      ? {
          background: 'linear-gradient(to right, #dbeafe, #e0e7ff)',
          color: '#3b82f6',
          borderColor: '#bfdbfe',
        }
      : type === 'registered'
      ? { background: '#d1fae5', color: '#059669', borderColor: '#a7f3d0' }
      : type === 'waitlisted'
      ? { background: '#fef3c7', color: '#d97706', borderColor: '#fde68a' }
      : type === 'completed'
      ? { background: '#f3f4f6', color: '#6b7280', borderColor: '#e5e7eb' }
      : { background: '#fee2e2', color: '#dc2626', borderColor: '#fecaca' }),
  }),
  infoCard: (gradient: string) => ({
    background: gradient,
    padding: '1rem',
    borderRadius: '0.75rem',
    border: '1px solid',
    borderColor: gradient.includes('blue') ? '#bfdbfe' : gradient.includes('purple') ? '#e9d5ff' : gradient.includes('green') ? '#a7f3d0' : '#fed7aa',
  }),
  button: (variant: 'primary' | 'secondary' | 'danger') => ({
    padding: '0.875rem 1.5rem',
    borderRadius: '0.75rem',
    fontWeight: '700',
    fontSize: '1rem',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    ...(variant === 'primary'
      ? {
          background: 'linear-gradient(to right, #4f46e5, #a855f7)',
          color: 'white',
        }
      : variant === 'secondary'
      ? {
          background: 'linear-gradient(to right, #374151, #1f2937)',
          color: 'white',
        }
      : {
          background: 'linear-gradient(to right, #ef4444, #dc2626)',
          color: 'white',
        }),
  }),
};

export default function ParticipantEvents() {
  const [user, setUser] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortType>('eventDate');
  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (userData.role !== 'participant') {
      navigate('/dashboard');
      return;
    }
    setUser(userData);
    fetchMyRegistrations();
  }, []);

  const fetchMyRegistrations = async () => {
    try {
      const res = await api.get('/registrations/my-registrations');
      setRegistrations(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelRegistration = async (regId: string) => {
    if (!window.confirm('Are you sure you want to cancel this registration?')) return;

    try {
      await api.put(`/registrations/${regId}/cancel`);
      fetchMyRegistrations();
    } catch (err: any) {
      alert('Error: ' + err.response?.data?.message);
    }
  };

  const viewTicket = async (ticketId: string) => {
    try {
      const res = await api.get(`/registrations/ticket/${ticketId}`);
      setSelectedTicket(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const getTimeUntilEvent = (startDate: string) => {
    const now = new Date();
    const eventDate = new Date(startDate);
    const diffTime = eventDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Event passed';
    if (diffDays === 0) return 'Today!';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `In ${diffDays} days`;
    if (diffDays < 30) return `In ${Math.floor(diffDays / 7)} weeks`;
    return `In ${Math.floor(diffDays / 30)} months`;
  };

  const getStats = () => {
    const now = new Date();
    const total = registrations.length;
    const upcoming = registrations.filter(
      (r) => new Date(r.eventId?.startDate) > now && ['Registered', 'Waitlisted'].includes(r.status)
    ).length;
    const completed = registrations.filter(
      (r) => r.status === 'Completed' || (new Date(r.eventId?.startDate) < now && r.status === 'Registered')
    ).length;
    return { total, upcoming, completed };
  };

  const filteredRegistrations = registrations
    .filter((reg) => {
      const now = new Date();
      const eventStart = new Date(reg.eventId?.startDate);

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const eventName = reg.eventId?.name?.toLowerCase() || '';
        const organizer = reg.eventId?.organizerId?.profile?.organizerName?.toLowerCase() || '';
        if (!eventName.includes(query) && !organizer.includes(query)) {
          return false;
        }
      }

      switch (activeTab) {
        case 'upcoming':
          return eventStart > now && ['Registered', 'Waitlisted'].includes(reg.status);
        case 'normal':
          return reg.eventId?.type === 'Normal';
        case 'merchandise':
          return reg.eventId?.type === 'Merchandise';
        case 'completed':
          return reg.status === 'Completed' || (eventStart < now && reg.status === 'Registered');
        case 'cancelled':
          return ['Cancelled', 'Rejected'].includes(reg.status);
        default:
          return true;
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'eventDate':
          return new Date(a.eventId?.startDate).getTime() - new Date(b.eventId?.startDate).getTime();
        case 'registrationDate':
          return new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime();
        case 'name':
          return (a.eventId?.name || '').localeCompare(b.eventId?.name || '');
        default:
          return 0;
      }
    });

  const stats = getStats();

  if (!user) return <div>Loading...</div>;

  return (
    <div style={styles.container}>
      <ParticipantNavbar />

      <div style={styles.wrapper}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '3rem' }}>🎫</span>
                My Events
              </h1>
              <p style={{ fontSize: '1.125rem', color: 'rgba(255, 255, 255, 0.9)' }}>Manage your registrations and track your journey</p>
            </div>
            <button onClick={() => navigate('/browse')} style={{ ...styles.button('primary'), background: 'white', color: '#4f46e5' }}>
              + Explore Events
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ ...styles.statsCard, background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }} onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.02)')} onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Events</p>
                <p style={{ fontSize: '2.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>{stats.total}</p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>All registrations</p>
              </div>
              <div style={{ fontSize: '3.75rem', opacity: 0.3 }}>📊</div>
            </div>
          </div>
          <div style={{ ...styles.statsCard, background: 'linear-gradient(135deg, #10b981, #059669)' }} onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.02)')} onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Upcoming</p>
                <p style={{ fontSize: '2.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>{stats.upcoming}</p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Events ahead</p>
              </div>
              <div style={{ fontSize: '3.75rem', opacity: 0.3 }}>📅</div>
            </div>
          </div>
          <div style={{ ...styles.statsCard, background: 'linear-gradient(135deg, #a855f7, #ec4899)' }} onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.02)')} onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completed</p>
                <p style={{ fontSize: '2.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>{stats.completed}</p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Past events</p>
              </div>
              <div style={{ fontSize: '3.75rem', opacity: 0.3 }}>✅</div>
            </div>
          </div>
        </div>

        {/* Search and Sort */}
        <div style={styles.searchBox}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1.25rem' }}>🔍</span>
              <input type="text" placeholder="Search by event name or organizer..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={styles.input} />
            </div>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortType)} style={{ ...styles.input, paddingLeft: '1rem', cursor: 'pointer', fontWeight: '600' }}>
              <option value="eventDate">📅 Sort by Event Date</option>
              <option value="registrationDate">🕐 Sort by Registration</option>
              <option value="name">🔤 Sort by Name</option>
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div style={styles.tabsContainer}>
          <div style={{ display: 'flex', overflowX: 'auto', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            {[
              { key: 'upcoming', label: 'Upcoming', icon: '📅', count: registrations.filter((r) => new Date(r.eventId?.startDate) > new Date() && ['Registered', 'Waitlisted'].includes(r.status)).length },
              { key: 'normal', label: 'Normal', icon: '🎯', count: registrations.filter((r) => r.eventId?.type === 'Normal').length },
              { key: 'merchandise', label: 'Merchandise', icon: '🛍️', count: registrations.filter((r) => r.eventId?.type === 'Merchandise').length },
              { key: 'completed', label: 'Completed', icon: '✅', count: registrations.filter((r) => r.status === 'Completed' || (new Date(r.eventId?.startDate) < new Date() && r.status === 'Registered')).length },
              { key: 'cancelled', label: 'Cancelled', icon: '❌', count: registrations.filter((r) => ['Cancelled', 'Rejected'].includes(r.status)).length },
            ].map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as TabType)} style={styles.tabButton(activeTab === tab.key)}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>{tab.icon}</span>
                  <span>{tab.label}</span>
                  <span style={{ ...styles.badge(tab.key), marginLeft: '0.5rem' }}>{tab.count}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Event Cards */}
        {filteredRegistrations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '1.5rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', border: '1px solid #f3f4f6' }}>
            <div style={{ fontSize: '6rem', marginBottom: '1.5rem' }}>🎫</div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.75rem' }}>No events in this category</h3>
            <p style={{ color: '#9ca3af', fontSize: '1.125rem', marginBottom: '1.5rem' }}>Looks like you haven't registered for any events yet</p>
            {activeTab === 'upcoming' && registrations.length === 0 && (
              <button onClick={() => navigate('/browse-events')} style={styles.button('primary')}>
                Explore Events →
              </button>
            )}
          </div>
        ) : (
          <div>
            {filteredRegistrations.map((reg) => {
              const isUpcoming = new Date(reg.eventId?.startDate) > new Date();
              const canCancel = reg.status === 'Registered' && isUpcoming;

              return (
                <div key={reg._id} style={styles.eventCard} onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')} onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}>
                  {/* Colored Top Border */}
                  <div style={{ height: '4px', background: reg.eventId?.type === 'Merchandise' ? 'linear-gradient(to right, #a855f7, #ec4899)' : 'linear-gradient(to right, #3b82f6, #6366f1)' }}></div>

                  <div style={{ padding: '2rem' }}>
                    {/* Header */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                        <h3 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937' }}>{reg.eventId?.name || 'Unknown Event'}</h3>
                        <span style={styles.badge(reg.eventId?.type === 'Merchandise' ? 'merchandise' : 'normal')}>{reg.eventId?.type === 'Merchandise' ? '🛍️ Merchandise' : '🎯 Normal'}</span>
                        <span style={styles.badge(reg.status === 'Registered' ? 'registered' : reg.status === 'Waitlisted' ? 'waitlisted' : reg.status === 'Completed' ? 'completed' : 'cancelled')}>
                          {reg.status === 'Registered' ? '✓ Registered' : reg.status === 'Waitlisted' ? '⏳ Waitlisted' : reg.status === 'Completed' ? '✅ Completed' : reg.status === 'Cancelled' ? '❌ Cancelled' : '🚫 Rejected'}
                        </span>
                      </div>
                      {reg.eventId?.description && <p style={{ color: '#6b7280', fontSize: '1rem', lineHeight: '1.6' }}>{reg.eventId.description}</p>}
                    </div>

                    {/* Details Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div style={styles.infoCard('linear-gradient(to bottom right, #dbeafe, #e0e7ff)')}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontSize: '2rem' }}>🏢</span>
                          <div>
                            <p style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: '700', textTransform: 'uppercase' }}>Organizer</p>
                            <p style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '0.875rem' }}>{reg.eventId?.organizerId?.profile?.organizerName || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                      <div style={styles.infoCard('linear-gradient(to bottom right, #f3e8ff, #fce7f3)')}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontSize: '2rem' }}>📅</span>
                          <div>
                            <p style={{ fontSize: '0.75rem', color: '#a855f7', fontWeight: '700', textTransform: 'uppercase' }}>Event Date</p>
                            <p style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '0.875rem' }}>{new Date(reg.eventId?.startDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
                          </div>
                        </div>
                      </div>
                      {isUpcoming && (
                        <div style={styles.infoCard('linear-gradient(to bottom right, #d1fae5, #a7f3d0)')}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '2rem' }}>⏰</span>
                            <div>
                              <p style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '700', textTransform: 'uppercase' }}>Time Left</p>
                              <p style={{ fontWeight: 'bold', color: '#4f46e5', fontSize: '0.875rem' }}>{getTimeUntilEvent(reg.eventId?.startDate)}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Ticket ID */}
                    {!(reg.eventId?.type === 'Merchandise' && (!reg.paymentStatus || reg.paymentStatus === 'Pending' || reg.paymentStatus === 'Rejected')) && (
                      <div style={{ background: 'linear-gradient(to right, #e0e7ff, #f3e8ff, #fce7f3)', border: '4px solid #c7d2fe', borderRadius: '1rem', padding: '1.25rem', marginBottom: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ fontSize: '3rem' }}>🎫</span>
                            <div>
                              <p style={{ fontSize: '0.75rem', color: '#4f46e5', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Ticket ID</p>
                              <p style={{ fontSize: '1.5rem', fontFamily: 'monospace', fontWeight: 'bold', color: '#312e81', letterSpacing: '0.05em' }}>{reg.ticketId}</p>
                            </div>
                          </div>
                          <button onClick={() => viewTicket(reg.ticketId)} style={{ ...styles.button('primary'), padding: '0.75rem 1.25rem' }}>
                            View Details →
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Payment Status for Merchandise */}
                    {reg.eventId?.type === 'Merchandise' && (
                      <div style={{ marginBottom: '1.5rem', padding: '1rem', borderRadius: '0.75rem', border: '2px solid', ...(reg.paymentStatus === 'Approved' ? { background: '#d1fae5', borderColor: '#a7f3d0' } : reg.paymentStatus === 'Rejected' ? { background: '#fee2e2', borderColor: '#fecaca' } : reg.paymentStatus === 'Pending' ? { background: '#fef3c7', borderColor: '#fde68a' } : { background: '#f3f4f6', borderColor: '#e5e7eb' }) }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: '700', fontSize: '0.875rem' }}>💳 Payment Status:</span>
                          <span style={{ ...styles.badge(reg.paymentStatus === 'Approved' ? 'registered' : reg.paymentStatus === 'Pending' ? 'waitlisted' : 'cancelled'), padding: '0.25rem 0.75rem' }}>{reg.paymentStatus === 'Approved' ? '✅ Approved' : reg.paymentStatus === 'Rejected' ? '❌ Rejected' : reg.paymentStatus === 'Pending' ? '⏳ Pending' : '📝 Upload Required'}</span>
                        </div>
                        {!reg.paymentStatus || reg.paymentStatus === 'Rejected' ? (
                          <div style={{ marginTop: '0.75rem' }}>
                            <PaymentProofUpload registrationId={reg._id} onSuccess={fetchMyRegistrations} />
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <button onClick={() => navigate(`/events/${reg.eventId?._id}`)} style={{ ...styles.button('primary'), flex: 1 }}>
                        <span>📄</span>
                        <span>View Event</span>
                      </button>
                      {!(reg.eventId?.type === 'Merchandise' && (!reg.paymentStatus || reg.paymentStatus === 'Pending' || reg.paymentStatus === 'Rejected')) && (
                        <button onClick={() => viewTicket(reg.ticketId)} style={{ ...styles.button('secondary'), flex: 1 }}>
                          <span>🎫</span>
                          <span>View Ticket</span>
                        </button>
                      )}
                      {canCancel && (
                        <button onClick={() => handleCancelRegistration(reg._id)} style={styles.button('danger')}>
                          <span>❌</span>
                          <span>Cancel</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ticket Modal */}
      {selectedTicket && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxWidth: '56rem', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            {/* Modal Header */}
            <div style={{ background: 'linear-gradient(to right, #4f46e5, #a855f7, #ec4899)', color: 'white', padding: '2.5rem', textAlign: 'center', position: 'relative' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎫</div>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>Event Ticket</h2>
              <p style={{ color: 'rgba(255, 255, 255, 0.9)', marginBottom: '1rem' }}>Your digital pass to an amazing experience</p>
              <div style={{ background: 'white', color: '#1f2937', display: 'inline-block', padding: '1rem 2rem', borderRadius: '1rem', marginTop: '0.5rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.1em' }}>Ticket ID</p>
                <p style={{ fontSize: '2rem', fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '0.1em' }}>{selectedTicket.ticketId}</p>
              </div>
            </div>

            {/* QR Code */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem', background: '#f9fafb' }}>
              {selectedTicket.qrCode ? (
                <div style={{ textAlign: 'center' }}>
                  <img src={selectedTicket.qrCode} alt="Ticket QR Code" style={{ width: '16rem', height: '16rem', border: '4px solid #c7d2fe', borderRadius: '0.75rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.75rem', fontWeight: '700' }}>📱 Scan this at the venue</p>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div style={{ width: '12rem', height: '12rem', background: 'white', border: '4px solid #d1d5db', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                    <div>
                      <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>📱</div>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>QR Code Not Generated</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Details */}
            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                {[
                  { label: 'Event Name', value: selectedTicket.eventId?.name },
                  { label: 'Event Type', value: selectedTicket.eventId?.type },
                  { label: 'Participant', value: `${selectedTicket.participantId?.profile?.firstName} ${selectedTicket.participantId?.profile?.lastName}` },
                  { label: 'Email', value: selectedTicket.participantId?.email },
                  { label: 'Status', value: selectedTicket.status },
                  { label: 'Event Date', value: new Date(selectedTicket.eventId?.startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
                ].map((item, idx) => (
                  <div key={idx}>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>{item.label}</p>
                    <p style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1f2937' }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div style={{ borderTop: '2px solid #f3f4f6', padding: '2rem', background: 'linear-gradient(to bottom right, #f9fafb, white)', display: 'flex', gap: '1rem' }}>
              <button onClick={() => alert('Download feature coming soon!')} style={{ ...styles.button('primary'), flex: 1 }}>
                <span>📥</span>
                <span>Download PDF</span>
              </button>
              <button onClick={() => setSelectedTicket(null)} style={{ ...styles.button('secondary'), flex: 1 }}>
                <span>✕</span>
                <span>Close</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
