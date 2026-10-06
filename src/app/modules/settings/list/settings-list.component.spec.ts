import {
  NOTIFICATION_CATEGORY_PRESENTATION,
  NOTIFICATION_CHANNEL_PRESENTATION,
} from '../notification-preferences/notification-preferences.constants';

describe('settings notification category presentation', () => {
  it('keeps the required category order and policy', () => {
    expect(
      NOTIFICATION_CATEGORY_PRESENTATION.map((category) => category.key)
    ).toEqual(['security', 'general', 'sync', 'subscription']);
    expect(
      NOTIFICATION_CATEGORY_PRESENTATION.slice(0, 2).every(
        (category) => category.mandatory
      )
    ).toBeTrue();
    expect(
      NOTIFICATION_CATEGORY_PRESENTATION.slice(2).every(
        (category) => !category.mandatory
      )
    ).toBeTrue();
  });

  it('defines independent controls for every optional channel', () => {
    expect(
      NOTIFICATION_CHANNEL_PRESENTATION.map((channel) => channel.key)
    ).toEqual(['inbox', 'realtime', 'push']);
  });
});
