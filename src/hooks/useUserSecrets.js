import { supabase } from '../integrations/supabase';
import { toast } from "sonner";

export const useUserSecrets = () => {
  const fetchUserSecrets = async () => {
    const { data: userSecrets, error } = await supabase
      .from('user_secrets')
      .select('secret')
      .limit(1);

    if (error) {
      console.error("Error fetching user secrets:", error);
      toast.error("Failed to fetch user secrets. Cannot run benchmark.");
      return null;
    }

    if (userSecrets && userSecrets.length > 0) {
      const secrets = JSON.parse(userSecrets[0].secret);
      return secrets.GPT_ENGINEER_TEST_TOKEN;
    } else {
      console.error("No user secrets found");
      toast.error("No user secrets found. Please set up your secrets.");
      return null;
    }
  };

  return { fetchUserSecrets };
};