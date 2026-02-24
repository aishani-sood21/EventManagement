import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../styles/ParticipantNavbar.css';

const ParticipantNavbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
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
    <nav className="participant-navbar">
      <div className="participant-navbar-container">
        <div className="participant-navbar-brand">
          <Link to="/dashboard" className="participant-navbar-logo">
            Eventure
          </Link>
          <span className="participant-navbar-role">Participant</span>
        </div>

        <button className="participant-navbar-toggle" onClick={toggleMenu}>
          ☰
        </button>

        <ul className={`participant-navbar-menu ${menuOpen ? 'active' : ''}`}>
          <li className="participant-navbar-item">
            <Link
              to="/dashboard"
              className={`participant-navbar-link ${isActive('/dashboard') ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <span className="participant-navbar-icon"></span>
              Dashboard
            </Link>
          </li>

          <li className="participant-navbar-item">
            <Link
              to="/my-events"
              className={`participant-navbar-link ${isActive('/my-events') ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <span className="participant-navbar-icon"></span>
              My Events
            </Link>
          </li>

          <li className="participant-navbar-item">
            <Link
              to="/browse"
              className={`participant-navbar-link ${isActive('/browse') ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <span className="participant-navbar-icon"></span>
              Browse Events
            </Link>
          </li>

          <li className="participant-navbar-item">
            <Link
              to="/clubs"
              className={`participant-navbar-link ${isActive('/clubs') ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <span className="participant-navbar-icon"></span>
              Clubs & Organizers
            </Link>
          </li>

          <li className="participant-navbar-item">
            <Link
              to="/profile"
              className={`participant-navbar-link ${isActive('/profile') ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <span className="participant-navbar-icon"></span>
              Profile
            </Link>
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

export default ParticipantNavbar;
