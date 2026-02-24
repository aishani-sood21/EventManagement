import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import ParticipantNavbar from '../components/ParticipantNavbar';
import '../styles/BrowseEvents.css';

export default function BrowseEvents() {
  const navigate = useNavigate();
  
  const [user, setUser] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [trendingEvents, setTrendingEvents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    eligibility: '',
    startDate: '',
    endDate: '',
    followedOnly: false
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
  }, [navigate]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (searchQuery) params.append('query', searchQuery);
      if (filters.type) params.append('type', filters.type);
      if (filters.eligibility) params.append('eligibility', filters.eligibility);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.followedOnly) params.append('followedOnly', 'true');

      const endpoint = searchQuery || Object.values(filters).some(v => v) 
        ? `/events/search?${params.toString()}`
        : '/events';
      
      const res = await api.get(endpoint);
      setEvents(res.data);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingEvents = async () => {
    try {
      const res = await api.get('/events/trending');
      setTrendingEvents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch events on mount and when filters change
  useEffect(() => {
    if (user) {
      const timeoutId = setTimeout(() => {
        fetchEvents();
      }, searchQuery ? 500 : 0);

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filters.type, filters.eligibility, filters.startDate, filters.endDate, filters.followedOnly, user]);

  // Fetch trending events on mount
  useEffect(() => {
    if (user) {
      fetchTrendingEvents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      eligibility: '',
      startDate: '',
      endDate: '',
      followedOnly: false
    });
    setSearchQuery('');
  };

  if (!user) return <div className="loading-container"><div className="loading-spinner"></div></div>;

  return (
    <div className="browse-events-page">
      <ParticipantNavbar />
      
      <div className="browse-events-content">
        <div className="browse-events-header">
          <h1 className="browse-events-title">
            <span></span>
            <span>Browse Events</span>
          </h1>
        </div>

        {/* Trending Events Section */}
        {trendingEvents.length > 0 && (
          <div className="trending-section">
            <h2 className="trending-header">
              <span>🔥</span>
              <span>Trending Events (Last 24h)</span>
            </h2>
            <div className="trending-grid">
              {trendingEvents.map((event) => (
                <div
                  key={event._id}
                  onClick={() => navigate(`/events/${event._id}`)}
                  className="trending-card"
                >
                  <h3 className="trending-card-title">{event.name}</h3>
                  <p className="trending-card-organizer">
                    {event.organizerId?.profile?.organizerName || 'Unknown'}
                  </p>
                  <span className="trending-card-badge">
                    {event.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="search-section">
          <div className="search-container">
            <input
              type="text"
              placeholder="🔍 Search events or organizers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button
              onClick={fetchEvents}
              className="search-button"
            >
              Search
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="filters-section">
          <h3 className="filters-header">
            <span>🎯</span>
            <span>Filters</span>
          </h3>
          
          <div className="filters-grid">
            {/* Event Type Filter */}
            <div className="filter-item">
              <label className="filter-label">Event Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({...filters, type: e.target.value})}
                className="filter-select"
              >
                <option value="">All Types</option>
                <option value="Normal">Normal</option>
                <option value="Merchandise">Merchandise</option>
                <option value="Team">Team</option>
              </select>
            </div>

            {/* Eligibility Filter */}
            <div className="filter-item">
              <label className="filter-label">Eligibility</label>
              <input
                type="text"
                placeholder="e.g., All, BTech..."
                value={filters.eligibility}
                onChange={(e) => setFilters({...filters, eligibility: e.target.value})}
                className="filter-input"
              />
            </div>

            {/* Start Date Filter */}
            <div className="filter-item">
              <label className="filter-label">From Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                className="filter-input"
              />
            </div>

            {/* End Date Filter */}
            <div className="filter-item">
              <label className="filter-label">To Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                className="filter-input"
              />
            </div>

            {/* Followed Clubs Toggle */}
            <div className="filter-checkbox-container">
              <input
                type="checkbox"
                id="followedOnly"
                checked={filters.followedOnly}
                onChange={(e) => setFilters({...filters, followedOnly: e.target.checked})}
                className="filter-checkbox"
              />
              <label htmlFor="followedOnly" className="filter-checkbox-label">
                Followed Clubs Only
              </label>
            </div>
          </div>

          {/* Clear Filters Button */}
          <button
            onClick={clearFilters}
            className="clear-filters-button"
          >
            ❌ Clear All Filters
          </button>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="loading-state">
            <div className="loading-icon">⏳</div>
            <p className="loading-text">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"></div>
            <h3 className="empty-title">No Events Found</h3>
            <p className="empty-message">Try adjusting your filters or search query</p>
          </div>
        ) : (
          <div className="events-grid">
            {events.map((event) => (
              <div
                key={event._id}
                className="event-card"
                onClick={() => navigate(`/events/${event._id}`)}
              >
                <div className="event-card-body">
                  {/* Header with badges */}
                  <div className="event-card-header">
                    <h3 className="event-card-title">
                      {event.name}
                    </h3>
                    <span className={`event-card-type-badge ${
                      event.type === 'Merchandise' 
                        ? 'event-type-merchandise' 
                        : event.type === 'Team'
                        ? 'event-type-team'
                        : 'event-type-normal'
                    }`}>
                      {event.type}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="event-card-description">
                    {event.description || 'No description available'}
                  </p>

                  {/* Event Details */}
                  <div className="event-card-details">
                    <div className="event-card-detail">
                      <span className="event-card-detail-icon">🏢</span>
                      <span className="event-card-detail-text">
                        {event.organizerId?.profile?.organizerName || 'Unknown'}
                      </span>
                    </div>
                    <div className="event-card-detail">
                      <span className="event-card-detail-icon">📅</span>
                      <span className="event-card-detail-text">
                        {formatDate(event.startDate)}
                      </span>
                    </div>
                    <div className="event-card-detail">
                      <span className="event-card-detail-icon">🎯</span>
                      <span className="event-card-detail-text">
                        {event.eligibility}
                      </span>
                    </div>
                  </div>

                  {/* Footer with tags */}
                  {event.tags && event.tags.length > 0 && (
                    <div className="event-card-tags">
                      {event.tags.slice(0, 3).map((tag: string, idx: number) => (
                        <span key={idx} className="event-card-tag">
                          #{tag}
                        </span>
                      ))}
                      {event.tags.length > 3 && (
                        <span className="event-card-tag-more">
                          +{event.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* View Details Footer */}
                <div className="event-card-footer">
                  <span className="event-card-footer-link">
                    View Details →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
