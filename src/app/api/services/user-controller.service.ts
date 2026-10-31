import { Injectable } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { UserResponse } from '../models/user-response';

@Injectable({ providedIn: 'root' })
export class UserControllerService {
  me(): Observable<UserResponse> {
    return EMPTY;
  }
}
