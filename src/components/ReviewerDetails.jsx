import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ReviewerDetails = ({ 
  reviewer, 
  index, 
  reviewDimensions, 
  isLoadingDimensions, 
  handleReviewerChange, 
  handleReviewerDimensionChange, 
  handleReviewerLLMTemperatureChange,
  handleDeleteReviewer
}) => (
  <div className="border p-4 rounded-md space-y-2">
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-semibold">Reviewer {index + 1}</h3>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            size="sm"
            className="flex items-center"
            type="button"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this reviewer?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the reviewer from the scenario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDeleteReviewer(index)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    <div>
      <Label htmlFor={`dimension-${index}`}>Dimension</Label>
      <Select onValueChange={(value) => handleReviewerDimensionChange(index, value)} value={reviewer.dimension || "select_dimension"}>
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
      <Label htmlFor={`reviewer-description-${index}`}>Description</Label>
      <Textarea
        id={`reviewer-description-${index}`}
        name="description"
        value={reviewer.description}
        onChange={(e) => handleReviewerChange(index, e)}
        required
      />
    </div>
    <div>
      <Label htmlFor={`reviewer-prompt-${index}`}>Prompt</Label>
      <Textarea
        id={`reviewer-prompt-${index}`}
        name="prompt"
        value={reviewer.prompt}
        onChange={(e) => handleReviewerChange(index, e)}
        required
      />
    </div>
    <div>
      <Label>Weight</Label>
      <RadioGroup
        value={reviewer.weight.toString()}
        onValueChange={(value) => handleReviewerChange(index, { target: { name: 'weight', value } })}
        className="flex space-x-4 mt-2"
      >
        {[
          { value: "1", label: "Weak signal" },
          { value: "2", label: "Moderate signal" },
          { value: "3", label: "Strong signal" },
          { value: "4", label: "Very strong signal" },
        ].map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <RadioGroupItem value={option.value} id={`weight-${index}-${option.value}`} />
            <Label htmlFor={`weight-${index}-${option.value}`} className="font-normal">
              {option.value} - {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
    <div>
      <Label htmlFor={`reviewer-llm-temperature-${index}`}>LLM Temperature: {reviewer.llm_temperature.toFixed(2)}</Label>
      <Slider
        id={`reviewer-llm-temperature-${index}`}
        min={0}
        max={1}
        step={0.01}
        value={[reviewer.llm_temperature]}
        onValueChange={(value) => handleReviewerLLMTemperatureChange(index, value)}
        className="mt-2"
      />
    </div>
    <div>
      <Label htmlFor={`run-count-${index}`}>Run Count</Label>
      <Input
        id={`run-count-${index}`}
        name="run_count"
        type="number"
        value={reviewer.run_count}
        onChange={(e) => handleReviewerChange(index, e)}
        required
      />
    </div>
  </div>
);

export default ReviewerDetails;