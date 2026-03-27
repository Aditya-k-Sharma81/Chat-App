import { useState, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import Swal from "sweetalert2";

export default function EditGroupModal({ group, onClose }) {
  const { updateGroup } = useChatStore();
  const [groupName, setGroupName] = useState(group.groupName);
  const [groupIcon, setGroupIcon] = useState(group.groupIcon);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    setIsSubmitting(true);
    const result = await updateGroup(group._id, {
      groupName,
      groupIcon,
    });

    if (result.success) {
      Swal.fire({
        icon: "success",
        title: "Group Updated!",
        text: "The group details have been updated successfully.",
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
        text: "Could not update group. Please try again.",
        background: "#1e1e2d",
        color: "#fff",
      });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="bg-[#111b21] w-full max-w-sm rounded-2xl border border-white/5 shadow-2xl overflow-hidden">
        <div className="p-4 bg-[#202c33] flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
             <button onClick={onClose} className="text-[#aebac1] hover:text-white">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
             </button>
             <h2 className="text-lg font-bold text-[#e9edef]">Edit Group Info</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col items-center gap-8">
            <div className="relative group">
               <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
              />
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative w-40 h-40 bg-[#202c33] rounded-full overflow-hidden border-4 border-[#111b21] shadow-xl cursor-pointer"
              >
                {groupIcon ? (
                   <img src={groupIcon} alt="Group" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#202c33] text-[#8696a0]">
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
                    </svg>
                    <span className="text-[10px] text-white font-bold uppercase mt-2">Change Icon</span>
                </div>
              </div>
            </div>

            <div className="w-full">
                <label className="text-xs font-bold text-[#00a884] uppercase tracking-wider block mb-2 px-1">Group Subject</label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full bg-transparent border-b-2 border-[#00a884] py-2 px-1 text-[#d1d7db] outline-none text-lg"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    required
                  />
                </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !groupName.trim() || (groupName === group.groupName && groupIcon === group.groupIcon)}
              className="w-16 h-16 bg-[#00a884] hover:bg-[#00c99e] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center shadow-2xl transition-all transform hover:scale-110 active:scale-95 self-end"
            >
               {isSubmitting ? (
                  <div className="w-8 h-8 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
            </button>
        </form>
      </div>
    </div>
  );
}
