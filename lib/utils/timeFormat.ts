/**
 * Convert 24-hour time format (HH:MM or HH:MM:SS) to 12-hour format (h:MM AM/PM)
 */
export function formatTo12Hour(time24: string): string {
  if (!time24) return '';
  
  // Handle both "HH:MM" and "HH:MM:SS" formats
  const timeStr = time24.substring(0, 5); // Take only HH:MM
  const [hours, minutes] = timeStr.split(':').map(Number);
  
  if (isNaN(hours) || isNaN(minutes)) return time24;
  
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  
  return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
}

/**
 * Convert 12-hour time format to 24-hour format (for input fields)
 */
export function formatTo24Hour(time12: string): string {
  if (!time12) return '';
  
  const match = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return time12;
  
  let hours = parseInt(match[1]);
  const minutes = match[2];
  const period = match[3].toUpperCase();
  
  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }
  
  return `${String(hours).padStart(2, '0')}:${minutes}`;
}

