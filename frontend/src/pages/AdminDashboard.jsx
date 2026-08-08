import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Activity, Users, Settings, LogOut, TrendingUp, Server, Lock } from 'lucide-react';
import NetworkScene from '../components/NetworkScene';

export function AdminDashboard({ onLogout }) {
  return (
    <div className="w-full h-screen bg-[#020205] relative overflow-hidden font-sans flex">
      
      {/* 3D Background Layer - Faded for dashboard */}
      <div className="fixed inset-0 z-0 opacity-30 pointer-events-none">
        <NetworkScene />
      </div>

      {/* Sidebar */}
      <motion.div 
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="w-[280px] bg-[rgba(15,17,21,0.85)] backdrop-blur-[20px] border-r border-white/5 p-8 flex flex-col relative z-20 shadow-[20px_0_60px_rgba(0,0,0,0.5)]"
      >
        <div className="flex items-center gap-3 text-white font-black tracking-tighter text-2xl mb-16 drop-shadow-md">
          <ShieldCheck className="text-blue-500" size={28} />
          ADMIN PRO
        </div>
        <nav className="flex-1 space-y-3">
          <a href="#" className="flex items-center gap-4 bg-white/10 text-white px-5 py-4 rounded-2xl font-[600] tracking-wide border border-white/10 transition-colors shadow-lg"><Activity size={20} /> Overview</a>
          <a href="#" className="flex items-center gap-4 hover:bg-white/5 text-slate-400 hover:text-white px-5 py-4 rounded-2xl transition-colors font-[500]"><Users size={20} /> Users</a>
          <a href="#" className="flex items-center gap-4 hover:bg-white/5 text-slate-400 hover:text-white px-5 py-4 rounded-2xl transition-colors font-[500]"><Settings size={20} /> System Config</a>
        </nav>
        <button onClick={onLogout} className="flex items-center justify-center gap-3 text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 px-5 py-4 rounded-2xl transition-all font-[600] mt-auto w-full">
          <LogOut size={20} /> Sign Out
        </button>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 p-12 overflow-y-auto relative z-10">
        <header className="flex justify-between items-center mb-16">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h2 className="text-[40px] font-[300] tracking-tight text-white mb-2 drop-shadow-md">System Overview</h2>
            <p className="text-[16px] text-slate-400 font-[400]">Live metrics and administrative controls</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 p-[2px] shadow-lg shadow-blue-500/20 cursor-pointer hover:scale-105 transition-transform">
              <div className="w-full h-full bg-black rounded-full flex items-center justify-center font-bold text-lg text-white">A</div>
            </div>
          </motion.div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {[
            { label: "Total Users", val: "24,592", sub: "+12% this week", subIcon: TrendingUp, color: "text-blue-400" },
            { label: "Active Rides", val: "1,204", sub: "Live right now", subIcon: Activity, color: "text-purple-400" }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-[rgba(30,34,42,0.6)] backdrop-blur-[18px] border border-white/5 rounded-[32px] p-8 shadow-lg hover:-translate-y-2 hover:border-white/20 transition-all duration-400 flex flex-col justify-between h-[200px]"
            >
              <p className="text-slate-400 text-[15px] font-[600] tracking-wider uppercase mb-2">{stat.label}</p>
              <h3 className="text-[56px] font-[700] tracking-tighter text-white leading-none drop-shadow-md">{stat.val}</h3>
              <div className={`flex items-center gap-2 ${stat.color} text-[15px] font-[500] mt-4`}><stat.subIcon size={18} /> {stat.sub}</div>
            </motion.div>
          ))}
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-gradient-to-br from-indigo-900/40 to-blue-900/40 backdrop-blur-[18px] border border-blue-500/20 rounded-[32px] p-8 shadow-[0_20px_60px_rgba(59,130,246,0.15)] hover:-translate-y-2 transition-all duration-400 relative overflow-hidden flex flex-col justify-between h-[200px]"
          >
            <div className="absolute -right-4 -bottom-4 text-blue-500/10 pointer-events-none"><Server size={140} /></div>
            <p className="text-blue-300/80 text-[15px] font-[600] tracking-wider uppercase mb-2 relative z-10">System Status</p>
            <h3 className="text-[56px] font-[700] tracking-tighter text-white leading-none relative z-10 drop-shadow-md">Healthy</h3>
            <div className="flex items-center gap-2 text-blue-300 text-[15px] font-[500] mt-4 relative z-10">All nodes operational</div>
          </motion.div>
        </div>

        {/* Security Logs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-[rgba(30,34,42,0.6)] backdrop-blur-[18px] border border-white/5 rounded-[32px] p-10 shadow-lg"
        >
          <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
            <h3 className="text-[24px] font-[600] tracking-tight text-white">Recent Security Logs</h3>
            <button className="text-sm font-[600] text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest">View All</button>
          </div>
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between py-4 px-6 hover:bg-white/5 rounded-2xl transition-colors group cursor-pointer">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-[16px] bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 group-hover:text-blue-400 group-hover:border-blue-500/30 transition-all"><Lock size={20} /></div>
                  <div>
                    <p className="text-[16px] text-white font-[600] mb-1">New admin login detected</p>
                    <p className="text-[14px] text-slate-500 font-[400]">Source IP: 192.168.1.{i * 24} • Device: MacOS</p>
                  </div>
                </div>
                <span className="text-slate-500 text-[14px] font-[500]">{i * 2} mins ago</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
