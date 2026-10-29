import React, { useState } from 'react';
import { 
  Navigation, MapPin, ZoomIn, ZoomOut, RotateCcw, 
  Layers, ShieldCheck, Compass, Info, CheckCircle2 
} from 'lucide-react';
import { NIAMEY_DISTRICTS } from '../data/niameyData';
import { OrderItem, Driver } from '../types';

interface NiameyInteractiveMapProps {
  activeOrder?: OrderItem | null;
  drivers?: Driver[];
  selectedDistrictId?: string;
  onSelectDistrict?: (districtId: string) => void;
  mode?: 'TRACKING' | 'DISPATCH' | 'EXPLORE';
  className?: string;
}

export const NiameyInteractiveMap: React.FC<NiameyInteractiveMapProps> = ({
  activeOrder,
  drivers = [],
  selectedDistrictId,
  onSelectDistrict,
  mode = 'TRACKING',
  className = ''
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mapTheme, setMapTheme] = useState<'TACTICAL' | 'NIGHT'>('TACTICAL');
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);

  // SVG coordinate transformation for Niamey bounds:
  // Lat: 13.470 to 13.560 (North is up, so invert Y)
  // Lng: 2.075 to 2.185 (East is right)
  const minLat = 13.470;
  const maxLat = 13.560;
  const minLng = 2.075;
  const maxLng = 2.185;

  const width = 800;
  const height = 560;

  const project = (lat: number, lng: number) => {
    const x = ((lng - minLng) / (maxLng - minLng)) * width;
    const y = ((maxLat - lat) / (maxLat - minLat)) * height;
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Niger River realistic path through Niamey
  const riverPath = `
    M ${project(13.548, 2.078).x} ${project(13.548, 2.078).y}
    Q ${project(13.535, 2.088).x} ${project(13.535, 2.088).y} ${project(13.520, 2.096).x} ${project(13.520, 2.096).y}
    T ${project(13.508, 2.106).x} ${project(13.508, 2.106).y}
    Q ${project(13.495, 2.115).x} ${project(13.495, 2.115).y} ${project(13.480, 2.126).x} ${project(13.480, 2.126).y}
    T ${project(13.468, 2.140).x} ${project(13.468, 2.140).y}
  `;

  // Main arteries of Niamey
  // 1. Boulevard Mali Béro
  const maliBero = `
    M ${project(13.538, 2.090).x} ${project(13.538, 2.090).y}
    L ${project(13.542, 2.115).x} ${project(13.542, 2.115).y}
    L ${project(13.537, 2.145).x} ${project(13.537, 2.145).y}
  `;

  // 2. Avenue du Général de Gaulle & Pont Kennedy axis
  const gaulleAxis = `
    M ${project(13.522, 2.108).x} ${project(13.522, 2.108).y}
    L ${project(13.512, 2.108).x} ${project(13.512, 2.108).y}
    L ${project(13.503, 2.101).x} ${project(13.503, 2.101).y}
    L ${project(13.495, 2.096).x} ${project(13.495, 2.096).y}
  `;

  // 3. Voie Express Aéroport (Talladjé -> Aéroport Diori Hamani)
  const airportExpress = `
    M ${project(13.518, 2.130).x} ${project(13.518, 2.130).y}
    L ${project(13.500, 2.152).x} ${project(13.500, 2.152).y}
    L ${project(13.483, 2.175).x} ${project(13.483, 2.175).y}
  `;

  // 4. Ring road / Recasement
  const ringRoad = `
    M ${project(13.548, 2.110).x} ${project(13.548, 2.110).y}
    Q ${project(13.550, 2.145).x} ${project(13.550, 2.145).y} ${project(13.530, 2.165).x} ${project(13.530, 2.165).y}
    T ${project(13.500, 2.160).x} ${project(13.500, 2.160).y}
  `;

  // Pont Kennedy coordinates
  const pontKennedy = project(13.507, 2.106);
  // Pont Chinois (Pont de l'Amitié) coordinates
  const pontChinois = project(13.518, 2.099);

  // Active delivery coordinates
  const pickupCoord = activeOrder ? project(activeOrder.pickup.lat, activeOrder.pickup.lng) : null;
  const dropoffCoord = activeOrder ? project(activeOrder.dropoff.lat, activeOrder.dropoff.lng) : null;

  // Courier live coords: either activeOrder.delivery.currentCoords or interpolated
  const courierCoord = activeOrder?.delivery.currentCoords 
    ? project(activeOrder.delivery.currentCoords.lat, activeOrder.delivery.currentCoords.lng)
    : (pickupCoord && dropoffCoord) 
      ? {
          x: pickupCoord.x + (dropoffCoord.x - pickupCoord.x) * ((activeOrder?.delivery.progressPercent || 30) / 100),
          y: pickupCoord.y + (dropoffCoord.y - pickupCoord.y) * ((activeOrder?.delivery.progressPercent || 30) / 100)
        }
      : null;

  return (
    <div className={`relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-2xl select-none ${className}`}>
      {/* Top Map HUD */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-200 pointer-events-auto shadow-sm">
          <span className="font-semibold text-amber-400">Niamey GPS Live</span>
          <span className="text-slate-600">·</span>
          <span>13°31′ N, 02°06′ E</span>
          <span className="text-slate-600">·</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
            Réseau Actif
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-lg border border-slate-800 pointer-events-auto shadow-sm">
          <button
            onClick={() => setZoom(prev => Math.min(prev + 0.25, 2.5))}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
            title="Zoom avant"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.75))}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
            title="Zoom arrière"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={resetView}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
            title="Recentrer Niamey"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-slate-800 mx-0.5" />
          <button
            onClick={() => setMapTheme(t => t === 'TACTICAL' ? 'NIGHT' : 'TACTICAL')}
            className={`p-1.5 rounded text-xs font-medium transition-colors ${mapTheme === 'TACTICAL' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-white'}`}
            title="Changer thème cartographique"
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main SVG Canvas */}
      <div 
        className="w-full h-[380px] md:h-[460px] cursor-grab active:cursor-grabbing bg-slate-950 relative overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full transition-transform duration-75"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center'
          }}
        >
          <defs>
            {/* River water gradient */}
            <linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0.30" />
            </linearGradient>

            {/* Trajectory gradient */}
            <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>

            {/* Grid pattern for tactical style */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeOpacity="0.6" />
            </pattern>
          </defs>

          {/* Tactical Background Grid */}
          <rect width={width} height={height} fill="url(#grid)" />

          {/* Niamey City Boundary Ambience */}
          <ellipse cx="400" cy="280" rx="360" ry="240" fill="#0f172a" fillOpacity="0.6" />

          {/* Fleuve Niger (River) */}
          <path
            d={riverPath}
            fill="none"
            stroke="url(#riverGrad)"
            strokeWidth="38"
            strokeLinecap="round"
          />
          <path
            d={riverPath}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2"
            strokeOpacity="0.4"
            strokeDasharray="6 4"
          />

          {/* River Label */}
          <text 
            x={project(13.488, 2.115).x} 
            y={project(13.488, 2.115).y + 5} 
            fill="#38bdf8" 
            fillOpacity="0.5" 
            fontSize="10" 
            letterSpacing="2"
            className="font-mono italic"
          >
            FLEUVE NIGER
          </text>

          {/* Major Road Arteries */}
          <path d={maliBero} fill="none" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
          <path d={gaulleAxis} fill="none" stroke="#334155" strokeWidth="3.5" strokeLinecap="round" />
          <path d={airportExpress} fill="none" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
          <path d={ringRoad} fill="none" stroke="#1e293b" strokeWidth="2.5" strokeDasharray="4 2" />

          {/* Ponts de Niamey (Bridges crossing river) */}
          {/* Pont Kennedy */}
          <g>
            <rect 
              x={pontKennedy.x - 7} 
              y={pontKennedy.y - 7} 
              width="14" 
              height="14" 
              rx="2"
              fill="#d97706" 
              stroke="#f59e0b" 
              strokeWidth="1.5" 
            />
            <text 
              x={pontKennedy.x + 12} 
              y={pontKennedy.y + 4} 
              fill="#fbbf24" 
              fontSize="9" 
              className="font-medium"
            >
              Pont Kennedy
            </text>
          </g>

          {/* Pont des Martyrs (Pont Chinois) */}
          <g>
            <rect 
              x={pontChinois.x - 6} 
              y={pontChinois.y - 6} 
              width="12" 
              height="12" 
              rx="2"
              fill="#0891b2" 
              stroke="#22d3ee" 
              strokeWidth="1.5" 
            />
            <text 
              x={pontChinois.x + 10} 
              y={pontChinois.y + 4} 
              fill="#67e8f9" 
              fontSize="9" 
              className="font-medium"
            >
              Pont des Martyrs (2ème Pont)
            </text>
          </g>

          {/* Neighborhoods / Districts */}
          {NIAMEY_DISTRICTS.map(d => {
            const pt = project(d.lat, d.lng);
            const isSelected = selectedDistrictId === d.id;
            const isPickup = activeOrder?.pickup.districtId === d.id;
            const isDropoff = activeOrder?.dropoff.districtId === d.id;
            const isHovered = hoveredDistrict === d.id;

            return (
              <g 
                key={d.id} 
                className="cursor-pointer transition-all duration-150"
                onClick={() => onSelectDistrict && onSelectDistrict(d.id)}
                onMouseEnter={() => setHoveredDistrict(d.id)}
                onMouseLeave={() => setHoveredDistrict(null)}
              >
                {/* District radius highlight */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected || isPickup || isDropoff ? "22" : "14"}
                  fill={
                    isPickup ? "rgba(245, 158, 11, 0.15)" :
                    isDropoff ? "rgba(16, 185, 129, 0.15)" :
                    isSelected ? "rgba(245, 158, 11, 0.1)" :
                    "rgba(148, 163, 184, 0.05)"
                  }
                  stroke={
                    isPickup ? "#f59e0b" :
                    isDropoff ? "#10b981" :
                    isSelected ? "#d97706" :
                    "#334155"
                  }
                  strokeWidth={isSelected || isPickup || isDropoff ? "1.5" : "0.75"}
                  strokeDasharray={isPickup || isDropoff ? "none" : "3 2"}
                />

                {/* Center dot */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="3.5"
                  fill={
                    isPickup ? "#f59e0b" :
                    isDropoff ? "#10b981" :
                    "#94a3b8"
                  }
                />

                {/* District Label */}
                <text
                  x={pt.x}
                  y={pt.y - 10}
                  textAnchor="middle"
                  fill={
                    isPickup ? "#fcd34d" :
                    isDropoff ? "#6ee7b7" :
                    isSelected ? "#fbbf24" :
                    isHovered ? "#ffffff" :
                    "#94a3b8"
                  }
                  fontSize={isSelected || isPickup || isDropoff ? "10" : "8.5"}
                  fontWeight={isSelected || isPickup || isDropoff ? "700" : "500"}
                  className="pointer-events-none select-none tracking-tight"
                >
                  {d.name.split('/')[0].trim()}
                </text>
              </g>
            );
          })}

          {/* Active Delivery Trajectory Path */}
          {pickupCoord && dropoffCoord && (
            <g>
              {/* Route line */}
              <line
                x1={pickupCoord.x}
                y1={pickupCoord.y}
                x2={dropoffCoord.x}
                y2={dropoffCoord.y}
                stroke="url(#routeGrad)"
                strokeWidth="3"
                strokeDasharray="6 4"
                strokeLinecap="round"
              />

              {/* Pickup Pin */}
              <g transform={`translate(${pickupCoord.x}, ${pickupCoord.y})`}>
                <circle r="9" fill="#f59e0b" fillOpacity="0.25" className="animate-ping" />
                <circle r="6" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
                <text x="10" y="4" fill="#fbbf24" fontSize="10" fontWeight="700">Départ (Colis)</text>
              </g>

              {/* Dropoff Pin */}
              <g transform={`translate(${dropoffCoord.x}, ${dropoffCoord.y})`}>
                <circle r="7" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                <text x="10" y="4" fill="#34d399" fontSize="10" fontWeight="700">Arrivée</text>
              </g>

              {/* Moving Falcon Courier Pin */}
              {courierCoord && (
                <g transform={`translate(${courierCoord.x}, ${courierCoord.y})`}>
                  {/* Radar pulse */}
                  <circle r="16" fill="rgba(245, 158, 11, 0.2)" className="animate-pulse" />
                  <circle r="9" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
                  {/* Falcon emblem dot */}
                  <circle r="4" fill="#f59e0b" />
                  
                  {/* Courier Tag */}
                  <g transform="translate(14, -8)">
                    <rect 
                      x="0" 
                      y="0" 
                      width="120" 
                      height="24" 
                      rx="4" 
                      fill="#0f172a" 
                      stroke="#f59e0b" 
                      strokeWidth="1" 
                    />
                    <text x="6" y="16" fill="#f8fafc" fontSize="9" fontWeight="600">
                      ⚡ {activeOrder?.delivery?.driverName?.split(' ')[0] || 'Livreur Faucon'}
                    </text>
                  </g>
                </g>
              )}
            </g>
          )}

          {/* Idle Available Drivers across Niamey */}
          {mode === 'DISPATCH' && drivers.map(drv => {
            const pt = project(drv.lat, drv.lng);
            return (
              <g key={drv.id} transform={`translate(${pt.x}, ${pt.y})`} className="cursor-pointer">
                <circle 
                  r="7" 
                  fill={drv.status === 'AVAILABLE' ? "#10b981" : "#f59e0b"} 
                  stroke="#0f172a" 
                  strokeWidth="2" 
                />
                <circle r="2.5" fill="#ffffff" />
                <text x="9" y="3" fill="#cbd5e1" fontSize="8" className="font-mono">
                  {drv.name.split(' ')[0]}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Bottom Floating Telemetry Card if Active Order */}
        {activeOrder && (
          <div className="absolute bottom-3 left-3 right-3 z-10 bg-slate-900/95 backdrop-blur-md p-3 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Navigation className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="font-mono text-amber-400 font-semibold">{activeOrder.orderNumber}</span>
                  <span>·</span>
                  <span>{activeOrder.delivery.driverVehicle || 'Moto Boxer'}</span>
                </div>
                <div className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                  <span>{activeOrder.pickup.districtName.split('/')[0]}</span>
                  <span className="text-amber-500">➔</span>
                  <span>{activeOrder.dropoff.districtName.split('/')[0]}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="text-right">
                <div className="text-slate-400">Arrivée estimée</div>
                <div className="text-sm font-bold text-amber-400 font-mono">
                  ~{activeOrder.delivery.estimatedMinutes} min
                </div>
              </div>
              <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full transition-all duration-500"
                  style={{ width: `${activeOrder.delivery.progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Map Legend */}
      <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            Départ
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            Destination
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-sky-500/40 border border-sky-400 inline-block" />
            Pont Kennedy / Chinois
          </span>
        </div>
        <div className="text-slate-400">
          Molette / Glisser pour naviguer sur Niamey
        </div>
      </div>
    </div>
  );
};
