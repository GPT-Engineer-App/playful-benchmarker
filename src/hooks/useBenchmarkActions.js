import { useState, useCallback, useEffect } from "react";
import { useAddRun, useAddResult, useUpdateRun, useRuns } from "../integrations/supabase";
import { supabase } from "../integrations/supabase";
import { toast } from "sonner";
import { impersonateUser } from "../utils/userImpersonation";
import { handleSingleIteration } from "../utils/benchmarkIteration";

export const useBenchmarkActions = (userSecrets) => {
  const [isRunning, setIsRunning] = useState(false);
  const addRun = useAddRun();
  const addResult = useAddResult();
  const updateRun = useUpdateRun();
  const { data: runs } = useRuns();

  const startBenchmark = useCallback(async (selectedScenarios, scenarios, systemVersion, session) => {
    setIsRunning(true);

    try {
      const secrets = JSON.parse(userSecrets[0].secret);
      const gptEngineerTestToken = secrets.GPT_ENGINEER_TEST_TOKEN;

      for (const scenarioId of selectedScenarios) {
        const scenario = scenarios.find((s) => s.id === scenarioId);
        
        const { projectId, projectLink } = await impersonateUser(scenario.prompt, systemVersion, scenario.llm_temperature, gptEngineerTestToken);

        const { data: newRun, error: createRunError } = await supabase
          .from('runs')
          .insert({
            scenario_id: scenarioId,
            system_version: systemVersion,
            project_id: projectId,
            user_id: session.user.id,
            link: projectLink,
            state: 'paused'
          })
          .select()
          .single();

        if (createRunError) throw new Error(`Failed to create run: ${createRunError.message}`);

        const { data: startedRun, error: startRunError } = await supabase
          .rpc('start_paused_run', { run_id: newRun.id });

        if (startRunError) throw new Error(`Failed to start run: ${startRunError.message}`);

        if (startedRun) {
          toast.success(`Benchmark started for scenario: ${scenario.name}`);
        } else {
          toast.warning(`Benchmark created but not started for scenario: ${scenario.name}`);
        }
      }

      toast.success("All benchmarks started successfully!");
    } catch (error) {
      console.error("Error starting benchmark:", error);
      toast.error("An error occurred while starting the benchmark. Please try again.");
      setIsRunning(false);
    }
  }, [addRun, addResult, userSecrets]);

  useEffect(() => {
    const intervalId = setInterval(async () => {
      if (isRunning && userSecrets && userSecrets.length > 0) {
        const secrets = JSON.parse(userSecrets[0].secret);
        const gptEngineerTestToken = secrets.GPT_ENGINEER_TEST_TOKEN;
        if (gptEngineerTestToken) {
          await handleSingleIteration(runs, updateRun, addResult, supabase, toast, gptEngineerTestToken);
        } else {
          console.error("GPT Engineer test token not found in user secrets");
          setIsRunning(false);
          toast.error("GPT Engineer test token not found. Please set it up in your secrets.");
        }
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [isRunning, handleSingleIteration, userSecrets, runs, updateRun, addResult]);

  return { isRunning, startBenchmark };
};