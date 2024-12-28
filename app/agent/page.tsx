"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import VMPage from "@/components/emulator";

const PythonAgentPage = () => {
  const [pyodide, setPyodide] = useState<any>(null);
  const [code, setCode] = useState<string>(
    `import numpy as np
# Example: Create a NumPy array and perform operations
arr = np.array([1, 2, 3, 4, 5])
squared = arr ** 2
squared.tolist()  # Convert to Python list for output`
  );
  const [output, setOutput] = useState<string>("");

  useEffect(() => {
    const loadPyodide = async () => {
      try {
        if (typeof window !== "undefined") {
          const script = document.createElement("script");
          script.src =
            "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js";
          script.onload = async () => {
            const pyodide: any = await (window as any).loadPyodide();
            await pyodide.loadPackage("micropip");
            setPyodide(pyodide);
          };
          document.body.appendChild(script);
        }
      } catch (e: any) {
        console.error("Failed to load Pyodide:", e);
      }
    };

    loadPyodide();
  }, []);

  const handleExecute = async () => {
    if (!pyodide) {
      setOutput("Pyodide is still loading. Please wait...");
      return;
    }

    try {
      setOutput("Installing numpy and executing code...");
      // Ensure NumPy is installed
      await pyodide.runPythonAsync(`
        import micropip
        await micropip.install("numpy")
      `);

      // Execute the user-provided Python code
      const result: any = await pyodide.runPythonAsync(code);
      setOutput(result || "Code executed successfully!");
    } catch (e: any) {
      setOutput(`Error: ${e.message}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen  p-4">
      <div>
        <VMPage />
      </div>
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <h1 className="text-xl font-bold">Python WebAssembly Agent</h1>
        </CardHeader>
        <CardContent>
          <Textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter your Python code here..."
            rows={10}
            className="w-full"
          />
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <Button onClick={handleExecute} disabled={!pyodide}>
            Execute Python Code
          </Button>
        </CardFooter>
      </Card>
      <Card className="w-full max-w-2xl mt-4 shadow-lg">
        <CardHeader>
          <h2 className="text-lg font-semibold">Output</h2>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap font-mono">
            {output || "No output yet."}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};

export default PythonAgentPage;
