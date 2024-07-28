import { useState, useCallback, useEffect } from "react";
import { useAddRun, useAddResult, useUpdateRun, useUserSecrets, useRuns } from "../integrations/supabase";
import { supabase } from "../integrations/supabase";
import { toast } from "sonner";
import { handleSingleIteration } from "../utils/benchmarkUtils";

export const useBenchmarkRun = (systemVersion) => {
  const [isRunning, setIsRunning] = useState(false);
  const addRun = useAddRun();
  const addResult = useAddResult();
  const updateRun = useUpdateRun();
  const { data: runs } = useRuns();
  const { data: userSecrets } = useUserSecrets();

  const startBenchmark = useCallback(async (selectedScenarios, scenarios, session) => {
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

        // Get the project link from the impersonateUser response
        const projectResponse = await fetch(`${systemVersion}/projects/${projectId}`, {
          headers: {
            'Authorization': `Bearer ${gptEngineerTestToken}`,
          },
        });
        
        if (!projectResponse.ok) {
          throw new Error(`Failed to fetch project details: ${projectResponse.statusText}`);
        }
        
        const projectData = await projectResponse.json();
        const projectLink = projectData.link;

        // Create a new run entry with 'paused' state
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

        // Start the paused run
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
  }, [systemVersion, addRun, addResult, userSecrets]);

  useEffect(() => {
    const intervalId = setInterval(async () => {
      if (isRunning && userSecrets && userSecrets.length > 0) {
        const secrets = JSON.parse(userSecrets[0].secret);
        const gptEngineerTestToken = secrets.GPT_ENGINEER_TEST_TOKEN;
        if (gptEngineerTestToken) {
          await handleSingleIteration(gptEngineerTestToken, runs, updateRun, addResult, systemVersion, supabase, toast);
        } else {
          console.error("GPT Engineer test token not found in user secrets");
          setIsRunning(false);
          toast.error("GPT Engineer test token not found. Please set it up in your secrets.");
        }
      }
    }, 5000); // Run every 5 seconds

    return () => clearInterval(intervalId);
  }, [isRunning, runs, updateRun, addResult, systemVersion, userSecrets]);

  return { isRunning, startBenchmark };
};