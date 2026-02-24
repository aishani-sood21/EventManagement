import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import AdminNavbar from '../components/AdminNavbar';
import SecurityDashboard from './SecurityDashboard';
import '../styles/AdminPanel.css';

export default function AdminPanel() {
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<any>(null);
  const [organizers, setOrganizers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [newCredentials, setNewCredentials] = useState<any>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, organizersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/organizers')
      ]);
      console.log('📊 Stats Response:', statsRes.data);
      console.log('🏢 Organizers Response:', organizersRes.data);
      console.log('🔢 Number of organizers:', organizersRes.data?.length);
      setStats(statsRes.data);
      setOrganizers(organizersRes.data);
    } catch (err) {
      console.error('❌ Error fetching data:', err);
    }
  };

  const filteredOrganizers = organizers.filter(org => {
    const matchesSearch = org.profile?.organizerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         org.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || org.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!window.confirm(`Are you sure you want to ${newStatus} this organizer?`)) return;
    
    try {
      await api.put(`/admin/organizers/${id}/status`, { status: newStatus });
      fetchData();
    } catch (err: any) {
      alert('Error: ' + err.response?.data?.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this organizer? This cannot be undone!')) return;
    
    try {
      await api.delete(`/admin/organizers/${id}`);
      fetchData();
    } catch (err: any) {
      alert('Error: ' + err.response?.data?.message);
    }
  };

  const handleResetPassword = async (id: string) => {
    if (!window.confirm('Reset password for this organizer?')) return;
    
    try {
      const res = await api.post(`/admin/organizers/${id}/reset-password`);
      setNewCredentials(res.data.credentials);
      setShowCredentialsModal(true);
    } catch (err: any) {
      alert('Error: ' + err.response?.data?.message);
    }
  };

  return (
    <div className="admin-panel">
      <AdminNavbar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="admin-panel-content">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && stats && (
          <div className="admin-dashboard">
            <div className="admin-dashboard-header">
              <h2 className="admin-dashboard-title">📊 System Overview</h2>
              <p className="admin-dashboard-subtitle">Monitor your event management system</p>
            </div>

            {/* Stats Grid */}
            <div className="admin-stats-grid">
              <div className="admin-stat-card organizers">
                <div className="admin-stat-icon">🏢</div>
                <div className="admin-stat-content">
                  <p className="admin-stat-label">Total Organizers</p>
                  <p className="admin-stat-value">{stats.organizers.total}</p>
                  <div className="admin-stat-breakdown">
                    <span className="stat-active">✓ {stats.organizers.active} Active</span>
                    <span className="stat-separator">|</span>
                    <span className="stat-disabled">✗ {stats.organizers.disabled} Disabled</span>
                  </div>
                </div>
              </div>
              
              <div className="admin-stat-card participants">
                <div className="admin-stat-icon">👥</div>
                <div className="admin-stat-content">
                  <p className="admin-stat-label">Total Participants</p>
                  <p className="admin-stat-value">{stats.participants}</p>
                </div>
              </div>
              
              <div className="admin-stat-card events">
                <div className="admin-stat-icon">🎯</div>
                <div className="admin-stat-content">
                  <p className="admin-stat-label">Total Events</p>
                  <p className="admin-stat-value">{stats.events.total}</p>
                  <div className="admin-stat-breakdown">
                    <span>{stats.events.draft} Draft</span>
                    <span className="stat-separator">|</span>
                    <span>{stats.events.published} Published</span>
                  </div>
                </div>
              </div>
              
              <div className="admin-stat-card revenue">
                <div className="admin-stat-icon">💰</div>
                <div className="admin-stat-content">
                  <p className="admin-stat-label">Total Revenue</p>
                  <p className="admin-stat-value">₹{stats.revenue}</p>
                  <p className="admin-stat-subtext">{stats.registrations} registrations</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="admin-quick-actions">
              <h3 className="admin-section-title">⚡ Quick Actions</h3>
              <div className="admin-actions-grid">
                <button
                  onClick={() => setActiveTab('manage')}
                  className="admin-action-card"
                >
                  <div className="admin-action-icon">🏢</div>
                  <div className="admin-action-content">
                    <h4 className="admin-action-title">Manage Organizers</h4>
                    <p className="admin-action-desc">Add, disable, or manage clubs</p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('manage');
                    setShowCreateModal(true);
                  }}
                  className="admin-action-card"
                >
                  <div className="admin-action-icon">➕</div>
                  <div className="admin-action-content">
                    <h4 className="admin-action-title">Add New Organizer</h4>
                    <p className="admin-action-desc">Create a new club/organizer account</p>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('password-resets')}
                  className="admin-action-card"
                >
                  <div className="admin-action-icon">🔑</div>
                  <div className="admin-action-content">
                    <h4 className="admin-action-title">Password Resets</h4>
                    <p className="admin-action-desc">View pending reset requests</p>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className="admin-action-card"
                >
                  <div className="admin-action-icon">🔒</div>
                  <div className="admin-action-content">
                    <h4 className="admin-action-title">Security & Bot Protection</h4>
                    <p className="admin-action-desc">Monitor security events and blocked IPs</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Security Dashboard Tab */}
        {activeTab === 'security' && (
          <SecurityDashboard />
        )}

        {/* Manage Clubs/Organizers Tab */}
        {activeTab === 'manage' && (
          <div className="admin-manage-section">
            <div className="admin-manage-header">
              <div>
                <h2 className="admin-section-title">🏢 Club/Organizer Management</h2>
                <p className="admin-section-subtitle">Manage all clubs and organizers in the system</p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="admin-btn-primary"
              >
                <span>➕</span>
                Add New Organizer
              </button>
            </div>

            {/* Filters */}
            <div className="admin-filters">
              <input
                type="text"
                placeholder="🔍 Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="admin-search-input"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="admin-filter-select"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Organizers Table */}
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrganizers.map(org => (
                    <tr key={org._id}>
                      <td className="font-semibold">
                        {org.profile?.organizerName || 'N/A'}
                      </td>
                      <td>{org.email}</td>
                      <td>
                        <span className="admin-badge category">
                          {org.profile?.category || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-badge status-${org.status || 'active'}`}>
                          {org.status || 'active'}
                        </span>
                      </td>
                      <td>
                        <div className="admin-actions">
                          {org.status === 'active' ? (
                            <button
                              onClick={() => handleStatusChange(org._id, 'disabled')}
                              className="admin-action-btn disable"
                            >
                              Disable
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusChange(org._id, 'active')}
                              className="admin-action-btn enable"
                            >
                              Enable
                            </button>
                          )}
                          <button
                            onClick={() => handleStatusChange(org._id, 'archived')}
                            className="admin-action-btn archive"
                          >
                            Archive
                          </button>
                          <button
                            onClick={() => handleResetPassword(org._id)}
                            className="admin-action-btn reset"
                          >
                            Reset PW
                          </button>
                          <button
                            onClick={() => handleDelete(org._id)}
                            className="admin-action-btn delete"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredOrganizers.length === 0 && (
              <p className="admin-empty-state">No organizers found</p>
            )}
          </div>
        )}

        {/* Password Reset Requests Tab */}
        {activeTab === 'password-resets' && (
          <div className="admin-password-resets">
            <h2 className="admin-section-title">🔑 Password Reset Requests</h2>
            
            <div className="admin-info-box">
              <div className="admin-info-icon">ℹ️</div>
              <div className="admin-info-content">
                <h3 className="admin-info-title">About Password Resets</h3>
                <p className="admin-info-text">
                  As an administrator, you can reset passwords for any organizer directly from the 
                  "Manage Clubs/Organizers" tab using the "Reset PW" button.
                </p>
                <p className="admin-info-text">
                  This section is reserved for future functionality where organizers can submit 
                  password reset requests that require admin approval.
                </p>
              </div>
            </div>

            <div className="admin-empty-state-large">
              <div className="admin-empty-icon">🔐</div>
              <h3 className="admin-empty-title">No Pending Requests</h3>
              <p className="admin-empty-text">
                There are currently no password reset requests requiring your attention.
              </p>
              <button
                onClick={() => setActiveTab('manage')}
                className="admin-btn-primary"
              >
                Go to Organizer Management
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Organizer Modal */}
      {showCreateModal && (
        <CreateOrganizerModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={(credentials: any) => {
            setShowCreateModal(false);
            setNewCredentials(credentials);
            setShowCredentialsModal(true);
            fetchData();
          }}
        />
      )}

      {/* Credentials Modal */}
      {showCredentialsModal && newCredentials && (
        <CredentialsModal
          credentials={newCredentials}
          onClose={() => {
            setShowCredentialsModal(false);
            setNewCredentials(null);
          }}
        />
      )}
    </div>
  );
}

// Create Organizer Modal
function CreateOrganizerModal({ onClose, onSuccess }: any) {
  const [organizerName, setOrganizerName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/admin/organizers', {
        organizerName,
        category,
        description,
        contactEmail: contactEmail || undefined
      });
      onSuccess(res.data.credentials);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error creating organizer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal">
        <div className="admin-modal-header">
          <h2 className="admin-modal-title">➕ Add New Club/Organizer</h2>
          <p className="admin-modal-subtitle">
            System will auto-generate credentials with @iiit.ac.in email
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="admin-modal-form">
          <div className="admin-form-group">
            <label className="admin-form-label">
              Club/Organizer Name <span className="required">*</span>
            </label>
            <input
              type="text"
              value={organizerName}
              onChange={(e) => setOrganizerName(e.target.value)}
              placeholder="e.g., Robotics Club"
              required
              className="admin-form-input"
            />
            <p className="admin-form-hint">
              This will be used to generate the login email address
            </p>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">
              Category <span className="required">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="admin-form-select"
            >
              <option value="">Select Category</option>
              <option value="Technical">Technical</option>
              <option value="Cultural">Cultural</option>
              <option value="Sports">Sports</option>
              <option value="Literature">Literature</option>
              <option value="Arts">Arts</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Brief description of the club/organizer..."
              className="admin-form-textarea"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Contact Email (Optional)</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="Public contact email for participants"
              className="admin-form-input"
            />
            <p className="admin-form-hint">
              This is for participants to contact the organizer, not for login
            </p>
          </div>

          {error && (
            <div className="admin-error-box">
              <span className="admin-error-icon">⚠️</span>
              <span className="admin-error-text">{error}</span>
            </div>
          )}

          <div className="admin-modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="admin-btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="admin-btn-primary"
            >
              {loading ? (
                <>
                  <span className="admin-btn-spinner"></span>
                  Creating...
                </>
              ) : (
                <>
                  <span>✨</span>
                  Create Organizer
                </>
              )}
            </button>
          </div>
        </form>

        <div className="admin-modal-footer">
          <div className="admin-info-badge">
            <span className="admin-info-icon">🔐</span>
            <span className="admin-info-text">
              Login credentials will be auto-generated and displayed after creation
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Credentials Display Modal
function CredentialsModal({ credentials, onClose }: any) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    const text = `Login Credentials\n\nEmail: ${credentials.email}\nPassword: ${credentials.password}\n\nShare these credentials with the organizer. They can login immediately.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal credentials-modal">
        <div className="admin-modal-header success">
          <div className="success-icon-wrapper">
            <span className="success-icon">✅</span>
          </div>
          <h2 className="admin-modal-title">Organizer Created Successfully!</h2>
          <p className="admin-modal-subtitle">
            Share these credentials with the organizer
          </p>
        </div>
        
        <div className="credentials-warning">
          <div className="credentials-warning-header">
            <span className="warning-icon">⚠️</span>
            <span className="warning-title">IMPORTANT - Save These Credentials!</span>
          </div>
          <p className="credentials-warning-text">
            These credentials will <strong>not be shown again</strong>. Make sure to copy and share them with the organizer immediately.
          </p>
        </div>

        <div className="credentials-container">
          <div className="credentials-box">
            <div className="credentials-label">
              <span className="credential-icon">📧</span>
              <span>Login Email</span>
            </div>
            <div className="credentials-value">{credentials.email}</div>
          </div>
          
          <div className="credentials-box">
            <div className="credentials-label">
              <span className="credential-icon">🔑</span>
              <span>Password</span>
            </div>
            <div className="credentials-value password">{credentials.password}</div>
          </div>
        </div>

        <div className="credentials-info">
          <div className="credentials-info-icon">ℹ️</div>
          <div className="credentials-info-text">
            <p>The organizer can login immediately with these credentials.</p>
            <p>Recommend they change their password after first login.</p>
          </div>
        </div>

        <div className="admin-modal-actions">
          <button
            onClick={copyToClipboard}
            className="admin-btn-primary"
          >
            {copied ? (
              <>
                <span>✓</span>
                Copied to Clipboard!
              </>
            ) : (
              <>
                <span>📋</span>
                Copy Credentials
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="admin-btn-secondary"
          >
            I've Saved the Credentials
          </button>
        </div>
      </div>
    </div>
  );
}
