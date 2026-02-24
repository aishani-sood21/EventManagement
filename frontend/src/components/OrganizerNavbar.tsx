import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../styles/OrganizerNavbar.css';

const OrganizerNavbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    navigate('/auth');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <nav className="organizer-navbar">
      <div className="organizer-navbar-container">
        <div className="organizer-navbar-brand">
          <Link to="/dashboard" className="organizer-navbar-logo">
            🎉 EventHub
          </Link>
          <span className="organizer-navbar-role">Organizer</span>
        </div>

        <button className="organizer-navbar-toggle" onClick={toggleMenu}>
          ☰
        </button>

        <ul className={`organizer-navbar-menu ${menuOpen ? 'active' : ''}`}>
          <li className="organizer-navbar-item">
            <Link
              to="/dashboard"
              className={`organizer-navbar-link ${isActive('/dashboard') ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <span className="organizer-navbar-icon">🏠</span>
              Dashboard
            </Link>
          </li>

          <li className="organizer-navbar-item">
            <Link
              to="/create-event"
              className={`organizer-navbar-link ${isActive('/create-event') ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <span className="organizer-navbar-icon">➕</span>
              Create Event
            </Link>
          </li>

          <li className="organizer-navbar-item">
            <Link
              to="/organizer/events"
              className={`organizer-navbar-link ${isActive('/organizer/events') ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <span className="organizer-navbar-icon">📋</span>
              Ongoing Events
            </Link>
          </li>

          <li className="organizer-navbar-item">
            <Link
              to="/profile"
              className={`organizer-navbar-link ${isActive('/profile') ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <span className="organizer-navbar-icon">👤</span>
              Profile
            </Link>
          </li>

          <li className="organizer-navbar-item">
            <button
              className="organizer-navbar-logout"
              onClick={() => {
                setMenuOpen(false);
                handleLogout();
              }}
            >
              <span className="organizer-navbar-icon">🚪</span>
              Logout
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default OrganizerNavbar;
