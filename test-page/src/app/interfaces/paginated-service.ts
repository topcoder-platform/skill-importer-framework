import { HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

import { PaginatedResponse } from './paginated-response';
import { PaginatedQuery } from './paginated-query';

export interface PaginatedService<T> {
  get(query: PaginatedQuery): Observable<HttpEvent<PaginatedResponse<T>>>;
}
