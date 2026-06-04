import React, { useEffect } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

const NotificationToast: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();

  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 border-green-400 text-green-800';
      case 'error':
        return 'bg-red-100 border-red-400 text-red-800';
      case 'warning':
        return 'bg-yellow-100 border-yellow-400 text-yellow-800';
      case 'info':
      default:
        return 'bg-blue-100 border-blue-400 text-blue-800';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={clsx(
            'rounded-lg border-l-4 p-4 shadow-md flex items-start justify-between max-w-sm',
            getNotificationStyle(notification.type)
          )}
        >
          <div className="flex-1">
            <h4 className="font-semibold mb-1">{notification.title}</h4>
            <p className="text-sm">{notification.message}</p>
          </div>
          <button
            onClick={() => removeNotification(notification.id)}
            className="ml-2 text-xl opacity-70 hover:opacity-100 transition-opacity"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;
