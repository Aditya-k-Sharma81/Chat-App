import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";

const BASE_URL = "http://localhost:5000";

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

  getGroups: async () => {
    set({ isGroupsLoading: true });
    try {
      const res = await fetch(`${BASE_URL}/api/groups`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        set({ groups: data });
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
      if (res.ok) {
        const newGroup = await res.json();
        set({ groups: [newGroup, ...get().groups] });
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
      if (res.ok) {
        const updatedGroup = await res.json();
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
      if (res.ok) {
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
      if (res.ok) {
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
      if (res.ok) {
        const data = await res.json();
        set({ messages: [...messages, data] });
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

    // Join all group rooms
    const { groups } = get();
    groups.forEach(group => {
      socket.emit("joinGroup", group._id);
    });

    socket.on("newMessage", (newMessage) => {
      const { selectedUser, selectedGroup, messages, users } = get();
      
      const isMessageForSelectedChat = 
        (selectedUser && newMessage.senderId === selectedUser._id && !newMessage.groupId) ||
        (selectedGroup && newMessage.groupId === selectedGroup._id);
      
      if (isMessageForSelectedChat) {
        set({
          messages: [...messages, newMessage],
        });
        if (!newMessage.groupId && newMessage.senderId) {
            get().markAsSeen(newMessage.senderId);
        }
      } else {
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
                u._id === newMessage.senderId 
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
