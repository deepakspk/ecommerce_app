import { colors } from '@/theme';

/**
 * Deterministic name/email -> color + initials fallback, used when a user has
 * no avatar photo set (ports the web app's initials-avatar logic,
 * 01-DOCUMENTATION.md §8 `Avatar`). Palette is drawn from existing theme
 * tokens rather than introducing new hex values.
 */
const PALETTE = [colors.brand600, colors.success600, colors.warning600, colors.danger600, colors.info600];

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getAvatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}
