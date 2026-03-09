import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from "react-native";

import { askAI } from "../../services/aiService";

export default function AIScreen() {
  const [userInput, setUserInput] = useState("");
  const [aiResponse, setAIResponse] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAskAI() {
    if (!userInput.trim() || loading) return;

    setLoading(true);
    setError(null);

    const result = await askAI(userInput.trim());

    if (!result.success) {
      setError(result.error ?? "AI request failed");
      setAIResponse(null);
      setLoading(false);
      return;
    }

    setAIResponse(result);
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rutues AI Planner</Text>

      <TextInput
        placeholder="Example: Plan a birthday party May 31 for 50 guests"
        placeholderTextColor="#747491"
        value={userInput}
        onChangeText={setUserInput}
        style={styles.input}
      />

      <Pressable style={styles.button} onPress={handleAskAI}>
        <Text style={styles.buttonText}>{loading ? "Thinking..." : "Ask AI"}</Text>
      </Pressable>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <ScrollView style={styles.responseBox}>
        {aiResponse ? (
          <Text selectable style={styles.responseText}>
            {JSON.stringify(aiResponse, null, 2)}
          </Text>
        ) : (
          <Text style={styles.placeholderText}>AI response will appear here.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#0e0e11",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "white",
  },
  input: {
    backgroundColor: "#1c1c21",
    padding: 15,
    borderRadius: 8,
    color: "white",
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#4c6ef5",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  errorText: {
    color: "#ff7f8c",
    marginBottom: 12,
  },
  responseBox: {
    flex: 1,
    backgroundColor: "#1c1c21",
    padding: 10,
    borderRadius: 8,
  },
  responseText: {
    color: "#ffffff",
  },
  placeholderText: {
    color: "#8f8fa8",
  },
});
