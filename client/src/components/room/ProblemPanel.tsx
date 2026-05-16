import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  tags: string[];
}

interface Props {
  problem: Problem | null;
}

const difficultyColor = {
  EASY:   "text-green-400 bg-green-400/10 border-green-400/20",
  MEDIUM: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  HARD:   "text-red-400 bg-red-400/10 border-red-400/20",
};

export default function ProblemPanel({ problem }: Props) {
  if (!problem) return (
    <div className="flex-1 flex items-center justify-center p-6">
      <p className="text-zinc-600 text-sm text-center">
        No problem selected yet.<br />
        <span className="text-zinc-700">Waiting for interviewer...</span>
      </p>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h2 className="font-semibold text-white text-base leading-tight">{problem.title}</h2>
          <span className={`shrink-0 text-xs px-2 py-0.5 rounded border font-medium ${difficultyColor[problem.difficulty]}`}>
            {problem.difficulty}
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {problem.tags.map(tag => (
            <span key={tag} className="text-xs px-1.5 py-0.5 bg-zinc-800 text-zinc-500 rounded">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Markdown description */}
      <div className="prose prose-invert prose-sm max-w-none
        prose-headings:text-zinc-200 prose-headings:font-semibold
        prose-p:text-zinc-400 prose-p:leading-relaxed
        prose-code:text-violet-300 prose-code:bg-zinc-800 prose-code:px-1 prose-code:rounded
        prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800
        prose-strong:text-zinc-300
        prose-ul:text-zinc-400 prose-li:marker:text-zinc-600">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {problem.description}
        </ReactMarkdown>
      </div>
    </div>
  );
}