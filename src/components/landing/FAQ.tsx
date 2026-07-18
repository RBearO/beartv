"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Is BearTV free to use?",
    a: "Yes! BearTV is completely free. Create an account to unlock all features including interest matching and profile customization.",
  },
  {
    q: "How does matching work?",
    a: "When you click Start Chatting, you enter our matchmaking queue. Our system pairs you with another available user based on your preferences and interests.",
  },
  {
    q: "Is my video chat private?",
    a: "Yes. All video chats are peer-to-peer using WebRTC encryption. We never store or record your video conversations.",
  },
  {
    q: "What should I do if someone is inappropriate?",
    a: "Use the Report button immediately. Our moderation team reviews all reports and takes action including temporary and permanent bans.",
  },
  {
    q: "Can I use BearTV on my phone?",
    a: "Absolutely! BearTV is fully responsive and works on all modern browsers on iOS and Android devices.",
  },
  {
    q: "Do I need to create an account?",
    a: "An account is required to chat. This helps us maintain a safe community and allows you to save preferences and track reports.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-xl bg-white/5 border border-white/5 overflow-hidden"
            >
              <button
                className="w-full flex items-center justify-between p-5 text-left"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                <span className="text-white font-medium pr-4">{faq.q}</span>
                <ChevronDown
                  size={18}
                  className={`text-white/40 shrink-0 transition-transform ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="px-5 pb-5 text-sm text-white/50">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
