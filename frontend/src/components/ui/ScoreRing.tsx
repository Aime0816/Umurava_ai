import { SCORE_COLOR } from '@/types';

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export function ScoreRing({ score, size = 40, strokeWidth = 3 }: ScoreRingProps) {
  const radius      = (size - strokeWidth * 2) / 2;
  const center      = size / 2;
  const circumf     = 2 * Math.PI * radius;
  const dashOffset  = circumf - (score / 100) * circumf;
  const color       = SCORE_COLOR(score);
  const fontSize    = size < 38 ? '9px' : '11px';

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Track */}
        <circle
          cx={center} cy={center} r={radius}
          fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={center} cy={center} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumf}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center font-mono font-medium"
        style={{ color, fontSize }}
      >
        {score}
      </div>
    </div>
  );
}
