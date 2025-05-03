import { useState, useCallback } from 'react';

type NotificationType = 'success' | 'error' | 'info';

interface NotificationState {
  type: NotificationType;
  message: string;
  id: number;
}

export function useNotification() {
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const [notificationId, setNotificationId] = useState(0);

  const showNotification = useCallback((type: NotificationType, message: string) => {
    setNotificationId(prev => prev + 1);
    setNotification({ type, message, id: notificationId });
  }, [notificationId]);

  const hideNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return {
    notification,
    showNotification,
    hideNotification
  };
}