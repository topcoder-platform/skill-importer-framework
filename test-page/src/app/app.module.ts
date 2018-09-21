import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import { NavComponent } from './components/nav/nav.component';
import { LayoutModule } from '@angular/cdk/layout';
import {
  MatToolbarModule,
  MatButtonModule,
  MatCardModule,
  MatSidenavModule,
  MatIconModule,
  MatListModule,
  MatTabsModule,
  MatFormFieldModule,
  MatInputModule,
  MatPaginatorModule,
  MatTableModule,
  MatProgressSpinnerModule,
  MatSortModule,
  MatSnackBarModule,
  MatDialogModule,
  MatSelectModule,
} from '@angular/material';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { ShowForRolesDirective } from './directives/show-for-roles.directive';
import {ApiInterceptor} from './http-interceptors/api-interceptor';
import { ProfilePageComponent } from './pages/profile-page/profile-page.component';
import { UsersPageComponent } from './pages/users-page/users-page.component';
import { DeleteConfirmDialogComponent } from './components/delete-confirm-dialog/delete-confirm-dialog.component';
import { ConnectPageComponent } from './pages/connect-page/connect-page.component';
import { EventsPageComponent } from './pages/events-page/events-page.component';
import { NormalizedSkillsPageComponent } from './pages/normalized-skills-page/normalized-skills-page.component';

@NgModule({
  declarations: [
    AppComponent,
    NavComponent,
    HomePageComponent,
    LoginPageComponent,
    ShowForRolesDirective,
    ProfilePageComponent,
    UsersPageComponent,
    DeleteConfirmDialogComponent,
    ConnectPageComponent,
    EventsPageComponent,
    NormalizedSkillsPageComponent,
  ],
  entryComponents: [DeleteConfirmDialogComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    LayoutModule,
    HttpClientModule,
    FormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatCardModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSortModule,
    MatSnackBarModule,
    MatDialogModule,
    MatSelectModule,
  ],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: ApiInterceptor, multi: true }],
  bootstrap: [AppComponent]
})
export class AppModule { }
