/**
 * Service that provides login/logout functionality, with the option of
 * saving the data to localStorage.  Provides an Observable of the user's
 * credentials.
**/
import { BehaviorSubject} from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient} from '@angular/common/http';
import { of } from 'rxjs';
import { catchError, flatMap, tap } from 'rxjs/operators';

import { Credentials } from '../interfaces/credentials';
import {Router} from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private subject = new BehaviorSubject<Credentials>(null);
  public credentials$ = this.subject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.loadCredentials();
  }

  changePassword(currentPassword: string, newPassword: string) {
    return this.http.post<any>(`/changePassword`, { currentPassword, newPassword });
  }

  login(username: string, password: string) {
    return this.http.post<Credentials>(`/login`, { username, password }).pipe(
      tap(res => this.setCredentials(res as Credentials)),
      catchError(() => of(null)),
    );
  }

  register(name: string, username: string, password: string) {
    return this.http.post<Credentials>(`/users`, { name, username, password }).pipe(
      flatMap(() => this.login(username, password)),
      catchError(() => of(null)),
    );
  }

  logout() {
    localStorage.removeItem('credentials');
    this.subject.next(null);
    this.router.navigateByUrl('login');
  }

  private loadCredentials() {
    const json = localStorage.getItem('credentials');
    if (json) {
      this.subject.next(JSON.parse(json));
    }
  }

  private setCredentials(credentials: Credentials) {
    localStorage.setItem('credentials', JSON.stringify(credentials));
    this.subject.next(credentials);
  }
}
