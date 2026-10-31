import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Poster } from '../ui/poster/poster';
import { POSTER_WALL } from './fixtures/posters';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-poster-wall',
  imports: [Poster],
  template: `
    <div class="pw" aria-hidden="true">
      @for (column of columns; track $index) {
        <div class="pw-col">
          @for (poster of column; track poster.title) {
            <app-poster
              class="pw-poster"
              [title]="poster.title"
              [status]="poster.status"
              [next]="poster.next"
              [progress]="poster.progress"
            />
          }
        </div>
      }
    </div>
  `,
  styles: `
    .pw {
      height: 620px;
      overflow: hidden;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: var(--space-4);
      border-radius: var(--radius-md);
    }
    .pw-col {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }
    .pw-col:nth-child(2) {
      margin-top: -96px;
    }
    .pw-col:nth-child(3) {
      margin-top: 48px;
    }
    .pw-col:nth-child(4) {
      display: none;
    }
    .pw-poster {
      --poster-width: 100%;
    }

    @media (max-width: 1023px) {
      .pw {
        height: 360px;
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
      .pw-col:nth-child(4) {
        display: flex;
        margin-top: -48px;
      }
    }
    @media (max-width: 599px) {
      .pw {
        height: 260px;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: var(--space-2);
      }
      .pw-col:nth-child(4) {
        display: none;
      }
    }
  `,
})
export class PosterWall {
  protected readonly columns = POSTER_WALL;
}
