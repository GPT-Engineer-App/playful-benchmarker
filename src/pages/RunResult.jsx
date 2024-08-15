import { useParams } from 'react-router-dom';
import { useRun, useRunResults, useReviewer } from '../integrations/supabase';
import Navbar from "../components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import TrajectoryMessages from '../components/TrajectoryMessages';
import ReviewerResults from '../components/ReviewerResults';
import { useState, useEffect } from 'react';

const RunResult = () => {
  const { id } = useParams();
  const { data: run, isLoading: runLoading, error: runError } = useRun(id);
  const { data: results, isLoading: resultsLoading, error: resultsError } = useRunResults(id);
  const [scoreData, setScoreData] = useState([]);

  useEffect(() => {
    const processResults = async () => {
      if (results) {
        const processedResults = await Promise.all(
          results.map(async (result) => {
            const { data: reviewer } = await useReviewer(result.reviewer_id);
            return {
              ...result,
              dimension: reviewer?.dimension || 'Unknown'
            };
          })
        );

        const averageScores = processedResults.reduce((acc, result) => {
          if (!acc[result.dimension]) {
            acc[result.dimension] = { total: 0, count: 0 };
          }
          acc[result.dimension].total += result.result.score;
          acc[result.dimension].count += 1;
          return acc;
        }, {});

        const newScoreData = Object.entries(averageScores).map(([dimension, { total, count }]) => ({
          dimension,
          averageScore: parseFloat((total / count).toFixed(1))
        }));

        setScoreData(newScoreData);
      }
    };

    processResults();
  }, [results]);

  if (runLoading || resultsLoading) return <div>Loading...</div>;
  if (runError) return <div>Error loading run: {runError.message}</div>;
  if (resultsError) return <div>Error loading results: {resultsError.message}</div>;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Run Details</CardTitle>
          </CardHeader>
          <CardContent>
            <p><strong>ID:</strong> {run.id}</p>
            <p><strong>Project ID:</strong> {run.project_id}</p>
            <p><strong>System Version:</strong> {run.system_version}</p>
            <p><strong>State:</strong> {run.state}</p>
            <p><strong>Created At:</strong> {new Date(run.created_at).toLocaleString()}</p>
            {run.link && (
              <Button 
                variant="outline" 
                onClick={() => window.open(run.link, '_blank')}
                className="mt-4"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Project
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Average Scores by Dimension</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scoreData.map(({ dimension, averageScore }) => (
                <div key={dimension} className="flex items-center space-x-4">
                  <div className="w-1/4 font-semibold">{dimension}</div>
                  <div className="w-3/4 flex items-center">
                    <div className="w-full h-6 relative rounded-full overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"></div>
                      <div 
                        className="absolute inset-0 bg-black opacity-50"
                        style={{ clipPath: `inset(0 0 0 ${averageScore * 10}%)` }}
                      ></div>
                      <div 
                        className="absolute top-full left-0 w-0 h-0 
                        border-l-[6px] border-l-transparent
                        border-r-[6px] border-r-transparent
                        border-b-[8px] border-b-black"
                        style={{ left: `calc(${averageScore * 10}% - 6px)` }}
                      ></div>
                    </div>
                    <span className="ml-2 font-bold">{averageScore.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <TrajectoryMessages runId={id} />
        {results && results.length > 0 && <ReviewerResults results={results} />}
      </main>
    </div>
  );
};

export default RunResult;