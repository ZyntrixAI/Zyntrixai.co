"use client";

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Search,
  Users,
  Send,
  BarChart3,
  MessageSquare,
  BookOpen,
  Settings,
  LogOut
} from 'lucide-react';
import Link from 'next/link';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Search, label: 'Find Leads', href: '/dashboard/find' },
    { icon: Users, label: 'All Leads', href: '/dashboard/leads' },
    { icon: Send, label: 'Outreach', href: '/dashboard/outreach' },
    { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
    { icon: MessageSquare, label: 'Enquiries', href: '/dashboard/enquiries' },
    { icon: BookOpen, label: 'Guide', href: '/dashboard/guide' },
    { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
  ];

  return (
    <div className="flex h-screen bg-white dark:bg-black">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        className="w-[220px] bg-white dark:bg-black border-r border-gray-300 dark:border-gray-800 p-6 flex flex-col"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mb-8 font-bold text-black dark:text-white hover:opacity-80 transition">
          <div className="w-6 h-6 bg-black dark:bg-white rounded" />
          <span className="text-sm font-bold tracking-tight">ZYNTRIX</span>
        </Link>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <button className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors w-full">
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-white dark:bg-black">
        {/* Top bar */}
        <div className="border-b border-gray-300 dark:border-gray-800 bg-white dark:bg-black sticky top-0 z-10">
          <div className="px-8 py-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-black dark:text-white">CRM Dashboard</h2>
            <div className="flex items-center gap-4">
              <input
                type="search"
                placeholder="Search..."
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-black dark:focus:border-white"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
