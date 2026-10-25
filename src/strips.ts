// Color strips: blocks of [width, height, color], bottom-aligned, in px.
// 'accent' is the project's accent; null color is a gap.
type Color = 'accent' | 'ink' | 'orange' | null;
export type Block = [w: number, h: number, c: Color];

// Each project's strip is drawn from what it is. A new project without a
// recipe gets the default; give it its own when you can.
export const recipes: Record<string, Block[]> = {
  // append-only log: equal segments, then the index
  meeseeks: [[18, 8, 'accent'], [2, 0, null], [18, 8, 'accent'], [2, 0, null], [18, 8, 'accent'], [2, 0, null], [6, 8, 'accent'], [40, 8, 'ink'], [10, 12, 'orange']],
  // a pacman progress bar between brackets
  cronen: [[3, 14, 'ink'], [52, 8, 'accent'], [34, 2, 'ink'], [3, 14, 'ink'], [6, 0, null], [8, 8, 'orange']],
  // signal bars climbing
  paxcounter: [[6, 4, 'accent'], [3, 0, null], [6, 8, 'accent'], [3, 0, null], [6, 12, 'accent'], [3, 0, null], [6, 16, 'accent'], [6, 0, null], [50, 8, 'ink'], [4, 0, null], [12, 4, 'orange']],
  // an instrument needle on a baseline
  altimeter: [[20, 8, 'accent'], [48, 4, 'ink'], [4, 16, 'accent'], [28, 4, 'ink'], [4, 0, null], [12, 8, 'orange']],
  // Parquet columns of uneven width
  'haus-md': [[4, 12, 'accent'], [2, 0, null], [10, 12, 'accent'], [2, 0, null], [2, 12, 'accent'], [2, 0, null], [16, 12, 'accent'], [2, 0, null], [6, 12, 'accent'], [36, 8, 'ink'], [8, 8, 'orange']],
};

export const defaultRecipe: Block[] = [[36, 8, 'accent'], [52, 8, 'ink'], [14, 8, 'orange'], [4, 0, null], [8, 8, 'accent']];

// The footer strip. A number in place of a color is the project at that
// position on the index (0 = first); 'fill' entries are spacers that push the
// clusters apart by their grow ratio.
export type FooterBlock = [w: number, h: number, c: Exclude<Color, 'accent'> | number] | ['fill', number];

export const footer: FooterBlock[] = [
  [28, 6, 'ink'], [10, 12, 'orange'], [4, 0, null], [18, 6, 0],
  ['fill', 1],
  [44, 4, 1], [6, 14, 'ink'], [22, 8, 2],
  ['fill', 2],
  [6, 16, 3], [3, 0, null], [6, 10, 3],
  ['fill', 0.6],
  [40, 6, 4], [12, 6, 'ink'], [4, 16, 'orange'],
];

export function cssColor(c: Color | string): string | undefined {
  if (c === null) return undefined;
  if (c === 'accent' || c === 'ink' || c === 'orange') return `var(--${c})`;
  return c;
}
