type ClassValue = string | number | false | null | undefined;

/**
 * Tiny classnames joiner for conditional Tailwind class lists. The project
 * doesn't pull in `clsx`/`tailwind-merge`, so this keeps components that need
 * to combine a handful of conditional classes readable without adding a
 * dependency.
 */
export function cx(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
