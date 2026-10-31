import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { UserControllerService } from './api/services/user-controller.service';
import { appConfig } from './app.config';
import { TOKEN_STORAGE } from './core/auth/auth.service';

describe('generated API client in the application', () => {
  it('sends the operation on the environment API url with the Bearer token of the interceptor', () => {
    TestBed.configureTestingModule({
      providers: [
        ...appConfig.providers,
        provideHttpClientTesting(),
        {
          provide: TOKEN_STORAGE,
          useValue: { getItem: () => 'abc', setItem: () => undefined, removeItem: () => undefined },
        },
      ],
    });

    TestBed.inject(UserControllerService).me().subscribe();

    const request = TestBed.inject(HttpTestingController).expectOne('/users/me');
    expect(request.request.headers.get('Authorization')).toBe('Bearer abc');
  });
});
