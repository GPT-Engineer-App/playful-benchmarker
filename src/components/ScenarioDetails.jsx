import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";

const ScenarioDetails = ({ 
  scenario, 
  handleScenarioChange, 
  handleLLMTemperatureChange,
  handleGenerateName,
  handleGenerateDescription,
  handleGeneratePrompt,
  isGenerating
}) => (
  <div className="space-y-4">
    <h2 className="text-2xl font-bold">Scenario Details</h2>
    <div>
      <Label htmlFor="name">Name</Label>
      <div className="flex space-x-2">
        <Input
          id="name"
          name="name"
          value={scenario.name}
          onChange={handleScenarioChange}
          required
        />
        <Button type="button" onClick={handleGenerateName} disabled={isGenerating}>
          <Wand2 className="w-4 h-4 mr-2" />
          Generate
        </Button>
      </div>
    </div>
    <div>
      <Label htmlFor="description">Description</Label>
      <div className="flex space-x-2">
        <Textarea
          id="description"
          name="description"
          value={scenario.description}
          onChange={handleScenarioChange}
        />
        <Button type="button" onClick={handleGenerateDescription} disabled={isGenerating}>
          <Wand2 className="w-4 h-4 mr-2" />
          Generate
        </Button>
      </div>
    </div>
    <div>
      <Label htmlFor="prompt">Prompt</Label>
      <div className="flex space-x-2">
        <Textarea
          id="prompt"
          name="prompt"
          value={scenario.prompt}
          onChange={handleScenarioChange}
          required
          className="min-h-[200px]"
        />
        <Button type="button" onClick={handleGeneratePrompt} disabled={isGenerating}>
          <Wand2 className="w-4 h-4 mr-2" />
          Generate
        </Button>
      </div>
    </div>
    <div>
      <Label htmlFor="llm_temperature">LLM Temperature: {scenario.llm_temperature.toFixed(2)}</Label>
      <Slider
        id="llm_temperature"
        min={0}
        max={1}
        step={0.01}
        value={[scenario.llm_temperature]}
        onValueChange={handleLLMTemperatureChange}
        className="mt-2"
      />
    </div>
    <div>
      <Label htmlFor="timeout">Timeout (seconds)</Label>
      <Input
        id="timeout"
        name="timeout"
        type="number"
        value={scenario.timeout || 300}
        onChange={handleScenarioChange}
        required
        min="0"
        placeholder="300"
      />
    </div>
  </div>
);

export default ScenarioDetails;
