import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, TouchableOpacity, StyleSheet, Easing } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, ClipPath, G } from 'react-native-svg';

const RADIUS = 110;
const STROKE = 10;
const SIZE = RADIUS * 2 + STROKE;
const WAVE_AMPLITUDE = 18;
const WAVE_FREQUENCY = 1.1;
const WAVE_SPEED_FAST = 2500;
const WAVE_SPEED_SLOW = 4000;

const LIGHTER_WAVE = { amplitude: 13, frequency: 1.12, speed: 4500, color: '#b2bee8', opacity: 0, yOffset: (RADIUS * 2) * 0.35, phaseOffset: 0.7 };

function getWavePath(progress, phase) {
  // progress: 0 (empty) to 1 (full)
  // phase: for wave animation
  const points = [];
  const waveHeight = (1 - progress) * (RADIUS * 2);
  for (let x = 0; x <= SIZE; x += 2) {
    const y =
      waveHeight +
      Math.sin((x / SIZE) * Math.PI * WAVE_FREQUENCY * 2 + phase) * WAVE_AMPLITUDE;
    points.push(`${x},${y}`);
  }
  // Close the path
  return `M0,${SIZE} L0,${points[0].split(',')[1]} ` +
    points.map((p) => `L${p}`).join(' ') +
    ` L${SIZE},${SIZE} Z`;
}

const LiquidProgress = ({ progress, value, goal, onPress, theme, cupSize = 250 }) => {
  const [wavePath, setWavePath] = useState('');
  const animatedProgress = useRef(new Animated.Value(progress)).current;
  const phase = useRef(new Animated.Value(0)).current;
  const [waveSpeed, setWaveSpeed] = useState(WAVE_SPEED_SLOW);

  // Animated number for intake value
  const animatedNumber = useRef(new Animated.Value(value)).current;
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);

  // Add phase for lighter wave
  const lighterPhase = useRef(new Animated.Value(0)).current;

  const progressRef = useRef(progress);
  const phaseRef = useRef(0);

  // Listen for animatedProgress and phase changes, update refs
  useEffect(() => {
    const progressListener = animatedProgress.addListener(({ value }) => {
      progressRef.current = value;
    });
    const phaseListener = phase.addListener(({ value }) => {
      phaseRef.current = value;
    });
    return () => {
      animatedProgress.removeListener(progressListener);
      phase.removeListener(phaseListener);
    };
  }, [animatedProgress, phase]);

  // Animate progress smoothly
  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 1200,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  // Animate intake number smoothly (integer steps)
  useEffect(() => {
    if (value === prevValueRef.current) return;
    animatedNumber.setValue(prevValueRef.current);
    Animated.timing(animatedNumber, {
      toValue: value,
      duration: Math.min(700, Math.abs(value - prevValueRef.current) * 18 + 200),
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    prevValueRef.current = value;
  }, [value]);

  // Listen to animatedNumber and update displayValue as integer
  useEffect(() => {
    const id = animatedNumber.addListener(({ value }) => {
      setDisplayValue(Math.round(value));
    });
    return () => animatedNumber.removeListener(id);
  }, [animatedNumber]);

  // Animate phase (wave movement)
  useEffect(() => {
    let running = true;
    const animate = () => {
      if (!running) return;
      phase.setValue(0);
      Animated.timing(phase, {
        toValue: 2 * Math.PI,
        duration: waveSpeed,
        useNativeDriver: false,
        easing: Easing.linear,
      }).start(() => animate());
    };
    animate();
    return () => { running = false; };
  }, [waveSpeed, phase]);

  // Animate lighter wave phase
  useEffect(() => {
    let running = true;
    const animate = () => {
      if (!running) return;
      lighterPhase.setValue(0);
      Animated.timing(lighterPhase, {
        toValue: 2 * Math.PI,
        duration: LIGHTER_WAVE.speed,
        useNativeDriver: false,
        easing: Easing.linear,
      }).start(() => animate());
    };
    animate();
    return () => { running = false; };
  }, []);

  // Update wave path on every animation frame (throttled)
  useEffect(() => {
    let mounted = true;
    const update = () => {
      if (!mounted) return;
      setWavePath(getWavePath(progressRef.current, phaseRef.current));
      requestAnimationFrame(update);
    };
    update();
    return () => { mounted = false; };
  }, []);

  // Animated color interpolation for smooth transition
  const valueColor = animatedProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [theme.primary, theme.primary, '#fff'],
  });
  const goalColor = animatedProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [theme.text, theme.text, '#fff'],
  });

  // Use the original onPress
  const handlePress = onPress;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      onLongPress={() => setWaveSpeed(WAVE_SPEED_FAST)}
      onPressOut={() => setWaveSpeed(WAVE_SPEED_SLOW)}
      style={styles.center}
    >
      <View style={styles.shadowWrap}>
        <Svg width={SIZE} height={SIZE}>
          <Defs>
            <LinearGradient id="waterGradient" x1="0" y1="0" x2="0" y2={SIZE}>
              <Stop offset="0%" stopColor={theme.primary + '33'} />
              <Stop offset="100%" stopColor={theme.primary + '99'} />
            </LinearGradient>
            <ClipPath id="clip">
              <Circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} />
            </ClipPath>
          </Defs>
          {/* Outer Circle */}
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={theme.progressBarBg}
            strokeWidth={STROKE}
            fill={theme.card}
            opacity={0.98}
          />
          {/* Animated Wave, clipped to circle */}
          <G clipPath="url(#clip)">
            {/* Lighter blue wave */}
            <AnimatedWave
              progress={animatedProgress}
              phase={lighterPhase}
              amplitude={LIGHTER_WAVE.amplitude}
              frequency={LIGHTER_WAVE.frequency}
              yOffset={LIGHTER_WAVE.yOffset}
              color={LIGHTER_WAVE.color}
              opacity={LIGHTER_WAVE.opacity}
              phaseOffset={LIGHTER_WAVE.phaseOffset}
            />
            {/* Main blue wave */}
            <Path
              d={wavePath}
              fill="url(#waterGradient)"
              stroke="none"
            />
          </G>
        </Svg>
        {/* Absolutely centered value and goal, color animates smoothly */}
        <Animated.View style={styles.absoluteCenter} pointerEvents="none">
          <Animated.Text style={[styles.value, { color: valueColor }]}>{displayValue}</Animated.Text>
          <Animated.Text style={[styles.goal, { color: goalColor }]}>/{goal} ml</Animated.Text>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
};

// AnimatedWave component for the lighter wave
const AnimatedWave = ({ progress, phase, amplitude, frequency, yOffset, color, opacity, phaseOffset = 0 }) => {
  const [path, setPath] = useState('');
  useEffect(() => {
    let mounted = true;
    let lastProg = 0;
    let lastPh = 0;
    const update = () => {
      if (!mounted) return;
      let prog = lastProg;
      let ph = lastPh;
      progress.addListener(({ value }) => { prog = value; lastProg = value; });
      phase.addListener(({ value }) => { ph = value; lastPh = value; });
      setPath(getWavePath(prog, ph + phaseOffset));
      requestAnimationFrame(update);
    };
    update();
    return () => { mounted = false; };
  }, [progress, phase, phaseOffset]);
  return <Path d={path} fill={color} opacity={opacity} stroke="none" />;
};

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', padding: 12 },
  shadowWrap: {
    shadowColor: '#4e8cff',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
    backgroundColor: 'transparent',
    borderRadius: 999,
    zIndex: 1,
  },
  absoluteCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { fontSize: 48, fontWeight: 'bold', marginBottom: 2, textAlign: 'center', fontFamily: 'Inter' },
  goal: { fontSize: 22, fontWeight: '600', marginTop: 0, textAlign: 'center', fontFamily: 'Inter' },
});

export default LiquidProgress;