import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { Animated } from "react-native";
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import LinearGradient from 'react-native-linear-gradient';

const { width: deviceWidth } = Dimensions.get('window');

function calculateGoalFromWeight(weight) {
  if (!weight || isNaN(weight)) return 2000;
  return Math.round(Number(weight) * 38 / 10) * 10;
}

const OnboardingScreen = () => {
  const navigation = useNavigation();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [gender, setGender] = useState("Male");
  const [age, setAge] = useState(18);
  const [weight, setWeight] = useState("");
  const [wakeUpHour, setWakeUpHour] = useState(7);
  const [sleepHour, setSleepHour] = useState(23);
  const [animDirection, setAnimDirection] = useState('right'); // 'right' for next, 'left' for prev
  const animValue = useRef(new Animated.Value(0)).current;

  // Animate on step change
  useEffect(() => {
    animValue.setValue(animDirection === 'right' ? 100 : -100);
    Animated.timing(animValue, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [step]);

  const handleStart = async () => {
    try {
      // Save user data to AsyncStorage
      await AsyncStorage.multiSet([
        [
          "userData",
          JSON.stringify({
            name,
            gender,
            age,
            weight,
            wakeUpHour,
            sleepHour,
          }),
        ],
        ["hasLaunched", "true"],
        ["onboardingCompleted", "true"],
      ]);

      // Calculate and save daily goal from weight
      const calculatedGoal = calculateGoalFromWeight(weight);
      await AsyncStorage.setItem("dailyGoal", String(calculatedGoal));

      // Clear any existing history
      await AsyncStorage.removeItem("history");

      // Set daily intake to 0
      await AsyncStorage.setItem("dailyIntake", "0");

      // Set default cup size if not already set
      const cupSize = await AsyncStorage.getItem("cupSizePreference");
      if (!cupSize) {
        await AsyncStorage.setItem("cupSizePreference", "250");
      }

      // Schedule notifications immediately
      const { NotificationSystem } = require('../utils/notificationHelper');
      await NotificationSystem.initialize();
      await NotificationSystem.scheduleHydrationReminders(wakeUpHour, sleepHour, 8); // Default to 8 reminders
      await NotificationSystem.scheduleDailyReset();

      // Navigate to OnboardingComplete screen
      navigation.replace("OnboardingComplete");
    } catch (err) {
      console.error("Failed in onboarding start:", err);
    }
  };

  const formatHour = (hour) => {
    const period = hour < 12 ? "AM" : "PM";
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${hour12}:00 ${period}`;
  };

  const renderNameStep = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.label, { zIndex: 100 }]}>What's your name?</Text>
      <Image
        source={require("../../assets/name.webp")}
        style={[styles.logo, { marginTop: -20 }]}
        resizeMode="contain"
      />
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Enter your name"
        style={[styles.input, { marginTop: -20 }]}
        placeholderTextColor="#aaa"
      />
    </View>
  );

  const renderGenderStep = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.label, { top: 50 }]}>What's your gender?</Text>
      <View style={[styles.genderRow, { top: 50 }]}>
        <TouchableOpacity onPress={() => setGender("Male")}>
          <Image
            source={require("../../assets/male.webp")}
            style={styles.genderIcons}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setGender("Female")}>
          <Image
            source={require("../../assets/female.webp")}
            style={styles.genderIcons}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
      <View style={[styles.optionsRow, { top: 50 }]}>
        {["Male", "Female"].map((g) => (
          <TouchableOpacity
            key={g}
            style={[styles.optionButton, gender === g && styles.optionSelected]}
            onPress={() => setGender(g)}
          >
            <Text
              style={[
                styles.optionText,
                gender === g && styles.optionTextSelected,
              ]}
            >
              {g}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderAgeStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.label}>Select your age</Text>
      <Image
        source={require("../../assets/age.webp")}
        style={styles.logo}
        resizeMode="contain"
      />
      <View style={styles.pickerWrapperRounded}>
        <Picker
          selectedValue={age}
          onValueChange={(val) => setAge(val)}
          style={[styles.picker, { color: '#000', backgroundColor: '#f0f0f0' }]}
          dropdownIconColor="#000"
          mode="dialog"
        >
          {Array.from({ length: 83 }, (_, i) => 18 + i).map((a) => (
            <Picker.Item key={a} label={`${a}`} value={a} />
          ))}
        </Picker>
      </View>
    </View>
  );

  const renderWeightStep = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.label, { bottom: 20 }]}>What's your body weight?</Text>
      <Image
        source={require("../../assets/weight.webp")}
        style={styles.logo}
        resizeMode="contain"
      />
      <TextInput
        value={weight}
        onChangeText={setWeight}
        placeholder="Enter your weight (kg)"
        style={styles.input}
        placeholderTextColor="#aaa"
        keyboardType="numeric"
        maxLength={4}
      />
    </View>
  );

  const renderWakeTimeStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.label}>When do you usually wake up?</Text>
      <Image
        source={require("../../assets/wake.webp")}
        style={styles.logo}
        resizeMode="contain"
      />
      <View style={styles.pickerWrapperRounded}>
        <Picker
          selectedValue={wakeUpHour}
          onValueChange={(val) => setWakeUpHour(val)}
          style={[styles.picker, { color: '#000', backgroundColor: '#f0f0f0' }]}
          dropdownIconColor="#000"
          mode="dialog"
        >
          {Array.from({ length: 24 }, (_, i) => (
            <Picker.Item key={i} label={formatHour(i)} value={i}/>
          ))}
        </Picker>
      </View>
    </View>
  );

  const renderSleepTimeStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.label}>When do you usually go to sleep?</Text>
      <Image
        source={require("../../assets/sleep.webp")}
        style={styles.logo}
        resizeMode="contain"
      />
      <View style={styles.pickerWrapperRounded}>
        <Picker
          selectedValue={sleepHour}
          onValueChange={(val) => setSleepHour(val)}
          style={[styles.picker, { color: '#000', backgroundColor: '#f0f0f0' }]}
          dropdownIconColor="#000"
          mode="dialog"
        >
          {Array.from({ length: 24 }, (_, i) => (
            <Picker.Item key={i} label={formatHour(i)} value={i}/>
          ))}
        </Picker>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, position: 'relative', backgroundColor: '#fff' }}>
      <SafeAreaView style={styles.container}>
        <View style={styles.fixedStepDotsContainer} pointerEvents="none">
          {/* Step dots moved to bottom section, leave this empty or remove */}
        </View>
        <Animated.View
          style={{
            flex: 1,
            marginTop: 100,
            transform: [{ translateX: animValue }],
            opacity: animValue.interpolate({
              inputRange: [-100, 0, 100],
              outputRange: [0, 1, 0],
            }),
          }}
        >
          {step === 0 && renderNameStep()}
          {step === 1 && renderGenderStep()}
          {step === 2 && renderAgeStep()}
          {step === 3 && renderWeightStep()}
          {step === 4 && renderWakeTimeStep()}
          {step === 5 && renderSleepTimeStep()}
        </Animated.View>
      </SafeAreaView>
      {/* Bottom Section with gradient, rounded corners, step counter, and nav buttons */}
      <LinearGradient
        colors={["#4e8cff", "#6c63ff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.bottomSection,
          {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            width: deviceWidth,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
          },
        ]}
      >
        <View style={styles.stepDotsContainer}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <View
              key={i}
              style={[
                styles.stepDot,
                step === i && styles.stepDotActive
              ]}
            />
          ))}
        </View>
        <View style={styles.bottomNavRow}>
          {step > 0 ? (
            <TouchableOpacity onPress={() => {
              setAnimDirection('left');
              setStep(step - 1);
            }} style={styles.prevButton}>
              <FontAwesome5 name="chevron-left" size={26} color="#4e8cff" />
            </TouchableOpacity>
          ) : <View style={styles.prevButtonPlaceholder} />}
          <TouchableOpacity
            style={[styles.nextButton, (
              (step === 0 && !name.trim()) ||
              (step === 3 && (!weight.trim() || isNaN(Number(weight)) || Number(weight) <= 0))
            ) && { opacity: 0.5 }]}
            onPress={() => {
              if ((step === 0 && !name.trim()) || (step === 3 && (!weight.trim() || isNaN(Number(weight)) || Number(weight) <= 0))) return;
              setAnimDirection('right');
              if (step < 5) setStep(step + 1);
              else handleStart();
            }}
            disabled={
              (step === 0 && !name.trim()) ||
              (step === 3 && (!weight.trim() || isNaN(Number(weight)) || Number(weight) <= 0))
            }
          >
            <Text style={styles.nextText}>{step === 5 ? "Start  ➤" : "Next  ➤"}</Text>
          </TouchableOpacity>
        </View>
        {/* Add extra padding for safe area if needed */}
        <View style={{ height: 24 }} />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 30,
    backgroundColor: "#fff",
  },
  stepContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    width: 350,
    height: 350,
    marginTop: -20,
  },
  label: {
    fontSize: 30,
    fontWeight: "600",
    marginTop: 25,
    textAlign: "center",
    zIndex: 100,
  },
  input: {
    width: "80%",
    borderRadius: 15,
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 16,
    color: "#000",
  },
  optionsRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    justifyContent: "space-around",
    marginTop: 20,
  },
  genderRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-around",
    marginTop: 60,
  },
  genderIcons: {
    width: 150,
    height: 150,
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#eee",
    borderRadius: 25,
    marginTop: 20,
  },
  optionSelected: {
    backgroundColor: "#4e8cff",
  },
  optionText: {
    fontSize: 16,
  },
  optionTextSelected: {
    color: "#fff",
    fontWeight: "bold",
  },
  pickerWrapperRounded: {
    width: '80%',
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#e3eafc',
    overflow: 'hidden',
    alignSelf: 'center',
    marginBottom: 10,
    padding: 3,
  },
  picker: {
    height: 50,
    width: "100%",
  },
  bottomSection: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
    paddingBottom: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
    minHeight: 200,
  },
  stepDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    bottom: 20
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: 6,
    opacity: 0.7,
  },
  stepDotActive: {
    backgroundColor: '#fff',
    opacity: 1,
  },
  bottomNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginHorizontal: 0,
    marginTop: 8,
  },
  prevButton: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4e8cff',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    left: 7
  },
  nextButton: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4e8cff',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  nextText: {
    color: '#4e8cff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  prevButtonPlaceholder: {
    width: 48,
    height: 48,
  },
  fixedStepDotsContainer: {
    position: 'absolute',
    top: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
    pointerEvents: 'none',
  },
});

export default OnboardingScreen;
