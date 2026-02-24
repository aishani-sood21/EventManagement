import { useEffect, useState } from 'react';
import api from '../utils/api';
import '../styles/SecurityDashboard.css';

interface SecurityLog {
  _id: string;
  ipAddress: string;
  action: string;
  email?: string;
  timestamp: string;
  userAgent?: string;
  success: boolean;
  reason?: string;
}

interface BlockedIP {
  _id: string;
  ipAddress: string;
  reason: string;
  blockedAt: string;
  blockedUntil?: string;
  failedAttempts: number;
  permanent: boolean;
}

interface SecurityStats {
  totalBlocked: number;
  failedLoginsLast24h: number;
  failedLoginsLast7d: number;
  successfulLoginsLast24h: number;
  registrationsLast24h: number;
  blockedAttemptsLast24h: number;
}

export default function SecurityDashboard() {
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [activeTab, setActiveTab] = useState<'stats' | 'logs' | 'blocked'>('stats');
  const [filterAction, setFilterAction] = useState('');
  const [loading, setLoading] = useState(true);
  const [blockIPForm, setBlockIPForm] = useState({
    ipAddress: '',
    reason: '',
    permanent: false,
    durationHours: 24
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, logsRes, blockedRes] = await Promise.all([
        api.get('/security/stats'),
        api.get('/security/logs?limit=100'),
        api.get('/security/blocked-ips')
      ]);
      
      setStats(statsRes.data);
      setLogs(logsRes.data.logs);
      setBlockedIPs(blockedRes.data);
    } catch (err) {
      console.error('Error fetching security data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockIP = async (ipAddress: string) => {
    if (!confirm(`Are you sure you want to unblock ${ipAddress}?`)) return;
    
    try {
      await api.delete(`/security/blocked-ips/${ipAddress}`);
      fetchData();
    } catch (err) {
      console.error('Error unblocking IP:', err);
    }
  };

  const handleBlockIP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await api.post('/security/block-ip', blockIPForm);
      setBlockIPForm({
        ipAddress: '',
        reason: '',
        permanent: false,
        durationHours: 24
      });
      fetchData();
    } catch (err) {
      console.error('Error blocking IP:', err);
    }
  };

  const getActionBadge = (action: string) => {
    const classes = {
      'login_success': 'badge-success',
      'login_failure': 'badge-danger',
      'registration_success': 'badge-success',
      'registration_attempt': 'badge-warning',
      'blocked': 'badge-danger'
    };
    
    return (
      <span className={`badge ${classes[action as keyof typeof classes] || 'badge-secondary'}`}>
        {action.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const filteredLogs = filterAction 
    ? logs.filter(log => log.action === filterAction)
    : logs;

  if (loading) {
    return <div className="security-loading">Loading security dashboard...</div>;
  }

  return (
    <div className="security-dashboard">
      <div className="security-header">
        <h2>🔒 Security & Bot Protection Dashboard</h2>
        <p>Monitor suspicious activity, blocked IPs, and security events</p>
      </div>

      {/* Navigation Tabs */}
      <div className="security-tabs">
        <button
          className={`security-tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 Statistics
        </button>
        <button
          className={`security-tab ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          📋 Security Logs
        </button>
        <button
          className={`security-tab ${activeTab === 'blocked' ? 'active' : ''}`}
          onClick={() => setActiveTab('blocked')}
        >
          🚫 Blocked IPs
        </button>
      </div>

      {/* Statistics Tab */}
      {activeTab === 'stats' && stats && (
        <div className="security-stats">
          <div className="stat-card">
            <div className="stat-icon">🚫</div>
            <div className="stat-value">{stats.totalBlocked}</div>
            <div className="stat-label">Total Blocked IPs</div>
          </div>
          
          <div className="stat-card danger">
            <div className="stat-icon">❌</div>
            <div className="stat-value">{stats.failedLoginsLast24h}</div>
            <div className="stat-label">Failed Logins (24h)</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-value">{stats.failedLoginsLast7d}</div>
            <div className="stat-label">Failed Logins (7d)</div>
          </div>
          
          <div className="stat-card success">
            <div className="stat-icon">✅</div>
            <div className="stat-value">{stats.successfulLoginsLast24h}</div>
            <div className="stat-label">Successful Logins (24h)</div>
          </div>
          
          <div className="stat-card success">
            <div className="stat-icon">📝</div>
            <div className="stat-value">{stats.registrationsLast24h}</div>
            <div className="stat-label">Registrations (24h)</div>
          </div>
          
          <div className="stat-card warning">
            <div className="stat-icon">🛡️</div>
            <div className="stat-value">{stats.blockedAttemptsLast24h}</div>
            <div className="stat-label">Blocked Attempts (24h)</div>
          </div>
        </div>
      )}

      {/* Security Logs Tab */}
      {activeTab === 'logs' && (
        <div className="security-logs">
          <div className="logs-header">
            <h3>Recent Security Events</h3>
            <select 
              value={filterAction} 
              onChange={(e) => setFilterAction(e.target.value)}
              className="logs-filter"
            >
              <option value="">All Actions</option>
              <option value="login_success">Login Success</option>
              <option value="login_failure">Login Failure</option>
              <option value="registration_success">Registration Success</option>
              <option value="blocked">Blocked Attempts</option>
            </select>
          </div>
          
          <div className="logs-table-container">
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>IP Address</th>
                  <th>Action</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log._id}>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                    <td><code>{log.ipAddress}</code></td>
                    <td>{getActionBadge(log.action)}</td>
                    <td>{log.email || '-'}</td>
                    <td>
                      {log.success ? (
                        <span className="status-success">✓ Success</span>
                      ) : (
                        <span className="status-failure">✗ Failed</span>
                      )}
                    </td>
                    <td>{log.reason || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Blocked IPs Tab */}
      {activeTab === 'blocked' && (
        <div className="blocked-ips">
          <div className="block-ip-form">
            <h3>Manually Block IP Address</h3>
            <form onSubmit={handleBlockIP}>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="IP Address (e.g., 192.168.1.1)"
                  value={blockIPForm.ipAddress}
                  onChange={(e) => setBlockIPForm({ ...blockIPForm, ipAddress: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Reason"
                  value={blockIPForm.reason}
                  onChange={(e) => setBlockIPForm({ ...blockIPForm, reason: e.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <label>
                  <input
                    type="checkbox"
                    checked={blockIPForm.permanent}
                    onChange={(e) => setBlockIPForm({ ...blockIPForm, permanent: e.target.checked })}
                  />
                  Permanent Block
                </label>
                {!blockIPForm.permanent && (
                  <input
                    type="number"
                    placeholder="Duration (hours)"
                    value={blockIPForm.durationHours}
                    onChange={(e) => setBlockIPForm({ ...blockIPForm, durationHours: Number(e.target.value) })}
                    min="1"
                  />
                )}
                <button type="submit" className="btn-block">Block IP</button>
              </div>
            </form>
          </div>

          <div className="blocked-list">
            <h3>Currently Blocked IPs</h3>
            {blockedIPs.length === 0 ? (
              <p className="no-blocked">No IPs are currently blocked</p>
            ) : (
              <table className="blocked-table">
                <thead>
                  <tr>
                    <th>IP Address</th>
                    <th>Reason</th>
                    <th>Blocked At</th>
                    <th>Expires</th>
                    <th>Failed Attempts</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {blockedIPs.map((blocked) => (
                    <tr key={blocked._id}>
                      <td><code>{blocked.ipAddress}</code></td>
                      <td>{blocked.reason}</td>
                      <td>{new Date(blocked.blockedAt).toLocaleString()}</td>
                      <td>
                        {blocked.permanent ? (
                          <span className="badge-danger">Permanent</span>
                        ) : (
                          blocked.blockedUntil ? new Date(blocked.blockedUntil).toLocaleString() : '-'
                        )}
                      </td>
                      <td>{blocked.failedAttempts}</td>
                      <td>
                        <button
                          onClick={() => handleUnblockIP(blocked.ipAddress)}
                          className="btn-unblock"
                        >
                          Unblock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
