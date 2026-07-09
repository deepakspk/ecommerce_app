/** e.g. "M / Blue" — omits an axis left at its "Default" value (single-variant products, 01-DOCUMENTATION.md §5). */
export function variantLabel(variant: { size?: string; color?: string }): string {
  return [variant.size, variant.color].filter((v) => v && v !== 'Default').join(' / ');
}
