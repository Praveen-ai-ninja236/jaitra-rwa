"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Lock,
  Mail,
  User,
  Shield,
  KeyRound,
  Building,
  CheckCircle2,
  LogOut,
  UserPlus,
  Phone,
  Crown,
  Eye,
  AlertCircle,
  Wrench,
} from "lucide-react";
import { AppUser, UserRole } from "../lib/types";
import * as api from "../lib/api";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
  onLoginSuccess: (user: AppUser) => void;
  onLogout: () => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout,
}: AuthModalProps) {
  const [tab, setTab] = useState<"signin" | "signup">("signin");

  // Sign In State (starts empty so user enters credentials)
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Sign Up State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("User");
  const [tower, setTower] = useState("Tower A");
  const [flatNo, setFlatNo] = useState("");
  const [phone, setPhone] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Reset all form state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTab("signin");
      setSignInEmail("");
      setSignInPassword("");
      setName("");
      setEmail("");
      setPassword("");
      setRole("User");
      setTower("Tower A");
      setFlatNo("");
      setPhone("");
      setErrorMessage("");
      setSuccessMessage("");
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleQuickSelect = (quickRole: UserRole) => {
    if (quickRole === "Super Admin") {
      setSignInEmail("superadmin@jaitra.org");
      setSignInPassword("");
    } else if (quickRole === "Admin") {
      setSignInEmail("admin4u@jaitra.org");
      setSignInPassword("");
    } else if (quickRole === "Staff") {
      setSignInEmail("staff@jaitra.org");
      setSignInPassword("");
    } else {
      setSignInEmail("resident@jaitra.org");
      setSignInPassword("");
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);
    try {
      const res = await api.loginUser(signInEmail, signInPassword);
      if (res.user) {
        onLoginSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);
    try {
      const res = await api.registerUser({
        name,
        email,
        password,
        role,
        tower,
        flat_no: flatNo,
        phone,
      });
      if (res.user) {
        setSuccessMessage("Account created successfully! Logging you in...");
        setTimeout(() => {
          onLoginSuccess(res.user);
          onClose();
        }, 1000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-5 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {currentUser ? "User Profile & Session" : "Jaitra Portal Access"}
              </h3>
              <p className="text-xs text-slate-400">
                {currentUser
                  ? `Logged in as ${currentUser.role}`
                  : "Sign In or Register with Role Authorization"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentUser ? (
            /* Logged in User Profile Info */
            <div className="space-y-5">
              <div className="p-4 bg-indigo-950/50 border border-indigo-800/60 rounded-xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md">
                  {currentUser.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-white text-base">{currentUser.name}</p>
                    <span
                      className={`px-2 py-0.5 text-[11px] font-extrabold rounded-full border ${
                        currentUser.role === "Super Admin"
                          ? "bg-amber-950 text-amber-300 border-amber-600"
                          : currentUser.role === "Admin"
                          ? "bg-indigo-950 text-indigo-300 border-indigo-600"
                          : currentUser.role === "Staff"
                          ? "bg-teal-950 text-teal-300 border-teal-600"
                          : "bg-slate-800 text-slate-300 border-slate-700"
                      }`}
                    >
                      {currentUser.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{currentUser.email}</p>
                  {currentUser.tower && (
                    <p className="text-xs text-indigo-300/80 mt-0.5 flex items-center gap-1">
                      <Building className="w-3 h-3 inline" /> {currentUser.tower} - {currentUser.flat_no || "Flat"}
                    </p>
                  )}
                </div>
              </div>

              {/* Role Permissions Matrix */}
              <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl space-y-2 text-xs text-slate-300">
                <p className="font-semibold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Active Permissions:
                </p>
                {currentUser.role === "Super Admin" && (
                  <ul className="text-slate-300 space-y-1 list-disc pl-4 text-[11px]">
                    <li><strong>All CRUD Permissions:</strong> Create, edit, delete across all 8 tabs</li>
                    <li><strong>Settings Manager:</strong> Modify all dropdown categories in Neon DB</li>
                    <li><strong>User Management:</strong> Oversee roles and directory access</li>
                  </ul>
                )}
                {currentUser.role === "Admin" && (
                  <ul className="text-slate-300 space-y-1 list-disc pl-4 text-[11px]">
                    <li><strong>All CRUD Permissions:</strong> Create, edit, delete across all 8 tabs</li>
                    <li><strong>Audit Approvals:</strong> Approve or reject expense vouchers</li>
                    <li><em>Settings Manager is restricted to Super Admin</em></li>
                  </ul>
                )}
                {currentUser.role === "Staff" && (
                  <ul className="text-teal-200 space-y-1 list-disc pl-4 text-[11px]">
                    <li><strong>Cultural Events:</strong> Full access to manage programs, participants & agendas</li>
                    <li><strong>Community Issues:</strong> Limited to managing <strong>Clubhouse & Common Space</strong> tickets</li>
                    <li><em>Residential Towers (A-F), Financials, GBMs, and ADO Board are restricted</em></li>
                  </ul>
                )}
                {currentUser.role === "User" && (
                  <ul className="text-slate-300 space-y-1 list-disc pl-4 text-[11px]">
                    <li><strong>View Only Mode:</strong> View all tabs, filters, and records</li>
                    <li><strong>Audit Access:</strong> Download statements and invoices</li>
                    <li><em>Modifications and Settings are view-only</em></li>
                  </ul>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-red-950/60 hover:bg-red-900 border border-red-700 text-red-300 rounded-xl font-bold text-xs transition"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl font-bold text-xs transition"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            /* Sign In / Sign Up Forms */
            <div>
              {/* Tab Selector */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mb-5">
                <button
                  type="button"
                  onClick={() => setTab("signin")}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
                    tab === "signin"
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setTab("signup")}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    tab === "signup"
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register / Sign Up</span>
                </button>
              </div>

              {/* Error / Success Messages */}
              {errorMessage && (
                <div className="mb-4 p-3 bg-red-950/70 border border-red-700/80 rounded-xl text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
              {successMessage && (
                <div className="mb-4 p-3 bg-emerald-950/70 border border-emerald-700/80 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* SIGN IN TAB */}
              {tab === "signin" && (
                <form onSubmit={handleSignIn} className="space-y-4" autoComplete="off">
                  {/* Hidden trap fields to absorb browser autofill */}
                  <div style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, overflow: "hidden" }} aria-hidden="true">
                    <input type="text" name="fakeusernameremember" tabIndex={-1} autoComplete="username" />
                    <input type="password" name="fakepasswordremember" tabIndex={-1} autoComplete="current-password" />
                  </div>

                  {/* Quick Role Switcher */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                      Quick Demo Profile Switcher
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickSelect("Super Admin")}
                        className={`p-2 rounded-xl text-xs font-bold border text-center transition ${
                          signInEmail.includes("superadmin")
                            ? "bg-amber-950/80 text-amber-300 border-amber-600 shadow-md"
                            : "bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white"
                        }`}
                      >
                        <Crown className="w-3.5 h-3.5 mx-auto mb-1 text-amber-400" />
                        <span>Super Admin</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickSelect("Admin")}
                        className={`p-2 rounded-xl text-xs font-bold border text-center transition ${
                          signInEmail.includes("admin@")
                            ? "bg-indigo-950/80 text-indigo-300 border-indigo-600 shadow-md"
                            : "bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white"
                        }`}
                      >
                        <Shield className="w-3.5 h-3.5 mx-auto mb-1 text-indigo-400" />
                        <span>Admin</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickSelect("Staff")}
                        className={`p-2 rounded-xl text-xs font-bold border text-center transition ${
                          signInEmail.includes("staff")
                            ? "bg-teal-950/80 text-teal-300 border-teal-600 shadow-md"
                            : "bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white"
                        }`}
                      >
                        <Wrench className="w-3.5 h-3.5 mx-auto mb-1 text-teal-400" />
                        <span>Staff</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickSelect("User")}
                        className={`p-2 rounded-xl text-xs font-bold border text-center transition ${
                          signInEmail.includes("resident")
                            ? "bg-emerald-950/80 text-emerald-300 border-emerald-600 shadow-md"
                            : "bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white"
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-400" />
                        <span>Resident</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        inputMode="email"
                        required
                        autoComplete="new-email"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        data-testid="login-email"
                        name="login-email-unique-12345"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        placeholder="email@jaitra.org"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="password"
                        required
                        autoComplete="new-password"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        data-testid="login-password"
                        name="login-password-unique-12345"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>{isLoading ? "Authenticating..." : "Sign In to Portal"}</span>
                  </button>
                </form>
              )}

              {/* SIGN UP / REGISTER TAB */}
              {tab === "signup" && (
                <form onSubmit={handleSignUp} className="space-y-3" autoComplete="off">
                  {/* Hidden trap fields to absorb browser autofill */}
                  <div style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, overflow: "hidden" }} aria-hidden="true">
                    <input type="text" name="fakeusernamesignup" tabIndex={-1} autoComplete="username" />
                    <input type="password" name="fakepasswordsignup" tabIndex={-1} autoComplete="new-password" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        name="signup-name-unique-12345"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. S. Ramesh Kumar"
                        className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        inputMode="email"
                        required
                        autoComplete="new-email"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        name="signup-email-unique-12345"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. ramesh@jaitra.org"
                        className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Create Password *</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="password"
                        required
                        autoComplete="new-password"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        name="signup-password-unique-12345"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Tower</label>
                      <select
                        value={tower}
                        onChange={(e) => setTower(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-xs outline-none"
                      >
                        <option value="Tower A">Tower A (G+14)</option>
                        <option value="Tower B">Tower B (G+14)</option>
                        <option value="Tower C">Tower C (G+14)</option>
                        <option value="Tower D">Tower D (G+14)</option>
                        <option value="Tower E">Tower E (G+14)</option>
                        <option value="Tower F">Tower F (G+14)</option>
                        <option value="Jaitra Management">Jaitra Management</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Flat No</label>
                      <input
                        type="text"
                        value={flatNo}
                        onChange={(e) => setFlatNo(e.target.value)}
                        placeholder="e.g. G01, 101, 705, 1402"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-xs outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98450 11223"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-xs outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Requested Role</label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as UserRole)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-xs outline-none"
                      >
                        <option value="User">Resident (View Only)</option>
                        <option value="Staff">Operations Staff (Clubhouse & Events)</option>
                        <option value="Admin">Committee Admin</option>
                        <option value="Super Admin">Super Admin</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{isLoading ? "Registering..." : "Register New Account"}</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
