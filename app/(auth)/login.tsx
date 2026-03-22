import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../../features/auth/AuthContext";
import { AuthScaffold, authUi } from "../../features/auth/AuthScaffold";

export default function LoginScreen() {
  const router = useRouter();
  const { login, authBusy } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);

    if (!email || !password) {
      setError("Enter your email and password to continue.");
      return;
    }

    try {
      await login({ email: email.trim().toLowerCase(), password, rememberMe });
      router.replace("/");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to sign in.");
    }
  };

  return (
    <AuthScaffold
      eyebrow="Log in"
      title="Welcome back"
      subtitle="Sign in to go straight into your workspace, or stay signed in on this device with a secure session token."
    >
      <Text style={authUi.label}>Email</Text>
      <TextInput value={email} autoCapitalize="none" keyboardType="email-address" onChangeText={setEmail} style={authUi.input} placeholder="name@example.com" placeholderTextColor="#7e73a5" />

      <Text style={authUi.label}>Password</Text>
      <View style={styles.passwordRow}>
        <TextInput
          value={password}
          secureTextEntry={!showPassword}
          onChangeText={setPassword}
          style={[authUi.input, styles.passwordInput]}
          placeholder="Enter your password"
          placeholderTextColor="#7e73a5"
        />
        <Pressable style={styles.eyeButton} onPress={() => setShowPassword((current) => !current)}>
          <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#cabfff" />
        </Pressable>
      </View>

      <View style={styles.rowBetween}>
        <Pressable style={authUi.row} onPress={() => setRememberMe((current) => !current)}>
          <View style={[authUi.checkbox, rememberMe && authUi.checkboxChecked]}>
            {rememberMe ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
          </View>
          <Text style={styles.checkboxLabel}>Keep me signed in</Text>
        </Pressable>

        <Link href="/(auth)/forgot-password" style={styles.forgotLink}>
          Forgot password?
        </Link>
      </View>

      {error ? <Text style={[authUi.error, styles.feedbackSpacing]}>{error}</Text> : null}

      <Pressable style={[authUi.button, authBusy && authUi.buttonDisabled]} onPress={onSubmit} disabled={authBusy}>
        <Text style={authUi.buttonText}>{authBusy ? "Signing in..." : "Log in"}</Text>
      </Pressable>

      <Text style={styles.footerText}>
        New here? <Link href="/(auth)/signup" style={authUi.link}>Create an account</Link>
      </Text>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  passwordRow: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 52,
    marginBottom: 0,
  },
  eyeButton: {
    position: "absolute",
    right: 16,
    top: 13,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    marginBottom: 18,
    gap: 12,
  },
  checkboxLabel: {
    color: "#d8d0f2",
    fontSize: 14,
  },
  forgotLink: {
    color: "#bba5ff",
    fontWeight: "700",
  },
  feedbackSpacing: {
    marginBottom: 18,
  },
  footerText: {
    color: "#a79fca",
    textAlign: "center",
    marginTop: 18,
  },
});
