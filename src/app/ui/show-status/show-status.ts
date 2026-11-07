import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ShowStatusValue =
  | 'RETURNING'
  | 'IN_PRODUCTION'
  | 'PLANNED'
  | 'PILOT'
  | 'ENDED'
  | 'CANCELED';

const STATUSES: Record<ShowStatusValue, { readonly label: string; readonly tone: string }> = {
  RETURNING: { label: 'En cours de diffusion', tone: 'live' },
  IN_PRODUCTION: { label: 'En production', tone: 'soon' },
  PLANNED: { label: 'Prévue', tone: 'soon' },
  PILOT: { label: 'Pilote', tone: 'soon' },
  ENDED: { label: 'Terminée', tone: 'ended' },
  CANCELED: { label: 'Annulée', tone: 'canceled' },
};

export const isShowStatus = (status: string | undefined): status is ShowStatusValue =>
  status !== undefined && Object.hasOwn(STATUSES, status);

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-show-status',
  template: `
    <span [class]="'zb-tag zb-tag-' + statuses[status()].tone">
      <span class="zb-tag-dot" aria-hidden="true"></span>{{ statuses[status()].label }}
    </span>
  `,
  host: { style: 'display: contents' },
})
export class ShowStatus {
  readonly status = input.required<ShowStatusValue>();

  protected readonly statuses = STATUSES;
}
