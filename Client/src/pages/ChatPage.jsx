import { useState, useRef, useEffect } from "react";
import Swal from "sweetalert2";
import EditProfileModal from "./EditProfileModal";
import ChatMessage from "./ChatMessage";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

export function Avatar({ contact, size = 40 }) {
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

export default function ChatPage() {
  const {
    messages,
    users,
    selectedUser,
    isUsersLoading,
    isMessagesLoading,
    getUsers,
    getMessages,
    setSelectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    sendMessage: sendChatMessage,
  } = useChatStore();

  const { authUser, onlineUsers, logout, updateProfile } = useAuthStore();

  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");
  const [showInfo, setShowInfo] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [pendingImages, setPendingImages] = useState([]);
  
  const menuRef = useRef(null);
  const fileRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  useEffect(() => {
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser._id);
    }
  }, [selectedUser, getMessages]);

  useEffect(() => {
    if (messagesEndRef.current && messages) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const getStatus = (userId) => onlineUsers.includes(userId) ? "Online" : "Offline";

  const filtered = users.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleLogout = () => {
    logout();
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
        updateProfile(data);
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    const text = input.trim();
    if (!text && pendingImages.length === 0) return;

    await sendChatMessage({
      text: text,
      images: pendingImages.map((img) => img.src),
    });

    setInput("");
    setPendingImages([]);
    if (fileRef.current) fileRef.current.value = "";
  };

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
    if (e.key === "Enter" && !e.shiftKey) { 
      e.preventDefault(); 
      handleSendMessage(e); 
    }
  };

  if (isUsersLoading && users.length === 0) {
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
    <div className={`chat-root ${selectedUser ? "user-selected" : ""}`}>
      {/* Sidebar */}
      <aside className="chat-sidebar">
        <div className="sidebar-head">
          <div className="chat-logo">
            <svg viewBox="0 0 32 32" fill="none" width="28" height="28">
              <rect width="32" height="32" rx="10" fill="url(#cg)" />
              <circle cx="11" cy="16" r="2.2" fill="white" />
              <circle cx="16" cy="16" r="2.2" fill="white" />
              <circle cx="21" cy="16" r="2.2" fill="white" />
              <defs>
                <linearGradient id="cg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00a884" /><stop offset="1" stopColor="#008069" />
                </linearGradient>
              </defs>
            </svg>
            <span className="chat-logo-text">NexChat</span>
          </div>
          <div className="dropdown-wrap" ref={menuRef}>
            <button
              className={`icon-btn ${menuOpen ? "icon-btn-active" : ""}`}
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
              </svg>
            </button>
            {menuOpen && (
              <div className="dropdown-menu">
                <button className="dropdown-item" onClick={() => { setMenuOpen(false); setShowEditProfile(true); }}>
                  Edit Profile
                </button>
                <div className="dropdown-divider" />
                <button className="dropdown-item dropdown-item-danger" onClick={() => { setMenuOpen(false); handleLogout(); }}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="sidebar-search">
          <input
            className="search-input"
            placeholder="Search user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="contact-list">
          {filtered.map((c) => (
            <button
              key={c._id}
              className={`contact-item ${selectedUser?._id === c._id ? "contact-active" : ""}`}
              onClick={() => setSelectedUser(c)}
            >
              <div className="contact-avatar-wrap">
                <Avatar contact={c} size={42} />
                <span className={`status-dot ${getStatus(c._id) === "Online" ? "dot-online" : "dot-offline"}`} />
              </div>
              <div className="contact-info">
                <span className="contact-name">{c.name}</span>
                <span className={`contact-status ${getStatus(c._id) === "Online" ? "status-online" : ""}`}>{getStatus(c._id)}</span>
              </div>
              {c.unreadCount > 0 && (
                <div className="unread-badge">
                  {c.unreadCount}
                </div>
              )}
            </button>
          ))}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="chat-main">
        {!selectedUser ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
             <div className="text-6xl">👋</div>
             <p className="text-xl font-medium">Select a user to start chatting</p>
          </div>
        ) : (
          <>
            <div className="chat-header">
              <div className="chat-header-left">
                <button className="back-btn" onClick={() => setSelectedUser(null)}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                  </svg>
                </button>
                <Avatar contact={selectedUser} size={38} />
                <div>
                  <p className="chat-header-name">{selectedUser.name}</p>
                  <p className={`chat-header-status ${getStatus(selectedUser._id) === "Online" ? "status-online" : ""}`}>{getStatus(selectedUser._id)}</p>
                </div>
              </div>
              <button className="icon-btn" onClick={() => setShowInfo(!showInfo)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="8" /><line x1="12" y1="12" x2="12" y2="16" />
                </svg>
              </button>
            </div>

            <div className="chat-messages">
              {isMessagesLoading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="chat-empty">
                  <p>No messages yet. Say hello!</p>
                </div>
              ) : (
                messages.map((m) => (
                  <ChatMessage key={m._id} message={m} selectedUser={selectedUser} />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-wrap">
              {pendingImages.length > 0 && (
                <div className="img-preview-strip">
                  {pendingImages.map((img, i) => (
                    <div className="img-preview-thumb-wrap" key={i}>
                      <img src={img.src} alt="preview" className="img-preview-thumb" />
                      <button className="img-preview-cancel" onClick={() => cancelImage(i)}>×</button>
                    </div>
                  ))}
                </div>
              )}
              <div className="chat-input-bar">
                <input
                  className="chat-input"
                  placeholder="Send a message"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                />
                <input ref={fileRef} type="file" accept="image/*" className="hidden" style={{ display: "none" }} onChange={handleImageSelect} />
                <button className="icon-btn" onClick={() => fileRef.current?.click()}>📎</button>
                <button className="send-btn" onClick={handleSendMessage}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Right Panel */}
      {showInfo && selectedUser && (
        <aside className="chat-panel">
          <div className="panel-avatar">
             <Avatar contact={selectedUser} size={80} />
          </div>
          <p className="panel-name">{selectedUser.name}</p>
          <p className="panel-bio">{selectedUser.bio}</p>
          <div className="panel-divider" />
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </aside>
      )}

      {showEditProfile && (
        <EditProfileModal
          profile={authUser}
          onSave={handleUpdateProfile}
          onClose={() => setShowEditProfile(false)}
        />
      )}
    </div>
  );
}
