"use client";

import { useActionState } from "react"; // 1. Update the import
import { loginUser } from "@/lib/actions/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lock } from "lucide-react";

export default function LoginPage() {
  // 2. useActionState returns [state, formAction, isPending]
  const [state, formAction, isPending] = useActionState(loginUser, null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-6">
      <Card className="w-full max-w-sm bg-slate-900/50 border-slate-800 rounded-[2.5rem] backdrop-blur-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-amber-400 rounded-2xl flex items-center justify-center mb-4">
            <Lock className="text-slate-950" size={24} />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Ethereal <span className="text-amber-400">Inn</span></CardTitle>
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] mt-2">Secure Access Required</p>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <input
              name="email"
              type="email"
              placeholder="Staff Email"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white outline-none focus:border-amber-400 transition-all"
              required
            />
            <input
              name="password"
              type="password"
              placeholder="Password"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white outline-none focus:border-amber-400 transition-all"
              required
            />
            
            {state?.error && (
              <p className="text-rose-500 text-center text-xs font-bold bg-rose-500/10 py-2 rounded-lg">
                {state.error}
              </p>
            )}

            {/* 3. Pass isPending to the button */}
            <button 
              disabled={isPending}
              className="w-full bg-amber-400 text-slate-950 font-black py-4 rounded-2xl active:scale-95 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPending ? <Loader2 className="animate-spin w-5 h-5" /> : "Enter Dashboard"}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}