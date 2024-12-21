"use client";
import React, { useState, useEffect } from "react";
import CodeEditor from "../components/CodeEditor";
import { supportedLanguages } from "@/lib/languages"; // List of supported languages
import "daisyui/dist/full.css";
import { FaArrowUp } from "react-icons/fa";
import { CiDark } from "react-icons/ci";
import { CiLight } from "react-icons/ci";

export default function Home() {
  const [language, setLanguage] = useState("html_css_js");
  const [theme, setTheme] = useState("vs-dark");
  const [code, setCode] = useState(""); // Now a single string to simplify
  const [output, setOutput] = useState(""); // Initial blank output
  const [showOutputAtBottom, setShowOutputAtBottom] = useState(false);
  const [inputValue, setInputValue] = useState("");

  // Boilerplate code for different languages
  const boilerplates = {
    html_css_js: `<!-- Write your HTML here -->
<html>
  <head>
    <title>New Website</title>
    <style>
      /* Write your CSS here */
      body {
        font-family: Arial, sans-serif;
      }
    </style>
  </head>
  <body>
    <h1>Hello, World!</h1>
    <p>This is your new HTML document.</p>
    <script>
      // Write your JavaScript here
      console.log("Hello, World!");
    </script>
  </body>
</html>`,
    javascript:
      "// Write your JavaScript below \nconsole.log('Hello, World!');",
    python: "# Write your Python code here \nprint('Hello, World!')",
    cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}',
    java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
    php: `<?php\n// Write your PHP code here\necho "Hello, World!";\n?>`,
  };

  const runCode = async () => {
    try {
      // For HTML, CSS, and JS execution
      if (language === "html_css_js") {
        if (!code.trim()) {
          throw new Error("Code is empty. Please write some HTML, CSS, or JS.");
        }

        const blob = new Blob([code], { type: "text/html" });
        const url = URL.createObjectURL(blob);

        setOutput(<iframe src={url} className="w-full h-full"></iframe>);
        return;
      }

      // For other languages using Judge0 API
      const languageId = supportedLanguages.find(
        (lang) => lang.value === language
      )?.id;

      if (!languageId) {
        throw new Error("Invalid language selected.");
      }

      if (!code.trim()) {
        throw new Error(
          "Code is empty. Please write some code before running."
        );
      }

      // Make submission to Judge0
      const submissionResponse = await makeJudge0Submission({
        source_code: code,
        language_id: languageId,
        stdin: inputValue || "",
      });

      if (!submissionResponse.ok) {
        const errorText = await submissionResponse.text();
        throw new Error(
          `Error creating submission: ${submissionResponse.status} - ${errorText}`
        );
      }

      const { token } = await submissionResponse.json();
      if (!token) {
        throw new Error("Failed to retrieve submission token from Judge0 API.");
      }

      // Fetch execution result
      const result = await fetchJudge0Result(token);
      if (!result) {
        throw new Error("Unable to fetch result. Please try again.");
      }

      // Display result
      setOutput(result.stdout || result.stderr || "No output.");
    } catch (error) {
      handleError(error);
    }
  };

  const makeJudge0Submission = async ({ source_code, language_id, stdin }) => {
    return fetch(
      "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
          "X-RapidAPI-Key": process.env.NEXT_PUBLIC_RAPID_API_KEY,
        },
        body: JSON.stringify({ source_code, language_id, stdin }),
      }
    );
  };

  const fetchJudge0Result = async (token, retries = 5, delay = 2000) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      const response = await fetch(
        `https://judge0-ce.p.rapidapi.com/submissions/${token}?base64_encoded=false`,
        {
          method: "GET",
          headers: {
            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
            "X-RapidAPI-Key": process.env.NEXT_PUBLIC_RAPID_API_KEY,
          },
        }
      );

      if (response.ok) {
        return response.json();
      }

      // Wait and retry
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw new Error(`Error fetching result after ${retries} retries.`);
      }
    }
  };

  const handleError = (error) => {
    console.error("Execution Error:", error);

    const errorMessage =
      typeof error === "string"
        ? error
        : error.message || "An unexpected error occurred.";

    setOutput(
      <div className="p-4 bg-red-100 text-red-800 rounded">
        <h3 className="font-bold text-lg">Execution Error</h3>
        <p>{errorMessage}</p>
        <p className="mt-2">Please check your code and try again.</p>
      </div>
    );
  };

  useEffect(() => {
    // Set the appropriate boilerplate when the language changes
    setCode(boilerplates[language] || "// Write your code here");
  }, [language]);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="p-4 bg-gray-800 w-full flex justify-between items-center text-white">
        <h1 className="text-2xl font-bold">Customizable Code Editor</h1>
        <div className="flex items-center gap-4">
          <span
            onClick={() => setTheme(theme === "vs-dark" ? "light" : "vs-dark")}
            className={`border border-slate-300 p-1 text-lg rounded-badge cursor-pointer`}
          >
            {theme === "vs-dark" ? (
              <CiLight className="text-yellow-200" />
            ) : (
              <CiDark className="text-slate-50" />
            )}
          </span>
          <button onClick={runCode} className="btn btn-success">
            Run Code
          </button>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="select select-bordered"
          >
            {supportedLanguages.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-grow">
        {/* Code Editor */}
        <CodeEditor
          language={language}
          code={code}
          setCode={setCode}
          theme={theme}
          className="flex-grow"
        />
        {/* Output Section */}
        <div
          className={`relative ${
            showOutputAtBottom ? "absolute bottom-0 left-0 w-full" : "w-1/2"
          } bg-gray-900 text-white p-4 overflow-auto`}
          style={{ resize: "both" }}
        >
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowOutputAtBottom(!showOutputAtBottom)}
          >
            <h2 className="text-lg font-bold">Output</h2>
            <FaArrowUp
              className={`transition-transform ${
                showOutputAtBottom ? "rotate-180" : "rotate-0"
              }`}
            />
          </div>
          <div className="whitespace-pre-wrap mt-2">
            {typeof output === "string" ? output : output}
          </div>
        </div>
      </div>

      {/* Input Mechanism */}
      <div className="p-4 bg-gray-200">
        <label className="label">
          <span className="label-text">Program Input</span>
        </label>
        <input
          type="text"
          placeholder="Enter input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="input input-bordered w-full"
        />
      </div>
    </div>
  );
}
