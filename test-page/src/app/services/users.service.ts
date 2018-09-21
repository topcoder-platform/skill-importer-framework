import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { PaginatedResponse } from '../interfaces/paginated-response';
import { User } from '../interfaces/user';
import { PaginatedQuery } from '../interfaces/paginated-query';
import {PaginatedService} from '../interfaces/paginated-service';

@Injectable({
  providedIn: 'root'
})
export class UsersService implements PaginatedService<User> {

  constructor(private http: HttpClient) { }

  get(query?: PaginatedQuery) {
    const options: any = { observe: 'body' };

    if (query) {
      let params = new HttpParams();
      if (query.offset) { params = params.set('offset', query.offset.toString()); }
      if (query.limit) { params = params.set('limit', query.limit.toString()); }
      if (query.sortBy) { params = params.set('sortBy', query.sortBy as string); }
      if (query.sortDirection) { params = params.set('sortDirection', query.sortDirection as string); }
      if (query.username) { params = params.set('username', query.username as string); }
      if (query.role) { params = params.set('role', query.role as string); }
      if (query.name) { params = params.set('name', query.name as string); }
      if (query.skill) { params = params.set('skills[]', query.skill as string); }
      options.params = params;
    }

    return this.http.get<PaginatedResponse<User>>('/users', options);
  }
}
