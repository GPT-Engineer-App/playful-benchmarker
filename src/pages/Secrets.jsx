import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSupabaseAuth } from "../integrations/supabase/auth";
import { useAddUserSecret, useUserSecrets, useUpdateUserSecret } from "../integrations/supabase";
import { toast } from "sonner";
import Navbar from "../components/Navbar";

const Secrets = () => {
  const [anthropicApiKey, setAnthropicApiKey] = useState("");
  const [multionApiKey, setMultionApiKey] = useState("");
  const [gptEngineerTestToken, setGptEngineerTestToken] = useState("");
  const navigate = useNavigate();
  const { session } = useSupabaseAuth();
  const addUserSecret = useAddUserSecret();
  const updateUserSecret = useUpdateUserSecret();
  const { data: existingSecrets, isLoading } = useUserSecrets();

  useEffect(() => {
    if (existingSecrets && existingSecrets.length > 0) {
      const secrets = JSON.parse(existingSecrets[0].secret);
      setAnthropicApiKey(secrets.ANTHROPIC_API_KEY || "");
      setMultionApiKey(secrets.MULTION_API_KEY || "");
      setGptEngineerTestToken(secrets.GPT_ENGINEER_TEST_TOKEN || "");
    }
  }, [existingSecrets]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session) {
      toast.error("You must be logged in to save secrets");
      return;
    }

    const newSecrets = {
      ...(anthropicApiKey && { ANTHROPIC_API_KEY: anthropicApiKey }),
      ...(multionApiKey && { MULTION_API_KEY: multionApiKey }),
      ...(gptEngineerTestToken && { GPT_ENGINEER_TEST_TOKEN: gptEngineerTestToken }),
    };

    try {
      if (existingSecrets && existingSecrets.length > 0) {
        await updateUserSecret.mutateAsync({
          id: existingSecrets[0].id,
          secret: JSON.stringify(newSecrets),
        });
      } else {
        await addUserSecret.mutateAsync({
          user_id: session.user.id,
          secret: JSON.stringify(newSecrets),
        });
      }
      toast.success("Secrets saved successfully");
      navigate("/");
    } catch (error) {
      toast.error("Failed to save secrets: " + error.message);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
          <div>
            <Label htmlFor="anthropic-api-key">ANTHROPIC_API_KEY</Label>
            <Input
              id="anthropic-api-key"
              type="password"
              value={anthropicApiKey}
              onChange={(e) => setAnthropicApiKey(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="multion-api-key">MULTION_API_KEY</Label>
            <Input
              id="multion-api-key"
              type="password"
              value={multionApiKey}
              onChange={(e) => setMultionApiKey(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="gpt-engineer-test-token">GPT_ENGINEER_TEST_TOKEN</Label>
            <Input
              id="gpt-engineer-test-token"
              type="password"
              value={gptEngineerTestToken}
              onChange={(e) => setGptEngineerTestToken(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full">
            Save Secrets
          </Button>
        </form>
      </main>
    </div>
  );
};

export default Secrets;