import { useState, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { Avatar } from "./ChatPage";
import Swal from "sweetalert2";

export default function CreateGroupModal({ onClose }) {
  const { users, createGroup } = useChatStore();
  const [step, setStep] = useState(1); // 1: Select Members, 2: Group Details
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [groupIcon, setGroupIcon] = useState(null);

  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGroupIcon(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleMember = (userId) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedUsersData = users.filter((user) =>
    selectedMembers.includes(user._id)
  );

  const handleNext = () => {
    if (selectedMembers.length > 0) {
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    setIsSubmitting(true);
    const result = await createGroup({
      groupName,
      members: selectedMembers,
      groupIcon,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="bg-[#111b21] w-full max-w-md rounded-2xl border border-white/5 shadow-2xl overflow-hidden flex flex-col h-[600px]">
        {/* Header */}
        <div className="p-4 bg-[#202c33] flex items-center gap-4 border-b border-white/5">
          <button onClick={step === 1 ? onClose : () => setStep(1)} className="text-[#aebac1] hover:text-white transition-colors">
            {step === 1 ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
              </svg>
            )}
          </button>
          <div>
            <h2 className="text-lg font-bold text-[#e9edef] leading-tight">
              {step === 1 ? "Add group members" : "New group"}
            </h2>
            <p className="text-xs text-[#8696a0]">
              {step === 1 ? `${selectedMembers.length} of ${users.length} selected` : "Add subject"}
            </p>
          </div>
        </div>

        {step === 1 ? (
          <>
            {/* Selected Members Bar */}
            {selectedMembers.length > 0 && (
              <div className="flex gap-4 p-4 overflow-x-auto bg-[#111b21] border-b border-white/5 custom-scrollbar-h">
                {selectedUsersData.map((user) => (
                  <div key={user._id} className="relative flex-shrink-0 flex flex-col items-center gap-1 w-14">
                    <Avatar contact={user} size={45} />
                    <span className="text-[10px] text-[#aebac1] truncate w-full text-center">{user.name.split(" ")[0]}</span>
                    <button 
                      onClick={() => toggleMember(user._id)}
                      className="absolute -top-1 -right-1 bg-[#202c33] text-[#aebac1] rounded-full p-0.5 hover:text-white"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search */}
            <div className="p-3 bg-[#111b21]">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type contact name"
                  className="w-full bg-[#202c33] text-[#d1d7db] text-sm py-2 px-4 rounded-lg outline-none border-b-2 border-transparent focus:border-[#00a884] transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* User List */}
            <div className="flex-1 overflow-y-auto px-1 custom-scrollbar">
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-[#8696a0] text-sm">No contacts found</div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user._id}
                    onClick={() => toggleMember(user._id)}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-[#202c33] cursor-pointer transition-colors group"
                  >
                    <div className="relative">
                      <Avatar contact={user} size={45} />
                    </div>
                    <div className="flex-1 border-b border-white/5 py-1 group-last:border-none">
                      <span className="text-[#e2e8f0] font-medium block">{user.name}</span>
                      <span className="text-xs text-[#8696a0]">{user.bio || "Available"}</span>
                    </div>
                    <div className={`w-5 h-5 rounded-sm border-2 flex items-center justify-center transition-all ${
                      selectedMembers.includes(user._id)
                        ? "bg-[#00a884] border-[#00a884]"
                        : "border-[#8696a0]"
                    }`}>
                      {selectedMembers.includes(user._id) && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer FAB */}
            {selectedMembers.length > 0 && (
              <div className="p-6 flex justify-center">
                <button
                  onClick={handleNext}
                  className="w-14 h-14 bg-[#00a884] hover:bg-[#00c99e] text-white rounded-full flex items-center justify-center shadow-xl transition-all transform hover:rotate-12"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>
            )}
          </>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-6 gap-8 bg-[#111b21]">
            <div className="flex flex-col items-center gap-6 mt-4">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
              />
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative w-36 h-36 bg-[#202c33] rounded-full flex items-center justify-center border-2 border-dashed border-[#8696a0] cursor-pointer hover:bg-[#2a3942] transition-all group overflow-hidden"
              >
                {groupIcon ? (
                  <img src={groupIcon} alt="Group" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-[#8696a0] group-hover:text-[#00a884]">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
                    </svg>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Group Icon</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
                    </svg>
                </div>
              </div>
              <div className="w-full">
                <input
                  type="text"
                  placeholder="Group subject"
                  autoFocus
                  className="w-full bg-transparent border-b-2 border-[#00a884] py-2 px-1 text-[#d1d7db] outline-none placeholder:text-[#8696a0]"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  required
                />
                <p className="text-[10px] text-[#8696a0] mt-2">Provide a group subject and optional group icon</p>
              </div>
            </div>

            <div className="mt-auto flex justify-center pb-2">
              <button
                type="submit"
                disabled={isSubmitting || !groupName.trim()}
                className="w-16 h-16 bg-[#00a884] hover:bg-[#00c99e] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center shadow-2xl transition-all transform hover:scale-110 active:scale-95 group-hover:shadow-[#00a884]/40"
              >
                {isSubmitting ? (
                  <div className="w-8 h-8 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
