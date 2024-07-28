import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useBenchmarkScenarios, useDeleteBenchmarkScenario } from "../integrations/supabase";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ChevronUp, ChevronDown, Trash2, Edit } from "lucide-react";

const ScenarioList = () => {
  const navigate = useNavigate();
  const { data: scenarios, isLoading, isError } = useBenchmarkScenarios();
  const deleteScenario = useDeleteBenchmarkScenario();
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedScenarios = useMemo(() => {
    if (!scenarios) return [];
    return [...scenarios].sort((a, b) => {
      if (a[sortField] < b[sortField]) return sortDirection === "asc" ? -1 : 1;
      if (a[sortField] > b[sortField]) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [scenarios, sortField, sortDirection]);

  const handleDelete = async (id) => {
    try {
      await deleteScenario.mutateAsync(id);
      toast.success("Scenario deleted successfully");
    } catch (error) {
      toast.error("Failed to delete scenario: " + error.message);
    }
  };

  const handleEdit = (id) => {
    navigate(`/edit-scenario/${id}`);
  };

  if (isLoading) return <div>Loading scenarios...</div>;
  if (isError) return <div>Error loading scenarios</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Scenarios</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
              Name {sortField === "name" && (sortDirection === "asc" ? <ChevronUp className="inline" /> : <ChevronDown className="inline" />)}
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort("created_at")}>
              Created At {sortField === "created_at" && (sortDirection === "asc" ? <ChevronUp className="inline" /> : <ChevronDown className="inline" />)}
            </TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedScenarios.map((scenario) => (
            <TableRow key={scenario.id}>
              <TableCell>{scenario.name}</TableCell>
              <TableCell>{new Date(scenario.created_at).toLocaleString()}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(scenario.id)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to delete this scenario?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the scenario and all associated data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(scenario.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ScenarioList;