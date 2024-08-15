import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const ReviewerResults = ({ results }) => {
  if (!results || results.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Reviewer Results</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No reviewer results available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Reviewer Results</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {results.map((result, index) => (
            <AccordionItem key={result.id} value={`item-${index}`}>
              <AccordionTrigger>
                Reviewer: {result.reviewer_id} - Score: {result.result.score}
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {result.result.messages.map((message, msgIndex) => (
                    <div key={msgIndex} className="border p-2 rounded">
                      <p><strong>{message.role}:</strong> {message.content}</p>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default ReviewerResults;