import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-primary text-primary-foreground p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Lovable Benchmarks</h1>
          <nav>
            <ul className="flex space-x-4">
              <li><Link to="/" className="hover:underline">Home</Link></li>
              <li><Link to="/about" className="hover:underline">About</Link></li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-4">Welcome to Lovable Benchmarks</h2>
        <p className="mb-6">
          Lovable Benchmarks is a cutting-edge tool designed for automated benchmarking of GPT Engineer. 
          Our platform provides comprehensive insights into the performance and capabilities of AI-driven engineering solutions.
        </p>
        <Button asChild>
          <Link to="/about">Learn More</Link>
        </Button>
      </main>

      <footer className="bg-secondary text-secondary-foreground p-4">
        <div className="container mx-auto text-center">
          <p>&copy; 2024 Lovable Benchmarks. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;