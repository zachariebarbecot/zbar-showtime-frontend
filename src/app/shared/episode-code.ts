const pad = (n: number): string => String(n).padStart(2, '0');

export function episodeCode(season: number, episode: number): string {
  return `S${pad(season)}E${pad(episode)}`;
}
