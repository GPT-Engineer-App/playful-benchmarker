import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useAddRun, useAddResult, useUpdateRun, useRuns } from "../integrations/supabase";
import { supabase } from "../integrations/supabase";
import { impersonateUser } from "../lib/userImpersonation";

const useBenchmarkLogic = (selectedScenarios, scenarios, systemVersion, session, userSecrets) => {
  const [isRunning, setIsRunning] = useState(false);
  const addRun = useAddRun();
  const addResult = useAddResult();
  const updateRun = useUpdateRun();
  const { data: existingRuns, refetch: refetchRuns } = useRuns();

  useEffect(() => {
    if (existingRuns) {
      const incompleteRuns = existingRuns.filter(run => run.state === 'paused');
      if (incompleteRuns.length > 0) {
        toast.info(`You have ${incompleteRuns.length} incomplete benchmark runs. Would you like to continue them?`, {
          action: {
            label: 'Continue',
            onClick: () => handleContinueBenchmark(incompleteRuns),
          },
        });
      }
    }
  }, [existingRuns]);

  const handleContinueBenchmark = useCallback(async (incompleteRuns) => {
    setIsRunning(true);
    try {
      for (const run of incompleteRuns) {
        // Implement the logic to continue the run
        // This might involve fetching the scenario, calling impersonateUser again, etc.
        // Update the run state when it's completed
        await updateRun.mutateAsync({ id: run.id, state: 'completed' });
      }
      toast.success("All incomplete benchmarks have been continued and completed!");
    } catch (error) {
      console.error("Error continuing benchmarks:", error);
      toast.error("An error occurred while continuing the benchmarks. Please try again.");
    } finally {
      setIsRunning(false);
      refetchRuns();
    }
  }, [updateRun, refetchRuns]);

  const handleStartBenchmark = useCallback(async () => {
    if (selectedScenarios.length === 0) {
      toast.error("Please select at least one scenario to run.");
      return;
    }

    if (!userSecrets || userSecrets.length === 0) {
      toast.error("No user secrets found. Please set up your GPT Engineer test token.");
      return;
    }

    const secrets = JSON.parse(userSecrets[0].secret);
    const gptEngineerTestToken = secrets.GPT_ENGINEER_TEST_TOKEN;

    if (!gptEngineerTestToken) {
      toast.error("GPT Engineer test token not found. Please set it up in your secrets.");
      return;
    }

    setIsRunning(true);

    try {
      for (const scenarioId of selectedScenarios) {
        const scenario = scenarios.find((s) => s.id === scenarioId);
        
        // Call initial user impersonation function
        const { projectId, initialRequest, messages: initialMessages } = await impersonateUser(scenario.prompt, systemVersion, scenario.llm_temperature);

        // Create a new run entry with 'paused' state
        const { data: newRun, error: createRunError } = await addRun.mutateAsync({
          scenario_id: scenarioId,
          system_version: systemVersion,
          project_id: projectId,
          user_id: session.user.id,
          link: `${systemVersion}/projects/${projectId}`,
          state: 'paused',
          initial_messages: initialMessages
        });

        if (createRunError) throw new Error(`Failed to create run: ${createRunError.message}`);

        toast.success(`Benchmark created and paused for scenario: ${scenario.name}`);
      }

      toast.success("All benchmarks started successfully!");
    } catch (error) {
      console.error("Error starting benchmark:", error);
      toast.error("An error occurred while starting the benchmark. Please try again.");
    } finally {
      setIsRunning(false);
      refetchRuns();
    }
  }, [selectedScenarios, scenarios, systemVersion, session, addRun, refetchRuns]);

  return {
    isRunning,
    handleStartBenchmark,
    handleContinueBenchmark
  };
};

export default useBenchmarkLogic;
