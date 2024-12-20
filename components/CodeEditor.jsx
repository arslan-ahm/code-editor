"use client";
import React from "react";
import Editor from "@monaco-editor/react";

const CodeEditor = ({ language, code, theme, setCode }) => {
  const getLanguageForEditor = (lang) => {
    if (lang === "html_css_js") return "html";
    return lang;
  };

  return (
    <div className="w-full h-screen">
      <Editor
        height="100%"
        language={getLanguageForEditor(language)}
        value={code}
        theme={theme}
        onChange={(newValue) => setCode(newValue || "")}
      />
    </div>
  );
};

export default CodeEditor;
