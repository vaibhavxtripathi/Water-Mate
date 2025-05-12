import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Platform, Linking, StyleSheet, ActivityIndicator } from 'react-native';
import notifee from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function AlarmPermissionScreen() {
  const navigation = useNavigation();
  const [checking, setChecking] = useState(true);
  const [needsPermission, setNeedsPermission] = useState(false);

  useEffect(() => {
    async function checkPermission() {
      if (Platform.OS === 'android' && Platform.Version >= 31) {
        const alreadyPrompted = await AsyncStorage.getItem('alarmPromptShown');
        if (alreadyPrompted === 'true') {
          navigation.replace('Welcome');
          return;
        }
        const settings = await notifee.getNotificationSettings();
        if (settings.android?.exactAlarms !== true) {
          setNeedsPermission(true);
        } else {
          await AsyncStorage.setItem('alarmPromptShown', 'true');
          navigation.replace('Welcome');
        }
      } else {
        navigation.replace('Welcome');
      }
      setChecking(false);
    }
    checkPermission();
  }, []);

  const handleOpenSettings = () => {
    Linking.openSettings();
  };

  const handleContinue = async () => {
    await AsyncStorage.setItem('alarmPromptShown', 'true');
    navigation.replace('Welcome');
  };

  if (checking) {
    return (
      <View style={styles.centered}><ActivityIndicator size="large" /></View>
    );
  }

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="alarm" size={70} color="#274fc5" style={{ marginBottom: 18 }} />
      <Text style={styles.title}>Enable Schedule Alarms!</Text>
      <Text style={styles.desc}>
        To receive timely reminders, please enable "Schedule exact alarms" for Water Mate in your device settings.
      </Text>
      <Text style={styles.desc}>
        {'Open Settings > Alarms & Reminders + Unrestricted Battery Optimization'}
      </Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.button, { backgroundColor: '#e3eafc', marginRight: 10 }]} onPress={handleOpenSettings}>
          <Text style={[styles.buttonText, { color: '#274fc5' }]}>Open Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: '#4e8cff', marginLeft: 10 }]} onPress={handleContinue}>
          <Text style={[styles.buttonText, { color: '#fff' }]}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 32 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#274fc5', marginBottom: 18, textAlign: 'center' },
  desc: { fontSize: 17, color: '#274fc5', opacity: 0.8, textAlign: 'center', marginBottom: 36 },
  buttonRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  button: { flex: 1, minWidth: 140, paddingHorizontal: 0, paddingVertical: 16, borderRadius: 24, alignItems: 'center' },
  buttonText: { fontWeight: 'bold', fontSize: 18 },
}); 