import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSupabaseAuth } from "../integrations/supabase/auth";
import { useAddReviewDimension } from "../integrations/supabase";
import { toast } from "sonner";
import Navbar from "../components/Navbar";

const CreateReviewDimension = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const navigate = useNavigate();
  const { session } = useSupabaseAuth();
  const addReviewDimension = useAddReviewDimension();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session) {
      toast.error("You must be logged in to create a review dimension");
      return;
    }

    try {
      await addReviewDimension.mutateAsync({
        name,
        description,
      });
      toast.success("Review dimension created successfully");
      navigate("/");
    } catch (error) {
      toast.error("Failed to create review dimension: " + error.message);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
          <Button type="submit" className="w-full">
            Create Review Dimension
          </Button>
        </form>
      </main>
    </div>
  );
};

export default CreateReviewDimension;