/**
 * Guard that ensures that the user is an admin.
**/
import { ActivatedRouteSnapshot, CanActivate } from '@angular/router';
import { Injectable } from '@angular/core';
import { map, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(private auth: AuthService) { }

  canActivate(next: ActivatedRouteSnapshot): Observable<boolean> {

    return this.auth.credentials$.pipe(
      map(credentials => credentials && credentials.role === 'Admin'),
    );
  }
}
