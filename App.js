import React, { useEffect, useState, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import notifee, {
  AndroidImportance,
  TriggerType,
  AuthorizationStatus,
  EventType,
} from "@notifee/react-native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AppNavigator from "./app/navigation/AppNavigator";
import { Modal, View, Text, TouchableOpacity, AppState, Platform, Linking, Alert } from "react-native";
import { DeviceEventEmitter } from 'react-native';

// Constants
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
  "Bro wake up, you need water frfr 🥲",
  "Main hoon paani, mujhe chahiye tu 😤💧",
  "You're dryin' out! 💦",
  "Hydra-what? hydra-YOU! 🐍💦",
  "Water > Drama. stay hydrated queen. 👑💧",
  "C'mon gng, drink up!🫠",
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
  "Jal le lijiye...🥛",
  "Water gives you glowww 🌟",
  "Naam batao, paani pilaun? 😉",
];

// --- Notification System ---
class NotificationSystem {
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

  static getRandomTitle() {
    return NOTIFICATION_TITLES[Math.floor(Math.random() * NOTIFICATION_TITLES.length)];
    }

  static async scheduleHydrationReminders(wakeHour, sleepHour, numReminders) {
    try {
      console.log('[Notifee] Starting to schedule reminders:', { wakeHour, sleepHour, numReminders });
      // Cancel existing notifications
    await notifee.cancelAllNotifications();

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
        // Final check before scheduling
        if (reminderTime.getTime() <= Date.now()) {
          console.warn('Skipping reminder in the past:', reminderTime);
          continue;
        }
        const notification = {
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
        await notifee.createTriggerNotification(notification, trigger);
        console.log(`[Notifee] Scheduled reminder ${i + 1}/${reminders} for ${reminderTime.toLocaleString()}`);
    }
      // Save today's reminder times for UI
      await AsyncStorage.setItem('reminderTimesToday', JSON.stringify(todayTimes));
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

  static async handleDrankAction(notificationId) {
    try {
      const cupSize = parseInt(await AsyncStorage.getItem("cupSizePreference")) || DEFAULT_CUP_SIZE;
      const today = new Date().toDateString();
      
      const historyStr = await AsyncStorage.getItem("history");
      const history = historyStr ? JSON.parse(historyStr) : [];
      
      const entry = {
        id: Date.now().toString(),
        time: new Date().toLocaleTimeString(),
        amount: cupSize,
        date: today,
      };
      
      const updatedHistory = [entry, ...history];
      await AsyncStorage.setItem("history", JSON.stringify(updatedHistory));
      
      let intake = 0;
      updatedHistory.forEach(e => { if (e.date === today) intake += e.amount; });
      await AsyncStorage.setItem("dailyIntake", intake.toString());
      
      DeviceEventEmitter.emit('waterIntakeUpdated');
      
      if (notificationId) {
        await notifee.cancelNotification(notificationId);
      }
      
      console.log('[Notifee] Drank action handled successfully');
      return true;
    } catch (error) {
      console.error('[Notifee] Error handling drank action:', error);
      return false;
    }
  }

  static async handleRemindMeLater(notificationId) {
    try {
      if (notificationId) {
        await notifee.cancelNotification(notificationId);
      }

      const reminderTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes later
      
      const notification = {
        title: this.getRandomTitle(),
        body: "Time for your water break!",
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
      };

      const trigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: reminderTime.getTime(),
        alarmManager: { allowWhileIdle: true },
      };

      await notifee.createTriggerNotification(notification, trigger);
      console.log(`[Notifee] Rescheduled reminder for ${reminderTime.toLocaleString()}`);
      return true;
    } catch (error) {
      console.error('[Notifee] Error handling remind later:', error);
      return false;
    }
  }
}

// --- Event Handlers ---
notifee.onForegroundEvent(async ({ type, detail }) => {
  console.log('[Notifee] Foreground event:', type, detail);
  
  switch (type) {
    case EventType.ACTION_PRESS:
      if (detail?.pressAction?.id === "drank") {
        await NotificationSystem.handleDrankAction(detail?.notification?.id);
      } else if (detail?.pressAction?.id === "remind_later") {
        await NotificationSystem.handleRemindMeLater(detail?.notification?.id);
      } else if (detail?.pressAction?.id === "reset" || detail?.notification?.data?.type === "daily_reset") {
        await AsyncStorage.setItem("dailyIntake", "0");
        DeviceEventEmitter.emit('waterIntakeUpdated');
        console.log('[Notifee] Daily reset completed');
      }
      break;
    default:
      break;
  }
});

notifee.onBackgroundEvent(async ({ type, detail }) => {
  console.log('[Notifee] Background event:', type, detail);
  
  switch (type) {
    case EventType.ACTION_PRESS:
      if (detail?.pressAction?.id === "drank") {
        await NotificationSystem.handleDrankAction(detail?.notification?.id);
      } else if (detail?.pressAction?.id === "remind_later") {
        await NotificationSystem.handleRemindMeLater(detail?.notification?.id);
      } else if (detail?.pressAction?.id === "reset" || detail?.notification?.data?.type === "daily_reset") {
        await AsyncStorage.setItem("dailyIntake", "0");
        DeviceEventEmitter.emit('waterIntakeUpdated');
      }
      break;
    default:
      break;
  }
});

// --- App Component ---
export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        // Move alarm permission check here, before any navigation
        NotificationSystem.requestExactAlarmPermissionIfNeeded();

        // Initialize notification system
        const initialized = await NotificationSystem.initialize();
        if (!initialized) {
          console.error('[Notifee] Failed to initialize notification system');
          setAppReady(true);
          return;
        }

        // Check onboarding status
      const onboarded = await AsyncStorage.getItem("onboardingCompleted");
      setInitialRoute(onboarded === "true" ? "Home" : "Welcome");

      setAppReady(true);
      } catch (error) {
        console.error('[Notifee] App initialization error:', error);
        setAppReady(true);
      }
    };

    init();
  }, []);

  if (!appReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <AppNavigator initialRoute={initialRoute} />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
