"use client";

import { useEffect, useState } from "react";
import { exercisesApi } from "@/lib/api";
import Link from "next/link";

interface Exercise {
  id: number;
  slug: string;
  title: string;
  difficulty: string;
  orderIndex: number;
  tags: string[];
}

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [difficulty, setDifficulty] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    const params: Record<string, any> = { page, pageSize: 20 };
    if (difficulty) params.difficulty = difficulty;
    if (search) params.search = search;

    exercisesApi
      .list(params)
      .then((r) => {
        setExercises(r.data.data.data);
        setTotal(r.data.data.total);
        setTotalPages(r.data.data.totalPages);
      })
      .catch(() => {});
  }, [page, difficulty, search]);

  const diffColor: Record<string, string> = {
    easy: "bg-success/20 text-success",
    medium: "bg-warning/20 text-warning",
    hard: "bg-danger/20 text-danger",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Exercices</h1>
        <span className="text-sm text-muted">{total} exercices</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(searchInput);
            setPage(1);
          }}
          className="flex-1 min-w-[200px]"
        >
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Rechercher..."
            className="w-full px-4 py-2 bg-card border border-card-border rounded-lg focus:outline-none focus:border-primary"
          />
        </form>
        <select
          value={difficulty}
          onChange={(e) => {
            setDifficulty(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 bg-card border border-card-border rounded-lg focus:outline-none focus:border-primary"
        >
          <option value="">Toutes difficultés</option>
          <option value="easy">Facile</option>
          <option value="medium">Moyen</option>
          <option value="hard">Difficile</option>
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {exercises.map((ex) => (
          <Link
            key={ex.id}
            href={`/exercises/${ex.id}`}
            className="bg-card border border-card-border rounded-xl p-5 hover:border-primary/50 transition-colors group"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs text-muted">#{ex.orderIndex}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${diffColor[ex.difficulty] || ""}`}>
                {ex.difficulty}
              </span>
            </div>
            <h3 className="font-semibold group-hover:text-primary transition-colors mb-2">
              {ex.title}
            </h3>
            <div className="flex flex-wrap gap-1">
              {(ex.tags as string[]).slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 bg-background rounded text-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg border border-card-border text-sm disabled:opacity-30 hover:bg-card transition-colors"
          >
            Précédent
          </button>
          <span className="text-sm text-muted">
            Page {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg border border-card-border text-sm disabled:opacity-30 hover:bg-card transition-colors"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
