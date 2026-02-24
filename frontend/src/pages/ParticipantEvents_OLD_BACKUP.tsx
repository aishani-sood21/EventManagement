import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import ParticipantNavbar from '../components/ParticipantNavbar';
import PaymentProofUpload from '../components/PaymentProofUpload';
import '../styles/ParticipantEvents.css';

type TabType = 'upcoming' | 'normal' | 'merchandise' | 'completed' | 'cancelled';
type SortType = 'eventDate' | 'registrationDate' | 'name';

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

  // Calculate time until event
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

  // Get stats
  const getStats = () => {
    const now = new Date();
    const total = registrations.length;
    const upcoming = registrations.filter(r => 
      new Date(r.eventId?.startDate) > now && ['Registered', 'Waitlisted'].includes(r.status)
    ).length;
    const completed = registrations.filter(r => 
      r.status === 'Completed' || (new Date(r.eventId?.startDate) < now && r.status === 'Registered')
    ).length;
    return { total, upcoming, completed };
  };

  // Filter registrations based on active tab
  const filteredRegistrations = registrations.filter(reg => {
    const now = new Date();
    const eventStart = new Date(reg.eventId?.startDate);
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const eventName = reg.eventId?.name?.toLowerCase() || '';
      const organizer = reg.eventId?.organizerId?.profile?.organizerName?.toLowerCase() || '';
      if (!eventName.includes(query) && !organizer.includes(query)) {
        return false;
      }
    }
    
    // Tab filter
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
  }).sort((a, b) => {
    // Sorting logic
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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <ParticipantNavbar />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem' }}>
        {/* TEST: If you see this purple gradient, the new page is loading! */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ 
            background: 'linear-gradient(to right, #6366f1, #a855f7, #ec4899)',
            borderRadius: '1rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: '2rem',
            color: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '3rem' }}>🎫</span>
                  ✨ NEW DESIGN - My Events ✨
                </h1>
                <p style={{ fontSize: '1.125rem', color: 'rgba(255, 255, 255, 0.9)' }}>
                  If you see this colorful gradient, the NEW page is working!
                </p>
              </div>
              <button
                onClick={() => navigate('/browse')}
                style={{
                  background: 'white',
                  color: '#6366f1',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.75rem',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                + Explore Events
              </button>
            </div>
          </div>
        </div>

        {/* Stats Summary with Inline Styles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            borderRadius: '1rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            padding: '1.5rem',
            color: 'white',
            transform: 'scale(1)',
            transition: 'transform 0.2s'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Events</p>
                <p style={{ fontSize: '2.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>{stats.total}</p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>All registrations</p>
              </div>
              <div style={{ fontSize: '3.75rem', opacity: 0.3 }}>📊</div>
            </div>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #10b981, #059669)',
            borderRadius: '1rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            padding: '1.5rem',
            color: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Upcoming</p>
                <p style={{ fontSize: '2.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>{stats.upcoming}</p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Events ahead</p>
              </div>
              <div style={{ fontSize: '3.75rem', opacity: 0.3 }}>📅</div>
            </div>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #a855f7, #ec4899)',
            borderRadius: '1rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            padding: '1.5rem',
            color: 'white'
          }}>
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

        {/* Search and Sort with Modern Design */}
        <div style={{ 
          background: 'white', 
          borderRadius: '1.5rem', 
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', 
          padding: '1.5rem', 
          marginBottom: '2rem',
          border: '1px solid #f3f4f6'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1.25rem' }}>🔍</span>
              <input
                type="text"
                placeholder="Search by event name or organizer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '3rem',
                  paddingRight: '1rem',
                  paddingTop: '0.75rem',
                  paddingBottom: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.75rem',
                  fontSize: '1rem',
                  background: '#f9fafb',
                  transition: 'all 0.2s'
                }}
              />
            </div>
            <div style={{ width: '100%' }}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortType)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.75rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  background: '#f9fafb',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <option value="eventDate">📅 Sort by Event Date</option>
                <option value="registrationDate">🕐 Sort by Registration</option>
                <option value="name">🔤 Sort by Name</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabs with Modern Design */}
        <div className="bg-white rounded-2xl shadow-lg mb-8 overflow-hidden border border-gray-100">
          <div className="flex border-b overflow-x-auto bg-gray-50">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-6 py-4 font-semibold whitespace-nowrap transition-all duration-200 ${
                activeTab === 'upcoming'
                  ? 'text-indigo-600 bg-white border-b-4 border-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-xl">📅</span>
                <span>Upcoming</span>
                <span className="ml-1 px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full text-xs font-bold">
                  {registrations.filter(r => {
                    const now = new Date();
                    const eventStart = new Date(r.eventId?.startDate);
                    return eventStart > now && ['Registered', 'Waitlisted'].includes(r.status);
                  }).length}
                </span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('normal')}
              className={`px-6 py-4 font-semibold whitespace-nowrap transition-all duration-200 ${
                activeTab === 'normal'
                  ? 'text-indigo-600 bg-white border-b-4 border-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-xl">🎯</span>
                <span>Normal</span>
                <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs font-bold">
                  {registrations.filter(r => r.eventId?.type === 'Normal').length}
                </span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('merchandise')}
              className={`px-6 py-4 font-semibold whitespace-nowrap transition-all duration-200 ${
                activeTab === 'merchandise'
                  ? 'text-indigo-600 bg-white border-b-4 border-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-xl">🛍️</span>
                <span>Merchandise</span>
                <span className="ml-1 px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full text-xs font-bold">
                  {registrations.filter(r => r.eventId?.type === 'Merchandise').length}
                </span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-6 py-4 font-semibold whitespace-nowrap transition-all duration-200 ${
                activeTab === 'completed'
                  ? 'text-indigo-600 bg-white border-b-4 border-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-xl">✅</span>
                <span>Completed</span>
                <span className="ml-1 px-2 py-0.5 bg-green-100 text-green-600 rounded-full text-xs font-bold">
                  {registrations.filter(r => {
                    const now = new Date();
                    const eventStart = new Date(r.eventId?.startDate);
                    return r.status === 'Completed' || (eventStart < now && r.status === 'Registered');
                  }).length}
                </span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('cancelled')}
              className={`px-6 py-4 font-semibold whitespace-nowrap transition-all duration-200 ${
                activeTab === 'cancelled'
                  ? 'text-indigo-600 bg-white border-b-4 border-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-xl">❌</span>
                <span>Cancelled</span>
                <span className="ml-1 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-bold">
                  {registrations.filter(r => ['Cancelled', 'Rejected'].includes(r.status)).length}
                </span>
              </span>
            </button>
          </div>
        </div>

        {/* Event Cards with Enhanced Design */}
        {filteredRegistrations.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="text-8xl mb-6">🎫</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">No events in this category</h3>
            <p className="text-gray-400 text-lg mb-6">Looks like you haven't registered for any events yet</p>
            {activeTab === 'upcoming' && registrations.length === 0 && (
              <button
                onClick={() => navigate('/browse-events')}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:shadow-2xl font-semibold transform hover:scale-105 transition-all duration-200"
              >
                Explore Events →
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredRegistrations.map((reg) => {
              const isUpcoming = new Date(reg.eventId?.startDate) > new Date();
              const canCancel = reg.status === 'Registered' && isUpcoming;
              
              return (
                <div key={reg._id} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 transform hover:-translate-y-1">
                  {/* Colored Top Border based on Event Type */}
                  <div className={`h-2 ${
                    reg.eventId?.type === 'Merchandise' 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                      : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                  }`}></div>
                  
                  <div className="p-8">
                    {/* Header with Modern Badges */}
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                          <h3 className="text-3xl font-bold text-gray-800">{reg.eventId?.name || 'Unknown Event'}</h3>
                          <span className={`text-sm px-4 py-1.5 rounded-full font-bold shadow-sm ${
                            reg.eventId?.type === 'Merchandise' 
                              ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-2 border-purple-200' 
                              : 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-2 border-blue-200'
                          }`}>
                            {reg.eventId?.type === 'Merchandise' ? '🛍️ Merchandise' : '🎯 Normal Event'}
                          </span>
                          <span className={`text-sm px-4 py-1.5 rounded-full font-bold shadow-sm ${
                            reg.status === 'Registered' ? 'bg-green-100 text-green-700 border-2 border-green-200' :
                            reg.status === 'Waitlisted' ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-200' :
                            reg.status === 'Completed' ? 'bg-gray-100 text-gray-700 border-2 border-gray-200' :
                            'bg-red-100 text-red-700 border-2 border-red-200'
                          }`}>
                            {reg.status === 'Registered' ? '✓ Registered' :
                             reg.status === 'Waitlisted' ? '⏳ Waitlisted' :
                             reg.status === 'Completed' ? '✅ Completed' :
                             reg.status === 'Cancelled' ? '❌ Cancelled' : '🚫 Rejected'}
                          </span>
                        </div>
                        {reg.eventId?.description && (
                          <p className="text-gray-600 text-base mb-4 leading-relaxed">{reg.eventId.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Event Details Grid with Modern Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">🏢</span>
                          <div>
                            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Organizer</p>
                            <p className="font-bold text-gray-800 text-sm">
                              {reg.eventId?.organizerId?.profile?.organizerName || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">📅</span>
                          <div>
                            <p className="text-xs text-purple-600 font-semibold uppercase tracking-wide">Event Date</p>
                            <p className="font-bold text-gray-800 text-sm">
                              {new Date(reg.eventId?.startDate).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                      {isUpcoming && (
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">⏰</span>
                            <div>
                              <p className="text-xs text-green-600 font-semibold uppercase tracking-wide">Time Left</p>
                              <p className="font-bold text-indigo-600 text-sm">
                                {getTimeUntilEvent(reg.eventId?.startDate)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      {reg.teamName && (
                        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-4 rounded-xl border border-orange-200">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">👥</span>
                            <div>
                              <p className="text-xs text-orange-600 font-semibold uppercase tracking-wide">Team Name</p>
                              <p className="font-bold text-gray-800 text-sm">{reg.teamName}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-4 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">📝</span>
                          <div>
                            <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Registered On</p>
                            <p className="font-bold text-gray-800 text-sm">
                              {new Date(reg.registeredAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Ticket ID - Enhanced Display */}
                    {!(reg.eventId?.type === 'Merchandise' && (!reg.paymentStatus || reg.paymentStatus === 'Pending' || reg.paymentStatus === 'Rejected')) && (
                      <div className="bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 border-4 border-indigo-300 rounded-2xl p-5 mb-6 shadow-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="text-5xl">🎫</span>
                            <div>
                              <p className="text-sm text-indigo-700 font-bold uppercase tracking-widest">Ticket ID</p>
                              <p className="text-2xl font-mono font-extrabold text-indigo-900 tracking-wide">{reg.ticketId}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => viewTicket(reg.ticketId)}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-xl font-bold text-sm transform hover:scale-105 transition-all duration-200"
                          >
                            View Details →
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Payment Status for Merchandise */}
                    {reg.eventId?.type === 'Merchandise' && (
                      <div className={`mb-4 p-4 rounded-lg border-2 ${
                        reg.paymentStatus === 'Approved' ? 'bg-green-50 border-green-300' :
                        reg.paymentStatus === 'Rejected' ? 'bg-red-50 border-red-300' :
                        reg.paymentStatus === 'Pending' ? 'bg-yellow-50 border-yellow-300' :
                        'bg-gray-50 border-gray-300'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-sm">💳 Payment Status:</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            reg.paymentStatus === 'Approved' ? 'bg-green-200 text-green-800' :
                            reg.paymentStatus === 'Rejected' ? 'bg-red-200 text-red-800' :
                            reg.paymentStatus === 'Pending' ? 'bg-yellow-200 text-yellow-800' :
                            'bg-gray-200 text-gray-800'
                          }`}>
                            {reg.paymentStatus === 'Approved' ? '✅ Approved' :
                             reg.paymentStatus === 'Rejected' ? '❌ Rejected' :
                             reg.paymentStatus === 'Pending' ? '⏳ Pending Approval' :
                             '📝 Upload Payment Proof'}
                          </span>
                        </div>
                        
                        {/* Status Messages */}
                        {reg.paymentStatus === 'Approved' && (
                          <div className="bg-green-100 border border-green-300 rounded p-2 mt-2">
                            <p className="text-xs text-green-800">
                              ✅ Your payment has been approved! Your ticket and QR code are now available.
                            </p>
                          </div>
                        )}
                        {reg.paymentStatus === 'Pending' && (
                          <div className="bg-yellow-100 border border-yellow-300 rounded p-2 mt-2">
                            <p className="text-xs text-yellow-800">
                              ⏳ Your payment proof is under review. You'll receive your ticket once approved.
                            </p>
                          </div>
                        )}
                        {(!reg.paymentStatus || reg.paymentStatus === 'Rejected') && (
                          <div className="bg-blue-100 border border-blue-300 rounded p-2 mt-2">
                            <p className="text-xs text-blue-800">
                              📝 Please upload your payment proof to receive your ticket and QR code.
                            </p>
                          </div>
                        )}
                        
                        {reg.paymentRemarks && (
                          <p className="text-xs text-gray-600 mt-2 bg-white rounded p-2 border">
                            <strong>Organizer Remarks:</strong> {reg.paymentRemarks}
                          </p>
                        )}
                        {!reg.paymentStatus || reg.paymentStatus === 'Rejected' ? (
                          <div className="mt-3">
                            <PaymentProofUpload 
                              registrationId={reg._id} 
                              onSuccess={fetchMyRegistrations}
                            />
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* Action Buttons with Enhanced Design */}
                    <div className="flex gap-3 flex-wrap">
                      <button
                        onClick={() => navigate(`/events/${reg.eventId?._id}`)}
                        className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3.5 rounded-xl hover:shadow-xl font-bold transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
                      >
                        <span>📄</span>
                        <span>View Event Details</span>
                      </button>
                      {/* Hide View Ticket button for merchandise with pending/rejected payment */}
                      {!(reg.eventId?.type === 'Merchandise' && (!reg.paymentStatus || reg.paymentStatus === 'Pending' || reg.paymentStatus === 'Rejected')) && (
                        <button
                          onClick={() => viewTicket(reg.ticketId)}
                          className="flex-1 bg-gradient-to-r from-gray-700 to-gray-800 text-white px-6 py-3.5 rounded-xl hover:shadow-xl font-bold transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
                        >
                          <span>🎫</span>
                          <span>View Ticket</span>
                        </button>
                      )}
                      {canCancel && (
                        <button
                          onClick={() => handleCancelRegistration(reg._id)}
                          className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3.5 rounded-xl hover:shadow-xl font-bold transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
                        >
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

      {/* Enhanced Ticket Modal with Modern Design */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transform transition-all">
            {/* Header with Gradient */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-10 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-white opacity-10 transform -skew-y-6"></div>
              <div className="relative z-10">
                <div className="text-7xl mb-4 animate-bounce">🎫</div>
                <h2 className="text-4xl font-extrabold mb-3">Event Ticket</h2>
                <p className="text-indigo-100 mb-4">Your digital pass to an amazing experience</p>
                <div className="bg-white text-gray-900 inline-block px-8 py-4 rounded-2xl mt-2 shadow-xl">
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-widest font-bold">Ticket ID</p>
                  <p className="text-3xl font-mono font-extrabold tracking-wider">{selectedTicket.ticketId}</p>
                </div>
              </div>
            </div>

            {/* QR Code Display */}
            <div className="flex justify-center py-6 bg-gray-50">
              {selectedTicket.qrCode ? (
                <div className="text-center">
                  <img 
                    src={selectedTicket.qrCode} 
                    alt="Ticket QR Code" 
                    className="w-64 h-64 border-4 border-indigo-300 rounded-lg shadow-lg"
                  />
                  <p className="text-sm text-gray-600 mt-3 font-semibold">📱 Scan this at the venue</p>
                  <p className="text-xs text-gray-400 mt-1">Present this QR code for entry</p>
                </div>
              ) : (
                <div className="text-center p-8">
                  <div className="w-48 h-48 bg-white border-4 border-gray-300 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <div className="text-center">
                      <div className="text-6xl mb-2">📱</div>
                      <p className="text-xs text-gray-500">QR Code</p>
                      <p className="text-xs text-gray-400">Not Generated</p>
                    </div>
                  </div>
                  {selectedTicket.eventId?.type === 'Merchandise' && (
                    <div className="bg-yellow-100 border border-yellow-300 rounded p-4 max-w-md mx-auto">
                      <p className="text-sm text-yellow-800">
                        {selectedTicket.paymentStatus === 'Pending' 
                          ? '⏳ Your payment is under review. QR code will be generated once approved.'
                          : selectedTicket.paymentStatus === 'Rejected'
                          ? '❌ Payment was rejected. Please upload a new payment proof.'
                          : '📝 Please upload payment proof to receive your QR code.'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Ticket Details */}
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Event Name</p>
                  <p className="text-lg font-bold text-gray-800">{selectedTicket.eventId?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Event Type</p>
                  <p className="text-lg font-bold text-gray-800">{selectedTicket.eventId?.type}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Participant Name</p>
                  <p className="text-lg font-bold text-gray-800">
                    {selectedTicket.participantId?.profile?.firstName} {selectedTicket.participantId?.profile?.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Email</p>
                  <p className="text-lg font-bold text-gray-800">{selectedTicket.participantId?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Registration Status</p>
                  <span className={`inline-block px-4 py-1 rounded-full font-bold text-sm ${
                    selectedTicket.status === 'Registered' ? 'bg-green-100 text-green-800' :
                    selectedTicket.status === 'Waitlisted' ? 'bg-yellow-100 text-yellow-800' :
                    selectedTicket.status === 'Completed' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {selectedTicket.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Event Date</p>
                  <p className="text-lg font-bold text-gray-800">
                    {new Date(selectedTicket.eventId?.startDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                {selectedTicket.teamName && (
                  <div className="md:col-span-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Team Name</p>
                    <p className="text-lg font-bold text-gray-800">{selectedTicket.teamName}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Registered On</p>
                  <p className="text-lg font-bold text-gray-800">
                    {new Date(selectedTicket.registeredAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Organizer</p>
                  <p className="text-lg font-bold text-gray-800">
                    {selectedTicket.eventId?.organizerId?.profile?.organizerName || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Additional Info */}
              {selectedTicket.eventId?.description && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Event Description</p>
                  <p className="text-sm text-gray-700">{selectedTicket.eventId.description}</p>
                </div>
              )}
            </div>

            {/* Footer Actions with Modern Buttons */}
            <div className="border-t-2 border-gray-100 p-8 bg-gradient-to-br from-gray-50 to-white flex gap-4">
              <button
                onClick={() => alert('Download feature coming soon!')}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:shadow-2xl font-bold transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <span className="text-xl">📥</span>
                <span>Download PDF</span>
              </button>
              <button
                onClick={() => setSelectedTicket(null)}
                className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white px-8 py-4 rounded-xl hover:shadow-2xl font-bold transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <span className="text-xl">✕</span>
                <span>Close</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}