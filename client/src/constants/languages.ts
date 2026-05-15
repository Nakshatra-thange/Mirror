export const LANGUAGES = [
    { value: "javascript", label: "JavaScript", monaco: "javascript" },
    { value: "typescript", label: "TypeScript", monaco: "typescript" },
    { value: "python",     label: "Python",     monaco: "python"     },
    { value: "go",         label: "Go",         monaco: "go"         },
    { value: "java",       label: "Java",       monaco: "java"       },
    { value: "cpp",        label: "C++",        monaco: "cpp"        },
    { value: "rust",       label: "Rust",       monaco: "rust"       },
    { value: "sql",        label: "SQL",        monaco: "sql"        },
  ] as const;
  
export type LanguageValue = (typeof LANGUAGES)[number]["value"];