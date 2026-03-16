import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useCalendar } from "../../CalendarContext";
import { useTasks } from "../../TaskContext";
import AIActivationBubble, { BubbleVisualState } from "../../components/ai/AIActivationBubble";
import { buildPlanFromTranscript } from "../../services/aiPlanner";
import { askAI } from "../../services/aiService";

type VoiceState = "idle" | "listening" | "processing" | "speaking";

export default function AIScreen() {
  const router = useRouter();
  const { addItem } = useCalendar();
  const { addTask } = useTasks();

  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [listeningModalOpen, setListeningModalOpen] = useState(false);
  const [draftTranscript, setDraftTranscript] = useState("");

  const speakTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetSession = () => {
    if (speakTimeoutRef.current) {
      clearTimeout(speakTimeoutRef.current);
      speakTimeoutRef.current = null;
    }

    setListeningModalOpen(false);
    setVoiceState("idle");
    setDraftTranscript("");
  };

  const startListening = () => {
    if (voiceState !== "idle") return;
    setDraftTranscript("");
    setVoiceState("listening");
    setListeningModalOpen(true);
  };

  const processTranscript = async () => {
    const transcript = draftTranscript.trim();
    if (!transcript) {
      setVoiceState("idle");
      setListeningModalOpen(false);
      return;
    }

    setListeningModalOpen(false);
    setVoiceState("processing");

    // Parse locally first so task creation is instant and does not wait on network AI response.
    const plan = buildPlanFromTranscript(transcript);

    // Fire AI call in background for compatibility/analytics, but keep UI flow non-blocking.
    void askAI(transcript);

    // Save first, navigate second, so Calendar is already populated on arrival.
    for (const item of plan.items) {
      addItem(item);
      if (item.kind === "task") {
        addTask({
          id: item.id,
          title: item.title,
          time: `By ${item.date.toDateString()}`,
          app: "AI Planner",
          priority: "Medium",
        });
      }
    }

    const focusDate = plan.items[0]?.date ?? new Date();

    setVoiceState("idle");
    setDraftTranscript("");
    router.push({
      pathname: "/(tabs)/calendar",
      params: { focusDate: focusDate.toISOString() },
    });
  };

  const bubbleState: BubbleVisualState = voiceState === "idle" ? "idle" : "active";

  const isFlowActive = voiceState === "listening" || voiceState === "processing" || voiceState === "speaking";

  const bubbleLabel = useMemo(() => {
    if (voiceState === "listening") return "Listening";
    if (voiceState === "processing") return "Processing";
    if (voiceState === "speaking") return "Saved";
    return "Tap to talk";
  }, [voiceState]);

  return (
    <Pressable
      style={styles.container}
      onPress={() => {
        // Keep tap-off-screen behavior to stop/reset active session.
        if (isFlowActive) {
          resetSession();
        }
      }}
    >
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push("/(tabs)")}>
          <Ionicons name="arrow-back" color="#fff" size={18} />
          <Text style={styles.backText}>Home</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.centerArea}>
        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            startListening();
          }}
        >
          <AIActivationBubble onPress={startListening} state={bubbleState} label={bubbleLabel} />
        </Pressable>
      </View>

      <Modal visible={listeningModalOpen} transparent animationType="fade" onRequestClose={resetSession}>
        <Pressable style={styles.modalBackdrop} onPress={resetSession}>
          <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.modalTitle}>Listening</Text>
            <TextInput
              value={draftTranscript}
              onChangeText={setDraftTranscript}
              multiline
              placeholder="Speak your plan, then paste/type transcript here to continue"
              placeholderTextColor="#7e7e94"
              style={styles.modalInput}
            />
            <TouchableOpacity style={styles.doneBtn} onPress={processTranscript}>
              <Text style={styles.doneBtnText}>Done Speaking</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0e0e11",
  },
  topRow: {
    paddingTop: 58,
    paddingHorizontal: 16,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#202030",
  },
  backText: {
    color: "#fff",
    fontWeight: "600",
  },
  centerArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: "#1b1b24",
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  modalInput: {
    minHeight: 120,
    backgroundColor: "#101018",
    borderRadius: 12,
    color: "#fff",
    padding: 12,
    textAlignVertical: "top",
  },
  doneBtn: {
    marginTop: 12,
    backgroundColor: "#8f5bff",
    borderRadius: 12,
    paddingVertical: 12,
  },
  doneBtnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },
});
