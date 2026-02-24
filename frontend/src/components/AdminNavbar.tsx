import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AdminNavbar.css';

interface AdminNavbarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const AdminNavbar: React.FC<AdminNavbarProps> = ({ activeTab = 'dashboard', onTabChange }) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth');
  };

  const handleTabClick = (tab: string) => {
    if (onTabChange) {
      // Tab mode (for AdminPanel)
      onTabChange(tab);
    } else {
      // Route mode (for other pages like Profile)
      if (tab === 'dashboard') {
        navigate('/admin');
      } else if (tab === 'manage') {
        navigate('/admin'); // Will set tab in AdminPanel
      } else if (tab === 'password-resets') {
        navigate('/admin'); // Will set tab in AdminPanel
      } else if (tab === 'security') {
        navigate('/admin'); // Will set tab in AdminPanel
      }
    }
    setMenuOpen(false);
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <nav className="participant-navbar admin-variant">
      <div className="participant-navbar-container">
        <div className="participant-navbar-brand">
          <div className="participant-navbar-logo" onClick={() => handleTabClick('dashboard')}>
            EventHub
          </div>
          <span className="participant-navbar-role admin-role">Admin</span>
        </div>

        <button className="participant-navbar-toggle" onClick={toggleMenu}>
          ☰
        </button>

        <ul className={`participant-navbar-menu ${menuOpen ? 'active' : ''}`}>
          <li className="participant-navbar-item">
            <button
              className={`participant-navbar-link ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleTabClick('dashboard')}
            >
              <span className="participant-navbar-icon"></span>
              Dashboard
            </button>
          </li>

          <li className="participant-navbar-item">
            <button
              className={`participant-navbar-link ${activeTab === 'manage' ? 'active' : ''}`}
              onClick={() => handleTabClick('manage')}
            >
              <span className="participant-navbar-icon"></span>
              Manage Clubs/Organizers
            </button>
          </li>

          <li className="participant-navbar-item">
            <button
              className={`participant-navbar-link ${activeTab === 'password-resets' ? 'active' : ''}`}
              onClick={() => handleTabClick('password-resets')}
            >
              <span className="participant-navbar-icon"></span>
              Password Reset Requests
            </button>
          </li>

          <li className="participant-navbar-item">
            <button
              className={`participant-navbar-link ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => handleTabClick('security')}
            >
              <span className="participant-navbar-icon"></span>
              Security & Bot Protection
            </button>
          </li>

          <li className="participant-navbar-item">
            <button
              className="participant-navbar-link participant-navbar-logout"
              onClick={() => {
                setMenuOpen(false);
                handleLogout();
              }}
            >
              <span className="participant-navbar-icon"></span>
              Logout
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default AdminNavbar;
