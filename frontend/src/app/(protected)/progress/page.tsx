"use client";

import { useEffect, useState } from "react";
import { progressApi } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface Stats {
  totalSubmissions: number;
  successRate: number;
  byDifficulty: Record<string, { completed: number; total: number }>;
  recentActivity: { date: string; count: number }[];
}

interface Overview {
  totalExercises: number;
  completedByLanguage: Record<string, number>;
  totalCompleted: number;
  currentStreak: number;
  longestStreak: number;
}

const COLORS = ["#22c55e", "#f59e0b", "#ef4444"];

export default function ProgressPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);

  useEffect(() => {
    progressApi.stats().then((r) => setStats(r.data.data)).catch(() => {});
    progressApi.overview().then((r) => setOverview(r.data.data)).catch(() => {});
  }, []);

  if (!stats || !overview) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const diffData = Object.entries(stats.byDifficulty).map(([key, val]) => ({
    name: key === "easy" ? "Facile" : key === "medium" ? "Moyen" : "Difficile",
    completed: val.completed,
    total: val.total,
    remaining: val.total - val.completed,
  }));

  const langData = Object.entries(overview.completedByLanguage).map(([key, val]) => ({
    name: key === "c" ? "C" : key === "python" ? "Python" : "TypeScript",
    value: val,
  }));

  const LANG_COLORS = ["#60a5fa", "#fbbf24", "#38bdf8"];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Progression</h1>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-card-border rounded-xl p-5">
          <p className="text-sm text-muted mb-1">Total soumissions</p>
          <p className="text-3xl font-bold">{stats.totalSubmissions}</p>
        </div>
        <div className="bg-card border border-card-border rounded-xl p-5">
          <p className="text-sm text-muted mb-1">Taux de réussite</p>
          <p className="text-3xl font-bold">{stats.successRate}%</p>
        </div>
        <div className="bg-card border border-card-border rounded-xl p-5">
          <p className="text-sm text-muted mb-1">Streak actuel</p>
          <p className="text-3xl font-bold">{overview.currentStreak} <span className="text-lg text-muted font-normal">jours</span></p>
        </div>
        <div className="bg-card border border-card-border rounded-xl p-5">
          <p className="text-sm text-muted mb-1">Meilleur streak</p>
          <p className="text-3xl font-bold">{overview.longestStreak} <span className="text-lg text-muted font-normal">jours</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* By difficulty */}
        <div className="bg-card border border-card-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Par Difficulté</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={diffData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
              />
              <Bar dataKey="completed" fill="#6366f1" name="Complétés" radius={[4, 4, 0, 0]} />
              <Bar dataKey="remaining" fill="#334155" name="Restants" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By language */}
        <div className="bg-card border border-card-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Par Langage</h2>
          {langData.some((d) => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={langData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {langData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={LANG_COLORS[index % LANG_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-muted">
              Aucun exercice complété
            </div>
          )}
        </div>
      </div>

      {/* Activity heatmap (simple) */}
      <div className="bg-card border border-card-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Activité Récente (30 jours)</h2>
        {stats.recentActivity.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.recentActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                tickFormatter={(d) => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
                fontSize={11}
              />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                labelFormatter={(d) => new Date(d).toLocaleDateString("fr-FR")}
              />
              <Bar dataKey="count" fill="#6366f1" name="Soumissions" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[200px] text-muted">
            Aucune activité récente
          </div>
        )}
      </div>
    </div>
  );
}
