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
        {message.image && <img src={message.image} alt="sent" className="msg-image" style={{ marginBottom: (message.images && message.images.length > 0) ? '8px' : 0 }} />}
        {message.images && message.images.map((img, idx) => (
          <img 
            key={idx} 
            src={img} 
            alt="sent" 
            className="msg-image" 
            style={{ 
              marginBottom: idx === message.images.length - 1 ? 0 : '8px',
              maxWidth: '100%',
              borderRadius: '12px'
            }} 
          />
        ))}
        <span className="msg-time">{time}</span>
      </div>
    </div>
  );
}
