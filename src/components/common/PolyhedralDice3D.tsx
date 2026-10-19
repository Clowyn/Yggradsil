import { useRef, useMemo, useEffect, useState } from 'react';
import type { DieType } from '../../lib/diceRoller';
import { Sparkles, Skull } from 'lucide-react';

export interface PolyhedralDice3DProps {
  dieType: DieType;
  rolling: boolean;
  value: number; // settled or current display value
  rollId?: string | number; // unique identifier for the current roll to trigger new spin even if already rolling
  isCrit?: boolean;
  isFumble?: boolean;
  isKept?: boolean;
  isDiscarded?: boolean;
  size?: number; // base size in px (defaults based on dieType)
  onClick?: () => void;
  testId?: string;
  subLabel?: string;
}

interface FaceSpec {
  val: number | string;
  displayStr: string;
  el: number; // elevation in degrees (-90 to +90)
  az: number; // azimuth in degrees (0 to 360)
  inv?: boolean; // whether the triangle/polygon is inverted (rotateZ 180)
  rz?: number; // in-plane rotation twist in degrees
  isUnderlined?: boolean; // for 6 and 9
}

// ==========================================
// POLYHEDRAL GEOMETRY DEFINITIONS
// ==========================================

// D20 Icosahedron Angles (Dihedral arccos(-sqrt(5)/3) = 138.19°)
const D20_EL_UP = 52.62263;
const D20_EL_MID = 10.81232;

// 20-sided regular icosahedron with exact opposite pairs summing to 21
const D20_FACES: FaceSpec[] = [
  // Ring 1 (Upper Pyramid, 5 faces pointing up, el = +52.62°)
  { val: 20, displayStr: '20', el: D20_EL_UP, az: 0, inv: false },
  { val: 2, displayStr: '2', el: D20_EL_UP, az: 72, inv: false },
  { val: 14, displayStr: '14', el: D20_EL_UP, az: 144, inv: false },
  { val: 8, displayStr: '8', el: D20_EL_UP, az: 216, inv: false },
  { val: 10, displayStr: '10', el: D20_EL_UP, az: 288, inv: false },

  // Ring 2 (Upper Middle Belt, 5 faces pointing down, el = +10.81°, sharing horizontal base with Ring 1)
  { val: 18, displayStr: '18', el: D20_EL_MID, az: 0, inv: true },
  { val: 4, displayStr: '4', el: D20_EL_MID, az: 72, inv: true },
  { val: 16, displayStr: '16', el: D20_EL_MID, az: 144, inv: true },
  { val: 6, displayStr: '6.', el: D20_EL_MID, az: 216, inv: true, isUnderlined: true },
  { val: 12, displayStr: '12', el: D20_EL_MID, az: 288, inv: true },

  // Ring 3 (Lower Middle Belt, 5 faces pointing up, el = -10.81°, antipodal to Ring 2, sums to 21)
  { val: 15, displayStr: '15', el: -D20_EL_MID, az: 36, inv: false },
  { val: 9, displayStr: '9.', el: -D20_EL_MID, az: 108, inv: false, isUnderlined: true },
  { val: 3, displayStr: '3', el: -D20_EL_MID, az: 180, inv: false },
  { val: 17, displayStr: '17', el: -D20_EL_MID, az: 252, inv: false },
  { val: 5, displayStr: '5', el: -D20_EL_MID, az: 324, inv: false },

  // Ring 4 (Lower Pyramid, 5 faces pointing down, el = -52.62°, antipodal to Ring 1, sums to 21)
  { val: 13, displayStr: '13', el: -D20_EL_UP, az: 36, inv: true },
  { val: 11, displayStr: '11', el: -D20_EL_UP, az: 108, inv: true },
  { val: 1, displayStr: '1', el: -D20_EL_UP, az: 180, inv: true },
  { val: 19, displayStr: '19', el: -D20_EL_UP, az: 252, inv: true },
  { val: 7, displayStr: '7', el: -D20_EL_UP, az: 324, inv: true },
];

// D4 Tetrahedron (4 triangular faces, cube-symmetric regular tetrahedron)
const D4_FACES: FaceSpec[] = [
  { val: 1, displayStr: '1', el: -35.264, az: 225, rz: 0 },
  { val: 2, displayStr: '2', el: 35.264, az: 315, rz: 180 },
  { val: 3, displayStr: '3', el: -35.264, az: 45, rz: 0 },
  { val: 4, displayStr: '4', el: 35.264, az: 135, rz: 180 },
];

// D6 Cube (6 square faces, opposite pairs sum to 7)
const D6_FACES: FaceSpec[] = [
  { val: 1, displayStr: '1', el: 0, az: 0, inv: false },
  { val: 6, displayStr: '6.', el: 0, az: 180, inv: false, isUnderlined: true },
  { val: 2, displayStr: '2', el: 0, az: 90, inv: false },
  { val: 5, displayStr: '5', el: 0, az: 270, inv: false },
  { val: 3, displayStr: '3', el: 90, az: 0, inv: false },
  { val: 4, displayStr: '4', el: -90, az: 0, inv: false },
];

// D8 Octahedron (8 triangular faces, opposite pairs sum to 9)
const D8_EL = 35.264;
const D8_FACES: FaceSpec[] = [
  { val: 8, displayStr: '8', el: D8_EL, az: 45, inv: false },
  { val: 2, displayStr: '2', el: D8_EL, az: 135, inv: false },
  { val: 6, displayStr: '6.', el: D8_EL, az: 225, inv: false, isUnderlined: true },
  { val: 4, displayStr: '4', el: D8_EL, az: 315, inv: false },
  { val: 3, displayStr: '3', el: -D8_EL, az: 45, inv: true },
  { val: 5, displayStr: '5', el: -D8_EL, az: 135, inv: true },
  { val: 1, displayStr: '1', el: -D8_EL, az: 225, inv: true },
  { val: 7, displayStr: '7', el: -D8_EL, az: 315, inv: true },
];

// D10 Decahedron / Pentagonal Trapezohedron (10 kite faces, opposite pairs sum to 11)
const D10_EL = 28;
const D10_FACES: FaceSpec[] = [
  { val: 10, displayStr: '10', el: D10_EL, az: 0, inv: false },
  { val: 2, displayStr: '2', el: D10_EL, az: 72, inv: false },
  { val: 8, displayStr: '8', el: D10_EL, az: 144, inv: false },
  { val: 4, displayStr: '4', el: D10_EL, az: 216, inv: false },
  { val: 6, displayStr: '6.', el: D10_EL, az: 288, inv: false, isUnderlined: true },
  { val: 1, displayStr: '1', el: -D10_EL, az: 180, inv: true },
  { val: 9, displayStr: '9.', el: -D10_EL, az: 252, inv: true, isUnderlined: true },
  { val: 3, displayStr: '3', el: -D10_EL, az: 324, inv: true },
  { val: 7, displayStr: '7', el: -D10_EL, az: 36, inv: true },
  { val: 5, displayStr: '5', el: -D10_EL, az: 108, inv: true },
];

// D12 Dodecahedron (12 pentagonal faces, opposite pairs sum to 13)
const D12_EL = 26.565;
const D12_FACES: FaceSpec[] = [
  { val: 12, displayStr: '12', el: 90, az: 0, inv: false },
  { val: 2, displayStr: '2', el: D12_EL, az: 0, inv: false },
  { val: 4, displayStr: '4', el: D12_EL, az: 72, inv: false },
  { val: 6, displayStr: '6.', el: D12_EL, az: 144, inv: false, isUnderlined: true },
  { val: 8, displayStr: '8', el: D12_EL, az: 216, inv: false },
  { val: 10, displayStr: '10', el: D12_EL, az: 288, inv: false },
  { val: 5, displayStr: '5', el: -D12_EL, az: 36, inv: true },
  { val: 3, displayStr: '3', el: -D12_EL, az: 108, inv: true },
  { val: 11, displayStr: '11', el: -D12_EL, az: 180, inv: true },
  { val: 9, displayStr: '9.', el: -D12_EL, az: 252, inv: true, isUnderlined: true },
  { val: 7, displayStr: '7', el: -D12_EL, az: 324, inv: true },
  { val: 1, displayStr: '1', el: -90, az: 0, inv: true },
];

// D100 Percentile Die (10 kite faces labeled 00..90)
const D100_FACES: FaceSpec[] = [
  { val: 0, displayStr: '00', el: D10_EL, az: 0, inv: false },
  { val: 20, displayStr: '20', el: D10_EL, az: 72, inv: false },
  { val: 80, displayStr: '80', el: D10_EL, az: 144, inv: false },
  { val: 40, displayStr: '40', el: D10_EL, az: 216, inv: false },
  { val: 60, displayStr: '60', el: D10_EL, az: 288, inv: false },
  { val: 10, displayStr: '10', el: -D10_EL, az: 180, inv: true },
  { val: 90, displayStr: '90', el: -D10_EL, az: 252, inv: true },
  { val: 30, displayStr: '30', el: -D10_EL, az: 324, inv: true },
  { val: 70, displayStr: '70', el: -D10_EL, az: 36, inv: true },
  { val: 50, displayStr: '50', el: -D10_EL, az: 108, inv: true },
];

export function PolyhedralDice3D({
  dieType,
  rolling,
  value,
  rollId,
  isCrit = false,
  isFumble = false,
  isKept,
  isDiscarded,
  size,
  onClick,
  testId = 'polyhedral-die-3d',
  subLabel,
}: PolyhedralDice3DProps) {
  // Determine face specs and dimensions based on dieType
  const { faces, faceWidth, faceHeight, inradius, shapeType } = useMemo(() => {
    switch (dieType) {
      case 'd4': {
        const fw = size ?? 64;
        const edgePx = 0.8 * fw;
        const rin = edgePx * (Math.sqrt(6) / 12);
        return { faces: D4_FACES, faceWidth: fw, faceHeight: fw, inradius: rin, shapeType: 'triangle' };
      }
      case 'd6': {
        const fw = size ?? 58;
        const edgePx = 0.8 * fw;
        const rin = edgePx / 2;
        return { faces: D6_FACES, faceWidth: fw, faceHeight: fw, inradius: rin, shapeType: 'square' };
      }
      case 'd8': {
        const fw = size ?? 60;
        const edgePx = 0.8 * fw;
        const rin = edgePx * (Math.sqrt(6) / 6);
        return { faces: D8_FACES, faceWidth: fw, faceHeight: fw, inradius: rin, shapeType: 'triangle' };
      }
      case 'd10': {
        const fw = size ?? 50;
        const rin = fw * 0.40;
        return { faces: D10_FACES, faceWidth: fw, faceHeight: fw, inradius: rin, shapeType: 'kite' };
      }
      case 'd12': {
        const fw = size ?? 48;
        const edgePx = 0.4937 * fw;
        const rin = (edgePx / 20) * Math.sqrt(250 + 110 * Math.sqrt(5));
        return { faces: D12_FACES, faceWidth: fw, faceHeight: fw, inradius: rin, shapeType: 'pentagon' };
      }
      case 'd100': {
        const fw = size ?? 50;
        const rin = fw * 0.40;
        return { faces: D100_FACES, faceWidth: fw, faceHeight: fw, inradius: rin, shapeType: 'kite' };
      }
      case 'd20':
      default: {
        const fw = size ?? 64;
        const edgePx = 0.8 * fw;
        const rin = (edgePx * Math.sqrt(3) / 12) * (3 + Math.sqrt(5));
        return { faces: D20_FACES, faceWidth: fw, faceHeight: fw, inradius: rin, shapeType: 'triangle' };
      }
    }
  }, [dieType, size]);

  // Find the face spec corresponding to value
  const targetFace = useMemo(() => {
    if (dieType === 'd100') {
      const tens = value === 100 ? 0 : Math.floor(value / 10) * 10;
      return faces.find((f) => f.val === tens) || faces[0];
    }
    return faces.find((f) => f.val === value) || faces[0];
  }, [faces, value, dieType]);

  // Target Euler rotations to orient the target face directly toward the camera (Identity orientation)
  const targetEuler = useMemo(() => {
    const invRot = targetFace.inv ? 180 : 0;
    const rz = targetFace.rz || 0;
    return {
      x: -targetFace.el,
      y: -targetFace.az,
      z: invRot + rz,
    };
  }, [targetFace]);

  // Cumulative rotation tracking to support continuous tumbling across rolls without snapping
  const currentRotRef = useRef<{ x: number; y: number; z: number }>({
    x: targetEuler.x,
    y: targetEuler.y,
    z: targetEuler.z,
  });

  const [activeRot, setActiveRot] = useState<{ x: number; y: number; z: number }>({
    x: targetEuler.x,
    y: targetEuler.y,
    z: targetEuler.z,
  });

  const prevRollingRef = useRef(false);
  const lastRollIdRef = useRef<string | number | undefined>(undefined);

  useEffect(() => {
    const isNewRollTriggered = rolling && (!prevRollingRef.current || (rollId !== undefined && rollId !== lastRollIdRef.current));

    if (isNewRollTriggered) {
      lastRollIdRef.current = rollId;
      // Just started rolling: generate multi-axis tumble with 2 to 4 full revolutions
      const spinsX = 2 + Math.floor(Math.random() * 2);
      const spinsY = 3 + Math.floor(Math.random() * 2);
      const spinsZ = 1 + Math.floor(Math.random() * 2);

      const curModX = ((currentRotRef.current.x % 360) + 360) % 360;
      const targetModX = ((targetEuler.x % 360) + 360) % 360;
      const deltaX = targetModX - curModX;

      const curModY = ((currentRotRef.current.y % 360) + 360) % 360;
      const targetModY = ((targetEuler.y % 360) + 360) % 360;
      const deltaY = targetModY - curModY;

      const curModZ = ((currentRotRef.current.z % 360) + 360) % 360;
      const targetModZ = ((targetEuler.z % 360) + 360) % 360;
      const deltaZ = targetModZ - curModZ;

      const newRot = {
        x: currentRotRef.current.x + spinsX * 360 + deltaX,
        y: currentRotRef.current.y + spinsY * 360 + deltaY,
        z: currentRotRef.current.z + spinsZ * 360 + deltaZ,
      };

      currentRotRef.current = newRot;
      setActiveRot(newRot);
    } else if (!rolling && prevRollingRef.current) {
      // Settled after roll: ensure orientation matches exact target face
      const curModX = ((currentRotRef.current.x % 360) + 360) % 360;
      const targetModX = ((targetEuler.x % 360) + 360) % 360;
      const deltaX = targetModX - curModX;

      const curModY = ((currentRotRef.current.y % 360) + 360) % 360;
      const targetModY = ((targetEuler.y % 360) + 360) % 360;
      const deltaY = targetModY - curModY;

      const curModZ = ((currentRotRef.current.z % 360) + 360) % 360;
      const targetModZ = ((targetEuler.z % 360) + 360) % 360;
      const deltaZ = targetModZ - curModZ;

      const finalRot = {
        x: currentRotRef.current.x + deltaX,
        y: currentRotRef.current.y + deltaY,
        z: currentRotRef.current.z + deltaZ,
      };
      currentRotRef.current = finalRot;
      setActiveRot(finalRot);
    } else if (!rolling && !prevRollingRef.current) {
      // Initial render or die switched without rolling
      const newRot = {
        x: targetEuler.x,
        y: targetEuler.y,
        z: targetEuler.z,
      };
      currentRotRef.current = newRot;
      setActiveRot(newRot);
    }
    prevRollingRef.current = rolling;
  }, [rolling, rollId, targetEuler]);

  // Dimension scaling for the container viewport
  const containerDim = Math.max(Math.round(faceWidth * 2.0), 84);

  return (
    <div
      data-testid={testId}
      data-die-type={dieType}
      data-rolling={rolling ? 'true' : 'false'}
      data-settled-face={value}
      data-is-crit={isCrit ? 'true' : 'false'}
      data-is-fumble={isFumble ? 'true' : 'false'}
      data-is-kept={isKept ? 'true' : 'false'}
      data-is-discarded={isDiscarded ? 'true' : 'false'}
      className={`relative flex flex-col items-center justify-center select-none transition-all duration-300 ${
        onClick ? 'cursor-pointer group' : ''
      } ${isDiscarded ? 'opacity-40 grayscale-[0.6] scale-90' : isKept ? 'scale-105' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : 'img'}
      tabIndex={onClick ? 0 : -1}
      aria-label={`${dieType} die, face ${value}${
        isKept ? ' (kept)' : isDiscarded ? ' (discarded)' : ''
      }${isCrit ? ' (critical 20)' : isFumble ? ' (critical 1)' : ''}`}
    >
      {/* 3D Perspective Stage */}
      <div
        className="relative flex items-center justify-center"
        style={{
          width: `${containerDim}px`,
          height: `${containerDim}px`,
          perspective: '600px',
        }}
      >
        {/* Floor Shadow simulating physical elevation and landing */}
        <div
          className={`absolute bottom-3 w-20 h-6 rounded-full bg-black/60 blur-md pointer-events-none transition-all duration-700 ${
            rolling ? 'scale-75 opacity-30 translate-y-3' : 'scale-100 opacity-80 translate-y-0'
          }`}
        />

        {/* Crit (Nat 20) Arcane Burst Aura */}
        {isCrit && !rolling && (
          <div className="absolute inset-0 rounded-full pointer-events-none animate-pulse flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-gradient-to-r from-amber-500/30 via-yellow-400/40 to-amber-500/30 blur-xl animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-16 h-16 text-yellow-300 animate-bounce opacity-80" />
            </div>
          </div>
        )}

        {/* Fumble (Nat 1) Crimson Ember Pulse */}
        {isFumble && !rolling && (
          <div className="absolute inset-0 rounded-full pointer-events-none animate-pulse flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-gradient-to-r from-red-600/30 via-rose-500/40 to-red-700/30 blur-xl animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Skull className="w-14 h-14 text-rose-400 animate-pulse opacity-75" />
            </div>
          </div>
        )}

        {/* The 3D Polyhedral Die Container */}
        <div
          className="relative transition-transform"
          style={{
            width: `${faceWidth}px`,
            height: `${faceHeight}px`,
            transformStyle: 'preserve-3d',
            transform: `translateY(${rolling ? -14 : 0}px) rotateZ(${activeRot.z}deg) rotateX(${activeRot.x}deg) rotateY(${activeRot.y}deg)`,
            transitionDuration: rolling ? '1000ms' : '350ms',
            transitionTimingFunction: rolling
              ? 'cubic-bezier(0.12, 0.9, 0.25, 1)'
              : 'cubic-bezier(0.2, 0.8, 0.3, 1)',
          }}
        >
          {faces.map((face) => {
            const isTargetFace = face.val === targetFace.val;
            const isCritFace = face.val === 20 && isCrit;
            const isFumbleFace = face.val === 1 && isFumble;

            // Compute face transform in 3D:
            // 1. In-plane rotation (inv or rz)
            // 2. Rotate around X by el
            // 3. Rotate around Y by az
            // 4. Translate forward along normal by inradius
            const invRot = face.inv ? 180 : 0;
            const rz = face.rz || 0;
            const faceTransform = `rotateY(${face.az}deg) rotateX(${face.el}deg) rotateZ(${
              invRot + rz
            }deg) translateZ(${inradius}px)`;

            // Display text: for d100, if this is target face and value has ones digit, display exact rolled value!
            const displayText =
              dieType === 'd100' && isTargetFace && !rolling
                ? `${value}`
                : face.displayStr;

            return (
              <div
                key={`face-${face.val}-${face.az}`}
                data-testid={`dice-${dieType}-face-${face.val}`}
                className="absolute inset-0 flex items-center justify-center backface-hidden polyhedral-face"
                style={{
                  width: `${faceWidth}px`,
                  height: `${faceHeight}px`,
                  transformOrigin: '50% 50%',
                  transform: faceTransform,
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
              >
                {/* Vector SVG facet geometry */}
                <svg
                  viewBox="0 0 100 100"
                  className="w-full h-full drop-shadow-md overflow-visible"
                >
                  <defs>
                    <linearGradient
                      id={`${testId}-obsidian-grad-${dieType}-${face.val}`}
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#252b3d" />
                      <stop offset="50%" stopColor="#121622" />
                      <stop offset="100%" stopColor="#080a11" />
                    </linearGradient>

                    <linearGradient
                      id={`${testId}-crit-gold-grad-${dieType}-${face.val}`}
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#fef08a" />
                      <stop offset="45%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#b45309" />
                    </linearGradient>

                    <linearGradient
                      id={`${testId}-fumble-crimson-grad-${dieType}-${face.val}`}
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#991b1b" />
                      <stop offset="50%" stopColor="#581010" />
                      <stop offset="100%" stopColor="#2b0505" />
                    </linearGradient>
                  </defs>

                  {/* Polygon facet paths based on shapeType */}
                  {shapeType === 'triangle' && (
                    <>
                      <polygon
                        points="50,3.81 90,73.09 10,73.09"
                        fill={
                          isCritFace
                            ? `url(#${testId}-crit-gold-grad-${dieType}-${face.val})`
                            : isFumbleFace
                            ? `url(#${testId}-fumble-crimson-grad-${dieType}-${face.val})`
                            : `url(#${testId}-obsidian-grad-${dieType}-${face.val})`
                        }
                        stroke={
                          isCritFace
                            ? '#fef08a'
                            : isFumbleFace
                            ? '#f87171'
                            : isTargetFace && !rolling
                            ? '#f59e0b'
                            : '#92400e'
                        }
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                      />
                      {/* Inner Runic Inset Border */}
                      <polygon
                        points="50,13.05 82,68.48 18,68.48"
                        fill="none"
                        stroke={
                          isCritFace
                            ? 'rgba(255,255,255,0.45)'
                            : isFumbleFace
                            ? 'rgba(248,113,113,0.3)'
                            : 'rgba(245,158,11,0.25)'
                        }
                        strokeWidth="1"
                        strokeDasharray="4 2"
                      />
                    </>
                  )}

                  {shapeType === 'square' && (
                    <>
                      <rect
                        x="10"
                        y="10"
                        width="80"
                        height="80"
                        rx="8"
                        fill={
                          isCritFace
                            ? `url(#${testId}-crit-gold-grad-${dieType}-${face.val})`
                            : isFumbleFace
                            ? `url(#${testId}-fumble-crimson-grad-${dieType}-${face.val})`
                            : `url(#${testId}-obsidian-grad-${dieType}-${face.val})`
                        }
                        stroke={
                          isCritFace
                            ? '#fef08a'
                            : isFumbleFace
                            ? '#f87171'
                            : isTargetFace && !rolling
                            ? '#f59e0b'
                            : '#92400e'
                        }
                        strokeWidth="3"
                      />
                      <rect
                        x="16"
                        y="16"
                        width="68"
                        height="68"
                        rx="5"
                        fill="none"
                        stroke="rgba(245,158,11,0.25)"
                        strokeWidth="1"
                        strokeDasharray="4 2"
                      />
                    </>
                  )}

                  {shapeType === 'kite' && (
                    <>
                      <polygon
                        points="50,6 92,45 50,94 8,45"
                        fill={
                          isCritFace
                            ? `url(#${testId}-crit-gold-grad-${dieType}-${face.val})`
                            : isFumbleFace
                            ? `url(#${testId}-fumble-crimson-grad-${dieType}-${face.val})`
                            : `url(#${testId}-obsidian-grad-${dieType}-${face.val})`
                        }
                        stroke={
                          isCritFace
                            ? '#fef08a'
                            : isFumbleFace
                            ? '#f87171'
                            : isTargetFace && !rolling
                            ? '#f59e0b'
                            : '#92400e'
                        }
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                      />
                      <polygon
                        points="50,14 84,45 50,86 16,45"
                        fill="none"
                        stroke="rgba(245,158,11,0.25)"
                        strokeWidth="1"
                        strokeDasharray="3 2"
                      />
                    </>
                  )}

                  {shapeType === 'pentagon' && (
                    <>
                      <polygon
                        points="50,8 89.94,37.02 74.69,83.98 25.31,83.98 10.06,37.02"
                        fill={
                          isCritFace
                            ? `url(#${testId}-crit-gold-grad-${dieType}-${face.val})`
                            : isFumbleFace
                            ? `url(#${testId}-fumble-crimson-grad-${dieType}-${face.val})`
                            : `url(#${testId}-obsidian-grad-${dieType}-${face.val})`
                        }
                        stroke={
                          isCritFace
                            ? '#fef08a'
                            : isFumbleFace
                            ? '#f87171'
                            : isTargetFace && !rolling
                            ? '#f59e0b'
                            : '#92400e'
                        }
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                      />
                      <polygon
                        points="50,16 82.34,39.5 70,77.5 30,77.5 17.66,39.5"
                        fill="none"
                        stroke="rgba(245,158,11,0.25)"
                        strokeWidth="1"
                        strokeDasharray="3 2"
                      />
                    </>
                  )}

                  {/* Number Glyph */}
                  <text
                    x="50"
                    y={
                      shapeType === 'triangle'
                        ? '54'
                        : shapeType === 'kite'
                        ? '50'
                        : shapeType === 'pentagon'
                        ? '52'
                        : '52'
                    }
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={
                      isCritFace
                        ? '#1c1917'
                        : isFumbleFace
                        ? '#fee2e2'
                        : isTargetFace && !rolling
                        ? '#fef08a'
                        : '#fcd34d'
                    }
                    fontFamily="Cinzel, serif"
                    fontWeight="900"
                    fontSize={
                      displayText.length >= 3
                        ? '20'
                        : displayText.length === 2
                        ? '24'
                        : '30'
                    }
                    style={{
                      letterSpacing: '-0.02em',
                      filter: isCritFace
                        ? 'drop-shadow(0 0 2px rgba(254,240,138,0.8))'
                        : isFumbleFace
                        ? 'drop-shadow(0 0 3px rgba(248,113,113,0.8))'
                        : isTargetFace && !rolling
                        ? 'drop-shadow(0 0 4px rgba(245,158,11,0.7))'
                        : 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))',
                    }}
                  >
                    {displayText}
                  </text>
                </svg>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sublabel or Kept/Discarded Badge */}
      <div className="mt-2 flex flex-col items-center">
        {isKept !== undefined && !rolling && (
          <span
            className={`text-[10px] font-cinzel font-black uppercase px-2.5 py-0.5 rounded-full border tracking-widest ${
              isKept
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                : 'bg-stone-900/60 text-stone-500 border-stone-800 line-through'
            }`}
          >
            {isKept ? 'KEPT' : 'DISCARDED'}
          </span>
        )}
        {subLabel && (
          <span className="text-[10px] font-cinzel uppercase font-bold tracking-widest text-amber-300/80 mt-0.5">
            {subLabel}
          </span>
        )}
      </div>
    </div>
  );
}
