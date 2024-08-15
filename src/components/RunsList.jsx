import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useRuns } from "../integrations/supabase";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { ChevronUp, ChevronDown, Eye, ExternalLink } from "lucide-react";

const RunsList = () => {
  const navigate = useNavigate();
  const { data: runs, isLoading, isError } = useRuns();
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState("desc");

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedRuns = useMemo(() => {
    if (!runs) return [];
    return [...runs].sort((a, b) => {
      if (a[sortField] < b[sortField]) return sortDirection === "asc" ? -1 : 1;
      if (a[sortField] > b[sortField]) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [runs, sortField, sortDirection]);

  const handleViewResults = (id) => {
    navigate(`/run-results/${id}`);
  };

  const handleOpenLink = (link) => {
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    } else {
      toast.error("No link available for this run");
    }
  };

  if (isLoading) return <div>Loading runs...</div>;
  if (isError) return <div>Error loading runs</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Recent Runs</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="cursor-pointer" onClick={() => handleSort("created_at")}>
              Date {sortField === "created_at" && (sortDirection === "asc" ? <ChevronUp className="inline" /> : <ChevronDown className="inline" />)}
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort("system_version")}>
              System Version {sortField === "system_version" && (sortDirection === "asc" ? <ChevronUp className="inline" /> : <ChevronDown className="inline" />)}
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort("project_id")}>
              Project ID {sortField === "project_id" && (sortDirection === "asc" ? <ChevronUp className="inline" /> : <ChevronDown className="inline" />)}
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort("state")}>
              State {sortField === "state" && (sortDirection === "asc" ? <ChevronUp className="inline" /> : <ChevronDown className="inline" />)}
            </TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRuns.map((run) => (
            <TableRow key={run.id}>
              <TableCell>{new Date(run.created_at).toLocaleString()}</TableCell>
              <TableCell>{run.system_version}</TableCell>
              <TableCell>{run.project_id}</TableCell>
              <TableCell>{run.state}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleViewResults(run.id)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Results
                  </Button>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => handleOpenLink(run.link)}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open Project
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{run.link || "No link available"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default RunsList;