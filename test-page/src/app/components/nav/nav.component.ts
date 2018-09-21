import { Component } from '@angular/core';
import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ToolbarService } from '../../services/toolbar.service';
import {AuthService} from '../../services/auth.service';
import {Credentials} from '../../interfaces/credentials';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss']
})
export class NavComponent {
  credentials: Credentials;

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches)
    );

  constructor(private auth: AuthService, private breakpointObserver: BreakpointObserver, public toolbar: ToolbarService) {
    auth.credentials$.subscribe(credentials => {
      this.credentials = credentials;
    });
  }

  onLogout() {
    this.auth.logout();
  }
}
