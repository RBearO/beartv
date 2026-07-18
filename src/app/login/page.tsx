"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import TurnstileWidget from "@/components/chat/TurnstileWidget";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name, turnstileToken }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Registration failed");
          setLoading(false);
          return;
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        // Session may require a password change (e.g. temporary admin invite)
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json().catch(() => null);
        if (session?.user?.mustChangePassword) {
          window.location.href = "/change-password";
        } else {
          window.location.href = "/chat";
        }
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen flex items-center justify-center px-4 pt-16">
        <Card className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-bear-brown flex items-center justify-center text-2xl mx-auto mb-3">
              🐻
            </div>
            <h1 className="text-2xl font-bold text-white">
              {isRegister ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="text-sm text-white/40 mt-1">
              {isRegister ? "Join the BearTV community" : "Sign in to start chatting"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <Input
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            )}
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />

            {isRegister && (
              <TurnstileWidget onVerify={setTurnstileToken} />
            )}

            {error && <p className="text-sm text-red-400">{error}</p>}

            <Button
              type="submit"
              variant="gold"
              isLoading={loading}
              className="w-full"
              disabled={isRegister && !turnstileToken}
            >
              {isRegister ? "Create Account" : "Sign In"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-bear-gray text-white/40">or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => signIn("google", { callbackUrl: "/chat" })}>
              Google
            </Button>
            <Button variant="secondary" onClick={() => signIn("github", { callbackUrl: "/chat" })}>
              GitHub
            </Button>
          </div>

          <p className="text-center text-sm text-white/40 mt-6">
            {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => { setIsRegister(!isRegister); setError(""); }}
              className="text-bear-gold hover:underline"
            >
              {isRegister ? "Sign In" : "Register"}
            </button>
          </p>
        </Card>
      </main>
    </>
  );
}
