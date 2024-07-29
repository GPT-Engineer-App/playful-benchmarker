import { Button } from "@/components/ui/button";

const StartBenchmarkButton = ({ isRunning, onClick }) => {
  return (
    <Button 
      onClick={onClick} 
      className="mt-8 w-full"
      disabled={isRunning}
    >
      {isRunning ? "Running Benchmark..." : "Start Benchmark"}
    </Button>
  );
};

export default StartBenchmarkButton;
