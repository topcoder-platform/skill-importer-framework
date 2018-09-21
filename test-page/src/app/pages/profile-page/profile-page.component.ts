import {Component, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Account} from '../../interfaces/account';
import {ToolbarService} from '../../services/toolbar.service';
import {AccountsService} from '../../services/accounts.service';
import {catchError, flatMap, map} from 'rxjs/operators';
import {SkillsService} from '../../services/skills.service';
import {combineLatest, from, of} from 'rxjs';

import { environment } from '../../../environments/environment';
import {AuthService} from '../../services/auth.service';
import {MatDialog, MatSnackBar} from '@angular/material';
import {DeleteConfirmDialogComponent} from '../../components/delete-confirm-dialog/delete-confirm-dialog.component';
import {Skill} from '../../interfaces/skill';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss']
})
export class ProfilePageComponent implements OnInit {
  accountsData: Account[];
  currentPassword: '';
  newPassword: '';
  skillTables = [];
  userUid = '';

  accountTableColumns: string[];
  skillTableColumns: string[];

  isAdmin = false;
  isOwnProfile = false;

  newName = '';
  newPointType = '';
  newPoints = 0;

  @ViewChild('addEditModal') private addEditModal;
  @ViewChild('changePasswordForm') private changePasswordForm;

  constructor(
    private auth: AuthService,
    private route: ActivatedRoute,
    private accounts: AccountsService,
    private dialog: MatDialog,
    private router: Router,
    private skills: SkillsService,
    private toolbar: ToolbarService,
    private notify: MatSnackBar,
    ) {
    toolbar.setTitle('User Profile');

    combineLatest(route.paramMap, auth.credentials$).subscribe(([params, credentials]) => {
      this.userUid = params.get('userUid');
      this.isAdmin = credentials.role === 'Admin';
      this.isOwnProfile = this.userUid === credentials.uid;
      this.updateTableColumns();
      this.loadData();
    });
  }

  ngOnInit() {
  }

  loadData() {
    this.accountsData = [];
    this.skillTables = [];

    this.skills.getByUserUid(this.userUid).subscribe(data => {
      this.skillTables.push({
        title: 'All',
        data,
      });
    });

    this.accounts.getByUid(this.userUid).subscribe(accountsData => {
      this.accountsData = accountsData;
      from(accountsData).pipe(
        flatMap(account => this.skills.getByAccountUid(account.id).pipe(
          map(data => ({ title: account.website, accountUid: account.id, data })),
        )),
      ).subscribe(table => {
        this.skillTables.push(table);
      });
    });
  }

  updateTableColumns() {
    this.skillTableColumns = ['name', 'points', 'pointType'];
    if (this.isAdmin) {
      this.skillTableColumns.push('action');
    }

    this.accountTableColumns = ['website', 'username', 'importingStatus'];
    if (this.isAdmin || this.isOwnProfile) {
      this.accountTableColumns.push('action');
    }
  }

  onConnect(website) {
    window.location.assign(`${environment.baseApiUrl}/connect/${website}`);
  }

  onAddEdit(accountUid: string, skill?: Skill) {
    if (skill) {
      this.newName = skill.name;
      this.newPointType = skill.pointType;
      this.newPoints = skill.points;
    } else {
      this.newName = '';
      this.newPointType = '';
      this.newPoints = undefined;
    }

    const dialogRef = this.dialog.open(this.addEditModal, {
      width: '450px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && skill) {
        this.skills.update(accountUid, skill.id, this.newName, this.newPointType, this.newPoints).pipe(
          catchError(err => {
            this.notify.open(err.error.message, 'OK');
            return of(false);
          })
        ).subscribe((res) => {
          if (res) {
            this.notify.open('Skill Successfully Updated', 'OK');
            this.loadData();
          }
        });
      } else if (result) {
        this.skills.add(accountUid, this.newName, this.newPointType, this.newPoints).pipe(
          catchError(err => {
            this.notify.open(err.error.message, 'OK');
            return of(false);
          })
        ).subscribe((res) => {
          if (res) {
            this.notify.open('Skill Successfully Added', 'OK');
            this.loadData();
          }
        });
      }
    });
  }

  onDeleteAccount(account: Account) {
    const dialogRef = this.dialog.open(DeleteConfirmDialogComponent, {
      data: { message: `Are you sure that you want to delete your ${account.website} account?`}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.accounts.deleteByUid(account.id).subscribe(() => {
          this.loadData();
        });
      }
    });
  }

  onDeleteSkill(skill: Skill) {
    const dialogRef = this.dialog.open(DeleteConfirmDialogComponent, {
      data: { message: `Are you sure that you want to delete the ${skill.name} ${skill.pointType} skill?`}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.skills.deleteByAccountAndSkillUid(skill.accountId, skill.id).subscribe(() => {
          this.loadData();
        });
      }
    });
  }

  onChangePassword() {
    this.auth.changePassword(this.currentPassword, this.newPassword).pipe(
      catchError(err => of(err.error.message))
    ).subscribe(error => {
      if (error) {
        this.notify.open(error, 'OK');
      } else {
        this.changePasswordForm.resetForm();
        this.notify.open('Password Successfully Changed', 'OK');
      }
    });
  }

}
