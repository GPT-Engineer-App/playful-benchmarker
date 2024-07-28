import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useSupabaseAuth } from "../integrations/supabase/auth";
import ScenarioList from "../components/ScenarioList";
import Navbar from "../components/Navbar";

const Index = () => {
  const { session } = useSupabaseAuth();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-4">Welcome to Lovable Benchmarks</h2>
        {session ? (
          <div>
            <p className="mb-6">
              Hello, {session.user.email}! You're logged in.
            </p>
            <div className="space-y-4">
              <div className="space-x-4">
                <Button asChild className="mr-4">
                  <Link to="/secrets">Manage Secrets</Link>
                </Button>
                <Button asChild className="mr-4">
                  <Link to="/create-scenario">Create Scenario</Link>
                </Button>
                <Button asChild className="mr-4">
                  <Link to="/create-review-dimension">Create Review Dimension</Link>
                </Button>
                <Button asChild>
                  <Link to="/start-benchmark">Start Benchmark</Link>
                </Button>
              </div>
              <ScenarioList />
            </div>
          </div>
        ) : (
          <div>
            <p className="mb-6">
              Lovable Benchmarks is a cutting-edge tool designed for automated benchmarking of GPT Engineer. 
              Our platform provides comprehensive insights into the performance and capabilities of AI-driven engineering solutions.
            </p>
            <div className="space-x-4">
              <Button asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/signup">Sign Up</Link>
              </Button>
            </div>
          </div>
        )}
        <Button asChild className="mt-4">
          <Link to="/about">Learn More</Link>
        </Button>
      </main>
    </div>
  );
};

export default Index;