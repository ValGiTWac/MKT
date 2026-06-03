import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export default function Notifications() {
  const [notifications, setNotifications] = useState<{ id: number; message: string; read: boolean }[]>([
    { id: 1, message: 'Nouveau post créé', read: false },
    { id: 2, message: 'Validation requise', read: false },
  ]);

  const markAsRead = (id: number) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Notifications</h1>
      <div className="space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg ${notification.read ? 'bg-gray-100' : 'bg-white shadow'}`}
          >
            <p>{notification.message}</p>
            {!notification.read && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAsRead(notification.id)}
                className="mt-2"
              >
                Marquer comme lu
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
