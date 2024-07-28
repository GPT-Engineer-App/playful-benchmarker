import { Home, Info, LogIn, Key, UserPlus, PlusCircle, ListPlus, Edit, Play } from "lucide-react";
import Index from "./pages/Index.jsx";
import About from "./pages/About.jsx";
import Login from "./pages/Login.jsx";
import Secrets from "./pages/Secrets.jsx";
import Signup from "./pages/Signup.jsx";
import CreateScenario from "./pages/CreateScenario.jsx";
import CreateReviewDimension from "./pages/CreateReviewDimension.jsx";
import EditScenario from "./pages/EditScenario.jsx";
import StartBenchmark from "./components/StartBenchmark/StartBenchmark.jsx";

/**
 * Central place for defining the navigation items. Used for navigation components and routing.
 */
export const navItems = [
  {
    title: "Home",
    to: "/",
    icon: <Home className="h-4 w-4" />,
    page: <Index />,
  },
  {
    title: "About",
    to: "/about",
    icon: <Info className="h-4 w-4" />,
    page: <About />,
  },
  {
    title: "Login",
    to: "/login",
    icon: <LogIn className="h-4 w-4" />,
    page: <Login />,
  },
  {
    title: "Sign Up",
    to: "/signup",
    icon: <UserPlus className="h-4 w-4" />,
    page: <Signup />,
  },
  {
    title: "Secrets",
    to: "/secrets",
    icon: <Key className="h-4 w-4" />,
    page: <Secrets />,
  },
  {
    title: "Create Scenario",
    to: "/create-scenario",
    icon: <PlusCircle className="h-4 w-4" />,
    page: <CreateScenario />,
  },
  {
    title: "Create Review Dimension",
    to: "/create-review-dimension",
    icon: <ListPlus className="h-4 w-4" />,
    page: <CreateReviewDimension />,
  },
  {
    title: "Edit Scenario",
    to: "/edit-scenario/:id",
    icon: <Edit className="h-4 w-4" />,
    page: <EditScenario />,
  },
  {
    title: "Start Benchmark",
    to: "/start-benchmark",
    icon: <Play className="h-4 w-4" />,
    page: <StartBenchmark />,
  },
];