import { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Avatar } from "./ChatPage";
import Swal from "sweetalert2";

export default function CreateGroupModal({ onClose }) {
  const { users, createGroup } = useChatStore();
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleMember = (userId) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    if (selectedMembers.length < 1) {
      Swal.fire({
        icon: "warning",
        title: "Minimum 1 member",
        text: "Please select at least one member to create a group.",
        background: "#1e1e2d",
        color: "#fff",
      });
      return;
    }

    setIsSubmitting(true);
    const result = await createGroup({
      groupName,
      members: selectedMembers,
    });

    if (result.success) {
      Swal.fire({
        icon: "success",
        title: "Group Created!",
        text: `Group "${groupName}" has been created successfully.`,
        timer: 2000,
        showConfirmButton: false,
        background: "#1e1e2d",
        color: "#fff",
      });
      onClose();
    } else {
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: "Could not create group. Please try again.",
        background: "#1e1e2d",
        color: "#fff",
      });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1e1e2d] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Create New Group</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-2">Group Name</label>
            <input
              type="text"
              className="w-full bg-[#13131d] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#7c6cfb] transition-colors"
              placeholder="Enter group name..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-2">Select Members ({selectedMembers.length})</label>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {users.map((user) => (
                <div
                  key={user._id}
                  onClick={() => toggleMember(user._id)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                    selectedMembers.includes(user._id)
                      ? "bg-[#7c6cfb]/20 border border-[#7c6cfb]/50"
                      : "bg-white/5 border border-transparent hover:bg-white/10"
                  }`}
                >
                  <Avatar contact={user} size={32} />
                  <span className="text-white font-medium flex-1">{user.name}</span>
                  {selectedMembers.includes(user._id) && (
                    <div className="w-5 h-5 bg-[#7c6cfb] rounded-full flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !groupName.trim()}
            className="w-full bg-[#7c6cfb] hover:bg-[#6b5ae0] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-[#7c6cfb]/20"
          >
            {isSubmitting ? "Creating..." : "Create Group"}
          </button>
        </form>
      </div>
    </div>
  );
}
