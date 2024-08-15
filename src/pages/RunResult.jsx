import { useParams } from 'react-router-dom';
import { useRun } from '../integrations/supabase';
import Navbar from "../components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import TrajectoryMessages from '../components/TrajectoryMessages';

const RunResult = () => {
  const { id } = useParams();
  const { data: run, isLoading, error } = useRun(id);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

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
        <TrajectoryMessages runId={id} />
      </main>
    </div>
  );
};

export default RunResult;