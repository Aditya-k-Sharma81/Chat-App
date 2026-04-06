import { create } from "zustand";
import { io } from "socket.io-client";

const BASE_URL = window.location.hostname === "localhost" ? "http://localhost:5000" : "https://chat-app-0o6n.onrender.com";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  isLoggingIn: false,
  isSigningUp: false,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/user/me`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        set({ authUser: data });
        get().connectSocket();
      } else {
        set({ authUser: null });
      }
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await fetch(`${BASE_URL}/api/user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        set({ authUser: resData });
        get().connectSocket();
      } else {
        throw new Error(resData.message);
      }
    } catch (error) {
      throw error;
    } finally {
      set({ isLoggingIn: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await fetch(`${BASE_URL}/api/user/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        return true;
      } else {
        throw new Error(resData.message);
      }
    } catch (error) {
      throw error;
    } finally {
      set({ isSigningUp: false });
    }
  },

  logout: async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/user/logout`, {
        method: "POST",
        credentials: "include",
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        set({ authUser: null });
        get().disconnectSocket();
      } else {
        console.error("Logout failed:", resData?.message);
        // Fallback for UI
        set({ authUser: null });
        get().disconnectSocket();
      }
    } catch (error) {
      console.log("Error in logout:", error);
      // Fallback for UI
      set({ authUser: null });
      get().disconnectSocket();
    }
  },

  updateProfile: async (data) => {
    try {
      const res = await fetch(`${BASE_URL}/api/user/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        set({ authUser: resData });
        return resData;
      } else {
        throw new Error(resData.message);
      }
    } catch (error) {
      throw error;
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });
    socket.connect();

    set({ socket: socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
  },

  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}));
