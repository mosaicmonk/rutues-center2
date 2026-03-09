// ============================================================
// FILE: app/(tabs)/ai.tsx
// LOCATION: ROOT FOLDER → app → (tabs) → ai.tsx
//
// PURPOSE:
// This screen lets the user type a goal and send it to the AI
// backend. The backend will return a structured plan.
// ============================================================

import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from "react-native";

// Import the AI request function we created earlier
import { askAI } from "../../services/aiService";

export default function AIScreen() {

  // ============================================
  // STATE: holds the user's input
  // ============================================
  const [userInput, setUserInput] = useState("");

  // ============================================
  // STATE: holds the AI response
  // ============================================
  const [aiResponse, setAIResponse] = useState<any>(null);

  // ============================================
  // FUNCTION: Sends request to backend AI
  // ============================================
  async function handleAskAI() {

    if (!userInput) return;

    try {

      // Send the message to the backend server
      const result = await askAI(userInput);

      console.log("AI RESULT:", result);

      // Save the response to state so we can display it
      setAIResponse(result);

    } catch (error) {

      console.log("AI ERROR:", error);

    }

  }

  return (

    <View style={styles.container}>

      <Text style={styles.title}>Rutues AI Planner</Text>

      {/* ============================================
          INPUT FIELD
      ============================================ */}

      <TextInput
        placeholder="Example: Plan a birthday party May 31 for 50 guests"
        value={userInput}
        onChangeText={setUserInput}
        style={styles.input}
      />

      {/* ============================================
          SEND BUTTON
      ============================================ */}

      <Pressable style={styles.button} onPress={handleAskAI}>
        <Text style={styles.buttonText}>Ask AI</Text>
      </Pressable>

      {/* ============================================
          RESPONSE DISPLAY
      ============================================ */}

      <ScrollView style={styles.responseBox}>

        {aiResponse && (
          <Text selectable>
            {JSON.stringify(aiResponse, null, 2)}
          </Text>
        )}

      </ScrollView>

    </View>
  );
}


// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#0e0e11"
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "white"
  },

  input: {
    backgroundColor: "#1c1c21",
    padding: 15,
    borderRadius: 8,
    color: "white",
    marginBottom: 10
  },

  button: {
    backgroundColor: "#4c6ef5",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20
  },

  buttonText: {
    color: "white",
    fontWeight: "bold"
  },

  responseBox: {
    flex: 1,
    backgroundColor: "#1c1c21",
    padding: 10,
    borderRadius: 8
  }

});
