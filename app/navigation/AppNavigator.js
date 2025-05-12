// AppNavigator.js
import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createStackNavigator } from "@react-navigation/stack";
import { ActivityIndicator, View, Platform } from "react-native";
import { TransitionPresets } from '@react-navigation/stack';

import WelcomeScreen from "../screens/WelcomeScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import HomeScreen from "../screens/HomeScreen";
import OnboardingCompleteScreen from "../screens/OnboardingCompleteScreen";
import AlarmPermissionScreen from "../screens/AlarmPermissionScreen";

const Stack = createStackNavigator();

const AppNavigator = () => {
  const [initialRoute, setInitialRoute] = useState(null); // initially null to wait for AsyncStorage

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      let tried = 0;
      async function tryCheck() {
        try {
          // Check alarm permission first
          let needsAlarmPermission = false;
          if (Platform.OS === 'android' && Platform.Version >= 31) {
            const alreadyPrompted = await AsyncStorage.getItem('alarmPromptShown');
            console.log('[NAV] alarmPromptShown:', alreadyPrompted);
            if (alreadyPrompted !== 'true') {
              const notifee = require('@notifee/react-native').default;
              const settings = await notifee.getNotificationSettings();
              console.log('[NAV] notifee settings:', settings);
              if (settings.android?.exactAlarms !== true) {
                needsAlarmPermission = true;
              }
            }
          }
          if (needsAlarmPermission) {
            setInitialRoute('AlarmPermission');
            return;
          }
          const onboardingCompleted = await AsyncStorage.getItem("onboardingCompleted");
          const userData = await AsyncStorage.getItem("userData");
          console.log('[NAV] onboardingCompleted:', onboardingCompleted, 'userData:', !!userData);
          if (onboardingCompleted === "true") {
            setInitialRoute("Home");
          } else if (userData) {
            // Fallback: if userData exists, treat as onboarded
            setInitialRoute("Home");
          } else {
            setInitialRoute("Welcome");
          }
        } catch (error) {
          console.error("Error checking onboarding status", error);
          if (tried < 1) {
            tried++;
            setTimeout(tryCheck, 200); // retry once after short delay
          } else {
            setInitialRoute("Welcome"); // fallback to Welcome if error
          }
        }
      }
      tryCheck();
    };

    checkOnboardingStatus();
  }, []);

  // Show loading screen while we check AsyncStorage
  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
      <Stack.Screen name="AlarmPermission" component={AlarmPermissionScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Home" component={HomeScreen} options={{ ...TransitionPresets.FadeFromBottomAndroid }} />
      <Stack.Screen name="OnboardingComplete" component={OnboardingCompleteScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
