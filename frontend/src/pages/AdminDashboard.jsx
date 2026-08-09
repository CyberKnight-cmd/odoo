import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Activity, Users, Settings, LogOut, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NetworkScene from '../components/NetworkScene';
import { fetchWithAuth } from '../App';

export function AdminDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'settings' | 'sessions'
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState({});
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // Custom Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userIdToDelete, setUserIdToDelete] = useState(null);

  // Admin Account Deletion State
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);

  // Custom Toast State
  const [toast, setToast] = useState({ show: false, message: '', loading: false });

  // Search State
  const [searchVal, setSearchVal] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const limit = 5; // Rows per page
  
  const navigate = useNavigate();

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/admin/getusers?page=${page}&limit=${limit}`;
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }
      console.log(`Calling fetchWithAuth for ${url}`);
      const res = await fetchWithAuth(url, {}, navigate);
      console.log("Response status:", res.status);
      
      const rawText = await res.text();
      if (!res.ok) {
        console.error("Raw response body on error:", rawText);
        let errMsg = `Failed to fetch users (Status: ${res.status})`;
        try {
          const errData = JSON.parse(rawText);
          if (errData && errData.detail) errMsg = errData.detail;
        } catch (_) {}
        throw new Error(errMsg);
      }

      const data = JSON.parse(rawText);
      setUsersList(data.users || []);
      setTotalUsersCount(data.total || 0);
      setTotalPages(Math.ceil((data.total || 0) / limit) || 1);

      // Pre-populate selected roles
      const rolesMap = {};
      (data.users || []).forEach(u => {
        rolesMap[u.user_id] = u.role;
      });
      setSelectedRoles(rolesMap);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, searchQuery]);

  const handleRoleChangeLocal = (userId, newRole) => {
    setSelectedRoles(prev => ({
      ...prev,
      [userId]: newRole
    }));
  };

  const handleSaveRole = async (userId) => {
    const targetRole = selectedRoles[userId];
    if (!targetRole) return;
    
    setToast({ show: true, message: 'Saving role change...', loading: true });

    try {
      const res = await fetchWithAuth(
        `/admin/change/role?user_id=${userId}&user_role=${targetRole}`,
        { method: 'GET' },
        navigate
      );
      
      const rawText = await res.text();
      if (!res.ok) {
        let errMsg = `Failed to save role (Status: ${res.status})`;
        try {
          const errData = JSON.parse(rawText);
          if (errData && errData.detail) errMsg = errData.detail;
        } catch (_) {}
        throw new Error(errMsg);
      }

      setToast({ show: true, message: 'Role saved successfully!', loading: false });
      fetchUsers();
    } catch (err) {
      setToast({ show: true, message: err.message, loading: false });
    } finally {
      setTimeout(() => {
        setToast({ show: false, message: '', loading: false });
      }, 2000);
    }
  };

  const triggerDeleteUser = (userId) => {
    setUserIdToDelete(userId);
    setShowDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!userIdToDelete) return;
    const targetId = userIdToDelete;
    setShowDeleteModal(false);
    setUserIdToDelete(null);

    setToast({ show: true, message: 'Deleting user and assets...', loading: true });

    try {
      const res = await fetchWithAuth(
        `/admin/delete/${targetId}`,
        { method: 'DELETE' },
        navigate
      );

      const rawText = await res.text();
      if (!res.ok) {
        let errMsg = `Failed to delete user (Status: ${res.status})`;
        try {
          const errData = JSON.parse(rawText);
          if (errData && errData.detail) errMsg = errData.detail;
        } catch (_) {}
        throw new Error(errMsg);
      }

      setToast({ show: true, message: 'User deleted successfully!', loading: false });
      // Reset to page 1 to refresh lists cleanly
      setPage(1);
      fetchUsers();
    } catch (err) {
      setToast({ show: true, message: err.message, loading: false });
    } finally {
      setTimeout(() => {
        setToast({ show: false, message: '', loading: false });
      }, 2000);
    }
  };

  const handleDeleteSelfAccount = async () => {
    setConfirmDeleteAccount(false);
    setToast({ show: true, message: 'Deleting admin account...', loading: true });

    try {
      const res = await fetchWithAuth(
        `/admin/delete_self`,
        { method: 'DELETE' },
        navigate
      );

      const rawText = await res.text();
      if (!res.ok) {
        let errMsg = `Failed to delete account (Status: ${res.status})`;
        try {
          const errData = JSON.parse(rawText);
          if (errData && errData.detail) errMsg = errData.detail;
        } catch (_) {}
        throw new Error(errMsg);
      }
      
      setToast({ show: true, message: 'Admin account deleted successfully!', loading: false });
      setTimeout(() => {
        setToast({ show: false, message: '', loading: false });
        onLogout();
      }, 2000);
    } catch (err) {
      setToast({ show: true, message: err.message, loading: false });
      setTimeout(() => {
        setToast({ show: false, message: '', loading: false });
      }, 2000);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearchQuery(searchVal);
  };

  const handleClearSearch = () => {
    setSearchVal('');
    setSearchQuery('');
    setPage(1);
  };

  return (
    <div className="w-full h-screen bg-[#020205] relative overflow-y-auto overflow-x-hidden font-sans text-slate-200 flex">
      
      {/* 3D Background Network Layer */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
        <NetworkScene />
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <motion.div 
          initial={{ opacity: 0, y: -20, x: 20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: -20, x: 20 }}
          className="fixed top-6 right-6 z-50 bg-[rgba(15,17,21,0.95)] border border-white/10 rounded-2xl px-6 py-4 shadow-2xl backdrop-blur-xl flex items-center gap-3"
        >
          {toast.loading ? (
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
          ) : (
            <div className="w-5 h-5 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center shrink-0 text-xs font-bold">✓</div>
          )}
          <span className="text-sm font-semibold text-white">{toast.message}</span>
        </motion.div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0f1115] border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl mx-4 text-center relative z-50"
          >
            <h3 className="text-xl font-bold text-white mb-4">Really delete?</h3>
            <p className="text-slate-400 mb-8 text-sm leading-relaxed">This will permanently remove the user and all their associated data, sessions, rides, and offers.</p>
            <div className="flex gap-4">
              <button 
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserIdToDelete(null);
                }}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl py-3 font-semibold text-sm transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteUser}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-xl py-3 font-semibold text-sm transition-all cursor-pointer shadow-lg shadow-red-500/25"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Admin Account Deletion Confirmation Modal */}
      {confirmDeleteAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0f1115] border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl mx-4 text-center relative z-50"
          >
            <h3 className="text-xl font-bold text-white mb-4">Really delete admin account?</h3>
            <p className="text-slate-400 mb-8 text-sm leading-relaxed">
              This will permanently delete your administrator account and all associated data, active rides, offers, and session logs. This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => {
                  setConfirmDeleteAccount(false);
                }}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl py-3 font-semibold text-sm transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteSelfAccount}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-xl py-3 font-semibold text-sm transition-all cursor-pointer shadow-lg shadow-red-500/25"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Sidebar */}
      <motion.div 
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="w-[280px] bg-[rgba(15,17,21,0.85)] backdrop-blur-[20px] border-r border-white/5 p-8 flex flex-col relative z-20 shadow-[20px_0_60px_rgba(0,0,0,0.5)]"
      >
        <div 
          onClick={() => {
            setActiveTab('overview');
            setPage(1);
          }}
          className="flex items-center gap-3 text-white font-black tracking-tighter text-2xl mb-12 cursor-pointer select-none"
        >
          <ShieldCheck className="text-blue-500" size={32} />
          ADMIN PRO
        </div>
        
        <div className="flex flex-col gap-2">
          <button 
            onClick={() => {
              setActiveTab('overview');
              setPage(1);
            }}
            className={`flex items-center gap-3 w-full text-left px-5 py-4 rounded-2xl transition-all font-semibold text-sm cursor-pointer ${
              activeTab === 'overview' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users size={20} /> Registered Users
          </button>
          
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-3 w-full text-left px-5 py-4 rounded-2xl transition-all font-semibold text-sm cursor-pointer ${
              activeTab === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings size={20} /> System Config
          </button>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 px-12 py-8 relative z-10 flex flex-col">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-10 bg-[rgba(30,34,42,0.4)] border border-white/5 px-8 py-4 rounded-2xl backdrop-blur-md relative"
        >
          <h2 className="text-xl font-bold tracking-tight text-white capitalize">
            {activeTab === 'overview' && 'Registered Members'}
            {activeTab === 'settings' && 'System Settings'}
            {activeTab === 'sessions' && 'Active Sessions'}
          </h2>
          <div className="flex items-center gap-4 relative">
            <span className="text-sm font-semibold text-slate-400">Admin Control Console</span>
            <div className="h-6 w-px bg-white/10"></div>
            
            {/* Admin Avatar Circle */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="h-10 w-10 rounded-full p-[2px] bg-gradient-to-tr from-blue-500 to-indigo-500 shadow-md cursor-pointer relative"
            >
              <div className="w-full h-full bg-black rounded-full flex items-center justify-center font-bold text-lg text-white">A</div>
            </motion.div>

            {showProfileMenu && (
              <>
                {/* Backdrop overlay to close menu on outside click */}
                <div 
                  className="fixed inset-0 z-30 bg-transparent" 
                  onClick={() => setShowProfileMenu(false)}
                />
                
                {/* Dropdown Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 top-12 w-56 bg-[rgba(15,17,21,0.95)] border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl p-3 z-40 flex flex-col gap-1"
                >
                  <button 
                    onClick={() => {
                      setActiveTab('settings');
                      setShowProfileMenu(false);
                    }}
                    className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition-all font-semibold text-sm cursor-pointer ${
                      activeTab === 'settings' ? 'bg-white/10 text-white' : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Settings size={16} /> Settings
                  </button>
                  <button 
                    onClick={() => {
                      setActiveTab('sessions');
                      setShowProfileMenu(false);
                    }}
                    className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition-all font-semibold text-sm cursor-pointer ${
                      activeTab === 'sessions' ? 'bg-white/10 text-white' : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Activity size={16} /> Sessions
                  </button>
                  <div className="h-px bg-white/10 my-1" />
                  <button 
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout();
                    }}
                    className="flex items-center gap-3 w-full text-left px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all font-semibold text-sm cursor-pointer"
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </motion.div>
              </>
            )}
          </div>
        </motion.div>

        {activeTab === 'overview' && (
          <div className="flex-1 flex flex-col">
            
            {/* Search and Metadata Controls */}
            <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
              <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-md">
                <input 
                  type="text"
                  placeholder="Search by name, email, or phone number..."
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-500"
                />
                {searchVal && (
                  <button 
                    type="button" 
                    onClick={handleClearSearch}
                    className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs font-semibold px-2 py-1 bg-white/5 rounded-md transition-all cursor-pointer"
                  >
                    Clear
                  </button>
                )}
                <button 
                  type="submit" 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-400 text-sm font-bold cursor-pointer"
                >
                  Go
                </button>
              </form>

              <span className="text-slate-400 text-sm font-semibold shrink-0">
                {totalUsersCount} Total Members Registered
              </span>
            </div>

            {/* Users list rendering */}
            {loading && usersList.length === 0 ? (
              <div className="text-slate-400 text-center py-20 font-semibold">Loading users...</div>
            ) : error ? (
              <div className="text-red-400 text-center py-20 font-semibold">Error: {error}</div>
            ) : usersList.length === 0 ? (
              <div className="text-slate-400 text-center py-20 font-semibold">No registered users found.</div>
            ) : (
              <div className="flex-1 flex flex-col justify-between">
                <div className="grid grid-cols-1 gap-4">
                  {usersList.map((user, idx) => (
                    <motion.div 
                      key={user.user_id}
                      initial={{ opacity: 0, y: 15 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ duration: 0.4, delay: 0.05 * idx }}
                      className="bg-[rgba(30,34,42,0.5)] border border-white/5 rounded-[24px] p-6 backdrop-blur-[12px] flex items-center justify-between shadow-md"
                    >
                      <div className="flex items-center gap-6">
                        {/* Static Avatar */}
                        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-inner">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-lg font-bold text-white leading-tight">{user.name}</h3>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-400 text-xs">
                            <span>Email: <strong className="text-slate-300 font-semibold">{user.email}</strong></span>
                            <span>Phone: <strong className="text-slate-300 font-semibold">{user.phone_number}</strong></span>
                            <span>ID: <code className="text-blue-400 bg-blue-500/5 px-1.5 py-0.5 rounded border border-blue-500/10">{user.user_id}</code></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        {/* Role selection controls */}
                        <div className="flex items-center gap-3">
                          <select 
                            value={selectedRoles[user.user_id] || user.role}
                            onChange={(e) => handleRoleChangeLocal(user.user_id, e.target.value)}
                            className="bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-300 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                          >
                            <option value="USER" className="bg-[#0f1115] text-slate-300">USER</option>
                            <option value="ADMIN" className="bg-[#0f1115] text-slate-300">ADMIN</option>
                          </select>
                          
                          {selectedRoles[user.user_id] !== user.role && (
                            <button 
                              onClick={() => handleSaveRole(user.user_id)}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                            >
                              Save
                            </button>
                          )}
                        </div>

                        {/* Delete action button */}
                        <button 
                          onClick={() => triggerDeleteUser(user.user_id)}
                          className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 font-bold rounded-xl text-xs transition-all cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-8 border-t border-white/5 pt-6">
                    <span className="text-slate-400 text-sm">
                      Page <span className="text-white font-semibold">{page}</span> of <span className="text-white font-semibold">{totalPages}</span> ({totalUsersCount} users)
                    </span>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 rounded-xl font-bold text-sm text-white transition-all cursor-pointer"
                      >
                        Previous
                      </button>
                      <button 
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 rounded-xl font-bold text-sm text-white transition-all cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
            className="bg-[rgba(30,34,42,0.6)] backdrop-blur-[18px] border border-white/5 rounded-[32px] p-12 shadow-lg text-center"
          >
            <Settings size={48} className="text-slate-500 mx-auto mb-6" />
            <h3 className="text-2xl font-[600] text-white mb-2">Settings</h3>
            <p className="text-slate-400 max-w-md mx-auto mb-8">Manage your administrator account and dashboard preferences.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-sm mx-auto">
              <button 
                onClick={onLogout}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl py-4 font-semibold text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <LogOut size={16} /> Sign Out
              </button>
              <button 
                onClick={() => setConfirmDeleteAccount(true)}
                className="flex-1 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 rounded-xl py-4 font-semibold text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                Delete Account
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'sessions' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
            className="bg-[rgba(30,34,42,0.6)] backdrop-blur-[18px] border border-white/5 rounded-[32px] p-12 shadow-lg text-center"
          >
            <Activity size={48} className="text-slate-500 mx-auto mb-6" />
            <h3 className="text-2xl font-[600] text-white mb-2">Active Sessions</h3>
            <p className="text-slate-400 max-w-md mx-auto">This page is currently empty. Session management and activity logs will be shown here.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
