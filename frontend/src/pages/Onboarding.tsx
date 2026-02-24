import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import '../styles/Onboarding.css';

const INTEREST_OPTIONS = [
  'Technical', 'Cultural', 'Sports', 'Literature', 
  'Gaming', 'Music', 'Dance', 'Art', 'Debate'
];

export default function Onboarding() {
  const [interests, setInterests] = useState<string[]>([]);
  const [organizers, setOrganizers] = useState<any[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrganizers();
  }, []);

  const fetchOrganizers = async () => {
    try {
      const res = await api.get('/user/organizers');
      setOrganizers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInterestChange = (interest: string) => {
    setInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleFollowChange = (orgId: string) => {
    setFollowing(prev => 
      prev.includes(orgId)
        ? prev.filter(id => id !== orgId)
        : [...prev, orgId]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put('/user/preferences', { interests, following });
      navigate('/dashboard');
    } catch (err: any) {
      alert('Error saving preferences: ' + err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <div className="onboarding-emoji"></div>
          <h1 className="onboarding-title">Welcome to Felicity!</h1>
          <p className="onboarding-subtitle">
            Help us personalize your experience by setting your preferences
          </p>
        </div>

        {/* Areas of Interest */}
        <div className="onboarding-section">
          <div className="section-header">
            <span className="section-icon"></span>
            <h2 className="section-title">Areas of Interest</h2>
          </div>
          <p className="section-subtitle">
            Selected: <span className="section-selected">
              {interests.length > 0 ? interests.join(', ') : 'None'}
            </span>
          </p>
          <div className="interests-grid">
            {INTEREST_OPTIONS.map(interest => (
              <label 
                key={interest} 
                className={`interest-item ${interests.includes(interest) ? 'selected' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={interests.includes(interest)}
                  onChange={() => handleInterestChange(interest)}
                  className="interest-checkbox"
                />
                <span className="interest-label">{interest}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Follow Organizers */}
        <div className="onboarding-section">
          <div className="section-header">
            <span className="section-icon"></span>
            <h2 className="section-title">Follow Clubs & Organizers</h2>
          </div>
          <p className="section-subtitle">
            Following: <span className="section-count">
              {following.length} club{following.length !== 1 ? 's' : ''}
            </span>
          </p>
          {organizers.length === 0 ? (
            <p className="empty-state">No organizers available yet</p>
          ) : (
            <div className="organizers-list">
              {organizers.map(org => (
                <label 
                  key={org._id}
                  className={`organizer-item ${following.includes(org._id) ? 'selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={following.includes(org._id)}
                    onChange={() => handleFollowChange(org._id)}
                    className="organizer-checkbox"
                  />
                  <div className="organizer-content">
                    <h3 className="organizer-name">
                      {org.profile?.organizerName || 'Unknown Organizer'}
                    </h3>
                    <p className="organizer-description">
                      {org.profile?.description || 'No description'}
                    </p>
                    <span className="organizer-category">
                      {org.profile?.category || 'Uncategorized'}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="onboarding-actions">
          <button
            onClick={handleSkip}
            className="btn-skip"
          >
            Skip for Now
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="btn-save"
          >
            {loading ? (
              <span className="btn-loading">
                <span className="loading-spinner"></span>
                Saving...
              </span>
            ) : (
              'Save & Continue'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}