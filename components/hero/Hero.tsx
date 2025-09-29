"use client";

import { Button } from "@heroui/react";
import { motion, cubicBezier } from "framer-motion";
import Link from "next/link";

const fadeInUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: cubicBezier(0.16, 1, 0.3, 1) } },
} as const;

const staggerContainer = {
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
} as const;

export default function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden flex items-center justify-center p-6">
      {/* Nature-inspired background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        {/* Himalayan mountain layers */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(14,116,144,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_80%,rgba(5,150,105,0.08),transparent_50%)]" />
        
        {/* Atlantic ocean depths */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-cyan-950/20 via-teal-900/10 to-transparent" />
        <div className="absolute bottom-0 right-0 w-full h-40 bg-gradient-to-t from-emerald-950/15 via-slate-900/20 to-transparent" />
        
        {/* Organic flowing shapes */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-gradient-to-br from-teal-600/10 via-cyan-700/5 to-transparent blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 -right-32 w-80 h-80 rounded-full bg-gradient-to-br from-emerald-600/8 via-green-700/4 to-transparent blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Main bordered container */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={staggerContainer}
        className="relative w-full max-w-6xl"
      >
        {/* The framed content box with nature-inspired styling */}
        <div className="relative border border-teal-500/20 rounded-2xl bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-slate-900/80 backdrop-blur-md shadow-2xl shadow-teal-900/20 p-12 md:p-16 lg:p-20">
          {/* Corner accents with ocean colors */}
          <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-cyan-400/50" />
          <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-teal-400/50" />
          <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-emerald-400/50" />
          <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-green-400/50" />

          {/* Subtle inner glow */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-teal-500/5 via-transparent to-emerald-500/5 pointer-events-none" />

          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Left column - Main content */}
            <div className="lg:col-span-8">
              <motion.div variants={fadeInUp} className="mb-8">
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-teal-400/30 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 backdrop-blur-sm">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 animate-pulse shadow-lg shadow-teal-400/50" />
                  <span className="text-sm font-medium tracking-wide text-teal-300">
                    AVAILABLE FOR PROJECTS
                  </span>
                </div>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                className="text-balance font-light leading-[1.05] tracking-[-0.025em] text-4xl sm:text-5xl lg:text-6xl xl:text-7xl mb-8"
              >
                <span className="block font-extralight text-slate-400 mb-2">Strategic</span>
                <span className="block font-semibold bg-gradient-to-r from-slate-100 via-teal-100 to-cyan-200 bg-clip-text text-transparent mb-3">
                  Design Leader
                </span>
                <span className="block text-xl sm:text-2xl lg:text-3xl font-light bg-gradient-to-r from-emerald-300 to-teal-400 bg-clip-text text-transparent">
                  CMO • Founder • Head of Delivery
                </span>
              </motion.h1>

              <motion.div variants={fadeInUp} className="space-y-4 mb-10">
                <p className="text-lg font-light leading-relaxed text-slate-300 max-w-2xl">
                  Bridging visionary marketing strategies with flawless technical execution. 
                  I build premium digital experiences that drive measurable business impact.
                </p>
              </motion.div>

              <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-4">
                <Button 
                  as={Link} 
                  href="#work" 
                  size="lg" 
                  className="font-medium px-8 rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white shadow-lg shadow-teal-500/25 transition-all duration-300"
                >
                  View Selected Work
                </Button>
                <Button 
                  as={Link} 
                  href="#contact" 
                  variant="bordered" 
                  size="lg"
                  className="font-medium px-8 rounded-full border-teal-400/40 text-teal-300 hover:border-teal-300 hover:text-teal-200 hover:bg-teal-500/10 transition-all duration-300"
                >
                  Let&apos;s Connect
                </Button>
              </motion.div>
            </div>

            {/* Right column - Compact info */}
            <div className="lg:col-span-4">
              <motion.div variants={fadeInUp} className="space-y-8">
                {/* Roles - Compact */}
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold tracking-widest uppercase text-slate-400 mb-4">
                    Current Focus
                  </h3>
                  <div className="space-y-2">
                    {[
                      { role: "Chief Marketing Officer", icon: "🏔️", color: "from-slate-300 to-teal-300" },
                      { role: "Founder & Visionary", icon: "🌊", color: "from-cyan-300 to-blue-300" },
                      { role: "Head of Delivery", icon: "🌲", color: "from-emerald-300 to-green-300" }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center gap-3 py-2 group">
                        <span className="text-lg">{item.icon}</span>
                        <span className={`text-sm font-medium bg-gradient-to-r ${item.color} bg-clip-text text-transparent group-hover:from-white group-hover:to-teal-200 transition-all`}>
                          {item.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-gradient-to-r from-teal-500/30 via-cyan-500/20 to-transparent" />

                {/* Skills - Clean tags */}
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold tracking-widest uppercase text-slate-400">
                    Core Expertise
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { skill: "Brand Strategy", color: "from-teal-500/20 to-cyan-500/20 border-teal-400/30 text-teal-300" },
                      { skill: "Growth", color: "from-emerald-500/20 to-green-500/20 border-emerald-400/30 text-emerald-300" },
                      { skill: "UX Design", color: "from-cyan-500/20 to-blue-500/20 border-cyan-400/30 text-cyan-300" },
                      { skill: "Team Leadership", color: "from-slate-500/20 to-slate-400/20 border-slate-400/30 text-slate-300" },
                      { skill: "Product", color: "from-green-500/20 to-emerald-500/20 border-green-400/30 text-green-300" },
                      { skill: "Marketing", color: "from-blue-500/20 to-cyan-500/20 border-blue-400/30 text-blue-300" }
                    ].map((item, index) => (
                      <span 
                        key={index} 
                        className={`px-3 py-1 text-xs font-medium rounded-full bg-gradient-to-r ${item.color} border hover:scale-105 transition-all duration-200`}
                      >
                        {item.skill}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Bottom signature */}
          <motion.div 
            variants={fadeInUp}
            className="mt-16 pt-8 border-t border-gradient-to-r border-teal-500/20"
          >
            <div className="flex items-center justify-between text-xs font-medium tracking-widest uppercase text-slate-400">
              <span className="bg-gradient-to-r from-slate-400 to-teal-400 bg-clip-text text-transparent">Portfolio — 2024</span>
              <div className="flex items-center gap-6">
                <span className="text-emerald-400">Premium</span>
                <span className="text-teal-500">•</span>
                <span className="text-cyan-400">Strategic</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}


