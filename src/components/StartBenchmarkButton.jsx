import { Button } from "@/components/ui/button";

const StartBenchmarkButton = ({ isRunning, onClick }) => {
  return (
    <Button 
      onClick={onClick} 
      className="mt-8 w-full"
    >
      {isRunning ? "Stop Benchmark" : "Start Benchmark"}
    </Button>
  );
};

export default StartBenchmarkButton;
