import { Activity, GraduationCap, Headset, Gift, BellRing, type LucideIcon } from 'lucide-react';
import type { ActionType } from '@/lib/types';

const ICONS: Record<string, LucideIcon> = {
  Activity,
  GraduationCap,
  Headset,
  Gift,
  BellRing,
};

export function ActionIcon({
  action,
  size = 16,
  className = '',
}: {
  action: ActionType;
  size?: number;
  className?: string;
}) {
  const map: Record<ActionType, string> = {
    guided_tutorial: 'GraduationCap',
    proactive_nudge: 'BellRing',
    human_handoff: 'Headset',
    incentive: 'Gift',
  };
  const Icon = ICONS[map[action]];
  return <Icon size={size} className={className} />;
}
