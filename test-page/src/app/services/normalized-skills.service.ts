import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { NormalizedSkill } from '../interfaces/normalized-skill';

@Injectable({
  providedIn: 'root'
})
export class NormalizedSkillsService {

  constructor(private http: HttpClient) { }

  add(name: string, regex: string) {
    return this.http.post<any>('/normalizedSkillNames', { name, regex });
  }

  getAll() {
    return this.http.get<NormalizedSkill[]>('/normalizedSkillNames');
  }

  deleteByName(name: string) {
    return this.http.delete<any>(`/normalizedSkillNames/${name}`);
  }

  update(name: string, regex: string) {
    return this.http.put<any>(`/normalizedSkillNames/${name}`, { regex });
  }
}
