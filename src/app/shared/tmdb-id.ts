import { HttpErrorResponse } from '@angular/common/http';
import { ParamMap } from '@angular/router';

export const tmdbIdOf = (params: ParamMap): number | undefined => {
  const id = Number(params.get('tmdbId'));
  return Number.isInteger(id) && id > 0 ? id : undefined;
};

export const isNotFound = (error: unknown): boolean =>
  error instanceof HttpErrorResponse && (error.status === 404 || error.status === 400);
