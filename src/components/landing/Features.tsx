"use client";

import { motion } from "framer-motion";
import Card from "@/components/ui/Card";
import {
  Video,
  MessageSquare,
  SkipForward,
  Shield,
  Filter,
  Tags,
  Moon,
  Smartphone,
} from "lucide-react";

const features = [
  {
    icon: Video,
    title: "Random Video Chat",
    description: "Connect with strangers worldwide through HD video and audio in real-time.",
  },
  {
    icon: SkipForward,
    title: "Instant Skip",
    description: "Not feeling the vibe? Hit Next to instantly match with someone new.",
  },
  {
    icon: MessageSquare,
    title: "Text Chat",
    description: "Send text messages alongside your video chat with typing indicators.",
  },
  {
    icon: Shield,
    title: "Safety First",
    description: "Report and moderation tools keep the community safe for everyone.",
  },
  {
    icon: Filter,
    title: "Smart Filters",
    description: "Filter matches by country or gender preference to find your ideal chat partner.",
  },
  {
    icon: Tags,
    title: "Interest Matching",
    description: "Add interest tags to match with people who share your hobbies and passions.",
  },
  {
    icon: Moon,
    title: "Dark Mode",
    description: "Easy on the eyes with a beautiful dark theme and smooth animations.",
  },
  {
    icon: Smartphone,
    title: "Mobile Friendly",
    description: "Fully responsive design works perfectly on phones, tablets, and desktops.",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Everything You Need
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto">
            BearTV comes packed with features to make your video chat experience smooth, safe, and fun.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="h-full hover:border-bear-brown/30 transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-bear-brown/20 flex items-center justify-center mb-4 group-hover:bg-bear-brown/30 transition-colors">
                  <feature.icon size={20} className="text-bear-gold" />
                </div>
                <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-white/40">{feature.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
