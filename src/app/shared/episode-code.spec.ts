import { episodeCode } from './episode-code';

describe('episodeCode', () => {
  it.each([
    [2, 4, 'S02E04'],
    [10, 12, 'S10E12'],
  ])('should format season %i episode %i as %s', (season, episode, code) => {
    expect(episodeCode(season, episode)).toBe(code);
  });
});
