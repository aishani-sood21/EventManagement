import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import ParticipantNavbar from '../components/ParticipantNavbar';
import '../styles/OrganizerDetail.css';

export default function OrganizerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [detailRes, profileRes] = await Promise.all([
        api.get(`/user/organizers/${id}`),
        api.get('/user/profile')
      ]);
      
      setData(detailRes.data);
      
      const userFollowing = profileRes.data.profile?.following || [];
      const followingIds = userFollowing.map((item: any) => 
        typeof item === 'object' ? item._id : item
      );
      setIsFollowing(followingIds.includes(id));
    } catch (err) {
      console.error('Error fetching organizer details:', err);
    }
  };

  const handleFollowToggle = async () => {
    setLoading(true);
    try {
      const profileRes = await api.get('/user/profile');
      const userFollowing = profileRes.data.profile?.following || [];
      const followingIds = userFollowing.map((item: any) => 
        typeof item === 'object' ? item._id : item
      );
      
      const newFollowing = isFollowing
        ? followingIds.filter((fid: string) => fid !== id)
        : [...followingIds, id];
      
      await api.put('/user/preferences', { following: newFollowing });
      setIsFollowing(!isFollowing);
    } catch (err: any) {
      alert('Error: ' + err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  if (!data) {
    return (
      <div className="organizer-detail-page">
        <ParticipantNavbar />
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  const { organizer, upcomingEvents, pastEvents } = data;

  return (
    <div className="organizer-detail-page">
      <ParticipantNavbar />
      {/* Header */}
      <div className="organizer-detail-header">
        <div className="organizer-header-container">
          <h1 className="organizer-header-title">
            {organizer.profile?.organizerName || 'Organizer Details'}
          </h1>
          <button onClick={() => navigate('/clubs')} className="back-button">
            ← Back to Clubs
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="organizer-detail-content">
        {/* Organizer Info Card */}
        <div className="organizer-info-card">
          <div className="organizer-info-header">
            <div className="organizer-info-left">
              <h2 className="organizer-name">
                {organizer.profile?.organizerName}
              </h2>
              <span className="organizer-category-badge">
                {organizer.profile?.category || 'Uncategorized'}
              </span>
            </div>
            <button
              onClick={handleFollowToggle}
              disabled={loading}
              className={`organizer-follow-button ${
                isFollowing 
                  ? 'organizer-follow-button-following' 
                  : 'organizer-follow-button-not-following'
              }`}
            >
              {isFollowing ? '✓ Following' : '+ Follow'}
            </button>
          </div>
          
          <p className="organizer-description">
            {organizer.profile?.description || 'No description available'}
          </p>
          
          {organizer.profile?.contactEmail && (
            <p className="organizer-contact">
              <span>📧 Contact:</span>
              <a 
                href={`mailto:${organizer.profile.contactEmail}`} 
                className="organizer-contact-link"
              >
                {organizer.profile.contactEmail}
              </a>
            </p>
          )}

          {/* Stats */}
          <div className="organizer-stats">
            <div className="stat-box">
              <div className="stat-value">{upcomingEvents.length}</div>
              <div className="stat-label">Upcoming Events</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{pastEvents.length}</div>
              <div className="stat-label">Past Events</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{upcomingEvents.length + pastEvents.length}</div>
              <div className="stat-label">Total Events</div>
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="events-section">
          <div className="events-section-header">
            <h3 className="events-section-title">📅 Upcoming Events</h3>
            {upcomingEvents.length > 0 && (
              <span className="events-section-count">{upcomingEvents.length}</span>
            )}
          </div>
          {upcomingEvents.length === 0 ? (
            <div className="events-empty-state">
              <div className="events-empty-icon">📅</div>
              <p className="events-empty-text">No upcoming events scheduled.</p>
            </div>
          ) : (
            <div className="events-grid">
              {upcomingEvents.map((event: any) => (
                <div key={event._id} className="event-card event-card-upcoming">
                  <div className="event-card-body">
                    <h4 className="event-card-title">{event.title}</h4>
                    <p className="event-card-description">{event.description}</p>
                    <p className="event-card-date">
                      <span>📅</span>
                      <span>
                        {new Date(event.startDateTime).toLocaleDateString()} at{' '}
                        {new Date(event.startDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </p>
                    <button
                      onClick={() => navigate(`/events/${event._id}`)}
                      className="event-card-button"
                    >
                      View Event
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past Events */}
        <div className="events-section">
          <div className="events-section-header">
            <h3 className="events-section-title">🕒 Past Events</h3>
            {pastEvents.length > 0 && (
              <span className="events-section-count">{pastEvents.length}</span>
            )}
          </div>
          {pastEvents.length === 0 ? (
            <div className="events-empty-state">
              <div className="events-empty-icon">🕒</div>
              <p className="events-empty-text">No past events.</p>
            </div>
          ) : (
            <div className="events-grid">
              {pastEvents.map((event: any) => (
                <div key={event._id} className="event-card event-card-past">
                  <div className="event-card-body">
                    <h4 className="event-card-title">{event.title}</h4>
                    <p className="event-card-description">{event.description}</p>
                    <p className="event-card-date">
                      <span>📅</span>
                      <span>
                        {new Date(event.startDateTime).toLocaleDateString()}
                      </span>
                    </p>
                    <button
                      onClick={() => navigate(`/events/${event._id}`)}
                      className="event-card-button"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}