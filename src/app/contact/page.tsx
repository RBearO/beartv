"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Mail, MessageSquare } from "lucide-react";

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 pb-12 px-4">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Contact Us</h1>
            <p className="text-white/50">Have a question or need help? We&apos;re here for you.</p>
          </div>

          <Card>
            {sent ? (
              <div className="text-center py-8">
                <MessageSquare size={40} className="text-bear-gold mx-auto mb-4" />
                <p className="text-white font-medium">Message sent!</p>
                <p className="text-sm text-white/40 mt-1">We&apos;ll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Name" required />
                <Input label="Email" type="email" required />
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Message</label>
                  <textarea
                    rows={4}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-bear-brown/50 resize-none"
                    placeholder="How can we help?"
                  />
                </div>
                <Button type="submit" variant="gold" className="w-full">
                  Send Message
                </Button>
              </form>
            )}
          </Card>

          <div className="flex items-center justify-center gap-2 mt-6 text-sm text-white/40">
            <Mail size={16} />
            <span>support@beartv.com</span>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
