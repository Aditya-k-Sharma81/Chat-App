import { useState, useEffect } from "react";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import ChatPage from "./pages/ChatPage";

export default function App() {
  const [page, setPage] = useState("loading");

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/user/me", {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          setPage("chat");
        } else {
          setPage("login");
        }
      } catch (error) {
        setPage("login");
      }
    };

    checkSession();
  }, []);

  if (page === "loading") {
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
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>Resuming session...</p>
        </div>
      </div>
    );
  }

  if (page === "chat") return <ChatPage onLogout={() => setPage("login")} />;
  if (page === "signup") return <SignUpPage onSwitch={() => setPage("login")} onSignUp={() => setPage("chat")} />;
  return <LoginPage onSwitch={() => setPage("signup")} onLogin={() => setPage("chat")} />;
}