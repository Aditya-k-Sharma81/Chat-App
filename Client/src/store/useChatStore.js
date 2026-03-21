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
          pic: u.pic,
          unreadCount: u.unreadCount || 0
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
  
  markAsSeen: async (userId) => {
    try {
      await fetch(`${BASE_URL}/api/messages/read/${userId}`, {
        method: "PUT",
        credentials: "include",
      });
    } catch (error) {
      console.log("Error in markAsSeen:", error);
    }
  },

  deleteMessage: async (messageId) => {
    try {
      const res = await fetch(`${BASE_URL}/api/messages/${messageId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        set({
          messages: get().messages.filter((m) => m._id !== messageId),
        });
      }
    } catch (error) {
      console.log("Error in deleteMessage:", error);
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      const { selectedUser, messages, users } = get();
      const isMessageFromSelectedUser = selectedUser && newMessage.senderId === selectedUser._id;
      
      if (isMessageFromSelectedUser) {
        set({
          messages: [...messages, newMessage],
        });
        get().markAsSeen(newMessage.senderId);
      } else {
        // Increment unread count for the sender
        set({
          users: users.map(u => 
            u._id === newMessage.senderId 
              ? { ...u, unreadCount: (u.unreadCount || 0) + 1 } 
              : u
          )
        });
      }
    });

    socket.on("messageDeleted", (messageId) => {
      set({
        messages: get().messages.filter((m) => m._id !== messageId),
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("messageDeleted");
  },

  setSelectedUser: (selectedUser) => {
    set({ selectedUser });
    if (selectedUser) {
      set({
        users: get().users.map(u => 
          u._id === selectedUser._id ? { ...u, unreadCount: 0 } : u
        )
      });
    }
  },
}));
