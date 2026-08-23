export function shuffleArray<T>(arr: T[], seed?: string): T[] {
  const result = [...arr];
  let s = seed
    ? seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
    : Math.random() * 1000;

  const seededRandom = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
