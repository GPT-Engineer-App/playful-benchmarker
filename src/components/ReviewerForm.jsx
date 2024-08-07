import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const ReviewerForm = ({ 
  reviewer, 
  reviewDimensions, 
  isLoadingDimensions, 
  handleReviewerChange, 
  handleReviewerDimensionChange, 
  handleReviewerLLMTemperatureChange,
  handleSubmit,
  submitButtonText
}) => (
  <form onSubmit={handleSubmit} className="space-y-4">
    <div>
      <Label htmlFor="dimension">Dimension</Label>
      <Select onValueChange={(value) => handleReviewerDimensionChange(value)} value={reviewer.dimension || "select_dimension"}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select Dimension" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="select_dimension" disabled>Select a dimension</SelectItem>
          {isLoadingDimensions ? (
            <SelectItem value="loading">Loading dimensions...</SelectItem>
          ) : (
            <>
              {reviewDimensions?.map((dimension) => (
                <SelectItem key={dimension.id} value={dimension.name}>
                  {dimension.name}
                </SelectItem>
              ))}
              <SelectSeparator />
              <SelectItem value="create_new">
                <Link to="/create-review-dimension" className="flex items-center text-blue-500 hover:underline">
                  <span className="mr-2">+</span> Create New Dimension
                </Link>
              </SelectItem>
            </>
          )}
        </SelectContent>
      </Select>
    </div>
    <div>
      <Label htmlFor="description">Description</Label>
      <Textarea
        id="description"
        name="description"
        value={reviewer.description}
        onChange={handleReviewerChange}
        required
      />
    </div>
    <div>
      <Label htmlFor="prompt">Prompt</Label>
      <Textarea
        id="prompt"
        name="prompt"
        value={reviewer.prompt}
        onChange={handleReviewerChange}
        required
      />
    </div>
    <div>
      <Label>Weight</Label>
      <RadioGroup
        value={reviewer.weight.toString()}
        onValueChange={(value) => handleReviewerChange({ target: { name: 'weight', value } })}
        className="flex space-x-4 mt-2"
      >
        {[
          { value: "1", label: "Weak signal" },
          { value: "2", label: "Moderate signal" },
          { value: "3", label: "Strong signal" },
          { value: "4", label: "Very strong signal" },
        ].map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <RadioGroupItem value={option.value} id={`weight-${option.value}`} />
            <Label htmlFor={`weight-${option.value}`} className="font-normal">
              {option.value} - {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
    <div>
      <Label htmlFor="llm_temperature">LLM Temperature: {reviewer.llm_temperature.toFixed(2)}</Label>
      <Slider
        id="llm_temperature"
        min={0}
        max={1}
        step={0.01}
        value={[reviewer.llm_temperature]}
        onValueChange={(value) => handleReviewerLLMTemperatureChange(value)}
        className="mt-2"
      />
    </div>
    <div>
      <Label htmlFor="run_count">Run Count</Label>
      <Input
        id="run_count"
        name="run_count"
        type="number"
        value={reviewer.run_count}
        onChange={handleReviewerChange}
        required
      />
    </div>
    <Button type="submit" className="w-full">{submitButtonText}</Button>
  </form>
);

export default ReviewerForm;
