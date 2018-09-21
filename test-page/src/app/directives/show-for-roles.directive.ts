/**
 * Directive that only renders the element if a user has a role from the supplied
 * list of role names.
 **/
import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { map } from 'rxjs/operators';

import { AuthService } from '../services/auth.service';

@Directive({
  selector: '[appShowForRoles]'
})
export class ShowForRolesDirective {
  constructor(private auth: AuthService, private template: TemplateRef<any>, private view: ViewContainerRef) { }

  @Input()
  set appShowForRoles(roles: string[]) {
    this.auth.credentials$.pipe(
      map(credentials => credentials && roles.includes(credentials.role)),
    ).subscribe(isAllowed => {
      if (isAllowed) {
        this.view.createEmbeddedView(this.template);
      } else {
        this.view.clear();
      }
    });
  }
}
