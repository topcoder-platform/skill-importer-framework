import { BehaviorSubject, Observable } from 'rxjs';
import { DataSource } from '@angular/cdk/collections';
import { finalize, map, tap } from 'rxjs/operators';

import { PaginatedService } from '../interfaces/paginated-service';
import { PaginatedQuery } from '../interfaces/paginated-query';

export class PaginatedDataSource<T> implements DataSource<T> {
  private countSubject = new BehaviorSubject<number>(0);
  private dataSubject = new BehaviorSubject<T[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  public loading$ = this.loadingSubject.asObservable();
  public totalCount$ = this.countSubject.asObservable();

  constructor(private service: PaginatedService<T>) { }

  connect(): Observable<T[]> {
    return this.dataSubject.asObservable();
  }

  disconnect() {
    this.countSubject.complete();
    this.dataSubject.complete();
    this.loadingSubject.complete();
  }

  load(query: PaginatedQuery) {
    this.loadingSubject.next(true);
    this.service.get(query).pipe(
      tap(res => this.countSubject.next(res['total'])),
      map(res => res['items']),
      finalize(() => this.loadingSubject.next(false)),
    ).subscribe(data => this.dataSubject.next(data));
  }

  reset() {
    this.countSubject.next(0);
    this.dataSubject.next([]);
  }
}
