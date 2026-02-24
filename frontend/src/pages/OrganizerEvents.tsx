import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import OrganizerNavbar from '../components/OrganizerNavbar';
import '../styles/OrganizerEvents.css';

export default function OrganizerEvents() {
  const [events, setEvents] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'organizer') {
      navigate('/dashboard');
      return;
    }
    fetchMyEvents();
  }, []);

  const fetchMyEvents = async () => {
    try {
      const res = await api.get('/events/my-events');
      setEvents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;
    
    try {
      await api.delete(`/events/${eventId}`);
      alert('Event deleted successfully!');
      fetchMyEvents();
    } catch (err: any) {
      alert('Error deleting event: ' + (err.response?.data?.message || 'Unknown error'));
    }
  };

  return (
    <div className="organizer-events-page">
      <OrganizerNavbar />
      
      {/* Header */}
      <div className="organizer-events-header">
        <div className="organizer-events-header-content">
          <div className="organizer-events-title-section">
            <h1 className="organizer-events-title">
              <span>🎯</span>
              <span>My Events</span>
            </h1>
            <p className="organizer-events-subtitle">
              Manage all your events in one place
            </p>
          </div>
          <div className="organizer-events-actions">
            <button 
              onClick={() => navigate('/create-event')}
              className="create-event-btn"
            >
              <span>+</span>
              <span>Create Event</span>
            </button>
            <button 
              onClick={() => navigate('/dashboard')}
              className="back-to-dashboard-btn"
            >
              ← Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="organizer-events-content">
        {events.length === 0 ? (
          <div className="organizer-events-empty">
            <div className="organizer-events-empty-icon">🎪</div>
            <h2 className="organizer-events-empty-title">No Events Yet</h2>
            <p className="organizer-events-empty-text">
              Start creating amazing events and engage with your participants!
            </p>
            <button 
              onClick={() => navigate('/create-event')}
              className="organizer-events-empty-btn"
            >
              + Create Your First Event
            </button>
          </div>
        ) : (
          <div className="organizer-events-grid">
            {events.map(event => {
              return (
                <div key={event._id} className="organizer-event-card">
                  {/* Card Header */}
                  <div className="organizer-event-card-header">
                    <div className="organizer-event-card-title-row">
                      <h3 className="organizer-event-card-title">{event.name}</h3>
                      <span className="organizer-event-type-badge">
                        {event.type === 'Merchandise' ? '🛍️ Merch' : event.type === 'Team' ? '👥 Team' : '🎯 Event'}
                      </span>
                    </div>
                    <p className="organizer-event-card-description">{event.description}</p>
                  </div>

                  {/* Card Body */}
                  <div className="organizer-event-card-body">
                    <div className="organizer-event-info-grid">
                      <div className="organizer-event-info-item">
                        <span className="organizer-event-info-label">📅 Start Date</span>
                        <span className="organizer-event-info-value">
                          {new Date(event.startDate).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric' 
                          })}
                        </span>
                      </div>

                      <div className="organizer-event-info-item">
                        <span className="organizer-event-info-label">⏰ Deadline</span>
                        <span className="organizer-event-info-value">
                          {new Date(event.registrationDeadline).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>

                      <div className="organizer-event-info-item">
                        <span className="organizer-event-info-label">👥 Registered</span>
                        <span className="organizer-event-info-value">
                          {event.registeredParticipants?.length || 0}
                          {event.registrationLimit ? ` / ${event.registrationLimit}` : ''}
                        </span>
                      </div>

                      <div className="organizer-event-info-item">
                        <span className="organizer-event-info-label">💰 Fee</span>
                        <span className="organizer-event-info-value">
                          ₹{event.registrationFee || 0}
                        </span>
                      </div>
                    </div>

                    {/* Tags */}
                    {event.tags && event.tags.length > 0 && (
                      <div className="organizer-event-tags">
                        {event.tags.map((tag: string, i: number) => (
                          <span key={i} className="organizer-event-tag">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="organizer-event-card-actions">
                    <button 
                      onClick={() => navigate(`/organizer/event/${event._id}`)}
                      className="organizer-event-action-btn organizer-event-action-btn-view"
                    >
                      <span>📊</span>
                      <span>Details</span>
                    </button>
                    <button 
                      onClick={() => navigate(`/events/edit/${event._id}`)}
                      className="organizer-event-action-btn organizer-event-action-btn-edit"
                    >
                      <span>✏️</span>
                      <span>Edit</span>
                    </button>
                    <button 
                      onClick={() => handleDelete(event._id)}
                      className="organizer-event-action-btn organizer-event-action-btn-delete"
                    >
                      <span>🗑️</span>
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
