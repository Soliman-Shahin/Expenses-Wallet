import { Component, OnInit } from '@angular/core';
import { BaseComponent } from 'src/app/shared/base/base.component';
import { BiometricService } from 'src/app/core/services/biometric.service';

@Component({
  selector: 'app-settings-list',
  templateUrl: './settings-list.component.html',
  styleUrls: ['./settings-list.component.scss'],
})
export class SettingsListComponent extends BaseComponent implements OnInit {
  biometricAvailable = false;
  biometricEnabled = false;

  constructor(private biometricService: BiometricService) {
    super();
  }

  override async ngOnInit() {
    super.ngOnInit();
    this.biometricAvailable = await this.biometricService.isAvailable();
    this.biometricEnabled = this.biometricService.isEnabled;
  }

  async toggleBiometric(event: any) {
    const isEnabled = event.detail.checked;

    if (isEnabled) {
      // Verify identity before enabling
      const verified = await this.biometricService.verifyIdentity();
      if (verified) {
        await this.biometricService.setEnabled(true);
        this.biometricEnabled = true;
      } else {
        // Revert toggle if verification failed
        event.target.checked = false;
        this.biometricEnabled = false;
      }
    } else {
      await this.biometricService.setEnabled(false);
      this.biometricEnabled = false;
    }
  }
}
