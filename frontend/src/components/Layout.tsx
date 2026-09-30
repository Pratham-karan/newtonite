import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error', err);
    }
  };

  return (
    <div className="app-container">
      <header className="top-nav">
        <div className="nav-brand">
          <div className="brand-logo-icon">N</div>
          <div className="brand-text">
            <span className="brand-name">Newtonite</span>
            <span className="brand-sub">Ops Control</span>
          </div>
        </div>

        <nav className="nav-links">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/work-items"
            end
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            Work Items
          </NavLink>
          <NavLink
            to="/work-items/new"
            className={({ isActive }) => `nav-item nav-btn-new ${isActive ? 'active' : ''}`}
          >
            <span className="plus-icon">+</span> New Item
          </NavLink>
        </nav>

        <div className="nav-user">
          <div className="user-info-box">
            <div className="user-name-role">
              <span className="user-name">{user?.name}</span>
              <span className={`role-badge role-${user?.role?.toLowerCase()}`}>
                {user?.role?.replace('_', ' ')}
              </span>
            </div>
            {user?.teams && user.teams.length > 0 && (
              <div className="user-teams">
                {user.teams.map((t) => (
                  <span key={t.id} className="team-pill" title={t.name}>
                    {t.name}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button onClick={handleLogout} className="btn-logout" title="Sign Out">
            Sign out
          </button>
        </div>
      </header>

      <main className="main-content">
        <Outlet />
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <span>Newtonite Operations Platform &bull; Operations Under Pressure</span>
          <span className="footer-status-pill">System Operational</span>
        </div>
      </footer>
    </div>
  );
}
