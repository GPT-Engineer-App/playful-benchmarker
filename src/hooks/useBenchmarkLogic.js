import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useAddRun, useUpdateRun, useUserSecrets } from "../integrations/supabase";
import { supabase } from "../integrations/supabase";
import { impersonateUser } from "../lib/userImpersonation";

const useBenchmarkLogic = (selectedScenarios, scenarios, systemVersion, session) => {
  const [isRunning, setIsRunning] = useState(false);
  const addRun = useAddRun();
  const updateRun = useUpdateRun();
  const { data: userSecrets, isLoading: isLoadingSecrets } = useUserSecrets();

  const handleStartBenchmark = useCallback(async () => {
    if (selectedScenarios.length === 0) {
      toast.error("Please select at least one scenario to run.");
      return;
    }

    if (isLoadingSecrets) {
      toast.error("Loading user secrets. Please try again in a moment.");
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
        const { projectId, projectLink } = await impersonateUser(scenario.prompt, systemVersion, scenario.llm_temperature);

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

        toast.success(`Benchmark created and paused for scenario: ${scenario.name}`);

      // Update the run state to 'paused'
      await updateRun.mutateAsync({
        id: newRun.id,
        state: 'paused',
      });
      }

      toast.success("All benchmarks started successfully!");
    } catch (error) {
      console.error("Error starting benchmark:", error);
      toast.error("An error occurred while starting the benchmark. Please try again.");
      setIsRunning(false);
    }
  }, [selectedScenarios, scenarios, systemVersion, session, addRun, userSecrets, isLoadingSecrets]);

  return {
    isRunning,
    handleStartBenchmark
  };
};

export default useBenchmarkLogic;
