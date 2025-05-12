import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Animated,
  StyleSheet,
  Platform,
} from "react-native";
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function WelcomeScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1300,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(buttonAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 6,
    }).start();
  };
  const handlePressOut = () => {
    Animated.spring(buttonAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 6,
    }).start();
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={["#e0f7fa", "#b2ebf2", "#80deea"]}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>  
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Image
              source={require("../../assets/logo.jpg")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appName}>WATER MATE</Text>
          <Text style={styles.tagline}>Hydrate. Hydrate. Hydrate.</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.subtitle}>Your personal hydration buddy!</Text>
          <Animated.View style={{
            transform: [{ scale: buttonAnim }],
            width: '100%',
            alignItems: 'center',
          }}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.replace("Onboarding")}
              activeOpacity={0.85}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              android_ripple={Platform.OS === 'android' ? { color: '#b2ebf2', borderless: false } : undefined}
            >
              <MaterialCommunityIcons name="water" size={22} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>
          </Animated.View>
          <Text style={styles.privacyNote}>We respect your privacy.</Text>
        </View>
        <Text style={styles.byVXTR}>by VXTR</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBox: {
    backgroundColor: '#e0f7fa',
    borderRadius: 32,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#00bcd4',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0077c2',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Bold' : 'sans-serif-medium',
    marginTop: 2,
  },
  tagline: {
    fontSize: 18,
    color: '#0097a7',
    marginTop: 4,
    marginBottom: 12,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'sans-serif',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.21)',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
    backdropFilter: 'blur(4.9px)',
    border: '1px solid rgba(255, 255, 255, 0.41)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: 320,
  },
  subtitle: {
    fontSize: 18,
    color: '#222',
    marginBottom: 24,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'sans-serif',
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#00bcd4',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 32,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#00bcd4',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 150,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Bold' : 'sans-serif-medium',
  },
  privacyNote: {
    fontSize: 12,
    color: '#555',
    marginTop: 12,
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'sans-serif',
  },
  byVXTR: {
    fontSize: 13,
    color: '#7ec6d6',
    marginTop: 24,
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'sans-serif',
    letterSpacing: 1.2,
  },
});
