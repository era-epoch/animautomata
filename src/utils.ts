/**
 * Clamps candidate value between min and max.
 */
export const clamp = (min: number, candidate: number, max: number): number => {
  return Math.max(min, Math.min(max, candidate));
};


/**
 * Mathematical modulo function.
 * @param n
 * @param m
 * @returns n mod m
 */
export const modulo = (n: number, m: number): number => {
  return ((n % m) + m) % m;
};