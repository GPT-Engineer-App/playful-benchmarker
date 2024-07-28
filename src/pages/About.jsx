import { Link } from "react-router-dom";

const About = () => {
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
        <h2 className="text-3xl font-bold mb-6">About Lovable Benchmarks</h2>
        <div className="space-y-4">
          <p>
            Lovable Benchmarks is a sophisticated tool designed for automated benchmarking of GPT Engineer. 
            Our mission is to provide comprehensive and objective assessments of AI-driven engineering solutions.
          </p>
          <h3 className="text-2xl font-semibold mt-6 mb-2">How It Works</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              We utilize a set of benchmark scenarios where an LLM (Language Model) simulates a user interacting with the product to build specific web applications.
            </li>
            <li>
              Each scenario is guided by a carefully crafted prompt that outlines the simulated user's goals and requirements.
            </li>
            <li>
              After the scenario is completed, another set of LLMs reviews the results to assess performance across various dimensions.
            </li>
          </ul>
          <h3 className="text-2xl font-semibold mt-6 mb-2">Key Performance Dimensions</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Coding &gt; Debugging:</strong> Evaluates how effectively the system identifies and resolves errors it introduces.</li>
            <li><strong>Coding &gt; Dependencies:</strong> Assesses the system's proficiency in managing, adding, removing, and modifying dependencies.</li>
            <li><strong>Limitation Awareness:</strong> Measures how well the system recognizes its own limitations and communicates these to the user.</li>
          </ul>
          <h3 className="text-2xl font-semibold mt-6 mb-2">Future Features</h3>
          <p>
            We are continuously working to enhance Lovable Benchmarks. Upcoming features include:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Interactive dashboards for visualizing performance metrics</li>
            <li>Detailed graphs showing comparisons between different system versions</li>
            <li>A user-friendly interface for editing and customizing benchmark scenario prompts</li>
          </ul>
        </div>
      </main>

      <footer className="bg-secondary text-secondary-foreground p-4">
        <div className="container mx-auto text-center">
          <p>&copy; 2024 Lovable Benchmarks. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default About;