const AVATAR_COLORS = [
  { bg: 'rgba(79,142,247,0.2)',  text: '#7cb9ff' },
  { bg: 'rgba(167,139,250,0.2)', text: '#c4b5fd' },
  { bg: 'rgba(52,211,153,0.2)',  text: '#6ee7b7' },
  { bg: 'rgba(251,146,60,0.2)',  text: '#fdba74' },
  { bg: 'rgba(244,114,182,0.2)', text: '#f9a8d4' },
];

interface AvatarProps {
  firstName: string;
  lastName: string;
  index?: number;
  size?: number;
}

export function Avatar({ firstName, lastName, index = 0, size = 38 }: AvatarProps) {
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const initials = `${firstName[0] || '?'}${lastName[0] || ''}`;

  return (
    <div
      className="rounded-full flex items-center justify-center font-medium flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: color.bg,
        color: color.text,
        fontSize: size < 36 ? '11px' : '13px',
      }}
    >
      {initials}
    </div>
  );
}
