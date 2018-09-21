/**
 * Injects Authorization token and baseApiUrl into HttpClient api calls.
 **/
import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
} from '@angular/common/http';

import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

@Injectable()
export class ApiInterceptor implements HttpInterceptor {
  authToken = '';

  constructor(private auth: AuthService) {
    auth.credentials$.subscribe(credentials => {
        this.authToken = credentials ? `Bearer ${credentials.accessToken}` : '';
    });
  }

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const newReq = req.clone({
      setHeaders: { Authorization: this.authToken },
      url: `${environment.baseApiUrl}${req.url}` },
      );
    return next.handle(newReq);
  }
}
