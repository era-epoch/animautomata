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

export const isEven = (n: number) => {
  return modulo(n, 2) == 0;
};

export const isOdd = (n: number) => {
  return modulo(n, 2) == 1;
};

/**
 * Uses Math.random() to mimic a v4 uuid. Not cryptographically secure.
 */
export const pseudoUUID = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const r = Math.floor(Math.random() * 16);
    const v = char == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
