import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Skill } from '../interfaces/skill';

@Injectable({
  providedIn: 'root'
})
export class SkillsService {

  constructor(private http: HttpClient) { }

  getByUserUid(userUid: string) {
    return this.http.get<Skill[]>(`/users/${userUid}/skills`);
  }

  getByAccountUid(accountUid: string) {
    return this.http.get<Skill[]>(`/accounts/${accountUid}/skills`);
  }

  deleteByAccountAndSkillUid(accountUid: string, skillUid: string) {
    return this.http.delete<any>(`/accounts/${accountUid}/skills/${skillUid}`);
  }

  add(accountUid: string, name: string, pointType: string, points: number) {
    return this.http.post<any>(`/accounts/${accountUid}/skills`, { name, pointType, points });
  }

  update(accountUid: string, skillUid: string,  name: string, pointType: string, points: number) {
    return this.http.put<any>(`/accounts/${accountUid}/skills/${skillUid}`, { name, pointType, points });
  }
}
