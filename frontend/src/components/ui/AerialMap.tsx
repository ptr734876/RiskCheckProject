import React from 'react';

interface AerialMapProps {
  clickedPoint: { x: number; y: number } | null;
  onMapClick: (x: number, y: number) => void;
}

const AerialMap: React.FC<AerialMapProps> = ({ clickedPoint, onMapClick }) => {
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 480;
    const y = ((e.clientY - rect.top) / rect.height) * 260;
    onMapClick(x, y);
  };

  return (
    <svg
      viewBox="0 0 480 260"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full cursor-crosshair"
      onClick={handleSvgClick}
    >
      <rect width="480" height="260" fill="#2C2C30" />

      <rect x="0" y="108" width="480" height="18" fill="#363638" />
      <rect x="0" y="46" width="480" height="12" fill="#363638" />
      <rect x="0" y="200" width="480" height="14" fill="#363638" />
      <rect x="118" y="0" width="14" height="260" fill="#363638" />
      <rect x="240" y="0" width="18" height="260" fill="#363638" />
      <rect x="370" y="0" width="12" height="260" fill="#363638" />
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
      <rect x="188" y="58" width="44" height="22" rx="1" fill="#4A4A4A" />
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
      <rect x="180" y="130" width="30" height="30" rx="1" fill="#4A4A4A" />
      <rect x="262" y="130" width="104" height="32" rx="1" fill="#444444" />
      <rect x="262" y="166" width="44" height="30" rx="1" fill="#3E3E3E" />
      <rect x="320" y="166" width="46" height="30" rx="1" fill="#464646" />
      <rect x="386" y="130" width="88" height="66" rx="1" fill="#424242" />
      <rect x="6" y="218" width="50" height="36" rx="1" fill="#3D3D3D" />
      <rect x="62" y="218" width="50" height="36" rx="1" fill="#434343" />
      <rect x="136" y="218" width="100" height="36" rx="1" fill="#404040" />
      <rect x="262" y="218" width="104" height="36" rx="1" fill="#444444" />
      <rect x="386" y="218" width="88" height="36" rx="1" fill="#3C3C3C" />

      <rect x="16" y="14" width="30" height="22" rx="1" fill="#545454" opacity="0.6" />
      <rect x="144" y="14" width="20" height="24" rx="1" fill="#525252" opacity="0.6" />
      <rect x="268" y="14" width="38" height="22" rx="1" fill="#505050" opacity="0.6" />
      <rect x="396" y="14" width="50" height="22" rx="1" fill="#545454" opacity="0.6" />
      <path d="M0 242 Q60 234 140 238 Q220 242 300 236 Q380 230 480 238 L480 260 L0 260 Z" fill="#1A3050" opacity="0.9" />
      <rect x="6" y="202" width="50" height="14" rx="1" fill="#2A4A22" opacity="0.9" />
      <rect x="136" y="202" width="46" height="14" rx="1" fill="#2A4A22" opacity="0.8" />

      {clickedPoint && (
        <g transform={`translate(${clickedPoint.x}, ${clickedPoint.y})`}>
          <circle cx="0" cy="0" r="14" fill="#D4A030" opacity="0.15" />
          <circle cx="0" cy="0" r="6" fill="#D4A030" stroke="#A87A20" strokeWidth="2" />
          <circle cx="0" cy="0" r="2.5" fill="#0C0C10" />
          <circle cx="0" cy="0" r="14" fill="none" stroke="#D4A030" strokeWidth="1" opacity="0.3">
            <animate attributeName="r" from="10" to="20" dur="1.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.4" to="0" dur="1.5s" repeatCount="indefinite" />
          </circle>
        </g>
      )}
    </svg>
  );
};

export default AerialMap;