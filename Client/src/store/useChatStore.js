import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";

const BASE_URL = window.location.hostname === "localhost" ? "http://localhost:5000" : "https://chat-app-0o6n.onrender.com";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  groups: [],
  selectedUser: null,
  selectedGroup: null,
  isUsersLoading: false,
  isGroupsLoading: false,
  isMessagesLoading: false,
  isSendingMessage: false,
  previewImage: null,

  setPreviewImage: (image) => set({ previewImage: image }),

  getUsers: async () => {
    const authUser = useAuthStore.getState().authUser;
    if (!authUser) return;

    set({ isUsersLoading: true });
    try {
      const res = await fetch(`${BASE_URL}/api/messages/users`, {
        credentials: "include",
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        const data = resData.data;
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

  getGroups: async () => {
    const authUser = useAuthStore.getState().authUser;
    if (!authUser) return;

    set({ isGroupsLoading: true });
    try {
      const res = await fetch(`${BASE_URL}/api/groups`, {
        credentials: "include",
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        set({ groups: resData.data });
      }
    } catch (error) {
      console.log("Error in getGroups:", error);
    } finally {
      set({ isGroupsLoading: false });
    }
  },

  createGroup: async (groupData) => {
    try {
      const res = await fetch(`${BASE_URL}/api/groups/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(groupData),
        credentials: "include",
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        const newGroup = resData.data;
        set({ groups: [newGroup, ...get().groups] });
        
        // Join the socket room for the new group
        const socket = useAuthStore.getState().socket;
        if (socket) socket.emit("joinGroup", newGroup._id);

        return { success: true, group: newGroup };
      }
      return { success: false };
    } catch (error) {
      console.log("Error in createGroup:", error);
      return { success: false };
    }
  },

  updateGroup: async (groupId, updateData) => {
    try {
      const res = await fetch(`${BASE_URL}/api/groups/${groupId}/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
        credentials: "include",
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        const updatedGroup = resData.data;
        set({
          groups: get().groups.map((g) => (g._id === groupId ? updatedGroup : g)),
          selectedGroup: updatedGroup,
        });
        return { success: true, group: updatedGroup };
      }
      return { success: false };
    } catch (error) {
      console.log("Error in updateGroup:", error);
      return { success: false };
    }
  },

  deleteGroup: async (groupId) => {
    try {
      const res = await fetch(`${BASE_URL}/api/groups/${groupId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        set({
          groups: get().groups.filter((g) => g._id !== groupId),
          selectedGroup: null,
          messages: [],
        });
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      console.log("Error in deleteGroup:", error);
      return { success: false };
    }
  },

  leaveGroup: async (groupId) => {
    try {
      const res = await fetch(`${BASE_URL}/api/groups/${groupId}/leave`, {
        method: "POST",
        credentials: "include",
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        set({
          groups: get().groups.filter((g) => g._id !== groupId),
          selectedGroup: null,
          messages: [],
        });
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      console.log("Error in leaveGroup:", error);
      return { success: false };
    }
  },

  getMessages: async (id, isGroup = false) => {
    set({ isMessagesLoading: true });
    try {
      const url = isGroup ? `${BASE_URL}/api/groups/${id}` : `${BASE_URL}/api/messages/${id}`;
      const res = await fetch(url, {
        credentials: "include",
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        set({ messages: resData.data });
      }
    } catch (error) {
      console.log("Error in getMessages:", error);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, selectedGroup, messages } = get();
    set({ isSendingMessage: true });
    try {
      const id = selectedGroup ? selectedGroup._id : selectedUser._id;
      const body = selectedGroup ? { ...messageData, groupId: id } : messageData;

      const res = await fetch(`${BASE_URL}/api/messages/send/${selectedGroup ? id : id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        set({ messages: [...messages, resData.data] });
      }
    } catch (error) {
      console.log("Error in sendMessage:", error);
    } finally {
      set({ isSendingMessage: false });
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
      const resData = await res.json();
      if (res.ok && resData.success) {
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

    // Join all group rooms
    const { groups } = get();
    groups.forEach(group => {
      socket.emit("joinGroup", group._id);
    });

    socket.on("newMessage", async (newMessage) => {
      const { selectedUser, selectedGroup, messages, users, groups } = get();

      // Normalize senderId to string for comparison
      const senderId = newMessage.senderId?._id || newMessage.senderId;
      const senderName = newMessage.senderId?.name || "Someone";

      const isMessageForSelectedChat =
        (selectedUser && senderId === selectedUser._id && !newMessage.groupId) ||
        (selectedGroup && newMessage.groupId === selectedGroup._id);

      if (isMessageForSelectedChat) {
        set({
          messages: [...messages, newMessage],
        });
        if (!newMessage.groupId && senderId) {
          get().markAsSeen(senderId);
        }
      } else {
        // Play notification sound
        const audio = new Audio("https://res.cloudinary.com/dwyon783q/video/upload/v1711718055/notification_msl6dz.mp3");
        audio.play().catch(err => console.log("Sound play error:", err));

        // Show Toast Notification
        const Swal = (await import("sweetalert2")).default;
        Swal.fire({
          title: `New message from ${senderName}`,
          text: newMessage.text || "Sent an attachment",
          icon: "info",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          background: "#1e1e2d",
          color: "#fff",
        });

        // Handle unread counts for users or groups
        if (newMessage.groupId) {
          set({
            groups: groups.map(g =>
              g._id === newMessage.groupId
                ? { ...g, unreadCount: (g.unreadCount || 0) + 1 }
                : g
            )
          });
        } else {
          set({
            users: users.map(u =>
              u._id === senderId
                ? { ...u, unreadCount: (u.unreadCount || 0) + 1 }
                : u
            )
          });
        }
      }
    });

    socket.on("messageDeleted", (messageId) => {
      set({
        messages: get().messages.filter((m) => m._id !== messageId),
      });
    });

    socket.on("messagesRead", ({ readerId }) => {
      const { selectedUser, messages } = get();
      if (selectedUser && readerId === selectedUser._id) {
        set({
          messages: messages.map((m) =>
            m.receiverId === readerId ? { ...m, isSeen: true } : m
          ),
        });
      }
    });

    socket.on("userUpdated", (updatedUser) => {
      const { users, selectedUser } = get();
      
      // Update users list
      const updatedUsers = users.map((u) => {
        if (u._id === updatedUser._id) {
          return {
            ...u,
            name: updatedUser.name,
            pic: updatedUser.pic,
            bio: updatedUser.bio,
            initials: updatedUser.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
          };
        }
        return u;
      });

      set({ users: updatedUsers });

      // Update selectedUser if it's the one who was updated
      if (selectedUser && selectedUser._id === updatedUser._id) {
        set({
          selectedUser: {
            ...selectedUser,
            name: updatedUser.name,
            pic: updatedUser.pic,
            bio: updatedUser.bio,
            initials: updatedUser.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
          }
        });
      }
    });

    socket.on("newGroup", (newGroup) => {
      const { groups } = get();
      if (!groups.find((g) => g._id === newGroup._id)) {
        set({ groups: [newGroup, ...groups] });
        socket.emit("joinGroup", newGroup._id);
      }
    });

    socket.on("groupUpdated", (updatedGroup) => {
      const { groups, selectedGroup } = get();
      set({
        groups: groups.map((g) => (g._id === updatedGroup._id ? updatedGroup : g)),
      });
      if (selectedGroup && selectedGroup._id === updatedGroup._id) {
        set({ selectedGroup: updatedGroup });
      }
    });

    socket.on("groupDeleted", (groupId) => {
      const { groups, selectedGroup } = get();
      set({
        groups: groups.filter((g) => g._id !== groupId),
      });
      if (selectedGroup && selectedGroup._id === groupId) {
        set({ selectedGroup: null, messages: [] });
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    const { groups } = get();
    groups.forEach(group => {
      socket.emit("leaveGroup", group._id);
    });

    socket.off("newMessage");
    socket.off("messageDeleted");
    socket.off("messagesRead");
    socket.off("userUpdated");
    socket.off("newGroup");
    socket.off("groupUpdated");
    socket.off("groupDeleted");
  },

  setSelectedUser: (selectedUser) => {
    set({ selectedUser, selectedGroup: null });
    if (selectedUser) {
      set({
        users: get().users.map(u =>
          u._id === selectedUser._id ? { ...u, unreadCount: 0 } : u
        )
      });
    }
  },

  setSelectedGroup: (selectedGroup) => {
    set({ selectedGroup, selectedUser: null });
    if (selectedGroup) {
      set({
        groups: get().groups.map(g =>
          g._id === selectedGroup._id ? { ...g, unreadCount: 0 } : g
        )
      });
    }
  },
}));
