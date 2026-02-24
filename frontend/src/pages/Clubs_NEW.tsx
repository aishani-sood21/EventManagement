import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import ParticipantNavbar from '../components/ParticipantNavbar';
import '../styles/Clubs.css';

export default function Clubs() {
  const [user, setUser] = useState<any>(null);
  const [organizers, setOrganizers] = useState<any[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const [orgsRes, profileRes] = await Promise.all([
        api.get('/user/organizers'),
        api.get('/user/profile')
      ]);
      
      setOrganizers(orgsRes.data);
      
      const userFollowing = profileRes.data.profile?.following || [];
      const followingIds = userFollowing.map((item: any) => 
        typeof item === 'object' ? item._id : item
      );
      setFollowing(followingIds);
    } catch (err) {
      console.error('Error fetching clubs:', err);
    }
  };

  const handleFollowToggle = async (orgId: string) => {
    setLoading(true);
    try {
      const newFollowing = following.includes(orgId)
        ? following.filter(id => id !== orgId)
        : [...following, orgId];
      
      await api.put('/user/preferences', { following: newFollowing });
      setFollowing(newFollowing);
    } catch (err: any) {
      console.error('Error toggling follow:', err);
      alert('Error: ' + (err.response?.data?.message || 'Failed to update'));
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', ...new Set(organizers.map(org => org.profile?.category).filter(Boolean))];

  const filteredOrganizers = organizers.filter(org => {
    const matchesSearch = org.profile?.organizerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         org.profile?.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || org.profile?.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (!user) return <div className="loading-container"><div className="loading-spinner"></div></div>;

  return (
    <div className="clubs-page">
      <ParticipantNavbar />

      <div className="clubs-content">
        <div className="clubs-header">
          <h1 className="clubs-title">
            <span>🏛️</span>
            <span>Clubs & Organizers</span>
          </h1>
        </div>

        {/* Stats Cards */}
        <div className="clubs-stats">
          <div className="stat-card">
            <p className="stat-label">Total Clubs</p>
            <h2 className="stat-value">{organizers.length}</h2>
          </div>
          <div className="stat-card">
            <p className="stat-label">Following</p>
            <h2 className="stat-value">{following.length}</h2>
          </div>
          <div className="stat-card">
            <p className="stat-label">Categories</p>
            <h2 className="stat-value">{categories.length - 1}</h2>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="search-filter-section">
          <div className="search-filter-container">
            <input
              type="text"
              placeholder="🔍 Search clubs by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="category-select"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Clubs Grid */}
        {filteredOrganizers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3 className="empty-title">No Clubs Found</h3>
            <p className="empty-message">
              {searchQuery || categoryFilter !== 'All' 
                ? 'Try adjusting your search or filter'
                : 'No clubs are available at this time'}
            </p>
          </div>
        ) : (
          <div className="clubs-grid">
            {filteredOrganizers.map(org => {
              const isFollowing = following.includes(org._id);
              return (
                <div key={org._id} className="club-card">
                  <div className="club-card-body">
                    <div className="club-card-header">
                      <h3 className="club-card-title">
                        {org.profile?.organizerName || 'Unknown Club'}
                      </h3>
                      <span className="club-card-category-badge">
                        {org.profile?.category || 'N/A'}
                      </span>
                    </div>
                    
                    <p className="club-card-description">
                      {org.profile?.description || 'No description available'}
                    </p>
                    
                    {org.profile?.contactEmail && (
                      <p className="club-card-contact">
                        <span>📧</span>
                        <span>{org.profile.contactEmail}</span>
                      </p>
                    )}
                    
                    <div className="club-card-actions">
                      <button
                        onClick={() => navigate(`/clubs/${org._id}`)}
                        className="club-view-button"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleFollowToggle(org._id)}
                        disabled={loading}
                        className={`club-follow-button ${
                          isFollowing 
                            ? 'club-follow-button-following' 
                            : 'club-follow-button-not-following'
                        }`}
                      >
                        {isFollowing ? '✓ Following' : '+ Follow'}
                      </button>
                    </div>
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
