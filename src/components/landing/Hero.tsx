"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { Video, Shield, Globe, Zap } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-bear-brown/10 via-transparent to-transparent" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-bear-brown/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-bear-gold/5 rounded-full blur-3xl" />

      <div className="relative max-w-4xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--surface-bg)] border border-[var(--border-color)] text-sm text-[var(--text-secondary)] mb-8">
            <span
              className="inline-flex h-2 w-2 rounded-full bg-green-600 border border-green-300"
              aria-hidden="true"
            />
            <span>Thousands chatting now</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
            Meet New People on{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-bear-brown to-bear-gold">
              BearTV
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-10">
            Random video chat with people from around the world. Safe, moderated, and completely free.
            Just click start and connect instantly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/chat">
              <Button variant="gold" size="xl" className="min-w-[220px]">
                <Video size={22} />
                Start Chatting
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="lg">
                Create Account
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-20"
        >
          {[
            { icon: Video, label: "HD Video Chat" },
            { icon: Shield, label: "Safe & Moderated" },
            { icon: Globe, label: "Global Community" },
            { icon: Zap, label: "Instant Matching" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/5"
            >
              <Icon size={24} className="text-bear-gold" />
              <span className="text-xs text-white/50">{label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
