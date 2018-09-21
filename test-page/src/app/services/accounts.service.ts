import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Account } from '../interfaces/account';

@Injectable({
  providedIn: 'root'
})
export class AccountsService {

  constructor(private http: HttpClient) { }

  connect(website: string, code: string) {
    return this.http.get<any>(`/connect/${website}/callback?code=${code}`);
  }

  getByUid(userUid: string) {
    return this.http.get<Account[]>(`/accounts?userUid=${userUid}`);
  }

  deleteByUid(accountUid: string) {
    return this.http.delete<any>(`/accounts/${accountUid}`);
  }
}
