"use client";
import React, { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, MapPin, ChevronLeft, Loader2, Send, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
// Ensure this path matches where you saved the server action
import { sendEmailAction } from "@/lib/actions/email";

export default function ContactPage() {
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Configuration
  const WHATSAPP_NUMBER = "919315371613";
  const WHATSAPP_MSG = encodeURIComponent("Hi Etherealinn, I would like to inquire about a booking.");

  const handleWhatsApp = () => {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`, "_blank");
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      try {
        const result = await sendEmailAction(formData);
        
        if (result.success) {
          setSubmitted(true);
        } else {
          // Captures the error message from Resend or our validation
          setError(result.error || "Something went wrong. Please try WhatsApp.");
        }
      } catch (err) {
        setError("Network error. Please check your connection.");
      }
    });
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white pb-32">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-black/20 border-b border-white/5 py-6 px-6">
        <div className="max-w-7xl mx-auto">
          <Link href="/" className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-[#c5a059]">
            <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Return to Sanctuary
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 pt-20">
        <header className="mb-20">
          <h1 className="text-6xl md:text-9xl font-serif font-bold italic uppercase tracking-tighter leading-none">
            Connect <span className="text-[#c5a059]">With Us.</span>
          </h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
          
          {/* Left Side: Contact Info & WhatsApp */}
          <div className="space-y-12">
            <div className="space-y-6">
              <h2 className="text-xs font-black uppercase tracking-[0.4em] text-[#c5a059]">Direct Channels</h2>
              <p className="text-gray-500 max-w-md leading-relaxed">
                For immediate assistance or concierge services, our WhatsApp hotline is active 24/7. For formal partnership or event inquiries, please use the registry.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={handleWhatsApp}
                className="group flex items-center justify-between p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem] hover:bg-emerald-500 transition-all duration-500"
              >
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-emerald-500 rounded-2xl text-black group-hover:bg-white transition-colors">
                    <MessageCircle size={24} />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 group-hover:text-white mb-1">Instant Response</p>
                    <p className="text-xl font-serif italic text-white group-hover:text-black">WhatsApp Concierge</p>
                  </div>
                </div>
                <ChevronLeft size={20} className="rotate-180 text-emerald-500 group-hover:text-black" />
              </button>

              <div className="p-8 bg-white/5 border border-white/5 rounded-[2.5rem] flex items-center gap-6">
                <div className="p-4 bg-white/10 rounded-2xl text-[#c5a059]">
                  <MapPin size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Location</p>
                  <p className="text-lg font-serif italic">F 1/3 A first floor near Panchsheel Nursing home hospital Moahn Garden, Delhi, 110059, India</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Formal Email Form */}
          <div className="relative">
            <AnimatePresence mode="wait">
              {!submitted ? (
                <motion.form 
                  key="contact-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleSubmit}
                  className="bg-zinc-900/50 border border-white/5 p-10 md:p-12 rounded-[3.5rem] space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Full Name</label>
                      <input required name="name" type="text" placeholder="John Doe" className="w-full bg-black border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-[#c5a059] transition-colors" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Email Address</label>
                      <input required name="email" type="email" placeholder="john@example.com" className="w-full bg-black border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-[#c5a059] transition-colors" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Subject</label>
                    <select name="subject" className="w-full bg-black border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-[#c5a059] transition-colors appearance-none cursor-pointer">
                      <option>Suite Reservation</option>
                      <option>Urban Ambrosia Catering</option>
                      <option>Event Hosting</option>
                      <option>Other Inquiry</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Message</label>
                    <textarea required name="message" rows={4} placeholder="How can we assist you today?" className="w-full bg-black border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-[#c5a059] transition-colors resize-none" />
                  </div>

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-bold uppercase tracking-widest"
                    >
                      <AlertCircle size={14} />
                      {error}
                    </motion.div>
                  )}

                  <button 
                    disabled={isPending}
                    type="submit"
                    className="w-full bg-white text-black h-16 rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-[#c5a059] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPending ? <Loader2 className="animate-spin" /> : <><Send size={16} /> Send Message</>}
                  </button>
                </motion.form>
              ) : (
                <motion.div 
                  key="success-message"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[#c5a059] text-black p-20 rounded-[3.5rem] text-center space-y-6"
                >
                  <CheckCircle2 size={64} className="mx-auto" />
                  <h2 className="text-4xl font-serif italic">Message Received.</h2>
                  <p className="font-bold uppercase tracking-widest text-[10px]">The concierge will reach out shortly.</p>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="text-[10px] font-black uppercase tracking-widest border-b-2 border-black pb-1 hover:opacity-60 transition-opacity"
                  >
                    Send another inquiry
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </main>
  );
}