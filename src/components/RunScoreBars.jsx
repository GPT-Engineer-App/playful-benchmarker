import React from 'react';
import { useRunResults, useRunReviewers } from "../integrations/supabase";

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
    <div className="flex space-x-1">
      {scoreData.map(({ dimension, score }, index) => (
        <div key={index} className="flex-1">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
              style={{ width: `${score * 10}%` }}
              title={`${dimension}: ${score.toFixed(1)}`}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RunScoreBars;