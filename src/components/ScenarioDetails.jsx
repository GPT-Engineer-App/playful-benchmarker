import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

const ScenarioDetails = ({ scenario, handleScenarioChange, handleLLMModelChange, handleLLMTemperatureChange }) => (
  <div className="space-y-4">
    <h2 className="text-2xl font-bold">Scenario Details</h2>
    <div>
      <Label htmlFor="name">Name</Label>
      <Input
        id="name"
        name="name"
        value={scenario.name}
        onChange={handleScenarioChange}
        required
      />
    </div>
    <div>
      <Label htmlFor="description">Description</Label>
      <Textarea
        id="description"
        name="description"
        value={scenario.description}
        onChange={handleScenarioChange}
      />
    </div>
    <div>
      <Label htmlFor="prompt">Prompt</Label>
      <Textarea
        id="prompt"
        name="prompt"
        value={scenario.prompt}
        onChange={handleScenarioChange}
        required
      />
    </div>
    <div>
      <Label htmlFor="llm_model">LLM Model</Label>
      <Select onValueChange={handleLLMModelChange} value={scenario.llm_model}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select LLM Model" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="aws--anthropic.claude-3-5-sonnet-20240620-v1:0">
            aws--anthropic.claude-3-5-sonnet-20240620-v1:0
          </SelectItem>
          <SelectItem value="gpt-4o-mini">gpt-4o-mini</SelectItem>
        </SelectContent>
      </Select>
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
  </div>
);

export default ScenarioDetails;