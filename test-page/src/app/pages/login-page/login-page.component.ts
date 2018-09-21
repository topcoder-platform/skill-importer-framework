import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import {ToolbarService} from '../../services/toolbar.service';
import {AuthService} from '../../services/auth.service';
import {MatSnackBar} from '@angular/material';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss']
})
export class LoginPageComponent implements OnInit {
  name = '';
  username = '';
  password = '';

  constructor(private auth: AuthService, private router: Router, private notify: MatSnackBar, private toolbar: ToolbarService) { }

  ngOnInit() {
    this.toolbar.setTitle('Login/Register');
  }

  onLogin() {
    this.auth.login(this.username, this.password).subscribe(res => {
      if (res) {
        this.router.navigateByUrl('');
      } else {
        this.notify.open('Could not log in with the provided username and password.', 'OK');
      }
    });
  }

  onRegister() {
    this.auth.register(this.name, this.username, this.password).subscribe(() => this.router.navigateByUrl(''));
  }

}
