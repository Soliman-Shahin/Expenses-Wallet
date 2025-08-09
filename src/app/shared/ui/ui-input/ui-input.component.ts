import { CommonModule } from '@angular/common';
import { Component, Input, forwardRef, Injector, OnInit } from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
  NgControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-ui-input',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
  templateUrl: './ui-input.component.html',
  styleUrls: ['./ui-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiInputComponent),
      multi: true,
    },
  ],
})
export class UiInputComponent implements ControlValueAccessor, OnInit {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() type: 'text' | 'email' | 'password' | 'number' = 'text';
  @Input() startIcon?: string;
  @Input() endIcon?: string;
  @Input() togglePassword = false;
  @Input() autocomplete?: string;
  @Input() inputmode?: string;
  @Input() required: boolean | string = false;
  @Input() id?: string;

  hide = true;
  value: any = '';
  disabled = false;

  public ngControl?: NgControl;
  constructor(private injector: Injector) {}

  ngOnInit(): void {
    try {
      // Resolve NgControl lazily to avoid DI cycle during component construction
      this.ngControl = this.injector.get(NgControl, undefined as any);
    } catch {
      this.ngControl = undefined;
    }
  }

  // ControlValueAccessor
  onChange: (val: any) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(obj: any): void {
    this.value = obj ?? '';
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  get isInvalid(): boolean {
    const c = this.ngControl?.control;
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  get ariaInvalid(): 'true' | 'false' {
    return this.isInvalid ? 'true' : 'false';
  }

  togglePasswordVisibility(): void {
    if (this.type === 'password' && this.togglePassword) {
      this.hide = !this.hide;
    }
  }
}
