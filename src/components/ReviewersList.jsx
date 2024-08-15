import { useReviewers } from "../integrations/supabase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ReviewersList = () => {
  const { data: reviewers, isLoading, error } = useReviewers();

  if (isLoading) return <div>Loading reviewers...</div>;
  if (error) return <div>Error loading reviewers: {error.message}</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Reviewers</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dimension</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Weight</TableHead>
              <TableHead>LLM Temperature</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviewers.map((reviewer) => (
              <TableRow key={reviewer.id}>
                <TableCell>{reviewer.dimension}</TableCell>
                <TableCell>{reviewer.description}</TableCell>
                <TableCell>{reviewer.weight}</TableCell>
                <TableCell>{reviewer.llm_temperature}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ReviewersList;