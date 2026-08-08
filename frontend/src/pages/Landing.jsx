import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Cpu, Code2, Monitor, Navigation, MapPin, Activity, ShieldCheck, PlayCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import NetworkScene from '../components/NetworkScene';

export function LandingPage() {
  return (
    <div className="w-full flex flex-col font-sans bg-[#020205] relative overflow-hidden">
      
      {/* 3D Background Layer - Fixed position so it stays while scrolling */}
      <div className="fixed inset-0 z-0">
        <NetworkScene />
      </div>

      {/* 1. HERO SECTION */}
      <section id="hero" className="relative min-h-screen pt-12 pb-24 flex flex-col bg-transparent z-10 pointer-events-none">
        {/* Navigation Bar */}
        <header className="flex justify-between items-center px-8 lg:px-12 w-full max-w-7xl mx-auto pointer-events-auto mt-4">
          <div className="flex items-center gap-3 text-white font-black tracking-tighter text-2xl drop-shadow-md">
            <Navigation className="text-blue-500" size={28} />
            ODOO CARPOOL
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-slate-300 hover:text-white font-bold transition-colors">Log In</Link>
            <Link to="/signup" className="bg-white hover:bg-gray-200 text-black px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg">Get Started</Link>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-7xl mx-auto px-8 lg:px-12 w-full flex flex-col lg:flex-row items-center relative z-20 pointer-events-auto">
            <div className="w-full lg:w-[60%] text-left">
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-[40px] sm:text-[48px] lg:text-[64px] font-[400] tracking-tight leading-[1.2] mb-12 text-white drop-shadow-2xl"
              >
                Ride together.<br/>Safe together.<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 font-bold">
                  Sustainably.
                </span>
              </motion.h1>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex flex-row items-center justify-start gap-4 sm:gap-6 mt-8"
              >
                <Link
                  to="/signup"
                  className="px-8 py-5 text-[16px] font-bold bg-white text-black hover:bg-gray-200 rounded-xl transition-all flex items-center justify-between shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                >
                  Join the Network
                  <div className="bg-black text-white rounded-full p-1 ml-3">
                    <ArrowRight size={16} strokeWidth={3} />
                  </div>
                </Link>
                <button onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })} className="px-8 py-5 text-[16px] font-bold bg-black/40 backdrop-blur-xl text-white hover:bg-white/10 border border-white/20 rounded-xl transition-all flex items-center gap-3">
                  <PlayCircle size={20} /> Learn More
                </button>
              </motion.div>
            </div>
            <div className="flex-1 hidden lg:block"></div>
          </div>
        </div>

        <div className="absolute bottom-12 left-6 right-6 lg:left-12 lg:right-12 flex flex-col lg:flex-row justify-between items-end z-20 pointer-events-none">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
            className="hidden lg:block text-[16px] font-[600] text-gray-200 tracking-wide drop-shadow-md"
          >
            Scroll down to explore
          </motion.div>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
            className="w-full lg:w-auto flex flex-col"
          >
            <div className="text-[15px] sm:text-[18px] text-white lg:text-right text-left max-w-full lg:max-w-[400px] leading-[1.6]">
              Odoo Carpool: The ultimate smart mobility platform designed exclusively for the modern enterprise workforce.
            </div>
          </motion.div>
        </div>
      </section>

      <div className="relative z-20">
        
        {/* 2. VISION SECTION */}
        <section className="py-32 lg:py-48">
          <div className="max-w-7xl mx-auto px-8 lg:px-12">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-xs font-[500] text-blue-400/80 uppercase tracking-widest mb-16 lg:ml-8"
            >
              The Vision
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
              className="text-[36px] md:text-[48px] font-[600] text-white leading-[1.4] tracking-wide max-w-[600px] lg:max-w-[900px] lg:ml-8"
            >
              To empower employees with <em className="font-serif italic font-[400] text-blue-300">cost-effective transit</em> solutions <br/> and <em className="font-serif italic font-[400] text-cyan-300">sustainable enterprise mobility</em>.
            </motion.h2>
          </div>
        </section>

        {/* 3. CAPABILITIES */}
        <section id="services" className="py-16 lg:py-24 bg-[#FAFAFA] text-black rounded-t-[48px] shadow-[0_-20px_60px_rgba(0,0,0,0.5)] relative z-20">
          <div className="max-w-7xl mx-auto px-8 lg:px-12">
            
            <div className="flex flex-col lg:flex-row justify-between items-start gap-16 mb-24">
              <div className="lg:w-[65%]">
                <div className="text-sm font-extrabold text-blue-600 uppercase tracking-widest mb-16">Core Features</div>
                <h2 className="text-[36px] lg:text-[48px] font-[300] leading-[1.3] tracking-tight">
                  We engineer resilient ride-sharing for the modern enterprise.
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { icon: MapPin, title: "Intelligent Ride Matching", desc: "Our algorithm automatically pairs you with verified colleagues sharing similar routes and schedules for maximum efficiency." },
                { icon: Activity, title: "Live Trip Tracking", desc: "Monitor your journey with real-time GPS tracking, precise ETA calculations, and instant in-app communication." },
                { icon: ShieldCheck, title: "Zero-Trust Security", desc: "Enterprise-grade authentication ensures only verified organization members can discover, offer, or book rides." },
                { icon: Monitor, title: "Digital Wallet & Payments", desc: "Seamless, cashless transactions using built-in digital wallets with instant settlements after trip completion." }
              ].map((feat, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="p-12 bg-white rounded-[32px] border border-gray-100 flex flex-col h-full hover:-translate-y-2 transition-all duration-500 cursor-pointer hover:shadow-[0_32px_80px_rgba(0,0,0,0.06)] shadow-[0_24px_64px_rgba(0,0,0,0.02)]"
                >
                  <feat.icon className="w-12 h-12 mb-10 text-black" strokeWidth={2} />
                  <h3 className="text-[24px] font-[600] mb-4 tracking-tight text-black">{feat.title}</h3>
                  <p className="text-gray-500 text-[16px] leading-[1.8] font-[400] max-w-[380px]">{feat.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. OUR PROCESS */}
        <section id="work" className="pt-32 lg:pt-48 pb-16 lg:pb-32 bg-[#FAFAFA] text-black rounded-b-[48px] relative z-20">
          <div className="max-w-7xl mx-auto px-8 lg:px-12">
            <div className="text-[12px] font-[500] text-slate-400 uppercase tracking-[0.25em] mb-24">How it works</div>
            
            <div className="flex flex-col lg:flex-row gap-16 lg:gap-24">
              <h2 className="text-[48px] lg:text-[64px] font-[300] leading-[1.2] tracking-tight lg:w-1/3">The Journey.</h2>
              <div className="lg:w-2/3 flex flex-col gap-6 mt-4 lg:mt-0">
                {[
                  { title: "Authenticate\n&\nProfile", desc: "Log in through your secure enterprise portal and register your profile and vehicle details." },
                  { title: "Find or Offer\n&\nMatch", desc: "Search for available rides matching your route, or publish your own itinerary to offer seats to colleagues." },
                  { title: "Track\n&\nTravel", desc: "Both participants track the trip in real-time. Communicate securely through built-in chat or voice tools." },
                  { title: "Complete\n&\nSettle", desc: "Once the destination is reached, cashless payments are automatically processed via the secure digital wallet." }
                ].map((step, i) => {
                  const isLast = i === 3;
                  return (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
                      className={`w-full min-h-[220px] rounded-[28px] backdrop-blur-xl border p-10 lg:p-12 grid grid-cols-1 md:grid-cols-12 items-center gap-6 lg:gap-8 overflow-hidden ${
                      isLast 
                        ? 'bg-white/85 border-white/30 shadow-[0_8px_32px_rgba(255,255,255,0.05)] text-black' 
                        : 'bg-gradient-to-br from-[#1c1c1c]/95 to-[#141414]/95 border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.3)] text-white'
                    }`}>
                      <div className="md:col-span-6 lg:col-span-5">
                        <h3 className={`text-[28px] lg:text-[32px] font-[600] tracking-tight leading-[1.3] pr-4`}>
                          {step.title.includes('\n') ? (
                            step.title.split('\n').map((line, idx) => (
                              <div key={idx} className={line === '&' ? "text-center opacity-30 text-[28px] my-1 font-light" : ""}>{line}</div>
                            ))
                          ) : step.title}
                        </h3>
                      </div>
                      <div className="md:col-span-6 lg:col-span-7 flex lg:pl-6">
                        <p className={`text-[18px] lg:text-[20px] leading-[1.6] font-[400] max-w-[340px] ${isLast ? 'text-gray-800' : 'text-white/70'}`}>
                          {step.desc}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* 5. KEY VALUES (Floating Cards) */}
        <section className="pt-16 lg:pt-32 pb-32 lg:pb-48 bg-transparent relative">
          <div className="max-w-7xl mx-auto px-8 lg:px-12 flex flex-col lg:flex-row gap-16 lg:gap-24 items-center">
            {/* Left Side */}
            <div className="lg:w-[40%] flex flex-col items-start z-20">
              <div className="text-[16px] font-[600] text-gray-500 uppercase tracking-widest mb-12">
                Key Values
              </div>
              <h2 className="text-[36px] lg:text-[48px] font-[700] text-white leading-[1.2] tracking-tight mb-10">
                We commute with purpose.
              </h2>
              <p className="text-[16px] lg:text-[18px] text-white/70 leading-[1.9] mb-12 max-w-md">
                Odoo Carpool is a community-driven initiative focused on sustainability, security, and enterprise efficiency. We value shared resources, zero carbon footprints, and bringing the workforce closer together.
              </p>
            </div>

            {/* Right Side: Floating Staggered Cards */}
            <div className="lg:w-[60%] grid grid-cols-1 md:grid-cols-2 gap-6 relative z-20">
              <div className="flex flex-col gap-6 mt-0">
                {[
                  { val: "100%", label: "Verified", desc: "Every user is an authenticated employee of a registered organization." },
                  { val: "Eco", label: "Friendly", desc: "Significantly reducing carbon emissions and traffic congestion daily." }
                ].map((card, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.2 }} className="relative">
                    <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 3 + i, ease: "easeInOut" }} className="group bg-[rgba(30,34,42,0.82)] backdrop-blur-[18px] border border-white/5 rounded-[26px] p-8 shadow-lg hover:-translate-y-2 hover:border-white/20 transition-all duration-300 min-h-[260px] flex flex-col justify-between">
                      <div className="relative z-10">
                        <div className="text-[40px] lg:text-[48px] font-[700] text-white leading-none tracking-tight mb-4">{card.val}</div>
                        <div className="text-[16px] font-[600] text-blue-400 mb-8">{card.label}</div>
                      </div>
                      <p className="text-[16px] text-white/70 leading-[1.7]">{card.desc}</p>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
              <div className="flex flex-col gap-6 md:mt-16 lg:mt-24">
                {[
                  { val: "Zero", label: "Surges", desc: "Transparent, predictable, and fair wallet-based settlements." },
                  { val: "Live", label: "Tracking", desc: "Complete visibility and safety throughout the entire journey." }
                ].map((card, i) => (
                  <motion.div key={i+2} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: (i * 0.2) + 0.1 }} className="relative">
                    <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 4 + i, ease: "easeInOut" }} className="group bg-[rgba(30,34,42,0.82)] backdrop-blur-[18px] border border-white/5 rounded-[26px] p-8 shadow-lg hover:-translate-y-2 hover:border-white/20 transition-all duration-300 min-h-[260px] flex flex-col justify-between">
                      <div className="relative z-10">
                        <div className="text-[40px] lg:text-[48px] font-[700] text-white leading-none tracking-tight mb-4">{card.val}</div>
                        <div className="text-[16px] font-[600] text-blue-400 mb-8">{card.label}</div>
                      </div>
                      <p className="text-[16px] text-white/70 leading-[1.7]">{card.desc}</p>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 6. CTA & FOOTER */}
        <section id="contact" className="py-32 lg:py-48 bg-transparent text-white z-10 relative flex flex-col justify-between">
          <div className="max-w-7xl mx-auto px-8 lg:px-12 w-full text-center flex-1 flex flex-col justify-center items-center mb-32">
            <h2 className="text-[44px] md:text-[64px] font-[300] leading-[1.1] tracking-tight mb-10">
              Start sharing today.
            </h2>
            <p className="text-[18px] lg:text-[20px] text-white/70 max-w-xl mx-auto leading-[1.8] mb-16">
              Join thousands of colleagues reducing their carbon footprint and saving costs on their daily commute.
            </p>
            <Link
              to="/signup"
              className="px-12 py-5 text-[16px] font-bold bg-white text-black hover:bg-gray-200 rounded-full transition-all flex items-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:scale-105"
            >
              Get Started <ArrowRight size={20} strokeWidth={2.5} />
            </Link>
          </div>

          <footer className="max-w-7xl mx-auto px-8 lg:px-12 w-full pt-16 border-t border-white/10 flex flex-col md:flex-row justify-between items-start gap-16">
            <div className="max-w-xs">
              <div className="flex items-center gap-3 text-white font-black tracking-tighter text-xl mb-6">
                <Navigation className="text-blue-500" size={24} />
                ODOO CARPOOL
              </div>
              <p className="text-gray-400 text-[15px] leading-relaxed mb-6">
                The enterprise standard for sustainable commuting.
              </p>
            </div>

            <div className="flex gap-24">
              <div>
                <h4 className="text-white font-bold text-[16px] mb-6">Platform</h4>
                <ul className="space-y-4 text-gray-400 text-[15px]">
                  <li><Link to="/login" className="hover:text-white transition-colors">Log In</Link></li>
                  <li><Link to="/signup" className="hover:text-white transition-colors">Register</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-bold text-[16px] mb-6">Legal</h4>
                <ul className="space-y-4 text-gray-400 text-[15px]">
                  <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                </ul>
              </div>
            </div>
          </footer>
          <div className="max-w-7xl mx-auto px-8 lg:px-12 w-full text-center text-gray-600 text-sm mt-16 pb-8">
            © 2026 Odoo Carpool Inc. All rights reserved.
          </div>
        </section>
      </div>
    </div>
  );
}
