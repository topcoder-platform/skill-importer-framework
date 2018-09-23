import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Account } from '../interfaces/account';
import {map} from 'rxjs/operators';

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

  getImportStatus(accountUid: string) {
    return this.http.get<{ importingStatus: string, timestamp: string }>(`/accounts/${accountUid}/importingStatus`).pipe(
      map(res => res.importingStatus)
    );
  }

  deleteByUid(accountUid: string) {
    return this.http.delete<any>(`/accounts/${accountUid}`);
  }
}
