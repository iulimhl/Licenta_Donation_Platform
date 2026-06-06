import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiFetch, buildFileUrl } from "../../api/api";
import { colors, radius } from "../../styles/theme";
import {
  HiOutlineHome,
  HiOutlineGift,
  HiOutlineMap,
  HiOutlineChatBubbleLeftRight,
  HiOutlineUser,
  HiOutlineArrowRightOnRectangle,
  HiOutlineUserPlus,
  HiOutlineShieldCheck,
} from "react-icons/hi2";
import { GoChecklist } from "react-icons/go";

export default function Navbar() {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem("userEmail");
  const ADMIN_EMAIL = "mihalescu_iulia@yahoo.com";
  const isAdmin = userEmail === ADMIN_EMAIL;

  const [userName, setUserName] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [userLogo, setUserLogo] = useState("");

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

  function handleLogout() {
    localStorage.removeItem("userEmail");
    localStorage.removeItem("demoUser");
    navigate("/login");
  }

  return (
    <header style={styles.header}>
      <div style={styles.inner}>
        <div style={styles.logoWrap} onClick={() => navigate("/")}>
          <h1 style={styles.logo}>
            <span style={{ color: colors.primary || "#115e59" }}>Ia</span>
            <span style={{ color: "#94a3b8" }}>și</span>
            <span style={{ color: colors.text }}>donează</span>
          </h1>
        </div>

        <nav style={styles.nav}>
          <NavLink to="/" end style={navLinkStyle}>
            <HiOutlineHome size={20} />
            <span>Home</span>
          </NavLink>

          <NavLink to="/donations" style={navLinkStyle}>
            <HiOutlineGift size={20} />
            <span>Donations</span>
          </NavLink>

          <NavLink to="/needs" style={navLinkStyle}>
            <GoChecklist size={22} />
            <span>Need Lists</span>
          </NavLink>

          <NavLink to="/map" style={navLinkStyle}>
            <HiOutlineMap size={20} />
            <span>Organizations Map</span>
          </NavLink>

          {userEmail ? (
            <>
              <NavLink to="/messages" style={navLinkStyle}>
                <span style={styles.messagesWrap}>
                  <span style={styles.linkWithIcon}>
                    <HiOutlineChatBubbleLeftRight size={20} />
                    <span>Messages</span>
                  </span>
                  {unreadCount > 0 && (
                    <span style={styles.badge}>{unreadCount}</span>
                  )}
                </span>
              </NavLink>

              {isAdmin && (
                <NavLink to="/admin/verifications" style={navLinkStyle}>
                  <HiOutlineShieldCheck size={20} />
                  <span>Admin</span>
                </NavLink>
              )}

              <NavLink to="/profile" style={navLinkStyle}>
                <HiOutlineUser size={20} />
                <span>My Profile</span>
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/login" style={navLinkStyle}>
                <HiOutlineArrowRightOnRectangle size={20} />
                <span>Login</span>
              </NavLink>

              <NavLink to="/register" style={navLinkStyle}>
                <HiOutlineUserPlus size={20} />
                <span>Register</span>
              </NavLink>
            </>
          )}
        </nav>

        <div style={styles.userArea}>
          {userEmail ? (
            <>
              <button
              onClick={() => navigate("/profile")}
              style={styles.userChipButton}
            >
              <div style={styles.userAvatar}>
              {userLogo ? (
                <img
                  src={buildFileUrl(userLogo)}
                  alt={userName || userEmail}
                  style={styles.userAvatarImage}
                />
              ) : (
                (userName || userEmail).charAt(0).toUpperCase()
              )}
            </div>
              <span style={styles.userName}>{userName || userEmail}</span>
            </button>

              <button onClick={handleLogout} style={styles.logoutBtn}>
                Logout
              </button>
            </>
          ) : (
            <div style={{ width: "220px" }} />
          )}
        </div>
      </div>
    </header>
  );
}

const navLinkStyle = ({ isActive }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: "20px",
  padding: "12px 18px",
  borderRadius: radius.md,
  textDecoration: "none",
  fontSize: "15px",
  fontWeight: 600,
  color: isActive ? (colors.primary || "#344D2B") : colors.text,
  background: isActive ? (colors.primaryLight || "#edf2eb") : "transparent",
  border: isActive
    ? `1px solid ${colors.primary || "#344D2B"}`
    : "1px solid transparent",
  transition: "all 0.2s ease",
  whiteSpace: "nowrap",
  cursor: "pointer",
});

const styles = {
  header: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    width: "100%",
    background: "#f7f5ef",
    borderBottom: `1px solid ${colors.border}`,
    boxShadow: "none",
  },

  inner: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "260px 1fr 260px",
    alignItems: "center",
    gap: "24px",
    padding: "18px 36px",
    boxSizing: "border-box",
    minHeight: "92px",
  },

  logoWrap: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
  },

  logo: {
    margin: 0,
    fontSize: "42px",
    fontWeight: 900,
    letterSpacing: "-1.5px",
    lineHeight: 1,
  },

  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "24px",
    flexWrap: "wrap",
    width: "100%",
  },

  linkWithIcon: {
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
  },

  messagesWrap: {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
  },

  badge: {
    position: "absolute",
    top: "-6px",
    right: "-10px",
    background: colors.danger,
    color: colors.white,
    fontSize: "12px",
    fontWeight: 800,
    minWidth: "20px",
    height: "20px",
    borderRadius: "999px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 6px",
    border: "2px solid white",
  },

  userArea: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: "12px",
    width: "240px",
  },

  userChip: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: "999px",
    padding: "6px 16px 6px 6px",
  },

userChipButton: {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  background: colors.card,
  border: `1px solid ${colors.border}`,
  borderRadius: "999px",
  padding: "6px 16px 6px 6px",
  cursor: "pointer",
},

userAvatar: {
  width: "34px",
  height: "34px",
  borderRadius: "50%",
  overflow: "hidden",
  background: colors.primary || "#344D2B",
  color: colors.white,
  fontSize: "15px",
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
},

userAvatarImage: {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  borderRadius: "50%",
  display: "block",
},

  userName: {
    fontSize: "15px",
    fontWeight: 600,
    color: colors.text,
    maxWidth: "180px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  logoutBtn: {
    padding: "10px 16px",
    borderRadius: radius.md,
    background: "#fff7ed",
    color: colors.danger,
    border: `1px solid ${colors.border}`,
    fontWeight: 600,
    fontSize: "14px",
    cursor: "pointer",
  },
};
