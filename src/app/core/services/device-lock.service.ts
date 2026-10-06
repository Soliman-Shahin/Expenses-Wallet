import { Injectable } from '@angular/core';
import { Capacitor, registerPlugin } from '@capacitor/core';

interface DeviceLockPlugin {
  addListener(eventName: 'deviceScreenLocked', listenerFunc: () => void): Promise<{ remove: () => Promise<void> }>;
}

const DeviceLock = registerPlugin<DeviceLockPlugin>('DeviceLock');

@Injectable({ providedIn: 'root' })
export class DeviceLockService {
  async listen(onLocked: () => void): Promise<() => Promise<void>> {
    if (!Capacitor.isNativePlatform()) return async () => undefined;
    const handle = await DeviceLock.addListener('deviceScreenLocked', onLocked);
    return () => handle.remove();
  }
}
