import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";

const BASE_URL = "http://localhost:5000";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await fetch(`${BASE_URL}/api/messages/users`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const formattedUsers = data.map(u => ({
          _id: u._id, // Keep original ID
          id: u._id, // Add id for UI compatibility
          name: u.name,
          initials: u.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2),
          color: ["#7c6cfb", "#c084fc", "#38bdf8", "#fb923c", "#34d399"][Math.floor(Math.random() * 5)],
          bio: u.bio,
          pic: u.pic
        }));
        set({ users: formattedUsers });
      }
    } catch (error) {
      console.log("Error in getUsers:", error);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await fetch(`${BASE_URL}/api/messages/${userId}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        set({ messages: data });
      }
    } catch (error) {
      console.log("Error in getMessages:", error);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await fetch(`${BASE_URL}/api/messages/send/${selectedUser._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageData),
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        set({ messages: [...messages, data] });
      }
    } catch (error) {
      console.log("Error in sendMessage:", error);
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isMessageRelevant = 
        (newMessage.senderId === selectedUser._id && newMessage.receiverId === useAuthStore.getState().authUser._id) ||
        (newMessage.senderId === useAuthStore.getState().authUser._id && newMessage.receiverId === selectedUser._id);
      
      if (!isMessageRelevant) return;

      set({
        messages: [...get().messages, newMessage],
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
