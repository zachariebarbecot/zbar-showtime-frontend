import { Cast } from '../api/models/cast';

export interface CastMemberView {
  readonly name: string;
  readonly character: string;
  readonly photoUrl?: string;
}

export const toCastMemberViews = (cast: readonly Cast[] | undefined): readonly CastMemberView[] =>
  (cast ?? []).flatMap(({ name, character, photoUrl }) =>
    name ? [{ name, character: character ?? '', photoUrl }] : [],
  );
