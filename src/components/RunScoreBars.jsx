import React from 'react';
import { useRunResults, useRunReviewers } from "../integrations/supabase";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const RunScoreBars = ({ runId }) => {
  const { data: results, isLoading: resultsLoading } = useRunResults(runId);
  const { data: reviewers, isLoading: reviewersLoading } = useRunReviewers(runId);

  if (resultsLoading || reviewersLoading) {
    return <div className="h-4 bg-gray-200 animate-pulse rounded"></div>;
  }

  if (!results || !reviewers) {
    return null;
  }

  const scoreData = results.map(result => {
    const reviewer = reviewers.find(r => r.id === result.reviewer_id);
    return {
      dimension: reviewer?.dimension || 'Unknown',
      score: result.result.score
    };
  });

  return (
    <div className="space-y-1">
      {scoreData.map(({ dimension, score }, index) => (
        <TooltipProvider key={index}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center space-x-2">
                <div className="text-xs w-20 truncate text-gray-500">{dimension}:</div>
                <div className="flex-grow h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                    style={{ width: `${score * 10}%` }}
                  ></div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{dimension}: {score.toFixed(1)}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
};

export default RunScoreBars;