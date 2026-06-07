"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginSalonUser } from "@/lib/actions/salon-auth";

export const dynamic = "force-dynamic";

function SalonLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is required. Please enable location access.");
      setIsLoading(false);
      return;
    }

    // =========================================================================
    // 🛡️ EXTRACT SUBDOMAIN CONTEXT STRINGS DYNAMICALLY
    // =========================================================================
    let subdomainSlug: string | null = null;
    if (typeof window !== "undefined") {
      const hostParts = window.location.hostname.split(".");
      // Catch subdomains on live infrastructure or custom localhost mappings
      if (hostParts.length > 2 && hostParts[0] !== "www") {
        subdomainSlug = hostParts[0];
      } else if (hostParts.length === 2 && window.location.hostname.includes("localhost") && hostParts[0] !== "localhost") {
        subdomainSlug = hostParts[0];
      }
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // 🌟 SYNCHRONIZED EXECUTION FLIGHT: Appending currentDomainSlug to payload parameters
          const response = await loginSalonUser({
            email: email.trim(),
            passwordRaw: password,
            currentDomainSlug: subdomainSlug, // Passed down cleanly to database conditional query locks
            clientLat: latitude,
            clientLon: longitude,
          });

          if (!response.success) {
            setErrorMsg(response.error || "Authentication failed.");
            setIsLoading(false);
            return;
          }

          router.push("/glam/dashboard");
          router.refresh();
        } catch (err) {
          setErrorMsg("An unexpected server authentication error occurred.");
          setIsLoading(false);
        }
      },
      (geoError) => {
        setIsLoading(false);
        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            setErrorMsg("Location access denied. Please enable location permissions to sign in.");
            break;
          case geoError.POSITION_UNAVAILABLE:
            setErrorMsg("Unable to determine your location. Please check your device settings.");
            break;
          default:
            setErrorMsg("Location verification failed. Please try again.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="w-full max-w-md z-10">
      <div className="text-center mb-8 select-none">
        <h1 className="text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400">
          ETHEREAL GLAM
        </h1>
        <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mt-2">
          Enterprise Salon SaaS Gateway
        </p>
      </div>

      <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl">
        <h2 className="text-xl font-bold text-slate-200 mb-6 select-none">Sign In to Your Workspace</h2>

        {errorMsg && (
          <div className="mb-5 p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs font-medium max-w-full break-words">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 select-none">
              Salon Business Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="manager@etherealglam.com"
              disabled={isLoading}
              className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-pink-500/80 focus:ring-1 focus:ring-pink-500/30 transition text-sm disabled:opacity-50"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 select-none">
              Secure Token Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              disabled={isLoading}
              className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-pink-500/80 focus:ring-1 focus:ring-pink-500/30 transition text-sm disabled:opacity-50"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 mt-2 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white font-bold text-sm tracking-wide shadow-lg shadow-pink-950/20 transition transform active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2 select-none"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Verifying Location...
              </>
            ) : (
              "Sign In with Location"
            )}
          </button>
        </form>
      </div>

      <div className="text-center mt-6 text-[11px] text-slate-600 font-medium tracking-wide leading-relaxed select-none">
        Authorized Salon Staff Access Only.<br />
        Location verification required.
      </div>
    </div>
  );
}

export default function SalonLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden selection:bg-pink-500 selection:text-white">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

      <Suspense fallback={
        <div className="text-center font-mono text-xs text-slate-500 animate-pulse select-none">
          Loading Authentication...
        </div>
      }>
        <SalonLoginForm />
      </Suspense>
    </div>
  );
}