import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

const TrajectoryMessages = ({ projectId }) => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, `project/${projectId}/trajectory`),
      where('channel.type', '==', 'instant-channel'),
      orderBy('timestamp', 'asc')
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedMessages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(fetchedMessages);
    });

    return () => unsubscribe();
  }, [projectId]);

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Trajectory Messages</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full rounded-md border p-4">
          {messages.map((message) => (
            <div key={message.id} className="mb-4 p-2 bg-gray-100 rounded-lg">
              <p className="font-semibold">{message.role === "user" ? "Human" : "AI"}</p>
              <p>{message.content}</p>
              <p className="text-sm text-gray-500">{new Date(message.timestamp?.toDate()).toLocaleString()}</p>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TrajectoryMessages;
