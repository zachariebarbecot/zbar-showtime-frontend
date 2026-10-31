import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ApiConfiguration } from './api/api-configuration';
import { UserResponse } from './api/models/user-response';
import { UserControllerService } from './api/services/user-controller.service';

describe('generated API client', () => {
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    TestBed.inject(ApiConfiguration).rootUrl = 'http://api.test';
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('calls an operation through its typed service method', () => {
    const profile: UserResponse = { email: 'jane@example.com' };
    let received: UserResponse | undefined;

    TestBed.inject(UserControllerService)
      .me()
      .subscribe((user) => (received = user));
    const request = backend.expectOne('http://api.test/users/me');
    request.flush(profile);

    expect(request.request.method).toBe('GET');
    expect(received).toEqual(profile);
  });
});
