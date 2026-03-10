'use client';

interface NotificationBadgeProps {
  count: number;
  max?: number;
  variant?: 'dot' | 'count';
  color?: string;
}

export default function NotificationBadge({
  count,
  max = 99,
  variant = 'count',
  color = '#f4212e',
}: NotificationBadgeProps) {
  // Don't render if count is 0
  if (count <= 0) return null;

  // Dot variant
  if (variant === 'dot') {
    return (
      <span
        className="absolute right-0 top-0 h-[10px] w-[10px] rounded-full border-2"
        style={{
          backgroundColor: color,
          borderColor: 'var(--background-primary)',
        }}
      />
    );
  }

  // Count variant
  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <span
      className="absolute -right-1 -top-1 flex h-[18px] items-center justify-center rounded-full border-2 px-1.5 text-[11px] font-bold text-white"
      style={{
        backgroundColor: color,
        borderColor: 'var(--background-primary)',
        minWidth: '18px',
      }}
    >
      {displayCount}
    </span>
  );
}
