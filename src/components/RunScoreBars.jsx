import React, { useMemo } from 'react';
import { useRunResults, useRunReviewers } from "../integrations/supabase";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const RunScoreBars = ({ runId }) => {
  const { data: results, isLoading: resultsLoading } = useRunResults(runId);
  const { data: reviewers, isLoading: reviewersLoading } = useRunReviewers(runId);

  const averageScores = useMemo(() => {
    if (!results || !reviewers) return [];

    const scoreMap = results.reduce((acc, result) => {
      const reviewer = reviewers.find(r => r.id === result.reviewer_id);
      const dimension = reviewer?.dimension || 'Unknown';
      if (!acc[dimension]) {
        acc[dimension] = { total: 0, count: 0 };
      }
      acc[dimension].total += result.result.score;
      acc[dimension].count += 1;
      return acc;
    }, {});

    return Object.entries(scoreMap).map(([dimension, { total, count }]) => ({
      dimension,
      score: total / count
    }));
  }, [results, reviewers]);

  if (resultsLoading || reviewersLoading) {
    return <div className="h-6 bg-gray-200 animate-pulse rounded"></div>;
  }

  if (!results || !reviewers) {
    return null;
  }

  return (
    <div className="space-y-2">
      {averageScores.map(({ dimension, score }, index) => (
        <TooltipProvider key={index}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center space-x-2">
                <div className="text-sm w-48 truncate text-gray-700">{dimension}:</div>
                <div className="flex-grow h-6 bg-gray-200 rounded-full overflow-hidden">
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