import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  forwardRef,
  Injector,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
  NgControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { IonicModule, IonInput } from '@ionic/angular';
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

  // New dynamic UI inputs
  @Input() hint?: string;
  @Input() maxLength?: number;
  @Input() clearable = false;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() variant: 'filled' | 'outline' | 'ghost' = 'filled';
  @Input() glass = false;
  @Input() shape: 'rounded' | 'pill' = 'rounded';
  @Input() labelPlacement: 'floating' | 'stacked' | 'fixed' = 'floating';

  hide = true;
  value: any = '';
  disabled = false;
  focused = false;

  @ViewChild(IonInput) inputRef?: IonInput;

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

  get hasValue(): boolean {
    return (
      this.value !== undefined &&
      this.value !== null &&
      `${this.value}`.length > 0
    );
  }

  clear(): void {
    if (this.disabled) return;
    this.value = '';
    this.onChange('');
    // try to restore focus for better UX
    setTimeout(() => this.inputRef?.setFocus && this.inputRef.setFocus(), 0);
  }
}
