import React, { useState } from "react";
import { Pressable, Text, TextInput } from "react-native";
import { Link } from "expo-router";

import { useAuth } from "../../features/auth/AuthContext";
import { AuthScaffold, authUi } from "../../features/auth/AuthScaffold";

export default function ForgotPasswordScreen() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (!email.trim()) {
      setError("Enter the email address attached to your account.");
      return;
    }

    setSubmitting(true);
    try {
      const message = await requestPasswordReset(email.trim().toLowerCase());
      setSuccess(message);
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Unable to start the reset process.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScaffold
      eyebrow="Reset password"
      title="Forgot your password?"
      subtitle="Start the reset flow with your email address. If the account exists, the backend will queue a safe reset email without exposing whether the account is registered."
    >
      <Text style={authUi.label}>Email</Text>
      <TextInput value={email} autoCapitalize="none" keyboardType="email-address" onChangeText={setEmail} style={authUi.input} placeholder="name@example.com" placeholderTextColor="#7e73a5" />

      {error ? <Text style={authUi.error}>{error}</Text> : null}
      {success ? <Text style={authUi.success}>{success}</Text> : null}

      <Pressable style={[authUi.button, submitting && authUi.buttonDisabled]} onPress={onSubmit} disabled={submitting}>
        <Text style={authUi.buttonText}>{submitting ? "Starting reset..." : "Send reset instructions"}</Text>
      </Pressable>

      <Text style={{ color: "#a79fca", textAlign: "center", marginTop: 18 }}>
        Back to <Link href="/(auth)/login" style={authUi.link}>login</Link>
      </Text>
    </AuthScaffold>
  );
}
