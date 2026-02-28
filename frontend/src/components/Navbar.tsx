"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/exercises", label: "Exercices" },
    { href: "/daily", label: "Quotidien" },
    { href: "/progress", label: "Progression" },
  ];

  return (
    <nav className="bg-card border-b border-card-border">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="text-xl font-bold text-primary">
            CodeExo
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-primary/20 text-primary"
                    : "text-muted hover:text-foreground hover:bg-card-border/50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted">{user?.username}</span>
          <button
            onClick={logout}
            className="px-3 py-1.5 text-sm rounded-lg border border-card-border text-muted hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </nav>
  );
}
