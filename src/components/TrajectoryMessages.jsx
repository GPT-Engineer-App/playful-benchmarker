import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

const TrajectoryMessages = ({ runId }) => {
  const [messages, setMessages] = useState([]);
  const [expandedMessages, setExpandedMessages] = useState({});

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

  const toggleMessage = (messageId) => {
    setExpandedMessages(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  const renderContent = (message) => {
    const content = message.role === 'tool_output' ? JSON.parse(message.content) : { result: message.content };
    const lines = content.result.split('\n');
    const isLarge = lines.length > 10;
    const displayedContent = expandedMessages[message.id] || !isLarge ? content.result : lines.slice(0, 10).join('\n') + '\n...';

    return (
      <>
        <p className="whitespace-pre-wrap">{displayedContent}</p>
        {isLarge && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => toggleMessage(message.id)}
            className="mt-2"
          >
            {expandedMessages[message.id] ? (
              <>
                <ChevronUp className="mr-2 h-4 w-4" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="mr-2 h-4 w-4" />
                Show More
              </>
            )}
          </Button>
        )}
        {content.screenshot && (
          <img src={content.screenshot} alt="Screenshot" className="mt-4 max-w-full h-auto" />
        )}
      </>
    );
  };

  return (
    <Card className="w-full mx-auto">
      <CardHeader>
        <CardTitle>Trajectory Messages</CardTitle>
      </CardHeader>
      <CardContent>
        {messages.map((message) => (
          <div key={message.id} className="mb-4 p-2 bg-gray-100 rounded-lg">
            <p className="font-semibold">{message.role === "impersonator" ? "AI" : "Tool Output"}</p>
            {renderContent(message)}
            <p className="text-sm text-gray-500 mt-2">{new Date(message.created_at).toLocaleString()}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default TrajectoryMessages;