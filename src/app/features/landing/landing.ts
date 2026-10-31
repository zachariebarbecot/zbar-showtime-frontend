import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PosterWall } from '../../shared/poster-wall';
import { Button } from '../../ui/button/button';
import { CastCard } from '../../ui/cast-card/cast-card';
import { EpisodeRow } from '../../ui/episode-row/episode-row';
import { Logo } from '../../ui/logo/logo';
import { StatusButton } from '../../ui/status-button/status-button';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-landing',
  imports: [Button, CastCard, EpisodeRow, Logo, PosterWall, StatusButton],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing {
  protected readonly inWatchlist = signal(true);
  protected readonly isSeen = signal(false);
  protected readonly episodes = [
    { number: 3, title: 'Who Is Alive?', runtime: 51, seen: signal(true) },
    { number: 4, title: 'Woe’s Hollow', runtime: 49, seen: signal(false) },
    { number: 5, title: 'Trojan’s Horse', runtime: 53, seen: signal(false) },
  ];
  protected readonly cast = [
    { name: 'Adam Scott', character: 'Mark S.' },
    { name: 'Britt Lower', character: 'Helly R.' },
    { name: 'Zach Cherry', character: 'Dylan G.' },
  ];
}
