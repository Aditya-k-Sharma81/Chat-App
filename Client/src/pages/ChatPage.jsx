import { useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";
import Swal from "sweetalert2";
import EditProfileModal from "./EditProfileModal";

const MESSAGES = {};

function Avatar({ contact, size = 40 }) {
  if (contact.pic) {
    return (
      <img
        src={contact.pic}
        alt={contact.name}
        style={{
          width: size, height: size, borderRadius: "50%",
          objectFit: "cover", flexShrink: 0,
          border: "2px solid rgba(124,108,251,0.5)",
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${contact.color}cc, ${contact.color}55)`,
        border: `2px solid ${contact.color}55`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.35,
        fontWeight: 700,
        color: "#fff",
        flexShrink: 0,
        letterSpacing: "0.5px",
      }}
    >
      {contact.initials}
    </div>
  );
}

// Avatar for the current logged-in user (supports real photo)
function UserAvatar({ profile, size = 40 }) {
  if (profile.avatar || profile.pic) {
    return (
      <img
        src={profile.avatar || profile.pic}
        alt="You"
        style={{
          width: size, height: size, borderRadius: "50%",
          objectFit: "cover", flexShrink: 0,
          border: "2px solid rgba(124,108,251,0.5)",
        }}
      />
    );
  }

  const initials = profile.name
    ? profile.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  return (
    <div
      className="avatar-circle"
      style={{
        width: size,
        height: size,
        backgroundColor: "#7c6cfb",
        fontSize: size * 0.4
      }}
    >{initials}</div>
  );
}

export default function ChatPage({ onLogout }) {
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");
  const [chats, setChats] = useState(MESSAGES);
  const [showInfo, setShowInfo] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [userProfile, setUserProfile] = useState({
    _id: null,
    name: "Loading...",
    bio: "Fetching your profile...",
    avatar: null,
  });
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState([]); // 2. Online users state
  const socketRef = useRef(null);

  useEffect(() => {
    // We already check the session in App.jsx, but we'll fetch profile data here
    const fetchData = async () => {
      try {
        // Fetch Profile
        const profileRes = await fetch("http://localhost:5000/api/user/me", {
          method: "GET",
          credentials: "include",
        });

        let currentUserId = null;
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          currentUserId = profileData._id;
          setUserProfile({
            _id: profileData._id,
            name: profileData.name,
            bio: profileData.bio || "Hey there! I'm using NexChat 👋",
            avatar: profileData.pic,
          });
        }

        // Fetch ALL Users
        const usersRes = await fetch("http://localhost:5000/api/user", {
          method: "GET",
          credentials: "include",
        });

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          // Transform database users to match UI expected format
          const formattedUsers = usersData.map(u => ({
            id: u._id,
            name: u.name,
            // status: "Online", // Mock status for now - will be updated by socket
            initials: u.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2),
            color: ["#7c6cfb", "#c084fc", "#38bdf8", "#fb923c", "#34d399"][Math.floor(Math.random() * 5)],
            bio: u.bio,
            pic: u.pic
          }));
          setContacts(formattedUsers);
          if (formattedUsers.length > 0) {
            setSelected(formattedUsers[0]);
          }
        }

        // 3. Initialize Socket Connection
        if (currentUserId) {
          const socket = io("http://localhost:5000", {
            query: { userId: currentUserId }
          });
          socketRef.current = socket;

          socket.on("getOnlineUsers", (users) => {
            setOnlineUsers(users);
          });
        }

      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      if (socketRef.current) socketRef.current.close();
    };
  }, []);

  // 4. Helper to get status
  const getStatus = (userId) => onlineUsers.includes(userId) ? "Online" : "Offline";

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5000/api/user/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      onLogout();
    }
  };

  const handleUpdateProfile = async (updatedData) => {
    try {
      const response = await fetch("http://localhost:5000/api/user/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updatedData),
      });

      const data = await response.json();

      if (response.ok) {
        // Update local state
        setUserProfile({
          name: data.name,
          bio: data.bio,
          avatar: data.pic,
        });

        Swal.fire({
          icon: "success",
          title: "Profile Updated!",
          text: "Your changes have been saved successfully.",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
          background: "#1e1e2d",
          color: "#fff",
        });
      } else {
        throw new Error(data.message || "Failed to update profile");
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: error.message,
        background: "#1e1e2d",
        color: "#fff",
      });
    }
  };
  const [pendingImages, setPendingImages] = useState([]);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const messages = selected ? (chats[selected.id] || []) : [];

  const sendMessage = () => {
    if (!selected) return;
    const text = input.trim();
    if (!text && pendingImages.length === 0) return;
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newMsgs = [
      ...pendingImages.map((img, i) => ({ id: Date.now() + i, from: "me", type: "image", src: img.src, time })),
      ...(text ? [{ id: Date.now() + pendingImages.length, from: "me", text, time }] : []),
    ];
    setChats((prev) => ({ ...prev, [selected.id]: [...(prev[selected.id] || []), ...newMsgs] }));
    setInput("");
    setPendingImages([]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const fileRef = useRef(null);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPendingImages((prev) => [...prev, { src: ev.target.result, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const cancelImage = (index) => {
    setPendingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  if (loading) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#13131d",
        color: "#fff",
        fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "40px",
            height: "40px",
            border: "3px solid rgba(124, 108, 251, 0.3)",
            borderTopColor: "#7c6cfb",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 15px"
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>Initializing NexChat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-root">
      {/* ── Sidebar ─────────────────────────────── */}
      <aside className="chat-sidebar">
        {/* Logo */}
        <div className="sidebar-head">
          <div className="chat-logo">
            <svg viewBox="0 0 32 32" fill="none" width="28" height="28">
              <rect width="32" height="32" rx="10" fill="url(#cg)" />
              <circle cx="11" cy="16" r="2.2" fill="white" />
              <circle cx="16" cy="16" r="2.2" fill="white" />
              <circle cx="21" cy="16" r="2.2" fill="white" />
              <defs>
                <linearGradient id="cg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#7c6cfb" /><stop offset="1" stopColor="#c084fc" />
                </linearGradient>
              </defs>
            </svg>
            <span className="chat-logo-text">NexChat</span>
          </div>
          <div className="dropdown-wrap" ref={menuRef}>
            <button
              className={`icon-btn ${menuOpen ? "icon-btn-active" : ""}`}
              title="More options"
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
              </svg>
            </button>

            {menuOpen && (
              <div className="dropdown-menu">
                <button className="dropdown-item" onClick={() => { setMenuOpen(false); setShowEditProfile(true); }}>
                  <span className="dropdown-item-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </span>
                  Edit Profile
                </button>
                <div className="dropdown-divider" />
                <button
                  className="dropdown-item dropdown-item-danger"
                  onClick={() => { setMenuOpen(false); handleLogout(); }}
                >
                  <span className="dropdown-item-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                  </span>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="sidebar-search">
          <span className="search-icon-s">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
          </span>
          <input
            className="search-input"
            placeholder="Search user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Contacts */}
        <div className="contact-list">
          {filtered.map((c) => (
            <button
              key={c.id}
              className={`contact-item ${selected?.id === c.id ? "contact-active" : ""}`}
              onClick={() => setSelected(c)}
            >
              <div className="contact-avatar-wrap">
                <Avatar contact={c} size={42} />
                <span className={`status-dot ${getStatus(c.id) === "Online" ? "dot-online" : "dot-offline"}`} />
              </div>
              <div className="contact-info">
                <span className="contact-name">{c.name}</span>
                <span className={`contact-status ${getStatus(c.id) === "Online" ? "status-online" : ""}`}>{getStatus(c.id)}</span>
              </div>
            </button>
          ))}
          {filtered.length === 0 && !loading && (
            <div className="text-center p-4 text-gray-500 text-sm">No users found</div>
          )}
        </div>
      </aside>

      {/* ── Chat area ───────────────────────────── */}
      <main className="chat-main">
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
             <div className="text-6xl">👋</div>
             <p className="text-xl font-medium">Select a user to start chatting</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="chat-header">
              <div className="chat-header-left">
                <Avatar contact={selected} size={38} />
                <div>
                  <p className="chat-header-name">{selected.name}</p>
                  <p className={`chat-header-status ${getStatus(selected.id) === "Online" ? "status-online" : ""}`}>{getStatus(selected.id)}</p>
                </div>
              </div>
              <button className="icon-btn" title="Info" onClick={() => setShowInfo(!showInfo)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="8" /><line x1="12" y1="12" x2="12" y2="16" />
                </svg>
              </button>
            </div>

        {/* Messages */}
        <div className="chat-messages">
          {/* Background blobs */}
          <div className="chat-blob cb1" />
          <div className="chat-blob cb2" />

          {messages.length === 0 ? (
            <div className="chat-empty">
              <div className="chat-empty-icon">💬</div>
              <p>No messages yet. Say hello!</p>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`msg-row ${m.from === "me" ? "msg-me" : "msg-them"}`}>
                {m.from === "them" && <Avatar contact={selected} size={28} />}
                <div className={`msg-bubble ${m.from === "me" ? "bubble-me" : "bubble-them"} ${m.type === "image" ? "bubble-img" : ""}`}>
                  {m.type === "image" ? (
                    <img src={m.src} alt="sent" className="msg-image" />
                  ) : (
                    <p className="msg-text">{m.text}</p>
                  )}
                  <span className="msg-time">{m.time}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div className="chat-input-wrap">
          {/* Image preview strip */}
          {pendingImages.length > 0 && (
            <div className="img-preview-strip">
              {pendingImages.map((img, i) => (
                <div className="img-preview-thumb-wrap" key={i}>
                  <img src={img.src} alt="preview" className="img-preview-thumb" />
                  <button className="img-preview-cancel" onClick={() => cancelImage(i)} title="Remove">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
              <span className="img-preview-count">{pendingImages.length} image{pendingImages.length > 1 ? "s" : ""} selected</span>
            </div>
          )}

          <div className="chat-input-bar">
            <input
              className="chat-input"
              placeholder={pendingImages.length > 0 ? "Add a caption..." : "Send a message"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
            />
            {/* Hidden file input */}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden-file-input"
              onChange={handleImageSelect}
            />
            <button
              className={`icon-btn attach-btn ${pendingImages.length > 0 ? "attach-btn-active" : ""}`}
              title="Attach image"
              onClick={() => fileRef.current?.click()}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </button>
            <button className="send-btn" onClick={sendMessage} title="Send">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
          </>
        )}
      </main>

      {/* ── Right panel ─────────────────────────── */}
      {showInfo && selected && (
        <aside className="chat-panel">
          <div className="panel-avatar">
            {selected.pic ? (
              <img src={selected.pic} alt={selected.name} style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <Avatar contact={selected} size={80} />
            )}
          </div>
          <p className="panel-name">{selected.name}</p>
          <p className="panel-bio">{selected.bio}</p>

          <div className="panel-divider" />

          <div className="panel-section">
            <p className="panel-section-title">Contact Details</p>
            <div className="panel-info-row">
              <span className={`status-dot ${getStatus(selected.id) === "Online" ? "dot-online" : "dot-offline"}`} style={{ width: 8, height: 8 }} />
              <span>{getStatus(selected.id)}</span>
            </div>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </aside>
      )}

      {/* ── Edit Profile Modal ───────────────────── */}
      {showEditProfile && (
        <EditProfileModal
          profile={userProfile}
          onSave={handleUpdateProfile}
          onClose={() => setShowEditProfile(false)}
        />
      )}
    </div>
  );
}
