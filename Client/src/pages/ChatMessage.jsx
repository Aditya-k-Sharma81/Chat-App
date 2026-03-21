import { useAuthStore } from "../store/useAuthStore";
import { Avatar } from "./ChatPage";

export default function ChatMessage({ message, selectedUser }) {
  const { authUser } = useAuthStore();
  const fromMe = message.senderId === authUser._id;
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={`msg-row ${fromMe ? "msg-me" : "msg-them"}`}>
      {!fromMe && <Avatar contact={selectedUser} size={28} />}
      <div className={`msg-bubble ${fromMe ? "bubble-me" : "bubble-them"} ${message.image ? "bubble-img" : ""}`}>
        {message.image ? (
          <img src={message.image} alt="sent" className="msg-image" />
        ) : (
          <p className="msg-text">{message.text}</p>
        )}
        <span className="msg-time">{time}</span>
      </div>
    </div>
  );
}
