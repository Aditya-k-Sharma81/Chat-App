/**
 * Formats a date string for the chat message grouping header.
 * @param {string} dateString - The date string from the message.
 * @returns {string} - "Today", "Yesterday", or "Monday, 16 March 2026"
 */
export const formatChatHeaderDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  
  // Set time to 0 to compare only dates
  const dDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = dNow - dDate;
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Yesterday";
  } else {
    // Return "Sunday, 16 March 2026"
    return date.toLocaleDateString('en-GB', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  }
};
