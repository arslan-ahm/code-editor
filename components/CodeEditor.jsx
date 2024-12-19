"use client"
import React from "react";
import Editor from "@monaco-editor/react";

const CodeEditor = ({ language, code, setCode }) => {
  const getLanguageForEditor = (lang) => {
    if (lang === "html_css_js") return "html";
    return lang;
  };

  return (
    <div className="w-full h-screen">
      <Editor
        height="100%"
        language={getLanguageForEditor(language)}
        value={language === "html_css_js" ? code.html : code.other}
        theme="vs-dark"
        onChange={(newValue) =>
          setCode(language === "html_css_js" ? { html: newValue } : { other: newValue })
        }
      />
    </div>
  );
};

export default CodeEditor;
