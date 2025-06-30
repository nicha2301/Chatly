import { useTranslation } from '../i18n';
import i18n from '../i18n';

/**
 * Định dạng thời gian tin nhắn
 * @param date Thời gian cần định dạng
 * @returns Chuỗi thời gian đã định dạng (VD: "Hôm nay", "Hôm qua", "10:30", "T2", "25/06")
 */
export const formatMessageTime = (date: Date): string => {
  const now = new Date();
  
  // Nếu là cùng ngày
  if (isSameDay(date, now)) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // Nếu là hôm qua
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(date, yesterday)) {
    return i18n.t('time.yesterday');
  }
  
  // Nếu là trong tuần này (7 ngày trở lại)
  if (now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
    const options: Intl.DateTimeFormatOptions = { weekday: 'short' };
    return date.toLocaleDateString(undefined, options);
  }
  
  // Khác thì hiển thị ngày/tháng
  return date.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' });
};

/**
 * Kiểm tra hai ngày có cùng ngày không
 * @param date1 Ngày thứ nhất
 * @param date2 Ngày thứ hai
 * @returns true nếu hai ngày là cùng một ngày, false nếu khác ngày
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
};

/**
 * Định dạng thời gian tương đối (ví dụ: "vừa xong", "5 phút trước", "2 giờ trước")
 * @param date Thời gian cần định dạng
 * @returns Chuỗi thời gian tương đối
 */
export const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return i18n.t('time.just_now');
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return i18n.t('time.minutes_ago', { count: diffInMinutes });
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return i18n.t('time.hours_ago', { count: diffInHours });
  }
  
  return formatMessageTime(date);
};

/**
 * Định dạng thời gian hiển thị đầy đủ
 * @param date Thời gian cần định dạng
 * @returns Chuỗi thời gian đầy đủ (VD: "25 tháng 6, 2023 10:30")
 */
export const formatFullDateTime = (date: Date): string => {
  return date.toLocaleString([], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}; 