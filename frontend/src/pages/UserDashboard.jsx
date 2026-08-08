import React from 'react';
import { motion } from 'framer-motion';
import { Navigation, LogOut, MapPin, Briefcase, User } from 'lucide-react';
import NetworkScene from '../components/NetworkScene';

export function UserDashboard({ onLogout }) {
  return (
    <div className="w-full h-screen bg-[#020205] relative overflow-y-auto overflow-x-hidden font-sans text-slate-200">
      
      {/* 3D Background Layer - Faded for dashboard */}
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
        <NetworkScene />
      </div>

      <div className="max-w-7xl mx-auto px-8 lg:px-12 py-8 relative z-10">
        
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="flex justify-between items-center mb-16 bg-[rgba(30,34,42,0.6)] border border-white/10 px-8 py-5 rounded-[28px] backdrop-blur-[20px] shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
        >
          <div className="flex items-center gap-3 text-white font-black tracking-tighter text-2xl drop-shadow-md">
            <Navigation className="text-blue-500" size={28} />
            ODOO CARPOOL
          </div>
          <div className="flex items-center gap-6">
            <span className="text-slate-300 font-[500] text-[16px] hidden sm:block">Welcome back, Traveler</span>
            <div className="h-10 w-px bg-white/10 hidden sm:block"></div>
            <button onClick={onLogout} className="flex items-center gap-2 bg-white/5 hover:bg-red-500/20 border border-white/5 hover:border-red-500/30 text-white hover:text-red-400 px-6 py-3 rounded-xl transition-all font-[600] text-[15px] shadow-sm">
              <LogOut size={18} /> Sign Out
            </button>
          </div>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Main Column */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Search Rides Hero Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-gradient-to-br from-indigo-900/60 to-blue-900/60 backdrop-blur-[24px] rounded-[36px] p-10 lg:p-14 text-white border border-blue-400/20 shadow-[0_32px_80px_rgba(59,130,246,0.15)] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/30 rounded-full blur-[100px] pointer-events-none translate-x-1/3 -translate-y-1/3" />
              
              <div className="relative z-10">
                <h2 className="text-[44px] lg:text-[56px] font-[300] tracking-tighter leading-[1.1] mb-6 drop-shadow-md">Where to next?</h2>
                <p className="text-blue-100 text-[18px] lg:text-[20px] mb-12 max-w-lg font-[400] leading-[1.6]">Find a colleague heading your way and share the journey today. Reduce costs and emissions.</p>
                
                <div className="flex flex-col sm:flex-row bg-[rgba(10,12,18,0.7)] p-3 rounded-[24px] backdrop-blur-xl border border-white/10 shadow-inner">
                  <div className="flex items-center px-5 py-3 sm:py-0"><MapPin size={24} className="text-blue-400" /></div>
                  <input type="text" placeholder="Enter your destination..." className="bg-transparent flex-1 focus:outline-none text-white placeholder:text-blue-200/50 py-4 px-2 text-[18px] font-[500]" />
                  <button className="bg-white text-black hover:bg-gray-200 px-8 py-4 rounded-[18px] font-[700] text-[16px] transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] mt-2 sm:mt-0">Search Rides</button>
                </div>
              </div>
            </motion.div>

            <motion.h3 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="text-[28px] font-[300] tracking-tight text-white mt-12 mb-6"
            >
              Upcoming Trips
            </motion.h3>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-[rgba(30,34,42,0.6)] backdrop-blur-[18px] border border-white/5 rounded-[36px] p-4 shadow-lg"
            >
              <div className="bg-white/5 rounded-[28px] p-8 flex flex-col sm:flex-row sm:items-center justify-between border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all cursor-pointer group">
                <div className="flex items-center gap-8 mb-6 sm:mb-0">
                  <div className="w-20 h-20 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-[24px] flex items-center justify-center font-bold shadow-inner group-hover:scale-105 transition-transform duration-500">
                    <Briefcase size={32} />
                  </div>
                  <div>
                    <h4 className="text-[24px] font-[600] tracking-tight text-white mb-2">Home → Office</h4>
                    <p className="text-slate-400 text-[16px] flex items-center gap-2 font-[500]"><User size={16} /> Shared with Sarah M.</p>
                  </div>
                </div>
                <div className="sm:text-right flex sm:block items-center justify-between sm:justify-end border-t border-white/10 sm:border-0 pt-4 sm:pt-0">
                  <div className="text-[32px] font-[700] tracking-tighter text-white">08:30 <span className="text-[20px] font-[500] text-slate-400">AM</span></div>
                  <div className="text-blue-400 font-[600] text-[15px] uppercase tracking-widest mt-1">Tomorrow</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-4 space-y-8">
             <motion.div 
               initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
               className="bg-[rgba(30,34,42,0.6)] backdrop-blur-[18px] border border-white/5 rounded-[36px] p-10 shadow-lg sticky top-8"
             >
               <h3 className="text-[28px] font-[300] tracking-tight text-white mb-10 border-b border-white/10 pb-6">Your Impact</h3>
               
               <div className="space-y-10">
                 <div>
                   <div className="flex justify-between items-end mb-4">
                     <span className="text-slate-400 text-[16px] font-[500] uppercase tracking-wider">CO₂ Saved</span>
                     <span className="text-emerald-400 font-[700] text-[28px] leading-none tracking-tight">142<span className="text-[18px] text-emerald-400/60 ml-1 font-[500]">kg</span></span>
                   </div>
                   <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden shadow-inner">
                     <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 w-[70%] rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                   </div>
                 </div>
                 
                 <div>
                   <div className="flex justify-between items-end mb-4">
                     <span className="text-slate-400 text-[16px] font-[500] uppercase tracking-wider">Rides Shared</span>
                     <span className="text-blue-400 font-[700] text-[28px] leading-none tracking-tight">24<span className="text-[18px] text-blue-400/60 ml-1 font-[500]">trips</span></span>
                   </div>
                   <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden shadow-inner">
                     <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 w-[45%] rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                   </div>
                 </div>
               </div>
               
               <div className="mt-12 pt-8 border-t border-white/10 text-center">
                 <p className="text-[15px] text-slate-500 font-[500] leading-[1.6]">You are in the top <span className="text-white font-bold">15%</span> of eco-friendly commuters this month!</p>
               </div>
             </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
