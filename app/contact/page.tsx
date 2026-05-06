"use client";
import React, { useState, useTransition, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageCircle, 
  MapPin, 
  ChevronLeft, 
  Loader2, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  ChevronDown 
} from "lucide-react";
import Link from "next/link";
import { sendEmailAction } from "@/lib/actions/email";

export default function ContactPage() {
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State for dynamic WhatsApp generation
  const [formDataState, setFormDataState] = useState({
    name: "",
    property: "Ethereal Inn - Mohan Garden",
    subject: "Suite Reservation",
    message: ""
  });

  // Configuration
  const WHATSAPP_NUMBER = "918796211849";

  // Dynamic WhatsApp Message Generator
  const whatsappUrl = useMemo(() => {
    const greeting = `Hi Ethereal Inn Concierge,`;
    const body = `I am ${formDataState.name || "[Your Name]"}.\n\nI am inquiring about *${formDataState.property}* regarding *${formDataState.subject}*.\n\nDetails: ${formDataState.message || "I would like to discuss a potential booking."}`;
    const encodedMsg = encodeURIComponent(`${greeting}\n\n${body}`);
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMsg}`;
  }, [formDataState]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormDataState(prev => ({ ...prev, [name]: value }));
  };

  const handleWhatsApp = () => {
    window.open(whatsappUrl, "_blank");
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
                For immediate assistance at a specific property, use our WhatsApp concierge. The message will auto-draft based on your selections in the form.
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
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 group-hover:text-white mb-1">Live Concierge</p>
                    <p className="text-xl font-serif italic text-white group-hover:text-black">WhatsApp Inquire</p>
                  </div>
                </div>
                <ChevronLeft size={20} className="rotate-180 text-emerald-500 group-hover:text-black" />
              </button>

              <div className="p-8 bg-white/5 border border-white/5 rounded-[2.5rem] flex items-center gap-6">
                <div className="p-4 bg-white/10 rounded-2xl text-[#c5a059]">
                  <MapPin size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Corporate HQ</p>
                  <p className="text-lg font-serif italic">F 1/3 A First Floor, Mohan Garden, Delhi, 110059</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Formal Registry Form */}
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
                  {/* Row 1: Name & Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Full Name</label>
                      <input required name="name" type="text" value={formDataState.name} onChange={handleInputChange} placeholder="John Doe" className="w-full bg-black border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-[#c5a059] transition-colors" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Email Address</label>
                      <input required name="email" type="email" placeholder="john@example.com" className="w-full bg-black border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-[#c5a059] transition-colors" />
                    </div>
                  </div>

                  {/* Row 2: Property Selection */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Select Property</label>
                    <div className="relative">
                      <Building2 size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#c5a059] pointer-events-none" />
                      <select 
                        required 
                        name="property" 
                        value={formDataState.property}
                        onChange={handleInputChange}
                        className="w-full bg-black border border-white/10 p-5 pl-12 rounded-2xl text-white outline-none focus:border-[#c5a059] transition-colors appearance-none cursor-pointer"
                      >
                        <option value="Ethereal Inn - Mohan Garden">Ethereal Inn - Mohan Garden</option>     
                        <option value="Ethereal Inn - Mohan Garden">Ethereal Inn - Matiala Dwarka</option>                    
                        <option value="Ethereal Inn Hospitality LLP">Ethereal Inn Hospitality (Corporate)</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                  </div>

                  {/* Row 3: Subject */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Inquiry Type</label>
                    <div className="relative">
                      <select 
                        name="subject" 
                        value={formDataState.subject}
                        onChange={handleInputChange}
                        className="w-full bg-black border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-[#c5a059] transition-colors appearance-none cursor-pointer"
                      >
                        <option value="Suite Reservation">Suite Reservation</option>
                        <option value="Catering Service">Urban Ambrosia Catering</option>
                        <option value="Event Hosting">Event Hosting</option>
                        <option value="Partnership">Partnership Inquiry</option>
                        <option value="Other">Other Inquiry</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                  </div>

                  {/* Row 4: Message */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Message</label>
                    <textarea 
                      required 
                      name="message" 
                      value={formDataState.message}
                      onChange={handleInputChange}
                      rows={4} 
                      placeholder="Share your requirements..." 
                      className="w-full bg-black border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-[#c5a059] transition-colors resize-none" 
                    />
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
                    className="w-full bg-white text-black h-16 rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-[#c5a059] transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {isPending ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <>
                        <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> 
                        Submit to Registry
                      </>
                    )}
                  </button>
                </motion.form>
              ) : (
                <motion.div 
                  key="success-message"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[#c5a059] text-black p-20 rounded-[3.5rem] text-center space-y-6 shadow-2xl shadow-[#c5a059]/20"
                >
                  <CheckCircle2 size={64} className="mx-auto" />
                  <h2 className="text-4xl font-serif italic">Registry Updated.</h2>
                  <p className="font-bold uppercase tracking-widest text-[10px]">The concierge will reach out via email shortly.</p>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="text-[10px] font-black uppercase tracking-widest border-b-2 border-black pb-1 hover:opacity-60 transition-opacity"
                  >
                    New Inquiry
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