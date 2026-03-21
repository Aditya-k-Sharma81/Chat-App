import { create } from "zustand";
import { io } from "socket.io-client";

const BASE_URL = "http://localhost:5000";

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
      if (res.ok) {
        const data = await res.json();
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
      if (res.ok) {
        const user = await res.json();
        set({ authUser: user });
        get().connectSocket();
      } else {
        const error = await res.json();
        throw new Error(error.message);
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
      const res = await fetch(`${BASE_URL}/api/user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (res.ok) {
        const user = await res.json();
        set({ authUser: user });
        get().connectSocket();
      } else {
        const error = await res.json();
        throw new Error(error.message);
      }
    } catch (error) {
      throw error;
    } finally {
      set({ isSigningUp: false });
    }
  },

  logout: async () => {
    try {
      await fetch(`${BASE_URL}/api/user/logout`, {
        method: "POST",
        credentials: "include",
      });
      set({ authUser: null });
      get().disconnectSocket();
    } catch (error) {
      console.log("Error in logout:", error);
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
      if (res.ok) {
        const updatedUser = await res.json();
        set({ authUser: updatedUser });
        return updatedUser;
      } else {
        const error = await res.json();
        throw new Error(error.message);
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
