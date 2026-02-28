"use client";

import { useEffect, useState } from "react";
import { dailyApi } from "@/lib/api";
import Link from "next/link";

export default function DailyPage() {
  const [daily, setDaily] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    dailyApi.today().then((r) => setDaily(r.data.data)).catch(() => {});
    dailyApi.history().then((r) => setHistory(r.data.data)).catch(() => {});
  }, []);

  const diffColor: Record<string, string> = {
    easy: "bg-success/20 text-success",
    medium: "bg-warning/20 text-warning",
    hard: "bg-danger/20 text-danger",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Exercice du Jour</h1>

      {/* Today */}
      {daily?.exercise ? (
        <div className="bg-card border border-card-border rounded-xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm text-muted">{daily.date}</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${diffColor[daily.exercise.difficulty] || ""}`}>
              {daily.exercise.difficulty}
            </span>
          </div>
          <h2 className="text-2xl font-bold mb-3">{daily.exercise.title}</h2>
          <p className="text-muted mb-6 max-w-2xl">
            {daily.exercise.description}
          </p>
          <Link
            href={`/exercises/${daily.exercise.id}`}
            className="inline-block px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold transition-colors"
          >
            Résoudre cet exercice
          </Link>
        </div>
      ) : (
        <div className="bg-card border border-card-border rounded-xl p-8 mb-8 text-center text-muted">
          Chargement...
        </div>
      )}

      {/* History */}
      <h2 className="text-xl font-semibold mb-4">Historique</h2>
      <div className="space-y-3">
        {history.map((item: any) => (
          <Link
            key={item.id}
            href={`/exercises/${item.exerciseId}`}
            className="flex items-center justify-between bg-card border border-card-border rounded-xl p-4 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted w-24">{item.date}</span>
              <span className="font-medium">{item.exerciseTitle}</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${diffColor[item.exerciseDifficulty] || ""}`}>
              {item.exerciseDifficulty}
            </span>
          </Link>
        ))}
        {history.length === 0 && (
          <p className="text-muted text-center py-8">Aucun historique</p>
        )}
      </div>
    </div>
  );
}
