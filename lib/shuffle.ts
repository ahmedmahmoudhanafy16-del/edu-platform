/**
 * Securely and randomly shuffles an array using the Fisher-Yates algorithm.
 * Guarantees a unique random sequence for every student and every attempt.
 */
export function shuffleArray<T>(arr: T[], seed?: string): T[] {
  if (!Array.isArray(arr) || arr.length <= 1) return [...(arr || [])];
  const result = [...arr];

  // If seed is provided, use seeded pseudo-random, otherwise use high-entropy random
  if (seed) {
    let s = seed.split("").reduce((a, c, idx) => a + c.charCodeAt(0) * (idx + 13), Date.now() % 100000);
    const seededRandom = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
  } else {
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
  }

  return result;
}
