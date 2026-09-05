export function Avatar({ name, hue, size = 40 }: { name: string; hue: number; size?: number }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-display text-sm font-semibold text-white ring-1 ring-white/10"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, hsl(${hue} 70% 45%), hsl(${(hue + 40) % 360} 70% 35%))`,
        fontSize: size * 0.36,
      }}
    >
      {initials}
    </div>
  );
}
