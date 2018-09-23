import {Component, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatSnackBar, MatTableDataSource} from '@angular/material';
import {ToolbarService} from '../../services/toolbar.service';
import {DeleteConfirmDialogComponent} from '../../components/delete-confirm-dialog/delete-confirm-dialog.component';
import {NormalizedSkillsService} from '../../services/normalized-skills.service';
import {NormalizedSkill} from '../../interfaces/normalized-skill';
import {catchError,  map, flatMap} from 'rxjs/operators';
import {of} from 'rxjs';

@Component({
  selector: 'app-normalized-skills-page',
  templateUrl: './normalized-skills-page.component.html',
  styleUrls: ['./normalized-skills-page.component.scss']
})
export class NormalizedSkillsPageComponent implements OnInit {
  dataSource = new MatTableDataSource();
  tableColumns = ['name', 'regex', 'action'];
  newName = '';
  newRegex = '';

  @ViewChild('addModal') addModal;
  @ViewChild('editModal') editModal;

  constructor(
    private dialog: MatDialog,
    private normalizedSkills: NormalizedSkillsService,
    private notify: MatSnackBar,
    private toolbar: ToolbarService,
  ) {
    toolbar.setTitle('Normalized Skills');
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.dataSource.data = [];
    this.normalizedSkills.getAll().subscribe(data => {
      this.dataSource.data = data;
    });
  }

  onAdd() {
    this.newName = '';
    this.newRegex = '';

    const dialogRef = this.dialog.open(this.addModal, {
      width: '300px',
    });

    dialogRef.afterClosed().pipe(
      flatMap(confirm => confirm ? this.normalizedSkills.add(this.newName, this.newRegex) : of(null)),
      map(res => ({ res, error: '' })),
      catchError(err => of({ res: null, error: err.error.message }))
    ).subscribe(({ res, error }) => {
      if (res) {
        this.notify.open('Normalized Skill Successfully Added.', 'OK');
        this.loadData();
      } else if (error) {
        this.notify.open(error, 'OK');
      }
    });
  }

  onEdit(normalizedSkill: NormalizedSkill) {
    this.newName = normalizedSkill.name;
    this.newRegex = normalizedSkill.regex;

    const dialogRef = this.dialog.open(this.editModal, {
      width: '300px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.notify.open('Normalized Skill Successfully Updated.', 'OK');
        this.normalizedSkills.update(this.newName, this.newRegex).subscribe(() => this.loadData());
      }
    });
  }

  onDelete(normalizedSkill: NormalizedSkill) {
    const dialogRef = this.dialog.open(DeleteConfirmDialogComponent, {
      data: { message: `Are you sure that you want to delete the "${normalizedSkill.name}" Normalized Skill?`}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.normalizedSkills.deleteByName(normalizedSkill.name).subscribe(() => {
          this.loadData();
        });
      }
    });
  }
}
