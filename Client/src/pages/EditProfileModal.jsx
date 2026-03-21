import { useState, useRef } from "react";

export default function EditProfileModal({ profile, onSave, onClose }) {
  const [name, setName]   = useState(profile.name);
  const [bio, setBio]     = useState(profile.bio);
  const [avatar, setAvatar] = useState(profile.avatar); // base64 or null
  const fileRef = useRef(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatar(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), bio: bio.trim(), avatar });
    onClose();
  };

  // Initials fallback
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="ep-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ep-card">
        {/* Header */}
        <div className="ep-header">
          <h2 className="ep-title">Edit Profile</h2>
          <button className="ep-close" onClick={onClose} title="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Avatar picker */}
        <div className="ep-avatar-section">
          <button className="ep-avatar-btn" onClick={() => fileRef.current?.click()} title="Change photo">
            {avatar ? (
              <img src={avatar} alt="avatar" className="ep-avatar-img" />
            ) : (
              <div className="ep-avatar-initials">{initials}</div>
            )}
            <div className="ep-avatar-overlay">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <span>Change photo</span>
            </div>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleAvatarChange}
          />
          {avatar && (
            <button
              className="ep-remove-avatar"
              onClick={() => setAvatar(null)}
              title="Remove photo"
            >
              Remove photo
            </button>
          )}
        </div>

        {/* Fields */}
        <div className="ep-fields">
          {/* Name */}
          <div className="ep-field">
            <label className="ep-label">Display Name</label>
            <div className="ep-input-wrap">
              <span className="ep-input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </span>
              <input
                className="ep-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                maxLength={32}
              />
            </div>
          </div>

          {/* Bio / Status */}
          <div className="ep-field">
            <label className="ep-label">Status Message <span className="ep-label-hint">(shown to others)</span></label>
            <div className="ep-input-wrap">
              <span className="ep-input-icon ep-input-icon-top">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </span>
              <textarea
                className="ep-textarea"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write something about yourself..."
                maxLength={120}
                rows={3}
              />
            </div>
            <span className="ep-char-count">{bio.length}/120</span>
          </div>
        </div>

        {/* Actions */}
        <div className="ep-actions">
          <button className="ep-btn-cancel" onClick={onClose}>Cancel</button>
          <button
            className="ep-btn-save"
            onClick={handleSave}
            disabled={!name.trim()}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
