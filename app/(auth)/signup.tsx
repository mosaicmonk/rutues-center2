import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../../features/auth/AuthContext";
import { AuthScaffold, authUi } from "../../features/auth/AuthScaffold";

export default function SignupScreen() {
  const router = useRouter();
  const { signup, authBusy } = useAuth();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);

    if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.password) {
      setError("Please complete every field to create your account.");
      return;
    }

    if (form.password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }

    try {
      await signup({
        ...form,
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
      });
      router.replace("/");
    } catch (signupError) {
      setError(signupError instanceof Error ? signupError.message : "Unable to create account.");
    }
  };

  return (
    <AuthScaffold
      eyebrow="Sign up"
      title="Create your account"
      subtitle="Set up your Rutues Center profile once, then finish consent and notification preferences before entering the app."
    >
      <Text style={authUi.label}>First name</Text>
      <TextInput value={form.firstName} onChangeText={(firstName) => setForm((current) => ({ ...current, firstName }))} style={authUi.input} placeholder="Deondre" placeholderTextColor="#7e73a5" />

      <Text style={authUi.label}>Last name</Text>
      <TextInput value={form.lastName} onChangeText={(lastName) => setForm((current) => ({ ...current, lastName }))} style={authUi.input} placeholder="Rutues" placeholderTextColor="#7e73a5" />

      <Text style={authUi.label}>Email</Text>
      <TextInput value={form.email} autoCapitalize="none" keyboardType="email-address" onChangeText={(email) => setForm((current) => ({ ...current, email }))} style={authUi.input} placeholder="name@example.com" placeholderTextColor="#7e73a5" />

      <Text style={authUi.label}>Phone number</Text>
      <TextInput value={form.phone} keyboardType="phone-pad" onChangeText={(phone) => setForm((current) => ({ ...current, phone }))} style={authUi.input} placeholder="(555) 555-5555" placeholderTextColor="#7e73a5" />

      <Text style={authUi.label}>Password</Text>
      <View style={styles.passwordRow}>
        <TextInput
          value={form.password}
          secureTextEntry={!showPassword}
          onChangeText={(password) => setForm((current) => ({ ...current, password }))}
          style={[authUi.input, styles.passwordInput]}
          placeholder="Create a strong password"
          placeholderTextColor="#7e73a5"
        />
        <Pressable style={styles.eyeButton} onPress={() => setShowPassword((current) => !current)}>
          <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#cabfff" />
        </Pressable>
      </View>

      <Text style={[authUi.helper, styles.helperSpacing]}>
        Passwords are never stored in plain text. The backend stores a secure hash only.
      </Text>

      {error ? <Text style={authUi.error}>{error}</Text> : null}

      <Pressable style={[authUi.button, authBusy && authUi.buttonDisabled]} onPress={onSubmit} disabled={authBusy}>
        <Text style={authUi.buttonText}>{authBusy ? "Creating account..." : "Continue"}</Text>
      </Pressable>

      <Text style={styles.footerText}>
        Already have an account? <Link href="/(auth)/login" style={authUi.link}>Log in</Link>
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
  helperSpacing: {
    marginTop: 10,
    marginBottom: 16,
  },
  footerText: {
    color: "#a79fca",
    textAlign: "center",
    marginTop: 18,
  },
});
