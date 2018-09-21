import { Component, OnInit } from '@angular/core';

import { ToolbarService } from '../../services/toolbar.service';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit {

  constructor(private toolbar: ToolbarService) { }

  ngOnInit() {
    this.toolbar.setTitle('Home Page');
  }

}
