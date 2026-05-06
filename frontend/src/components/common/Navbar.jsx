import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiFetch } from "../../api/api";
import { colors, radius } from "../../styles/theme";
import logoImg from "../../assets/donation.png";

export default function Navbar() {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem("userEmail");

  const [userName, setUserName] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userEmail) return;

    async function loadData() {
      try {
        const { data: userData } = await apiFetch(`/auth/user/${userEmail}`);
        setUserName(userData.organization_name || userEmail);

        const { data: unreadData } = await apiFetch(
          `/messages/unread-count?user_email=${userEmail}`
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

  function handleLogout() {
    localStorage.removeItem("userEmail");
    localStorage.removeItem("demoUser");
    navigate("/login");
  }

  return (
    <header style={styles.header}>
      <div style={styles.inner}>

        <nav style={styles.nav}>

          <NavLink to="/" end style={navLinkStyle}>
            Home
          </NavLink>

          <NavLink to="/donations" style={navLinkStyle}>
            Donations
          </NavLink>

          <NavLink to="/needs" style={navLinkStyle}>
            Need Lists
          </NavLink>

          <NavLink to="/map" style={navLinkStyle}>
                Harta ONG-uri
          </NavLink>

          {userEmail ? (
            <>
              <NavLink to="/messages" style={navLinkStyle}>
                <span style={styles.messagesWrap}>
                  Messages
                  {unreadCount > 0 && <span style={styles.badge}>{unreadCount}</span>}
                </span>
              </NavLink>

              <NavLink to="/profile" style={navLinkStyle}>
                My Profile
              </NavLink>
            </>
          ) : (
            <>

              <NavLink to="/login" style={navLinkStyle}>
                Login
              </NavLink>

              <NavLink to="/register" style={navLinkStyle}>
                Register
              </NavLink>
            </>
          )}
        </nav>

        {userEmail && (
          <div style={styles.userArea}>
            <div style={styles.userChip}>
              <div style={styles.userAvatar}>
                {(userName || userEmail).charAt(0).toUpperCase()}
              </div>
              <span style={styles.userName}>{userName || userEmail}</span>
            </div>

            <button onClick={handleLogout} style={styles.logoutBtn}>
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

const navLinkStyle = ({ isActive }) => ({
  padding: "10px 14px",
  borderRadius: radius.md,
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: 600,
  color: isActive ? colors.blueDark : colors.text,
  background: isActive ? colors.card : "transparent",
  border: isActive ? `1px solid ${colors.border}` : "1px solid transparent",
  transition: "all 0.2s ease",
  whiteSpace: "nowrap",
});

const styles = {
  header: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: "rgba(255,255,255,0.9)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    borderBottom: `1px solid ${colors.border}`,
    borderRadius: "15px",
    overflow: "hidden",
    boxShadow: "0 6px 20px rgba(143, 185, 255, 0.08)",
    marginBottom: 32,
  },

  inner: {
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "0 24px",
    padding: "10px 24px",
    minHeight: "unset",
    display: "flex",
    alignItems: "center",
    gap: "24px",
  },

  logoLink: {
    textDecoration: "none",
    flexShrink: 0,
  },

  logo: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
   },

   logoImg: {
      width: "70px",
      height: "70px",
      objectFit: "contain",
      display: "block",
      flexShrink: 0,
   },
  brandChip: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      background: colors.card,
      border: `1px solid ${colors.border}`,
      borderRadius: "999px",
      padding: "6px 12px 6px 8px",
      boxShadow: "0 2px 8px rgba(143, 185, 255, 0.08)",
      background: "linear-gradient(90deg, #fff9e8 0%, #f5f9ff 100%)",
   },

  logoMark: {
    width: "40px",
    height: "40px",
    borderRadius: radius.md,
    background: `linear-gradient(135deg, ${colors.blue}, ${colors.yellow})`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: colors.text,
    fontWeight: 800,
    fontSize: "14px",
    boxShadow: "0 6px 16px rgba(143, 185, 255, 0.18)",
  },

  logoTextWrap: {
    display: "flex",
    alignItems: "baseline",
    gap: "2px",
    fontSize: "20px",
    fontWeight: 800,
    letterSpacing: "-0.02em",
  },

  logoMain: {
    color: colors.blue,
  },

  logoAccent: {
    color: colors.yellow,
  },

  nav: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flex: 1,
    flexWrap: "wrap",
  },

  messagesWrap: {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
  },

  badge: {
    position: "absolute",
    top: "-10px",
    right: "-14px",
    background: colors.danger,
    color: colors.white,
    fontSize: "10px",
    fontWeight: 700,
    minWidth: "18px",
    height: "18px",
    borderRadius: "999px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 4px",
  },

  userArea: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexShrink: 0,
  },

  userChip: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: "999px",
    padding: "4px 12px 4px 4px",
  },

  userAvatar: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    background: colors.blue,
    color: colors.white,
    fontSize: "13px",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  userName: {
    fontSize: "13px",
    fontWeight: 600,
    color: colors.text,
    maxWidth: "150px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  logoutBtn: {
    padding: "8px 14px",
    borderRadius: radius.md,
    background: "#fff7ed",
    color: colors.danger,
    border: `1px solid ${colors.border}`,
    fontWeight: 600,
    fontSize: "13px",
    cursor: "pointer",
  },
};