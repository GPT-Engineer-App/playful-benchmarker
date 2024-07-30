import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { navItems } from "./nav-items";
import { SupabaseAuthProvider, useSupabaseAuth } from "./integrations/supabase/auth";
import useBenchmarkRunner from "./hooks/useBenchmarkRunner";

const BenchmarkRunner = () => {
  const { session } = useSupabaseAuth();
  useBenchmarkRunner();
  return null;
};

const App = () => (
  <SupabaseAuthProvider>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <BenchmarkRunner />
        <Routes>
          {navItems.map(({ to, page }) => (
            <Route key={to} path={to} element={page} />
          ))}
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </SupabaseAuthProvider>
);

export default App;
