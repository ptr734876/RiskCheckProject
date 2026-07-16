import React from 'react';

export interface MapMarker {
  type: string;
  label: string;
  latitude: number | null;
  longitude: number | null;
  kind?: string;
  distance_m?: number;
  propertyId?: number;
}

export interface MapCenter {
  latitude: number;
  longitude: number;
}

interface MapViewProps {
  center: MapCenter | null;
  markers?: MapMarker[];
  selected?: boolean;
  clickedPoint?: { x: number; y: number } | null;
  onMapClick?: (x: number, y: number) => void;
  onReady?: () => void;
}

export const MAP_WIDTH = 480;
export const MAP_HEIGHT = 260;

export function projectToMap(
  lat: number,
  lng: number,
  center: MapCenter
): { x: number; y: number } {
  const scale = 14000;
  const x = MAP_WIDTH / 2 + (lng - center.longitude) * scale;
  const y = MAP_HEIGHT / 2 - (lat - center.latitude) * scale;
  return {
    x: Math.min(MAP_WIDTH - 16, Math.max(16, x)),
    y: Math.min(MAP_HEIGHT - 16, Math.max(16, y)),
  };
}

const MapView: React.FC<MapViewProps> = ({
  center,
  markers = [],
  selected,
  clickedPoint,
  onMapClick,
  onReady,
}) => {
  React.useEffect(() => {
    onReady?.();
  }, [onReady]);

  const propertyMarkers = markers.filter((m) => m.type === 'property');
  const nearby = markers.filter((m) => m.type !== 'property');

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onMapClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * MAP_WIDTH;
    const y = ((e.clientY - rect.top) / rect.height) * MAP_HEIGHT;
    onMapClick(x, y);
  };

  const selectedPin =
    center && propertyMarkers[0]?.latitude != null && propertyMarkers[0]?.longitude != null
      ? projectToMap(propertyMarkers[0].latitude, propertyMarkers[0].longitude, center)
      : selected && center
        ? { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 }
        : null;

  return (
    <div className="relative w-full h-full">
      <svg
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-full ${onMapClick ? 'cursor-crosshair' : ''}`}
        aria-label="Карта"
        onClick={handleSvgClick}
      >
        <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="#2C2C30" />

        <rect x="0" y="108" width={MAP_WIDTH} height="18" fill="#363638" />
        <rect x="0" y="46" width={MAP_WIDTH} height="12" fill="#363638" />
        <rect x="0" y="200" width={MAP_WIDTH} height="14" fill="#363638" />
        <rect x="118" y="0" width="14" height={MAP_HEIGHT} fill="#363638" />
        <rect x="240" y="0" width="18" height={MAP_HEIGHT} fill="#363638" />
        <rect x="370" y="0" width="12" height={MAP_HEIGHT} fill="#363638" />
        <rect x="60" y="58" width="8" height="140" fill="#343434" />
        <rect x="180" y="0" width="8" height="108" fill="#343434" />
        <rect x="310" y="58" width="8" height="140" fill="#343434" />

        <rect x="6" y="6" width="50" height="38" rx="1" fill="#484848" />
        <rect x="62" y="6" width="22" height="38" rx="1" fill="#3E3E3E" />
        <rect x="6" y="58" width="50" height="46" rx="1" fill="#424242" />
        <rect x="62" y="58" width="22" height="22" rx="1" fill="#3A3A3A" />
        <rect x="62" y="84" width="22" height="20" rx="1" fill="#464646" />
        <rect x="136" y="6" width="36" height="38" rx="1" fill="#474747" />
        <rect x="176" y="6" width="28" height="38" rx="1" fill="#3D3D3D" />
        <rect x="136" y="58" width="100" height="46" rx="1" fill="#404040" />
        <rect x="262" y="6" width="54" height="38" rx="1" fill="#444444" />
        <rect x="322" y="6" width="44" height="38" rx="1" fill="#3C3C3C" />
        <rect x="386" y="6" width="88" height="38" rx="1" fill="#484848" />
        <rect x="262" y="58" width="44" height="46" rx="1" fill="#3F3F3F" />
        <rect x="320" y="58" width="46" height="22" rx="1" fill="#434343" />
        <rect x="386" y="58" width="88" height="46" rx="1" fill="#414141" />
        <rect x="6" y="130" width="50" height="66" rx="1" fill="#464646" />
        <rect x="62" y="130" width="22" height="30" rx="1" fill="#3B3B3B" />
        <rect x="62" y="164" width="22" height="32" rx="1" fill="#434343" />
        <rect x="136" y="130" width="100" height="66" rx="1" fill="#404040" />
        <rect x="262" y="130" width="104" height="32" rx="1" fill="#444444" />
        <rect x="262" y="166" width="44" height="30" rx="1" fill="#3E3E3E" />
        <rect x="320" y="166" width="46" height="30" rx="1" fill="#464646" />
        <rect x="386" y="130" width="88" height="66" rx="1" fill="#424242" />
        <rect x="6" y="218" width="50" height="36" rx="1" fill="#3D3D3D" />
        <rect x="62" y="218" width="50" height="36" rx="1" fill="#434343" />
        <rect x="136" y="218" width="100" height="36" rx="1" fill="#404040" />
        <rect x="262" y="218" width="104" height="36" rx="1" fill="#444444" />
        <rect x="386" y="218" width="88" height="36" rx="1" fill="#3C3C3C" />

        <path
          d="M0 242 Q60 234 140 238 Q220 242 300 236 Q380 230 480 238 L480 260 L0 260 Z"
          fill="#1A3050"
          opacity="0.9"
        />
        <rect x="6" y="202" width="50" height="14" rx="1" fill="#2A4A22" opacity="0.9" />
        <rect x="136" y="202" width="46" height="14" rx="1" fill="#2A4A22" opacity="0.8" />

        {center &&
          nearby.map((m, i) => {
            if (m.latitude == null || m.longitude == null) return null;
            const p = projectToMap(m.latitude, m.longitude, center);
            const isPlus = m.type === 'positive' || m.type === 'plus';
            return (
              <g key={`${m.label}-${i}`} transform={`translate(${p.x}, ${p.y})`}>
                <circle
                  cx="0"
                  cy="0"
                  r="4"
                  fill={isPlus ? '#3D9A5F' : '#C45C4A'}
                  stroke="#0C0C10"
                  strokeWidth="1"
                  opacity="0.9"
                />
              </g>
            );
          })}

        {center &&
          propertyMarkers.map((m, i) => {
            if (m.latitude == null || m.longitude == null) return null;
            const p = projectToMap(m.latitude, m.longitude, center);
            const isActive =
              selected &&
              selectedPin &&
              Math.abs(p.x - selectedPin.x) < 1 &&
              Math.abs(p.y - selectedPin.y) < 1;
            if (isActive) return null;
            return (
              <g key={`prop-${m.propertyId ?? i}`} transform={`translate(${p.x}, ${p.y})`}>
                <circle cx="0" cy="0" r="5" fill="#D4A030" stroke="#A87A20" strokeWidth="1.5" />
              </g>
            );
          })}

        {selectedPin && selected && (
          <g transform={`translate(${selectedPin.x}, ${selectedPin.y})`}>
            <circle cx="0" cy="0" r="14" fill="#D4A030" opacity="0.15" />
            <circle cx="0" cy="0" r="6" fill="#D4A030" stroke="#A87A20" strokeWidth="2" />
            <circle cx="0" cy="0" r="2.5" fill="#0C0C10" />
            <circle cx="0" cy="0" r="14" fill="none" stroke="#D4A030" strokeWidth="1" opacity="0.3">
              <animate attributeName="r" from="10" to="20" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.4" to="0" dur="1.5s" repeatCount="indefinite" />
            </circle>
          </g>
        )}

        {clickedPoint && !selected && (
          <g transform={`translate(${clickedPoint.x}, ${clickedPoint.y})`}>
            <circle cx="0" cy="0" r="14" fill="#D4A030" opacity="0.15" />
            <circle cx="0" cy="0" r="6" fill="#D4A030" stroke="#A87A20" strokeWidth="2" />
            <circle cx="0" cy="0" r="2.5" fill="#0C0C10" />
          </g>
        )}
      </svg>
    </div>
  );
};

export default MapView;
