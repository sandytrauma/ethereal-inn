// app/glam/(auth)/login/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginSalonUser } from "@/lib/actions/salon-auth";

export default function SalonLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Local state tracking variables
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Automatically parse security violations passed from our dashboard layout gate
  useEffect(() => {
    const fallbackError = searchParams.get("error");
    if (fallbackError) {
      setErrorMsg(fallbackError);
    }
  }, [searchParams]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    if (!email || !password) {
      setErrorMsg("Please enter both your registered email and password.");
      setIsLoading(false);
      return;
    }

    try {
      // Execute our airtight, isolated glam schema server action
      const response = await loginSalonUser({
        email: email.trim(),
        passwordRaw: password,
      });

      if (!response.success) {
        setErrorMsg(response.error || "Authentication failed.");
        setIsLoading(false);
        return;
      }

      // 🚀 SUCCESS: Router pre-fetches and pushes safely to the secure layout container
      router.push("/glam/dashboard");
      router.refresh();
    } catch (err) {
      setErrorMsg("An unexpected server authentication gateway error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden selection:bg-pink-500 selection:text-white">
      {/* Abstract Luxury Background Glow Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Branding header block */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400">
            ETHEREAL GLAM
          </h1>
          <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mt-2">
            Enterprise Salon SaaS Gateway
          </p>
        </div>

        {/* Login Card Core UI */}
        <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-slate-200 mb-6">Sign In to Your Workspace</h2>

          {/* Dynamic Error Status Box */}
          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs font-medium animate-shake">
              ⚠️ {errorMsg}
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Salon Business Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="manager@etherealglam.com"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-pink-500/80 focus:ring-1 focus:ring-pink-500/30 transition text-sm disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Secure Token Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-pink-500/80 focus:ring-1 focus:ring-pink-500/30 transition text-sm disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 mt-2 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white font-bold text-sm tracking-wide shadow-lg shadow-pink-950/20 transition transform active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Verifying Credentials Namespace...
                </>
              ) : (
                "Verify Secure Identity"
              )}
            </button>
          </form>
        </div>

        {/* Tenant Footer Notice */}
        <div className="text-center mt-6 text-[11px] text-slate-600 font-medium tracking-wide leading-relaxed">
          Authorized Salon Staff Access Only.<br />
          Cross-domain login monitoring is active.
        </div>
      </div>
    </div>
  );
}