import { Component, OnInit } from '@angular/core';
import {combineLatest, of} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {catchError, flatMap} from 'rxjs/operators';
import {AccountsService} from '../../services/accounts.service';

@Component({
  selector: 'app-connect-page',
  templateUrl: './connect-page.component.html',
  styleUrls: ['./connect-page.component.scss']
})
export class ConnectPageComponent implements OnInit {
  inProgress = true;
  error = '';
  website = '';

  constructor(private route: ActivatedRoute, private accounts: AccountsService) {
    combineLatest(route.paramMap, route.queryParamMap).pipe(
      flatMap(([params, queries]) => {
        this.website = params.get('website');
        const code = queries.get('code');
        return accounts.connect(this.website, code);
      }),
      catchError(error => {
        this.error = error.error.message;
        return of(null);
      })
    ).subscribe(() => {
      this.inProgress = false;
    });
  }

  ngOnInit() {
  }

}
