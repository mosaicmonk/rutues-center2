import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";

/**
 * Visual states used to drive the bubble animation intensity.
 * - idle: subtle breathing animation.
 * - active: stronger pulse used while loading/listening/processing.
 */
export type BubbleVisualState = "idle" | "active";

type AIActivationBubbleProps = {
  /** Called when the user taps the bubble to trigger AI logic. */
  onPress: () => void;
  /** Prevent repeated taps while logic is already running. */
  disabled?: boolean;
  /** Whether the bubble should use active/high-energy animation. */
  state: BubbleVisualState;
  /** Small helper label rendered below the bubble. */
  label: string;
};

/**
 * Reusable, high-end AI orb component with layered glow, pulse, and ripple animations.
 * Built with React Native Animated API so it stays Expo-compatible and lightweight.
 */
export default function AIActivationBubble({ onPress, disabled = false, state, label }: AIActivationBubbleProps) {
  // Continuous pulse for orb breathing (idle) and stronger motion (active).
  const pulse = useRef(new Animated.Value(0)).current;
  // Ripple ring 1 grows and fades.
  const rippleOne = useRef(new Animated.Value(0)).current;
  // Ripple ring 2 starts offset from ring 1 to create a living effect.
  const rippleTwo = useRef(new Animated.Value(0)).current;
  // Short tap feedback scale animation.
  const tapFeedback = useRef(new Animated.Value(1)).current;

  // Rebuild animation loops only when state changes.
  useEffect(() => {
    pulse.stopAnimation();
    rippleOne.stopAnimation();
    rippleTwo.stopAnimation();

    const pulseDuration = state === "active" ? 1400 : 2800;
    const rippleDuration = state === "active" ? 1700 : 2400;

    // Bubble breathing loop.
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: pulseDuration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: pulseDuration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    // Ring one loop.
    const rippleOneLoop = Animated.loop(
      Animated.timing(rippleOne, {
        toValue: 1,
        duration: rippleDuration,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    );

    // Ring two loop with delay so both rings never overlap exactly.
    const rippleTwoLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(rippleDuration / 2),
        Animated.timing(rippleTwo, {
          toValue: 1,
          duration: rippleDuration,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();
    rippleOneLoop.start();
    rippleTwoLoop.start();

    return () => {
      pulseLoop.stop();
      rippleOneLoop.stop();
      rippleTwoLoop.stop();
    };
  }, [pulse, rippleOne, rippleTwo, state]);

  // Map pulse value to scale values for orb and glow layers.
  const orbScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: state === "active" ? [1, 1.08] : [1, 1.03],
  });

  const glowScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: state === "active" ? [1.1, 1.35] : [1.05, 1.18],
  });

  const glowOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: state === "active" ? [0.32, 0.56] : [0.22, 0.34],
  });

  // Helper to derive ring styles from a given animated value.
  const ringStyle = useMemo(
    () => (value: Animated.Value) => ({
      transform: [
        {
          scale: value.interpolate({
            inputRange: [0, 1],
            outputRange: [0.65, state === "active" ? 1.9 : 1.45],
          }),
        },
      ],
      opacity: value.interpolate({
        inputRange: [0, 1],
        outputRange: [0.45, 0],
      }),
    }),
    [state]
  );

  // Handle press with a quick in/out scale to make interaction feel physical.
  const handlePress = () => {
    if (disabled) {
      return;
    }

    Animated.sequence([
      Animated.timing(tapFeedback, {
        toValue: 0.94,
        duration: 90,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(tapFeedback, {
        toValue: 1,
        speed: 15,
        bounciness: 8,
        useNativeDriver: true,
      }),
    ]).start();

    onPress();
  };

  return (
    <View style={styles.wrapper}>
      {/* Ripple rings sit behind the orb to add life and depth. */}
      <Animated.View style={[styles.ring, ringStyle(rippleOne)]} pointerEvents="none" />
      <Animated.View style={[styles.ring, ringStyle(rippleTwo)]} pointerEvents="none" />

      {/* Outer ambient glow layer for premium neon feel. */}
      <Animated.View
        style={[
          styles.outerGlow,
          {
            transform: [{ scale: glowScale }],
            opacity: glowOpacity,
          },
        ]}
        pointerEvents="none"
      />

      {/* Pressable orb that triggers AI logic. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Activate AI"
        disabled={disabled}
        onPress={handlePress}
        style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
      >
        <Animated.View style={[styles.orbContainer, { transform: [{ scale: Animated.multiply(orbScale, tapFeedback) }] }]}>
          <View style={styles.orbCore} />
          <View style={styles.orbHighlight} pointerEvents="none" />
        </Animated.View>
      </Pressable>

      {/* Instruction/status label below the orb. */}
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 22,
  },
  pressable: {
    borderRadius: 999,
  },
  pressed: {
    opacity: 0.95,
  },
  ring: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(138, 105, 255, 0.36)",
  },
  outerGlow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: "#8A69FF",
  },
  orbContainer: {
    width: 190,
    height: 190,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#8A69FF",
    shadowColor: "#8A69FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  orbCore: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#A689FF",
  },
  orbHighlight: {
    position: "absolute",
    top: 24,
    left: 28,
    width: 78,
    height: 58,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.28)",
    transform: [{ rotate: "-18deg" }],
  },
  label: {
    marginTop: 20,
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 0.2,
    color: "#F4EFFF",
  },
});
