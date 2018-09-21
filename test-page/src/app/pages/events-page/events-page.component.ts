import {Component, OnInit, ViewChild} from '@angular/core';
import {AuthService} from '../../services/auth.service';
import {ActivatedRoute, Router} from '@angular/router';
import {MatDialog, MatSort, MatTableDataSource} from '@angular/material';
import {ToolbarService} from '../../services/toolbar.service';
import {combineLatest} from 'rxjs';
import {DeleteConfirmDialogComponent} from '../../components/delete-confirm-dialog/delete-confirm-dialog.component';
import {Event} from '../../interfaces/event';
import {EventsService} from '../../services/events.service';

@Component({
  selector: 'app-events-page',
  templateUrl: './events-page.component.html',
  styleUrls: ['./events-page.component.scss']
})
export class EventsPageComponent implements OnInit {
  eventsData = new MatTableDataSource();
  isAdmin = false;
  tableColumns: string[];
  userUid = '';

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private auth: AuthService,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private events: EventsService,
    private router: Router,
    private toolbar: ToolbarService,
  ) {
    toolbar.setTitle('User Events');

    combineLatest(route.paramMap, auth.credentials$).subscribe(([params, credentials]) => {
      this.userUid = params.get('userUid');
      this.isAdmin = credentials.role === 'Admin';
      this.updateTableColumns();
      this.loadData();
    });
  }

  ngOnInit() {
    this.eventsData.sort = this.sort;
    this.sort.active = 'date';
    this.sort.direction = 'desc';
  }

  loadData() {
    this.eventsData.data = [];
    this.events.getByUserUid(this.userUid).subscribe(data => {
      this.eventsData.data = data;
    });
  }

  updateTableColumns() {
    this.tableColumns = ['date', 'affectedSkillName', 'affectedPointType', 'affectedPoints', 'text', 'isPrivateRepo'];
    if (this.isAdmin) {
      this.tableColumns.push('action');
    }
  }

  onDeleteEvent(event: Event) {
    const dialogRef = this.dialog.open(DeleteConfirmDialogComponent, {
      data: { message: `Are you sure that you want to delete the "${event.text}" event?`}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.events.deleteByUid(event.id).subscribe(() => {
          this.loadData();
        });
      }
    });
  }
}
