import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useSupabaseAuth } from "../integrations/supabase/auth";
import { useBenchmarkScenarios, useRuns, useReviewers } from "../integrations/supabase";
import ScenarioList from "../components/ScenarioList";
import RunsList from "../components/RunsList";
import ReviewersList from "../components/ReviewersList";
import AggregatedScores from "../components/AggregatedScores";
import Navbar from "../components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, PlayCircle, BarChart2, Settings, Users } from "lucide-react";

const Index = () => {
  const { session } = useSupabaseAuth();
  const { data: scenarios, isLoading: isLoadingScenarios } = useBenchmarkScenarios();
  const { data: runs, isLoading: isLoadingRuns } = useRuns();
  const { data: reviewers, isLoading: isLoadingReviewers } = useReviewers();

  const totalScenarios = scenarios?.length || 0;
  const totalRuns = runs?.length || 0;
  const totalReviewers = reviewers?.length || 0;

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-8">
        {session ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Scenarios</CardTitle>
                  <BarChart2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoadingScenarios ? "Loading..." : totalScenarios}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoadingRuns ? "Loading..." : totalRuns}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Reviewers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoadingReviewers ? "Loading..." : totalReviewers}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col space-y-2">
                  <Button asChild size="sm">
                    <Link to="/create-scenario" className="flex items-center justify-center w-full">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create Scenario
                    </Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link to="/start-benchmark" className="flex items-center justify-center w-full">
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Start Benchmark
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Scenarios</CardTitle>
                <CardDescription>A list of your most recent scenarios</CardDescription>
              </CardHeader>
              <CardContent>
                <ScenarioList />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Runs</CardTitle>
                <CardDescription>A list of your most recent benchmark runs</CardDescription>
              </CardHeader>
              <CardContent>
                <RunsList />
              </CardContent>
            </Card>

            <AggregatedScores />
            <ReviewersList />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] space-y-6">
            <h2 className="text-4xl font-bold text-center">Welcome to Lovable Benchmarks</h2>
            <p className="text-xl text-center max-w-2xl">
              Lovable Benchmarks is a cutting-edge tool designed for automated benchmarking of GPT Engineer. 
              Our platform provides comprehensive insights into the performance and capabilities of AI-driven engineering solutions.
            </p>
            <div className="space-x-4">
              <Button asChild size="lg">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/signup">Sign Up</Link>
              </Button>
            </div>
            <Button asChild variant="link">
              <Link to="/about">Learn More</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
