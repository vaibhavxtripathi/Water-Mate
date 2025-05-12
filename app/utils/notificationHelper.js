import notifee, {
  AndroidImportance,
  TriggerType,
  AuthorizationStatus,
} from "@notifee/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform, Linking, Alert } from "react-native";

const CHANNEL_ID = "watermate-reminders";
const DEFAULT_CUP_SIZE = 250;
const MIN_REMINDERS = 7;
const MAX_REMINDERS = 9;

// Notification titles for engagement
const NOTIFICATION_TITLES = [
  "icl u no water pmo 😒",
  "Dawggg… u crusty rn 💀",
  "No water? This you? 👇",
  "Ngl… go sip something rn 🫗",
  "Ye thirst wali energy off hai 😶‍🌫️",
  "Bro wake up, you need water fr fr 🥲",
  "Main hoon paani, mujhe chahiye tu 😤💧",
  "You're dryin' out! 💦",
  "Hydra-what? hydra-YOU! 🐍💦",
  "Water > Drama. stay hydrated queen. 👑💧",
  "Cmon gng, drink up!🫠",
  "You're better than 'em, drink! 🥤",
  "Hydrated ppl don't gatekeep ✨",
  "Twin your body's running on fumes 😵‍💫",
  "Canteen baad me, pehle paani! 🤨",
  "Bottoms up bbg! ❤️",
  "Geeli rizz incoming 🚰💅",
  "Tough day? Wateeerrr! 💧",
  "Open you mouth, take it all in! 💦",
  "Pani pi le, bhai 🚰",
  "Hydrate or diedrate 😵",
  "Abey chug chug kar! 🍼",
  "This ain't a thirst trap 👀💧",
  "SIP happens 🤷‍♂️",
  "Bois, it's water o'clock 🔔",
  "Water you doing, bro? 🌊",
  "Sookhe se lag rahe ho 👁👄👁",
  "Drink like your ex is watching 🥴",
  "POV: You forgot again! 😒",
  "Jal lijiye...🥛",
  "Water gives you glowww 🌟",
  "Naam batao, paani pilaun? 😉",
];

class NotificationSystem {
  static getRandomTitle() {
    return NOTIFICATION_TITLES[Math.floor(Math.random() * NOTIFICATION_TITLES.length)];
  }

  static async requestExactAlarmPermissionIfNeeded() {
    if (Platform.OS === 'android' && Platform.Version >= 31) {
      try {
        const status = await notifee.requestPermission({
          android: {
            exactAlarms: true,
          },
        });
        console.log('[Notifee] Exact alarm permission status:', status);
        // Check if permission is still not granted
        const settings = await notifee.getNotificationSettings();
        if (settings.android?.exactAlarms === false) {
          Alert.alert(
            'Enable Exact Alarms',
            'To receive timely reminders, please enable "Schedule exact alarms" for WaterMate in your device settings.',
            [
              {
                text: 'Open Settings',
                onPress: () => {
                  Linking.openSettings();
                },
              },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
        }
      } catch (e) {
        console.error('[Notifee] Error requesting exact alarm permission:', e);
      }
    }
  }

  static async initialize() {
    try {
      // Check and request permissions
      const settings = await notifee.getNotificationSettings();
      console.log('[Notifee] Current settings:', settings);

      if (settings.authorizationStatus !== AuthorizationStatus.AUTHORIZED) {
        const authStatus = await notifee.requestPermission();
        console.log('[Notifee] Permission status after request:', authStatus);
        // Defensive: Try again to get the latest status
        const newSettings = await notifee.getNotificationSettings();
        console.log('[Notifee] New settings after request:', newSettings);
        if (
          newSettings.authorizationStatus !== AuthorizationStatus.AUTHORIZED &&
          authStatus !== AuthorizationStatus.AUTHORIZED
        ) {
          throw new Error('Notification permission denied');
        }
      }

      // Request exact alarm permission for Android 12+
      await this.requestExactAlarmPermissionIfNeeded();

      // Create notification channel
      await this.createNotificationChannel();
      return true;
    } catch (error) {
      console.error('[Notifee] Initialization error:', error);
      return false;
    }
  }

  static async createNotificationChannel() {
    try {
      const channel = await notifee.createChannel({
        id: CHANNEL_ID,
        name: "WaterMate Reminders",
        importance: AndroidImportance.HIGH,
        vibration: true,
        sound: 'default',
        lights: true,
      });
      console.log('[Notifee] Channel created:', channel);
      return channel;
    } catch (error) {
      console.error('[Notifee] Channel creation error:', error);
      throw error;
    }
  }

  static async scheduleHydrationReminders(wakeHour, sleepHour, numReminders) {
    try {
      console.log('[Notifee] Starting to schedule reminders:', { wakeHour, sleepHour, numReminders });
      // Cancel existing notifications
      await notifee.cancelAllNotifications();
      console.log('[Notifee] Cancelled all notifications before scheduling new ones');

      const now = new Date();
      const start = new Date(now);
      start.setHours(wakeHour, 0, 0, 0);
      const end = new Date(now);
      end.setHours(sleepHour, 0, 0, 0);
      if (end <= start) end.setDate(end.getDate() + 1);
      const awakeMs = end - start;
      const reminders = Math.max(MIN_REMINDERS, Math.min(MAX_REMINDERS, numReminders));
      const intervalMs = awakeMs / reminders;
      console.log('[Notifee] Scheduling parameters:', {
        start: start.toISOString(),
        end: end.toISOString(),
        reminders,
        intervalMs
      });
      const today = new Date();
      const y = today.getFullYear(), m = today.getMonth(), d = today.getDate();
      const todayTimes = [];
      const allTimes = [];
      for (let i = 0; i < reminders; i++) {
        const reminderTime = new Date(start.getTime() + i * intervalMs);
        if (reminderTime <= now) {
          reminderTime.setDate(reminderTime.getDate() + 1);
        }
        // Only save reminders for today
        if (
          reminderTime.getFullYear() === y &&
          reminderTime.getMonth() === m &&
          reminderTime.getDate() === d
        ) {
          todayTimes.push(reminderTime.getTime());
        }
        // Save all scheduled times for today (even if in the past)
        if (
          reminderTime.getFullYear() === y &&
          reminderTime.getMonth() === m &&
          reminderTime.getDate() === d
        ) {
          allTimes.push(reminderTime.getTime());
        }
        // Final check before scheduling
        if (reminderTime.getTime() <= Date.now()) {
          console.warn('Skipping reminder in the past:', reminderTime);
          continue;
        }
        const notification = {
          id: String(reminderTime.getTime()),
          title: this.getRandomTitle(),
          body: "Stay hydrated for better health and energy.",
          android: {
      channelId: CHANNEL_ID,
            pressAction: { id: "default" },
            actions: [
              { title: "I Drank", pressAction: { id: "drank" } },
              { title: "Remind me later", pressAction: { id: "remind_later" } },
            ],
            importance: AndroidImportance.HIGH,
            sound: 'default',
            vibration: true,
    },
          data: {
            type: 'hydration_reminder',
            reminderIndex: i,
            totalReminders: reminders,
          },
        };
        const trigger = {
          type: TriggerType.TIMESTAMP,
          timestamp: reminderTime.getTime(),
          alarmManager: { allowWhileIdle: true },
        };
        console.log('[Notifee] Scheduling notification with ID:', notification.id, 'at', new Date(reminderTime.getTime()).toLocaleString());
        await notifee.createTriggerNotification(notification, trigger);
        console.log(`[Notifee] Scheduled reminder ${i + 1}/${reminders} for ${reminderTime.toLocaleString()} with id ${notification.id}`);
      }
      // Save today's reminder times for UI
      await AsyncStorage.setItem('reminderTimesToday', JSON.stringify(todayTimes));
      // Save all scheduled times for today (for modal display)
      await AsyncStorage.setItem('reminderTimesAllToday', JSON.stringify(allTimes));
      return true;
    } catch (error) {
      console.error('[Notifee] Error scheduling reminders:', error);
      return false;
    }
  }

  static async scheduleDailyReset() {
    try {
      const now = new Date();
      const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);

      const notification = {
        title: "🌙 Daily Reset",
        body: "Resetting your daily water intake",
        android: {
    channelId: CHANNEL_ID,
          pressAction: { id: "reset" },
          importance: AndroidImportance.HIGH,
          sound: 'default',
          vibration: true,
        },
        data: { type: "daily_reset" },
      };

      const trigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: midnight.getTime(),
        alarmManager: { allowWhileIdle: true },
      };

      await notifee.createTriggerNotification(notification, trigger);
      console.log(`[Notifee] Scheduled daily reset for ${midnight.toLocaleString()}`);
    return true;
  } catch (error) {
      console.error('[Notifee] Error scheduling daily reset:', error);
    return false;
  }
  }
}

// Utility: Generate and store all reminder times for today
export async function generateAndStoreRemindersForToday(wakeHour, sleepHour, numReminders) {
  const now = new Date();
  const start = new Date(now);
  start.setHours(wakeHour, 0, 0, 0);
  const end = new Date(now);
  end.setHours(sleepHour, 0, 0, 0);
  if (end <= start) end.setDate(end.getDate() + 1);
  const awakeMs = end - start;
  const reminders = Math.max(7, Math.min(9, numReminders));
  const intervalMs = awakeMs / reminders;
  const today = new Date();
  const y = today.getFullYear(), m = today.getMonth(), d = today.getDate();
  const allTimes = [];
  for (let i = 0; i < reminders; i++) {
    const reminderTime = new Date(start.getTime() + i * intervalMs);
    if (
      reminderTime.getFullYear() === y &&
      reminderTime.getMonth() === m &&
      reminderTime.getDate() === d
    ) {
      allTimes.push(reminderTime.getTime());
    }
  }
  await AsyncStorage.setItem('reminderTimesAllToday', JSON.stringify(allTimes));
}

// Utility: Cancel all and reschedule only from reminderTimesAllToday
export async function rescheduleAllRemindersFromStorage() {
  await notifee.cancelAllNotifications();
  const timesStr = await AsyncStorage.getItem('reminderTimesAllToday');
  let times = timesStr ? JSON.parse(timesStr) : [];
  for (const t of times) {
    if (t > Date.now()) {
      console.log('[Notifee] Scheduling notification with ID:', String(t), 'at', new Date(t).toLocaleString());
      await notifee.createTriggerNotification({
        id: String(t),
        title: '⏰ Hydration Reminder',
        body: "It's time to drink water! 💧",
        android: {
          channelId: CHANNEL_ID,
          pressAction: { id: 'default' },
          actions: [
            { title: 'I Drank', pressAction: { id: 'drank' } },
            { title: 'Remind me later', pressAction: { id: 'remind_later' } },
          ],
          importance: AndroidImportance.HIGH,
          sound: 'default',
          vibration: true,
        },
        data: { type: 'hydration_reminder' },
      }, {
        type: TriggerType.TIMESTAMP,
        timestamp: t,
        alarmManager: { allowWhileIdle: true },
      });
    }
  }
}

export { NotificationSystem };
