import { SCORE_COLOR } from '@/types';

interface ProgressBarProps {
  label: string;
  value: number;
  showValue?: boolean;
  colorByScore?: boolean;
  color?: string;
}

export function ProgressBar({ label, value, showValue = true, colorByScore = true, color }: ProgressBarProps) {
  const barColor = color || (colorByScore ? SCORE_COLOR(value) : '#4f8ef7');

  return (
    <div className="mb-3">
      <div className="flex justify-between text-[11px] text-white/40 mb-1.5">
        <span>{label}</span>
        {showValue && <span style={{ color: barColor }}>{value}%</span>}
      </div>
      <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, background: barColor }}
        />
      </div>
    </div>
  );
}
