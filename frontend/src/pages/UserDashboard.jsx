import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Navigation, Calendar, Users, MapPin, DollarSign, Clock, ArrowRight, CheckCircle2, AlertCircle, LogOut, Settings, Activity, Map } from 'lucide-react';
import NetworkScene from '../components/NetworkScene';
import TripMap from '../components/TripMap';
import { fetchWithAuth } from '../App';
import { useNavigate } from 'react-router-dom';

const geocodeAddress = async (address) => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
    const data = await res.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    }
  } catch (err) {
    console.error("Geocoding failed for", address, err);
  }
  return { lat: 0.0, lon: 0.0 };
};

export function UserDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' (Offer Ride) | 'network' (Find Ride) | 'settings' | 'sessions'
  const navigate = useNavigate();

  // Decode user ID from token payload to filter out own profile
  const getUserIdFromToken = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const decoded = JSON.parse(jsonPayload);
      return decoded.sub || decoded.user_id || decoded.id || null;
    } catch (e) {
      console.error("Failed to decode token", e);
      return null;
    }
  };

  const currentUserId = getUserIdFromToken();

  // Header Dropdown State
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Modal & Toast States for Status updates
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // { riderId, state: 'ACCEPTED' | 'REJECTED' }
  const [toast, setToast] = useState({ show: false, message: '', loading: false });

  // Account Deletion States
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);

  // Active Offer Details State
  const [activeOffer, setActiveOffer] = useState(null);
  const [isEditingOffer, setIsEditingOffer] = useState(false);

  // Offer Ride Form State
  const [startLoc, setStartLoc] = useState('');
  const [destLoc, setDestLoc] = useState('');
  const [rideDate, setRideDate] = useState('');
  const [seats, setSeats] = useState(3);
  const [price, setPrice] = useState(10);
  const [offerStatus, setOfferStatus] = useState({ type: '', message: '' });
  const [offerLoading, setOfferLoading] = useState(false);

  // Request Ride Form State
  const [reqStartLoc, setReqStartLoc] = useState('');
  const [reqDestLoc, setReqDestLoc] = useState('');
  const [reqRideDate, setReqRideDate] = useState('');
  const [reqSeats, setReqSeats] = useState(1);
  const [reqStatus, setReqStatus] = useState({ type: '', message: '' });
  const [reqLoading, setReqLoading] = useState(false);

  // Dashboard (Offer Ride) Catalog State
  const [dashboardRidersList, setDashboardRidersList] = useState([]);
  const [dashboardRidersLoading, setDashboardRidersLoading] = useState(false);
  const [dashboardRidersError, setDashboardRidersError] = useState(null);
  
  // Dashboard (Offer Ride) Pagination State
  const [dashboardRidersPage, setDashboardRidersPage] = useState(1);
  const [dashboardRidersTotalPages, setDashboardRidersTotalPages] = useState(1);
  const [dashboardTotalRidersCount, setDashboardTotalRidersCount] = useState(0);

  // Network (Find Ride) Own Requests State
  const [networkRidersList, setNetworkRidersList] = useState([]);
  const [networkRidersLoading, setNetworkRidersLoading] = useState(false);
  const [networkRidersError, setNetworkRidersError] = useState(null);
  
  const ridersLimit = 6;

  // Retrieve current active offer if exists on mount
  const checkActiveOffer = async () => {
    try {
      const res = await fetchWithAuth('/user/getinfoforoffers', { method: 'GET' }, navigate);
      if (res.ok) {
        const data = await res.json();
        setActiveOffer(data);
        // Pre-populate form states
        setStartLoc(data.start_location || '');
        setDestLoc(data.end_destination || '');
        if (data.date_time) {
          const dateObj = new Date(data.date_time);
          // Convert date to local format YYYY-MM-DDTHH:MM for input element
          const offset = dateObj.getTimezoneOffset();
          const localDate = new Date(dateObj.getTime() - offset * 60 * 1000);
          setRideDate(localDate.toISOString().slice(0, 16));
        }
        setSeats(data.available_seats || 3);
        setPrice(data.cost_per_seat || 10);
      } else {
        setActiveOffer(null);
      }
    } catch (err) {
      console.error("checkActiveOffer error:", err);
      setActiveOffer(null);
    }
  };

  const handleOfferRideSubmit = async (e) => {
    e.preventDefault();
    setOfferLoading(true);
    setOfferStatus({ type: '', message: '' });

    try {
      const startCoords = await geocodeAddress(startLoc);
      const destCoords = await geocodeAddress(destLoc);

      const payload = {
        start_location: startLoc,
        end_destination: destLoc,
        start_lat: startCoords.lat,
        start_lon: startCoords.lon,
        dest_lat: destCoords.lat,
        dest_lon: destCoords.lon,
        date_time: new Date(rideDate).toISOString(),
        available_seats: parseInt(seats),
        cost_per_seat: parseFloat(price)
      };

      const res = await fetchWithAuth(
        `/user/offerride`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        },
        navigate
      );

      const rawText = await res.text();
      if (!res.ok) {
        let errMsg = `Failed to log ride offer (Status: ${res.status})`;
        try {
          const errData = JSON.parse(rawText);
          if (errData && errData.detail) errMsg = errData.detail;
        } catch (_) {}
        throw new Error(errMsg);
      }

      const data = JSON.parse(rawText);
      setOfferStatus({ type: 'success', message: data.status || 'Ride offer updated successfully!' });
      setIsEditingOffer(false);
      checkActiveOffer();
    } catch (err) {
      setOfferStatus({ type: 'error', message: err.message });
    } finally {
      setOfferLoading(false);
    }
  };

  const handleFindRideSubmit = async (e) => {
    e.preventDefault();
    setReqLoading(true);
    setReqStatus({ type: '', message: '' });

    try {
      const startCoords = await geocodeAddress(reqStartLoc);
      const destCoords = await geocodeAddress(reqDestLoc);

      const payload = {
        start_location: reqStartLoc,
        end_destination: reqDestLoc,
        start_lat: startCoords.lat,
        start_lon: startCoords.lon,
        dest_lat: destCoords.lat,
        dest_lon: destCoords.lon,
        date_time: new Date(reqRideDate).toISOString(),
        no_of_seats: parseInt(reqSeats),
        status: 'pending'
      };

      const res = await fetchWithAuth(
        `/user/findride`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        },
        navigate
      );

      const rawText = await res.text();
      if (!res.ok) {
        let errMsg = `Failed to log ride request (Status: ${res.status})`;
        try {
          const errData = JSON.parse(rawText);
          if (errData && errData.detail) errMsg = errData.detail;
        } catch (_) {}
        throw new Error(errMsg);
      }

      const data = JSON.parse(rawText);
      setReqStatus({ type: 'success', message: data.status || 'Ride request logged successfully!' });
      
      // Reset form fields
      setReqStartLoc('');
      setReqDestLoc('');
      setReqRideDate('');
      setReqSeats(1);

      fetchDashboardRiders();
      fetchOwnRequests();
    } catch (err) {
      setReqStatus({ type: 'error', message: err.message });
    } finally {
      setReqLoading(false);
    }
  };

  const fetchDashboardRiders = async () => {
    setDashboardRidersLoading(true);
    setDashboardRidersError(null);
    try {
      const res = await fetchWithAuth(
        `/user/show_riders?page=${dashboardRidersPage}&limit=${ridersLimit}`,
        { method: 'GET' },
        navigate
      );

      const rawText = await res.text();
      if (!res.ok) {
        let errMsg = `Failed to fetch seekers (Status: ${res.status})`;
        try {
          const errData = JSON.parse(rawText);
          if (errData && errData.detail) errMsg = errData.detail;
        } catch (_) {}
        throw new Error(errMsg);
      }

      const data = JSON.parse(rawText);
      setDashboardRidersList(data.riders || []);
      setDashboardTotalRidersCount(data.total || 0);
      setDashboardRidersTotalPages(Math.ceil((data.total || 0) / ridersLimit) || 1);
    } catch (err) {
      setDashboardRidersError(err.message);
    } finally {
      setDashboardRidersLoading(false);
    }
  };

  const fetchOwnRequests = async () => {
    setNetworkRidersLoading(true);
    setNetworkRidersError(null);
    try {
      const res = await fetchWithAuth(
        `/user/getinfoforriders`,
        { method: 'GET' },
        navigate
      );

      const rawText = await res.text();
      if (!res.ok) {
        let errMsg = `Failed to fetch own requests (Status: ${res.status})`;
        try {
          const errData = JSON.parse(rawText);
          if (errData && errData.detail) errMsg = errData.detail;
        } catch (_) {}
        throw new Error(errMsg);
      }

      const data = JSON.parse(rawText);
      setNetworkRidersList(data || []);
    } catch (err) {
      setNetworkRidersError(err.message);
    } finally {
      setNetworkRidersLoading(false);
    }
  };

  const confirmUpdateStatus = async () => {
    if (!confirmAction) return;
    const { riderId, state } = confirmAction;
    setShowConfirmModal(false);
    setConfirmAction(null);

    setToast({ show: true, message: `Processing ${state.toLowerCase()}...`, loading: true });

    try {
      const res = await fetchWithAuth(
        `/user/status/${riderId}?change_state=${state}`,
        { method: 'PUT' },
        navigate
      );

      const rawText = await res.text();
      if (!res.ok) {
        let errMsg = `Failed to update status (Status: ${res.status})`;
        try {
          const errData = JSON.parse(rawText);
          if (errData && errData.detail) errMsg = errData.detail;
        } catch (_) {}
        throw new Error(errMsg);
      }
      
      setToast({ show: true, message: `Request ${state.toLowerCase()} successfully!`, loading: false });
      fetchDashboardRiders();
      fetchOwnRequests();
    } catch (err) {
      setToast({ show: true, message: err.message, loading: false });
    } finally {
      setTimeout(() => {
        setToast({ show: false, message: '', loading: false });
      }, 2000);
    }
  };

  const handleDeleteUserAccount = async () => {
    setConfirmDeleteAccount(false);
    setToast({ show: true, message: 'Deleting account...', loading: true });

    try {
      const res = await fetchWithAuth(
        `/user/delete`,
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
      
      setToast({ show: true, message: 'Account deleted successfully!', loading: false });
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

  useEffect(() => {
    checkActiveOffer();
  }, []);

  useEffect(() => {
    fetchDashboardRiders();
  }, [dashboardRidersPage]);

  useEffect(() => {
    fetchOwnRequests();
  }, [activeTab]);

  return (
    <div className="w-full h-screen bg-[#020205] relative overflow-y-auto overflow-x-hidden font-sans text-slate-200">
      
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

      {/* Custom Confirmation Modal */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0f1115] border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl mx-4 text-center relative z-50"
          >
            <h3 className="text-xl font-bold text-white mb-4">Really {confirmAction.state.toLowerCase()}?</h3>
            <p className="text-slate-400 mb-8 text-sm leading-relaxed">
              This will update the rider request status to {confirmAction.state.toLowerCase()} and log the operation details.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmAction(null);
                }}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl py-3 font-semibold text-sm transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={confirmUpdateStatus}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 font-semibold text-sm transition-all cursor-pointer shadow-lg shadow-blue-500/25"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Account Deletion Confirmation Modal */}
      {confirmDeleteAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0f1115] border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl mx-4 text-center relative z-50"
          >
            <h3 className="text-xl font-bold text-white mb-4">Really delete account?</h3>
            <p className="text-slate-400 mb-8 text-sm leading-relaxed">
              This will permanently delete your account and all associated ride requests, offers, and session logs. This action cannot be undone.
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
                onClick={handleDeleteUserAccount}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-xl py-3 font-semibold text-sm transition-all cursor-pointer shadow-lg shadow-red-500/25"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 3D Background Layer - Faded for dashboard */}
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
        <NetworkScene />
      </div>

      <div className="max-w-7xl mx-auto px-8 lg:px-12 py-8 relative z-10">
        
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="flex justify-between items-center mb-10 bg-[rgba(30,34,42,0.6)] border border-white/10 px-8 py-5 rounded-[28px] backdrop-blur-[20px] shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
        >
          <div 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 text-white font-black tracking-tighter text-2xl drop-shadow-md cursor-pointer"
          >
            <Navigation className="text-blue-500" size={28} />
            ODOO CARPOOL
          </div>
          
          <div className="flex items-center gap-6 relative">
            <span className="text-slate-300 font-[500] text-[16px] hidden sm:block">Welcome back, Traveler</span>
            <div className="h-10 w-px bg-white/10 hidden sm:block"></div>
            
            {/* User Profile Avatar Dropdown */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="h-12 w-12 rounded-full p-[2px] bg-gradient-to-tr from-blue-500 to-indigo-500 shadow-md cursor-pointer relative"
            >
              <div className="w-full h-full bg-black rounded-full flex items-center justify-center font-bold text-lg text-white">U</div>
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
                  className="absolute right-0 top-14 w-56 bg-[rgba(15,17,21,0.95)] border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl p-3 z-40 flex flex-col gap-1"
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
        </motion.header>

        {/* Navigation Tabs */}
        {activeTab !== 'settings' && activeTab !== 'sessions' && (
          <div className="flex gap-6 mb-12 border-b border-white/5 pb-4">
            <button 
              onClick={() => setActiveTab('dashboard')} 
              className={`text-lg font-semibold pb-2 transition-all border-b-2 cursor-pointer ${
                activeTab === 'dashboard' ? 'text-white border-blue-500' : 'text-slate-400 border-transparent hover:text-white'
              }`}
            >
              Offer Ride
            </button>
            <button 
              onClick={() => {
                setActiveTab('network');
              }} 
              className={`text-lg font-semibold pb-2 transition-all border-b-2 cursor-pointer ${
                activeTab === 'network' ? 'text-white border-blue-500' : 'text-slate-400 border-transparent hover:text-white'
              }`}
            >
              Find Ride
            </button>
            <button 
              onClick={() => {
                setActiveTab('map');
              }} 
              className={`text-lg font-semibold pb-2 transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
                activeTab === 'map' ? 'text-white border-blue-500' : 'text-slate-400 border-transparent hover:text-white'
              }`}
            >
              <Map size={18} /> Trip Map
            </button>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* Main Column */}
            <div className="lg:col-span-8 space-y-8">

              {/* Ride Requests Section */}
              <motion.h3 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                className="text-[28px] font-[300] tracking-tight text-white mb-6"
              >
                Ride Requests
              </motion.h3>

              {dashboardRidersLoading && dashboardRidersList.length === 0 ? (
                <div className="text-slate-400 font-medium py-6">Loading ride requests...</div>
              ) : dashboardRidersError ? (
                <div className="text-red-400 font-medium py-6">Error: {dashboardRidersError}</div>
              ) : dashboardRidersList.length === 0 ? (
                <div className="text-slate-400 font-medium py-6">No active ride requests.</div>
              ) : (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {dashboardRidersList.map((rider, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 * idx }}
                        className="bg-[rgba(30,34,42,0.5)] border border-white/5 rounded-[24px] p-6 backdrop-blur-[12px] shadow-lg flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-6">
                            <span className={`px-3 py-1 rounded-full text-xs font-[600] tracking-wide uppercase ${
                              rider.status.toLowerCase() === 'accepted' 
                                ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                                : rider.status.toLowerCase() === 'rejected' 
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {rider.status}
                            </span>
                            <span className="text-[14px] text-slate-400 font-[500] flex items-center gap-1">
                              <Users size={14} /> {rider.no_of_seats} seats
                            </span>
                          </div>
                          <div className="space-y-4 mb-6">
                            <div className="flex items-center gap-3">
                              <MapPin size={18} className="text-blue-400 shrink-0" />
                              <span className="text-[15px] font-[500] text-slate-300">{rider.start_location}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <ArrowRight size={18} className="text-slate-600 pl-1 shrink-0" />
                              <span className="text-[15px] font-[500] text-slate-300">{rider.end_destination}</span>
                            </div>
                          </div>
                        </div>
                        <div className="border-t border-white/5 pt-5 mt-auto flex flex-col gap-4">
                          <div className="flex justify-between items-center text-[14px] text-slate-400 font-[500]">
                            <div className="flex items-center gap-2">
                              <Clock size={16} />
                              {new Date(rider.date_time).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <button
                              disabled={rider.status.toLowerCase() !== 'pending'}
                              onClick={() => {
                                setConfirmAction({ riderId: rider.user_id, state: 'REJECTED' });
                                setShowConfirmModal(true);
                              }}
                              className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-30 disabled:pointer-events-none border border-red-500/20 text-red-400 font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                            >
                              Reject
                            </button>
                            <button
                              disabled={rider.status.toLowerCase() !== 'pending'}
                              onClick={() => {
                                setConfirmAction({ riderId: rider.user_id, state: 'ACCEPTED' });
                                setShowConfirmModal(true);
                              }}
                              className="flex-1 py-3 bg-green-500/10 hover:bg-green-500/20 disabled:opacity-30 disabled:pointer-events-none border border-green-500/20 text-green-400 font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                            >
                              Accept
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Pagination Controls for Ride Requests */}
                  {!dashboardRidersLoading && dashboardRidersTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-8 border-t border-white/5 pt-6">
                      <span className="text-slate-400 text-sm">
                        Page <span className="text-white font-semibold">{dashboardRidersPage}</span> of <span className="text-white font-semibold">{dashboardRidersTotalPages}</span> ({dashboardTotalRidersCount} total requests)
                      </span>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => setDashboardRidersPage(p => Math.max(1, p - 1))}
                          disabled={dashboardRidersPage === 1}
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 rounded-xl font-bold text-sm text-white transition-all cursor-pointer"
                        >
                          Previous
                        </button>
                        <button 
                          onClick={() => setDashboardRidersPage(p => Math.min(dashboardRidersTotalPages, p + 1))}
                          disabled={dashboardRidersPage === dashboardRidersTotalPages}
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

            {/* Sidebar Column (Offer Ride Form / Active Offer Details) */}
            <div className="lg:col-span-4">
              <motion.div 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-[rgba(30,34,42,0.5)] backdrop-blur-[24px] border border-white/5 rounded-[32px] p-8 shadow-xl sticky top-8"
              >
                {activeOffer && !isEditingOffer ? (
                  <div>
                    <h3 className="text-2xl font-[350] tracking-tight text-white mb-6">Active Ride Offer</h3>
                    <div className="space-y-5 mb-8 bg-black/40 border border-white/5 p-6 rounded-2xl">
                      <div>
                        <span className="block text-xs font-[600] uppercase tracking-wider text-slate-500 mb-1">From</span>
                        <span className="text-white text-[15px] font-[500]">{activeOffer.start_location}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-[600] uppercase tracking-wider text-slate-500 mb-1">To</span>
                        <span className="text-white text-[15px] font-[500]">{activeOffer.end_destination}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-[600] uppercase tracking-wider text-slate-500 mb-1">Date & Time</span>
                        <span className="text-white text-[15px] font-[500]">
                          {new Date(activeOffer.date_time).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                        <div>
                          <span className="block text-xs font-[600] uppercase tracking-wider text-slate-500 mb-1">Seats</span>
                          <span className="text-white text-[15px] font-[500]">{activeOffer.available_seats}</span>
                        </div>
                        <div>
                          <span className="block text-xs font-[600] uppercase tracking-wider text-slate-500 mb-1">Price</span>
                          <span className="text-white text-[15px] font-[500]">₹{activeOffer.cost_per_seat}</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsEditingOffer(true)}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Edit Offer <ArrowRight size={18} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-2xl font-[350] tracking-tight text-white mb-6">
                      {activeOffer ? 'Edit Ride Offer' : 'Offer a Ride'}
                    </h3>
                    
                    {offerStatus.message && (
                      <div className={`p-4 rounded-xl flex items-start gap-3 mb-6 border ${
                        offerStatus.type === 'success' 
                          ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                          : 'bg-red-500/10 border-red-500/20 text-red-400'
                      }`}>
                        {offerStatus.type === 'success' ? <CheckCircle2 className="shrink-0 mt-0.5" size={18} /> : <AlertCircle className="shrink-0 mt-0.5" size={18} />}
                        <span className="text-sm font-[500] leading-relaxed">{offerStatus.message}</span>
                      </div>
                    )}

                    <form onSubmit={handleOfferRideSubmit} className="space-y-5">
                      <div>
                        <label className="block text-xs font-[600] uppercase tracking-wider text-slate-500 mb-2">From</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><MapPin size={16} className="text-slate-500" /></div>
                          <input 
                            type="text" 
                            value={startLoc} 
                            onChange={(e) => setStartLoc(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-blue-500 transition-all text-white placeholder:text-slate-600 text-[15px]" 
                            placeholder="Start location..." 
                            required 
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-[600] uppercase tracking-wider text-slate-500 mb-2">To</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><MapPin size={16} className="text-slate-400" /></div>
                          <input 
                            type="text" 
                            value={destLoc} 
                            onChange={(e) => setDestLoc(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-blue-500 transition-all text-white placeholder:text-slate-600 text-[15px]" 
                            placeholder="End destination..." 
                            required 
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-[600] uppercase tracking-wider text-slate-500 mb-2">Date & Time</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Calendar size={16} className="text-slate-500" /></div>
                          <input 
                            type="datetime-local" 
                            value={rideDate} 
                            onChange={(e) => setRideDate(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-blue-500 transition-all text-white text-[15px]" 
                            required 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-[600] uppercase tracking-wider text-slate-500 mb-2">Seats</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Users size={16} className="text-slate-500" /></div>
                            <input 
                              type="number" 
                              min="1" 
                              max="8"
                              value={seats} 
                              onChange={(e) => setSeats(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-blue-500 transition-all text-white text-[15px]" 
                              required 
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-[600] uppercase tracking-wider text-slate-500 mb-2">Price (₹)</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><DollarSign size={16} className="text-slate-500" /></div>
                            <input 
                              type="number" 
                              min="0"
                              value={price} 
                              onChange={(e) => setPrice(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-blue-500 transition-all text-white text-[15px]" 
                              required 
                            />
                          </div>
                        </div>
                      </div>

                      <button 
                        type="submit" 
                        disabled={offerLoading} 
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl mt-6 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {offerLoading ? 'Submitting...' : 'Log Offer'} <ArrowRight size={18} />
                      </button>

                      {activeOffer && (
                        <button 
                          type="button"
                          onClick={() => setIsEditingOffer(false)}
                          className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold py-4 rounded-xl mt-3 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </form>
                  </div>
                )}
              </motion.div>
            </div>

          </div>
        )}

        {activeTab === 'network' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* Main Column: Own Ride Requests List */}
            <div className="lg:col-span-8">
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                className="bg-[rgba(30,34,42,0.5)] backdrop-blur-[24px] border border-white/5 rounded-[32px] p-10 shadow-xl"
              >
                <div className="border-b border-white/5 pb-6 mb-8 flex justify-between items-center">
                  <h3 className="text-2xl font-[350] tracking-tight text-white">My Ride Requests</h3>
                  <span className="text-slate-400 text-sm font-semibold">{networkRidersList.length} Active Requests</span>
                </div>

                {networkRidersLoading ? (
                  <div className="text-center py-16 text-slate-400 font-medium">Loading requests...</div>
                ) : networkRidersError ? (
                  <div className="text-center py-16 text-red-400 font-medium">Error: {networkRidersError}</div>
                ) : networkRidersList.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 font-medium">No ride requests found. Submit a request in the sidebar to find rides!</div>
                ) : (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {networkRidersList.map((rider, idx) => (
                        <div 
                          key={idx}
                          className="bg-black/40 border border-white/10 hover:border-blue-500/30 rounded-2xl p-6 transition-all flex flex-col justify-between"
                        >
                          <div className="space-y-4 font-[500]">
                            <div className="flex items-center gap-3">
                              <MapPin size={18} className="text-blue-400 shrink-0" />
                              <span className="text-sm text-slate-300">{rider.start_location}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <ArrowRight size={18} className="text-slate-600 pl-1 shrink-0" />
                              <span className="text-sm text-slate-300">{rider.end_destination}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                              <Users size={16} className="text-slate-500" />
                              <span>{rider.no_of_seats} seats requested</span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center border-t border-white/5 pt-4 mt-6 text-xs text-slate-400 font-[500]">
                            <div className="flex items-center gap-1.5">
                              <Clock size={14} />
                              {new Date(rider.date_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <span className={`px-2.5 py-1 rounded-full font-bold uppercase text-[10px] ${
                              rider.status.toLowerCase() === 'pending' 
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                                : rider.status.toLowerCase() === 'accepted'
                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                              {rider.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Request a Ride Sidebar Form */}
            <div className="lg:col-span-4">
              <motion.div 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-[rgba(30,34,42,0.5)] backdrop-blur-[24px] border border-white/5 rounded-[32px] p-8 shadow-xl sticky top-8"
              >
                <h3 className="text-2xl font-[350] tracking-tight text-white mb-6">Request a Ride</h3>
                
                {reqStatus.message && (
                  <div className={`p-4 rounded-xl flex items-start gap-3 mb-6 border ${
                    reqStatus.type === 'success' 
                      ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                      : 'bg-red-500/10 border-red-500/20 text-red-400'
                  }`}>
                    {reqStatus.type === 'success' ? <CheckCircle2 className="shrink-0 mt-0.5" size={18} /> : <AlertCircle className="shrink-0 mt-0.5" size={18} />}
                    <span className="text-sm font-[500] leading-relaxed">{reqStatus.message}</span>
                  </div>
                )}

                <form onSubmit={handleFindRideSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-[600] uppercase tracking-wider text-slate-500 mb-2">From</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><MapPin size={16} className="text-slate-500" /></div>
                      <input 
                        type="text" 
                        value={reqStartLoc} 
                        onChange={(e) => setReqStartLoc(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-blue-500 transition-all text-white placeholder:text-slate-600 text-[15px]" 
                        placeholder="Start location..." 
                        required 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-[600] uppercase tracking-wider text-slate-500 mb-2">To</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><MapPin size={16} className="text-slate-400" /></div>
                      <input 
                        type="text" 
                        value={reqDestLoc} 
                        onChange={(e) => setReqDestLoc(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-blue-500 transition-all text-white placeholder:text-slate-600 text-[15px]" 
                        placeholder="End destination..." 
                        required 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-[600] uppercase tracking-wider text-slate-500 mb-2">Date & Time</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Calendar size={16} className="text-slate-500" /></div>
                      <input 
                        type="datetime-local" 
                        value={reqRideDate} 
                        onChange={(e) => setReqRideDate(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-blue-500 transition-all text-white text-[15px]" 
                        required 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-[600] uppercase tracking-wider text-slate-500 mb-2">Seats Requested</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Users size={16} className="text-slate-500" /></div>
                      <input 
                        type="number" 
                        min="1" 
                        max="8"
                        value={reqSeats} 
                        onChange={(e) => setReqSeats(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-blue-500 transition-all text-white text-[15px]" 
                        required 
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={reqLoading} 
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl mt-6 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {reqLoading ? 'Submitting...' : 'Find Ride'} <ArrowRight size={18} />
                  </button>
                </form>
              </motion.div>
            </div>

          </div>
        )}

        {activeTab === 'map' && (
          <TripMap navigate={navigate} />
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
            <p className="text-slate-400 max-w-md mx-auto mb-8">Manage your account and profile preferences.</p>
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
