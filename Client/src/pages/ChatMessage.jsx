import { useState, useRef, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { Avatar } from "./ChatPage";

export default function ChatMessage({ message, selectedUser }) {
  const { authUser } = useAuthStore();
  const { deleteMessage } = useChatStore();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const fromMe = message.senderId === authUser._id;
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  const handleDownload = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "nexchat-image-" + Date.now() + ".jpg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <div className={`msg-row ${fromMe ? "msg-me" : "msg-them"}`}>
      {!fromMe && <Avatar contact={selectedUser} size={28} />}
      <div className={`msg-bubble ${fromMe ? "bubble-me" : "bubble-them"} ${((message.image || (message.images && message.images.length > 0)) && !message.text) ? "bubble-img" : ""}`}>
        {fromMe && (
          <div className="msg-menu-wrap" ref={menuRef}>
            <button className="msg-menu-btn" onClick={() => setShowMenu(!showMenu)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
              </svg>
            </button>
            {showMenu && (
              <div className="msg-dropdown">
                <button className="msg-dropdown-item danger" onClick={() => deleteMessage(message._id)}>
                  Delete message
                </button>
              </div>
            )}
          </div>
        )}
        {message.text && <p className="msg-text" style={{ marginBottom: (message.image || (message.images && message.images.length > 0)) ? '8px' : 0 }}>{message.text}</p>}
        {message.image && (
          <div className="msg-img-container" style={{ position: "relative" }}>
            <img src={message.image} alt="sent" className="msg-image" style={{ marginBottom: (message.images && message.images.length > 0) ? '8px' : 0 }} />
            <button className="msg-download-btn" onClick={() => handleDownload(message.image)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
          </div>
        )}
        {message.images && message.images.map((img, idx) => (
          <div key={idx} className="msg-img-container" style={{ position: "relative" }}>
            <img 
              src={img} 
              alt="sent" 
              className="msg-image" 
              style={{ 
                marginBottom: idx === message.images.length - 1 ? 0 : '8px',
                maxWidth: '100%',
                borderRadius: '12px'
              }} 
            />
            <button className="msg-download-btn" onClick={() => handleDownload(img)}>
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
          </div>
        ))}
        <span className="msg-time">{time}</span>
      </div>
    </div>
  );
}
