import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AuthGuard } from './guards/auth.guard';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import {UsersPageComponent} from './pages/users-page/users-page.component';
import {ProfilePageComponent} from './pages/profile-page/profile-page.component';
import {ConnectPageComponent} from './pages/connect-page/connect-page.component';
import {EventsPageComponent} from './pages/events-page/events-page.component';
import {NormalizedSkillsPageComponent} from './pages/normalized-skills-page/normalized-skills-page.component';
import {AdminGuard} from './guards/admin.guard';

const routes: Routes = [
  {
    path: 'login',
    component: LoginPageComponent,
  },
  {
    path: 'users',
    component: UsersPageComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'profiles/:userUid',
    component: ProfilePageComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'connect/:website',
    component: ConnectPageComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'events/:userUid',
    component: EventsPageComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'normalized-skills',
    component: NormalizedSkillsPageComponent,
    canActivate: [AuthGuard, AdminGuard],
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'users',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
