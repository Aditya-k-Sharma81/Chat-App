import { useState, useRef, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { Avatar } from "./ChatPage";

export default function ChatMessage({ message, selectedUser }) {
  const { authUser } = useAuthStore();
  const { deleteMessage, setPreviewImage } = useChatStore();
  const fromMe = message.senderId === authUser._id;
  const [showMenu, setShowMenu] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(() => {
    if (fromMe) return true;
    const downloaded = JSON.parse(localStorage.getItem("downloaded_msgs") || "[]");
    return downloaded.includes(message._id);
  });
  const menuRef = useRef(null);

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
    setIsDownloaded(true); // Mark as downloaded when starting
    if (!fromMe) {
        const downloaded = JSON.parse(localStorage.getItem("downloaded_msgs") || "[]");
        if (!downloaded.includes(message._id)) {
          localStorage.setItem("downloaded_msgs", JSON.stringify([...downloaded, message._id]));
        }
    }
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      const extension = url.includes("video") ? "mp4" : "jpg";
      link.download = `nexchat-media-${Date.now()}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const ImageComponent = ({ src, alt, className, style }) => (
    <div className="msg-img-container" style={{ position: "relative" }}>
      <img 
        src={src} 
        alt={alt} 
        className={`${className} ${!isDownloaded ? 'msg-img-blur' : ''}`} 
        style={style} 
        onClick={() => isDownloaded && setPreviewImage(src)}
      />
      {!isDownloaded && (
        <div className="msg-download-overlay" onClick={() => handleDownload(src)}>
          <div className="msg-download-icon-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </div>
          <span>Download to view</span>
        </div>
      )}
      {isDownloaded && (
        <button className="msg-download-btn" onClick={() => handleDownload(src)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
      )}
    </div>
  );

  const VideoComponent = ({ src, className, style }) => (
    <div 
      className="msg-video-container" 
      style={{ position: "relative", cursor: isDownloaded ? 'pointer' : 'default' }}
      onClick={() => isDownloaded && setPreviewImage(src)}
    >
      <video 
        src={src} 
        controls={false}
        className={`${className} ${!isDownloaded ? 'msg-img-blur' : ''}`} 
        style={{ ...style, maxWidth: '100%', borderRadius: '12px' }} 
      />
      {isDownloaded && (
        <div className="msg-video-play-overlay">
          <div className="msg-play-icon-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}
      {!isDownloaded && (
        <div className="msg-download-overlay" onClick={(e) => { e.stopPropagation(); handleDownload(src); }}>
          <div className="msg-download-icon-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </div>
          <span>Download to view</span>
        </div>
      )}
      {isDownloaded && (
        <button className="msg-download-btn" onClick={(e) => { e.stopPropagation(); handleDownload(src); }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
      )}
    </div>
  );

  return (
    <div className={`msg-row ${fromMe ? "msg-me" : "msg-them"}`}>
      {!fromMe && <Avatar contact={selectedUser} size={28} />}
      <div className={`msg-bubble ${fromMe ? "bubble-me" : "bubble-them"} ${((message.image || (message.images && message.images.length > 0) || message.video || (message.videos && message.videos.length > 0)) && !message.text) ? "bubble-img" : ""}`}>
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
        {message.text && (
          <p className="msg-text" style={{ marginBottom: (message.image || (message.images && message.images.length > 0) || message.video || (message.videos && message.videos.length > 0)) ? '8px' : 0 }}>
            {message.text}
          </p>
        )}
        {message.image && (
          <ImageComponent 
            src={message.image} 
            alt="sent" 
            className="msg-image" 
            style={{ marginBottom: (message.images && message.images.length > 0) ? '8px' : 0 }} 
          />
        )}
        {message.images && message.images.map((img, idx) => (
          <ImageComponent 
            key={idx}
            src={img} 
            alt="sent" 
            className="msg-image" 
            style={{ 
              marginBottom: (idx === message.images.length - 1 && !message.video && (!message.videos || message.videos.length === 0)) ? 0 : '8px',
              maxWidth: '100%',
              borderRadius: '12px'
            }} 
          />
        ))}
        {message.video && (
          <VideoComponent 
            src={message.video} 
            className="msg-video" 
            style={{ marginBottom: (message.videos && message.videos.length > 0) ? '8px' : 0 }} 
          />
        )}
        {message.videos && message.videos.map((vid, idx) => (
          <VideoComponent 
            key={idx}
            src={vid} 
            className="msg-video" 
            style={{ 
              marginBottom: idx === message.videos.length - 1 ? 0 : '8px'
            }} 
          />
        ))}
        <div className="msg-info-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '2px' }}>
          <span className="msg-time" style={{ alignSelf: 'unset' }}>{time}</span>
          {fromMe && (
            <span className={`msg-status ${message.isSeen ? 'seen' : ''}`} style={{ display: 'flex', marginLeft: '2px' }}>
              <svg width="16" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: message.isSeen ? '#34b7f1' : '#8696a0' }}>
                <path d="M18 6L9 17L4 12" />
                <path d="M23 6L14 17L9 12" />
              </svg>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
