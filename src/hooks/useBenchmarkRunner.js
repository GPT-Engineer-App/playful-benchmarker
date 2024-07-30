import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase';
import { toast } from 'sonner';

const useBenchmarkRunner = () => {
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const subscription = supabase
      .channel('runs_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'runs' }, async (payload) => {
        if (payload.new.state === 'running') {
          setIsRunning(true);
          try {
            const response = await fetch('/api/runBenchmarkIteration', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            
            if (!response.ok) {
              throw new Error('Failed to run benchmark iteration');
            }

            const result = await response.json();
            console.log('Benchmark iteration result:', result);
            toast.success("Benchmark iteration completed successfully");
          } catch (error) {
            console.error('Error running benchmark iteration:', error);
            toast.error(`Failed to run benchmark iteration: ${error.message}`);
          } finally {
            setIsRunning(false);
          }
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { isRunning };
};

export default useBenchmarkRunner;
