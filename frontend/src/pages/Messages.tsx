import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export default function Messages() {
  const [messages, setMessages] = useState<{ id: number; text: string; sender: string }[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const sendMessage = () => {
    if (newMessage.trim()) {
      setMessages([
        ...messages,
        { id: messages.length + 1, text: newMessage, sender: 'Vous' },
      ]);
      setNewMessage('');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Messages</h1>
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="h-64 overflow-y-auto mb-4">
          {messages.map((msg) => (
            <div key={msg.id} className="mb-2 p-2 border rounded">
              <strong>{msg.sender}:</strong> {msg.text}
            </div>
          ))}
        </div>
        <div className="flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écrivez un message..."
            className="flex-1 p-2 border rounded"
          />
          <Button variant="default" onClick={sendMessage} className="ml-2">
            Envoyer
          </Button>
        </div>
      </div>
    </div>
  );
}
