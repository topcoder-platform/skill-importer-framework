import {Component, OnInit, ViewChild} from '@angular/core';
import {PaginatedDataSource} from '../../classes/paginated-data-source';
import {User} from '../../interfaces/user';
import {PaginatedQuery} from '../../interfaces/paginated-query';
import {MatPaginator} from '@angular/material';
import {UsersService} from '../../services/users.service';
import {ToolbarService} from '../../services/toolbar.service';

@Component({
  selector: 'app-users-page',
  templateUrl: './users-page.component.html',
  styleUrls: ['./users-page.component.scss']
})
export class UsersPageComponent implements OnInit {
  dataSource: PaginatedDataSource<User>;
  displayedColumns = [
    'username',
    'name',
  ];
  field = '';
  term = '';
  query: PaginatedQuery;

  @ViewChild(MatPaginator) private paginator: MatPaginator;

  constructor(private toolbar: ToolbarService, private users: UsersService) {
    toolbar.setTitle('User Search Page');
  }

  ngOnInit() {
    this.dataSource = new PaginatedDataSource<User>(this.users);

    this.paginator.pageSize = 5;

    this.paginator.page.subscribe(() => {
      this.query.limit = this.paginator.pageSize;
      this.query.offset = this.paginator.pageIndex * this.paginator.pageSize;
      this.dataSource.load(this.query);
    });

    // Initialize PaginatedQuery and load initial data
    this.onReset();
    this.onSearch();
  }

  onReset() {
    this.term = '';
    this.field = '';
    this.query = {
      name: '',
      username: '',
      role: 'Member',
      limit: this.paginator.pageSize,
      offset: 0,
    };
    this.onSearch();
  }

  onSort({ active, direction }) {
    this.query.sortBy = active;
    this.query.sortDirection = direction;
    this.dataSource.load(this.query);
  }

  onSearch() {
    if (this.term && this.field) {
      this.query[this.field] = this.term;
    } else {
      this.query.name = null;
      this.query.username = null;
      this.query.skill = null;
    }
    this.paginator.pageIndex = 0;
    this.dataSource.reset();
    this.query.offset = 0;
    this.dataSource.load(this.query);
  }
}


