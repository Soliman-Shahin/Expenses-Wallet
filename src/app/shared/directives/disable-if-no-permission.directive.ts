/**
 * Disable If No Permission Directive
 *
 * Attribute directive that disables elements if user doesn't have permission.
 * Useful for buttons and form controls.
 */

import {
  Directive,
  Input,
  ElementRef,
  Renderer2,
  OnInit,
  inject,
  effect,
} from '@angular/core';
import { PermissionService } from '../../core/services/permission.service';
import { Permission } from '../models/plan.model';

@Directive({
  selector: '[appDisableIfNoPermission]',
  standalone: true,
})
export class DisableIfNoPermissionDirective implements OnInit {
  @Input() appDisableIfNoPermission!: Permission;
  @Input() appDisableIfNoPermissionTooltip?: string;

  private permissionService = inject(PermissionService);
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  constructor() {
    // Use effect to react to permission changes
    effect(() => {
      // Access permissions signal to trigger effect
      this.permissionService.permissions();
      this.updateState();
    });
  }

  ngOnInit(): void {
    this.updateState();
  }

  private updateState(): void {
    const hasPermission = this.permissionService.hasPermission(
      this.appDisableIfNoPermission
    );

    if (!hasPermission) {
      // Disable the element
      this.renderer.setAttribute(this.el.nativeElement, 'disabled', 'true');
      this.renderer.addClass(this.el.nativeElement, 'permission-disabled');
      
      // Add opacity for visual feedback
      this.renderer.setStyle(this.el.nativeElement, 'opacity', '0.5');
      this.renderer.setStyle(this.el.nativeElement, 'cursor', 'not-allowed');
      
      // Add tooltip if provided
      if (this.appDisableIfNoPermissionTooltip) {
        this.renderer.setAttribute(
          this.el.nativeElement,
          'title',
          this.appDisableIfNoPermissionTooltip
        );
      }
    } else {
      // Enable the element
      this.renderer.removeAttribute(this.el.nativeElement, 'disabled');
      this.renderer.removeClass(this.el.nativeElement, 'permission-disabled');
      this.renderer.removeStyle(this.el.nativeElement, 'opacity');
      this.renderer.removeStyle(this.el.nativeElement, 'cursor');
      
      if (this.appDisableIfNoPermissionTooltip) {
        this.renderer.removeAttribute(this.el.nativeElement, 'title');
      }
    }
  }
}
