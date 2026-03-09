import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import AIActivationBubble, { BubbleVisualState } from "../../components/ai/AIActivationBubble";
import { askAI } from "../../services/aiService";

export default function AIScreen() {
  // User prompt input shown at the top of the AI screen.
  const [userInput, setUserInput] = useState("");
  // Raw AI payload returned from the service.
  const [aiResponse, setAIResponse] = useState<unknown>(null);
  // Error text for service failures.
  const [error, setError] = useState<string | null>(null);
  // Loading state already used by previous Ask AI button logic.
  const [loading, setLoading] = useState(false);

  // Keep the exact AI request flow, only changing trigger source to the bubble.
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

  // Map screen state to bubble animation mode.
  const bubbleState: BubbleVisualState = loading ? "active" : "idle";

  // Keep status copy centralized to simplify future voice/listening state wiring.
  const bubbleLabel = useMemo(() => {
    if (loading) {
      return "Thinking...";
    }

    if (!userInput.trim()) {
      return "Type a prompt first";
    }

    return "Tap to Ask";
  }, [loading, userInput]);

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

      {/* New premium AI bubble trigger replacing the old Ask AI button. */}
      <AIActivationBubble
        onPress={handleAskAI}
        disabled={loading || !userInput.trim()}
        state={bubbleState}
        label={bubbleLabel}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <ScrollView style={styles.responseBox} contentContainerStyle={styles.responseContent}>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
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
    borderRadius: 12,
    color: "white",
  },
  errorText: {
    color: "#ff7f8c",
    marginTop: 4,
    marginBottom: 10,
  },
  responseBox: {
    flex: 1,
    backgroundColor: "#1c1c21",
    borderRadius: 18,
    marginTop: 10,
  },
  responseContent: {
    padding: 12,
  },
  responseText: {
    color: "#ffffff",
  },
  placeholderText: {
    color: "#8f8fa8",
  },
});
