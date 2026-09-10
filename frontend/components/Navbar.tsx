"use client";

import React, { useState } from "react";
import JaitraLogo from "./JaitraLogo";
import AuthModal from "./AuthModal";
import SettingsModal from "./SettingsModal";
import {
  WifiOff,
  RefreshCw,
  User,
  Shield,
  Settings,
  Menu,
  X,
  Crown,
  Lock,
  Mail,
} from "lucide-react";
import { AppUser, UserRole } from "../lib/types";

interface NavbarProps {
  isBackendConnected: boolean;
  onRefresh: () => void;
  isLoading: boolean;
  currentUser: AppUser | null;
  onLoginSuccess: (user: AppUser) => void;
  onLogout: () => void;
}

export default function Navbar({
  isBackendConnected,
  onRefresh,
  isLoading,
  currentUser,
  onLoginSuccess,
  onLogout,
}: NavbarProps) {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const role = currentUser?.role || "User";

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          {/* Left: Logo & Society Title */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <JaitraLogo variant="dark" />
            <div className="hidden sm:block h-7 w-px bg-slate-800" />
            <div className="hidden sm:block truncate">
              <span className="text-xs sm:text-sm font-extrabold text-slate-100 tracking-wide truncate">
                JAITRA RESIDENTS WELFARE ASSOCIATION
              </span>
            </div>
          </div>

          {/* Right: Desktop Actions */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3">
            {/* Email Contact */}
            <a
              href="mailto:jaitra-association-hyd@googlegroups.com"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 hover:text-sky-400 transition rounded-lg"
              title="Contact Association"
            >
              <Mail className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">jaitra-association-hyd@googlegroups.com</span>
            </a>

            {/* Sync DB Button */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Sync latest live database records"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-300 bg-slate-800/90 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-xl transition shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-sky-400" : "text-slate-400"}`} />
              <span>Sync DB</span>
            </button>

            {/* Neon DB Status */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition ${
                isBackendConnected
                  ? "bg-emerald-950/70 text-emerald-300 border-emerald-700/60 shadow-[0_0_12px_-3px_rgba(16,185,129,0.4)]"
                  : "bg-amber-950/70 text-amber-300 border-amber-700/60"
              }`}
            >
              {isBackendConnected ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Neon DB Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>DB Offline</span>
                </>
              )}
            </div>

            {/* Settings Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs border transition shadow-sm ${
                role === "Super Admin"
                  ? "bg-amber-950/80 text-amber-300 border-amber-600 hover:bg-amber-900"
                  : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800"
              }`}
              title={
                role === "Super Admin"
                  ? "System Dropdown & Configuration Settings"
                  : "View System Settings (Super Admin Only to Edit)"
              }
            >
              <Settings className="w-3.5 h-3.5 text-amber-400" />
              <span>Settings</span>
            </button>

            {/* Auth / Profile Button */}
            <button
              onClick={() => setIsAuthOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl font-bold text-xs border border-indigo-500/50 shadow-md shadow-indigo-600/20 transition"
            >
              {currentUser ? (
                <>
                  <div className="w-5 h-5 rounded-full bg-indigo-900 border border-indigo-400 flex items-center justify-center text-[10px] text-indigo-200 font-extrabold">
                    {currentUser.name.charAt(0)}
                  </div>
                  <span className="max-w-[90px] truncate">{currentUser.name}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase ${
                      currentUser.role === "Super Admin"
                        ? "bg-amber-500 text-slate-950"
                        : currentUser.role === "Admin"
                        ? "bg-indigo-950 text-indigo-300 border border-indigo-700"
                        : currentUser.role === "Staff"
                        ? "bg-teal-500 text-slate-950 font-black"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {currentUser.role}
                  </span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5" />
                  <span>Login / Register</span>
                </>
              )}
            </button>
          </div>

          {/* Mobile Right Controls: Sync + Settings + Auth + Hamburger */}
          <div className="flex md:hidden items-center gap-1.5">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 text-slate-300 bg-slate-800 border border-slate-700 rounded-xl"
              title="Sync DB"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-sky-400" : ""}`} />
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-amber-400 bg-slate-800 border border-slate-700 rounded-xl"
              title="Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setIsAuthOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold"
            >
              {currentUser ? (
                <div className="w-5 h-5 rounded-full bg-indigo-900 flex items-center justify-center text-[10px] font-extrabold">
                  {currentUser.name.charAt(0)}
                </div>
              ) : (
                <User className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl border border-slate-700"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
              <span className="text-slate-400">Database Status:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Neon PostgreSQL Live
              </span>
            </div>

            {currentUser ? (
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-white">{currentUser.name}</p>
                  <p className="text-slate-400 text-[11px]">{currentUser.email}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-700">
                  {currentUser.role}
                </span>
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsAuthOpen(true);
                }}
                className="w-full py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow"
              >
                Sign In / Register
              </button>
            )}

            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsSettingsOpen(true);
              }}
              className="w-full flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs rounded-xl"
            >
              <Settings className="w-4 h-4 text-amber-400" />
              <span>Dropdown &amp; System Settings</span>
            </button>
          </div>
        )}
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={onLoginSuccess}
        onLogout={onLogout}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        userRole={role}
        onOptionsUpdated={onRefresh}
      />
    </>
  );
}
