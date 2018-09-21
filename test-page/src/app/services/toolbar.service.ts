import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ToolbarService {
  private titleSubject = new BehaviorSubject<string>('');
  public title$ = this.titleSubject.asObservable();

  constructor() { }

  setTitle(title: string) {
    this.titleSubject.next(title);
  }
}
