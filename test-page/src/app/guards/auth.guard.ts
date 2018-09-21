/**
 * Guard that ensures that the user is logged-in/authenticated, and redirects to login/register if not.
**/
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { map, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) { }

  canActivate(next: ActivatedRouteSnapshot): Observable<boolean> {
    return this.auth.credentials$.pipe(
      map(Boolean),
      tap(hasCredentials => {
        if (!hasCredentials) {
          this.router.navigateByUrl('login');
        }
      }),
    );
  }
}
