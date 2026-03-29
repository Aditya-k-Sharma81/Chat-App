import { useState } from "react";
import Swal from "sweetalert2";
import { useAuthStore } from "../store/useAuthStore";

export default function SignUpPage({ onSwitch }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { signup, isSigningUp } = useAuthStore();

  // Password strength
  const getStrength = (pwd) => {
    if (!pwd) return { level: 0, label: "", color: "" };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { level: 1, label: "Weak", color: "#ef4444" };
    if (score === 2) return { level: 2, label: "Fair", color: "#f59e0b" };
    if (score === 3) return { level: 3, label: "Good", color: "#10b981" };
    return { level: 4, label: "Strong", color: "#00a884" };
  };

  const strength = getStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const success = await signup({ name, email, password });
      if (success) {
        Swal.fire({
          icon: "success",
          title: "Registration Successful!",
          text: "Account created! Please login to continue.",
          timer: 2000,
          showConfirmButton: false,
          background: "#1e1e2d",
          color: "#fff",
        }).then(() => {
          onSwitch?.();
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Registration Failed",
        text: error.message,
        background: "#1e1e2d",
        color: "#fff",
      });
    }
  };

  return (
    <div className="login-root">
      {/* Animated background blobs */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />
      <div className="grid-overlay" />

      <div className="login-layout">
        {/* Left — branding */}
        <div className="brand-side">
          <div className="brand-logo">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="16" fill="url(#logoGradSU)" />
              <circle cx="16" cy="24" r="3" fill="white" />
              <circle cx="24" cy="24" r="3" fill="white" />
              <circle cx="32" cy="24" r="3" fill="white" />
              <path d="M8 34 L14 28" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <defs>
                <linearGradient id="logoGradSU" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00a884" />
                  <stop offset="1" stopColor="#008069" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className="brand-name">NexChat</h1>
          <p className="brand-tagline">Your new home for conversations.</p>
          <div className="brand-features">
            <div className="feature-item">
              <span className="feature-icon">🚀</span>
              <span>Get started in seconds</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">👥</span>
              <span>Group & private chats</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🎨</span>
              <span>Fully customizable profile</span>
            </div>
          </div>
        </div>

        {/* Right — sign up card */}
        <div className="card-side">
          <div className="login-card">
            <div className="card-header">
              <div className="card-badge">New here?</div>
              <h2 className="card-title">Create your account</h2>
              <p className="card-sub">Fill in the details below to get started</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              {/* Full Name */}
              <div className="input-group">
                <label htmlFor="name" className="input-label">Full Name</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="input-field"
                    required
                    autoComplete="name"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="input-group">
                <label htmlFor="su-email" className="input-label">Email Address</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="M2 8l10 6 10-6" />
                    </svg>
                  </span>
                  <input
                    id="su-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-field"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="input-group">
                <label htmlFor="su-password" className="input-label">Password</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    id="su-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="input-field"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="toggle-pass"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C6 20 1 12 1 12a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Password strength bar */}
                {password && (
                  <div className="strength-wrap">
                    <div className="strength-bars">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="strength-bar"
                          style={{
                            background: i <= strength.level ? strength.color : "rgba(255,255,255,0.08)",
                            transition: "background 0.3s ease",
                          }}
                        />
                      ))}
                    </div>
                    <span className="strength-label" style={{ color: strength.color }}>
                      {strength.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                className={`login-btn ${isSigningUp ? "login-btn-loading" : ""}`}
                disabled={isSigningUp}
              >
                {isSigningUp ? (
                  <span className="btn-spinner" />
                ) : (
                  <>
                    <span>Create Account</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <line x1="19" y1="8" x2="19" y2="14" />
                      <line x1="22" y1="11" x2="16" y2="11" />
                    </svg>
                  </>
                )}
              </button>

              <p className="signup-text">
                Already have an account?{" "}
                <a href="#" className="signup-link" onClick={(e) => { e.preventDefault(); onSwitch?.(); }}>Sign in</a>
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Trust Footer */}
      <footer className="trust-footer">
        <div className="footer-links">
          <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
          <span className="dot">•</span>
          <a href="#" onClick={(e) => e.preventDefault()}>Terms of Service</a>
          <span className="dot">•</span>
          <a href="#" onClick={(e) => e.preventDefault()}>About NexChat</a>
          <span className="dot">•</span>
          <a href="#" onClick={(e) => e.preventDefault()}>Contact Support</a>
        </div>
        <p className="footer-copy">© 2024 NexChat. Professional Real-time Messaging Platform.</p>
      </footer>
    </div>
  );
}
