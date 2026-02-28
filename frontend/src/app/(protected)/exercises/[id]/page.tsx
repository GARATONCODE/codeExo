"use client";

import { useEffect, useState, use } from "react";
import { exercisesApi, submissionsApi, progressApi } from "@/lib/api";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface Exercise {
  id: number;
  slug: string;
  title: string;
  description: string;
  difficulty: string;
  tags: string[];
  templateC: string;
  templatePython: string;
  templateTypescript: string;
}

type Language = "c" | "python" | "typescript";

const LANG_MONACO: Record<Language, string> = {
  c: "c",
  python: "python",
  typescript: "typescript",
};

const LANG_LABELS: Record<Language, string> = {
  c: "C",
  python: "Python",
  typescript: "TypeScript",
};

export default function ExercisePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [language, setLanguage] = useState<Language>("python");
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<any[]>([]);

  useEffect(() => {
    const exId = parseInt(id, 10);
    exercisesApi.get(exId).then((r) => {
      const ex = r.data.data;
      setExercise(ex);
      setCode(ex.templatePython);
    }).catch(() => {});
    progressApi.exercise(exId).then((r) => setProgress(r.data.data)).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!exercise) return;
    const templates: Record<Language, string> = {
      c: exercise.templateC,
      python: exercise.templatePython,
      typescript: exercise.templateTypescript,
    };
    setCode(templates[language]);
    setOutput("");
    setStatus(null);
  }, [language, exercise]);

  const handleSubmit = async () => {
    if (!exercise || submitting) return;
    setSubmitting(true);
    setOutput("Exécution en cours...");
    setStatus("running");
    try {
      const { data } = await submissionsApi.submit({
        exerciseId: exercise.id,
        language,
        code,
      });
      setOutput(data.data.output || "Pas de sortie");
      setStatus(data.data.passed ? "success" : "failure");
      // Refresh progress
      progressApi.exercise(exercise.id).then((r) => setProgress(r.data.data)).catch(() => {});
    } catch (err: any) {
      setOutput(err.response?.data?.error || "Erreur lors de la soumission");
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!exercise) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const completedLangs = progress
    .filter((p: any) => p.completed)
    .map((p: any) => p.language);

  const diffColor: Record<string, string> = {
    easy: "bg-success/20 text-success",
    medium: "bg-warning/20 text-warning",
    hard: "bg-danger/20 text-danger",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Description */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{exercise.title}</h1>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${diffColor[exercise.difficulty] || ""}`}>
              {exercise.difficulty}
            </span>
          </div>
          <div className="flex flex-wrap gap-1 mb-4">
            {(exercise.tags as string[]).map((tag) => (
              <span key={tag} className="text-xs px-2 py-0.5 bg-card rounded text-muted">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-6 prose prose-invert max-w-none">
          <ReactMarkdown>{exercise.description}</ReactMarkdown>
        </div>

        {/* Progress badges */}
        <div className="bg-card border border-card-border rounded-xl p-4">
          <h3 className="text-sm font-medium mb-3">Progression</h3>
          <div className="flex gap-2">
            {(["c", "python", "typescript"] as Language[]).map((lang) => (
              <span
                key={lang}
                className={`px-3 py-1 rounded-lg text-xs font-medium ${
                  completedLangs.includes(lang)
                    ? "bg-success/20 text-success"
                    : "bg-background text-muted"
                }`}
              >
                {LANG_LABELS[lang]} {completedLangs.includes(lang) ? "\u2713" : ""}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Editor + Output */}
      <div className="space-y-4">
        {/* Language selector */}
        <div className="flex items-center gap-2">
          {(["c", "python", "typescript"] as Language[]).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                language === lang
                  ? "bg-primary text-white"
                  : "bg-card border border-card-border text-muted hover:text-foreground"
              }`}
            >
              {LANG_LABELS[lang]}
            </button>
          ))}
        </div>

        {/* Monaco Editor */}
        <div className="border border-card-border rounded-xl overflow-hidden">
          <MonacoEditor
            height="400px"
            language={LANG_MONACO[language]}
            theme="vs-dark"
            value={code}
            onChange={(val) => setCode(val || "")}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              scrollBeyondLastLine: false,
              padding: { top: 16 },
            }}
          />
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
        >
          {submitting ? "Exécution..." : "Soumettre"}
        </button>

        {/* Output */}
        {output && (
          <div
            className={`rounded-xl p-4 font-mono text-sm whitespace-pre-wrap border ${
              status === "success"
                ? "bg-success/10 border-success/30"
                : status === "failure" || status === "error"
                ? "bg-danger/10 border-danger/30"
                : "bg-card border-card-border"
            }`}
          >
            {status === "success" && (
              <div className="text-success font-semibold mb-2">
                Tous les tests passent !
              </div>
            )}
            {status === "failure" && (
              <div className="text-danger font-semibold mb-2">
                Certains tests ont échoué
              </div>
            )}
            {status === "error" && (
              <div className="text-danger font-semibold mb-2">Erreur</div>
            )}
            <pre className="text-xs overflow-auto">{output}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
