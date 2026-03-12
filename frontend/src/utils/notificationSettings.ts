import type { NotificationPreferences } from '../api/services/apiService';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  type NotificationSettings,
  type NotificationSoundType,
} from '../data/mockNavigation';

export const NOTIFICATION_SETTINGS_EVENT = 'notificationSettingsChanged';

const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';
const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isSoundType = (value: unknown): value is NotificationSoundType =>
  typeof value === 'string' && ['chime', 'bell', 'ping', 'ding', 'swoosh', 'alert', 'drop', 'soft', 'none'].includes(value);

export const mapNotificationPreferencesToSettings = (
  source?: NotificationPreferences | null,
): NotificationSettings => {
  const preferences = source?.preferences ?? {};

  return {
    ...DEFAULT_NOTIFICATION_SETTINGS,
    emailNotifications: isBoolean(source?.emailNotifications)
      ? source.emailNotifications
      : DEFAULT_NOTIFICATION_SETTINGS.emailNotifications,
    pushNotifications: isBoolean(source?.inAppNotifications)
      ? source.inAppNotifications
      : DEFAULT_NOTIFICATION_SETTINGS.pushNotifications,
    safetyAlerts: isBoolean(preferences.safetyAlerts)
      ? preferences.safetyAlerts
      : DEFAULT_NOTIFICATION_SETTINGS.safetyAlerts,
    trainingReminders: isBoolean(preferences.trainingReminders)
      ? preferences.trainingReminders
      : DEFAULT_NOTIFICATION_SETTINGS.trainingReminders,
    complianceUpdates: isBoolean(preferences.complianceUpdates)
      ? preferences.complianceUpdates
      : DEFAULT_NOTIFICATION_SETTINGS.complianceUpdates,
    auditNotifications: isBoolean(preferences.auditNotifications)
      ? preferences.auditNotifications
      : DEFAULT_NOTIFICATION_SETTINGS.auditNotifications,
    systemAlerts: isBoolean(preferences.systemAlerts)
      ? preferences.systemAlerts
      : DEFAULT_NOTIFICATION_SETTINGS.systemAlerts,
    soundEnabled: isBoolean(preferences.soundEnabled)
      ? preferences.soundEnabled
      : DEFAULT_NOTIFICATION_SETTINGS.soundEnabled,
    soundType: isSoundType(preferences.soundType)
      ? preferences.soundType
      : DEFAULT_NOTIFICATION_SETTINGS.soundType,
    badgeAnimationSpeed: isNumber(preferences.badgeAnimationSpeed)
      ? preferences.badgeAnimationSpeed
      : DEFAULT_NOTIFICATION_SETTINGS.badgeAnimationSpeed,
  };
};

export const serializeNotificationSettings = (
  settings: NotificationSettings,
  userId: string,
): NotificationPreferences => ({
  userId,
  emailNotifications: settings.emailNotifications,
  inAppNotifications: settings.pushNotifications,
  preferences: {
    safetyAlerts: settings.safetyAlerts,
    trainingReminders: settings.trainingReminders,
    complianceUpdates: settings.complianceUpdates,
    auditNotifications: settings.auditNotifications,
    systemAlerts: settings.systemAlerts,
    soundEnabled: settings.soundEnabled,
    soundType: settings.soundType,
    badgeAnimationSpeed: settings.badgeAnimationSpeed,
  },
});

export const emitNotificationSettingsChanged = (settings: NotificationSettings) => {
  window.dispatchEvent(
    new CustomEvent<NotificationSettings>(NOTIFICATION_SETTINGS_EVENT, {
      detail: settings,
    }),
  );
};