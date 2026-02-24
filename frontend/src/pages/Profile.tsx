import { useState, useEffect } from 'react';
import api from '../utils/api';
import ParticipantNavbar from '../components/ParticipantNavbar';
import OrganizerNavbar from '../components/OrganizerNavbar';
import AdminNavbar from '../components/AdminNavbar';
import '../styles/Profile.css';

const INTEREST_OPTIONS = [
  'Technical', 'Cultural', 'Sports', 'Literature', 
  'Gaming', 'Music', 'Dance', 'Art', 'Debate'
];

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [organizers, setOrganizers] = useState<any[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  
  // Editable profile fields (Participant)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  // Editable profile fields (Organizer)
  const [organizerName, setOrganizerName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [discordWebhook, setDiscordWebhook] = useState('');
  const [isEditingOrgProfile, setIsEditingOrgProfile] = useState(false);
  
  // Password change
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchProfile();
    fetchOrganizers();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/user/profile');
      setUser(res.data);
      
      // Participant fields
      setFirstName(res.data.profile?.firstName || '');
      setLastName(res.data.profile?.lastName || '');
      setContactNumber(res.data.profile?.contactNumber || '');
      
      // Organizer fields
      setOrganizerName(res.data.profile?.organizerName || '');
      setCategory(res.data.profile?.category || '');
      setDescription(res.data.profile?.description || '');
      setContactEmail(res.data.profile?.contactEmail || '');
      setDiscordWebhook(res.data.profile?.discordWebhook || '');
      
      const userInterests = res.data.profile?.interests || [];
      setInterests(userInterests);
      
      const userFollowing = res.data.profile?.following || [];
      const followingIds = userFollowing.map((item: any) => {
        return typeof item === 'object' ? item._id : item;
      });
      setFollowing(followingIds);
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const fetchOrganizers = async () => {
    try {
      const res = await api.get('/user/organizers');
      setOrganizers(res.data);
    } catch (err) {
      console.error('Error fetching organizers:', err);
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

  const handleSaveProfile = async () => {
    setLoading(true);
    setMsg('');
    try {
      await api.put('/user/profile', { firstName, lastName, contactNumber });
      setMsg('✅ Profile updated successfully!');
      setIsEditingProfile(false);
      fetchProfile(); // Refresh
    } catch (err: any) {
      setMsg('❌ Error: ' + err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOrganizerProfile = async () => {
    setLoading(true);
    setMsg('');
    try {
      await api.put('/user/profile', { 
        organizerName, 
        category, 
        description, 
        contactEmail,
        discordWebhook 
      });
      setMsg('✅ Organizer profile updated successfully!');
      setIsEditingOrgProfile(false);
      fetchProfile(); // Refresh
    } catch (err: any) {
      setMsg('❌ Error: ' + err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setLoading(true);
    setMsg('');
    try {
      await api.put('/user/preferences', { interests, following });
      setMsg('✅ Preferences updated successfully!');
      setTimeout(() => setMsg(''), 3000);
    } catch (err: any) {
      setMsg('❌ Error: ' + err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMsg('❌ Passwords do not match!');
      return;
    }
    if (newPassword.length < 6) {
      setMsg('❌ Password must be at least 6 characters!');
      return;
    }
    
    setLoading(true);
    setMsg('');
    try {
      await api.put('/user/password', { currentPassword, newPassword });
      setMsg('✅ Password changed successfully!');
      setShowPasswordChange(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setMsg('❌ ' + (err.response?.data?.message || 'Error changing password'));
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {user?.role === 'admin' ? (
        <AdminNavbar />
      ) : user?.role === 'organizer' ? (
        <OrganizerNavbar />
      ) : (
        <ParticipantNavbar />
      )}
      
      <div className="profile-content">
        <div className="profile-header">
          <h1 className="profile-title">
            <span></span>
            My Profile
          </h1>
        </div>

        {msg && (
          <div className={`message-box ${msg.includes('✅') ? 'message-success' : 'message-error'}`}>
            {msg}
          </div>
        )}

        {/* User Info - Editable Section */}
        <div className="profile-section">
          <div className="section-header">
            <h2 className="section-title">
              <span></span>
              Account Information
            </h2>
            {!isEditingProfile && (
              <button
                onClick={() => setIsEditingProfile(true)}
                className="edit-profile-button"
              >
                <span></span>
                Edit Profile
              </button>
            )}
          </div>
          
          {isEditingProfile ? (
            <>
              <div className="form-field">
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="form-input"
                  placeholder="Enter your first name"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="form-input"
                  placeholder="Enter your last name"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Contact Number</label>
                <input
                  type="text"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="form-input"
                  placeholder="Enter your contact number"
                />
              </div>
              <div className="button-group">
                <button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="button-primary"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setIsEditingProfile(false);
                    setFirstName(user.profile?.firstName || '');
                    setLastName(user.profile?.lastName || '');
                    setContactNumber(user.profile?.contactNumber || '');
                  }}
                  className="button-secondary"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <div className="profile-info-grid">
              <div className="profile-info-item">
                <span className="profile-info-label">Name:</span>
                {user.profile?.firstName} {user.profile?.lastName}
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Email:</span>
                {user.email}
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Type:</span>
                {user.profile?.type}
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Contact:</span>
                {user.profile?.contactNumber || 'Not provided'}
              </div>
              {user.profile?.rollNumber && (
                <div className="profile-info-item">
                  <span className="profile-info-label">Roll Number:</span>
                  {user.profile.rollNumber}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Organizer-Specific Profile Section */}
        {user.role === 'organizer' && (
          <div className="profile-section">
            <div className="section-header">
              <h2 className="section-title">
                <span></span>
                Organizer Information
              </h2>
              {!isEditingOrgProfile && (
                <button
                  onClick={() => setIsEditingOrgProfile(true)}
                  className="edit-profile-button"
                >
                  <span></span>
                  Edit Profile
                </button>
              )}
            </div>
            
            {isEditingOrgProfile ? (
              <>
                <div className="form-field">
                  <label className="form-label">Organizer/Club Name *</label>
                  <input
                    type="text"
                    value={organizerName}
                    onChange={(e) => setOrganizerName(e.target.value)}
                    className="form-input"
                    placeholder="Enter your club/organizer name"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Category *</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="form-input"
                    placeholder="e.g., Technical, Cultural, Sports"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Description *</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="form-input"
                    rows={4}
                    placeholder="Describe your club/organization"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Contact Email *</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="form-input"
                    placeholder="Contact email for event inquiries"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Discord Webhook URL (Optional)</label>
                  <input
                    type="url"
                    value={discordWebhook}
                    onChange={(e) => setDiscordWebhook(e.target.value)}
                    className="form-input"
                    placeholder="https://discord.com/api/webhooks/..."
                  />
                  <p className="field-hint">
                    🔗 Add a Discord webhook to automatically post new events to your Discord server
                  </p>
                </div>
                <div className="button-group">
                  <button
                    onClick={handleSaveOrganizerProfile}
                    disabled={loading}
                    className="button-primary"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingOrgProfile(false);
                      setOrganizerName(user.profile?.organizerName || '');
                      setCategory(user.profile?.category || '');
                      setDescription(user.profile?.description || '');
                      setContactEmail(user.profile?.contactEmail || '');
                      setDiscordWebhook(user.profile?.discordWebhook || '');
                    }}
                    className="button-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div className="profile-info-grid">
                <div className="profile-info-item">
                  <span className="profile-info-label">Organizer Name:</span>
                  {user.profile?.organizerName || 'Not set'}
                </div>
                <div className="profile-info-item">
                  <span className="profile-info-label">Login Email:</span>
                  {user.email} (non-editable)
                </div>
                <div className="profile-info-item">
                  <span className="profile-info-label">Category:</span>
                  {user.profile?.category || 'Not set'}
                </div>
                <div className="profile-info-item">
                  <span className="profile-info-label">Contact Email:</span>
                  {user.profile?.contactEmail || 'Not set'}
                </div>
                <div className="profile-info-item profile-info-item-full">
                  <span className="profile-info-label">Description:</span>
                  {user.profile?.description || 'No description provided'}
                </div>
                <div className="profile-info-item profile-info-item-full">
                  <span className="profile-info-label">Discord Webhook:</span>
                  {user.profile?.discordWebhook ? (
                    <span className="discord-webhook-status">
                      ✅ Configured (events will auto-post to Discord)
                    </span>
                  ) : (
                    <span className="discord-webhook-status-empty">
                      ❌ Not configured
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Security Settings */}
        <div className="profile-section">
          <div className="section-header">
            <h2 className="section-title">
              <span></span>
              Security Settings
            </h2>
          </div>
          {!showPasswordChange ? (
            <button
              onClick={() => setShowPasswordChange(true)}
              className="button-secondary"
            >
              Change Password
            </button>
          ) : (
            <>
              <div className="form-field">
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="form-input"
                  placeholder="Enter your current password"
                />
              </div>
              <div className="form-field">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="form-input"
                  placeholder="Enter your new password (min. 6 characters)"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-input"
                  placeholder="Confirm your new password"
                />
              </div>
              <div className="button-group">
                <button
                  onClick={handleChangePassword}
                  disabled={loading}
                  className="button-danger"
                >
                  {loading ? 'Changing...' : ' Change Password'}
                </button>
                <button
                  onClick={() => {
                    setShowPasswordChange(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="button-secondary"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>

        {user.role === 'participant' && (
          <>
            {/* Interests with Checkboxes */}
            <div className="profile-section">
              <h2 className="section-title">
                <span></span>
                Areas of Interest
              </h2>
              <p className="section-subtitle">
                Select your interests to receive personalized event recommendations
              </p>
              <p className="selected-interests">
                Selected: {' '}
                <span className={interests.length > 0 ? "selected-interests-value" : "selected-interests-empty"}>
                  {interests.length > 0 ? interests.join(', ') : 'None'}
                </span>
              </p>
              <div className="interests-grid">
                {INTEREST_OPTIONS.map(interest => (
                  <label 
                    key={interest} 
                    className={`interest-checkbox-wrapper ${interests.includes(interest) ? 'interest-checkbox-wrapper-checked' : ''}`}
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

            {/* Following with Checkboxes */}
            <div className="profile-section">
              <h2 className="section-title">
                <span>👥</span>
                Clubs & Organizers to Follow
              </h2>
              <p className="section-subtitle">
                Follow clubs and organizers to stay updated with their latest events
              </p>
              <p className="following-count">
                Following: {' '}
                <span className="following-count-value">
                  {following.length} club{following.length !== 1 ? 's' : ''}
                </span>
              </p>
              {organizers.length === 0 ? (
                <p className="empty-state-text">No organizers available yet</p>
              ) : (
                <div className="organizer-list">
                  {organizers.map(org => (
                    <label 
                      key={org._id}
                      className={`organizer-checkbox-wrapper ${following.includes(org._id) ? 'organizer-checkbox-wrapper-checked' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={following.includes(org._id)}
                        onChange={() => handleFollowChange(org._id)}
                        className="organizer-checkbox"
                      />
                      <div className="organizer-info">
                        <h3 className="organizer-name">
                          {org.profile?.organizerName || 'Unknown Organizer'}
                        </h3>
                        <p className="organizer-description">
                          {org.profile?.description || 'No description available'}
                        </p>
                        <span className="organizer-category-badge">
                          {org.profile?.category || 'Uncategorized'}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="save-preferences-section">
              <button
                onClick={handleSavePreferences}
                disabled={loading}
                className="button-success"
              >
                {loading ? '⏳ Saving...' : 'Save Preferences'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}