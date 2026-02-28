"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { progressApi, dailyApi, submissionsApi } from "@/lib/api";
import Link from "next/link";

interface Overview {
  totalExercises: number;
  completedByLanguage: Record<string, number>;
  totalCompleted: number;
  currentStreak: number;
  longestStreak: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [daily, setDaily] = useState<any>(null);
  const [recentSubs, setRecentSubs] = useState<any[]>([]);

  useEffect(() => {
    progressApi.overview().then((r) => setOverview(r.data.data)).catch(() => {});
    dailyApi.today().then((r) => setDaily(r.data.data)).catch(() => {});
    submissionsApi
      .list({ pageSize: 5 })
      .then((r) => setRecentSubs(r.data.data.data))
      .catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        Bonjour, <span className="text-primary">{user?.username}</span>
      </h1>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Exercices complétés" value={overview?.totalCompleted ?? 0} sub={`/ ${overview?.totalExercises ?? 0}`} />
        <StatCard label="Streak actuel" value={overview?.currentStreak ?? 0} sub="jours" />
        <StatCard label="Meilleur streak" value={overview?.longestStreak ?? 0} sub="jours" />
        <StatCard
          label="Progression"
          value={
            overview && overview.totalExercises > 0
              ? Math.round((overview.totalCompleted / overview.totalExercises) * 100)
              : 0
          }
          sub="%"
        />
      </div>

      {/* Languages progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-card border border-card-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Par Langage</h2>
          <div className="space-y-4">
            {(["c", "python", "typescript"] as const).map((lang) => {
              const completed = overview?.completedByLanguage?.[lang] ?? 0;
              const total = overview?.totalExercises ?? 1;
              const pct = Math.round((completed / total) * 100);
              const colors: Record<string, string> = {
                c: "bg-blue-500",
                python: "bg-yellow-500",
                typescript: "bg-blue-400",
              };
              const labels: Record<string, string> = {
                c: "C",
                python: "Python",
                typescript: "TypeScript",
              };
              return (
                <div key={lang}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{labels[lang]}</span>
                    <span className="text-muted">
                      {completed}/{total}
                    </span>
                  </div>
                  <div className="h-2 bg-background rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colors[lang]} rounded-full transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Daily exercise */}
        <div className="bg-card border border-card-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Exercice du Jour</h2>
          {daily?.exercise ? (
            <div>
              <h3 className="text-xl font-medium mb-2">{daily.exercise.title}</h3>
              <span
                className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-3 ${
                  daily.exercise.difficulty === "easy"
                    ? "bg-success/20 text-success"
                    : daily.exercise.difficulty === "medium"
                    ? "bg-warning/20 text-warning"
                    : "bg-danger/20 text-danger"
                }`}
              >
                {daily.exercise.difficulty}
              </span>
              <p className="text-sm text-muted mb-4 line-clamp-3">
                {daily.exercise.description}
              </p>
              <Link
                href={`/exercises/${daily.exercise.id}`}
                className="inline-block px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors"
              >
                Résoudre
              </Link>
            </div>
          ) : (
            <p className="text-muted">Chargement...</p>
          )}
        </div>
      </div>

      {/* Recent submissions */}
      <div className="bg-card border border-card-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Soumissions Récentes</h2>
        {recentSubs.length > 0 ? (
          <div className="space-y-3">
            {recentSubs.map((sub: any) => (
              <div
                key={sub.id}
                className="flex items-center justify-between py-2 border-b border-card-border last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      sub.passed ? "bg-success" : "bg-danger"
                    }`}
                  />
                  <span className="text-sm">Exercice #{sub.exerciseId}</span>
                  <span className="text-xs text-muted px-2 py-0.5 bg-background rounded">
                    {sub.language}
                  </span>
                </div>
                <span className="text-xs text-muted">
                  {new Date(sub.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted text-sm">Aucune soumission encore</p>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-5">
      <p className="text-sm text-muted mb-1">{label}</p>
      <p className="text-3xl font-bold">
        {value}
        <span className="text-lg text-muted font-normal ml-1">{sub}</span>
      </p>
    </div>
  );
}
