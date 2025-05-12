"use client";

import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Animated,
  useColorScheme as useDeviceColorScheme,
  StatusBar,
  Modal,
  TextInput,
  Switch,
  ScrollView,
  Linking,
  Dimensions,
  Platform,
  AppState,
  DeviceEventEmitter,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useIsFocused,
  useNavigation,
  CommonActions,
} from "@react-navigation/native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-gesture-handler";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import LiquidProgress from '../components/LiquidProgress';
import ConfettiCannon from 'react-native-confetti-cannon';
import { Animated as RNAnimated, Easing } from 'react-native';
import notifee from '@notifee/react-native';
import { generateAndStoreRemindersForToday } from '../utils/notificationHelper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LineChart } from 'react-native-chart-kit';

// Get screen dimensions for overlay
const { width, height } = Dimensions.get("window");

// Theme colors
const lightTheme = {
  background: "#f7f9fc",
  card: "#fff",
  text: "#333",
  textSecondary: "#666",
  textTertiary: "#777",
  textEmpty: "#aaa",
  primary: "#4e8cff",
  primaryLight: "#d0e2ff",
  drawerHeader: "#4e8cff",
  drawerBackground: "#fff",
  drawerBorder: "#eee",
  progressBar: "#4a8cff",
  progressBarBg: "#d0e2ff",
  shadow: "rgba(0,0,0,0.1)",
  overlay: "rgba(0,0,0,0.4)",
  danger: "#FF5252",
  statusBar: "dark-content",
  safeAreaBackground: "#f7f9fc",
  modalBackground: "#fff",
  timelineConnector: "#d0e2ff",
  timelineActive: "#4a8cff",
  timelineInactive: "#d0e2ff",
  timelineGradientStart: "#4e8cff",
  timelineGradientEnd: "#6ea8ff",
  timelineShadow: "rgba(78,140,255,0.2)",
  border: "#4e8cff",
};

const darkTheme = {
  background: "#121212",
  card: "#1e1e1e",
  text: "#f1f1f1",
  textSecondary: "#b0b0b0",
  textTertiary: "#909090",
  textEmpty: "#707070",
  primary: "#4e8cff",
  primaryLight: "#1a2c4d",
  drawerHeader: "#1a2c4d",
  drawerBackground: "#121212",
  drawerBorder: "#2c2c2c",
  progressBar: "#4a8cff",
  progressBarBg: "#2a3c5d",
  shadow: "rgba(0,0,0,0.3)",
  overlay: "rgba(0,0,0,0.7)",
  danger: "#FF5252",
  statusBar: "light-content",
  safeAreaBackground: "#121212",
  modalBackground: "#1e1e1e",
  timelineConnector: "#2a3c5d",
  timelineActive: "#4a8cff",
  timelineInactive: "#2a3c5d",
  timelineGradientStart: "#4e8cff",
  timelineGradientEnd: "#3a6dc7",
  timelineShadow: "rgba(58,109,199,0.2)",
  border: "#4e8cff",
};

// Cup size options
const cupSizes = [
  { size: 100, label: "Small Cup (100 ml)" },
  { size: 250, label: "Regular Cup (250 ml)" },
  { size: 350, label: "Glass (350 ml)" },
  { size: 500, label: "Bottle (500 ml)" },
  { size: 750, label: "Large Bottle (750 ml)" },
];

const cupIcons = [
  'cup-water', // 100ml
  'cup', // 250ml
  'glass-stange', // 350ml
  'bottle-soda-classic-outline', // 500ml
  'bottle-wine', // 750ml
];

const DEFAULT_GOAL = 3000;
const DEFAULT_CUP = 250;
const TIMELINE_POINTS = 8;

// Demo avatar imports (adjust the path as needed)
const demoAvatars = [
  require('../../assets/avatar/boy.webp'),
  require('../../assets/avatar/girl.webp'),
  require('../../assets/avatar/panda.webp'),
  require('../../assets/avatar/ninja.webp'),
  require('../../assets/avatar/space.webp'),
  require('../../assets/avatar/knight.webp'),
  require('../../assets/avatar/deer.webp'),
  require('../../assets/avatar/chick.webp'),
  require('../../assets/avatar/bear.webp'),
];

const FloatingText = ({ visible, amount, onDone }) => {
  const anim = useRef(new RNAnimated.Value(0)).current;
  useEffect(() => {
    if (visible) {
      anim.setValue(0);
      RNAnimated.timing(anim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start(() => onDone && onDone());
    }
  }, [visible]);
  if (!visible) return null;
  return (
    <RNAnimated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 0, right: 0, top: height * 0.43,
        alignItems: 'center',
        opacity: anim.interpolate({ inputRange: [0, 0.9, 1], outputRange: [0, 1.2, 0] }),
        transform: [
          { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -70] }) },
          { scale: anim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.7, 1.1, 1] }) },
        ],
        zIndex: 100,
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#4e8cff', textShadowColor: '#fff', textShadowRadius: 8 }}>
        + {amount} ml <Text style={{ fontWeight: 'bold', color: '#4e8cff' }}>Keep going!</Text>
        </Text>
    </RNAnimated.View>
  );
};

// Add helper function at the top, after imports
function calculateGoalFromWeight(weight) {
  if (!weight || isNaN(weight)) return 2000;
  return Math.round(Number(weight) * 40 / 10) * 10;
}

const HomeScreen = () => {
  // Theme
  const [isDarkMode, setIsDarkMode] = useState(false);
  const theme = isDarkMode ? darkTheme : lightTheme;

  // Floating text animation state (move to top)
  const [showFloating, setShowFloating] = useState(false);
  const [floatingAmount, setFloatingAmount] = useState(DEFAULT_CUP);

  // User
  const [userData, setUserData] = useState(null);
  const [greeting, setGreeting] = useState("");

  // Intake/Goal
  const [goal, setGoal] = useState(DEFAULT_GOAL);
  const [currentIntake, setCurrentIntake] = useState(0);
  const [selectedCupSize, setSelectedCupSize] = useState(DEFAULT_CUP);
  const [history, setHistory] = useState([]);

  // Modals
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [cupSizeModalVisible, setCupSizeModalVisible] = useState(false);
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [newGoal, setNewGoal] = useState("");
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [scheduledReminders, setScheduledReminders] = useState([]);
  const [now, setNow] = useState(Date.now());

  // Settings
  const [settings, setSettings] = useState({
    notifications: true,
    soundEffects: true,
    vibration: true,
    useMlUnit: true,
    reminderFrequency: 60,
  });

  const navigation = useNavigation();

  // Confetti
  const [showConfetti, setShowConfetti] = useState(false);
  const prevIntakeRef = useRef(0);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerAnim = useRef(new RNAnimated.Value(0)).current;

  // Animate drawer open/close
  useEffect(() => {
    RNAnimated.timing(drawerAnim, {
      toValue: drawerOpen ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
  }, [drawerOpen]);

  // Load theme and user data
  useEffect(() => {
    (async () => {
      const storedTheme = await AsyncStorage.getItem("themePreference");
      setIsDarkMode(storedTheme === "dark");
      const userDataStr = await AsyncStorage.getItem("userData");
      if (userDataStr) {
        const parsed = JSON.parse(userDataStr);
        setUserData(parsed);
        setGreeting(parsed.name ? `Hello, ${parsed.name} 👋` : "Hello 👋");
        const storedGoal = await AsyncStorage.getItem("dailyGoal");
        if (storedGoal) {
          setGoal(parseInt(storedGoal));
        } else if (parsed.weight) {
          const calculatedGoal = calculateGoalFromWeight(parsed.weight);
          setGoal(calculatedGoal);
          await AsyncStorage.setItem("dailyGoal", String(calculatedGoal));
        } else {
          setGoal(DEFAULT_GOAL);
        }
      } else {
        setGreeting("Hello 👋");
        setGoal(DEFAULT_GOAL);
      }
      const storedCup = await AsyncStorage.getItem("cupSizePreference");
      setSelectedCupSize(storedCup ? parseInt(storedCup) : DEFAULT_CUP);
      const storedSettings = await AsyncStorage.getItem("appSettings");
      if (storedSettings) setSettings(JSON.parse(storedSettings));
      loadTodayHistory();
    })();
  }, []);

  // Save theme
  const toggleTheme = useCallback(async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    await AsyncStorage.setItem("themePreference", newTheme ? "dark" : "light");
  }, [isDarkMode]);

  // Load today's history
  const loadTodayHistory = async () => {
      const stored = await AsyncStorage.getItem("history");
      const today = new Date().toDateString();
      if (stored) {
        const parsed = JSON.parse(stored);
        const todaysLogs = parsed.filter((item) => item.date === today);
        setHistory(todaysLogs);
    setCurrentIntake(todaysLogs.reduce((sum, entry) => sum + entry.amount, 0));
    } else {
      setHistory([]);
      setCurrentIntake(0);
    }
  };

  // Add water
  const handleAddWater = async () => {
        const now = new Date();
        const entry = {
      id: Date.now().toString(),
          time: now.toLocaleTimeString(),
          amount: selectedCupSize,
          date: now.toDateString(),
    };
    const updatedHistory = [entry, ...history];
    setHistory(updatedHistory);
    setCurrentIntake(currentIntake + selectedCupSize);
    // Save
    const stored = await AsyncStorage.getItem("history");
    const allHistory = stored ? JSON.parse(stored) : [];
    await AsyncStorage.setItem("history", JSON.stringify([entry, ...allHistory]));
    setFloatingAmount(selectedCupSize);
    setShowFloating(true);
  };

  // Confetti trigger: fire when intake crosses goal
  useEffect(() => {
    if (
      prevIntakeRef.current < goal &&
      currentIntake >= goal &&
      goal > 0
    ) {
      setTimeout(() => {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3500);
      }, 100);
    }
    prevIntakeRef.current = currentIntake;
  }, [currentIntake, goal]);

  // Delete entry
  const deleteHistoryEntry = async (entryId, amount) => {
      const updatedHistory = history.filter((item) => item.id !== entryId);
      setHistory(updatedHistory);
    setCurrentIntake(Math.max(0, currentIntake - amount));
    // Save
    const stored = await AsyncStorage.getItem("history");
    const allHistory = stored ? JSON.parse(stored) : [];
    const newAllHistory = allHistory.filter((item) => item.id !== entryId);
    await AsyncStorage.setItem("history", JSON.stringify(newAllHistory));
  };

  // Save cup size
  const saveCupSizePreference = async (size) => {
      setSelectedCupSize(size);
      await AsyncStorage.setItem("cupSizePreference", size.toString());
      setCupSizeModalVisible(false);
  };

  // Save goal
  const saveGoal = async () => {
    const val = parseInt(newGoal);
    if (!isNaN(val) && val > 0) {
      setGoal(val);
      await AsyncStorage.setItem("dailyGoal", val.toString());
        setGoalModalVisible(false);
    }
  };

  // Save settings
  const saveSettings = async (newSettings) => {
    setSettings(newSettings);
    await AsyncStorage.setItem("appSettings", JSON.stringify(newSettings));
  };

  // Log out
  const handleReset = async () => {
      await AsyncStorage.clear();
    setUserData(null);
    setHistory([]);
    setCurrentIntake(0);
    setGoal(DEFAULT_GOAL);
    setSelectedCupSize(DEFAULT_CUP);
    setSettingsModalVisible(false);
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Welcome" }],
        })
      );
  };

  // At the top of the UI, add a date label
  const today = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dateLabel = `${dayNames[today.getDay()]}, ${today.getDate()}${['th','st','nd','rd'][((today.getDate()+90)%100-10)%10-1]||'th'} ${monthNames[today.getMonth()]}`;

  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
  const windowHeight = Dimensions.get('window').height;

  const [modalAnim] = useState(new RNAnimated.Value(0));
  useEffect(() => {
    if (historyModalVisible) {
      modalAnim.setValue(0);
      RNAnimated.timing(modalAnim, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [historyModalVisible]);

  // Add state for custom cup input and showCustomCupInput
  const [showCustomCupInput, setShowCustomCupInput] = useState(false);
  const [customCupInput, setCustomCupInput] = useState('');

  // Add a function to clear all logs and reset intake
  const clearAllLogs = async () => {
    setHistory([]);
    setCurrentIntake(0);
    await AsyncStorage.setItem("history", JSON.stringify([]));
  };

  // Add state for avatar selection modal
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState(null);

  // Load avatar from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      const storedAvatarIndex = await AsyncStorage.getItem('selectedAvatarIndex');
      if (storedAvatarIndex !== null) {
        setSelectedAvatarIndex(Number(storedAvatarIndex));
      }
    })();
  }, []);

  // Function to handle avatar selection
  const handleAvatarSelect = async (index) => {
    setSelectedAvatarIndex(index);
    setAvatarModalVisible(false);
    setDrawerOpen(false);
    await AsyncStorage.setItem('selectedAvatarIndex', String(index));
  };

  // Add this useEffect to listen for waterIntakeUpdated events
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('waterIntakeUpdated', () => {
      loadTodayHistory();
    });
    return () => sub.remove();
  }, []);

  // Fetch scheduled reminders when modal opens
  useEffect(() => {
    if (reminderModalVisible) {
      (async () => {
        try {
          // Read all scheduled reminder times for today from AsyncStorage
          const timesStr = await AsyncStorage.getItem('reminderTimesAllToday');
          let times = [];
          if (timesStr) {
            times = JSON.parse(timesStr);
          }
          // Map to objects for UI
          const reminders = times.map((t, i) => ({ id: t + '-' + i, time: t }));
          setScheduledReminders(reminders);
          setNow(Date.now());
        } catch (e) {
          setScheduledReminders([]);
        }
      })();
    }
  }, [reminderModalVisible]);

  // On app load, generate and store all reminders for today
  useEffect(() => {
    (async () => {
      const userDataStr = await AsyncStorage.getItem('userData');
      if (userDataStr) {
        const { wakeUpHour, sleepHour, dailyGoal, cupSize } = JSON.parse(userDataStr);
        const numReminders = Math.ceil((dailyGoal || 2000) / (cupSize || 250));
        await generateAndStoreRemindersForToday(wakeUpHour, sleepHour, numReminders);
      }
    })();
  }, []);

  // Add state for editing reminder and time picker
  const [editingReminder, setEditingReminder] = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleTimePickerChange = async (event, selectedDate) => {
    if (event.type === 'dismissed') {
      setShowTimePicker(false);
      setEditingReminder(null);
      return;
    }
    setShowTimePicker(false);
    if (!selectedDate || !editingReminder) {
      setEditingReminder(null);
      return;
    }
    try {
      // 1. Get all reminders for today
      const timesStr = await AsyncStorage.getItem('reminderTimesAllToday');
      let times = timesStr ? JSON.parse(timesStr) : [];
      // 2. Remove the old time and add the new one (no duplicates)
      const oldTime = editingReminder.time;
      const newTime = new Date(oldTime);
      newTime.setHours(selectedDate.getHours());
      newTime.setMinutes(selectedDate.getMinutes());
      newTime.setSeconds(0);
      newTime.setMilliseconds(0);
      const newTimestamp = newTime.getTime();
      times = times.filter(t => t !== oldTime); // Remove old
      if (!times.includes(newTimestamp)) times.push(newTimestamp); // Add new
      await AsyncStorage.setItem('reminderTimesAllToday', JSON.stringify(times));
      // 3. Cancel the old scheduled notification (if in the future)
      try {
        await notifee.cancelTriggerNotification(String(oldTime));
      } catch (e) {}
      // 4. Schedule a new notification if the new time is in the future
      if (newTimestamp > Date.now()) {
        await notifee.createTriggerNotification({
          id: String(newTimestamp),
          title: '⏰ Hydration Reminder',
          body: "It's time to drink water! 💧",
          android: {
            channelId: 'watermate-reminders',
            pressAction: { id: 'default' },
            actions: [
              { title: 'I Drank', pressAction: { id: 'drank' } },
              { title: 'Remind me later', pressAction: { id: 'remind_later' } },
            ],
            importance: notifee.AndroidImportance.HIGH,
            sound: 'default',
            vibration: true,
          },
          data: { type: 'hydration_reminder' },
        }, {
          type: notifee.TriggerType.TIMESTAMP,
          timestamp: newTimestamp,
          alarmManager: { allowWhileIdle: true },
        });
      }
      setEditingReminder(null);
    } catch (e) {
      setEditingReminder(null);
    }
  };

  // Add state for statistics modal
  const [statisticsModalVisible, setStatisticsModalVisible] = useState(false);
  const [statisticsTab, setStatisticsTab] = useState('week'); // 'week' or 'month'
  const [weeklyData, setWeeklyData] = useState({ labels: [], data: [] });
  const [monthlyData, setMonthlyData] = useState({ labels: [], data: [] });

  const aggregateIntakeData = async () => {
    const stored = await AsyncStorage.getItem("history");
    const allHistory = stored ? JSON.parse(stored) : [];
    const today = new Date();

    // Weekly
    let weekLabels = [];
    let weekData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const label = d.toLocaleDateString(undefined, { weekday: 'short' });
      weekLabels.push(label);
      const total = allHistory
        .filter(item => new Date(item.date).toDateString() === d.toDateString())
        .reduce((sum, entry) => sum + entry.amount, 0);
      weekData.push(total);
    }
    weekData = weekData.map(v => (isFinite(v) && !isNaN(v) ? v : 0));

    // Monthly (6 periods of 5 days)
    let monthLabels = [];
    let monthData = [];
    for (let i = 29; i >= 0; i -= 5) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      monthLabels.push(label);
      // Sum for this 5-day period
      let periodTotal = 0;
      for (let j = 0; j < 5; j++) {
        const dd = new Date(d);
        dd.setDate(d.getDate() + j);
        periodTotal += allHistory
          .filter(item => new Date(item.date).toDateString() === dd.toDateString())
          .reduce((sum, entry) => sum + entry.amount, 0);
      }
      monthData.push(periodTotal);
    }
    monthData = monthData.map(v => (isFinite(v) && !isNaN(v) ? v : 0));

    setWeeklyData({ labels: weekLabels, data: weekData });
    setMonthlyData({ labels: monthLabels, data: monthData });
  };

  useEffect(() => {
    if (statisticsModalVisible) {
      aggregateIntakeData();
    }
  }, [statisticsModalVisible]);

  // UI
    return (
    <>
      {/* Floating text animation */}
      <FloatingText visible={showFloating} amount={floatingAmount} onDone={() => setShowFloating(false)} />
      {/* Reminder Modal */}
      <Modal animationType="fade" transparent visible={reminderModalVisible} onRequestClose={() => setReminderModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setReminderModalVisible(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.modalBackground, width: '90%', maxHeight: '80%' }]} onStartShouldSetResponder={() => true} onTouchEnd={e => e.stopPropagation()}>
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
              <Text style={[styles.modalTitle, { color: theme.text, fontSize: 24, flex: 1, textAlign: 'center' }]}>Today's Reminders</Text>
              <TouchableOpacity onPress={() => setReminderModalVisible(false)} style={{ position: 'absolute', right: -10, top: -5, padding: 8 }}>
                <MaterialCommunityIcons name="close" size={28} color={theme.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ marginTop: 0, maxHeight: '90%' }} contentContainerStyle={{ paddingBottom: 0 }}>
              {(() => {
                const now = Date.now();
                const today = new Date();
                const y = today.getFullYear(), m = today.getMonth(), d = today.getDate();
                const isToday = (ts) => {
                  const dt = new Date(ts);
                  return dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d;
                };
                const validReminders = scheduledReminders
                  .filter(rem => typeof rem.time === 'number' && !isNaN(rem.time) && isToday(rem.time))
                  .sort((a, b) => a.time - b.time); // Sort all reminders by time

                // Split into upcoming and done
                const upcoming = validReminders.filter(rem => rem.time > now);
                const done = validReminders.filter(rem => rem.time <= now);
                const allReminders = [...upcoming, ...done];

                return allReminders.map((rem, idx) => {
                  const isDone = rem.time <= now;
                  const timeStr = rem.time ? new Date(rem.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
    return (
                    <View key={rem.id || idx} style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: -5,
                    }}>
                      {/* Trail/connector */}
                      <View style={{ width: 32, alignItems: 'center', height: '100%', right: 5}}>
                        <View style={{ width: 2, height: idx === 0 ? 24 : 40, backgroundColor: isDone ? '#b2ebf2' : '#4e8cff', opacity: 0.4, marginBottom: -13, marginTop: idx === 0 ? 6 : -10, borderRadius: 1 }} />
                        <MaterialCommunityIcons name={isDone ? 'check-circle' : 'clock-outline'} size={22} color={isDone ? '#4e8cff' : '#4e8cff'} style={{ backgroundColor: '#fff', borderRadius: 11, zIndex: 2 }} />
                        <View style={{ width: 2, height: idx === allReminders.length - 1 ? 24 : 40, backgroundColor: isDone ? '#b2ebf2' : '#4e8cff', opacity: 0.4, marginTop: -5, borderRadius: 1 }} />
                      </View>
                      {/* Reminder card */}
                      <View style={{
                        flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: 14,
                        paddingVertical: 14,
                        paddingHorizontal: 18,
                      borderRadius: 22,
                      backgroundColor: isDone
                          ? (isDarkMode ? '#2f3d34' : '#e3f7ed')
                          : (isDarkMode ? '#1a2c4d' : '#f2f5ff'),
                      opacity: isDone ? 0.7 : 1,
                      shadowColor: isDarkMode ? '#000' : '#4e8cff',
                      shadowOpacity: 0.10,
                      shadowRadius: 10,
                      elevation: 3,
                      borderWidth: 1,
                      borderColor: isDone ? (isDarkMode ? '#2a3c5d' : '#b2ebf2') : (isDarkMode ? '#2a3c5d' : '#d0e2ff'),
                        marginLeft: 0,
                    }}>
                      <Text style={{ fontSize: 16, color: theme.text, flex: 1, fontWeight: '600', letterSpacing: 0.5 }}>{timeStr}</Text>
                        {/* Capsule status */}
                      <View style={{
                          backgroundColor: isDone ? '#b6e7c9' : '#d0e2ff',
                          borderRadius: 12,
                          paddingHorizontal: 12,
                          paddingVertical: 4,
                        alignItems: 'center',
                        justifyContent: 'center',
                          minWidth: 70,
                        marginLeft: 8,
                      }}>
                        <Text style={{
                          fontSize: 13,
                            color: isDone ? '#1b7f3a' : '#2563eb',
                            fontWeight: 'bold',
                          textAlign: 'center',
                            letterSpacing: 0.2,
                          }}>{isDone ? 'Completed' : 'Upcoming'}</Text>
                        </View>
                        {/* Edit icon for upcoming reminders */}
                        {!isDone && (
                          <TouchableOpacity onPress={() => { setEditingReminder(rem); setShowTimePicker(true); }} style={{ marginLeft: 10 }}>
                            <MaterialCommunityIcons name="pencil" size={20} color={theme.primary} />
                          </TouchableOpacity>
                        )}
                      </View>
                </View>
              );
                });
              })()}
            </ScrollView>
            {/* Time Picker Modal */}
            {showTimePicker && editingReminder && (
              <DateTimePicker
                value={new Date(editingReminder.time)}
                mode="time"
                is24Hour={false}
                display="inline"
                onChange={handleTimePickerChange}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
      {/* Modals and overlays rendered outside SafeAreaView */}
      {settingsModalVisible && (
        <Modal animationType="fade" transparent visible={settingsModalVisible} onRequestClose={() => setSettingsModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.card, width: '90%', maxHeight: '80%' }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <Text style={[styles.modalTitle, { color: theme.text, fontSize: 24 }]}>Settings</Text>
                <TouchableOpacity onPress={() => setSettingsModalVisible(false)}>
                  <MaterialCommunityIcons name="close" size={26} color={theme.text} style={{ marginBottom: 10 }} />
                </TouchableOpacity>
        </View>
              <TouchableOpacity style={[styles.settingItem, { borderBottomColor: theme.border }]} onPress={() => { }}>
                <MaterialCommunityIcons name="account" size={24} color={theme.text} />
                <Text style={[styles.settingText, { color: theme.text, fontSize: 18 }]}>Profile</Text>
                <MaterialCommunityIcons name="chevron-right" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.settingItem, { borderBottomColor: theme.border }]} onPress={() => setReminderModalVisible(true)}>
                <MaterialCommunityIcons name="bell" size={24} color={theme.text} />
                <Text style={[styles.settingText, { color: theme.text, fontSize: 18 }]}>Reminders</Text>
                <MaterialCommunityIcons name="chevron-right" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.settingItem, { borderBottomColor: theme.border }]} onPress={() => { setStatisticsModalVisible(true); setSettingsModalVisible(false); }}>
                <MaterialCommunityIcons name="chart-bar" size={24} color={theme.text} />
                <Text style={[styles.settingText, { color: theme.text, fontSize: 18 }]}>Statistics</Text>
                <MaterialCommunityIcons name="chevron-right" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.settingItem, { borderBottomColor: theme.border }]} onPress={() => { }}>
                <MaterialCommunityIcons name="trophy" size={24} color={theme.text} />
                <Text style={[styles.settingText, { color: theme.text, fontSize: 18 }]}>Achievements</Text>
                <MaterialCommunityIcons name="chevron-right" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.settingItem, { borderBottomColor: theme.border }]} onPress={toggleTheme}>
                <MaterialCommunityIcons name="cog" size={24} color={theme.text} />
                <Text style={[styles.settingText, { color: theme.text, fontSize: 18 }]}>Preferences</Text>
                <MaterialCommunityIcons name="chevron-right" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.settingItem, { borderBottomColor: theme.border }]} onPress={() => Linking.openURL("https://github.com/vaibhavxtripathi")}>
                <MaterialCommunityIcons name="information" size={24} color={theme.text} />
                <Text style={[styles.settingText, { color: theme.text, fontSize: 18 }]}>About</Text>
                <MaterialCommunityIcons name="chevron-right" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.settingItem]} onPress={() => Linking.openURL("https://github.com/vaibhavxtripathi")}>
                <MaterialCommunityIcons name="help-circle" size={24} color={theme.text} />
                <Text style={[styles.settingText, { color: theme.text, fontSize: 18 }]}>Help & Support</Text>
                <MaterialCommunityIcons name="chevron-right" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
              <Text style={{ color: theme.textSecondary, fontSize: 14, marginTop: 20, textAlign: 'left' }}>Crafted with ❤️ by Vaibhav Tripathi.</Text>
      </View>
        </View>
        </Modal>
      )}

      {cupSizeModalVisible && (
        <Modal animationType="fade" transparent visible={cupSizeModalVisible} onRequestClose={() => setCupSizeModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Select Cup Size</Text>
              {cupSizes.map((cup, idx) => (
                <TouchableOpacity key={cup.size} style={[styles.cupSizeOption, selectedCupSize === cup.size && { backgroundColor: theme.primaryLight, borderColor: theme.primary }]} onPress={() => saveCupSizePreference(cup.size)}>
                <View style={styles.cupSizeRow}>
                    <MaterialCommunityIcons name={cupIcons[idx]} size={24} color={selectedCupSize === cup.size ? theme.primary : theme.textSecondary} style={{ marginRight: 10 }} />
                    <Text style={[styles.cupSizeText, { color: theme.text }, selectedCupSize === cup.size && { fontWeight: "bold", color: theme.primary }]}>{cup.label}</Text>
                </View>
                  {selectedCupSize === cup.size && <MaterialCommunityIcons name="check-circle" size={20} color={theme.primary} />}
              </TouchableOpacity>
            ))}
              {/* Custom cup size option */}
              <TouchableOpacity style={[styles.cupSizeOption, typeof selectedCupSize === 'number' && !cupSizes.some(c => c.size === selectedCupSize) && { backgroundColor: theme.primaryLight, borderColor: theme.primary }]} onPress={() => setShowCustomCupInput(true)}>
                <View style={styles.cupSizeRow}>
                  <MaterialCommunityIcons name="cup" size={24} color={theme.textSecondary} style={{ marginRight: 10 }} />
                  <Text style={[styles.cupSizeText, { color: theme.text }]}>Custom</Text>
          </View>
                {typeof selectedCupSize === 'number' && !cupSizes.some(c => c.size === selectedCupSize) && <MaterialCommunityIcons name="check-circle" size={20} color={theme.primary} />}
        </TouchableOpacity>
              {showCustomCupInput && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, bottom: 15, marginBottom: 5 }}>
              <TextInput
                    style={{ flex: 1, borderWidth: 1, borderColor: theme.primary, borderRadius: 8, padding: 8, color: theme.text, backgroundColor: theme.card, marginRight: 10, top: 1}}
                    placeholder="Enter custom size (ml)"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                    value={customCupInput}
                    onChangeText={setCustomCupInput}
                    autoFocus
                  />
                  <TouchableOpacity style={{ backgroundColor: theme.primary, borderRadius: '50%', padding: 10 }} onPress={() => {
                    const val = parseInt(customCupInput);
                    if (!isNaN(val) && val > 0) {
                      saveCupSizePreference(val);
                      setShowCustomCupInput(false);
                      setCustomCupInput('');
                    }
                  }}>
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Set</Text>
            </TouchableOpacity>
                  <TouchableOpacity style={{ marginLeft: 8 }} onPress={() => { setShowCustomCupInput(false); setCustomCupInput(''); }}>
                    <MaterialCommunityIcons name="close" size={22} color={theme.danger} />
            </TouchableOpacity>
          </View>
              )}
              <TouchableOpacity style={[styles.cancelButton, { borderColor: theme.border }]} onPress={() => setCupSizeModalVisible(false)}>
                <Text style={[styles.cancelButtonText, { color: '#4e8cff' }]}>Cancel</Text>
        </TouchableOpacity>
            </View>
          </View>
      </Modal>
      )}

      {historyModalVisible && (
        <Modal animationType="none" transparent visible={historyModalVisible} onRequestClose={() => setHistoryModalVisible(false)}>
          <RNAnimated.View style={{ flex: 1, backgroundColor: modalAnim.interpolate({ inputRange: [0, 1], outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.45)'] }), justifyContent: 'center', alignItems: 'center' }}>
            <RNAnimated.View style={{
              width: '88%',
              maxHeight: '80%',
              backgroundColor: theme.card,
              borderRadius: 24,
              padding: 20,
              shadowColor: '#000',
              shadowOpacity: 0.18,
              shadowRadius: 18,
              elevation: 8,
              transform: [{ translateY: modalAnim.interpolate({ inputRange: [0, 1], outputRange: [80, 0] }) }],
              opacity: modalAnim,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text, marginBottom: 10 }}>Today's Logs</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity onPress={clearAllLogs} style={{ marginRight: 10 }}>
                    <Text style={{ color: theme.danger, fontWeight: 'bold', fontSize: 15, textDecorationLine: 'underline', bottom: 5, right: 5 }}>Clear All</Text>
              </TouchableOpacity>
                  <TouchableOpacity onPress={() => setHistoryModalVisible(false)}><MaterialCommunityIcons name="close" size={26} color={theme.text} style={{ alignSelf: 'center', bottom: 5 }} /></TouchableOpacity>
            </View>
                </View>
              <FlatList
                data={history}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={[styles.logCard, { backgroundColor: theme.card }]}>
                    <View style={styles.bottleTextContainer}>
                      <MaterialCommunityIcons name="cup-water" size={22} color={theme.primary} style={{ alignSelf: 'center', top: 3 }} />
                      <Text style={[styles.historyText, { color: theme.text, alignSelf: 'center', fontWeight: '600' }]}>{item.amount} ml</Text>
                    </View>
                    <View style={styles.historyRightContainer}>
                      <Text style={[styles.historyTime, { color: theme.textTertiary }]}>{item.time}</Text>
                      <TouchableOpacity style={styles.deleteButton} onPress={() => deleteHistoryEntry(item.id, item.amount)}>
                        <MaterialCommunityIcons name="close-circle" size={22} color={theme.danger} />
                      </TouchableOpacity>
                  </View>
                </View>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyHistory}>
                    <MaterialCommunityIcons name="water-off" size={40} color={theme.textSecondary} style={{alignSelf: 'center', marginBottom: 10}}/>
                    <Text style={[styles.emptyHistoryText, { color: theme.textSecondary, textAlign: 'center' }]}>No logs for today</Text>
              </View>
                }
              />
            </RNAnimated.View>
          </RNAnimated.View>
        </Modal>
      )}

      {/* Main app content wrapped in SafeAreaView */}
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background, flex: 1 }]}>  
        <StatusBar
          barStyle={theme.statusBar}
          backgroundColor={theme.safeAreaBackground}
        />
        {/* Drawer overlay and sidebar (zIndex: overlay 100, drawer 200) */}
        {drawerOpen && (
                      <TouchableOpacity
                        style={[
              styles.drawerOverlay,
              {
                zIndex: 150,
                top: statusBarHeight,
                height: windowHeight - statusBarHeight,
              },
            ]}
            activeOpacity={1}
            onPress={() => setDrawerOpen(false)}
          />
        )}
        <RNAnimated.View
                          style={[
            styles.drawer,
            {
              top: statusBarHeight,
              height: windowHeight - statusBarHeight,
              zIndex: 200,
              backgroundColor: theme.card,
              transform: [{ translateX: drawerAnim.interpolate({ inputRange: [0, 1], outputRange: [-280, 0] }) }],
              shadowOpacity: drawerOpen ? 0.18 : 0,
            },
          ]}
          pointerEvents={drawerOpen ? 'auto' : 'none'}
        >
          <View style={[styles.drawerProfileSection, { height: (windowHeight - statusBarHeight) * 0.35 }]}>
            <View>
              
                {selectedAvatarIndex !== null ? (
                  <View style={[
                    
                    {
                      width: 150,
                      height: 150,
                      borderRadius: 75,
                      marginBottom: 18,
                      position: 'relative',
                      justifyContent: 'center',
                      alignItems: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.12,
                      shadowRadius: 12,
                      elevation: 8,
                    },
                  ]}>

                    <Image source={demoAvatars[selectedAvatarIndex]} style={{ width: '100%', height: '100%', borderRadius: 75 }} />
                  </View>
                ) : (
                  <View style={[
                    styles.drawerAvatar,
                    {
                      width: 150,
                      height: 150,
                      borderRadius: 75,
                      marginBottom: 18,
                      position: 'relative',
                      justifyContent: 'center',
                      alignItems: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.12,
                      shadowRadius: 12,
                      elevation: 8,
                    },
                  ]}>
                      <MaterialCommunityIcons name="account" size={60} color={theme.text} />
                    </View>
                )}
                {/* Pencil icon overlay */}
                <View style={{ position: 'absolute', bottom: 16, right: 16, backgroundColor: theme.card, borderRadius: '50%', padding: 4, borderWidth: 1, borderColor: theme.primary }}>
                  <MaterialCommunityIcons name="pencil" size={26} color={theme.primary} onPress={() => { setAvatarModalVisible(true); setDrawerOpen(false); }} />
                </View>

                </View>
            <Text style={[styles.drawerName, { color: theme.text, fontSize: 26, marginBottom: 4 }]}>{userData?.name || 'User'}</Text>
            {userData?.email && <Text style={[styles.drawerEmail, { color: theme.textSecondary }]}>{userData.email}</Text>}
              </View>
          <View style={{ height: 1, backgroundColor: theme.textSecondary, opacity: 0.15, marginVertical: 8, bottom: 17 }} />
          <View style={styles.drawerOptionsSection}>
            <TouchableOpacity style={styles.drawerOption} onPress={() => setDrawerOpen(false)}>
              <View style={styles.drawerIconContainer}>
                <MaterialCommunityIcons name="home" size={28} color={theme.text} />
              </View>
              <Text style={[styles.drawerOptionText, { color: theme.text }]}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawerOption} onPress={() => { setReminderModalVisible(true); setDrawerOpen(false); }}>
              <View style={styles.drawerIconContainer}>
                <MaterialCommunityIcons name="bell" size={24} color={theme.text} />
              </View>
              <Text style={[styles.drawerOptionText, { color: theme.text }]}>Reminders</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawerOption} onPress={() => { setDrawerOpen(false); setStatisticsModalVisible(true);  }}>
              <View style={styles.drawerIconContainer}>
                <MaterialCommunityIcons name="chart-bar" size={28} color={theme.text} />
              </View>
              <Text style={[styles.drawerOptionText, { color: theme.text }]}>Statistics</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawerOption} onPress={toggleTheme}>
              {isDarkMode ? <View style={styles.drawerIconContainer}><MaterialCommunityIcons name='white-balance-sunny' size={28} color={theme.text} /></View> : <View style={styles.drawerIconContainer}><FontAwesome5 name='moon' size={22} color={theme.text} solid /></View>}
              <Text style={[styles.drawerOptionText, { color: theme.text }]}>Dark Mode</Text>
            </TouchableOpacity>
           
            <TouchableOpacity style={styles.drawerOption} onPress={() => { setSettingsModalVisible(true); setDrawerOpen(false); }}>
              <View style={styles.drawerIconContainer}>
                <MaterialCommunityIcons name="cog" size={28} color={theme.text} />
              </View>
              <Text style={[styles.drawerOptionText, { color: theme.text }]}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawerOption} onPress={() => Linking.openURL("https://github.com/vaibhavxtripathi") }>
              <View style={styles.drawerIconContainer}>
                <MaterialCommunityIcons name="information-outline" size={28} color={theme.text} />
              </View>
              <Text style={[styles.drawerOptionText, { color: theme.text }]}>About</Text>
            </TouchableOpacity>
                        <View style={{ flex: 1 }} />
                        <View style={{ height: 1, backgroundColor: theme.textSecondary, opacity: 0.15, marginVertical: 15 }} />
            <TouchableOpacity style={styles.drawerLogoutButton} onPress={handleReset}>
              <MaterialCommunityIcons name="logout" size={22} color="#fff" />
              <Text style={styles.drawerLogoutText}>Log Out</Text>
                </TouchableOpacity>
              </View>
        </RNAnimated.View>
        {/* Date label */}
        {/* <Text style={styles.dateLabel}>{dateLabel}</Text> */}
        {/* Top bar */}
        <View style={[styles.saasHeader, { backgroundColor: theme.card }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.saasGreeting, { color: theme.text }]}> 
              Hello{userData?.name ? `, ${userData.name.split(' ')[0]}` : ''} <Text style={{ fontSize: 22 }}>👋</Text>
                </Text>
            <Text style={[styles.saasSubtitle, { color: theme.textSecondary }]}>Feeling hydrated?</Text>
              </View>
          <TouchableOpacity onPress={() => setDrawerOpen(true)}>
              {selectedAvatarIndex !== null ? (
                <Image source={demoAvatars[selectedAvatarIndex]} style={{ width: 48, height: 48, borderRadius: 22, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 8 }} />
              ) : (
            <View style={[styles.saasAvatar, { borderColor: theme.primary, backgroundColor: theme.card }]}>
                  
                <MaterialCommunityIcons name="account" size={36} color={theme.primary} />
          </View>
              )}
        </TouchableOpacity>
      </View>

        {/* Goal and Intake */}
      <View style={styles.cardContainer}>
          <View style={[styles.card, { backgroundColor: theme.card }]}>  
          <View style={styles.goalHeaderContainer}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Daily Goal</Text>
              <TouchableOpacity onPress={() => { setNewGoal(goal.toString()); setGoalModalVisible(true); }} style={styles.editButton}>
                <MaterialCommunityIcons name="pencil" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>
            <Text style={[styles.cardText, { color: theme.primary, fontSize: 28, fontWeight: 'bold', marginTop: 2 }]}>{goal} ml</Text>
        </View>
          <View style={[styles.card, styles.progressCard, { backgroundColor: theme.card, position: 'relative' }]}>  
            <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 8 }]}>Current Intake</Text>
            <LiquidProgress
              progress={currentIntake / goal}
              value={currentIntake}
              goal={goal}
              onPress={handleAddWater}
              theme={theme}
            />
            <TouchableOpacity style={[styles.cupSizeButtonFAB, { backgroundColor: theme.primary }]} onPress={() => setCupSizeModalVisible(true)}>
              <MaterialCommunityIcons name="cup-water" size={28} color="#fff" />
            </TouchableOpacity>
        </View>
      </View>

        {/* Divider */}
        {/* <View style={styles.divider} /> */}

        {/* History */}
      <View style={styles.historyHeaderContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.historyTitle, { color: theme.text }]}>Today's Log</Text>
              <MaterialCommunityIcons name="plus" size={22} color={isDarkMode ? '#fff' : '#000'} style={{ marginLeft: 13, top: -17 }} />
                  </View>
            <TouchableOpacity onPress={() => setHistoryModalVisible(true)}>
              <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 15, marginRight: 8, top: -20, textDecorationLine: 'underline'}}>See all</Text>
        </TouchableOpacity>
      </View>
        </View>
        <View style={{ flex: 1 }}>
      <FlatList
        data={history}
            keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
              <View style={[styles.logCard, { backgroundColor: theme.card }]}>
            <View style={styles.bottleTextContainer}>
                  <MaterialCommunityIcons name="cup-water" size={22} color={theme.primary} style={{ alignSelf: 'center', top: 3 }} />
                  <Text style={[styles.historyText, { color: theme.text, alignSelf: 'center', fontWeight: '600' }]}>{item.amount} ml</Text>
            </View>
            <View style={styles.historyRightContainer}>
                  <Text style={[styles.historyTime, { color: theme.textTertiary }]}>{item.time}</Text>
                  <TouchableOpacity style={styles.deleteButton} onPress={() => deleteHistoryEntry(item.id, item.amount)}>
                    <MaterialCommunityIcons name="close-circle" size={22} color={theme.danger} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
              <View style={styles.emptyHistory}>
                <Text style={[styles.emptyHistoryText, { color: theme.textSecondary, textAlign: 'center', marginTop: 50 }]}>No logs for today.</Text>
              </View>
            }
            contentContainerStyle={{ paddingBottom: 0 }}
          />
        </View>

        {/* Goal Modal */}
        <Modal animationType="fade" transparent visible={goalModalVisible} onRequestClose={() => setGoalModalVisible(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setGoalModalVisible(false)}>
            <View style={[styles.modalContent, { backgroundColor: theme.modalBackground }]} onStartShouldSetResponder={() => true} onTouchEnd={e => e.stopPropagation()}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Set Daily Goal</Text>
              <View style={styles.inputContainer}>
                <TextInput style={[styles.goalInput, { color: theme.text, borderColor: theme.textSecondary, backgroundColor: theme.card }]} placeholder="Enter goal in ml" placeholderTextColor={theme.textSecondary} keyboardType="numeric" value={newGoal} onChangeText={setNewGoal} />
                <Text style={[styles.inputUnit, { color: theme.textSecondary }]}>ml</Text>
    </View>
              <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.primary }]} onPress={saveGoal}>
                <Text style={styles.closeButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.cancelButton, { borderColor: theme.primary }]} onPress={() => setGoalModalVisible(false)}>
                <Text style={[styles.cancelButtonText, { color: theme.primary }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Confetti celebration when goal is reached */}
        {showConfetti && (
          <ConfettiCannon
            count={80}
            origin={{ x: width / 2, y: height / 3 }}
            fadeOut
            explosionSpeed={350}
            fallSpeed={2500}
          />
        )}

        {/* Avatar selection modal */}
        <Modal animationType="fade" transparent visible={avatarModalVisible} onRequestClose={() => setAvatarModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.card, width: '90%', maxHeight: '80%' }]}>
              <Text style={[styles.modalTitle, { color: theme.text, fontSize: 24 }]}>Choose your Avatar</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
                {demoAvatars.map((avatar, index) => (
                  <TouchableOpacity key={index} onPress={() => handleAvatarSelect(index)} style={{ margin: 10 }}>
                    <View style={{ position: 'relative', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 8 }}>
                      <Image source={avatar} style={{ width: 80, height: 80, borderRadius: 40 }} />
                      {selectedAvatarIndex === index && (
                        <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: theme.card, borderRadius: '50%', padding: 4, borderWidth: 1, borderColor: theme.primary }}>
                          <MaterialCommunityIcons name="pencil" size={22} color={theme.primary} />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={[styles.cancelButton, { borderColor: theme.border, marginTop: 20 }]} onPress={() => setAvatarModalVisible(false)}>
                <Text style={[styles.cancelButtonText, { color: '#4e8cff' }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Statistics Modal */}
        <Modal
          animationType="fade"
          transparent
          visible={statisticsModalVisible}
          onRequestClose={() => setStatisticsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.statsCard, { backgroundColor: theme.card }]}> 
              {/* Close Button */}
              <TouchableOpacity
                style={styles.statsCloseButton}
                onPress={() => setStatisticsModalVisible(false)}
              >
                <MaterialCommunityIcons name="close" size={26} color={theme.text} />
              </TouchableOpacity>
              {/* Tabs */}
              <View style={styles.statsTabs}>
                {['week', 'month'].map(tab => (
                  <TouchableOpacity
                    key={tab}
                    style={[
                      styles.statsTab,
                      statisticsTab === tab && { borderBottomColor: theme.primary, borderBottomWidth: 3 }
                    ]}
                    onPress={() => setStatisticsTab(tab)}
                  >
                    <Text style={[
                      styles.statsTabText,
                      statisticsTab === tab && { color: theme.primary, fontWeight: 'bold', fontSize: 20 }
                    ]}>
                      {tab === 'week' ? 'WEEK' : 'MONTH'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {/* Header */}
              <Text style={styles.statsTitle}>
                {statisticsTab === 'week' ? 'Your Weekly Progress' : 'Your Monthly Progress'}
              </Text>
              <Text style={styles.statsSubtitle}>
                Track your hydration streak!
              </Text>
              {/* Chart */}
              <View style={{ alignItems: 'center', marginTop: 10 }}>
                {(() => {
                  const chartData = statisticsTab === 'week' ? weeklyData : monthlyData;
                  const safeData = chartData.data && chartData.data.length > 0 ? chartData.data : [0];
                  return (
                    <LineChart
                      data={{
                        labels: chartData.labels,
                        datasets: [{ data: safeData }]
                      }}
                      width={Dimensions.get('window').width * 0.85}
                      height={220}
                      yAxisSuffix="ml"
                      yAxisInterval={1}
                      chartConfig={{
                        backgroundColor: theme.card,
                        backgroundGradientFrom: theme.card,
                        backgroundGradientTo: theme.card,
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(78, 140, 255, ${opacity})`,
                        labelColor: (opacity = 1) => theme.text,
                        style: { borderRadius: 24 },
                        propsForDots: { r: "7", strokeWidth: "3", stroke: theme.primary },
                        propsForBackgroundLines: { stroke: theme.progressBarBg, strokeDasharray: '4' },
                        propsForLabels: { fontWeight: 'bold' }
                      }}
                      bezier
                      style={{ borderRadius: 24 }}
                      withInnerLines={false}
                      withOuterLines={false}
                      withShadow={false}
                    />
                  );
                })()}
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 20, paddingbottom: 5 },
  saasHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: undefined,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 18,
    marginTop: 5,
    shadowColor: '#4e8cff',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  saasGreeting: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  saasSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 0,
  },
  saasAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    borderWidth: 2,
    overflow: 'hidden',
  },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  greeting: { fontSize: 20, fontWeight: "600", fontFamily: 'Inter' },
  cardContainer: { marginBottom: 18 },
  card: {
    padding: 20,
    marginBottom: 20,
    borderRadius: 32,
    backgroundColor: undefined,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#4e8cff',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  progressCard: {
    alignItems: "center",
    paddingVertical: 25,
    borderRadius: 32,
    backgroundColor: undefined,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#4e8cff',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: { fontSize: 20, fontWeight: "bold",  fontFamily: 'Inter' },
  cardText: { fontSize: 22, fontWeight: "bold", fontFamily: 'Inter' },
  progressBarBG: { width: "100%", height: 14, borderRadius: 10, marginVertical: 15 },
  progressBarFill: { height: "100%", borderRadius: 10 },
  buttonRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", position: "relative", width: "100%" },
  addButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25, marginTop: 5 },
  addButtonText: { fontSize: 16, fontWeight: "bold", marginRight: 6 },
  cupSizeButton: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", marginTop: 5, position: "absolute", right: 0, top: 1 },
  historyHeaderContainer: { flexDirection: "row", alignItems: "center", gap: 0, marginBottom: -10, marginTop: 0, zIndex: 100 },
  historyTitle: { fontSize: 20, fontWeight: "600", left: 7, top: -20},
  historyItem: { flexDirection: "row", justifyContent: "space-between", padding: 12, borderRadius: 15, marginBottom: 0, elevation: 2},
  bottleTextContainer: { flexDirection: "row", alignItems: "center", gap: 10 },
  historyRightContainer: { flexDirection: "row", alignItems: "center", gap: 10 },
  historyText: { fontSize: 16, marginTop: 3 },
  historyTime: { fontSize: 14 },
  deleteButton: { padding: 5 },
  emptyText: { textAlign: "center", marginTop: 20, fontSize: 16 },
  timelineContainer: { marginVertical: 10, paddingVertical: 5, borderRadius: 15, paddingHorizontal: 20 },
  timelineTitle: { fontSize: 16, fontWeight: "600", marginBottom: 10, paddingLeft: 0 },
  timelineTrackContainer: { backgroundColor: "transparent", borderRadius: 15, padding: 10 },
  timelineTrack: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", position: "relative", height: 60 },
  timelineConnector: { position: "absolute", top: 20, left: 10, right: 10, height: 4, zIndex: 1, borderRadius: 2 },
  timelineHourContainer: { alignItems: "center", zIndex: 2 },
  timelineCircleOuter: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center", borderWidth: 2, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 3 },
  timelineCircleInner: { width: 23, height: 23, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  timelineHourText: { fontSize: 12, marginTop: 5, fontWeight: "500" },
  goalHeaderContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  editButton: { padding: 5 },
  inputContainer: { flexDirection: "row", alignItems: "center", marginBottom: 20, position: "relative" },
  goalInput: { flex: 1, height: 50, borderWidth: 1, borderRadius: 10, paddingHorizontal: 15, fontSize: 18 },
  inputUnit: { position: "absolute", right: 15, fontSize: 18 },
  saveButton: { padding: 12, borderRadius: 10, alignItems: "center", marginBottom: 10 },
  closeButton: { padding: 12, borderRadius: 10, alignItems: "center", marginTop: 10 },
  closeButtonText: { color: "white", fontWeight: "bold", fontSize: 16 },
  cancelButton: { padding: 12, borderRadius: 10, alignItems: "center", borderWidth: 1 },
  cancelButtonText: { fontWeight: "bold", fontSize: 16 },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: { width: "80%", borderRadius: 15, padding: 20, elevation: 5 },
  settingsModalContent: { width: "90%", maxHeight: "80%", borderRadius: 15, padding: 0, elevation: 5, overflow: "hidden" },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 15, textAlign: "center" },
  cupSizeOption: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, paddingHorizontal: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: "transparent" },
  cupSizeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  cupSizeText: { fontSize: 16 },
  settingsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 15, borderBottomWidth: 1, borderBottomColor: "#eee" },
  settingsTitle: { fontSize: 20, fontWeight: "bold" },
  settingsScrollView: { padding: 15 },
  settingsSection: { marginBottom: 4 },
  settingsSectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 15 },
  settingItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  settingLabel: { fontSize: 16 },
  frequencySelector: { flexDirection: "row", gap: 8 },
  frequencyOption: { width: 40, height: 30, borderRadius: 15, justifyContent: "center", alignItems: "center", backgroundColor: "#eee" },
  frequencyText: { fontSize: 14, fontWeight: "500" },
  settingsButton: { padding: 12, borderRadius: 10, alignItems: "center", marginBottom: 10, flexDirection: 'row', justifyContent: 'center' },
  settingsButtonText: { color: "white", fontWeight: "bold", fontSize: 16 },
  settingsDescription: { fontSize: 14, marginBottom: 5 },
  iconButton: { padding: 5 },
  intakeContainer: { flexDirection: "row", alignItems: "center", justifyContent: "center", position: "relative" },
  dateLabel: { fontSize: 18, color: '#7baaf7', fontWeight: '600', marginTop: 8, marginBottom: 2, marginLeft: 8 },
  divider: { height: 1, backgroundColor: '#e3eafc', marginTop: -8, marginBottom: 18, marginHorizontal: 8, borderRadius: 2, opacity: 0.5 },
  logCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: undefined,
    borderRadius: 32,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#4e8cff',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.32)',
    
  },
  drawer: {
    position: 'absolute',
    left: 0,
    width: 280,
    backgroundColor: '#fff',
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  drawerProfileSection: {
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'center',
  },
  drawerAvatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#eee',
    marginBottom: 18,
  },
  drawerName: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  drawerEmail: {
    fontSize: 14,
    color: '#666',
  },
  drawerOptionsSection: {
    flex: 1,
  },
  drawerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 5,
    marginBottom: 2,
    bottom: 10,
  },
  drawerIconContainer: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerOptionText: {
    fontSize: 18,
    marginLeft: 12,
    fontWeight: '600',
    textAlignVertical: 'center',
  },
  drawerLogoutButton: {
    backgroundColor: '#FF5252',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    marginBottom: 15,
    width: 120,
  },
  drawerLogoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 10,
  },
  cupSizeButtonFAB: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    borderRadius: 28,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4e8cff',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 10,
  },
  statsCard: {
    width: '92%',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#4e8cff',
    shadowOpacity: 0.10,
    shadowRadius: 18,
    elevation: 8,
    marginTop: 40,
    position: 'relative',
    backgroundColor: '#fff', // fallback, will be overridden by theme
  },
  statsCloseButton: {
    position: 'absolute',
    top: 18,
    right: 18,
    zIndex: 10,
    borderRadius: 20,
    padding: 4,
  },
  statsTabs: {
    flexDirection: 'row',
    width: '80%',
    alignSelf: 'center',
    marginBottom: 18,
    marginTop: 10,
    borderBottomWidth: 1,
    borderColor: '#e3eafc',
  },
  statsTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0,
  },
  statsTabText: {
    fontSize: 18,
    color: '#7baaf7',
    letterSpacing: 1,
  },
  statsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4e8cff',
    marginTop: 10,
    textAlign: 'center',
  },
  statsSubtitle: {
    fontSize: 15,
    color: '#7baaf7',
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default HomeScreen;
