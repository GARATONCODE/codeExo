"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-3xl">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="text-primary">Code</span>Exo
          </h1>
          <p className="text-xl md:text-2xl text-muted mb-4">
            Plateforme d&apos;exercices quotidiens en{" "}
            <span className="text-blue-400">C</span>,{" "}
            <span className="text-yellow-400">Python</span> et{" "}
            <span className="text-blue-300">TypeScript</span>
          </p>
          <p className="text-muted mb-10 text-lg">
            50+ exercices progressifs avec vérification automatique
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold text-lg transition-colors"
            >
              Commencer
            </Link>
            <Link
              href="/login"
              className="px-8 py-3 border border-card-border hover:border-primary text-foreground rounded-xl font-semibold text-lg transition-colors"
            >
              Connexion
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
            <div className="bg-card border border-card-border rounded-xl p-6">
              <div className="text-3xl mb-3">&#128187;</div>
              <h3 className="font-semibold mb-2">3 Langages</h3>
              <p className="text-sm text-muted">
                Pratiquez en C, Python et TypeScript avec le même exercice
              </p>
            </div>
            <div className="bg-card border border-card-border rounded-xl p-6">
              <div className="text-3xl mb-3">&#9989;</div>
              <h3 className="font-semibold mb-2">Vérification Auto</h3>
              <p className="text-sm text-muted">
                Tests automatiques pour valider votre code instantanément
              </p>
            </div>
            <div className="bg-card border border-card-border rounded-xl p-6">
              <div className="text-3xl mb-3">&#128200;</div>
              <h3 className="font-semibold mb-2">Suivi Progrès</h3>
              <p className="text-sm text-muted">
                Dashboard, streak et statistiques détaillées
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
