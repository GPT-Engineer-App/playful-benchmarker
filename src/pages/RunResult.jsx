import { useParams } from 'react-router-dom';
import { useRun, useRunResults, useRunReviewers } from '../integrations/supabase';
import Navbar from "../components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import TrajectoryMessages from '../components/TrajectoryMessages';
import ReviewerResults from '../components/ReviewerResults';
import { useMemo } from 'react';

const RunResult = () => {
  const { id } = useParams();
  const { data: run, isLoading: runLoading, error: runError } = useRun(id);
  const { data: results, isLoading: resultsLoading, error: resultsError } = useRunResults(id);
  const { data: reviewers, isLoading: reviewersLoading, error: reviewersError } = useRunReviewers(id);

  const scoreData = useMemo(() => {
    if (!results || !reviewers) return [];

    const averageScores = results.reduce((acc, result) => {
      const reviewer = reviewers.find(r => r.id === result.reviewer_id);
      const dimension = reviewer?.dimension || 'Unknown';
      if (!acc[dimension]) {
        acc[dimension] = { total: 0, count: 0 };
      }
      acc[dimension].total += result.result.score;
      acc[dimension].count += 1;
      return acc;
    }, {});

    return Object.entries(averageScores).map(([dimension, { total, count }]) => ({
      dimension,
      averageScore: parseFloat((total / count).toFixed(1))
    }));
  }, [results, reviewers]);

  if (runLoading || resultsLoading || reviewersLoading) return <div>Loading...</div>;
  if (runError) return <div>Error loading run: {runError.message}</div>;
  if (resultsError) return <div>Error loading results: {resultsError.message}</div>;
  if (reviewersError) return <div>Error loading reviewers: {reviewersError.message}</div>;

  // ... (rest of the component remains the same)