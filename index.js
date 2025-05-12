/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import notifee, { EventType, TriggerType } from '@notifee/react-native';

notifee.onBackgroundEvent(async ({ type, detail }) => {
  switch (type) {
    case EventType.ACTION_PRESS:
    case "2":
    case 2:
      if (detail?.pressAction?.id === "drank") {
        console.log('[Notifee] Background: I Drank handler called');
        // Duplicate logic from App.js for background
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          const DeviceEventEmitter = require('react-native').DeviceEventEmitter;
          const DEFAULT_CUP_SIZE = 250;
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
          if (detail?.notification?.id) {
            await notifee.cancelNotification(detail.notification.id);
          }
        } catch (err) {}
      } else if (detail?.pressAction?.id === "remind_later") {
        console.log('[Notifee] Background: Remind me later handler called');
        try {
          if (detail?.notification?.id) {
            await notifee.cancelNotification(detail.notification.id);
          }
          const notification = {
            title: "⏰ Hydration Reminder",
            body: "It's time to drink water! 💧",
            android: {
              channelId: "watermate-reminders",
              pressAction: { id: "default" },
              actions: [
                { title: "I Drank", pressAction: { id: "drank" } },
                { title: "Remind me later", pressAction: { id: "remind_later" } },
              ],
            },
          };
          const trigger = {
            type: TriggerType.TIMESTAMP,
            timestamp: Date.now() + 5000,
            alarmManager: { allowWhileIdle: true },
          };
          await notifee.createTriggerNotification(notification, trigger);
          console.log('[Notifee] Background: scheduled new notification for Remind me later');
        } catch (err) { console.log('[Notifee] Background: Remind me later error:', err); }
      }
      break;
    default:
      break;
  }
});

AppRegistry.registerComponent(appName, () => App);
