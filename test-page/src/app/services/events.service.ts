import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Event } from '../interfaces/event';

@Injectable({
  providedIn: 'root'
})
export class EventsService {

  constructor(private http: HttpClient) { }

  getByUserUid(userUid: string) {
    return this.http.get<Event[]>(`/events?userUid=${userUid}`);
  }

  deleteByUid(eventUid: string) {
    return this.http.delete<any>(`/events/${eventUid}`);
  }
}
