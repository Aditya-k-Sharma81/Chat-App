import { useState, useRef, useEffect } from "react";
import Swal from "sweetalert2";
import EditProfileModal from "./EditProfileModal";
import ChatMessage from "./ChatMessage";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { formatChatHeaderDate } from "../utils/dateUtils";
import CameraModal from "./CameraModal";


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
    isSendingMessage,
    previewImage,
    setPreviewImage,
  } = useChatStore();

  const { authUser, onlineUsers, logout, updateProfile } = useAuthStore();

  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");
  const [showInfo, setShowInfo] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [pendingMedia, setPendingMedia] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);

  
  const menuRef = useRef(null);
  const fileRef = useRef(null);
  const messagesEndRef = useRef(null);
  const recordingInterval = useRef(null);

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result;
          await sendChatMessage({
            audio: base64Audio,
          });
        };
        stream.getTracks().forEach(track => track.stop());
      };

      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingInterval.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
      Swal.fire({
        icon: "error",
        title: "Microphone Error",
        text: "Could not access microphone. Please check permissions.",
        background: "#1e1e2d",
        color: "#fff",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      clearInterval(recordingInterval.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.onstop = null; // Don't trigger sending
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      clearInterval(recordingInterval.current);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    const text = input.trim();
    if (!text && pendingMedia.length === 0) return;

    const images = pendingMedia.filter(m => m.type.startsWith("image/")).map(m => m.src);
    const videos = pendingMedia.filter(m => m.type.startsWith("video/")).map(m => m.src);

    await sendChatMessage({
      text: text,
      images: images,
      videos: videos,
    });

    setInput("");
    setPendingMedia([]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleMediaSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPendingMedia((prev) => [...prev, { src: ev.target.result, name: file.name, type: file.type }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const handleCameraCapture = (dataUrl) => {
    setPendingMedia((prev) => [...prev, { 
      src: dataUrl, 
      name: `camera-${Date.now()}.jpg`, 
      type: "image/jpeg" 
    }]);
  };

  const cancelMedia = (index) => {

    setPendingMedia((prev) => prev.filter((_, i) => i !== index));
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
                // Group messages by date
                (() => {
                  const groupedMessages = messages.reduce((groups, message) => {
                    const date = new Date(message.createdAt).toDateString();
                    if (!groups[date]) {
                      groups[date] = [];
                    }
                    groups[date].push(message);
                    return groups;
                  }, {});

                  return Object.entries(groupedMessages).map(([date, dateMessages]) => (
                    <div key={date} className="message-date-group">
                      <div className="date-header-row">
                        <div className="date-header-pill">
                          {formatChatHeaderDate(dateMessages[0].createdAt)}
                        </div>
                      </div>
                      {dateMessages.map((m) => (
                        <ChatMessage key={m._id} message={m} selectedUser={selectedUser} />
                      ))}
                    </div>
                  ));
                })()
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-wrap">
              {pendingMedia.length > 0 && (
                <div className="img-preview-strip">
                  {pendingMedia.map((media, i) => (
                    <div className="img-preview-thumb-wrap" key={i}>
                      {media.type.startsWith("image/") ? (
                        <img
                          src={media.src}
                          alt="preview"
                          className="img-preview-thumb"
                          onClick={() => setPreviewImage(media.src)}
                          style={{ cursor: "pointer" }}
                        />
                      ) : (
                        <video
                          src={media.src}
                          className="img-preview-thumb"
                          onClick={() => setPreviewImage(media.src)}
                          style={{ cursor: "pointer" }}
                        />
                      )}
                      <button className="img-preview-cancel" onClick={() => cancelMedia(i)}>×</button>
                    </div>
                  ))}
                </div>
              )}
              <div className="chat-input-bar">
                {isRecording ? (
                  <div className="recording-ui">
                    <div className="recording-dot" />
                    <span className="recording-time">{formatTime(recordingTime)}</span>
                    <button className="recording-cancel" onClick={cancelRecording}>Cancel</button>
                    <button className="recording-send" onClick={stopRecording}>
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      className="chat-input"
                      placeholder="Send a message"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKey}
                    />
                    <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" style={{ display: "none" }} onChange={handleMediaSelect} />
                    <button className="icon-btn" title="Take a photo" onClick={() => setShowCamera(true)}>📷</button>
                    <button className="icon-btn" title="Attach media" onClick={() => fileRef.current?.click()}>📎</button>
                    <button className="icon-btn" title="Voice Message" onClick={startRecording}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
                      </svg>
                    </button>

                    <button className="send-btn" onClick={handleSendMessage} disabled={isSendingMessage || (!input.trim() && pendingMedia.length === 0)}>
                      {isSendingMessage ? (
                        <div className="btn-spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
                      ) : (
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                          <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z" />
                        </svg>
                      )}
                    </button>
                  </>
                )}
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

      {previewImage && <ImageModal />}
      {showCamera && (
        <CameraModal 
          onCapture={handleCameraCapture} 
          onClose={() => setShowCamera(false)} 
        />
      )}
    </div>

  );
}

function ImageModal() {
  const { previewImage, setPreviewImage } = useChatStore();
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setPreviewImage(null);
    };
    if (previewImage) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [previewImage, setPreviewImage]);

  if (!previewImage) return null;

  const handleDownload = async (e) => {
    e.stopPropagation();
    try {
      const response = await fetch(previewImage);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `nexchat-image-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <div className="image-modal-overlay" onClick={() => setPreviewImage(null)}>
      <div className="image-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="image-modal-close" onClick={() => setPreviewImage(null)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className="image-modal-content">
          {previewImage.includes("/video/upload/") || previewImage.includes("data:video/") ? (
            <video src={previewImage} controls autoPlay className="image-modal-img" />
          ) : (
            <img src={previewImage} alt="Big preview" className="image-modal-img" />
          )}
          {!previewImage.startsWith("data:") && (
            <button className="image-modal-download" onClick={handleDownload} style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
