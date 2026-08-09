import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { fetchWithAuth } from '../App';
import { motion } from 'framer-motion';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
mapboxgl.accessToken = MAPBOX_TOKEN;

export default function TripMap({ navigate }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [offer, setOffer] = useState(null);
  const [riders, setRiders] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const offerRes = await fetchWithAuth('/user/getinfoforoffers', { method: 'GET' }, navigate);
        if (!offerRes.ok) {
          setLoading(false);
          return;
        }
        const offerData = await offerRes.json();
        if (offerData && Object.keys(offerData).length > 0) {
            setOffer(offerData);
        } else {
            setLoading(false);
            return;
        }

        const ridersRes = await fetchWithAuth('/user/show_riders?page=1&limit=20', { method: 'GET' }, navigate);
        if (ridersRes.ok) {
          const ridersData = await ridersRes.json();
          const sortedRiders = (ridersData.riders || []).sort((a, b) => b.match_score - a.match_score);
          setRiders(sortedRiders);
        }
      } catch (err) {
        console.error("Map data fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [navigate]);

  useEffect(() => {
    if (loading) return;

    if (!map.current && mapContainer.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [78.9629, 20.5937],
        zoom: 4,
        attributionControl: false
      });
      map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    }

    if (offer && offer.start_lon && offer.start_lat && offer.dest_lon && offer.dest_lat && map.current) {
      const { start_lon, start_lat, dest_lon, dest_lat } = offer;
      
      const bounds = new mapboxgl.LngLatBounds()
        .extend([start_lon, start_lat])
        .extend([dest_lon, dest_lat]);
        
      riders.forEach(r => {
        if (r.start_lon && r.start_lat) {
          bounds.extend([r.start_lon, r.start_lat]);
        }
      });

      map.current.fitBounds(bounds, { padding: 50 });

      const elStart = document.createElement('div');
      elStart.className = 'w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-[0_0_10px_rgba(34,197,94,0.8)]';
      new mapboxgl.Marker(elStart)
        .setLngLat([start_lon, start_lat])
        .addTo(map.current);

      const elEnd = document.createElement('div');
      elEnd.className = 'w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-[0_0_10px_rgba(239,68,68,0.8)]';
      new mapboxgl.Marker(elEnd)
        .setLngLat([dest_lon, dest_lat])
        .addTo(map.current);

      riders.forEach(rider => {
        if (rider.start_lon && rider.start_lat) {
          const elRider = document.createElement('div');
          elRider.className = 'w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-[0_0_10px_rgba(59,130,246,0.8)] cursor-pointer';
          
          const popupContent = `
            <div class="text-slate-800 p-2 min-w-[200px]">
              <strong class="block text-sm mb-2 text-blue-600">Passenger Match</strong>
              <div class="text-xs space-y-1.5 font-medium">
                <div><b class="text-slate-500">From:</b> ${rider.start_location}</div>
                <div><b class="text-slate-500">To:</b> ${rider.end_destination}</div>
                <div><b class="text-slate-500">Seats:</b> ${rider.no_of_seats}</div>
                <div><b class="text-slate-500">Match:</b> ${rider.match_score}%</div>
                <div><b class="text-slate-500">Pickup Dist:</b> ${rider.pickup_distance_km}km</div>
              </div>
            </div>
          `;
          
          const popup = new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(popupContent);
          
          new mapboxgl.Marker(elRider)
            .setLngLat([rider.start_lon, rider.start_lat])
            .setPopup(popup)
            .addTo(map.current);
        }
      });

      const drawRoute = async () => {
        try {
          const query = await fetch(
            `https://api.mapbox.com/directions/v5/mapbox/driving/${start_lon},${start_lat};${dest_lon},${dest_lat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
          );
          const json = await query.json();
          if (json.routes && json.routes.length > 0) {
              const data = json.routes[0];
              const route = data.geometry;

              if (map.current.getSource('route')) {
                map.current.getSource('route').setData(route);
              } else {
                map.current.addLayer({
                  id: 'route',
                  type: 'line',
                  source: {
                    type: 'geojson',
                    data: route
                  },
                  layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                  },
                  paint: {
                    'line-color': '#3b82f6',
                    'line-width': 5,
                    'line-opacity': 0.75
                  }
                });
              }
          }
        } catch (err) {
          console.error("Failed to fetch directions", err);
        }
      };

      if (map.current.isStyleLoaded()) {
          drawRoute();
      } else {
          map.current.on('load', drawRoute);
      }
    }
  }, [loading, offer, riders]);

  if (loading) {
    return <div className="text-slate-400 p-8 flex justify-center"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5 }}
      className="bg-[rgba(30,34,42,0.5)] backdrop-blur-[24px] border border-white/5 rounded-[32px] p-6 shadow-xl h-[80vh] flex flex-col lg:flex-row gap-6"
    >
      {!offer ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <h2 className="text-2xl font-semibold text-white mb-4">No Active Ride Offer</h2>
          <p className="text-slate-400 max-w-md">You have no active ride offer. Offer a ride to see your route and matched passengers on the map.</p>
          <div className="w-full h-full mt-6 rounded-2xl overflow-hidden border border-white/10" ref={mapContainer} />
        </div>
      ) : (
        <>
          <div className="lg:col-span-8 flex-1 h-full rounded-2xl overflow-hidden border border-white/10 relative" ref={mapContainer}>
          </div>
          
          <div className="lg:w-[350px] flex flex-col h-full bg-black/40 rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10 bg-white/5">
              <h3 className="text-lg font-semibold text-white">Matched Riders</h3>
              <p className="text-xs text-slate-400">{riders.length} riders found along your route</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {riders.length === 0 ? (
                <div className="text-sm text-slate-500 text-center py-8">No riders matched yet.</div>
              ) : (
                riders.map((rider, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/10 p-3 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                       onClick={() => {
                          if (map.current && rider.start_lon && rider.start_lat) {
                              map.current.flyTo({ center: [rider.start_lon, rider.start_lat], zoom: 12 });
                          }
                       }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-green-400 text-xs font-bold bg-green-500/10 px-2 py-1 rounded">
                        {rider.match_score}% Match
                      </div>
                      <div className="text-slate-400 text-xs">{rider.no_of_seats} seats</div>
                    </div>
                    <div className="text-sm text-white font-medium truncate mb-1">
                      {rider.start_location}
                    </div>
                    <div className="text-sm text-slate-400 truncate mb-2">
                      to {rider.end_destination}
                    </div>
                    <div className="text-xs text-blue-400">
                      +{rider.pickup_distance_km}km pickup distance
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
