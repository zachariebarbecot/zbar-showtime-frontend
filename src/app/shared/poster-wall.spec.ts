import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { POSTER_WALL } from './fixtures/posters';
import { PosterWall } from './poster-wall';

describe('PosterWall', () => {
  async function render(): Promise<HTMLElement> {
    TestBed.configureTestingModule({ providers: [provideHttpClientTesting()] });
    const fixture = TestBed.createComponent(PosterWall);
    await fixture.whenStable();
    return fixture.nativeElement;
  }

  const titles = POSTER_WALL.flat().map((poster) => poster.title);

  it('should show every fixture poster with its title on a raised surface', async () => {
    const wall = await render();

    const posters = Array.from(wall.querySelectorAll('.zb-poster'));

    expect(posters.map((p) => p.querySelector('.zb-poster-title')?.textContent)).toEqual(titles);
    posters.forEach((p) => expect(p.querySelector('.zb-poster-frame')).not.toBeNull());
  });

  it('should lay the posters out in the columns of the fixtures', async () => {
    const wall = await render();

    const columns = Array.from(wall.querySelectorAll('.pw-col'));

    expect(columns.map((c) => c.querySelectorAll('.zb-poster').length)).toEqual(
      POSTER_WALL.map((column) => column.length),
    );
  });

  it('should contain no image and send no request', async () => {
    const wall = await render();

    expect(wall.querySelector('img')).toBeNull();
    TestBed.inject(HttpTestingController).verify();
  });

  it('should be hidden from assistive technologies and not focusable', async () => {
    const wall = await render();

    const root = wall.querySelector('.pw') as HTMLElement;

    expect(root.getAttribute('aria-hidden')).toBe('true');
    expect(root.querySelectorAll('a, button, input, [tabindex]')).toHaveLength(0);
  });
});
