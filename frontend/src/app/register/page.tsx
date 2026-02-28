"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(email, username, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold">
            <span className="text-primary">Code</span>Exo
          </Link>
          <p className="text-muted mt-2">Créez votre compte</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-card border border-card-border rounded-xl p-8 space-y-5"
        >
          {error && (
            <div className="bg-danger/10 border border-danger/30 text-danger rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-background border border-card-border rounded-lg focus:outline-none focus:border-primary transition-colors"
              placeholder="vous@exemple.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Nom d&apos;utilisateur</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={30}
              className="w-full px-4 py-2.5 bg-background border border-card-border rounded-lg focus:outline-none focus:border-primary transition-colors"
              placeholder="votre_pseudo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-2.5 bg-background border border-card-border rounded-lg focus:outline-none focus:border-primary transition-colors"
              placeholder="Minimum 8 caractères"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? "Inscription..." : "S'inscrire"}
          </button>

          <p className="text-center text-sm text-muted">
            Déjà un compte ?{" "}
            <Link href="/login" className="text-primary hover:text-primary-hover">
              Se connecter
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
