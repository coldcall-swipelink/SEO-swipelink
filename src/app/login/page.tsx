"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Page de connexion au back-office (voir src/middleware.ts).
export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Connexion impossible");
    } catch {
      setError("Connexion impossible");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm bg-white rounded-xl shadow p-8 space-y-4"
      >
        <h1 className="text-xl font-semibold text-gray-900">SwipeLink SEO</h1>
        <p className="text-sm text-gray-500">
          Entrez le mot de passe pour accéder au back-office.
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe"
          autoFocus
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading || !password}
          className="w-full bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </main>
  );
}
