import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiFetch, buildFileUrl } from "../../api/api";
import {
  HiOutlineHome,
  HiOutlineGift,
  HiOutlineMap,
  HiOutlineChatBubbleLeftRight,
  HiOutlineUser,
  HiOutlineArrowRightOnRectangle,
  HiOutlineUserPlus,
  HiOutlineShieldCheck,
  HiOutlineBars3,
  HiOutlineXMark,
} from "react-icons/hi2";
import { GoChecklist } from "react-icons/go";
import { isAdminUser } from "../../utils/auth";
import "../../styles/components/Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem("userEmail");
  const isAdmin = isAdminUser();

  const [userName, setUserName] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [userLogo, setUserLogo] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!userEmail) return;

    async function loadData() {
      try {
        const { data: userData } = await apiFetch(
          `/auth/user/${encodeURIComponent(userEmail)}`
        );
        setUserName(userData.name || userEmail);
        setUserLogo(userData.logo_url || "");

        const { data: unreadData } = await apiFetch(
          `/messages/unread-count?user_email=${encodeURIComponent(userEmail)}`
        );
        setUnreadCount(unreadData.unread_count || 0);
      } catch (err) {
        console.error("Navbar error:", err);
      }
    }

    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [userEmail]);

  function closeMenu() {
    setMenuOpen(false);
  }

  function handleLogout() {
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userType");
    localStorage.removeItem("demoUser");
    closeMenu();
    navigate("/login");
  }

  function goHome() {
    closeMenu();
    navigate("/");
  }

  const navClassName = ({ isActive }) => `navbar-link ${isActive ? "active" : ""}`;

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <button type="button" className="navbar-logo" onClick={goHome}>
          <span>Ia</span>
          <span>și</span>
          <span>donează</span>
        </button>

        <button
          type="button"
          className="navbar-menu-button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <HiOutlineXMark size={24} /> : <HiOutlineBars3 size={24} />}
        </button>

        <div className={`navbar-panel ${menuOpen ? "open" : ""}`}>
          <nav className="navbar-nav">
            <NavLink to="/" end className={navClassName} onClick={closeMenu}>
              <HiOutlineHome size={20} />
              <span>Home</span>
            </NavLink>

            <NavLink to="/donations" className={navClassName} onClick={closeMenu}>
              <HiOutlineGift size={20} />
              <span>Donations</span>
            </NavLink>

            <NavLink to="/needs" className={navClassName} onClick={closeMenu}>
              <GoChecklist size={22} />
              <span>Need Lists</span>
            </NavLink>

            <NavLink to="/map" className={navClassName} onClick={closeMenu}>
              <HiOutlineMap size={20} />
              <span>Organizations Map</span>
            </NavLink>

            {userEmail ? (
              <>
                {isAdmin && (
                  <NavLink to="/admin/verifications" className={navClassName} onClick={closeMenu}>
                    <HiOutlineShieldCheck size={20} />
                    <span>Admin Panel</span>
                  </NavLink>
                )}

                {!isAdmin && (
                  <>
                    <NavLink to="/messages" className={navClassName} onClick={closeMenu}>
                      <span className="navbar-message-link">
                        <HiOutlineChatBubbleLeftRight size={20} />
                        <span>Messages</span>
                        {unreadCount > 0 && <span className="navbar-badge">{unreadCount}</span>}
                      </span>
                    </NavLink>

                    <NavLink to="/profile" className={navClassName} onClick={closeMenu}>
                      <HiOutlineUser size={20} />
                      <span>My Profile</span>
                    </NavLink>
                  </>
                )}
              </>
            ) : (
              <>
                <NavLink to="/login" className={navClassName} onClick={closeMenu}>
                  <HiOutlineArrowRightOnRectangle size={20} />
                  <span>Login</span>
                </NavLink>

                <NavLink to="/register" className={navClassName} onClick={closeMenu}>
                  <HiOutlineUserPlus size={20} />
                  <span>Register</span>
                </NavLink>
              </>
            )}
          </nav>

          <div className="navbar-user-area">
            {userEmail && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    closeMenu();
                    navigate(isAdmin ? "/admin/verifications" : "/profile");
                  }}
                  className="navbar-user-chip"
                >
                  <span className="navbar-avatar">
                    {userLogo ? (
                      <img src={buildFileUrl(userLogo)} alt={userName || userEmail} />
                    ) : (
                      (userName || userEmail).charAt(0).toUpperCase()
                    )}
                  </span>
                  <span className="navbar-user-name">{userName || userEmail}</span>
                </button>

                <button type="button" onClick={handleLogout} className="navbar-logout">
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
