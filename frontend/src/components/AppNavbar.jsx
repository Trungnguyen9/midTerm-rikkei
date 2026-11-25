import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

export default function AppNavbar() {
  const [expanded, setExpanded] = useState(false);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/" onClick={() => setExpanded(false)}>
          Rikkei Lab
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          aria-controls="mainMenu"
          aria-expanded={expanded}
          aria-label="Mở menu"
          onClick={() => setExpanded((prev) => !prev)}
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className={`collapse navbar-collapse ${expanded ? 'show' : ''}`} id="mainMenu">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <NavLink
                to="/"
                end
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setExpanded(false)}
              >
                Thiết bị
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/phieu-muon"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setExpanded(false)}
              >
                Phiếu mượn
              </NavLink>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

