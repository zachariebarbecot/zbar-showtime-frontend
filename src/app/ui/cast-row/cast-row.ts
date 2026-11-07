import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CastMemberView } from '../../shared/cast-member-view';
import { CastCard } from '../cast-card/cast-card';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-cast-row',
  imports: [CastCard],
  template: `
    @if (cast().length) {
      <section class="zb-car md-cast">
        <div class="zb-car-head">
          <h2 class="zb-car-title">Casting</h2>
        </div>
        <div class="zb-car-track">
          @for (member of cast(); track $index) {
            <app-cast-card
              [name]="member.name"
              [character]="member.character"
              [photoUrl]="member.photoUrl"
            />
          }
        </div>
      </section>
    }
  `,
  host: { style: 'display: contents' },
})
export class CastRow {
  readonly cast = input.required<readonly CastMemberView[]>();
}
