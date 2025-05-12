import React, { useRef, useEffect, useState } from 'react';
import { View, Animated, Easing, StyleSheet, Dimensions, TouchableOpacity, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const SIZE = width;

const WAVE1 = { amplitude: 32, frequency: 1.1, speed: 3500, color: '#6fd6f7', opacity: 0.7, yOffset: height * 0.45 };
const WAVE2 = { amplitude: 22, frequency: 1.3, speed: 4200, color: '#274fc5', opacity: 0.9, yOffset: height * 0.5, xOffset: 40 };
const WAVE3 = { amplitude: 18, frequency: 0.9, speed: 5200, color: '#e0f7fa', opacity: 0.8, yOffset: height * 0.41, xOffset: 20 };

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Static wave with fixed, aesthetically pleasing values
const StaticWave = () => {
  const getWavePath = (phase, amplitude, offset, yOffset) => {
    const currentPhase = phase * 2 * Math.PI;
    let path = `M0 ${height}`;
    for (let x = 0; x <= SIZE; x += 2) {
      const y =
        amplitude * Math.sin((2 * Math.PI * (x + offset)) / SIZE + currentPhase) +
        yOffset;
      path += ` L${x} ${y}`;
    }
    path += ` L${SIZE} ${height} L0 ${height} Z`;
    return path;
  };

  return (
    <Svg width={SIZE} height={height}>
      <Path
        d={getWavePath(0.25, 32, 0, height * 0.45)}
        fill="#6fd6f7"
        opacity={0.7}
      />
      <Path
        d={getWavePath(0.75, 22, 40, height * 0.5)}
        fill="#274fc5"
        opacity={0.9}
      />
    </Svg>
  );
};

const WaterWave = ({ onFinish }) => {
  const fillAnim = useRef(new Animated.Value(0)).current;
  const phase1 = useRef(0);
  const phase2 = useRef(0);
  const phase3 = useRef(0);
  const pathRef1 = useRef(null);
  const pathRef2 = useRef(null);
  const pathRef3 = useRef(null);
  const frame = useRef(0);

  useEffect(() => {
    let running = true;
    let lastTime = Date.now();
    function animate() {
      if (!running) return;
      const now = Date.now();
      // Throttle to ~30fps
      if (now - lastTime > 33) {
        lastTime = now;
        phase1.current += (2 * Math.PI) / (WAVE1.speed / 33);
        phase2.current += (2 * Math.PI) / (WAVE2.speed / 33);
        phase3.current += (2 * Math.PI) / (WAVE3.speed / 33);
        if (pathRef1.current) pathRef1.current.setNativeProps({ d: getWavePath(phase1.current, WAVE1) });
        if (pathRef2.current) pathRef2.current.setNativeProps({ d: getWavePath(phase2.current, WAVE2) });
        if (pathRef3.current) pathRef3.current.setNativeProps({ d: getWavePath(phase3.current, WAVE3) });
      }
      requestAnimationFrame(animate);
    }
    animate();

    Animated.timing(fillAnim, {
      toValue: 1,
      duration: 2200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      onFinish && onFinish();
    });

    return () => { running = false; };
  }, []);

  const translateY = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [height, 0],
  });

  function getWavePath(phase, { amplitude, frequency, yOffset, xOffset = 0 }) {
    let path = `M0 ${height}`;
    for (let x = 0; x <= SIZE; x += 10) {
      const y =
        yOffset +
        Math.sin((x / SIZE) * Math.PI * frequency * 2 + phase + (xOffset / SIZE)) * amplitude;
      path += ` L${x} ${y}`;
    }
    path += ` L${SIZE} ${height} L0 ${height} Z`;
    return path;
  }

  return (
    <Animated.View style={{ position: 'absolute', width: SIZE, height, bottom: 0, transform: [{ translateY }] }}>
      <Svg width={SIZE} height={height} style={{ backgroundColor: 'transparent' }}>
        <Path ref={pathRef3} d={getWavePath(0, WAVE3)} fill={WAVE3.color} opacity={WAVE3.opacity} />
        <Path ref={pathRef1} d={getWavePath(0, WAVE1)} fill={WAVE1.color} opacity={WAVE1.opacity} />
        <Path ref={pathRef2} d={getWavePath(0, WAVE2)} fill={WAVE2.color} opacity={WAVE2.opacity} />
      </Svg>
    </Animated.View>
  );
};

export default function OnboardingCompleteScreen() {
  const navigation = useNavigation();
  const [showButton, setShowButton] = useState(false);
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const [goal, setGoal] = useState(null);
  const [displayGoal, setDisplayGoal] = useState(0);
  const goalAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
      const storedGoal = await AsyncStorage.getItem('dailyGoal');
      if (storedGoal) {
        const goalValue = parseInt(storedGoal);
        setGoal(goalValue);
        goalAnim.setValue(0);
        Animated.timing(goalAnim, {
          toValue: goalValue,
          duration: 1200,
          useNativeDriver: false,
          easing: Easing.out(Easing.cubic),
        }).start();
      }
    })();
  }, []);

  useEffect(() => {
    const id = goalAnim.addListener(({ value }) => {
      setDisplayGoal(Math.round(value / 10) * 10);
    });
    return () => goalAnim.removeListener(id);
  }, [goalAnim]);

  const handleFinish = () => {
    setShowButton(true);
    Animated.timing(buttonAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  };

  const handleGetStarted = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      navigation.replace("Home");
    });
  };

  return (
    <Animated.View style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', opacity: fadeAnim }}>
      <WaterWave onFinish={handleFinish} />
      <View style={{ position: 'absolute', top: height * 0.18, width: '100%', alignItems: 'center' }}>
        <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#274fc5', marginBottom: 12 }}>All Set!</Text>
        <Text style={{ fontSize: 18, color: '#274fc5', opacity: 0.7, textAlign: 'center', paddingHorizontal: 32 }}>
          Enjoy Water Mate!
        </Text>
        {goal && (
          <View style={{ marginTop: 30, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, color: '#274fc5', fontWeight: '600', marginBottom: 6 }}>Your recommended daily goal is:</Text>
            <Animated.Text style={{ fontSize: 44, color: '#4e8cff', fontWeight: 'bold', letterSpacing: 1, marginBottom: 0 }}>
              {displayGoal} ml
            </Animated.Text>
          </View>
        )}
      </View>
      {showButton && (
        <Animated.View style={{
          position: 'absolute',
          bottom: height * 0.12,
          width: '100%',
          alignItems: 'center',
          opacity: buttonAnim,
          transform: [{ translateY: buttonAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
        }}>
          <TouchableOpacity
            style={{
              backgroundColor: '#274fc5',
              paddingHorizontal: 38,
              paddingVertical: 16,
              borderRadius: 32,
              elevation: 4,
            }}
            onPress={handleGetStarted}
            activeOpacity={0.85}
          >
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>Get Started  ➤</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </Animated.View>
  );
} 