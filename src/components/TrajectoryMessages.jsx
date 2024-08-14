import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

const TrajectoryMessages = ({ runId }) => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('trajectory_messages')
        .select('*')
        .eq('run_id', runId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching trajectory messages:', error);
      } else {
        setMessages(data);
      }
    };

    fetchMessages();
  }, [runId]);

  return (
    <Card className="w-full mx-auto">
      <CardHeader>
        <CardTitle>Trajectory Messages</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] w-full rounded-md border p-4">
          {messages.map((message) => (
            <div key={message.id} className="mb-4 p-2 bg-gray-100 rounded-lg">
              <p className="font-semibold">{message.role === "impersonator" ? "AI" : "Tool Output"}</p>
              {message.role === "tool_output" ? (
                <ToolOutput content={message.content} />
              ) : (
                <p>{message.content}</p>
              )}
              <p className="text-sm text-gray-500">{new Date(message.created_at).toLocaleString()}</p>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

const ToolOutput = ({ content }) => {
  try {
    const parsedContent = JSON.parse(content);
    return (
      <div>
        {parsedContent.screenshot && (
          <img src={parsedContent.screenshot} alt="Screenshot" className="mb-2 max-w-full h-auto" />
        )}
        <p>{parsedContent.result}</p>
      </div>
    );
  } catch (error) {
    console.error('Error parsing tool output:', error);
    return <p>{content}</p>;
  }
};

export default TrajectoryMessages;