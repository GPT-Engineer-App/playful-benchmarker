import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getScoreColor } from '../lib/utils';

const AggregatedScores = () => {
  const { data: aggregatedScores, isLoading, error } = useQuery({
    queryKey: ['aggregatedScores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('results')
        .select(`
          reviewer:reviewers(dimension),
          result
        `);
      
      if (error) throw error;

      const scoresByDimension = data.reduce((acc, { reviewer, result }) => {
        const dimension = reviewer.dimension;
        if (!acc[dimension]) {
          acc[dimension] = { total: 0, count: 0 };
        }
        acc[dimension].total += result.score;
        acc[dimension].count += 1;
        return acc;
      }, {});

      return Object.entries(scoresByDimension).map(([dimension, { total, count }]) => ({
        dimension,
        averageScore: total / count
      }));
    },
  });

  if (isLoading) return <div>Loading aggregated scores...</div>;
  if (error) return <div>Error loading aggregated scores: {error.message}</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aggregated Scores by Dimension</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {aggregatedScores.map(({ dimension, averageScore }) => (
            <div key={dimension} className="flex items-center space-x-2">
              <div className="w-1/3 text-sm font-medium truncate">{dimension}:</div>
              <div className="w-2/3 flex items-center">
                <div className="w-2/3 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getScoreColor(averageScore)}`}
                    style={{ width: `${averageScore * 10}%` }}
                  ></div>
                </div>
                <span className="text-xs ml-2">{averageScore.toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AggregatedScores;