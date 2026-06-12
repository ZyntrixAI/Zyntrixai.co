"use client";

import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import Link from 'next/link';

// Simple Hero Component - White & Black
export const LivingFluidHero = () => {
  const textControls = useAnimation();
  const buttonControls = useAnimation();

  useEffect(() => {
    textControls.start(i => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05 + 0.3,
        duration: 0.8,
        ease: "easeOut"
      }
    }));
    buttonControls.start({
        opacity: 1,
        transition: { delay: 1, duration: 0.6 }
    });
  }, [textControls, buttonControls]);

  const headline = "ZyntrixLeads";

  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-white dark:bg-black">
      {/* Simple background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 dark:from-black dark:to-gray-900" />

      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="absolute top-0 left-0 right-0 z-20 p-6"
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center font-bold text-black dark:text-white text-2xl">Z</div>
            <span className="text-xl font-bold text-black dark:text-white">ZyntrixLeads</span>
          </div>
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="relative z-10 text-center px-4 max-w-2xl">
        {/* Heading */}
        <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-black dark:text-white mb-6">
          {headline.split("").map((char, i) => (
            <motion.span key={i} custom={i} initial={{ opacity: 0, y: 20 }} animate={textControls} style={{ display: 'inline-block' }}>
              {char === " " ? " " : char}
            </motion.span>
          ))}
        </h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed"
        >
          Professional lead management system built for modern teams. Simple, powerful, and focused on results.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={buttonControls}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            href="/dashboard"
            className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-lg hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors"
          >
            Enter Dashboard
          </Link>
          <a
            href="#features"
            className="px-8 py-3 border-2 border-black dark:border-white text-black dark:text-white font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            Learn More
          </a>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="grid grid-cols-3 gap-8 mt-16 pt-16 border-t border-gray-300 dark:border-gray-700"
        >
          {[
            { label: 'Active Leads', value: '5,000+' },
            { label: 'Success Rate', value: '95%' },
            { label: 'Response Time', value: '24hrs' },
          ].map((stat, i) => (
            <div key={stat.label}>
              <p className="text-2xl md:text-3xl font-bold text-black dark:text-white">{stat.value}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default LivingFluidHero;
