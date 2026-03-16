import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useCalendar } from "../../CalendarContext";
import { useTasks } from "../../TaskContext";
import AIActivationBubble, { BubbleVisualState } from "../../components/ai/AIActivationBubble";
import { BrainDumpPlan, buildBrainDumpPlan } from "../../services/aiPlanner";
import { askAI } from "../../services/aiService";

type VoiceState = "idle" | "listening" | "processing";

export default function AIScreen() {
  const router = useRouter();
  const { items: calendarItems, addItem } = useCalendar();
  const { addTask } = useTasks();

  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [listeningModalOpen, setListeningModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [draftTranscript, setDraftTranscript] = useState("");
  const [previewPlan, setPreviewPlan] = useState<BrainDumpPlan | null>(null);

  const processTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetSession = () => {
    if (processTimeoutRef.current) {
      clearTimeout(processTimeoutRef.current);
      processTimeoutRef.current = null;
    }

    setListeningModalOpen(false);
    setPreviewOpen(false);
    setVoiceState("idle");
    setDraftTranscript("");
    setPreviewPlan(null);
  };

  const startListening = () => {
    if (voiceState !== "idle") return;
    setDraftTranscript("");
    setVoiceState("listening");
    setListeningModalOpen(true);
  };

  const processTranscript = () => {
    const transcript = draftTranscript.trim();
    if (!transcript) {
      setVoiceState("idle");
      setListeningModalOpen(false);
      return;
    }

    setListeningModalOpen(false);
    setVoiceState("processing");

    void askAI(transcript);

    processTimeoutRef.current = setTimeout(() => {
      const plan = buildBrainDumpPlan(transcript, calendarItems);
      setPreviewPlan(plan);
      setPreviewOpen(true);
      setVoiceState("idle");
    }, 500);
  };

  const confirmPlan = () => {
    if (!previewPlan) return;

    for (const item of previewPlan.calendarItems) {
      addItem(item);
    }

    for (const todo of previewPlan.todoTasks) {
      addTask(todo);
    }

    const focusDate = previewPlan.calendarItems[0]?.date ?? previewPlan.tasks[0]?.date ?? new Date();

    setPreviewOpen(false);
    setDraftTranscript("");
    setPreviewPlan(null);

    router.push({
      pathname: "/(tabs)/calendar",
      params: { focusDate: focusDate.toISOString() },
    });
  };

  const bubbleState: BubbleVisualState = voiceState === "idle" ? "idle" : "active";
  const isFlowActive = voiceState === "listening" || voiceState === "processing" || previewOpen;

  const bubbleLabel = useMemo(() => {
    if (voiceState === "listening") return "Listening";
    if (voiceState === "processing") return "Matching titles";
    return "Tap to talk";
  }, [voiceState]);

  return (
    <Pressable
      style={styles.container}
      onPress={() => {
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
            if (voiceState === "processing") return;
            startListening();
          }}
        >
          <AIActivationBubble onPress={startListening} state={bubbleState} label={bubbleLabel} />
        </Pressable>

        {voiceState === "processing" ? <Text style={styles.processingText}>Matching the right titles...</Text> : null}
      </View>

      <Modal visible={listeningModalOpen} transparent animationType="fade" onRequestClose={resetSession}>
        <Pressable style={styles.modalBackdrop} onPress={resetSession}>
          <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.modalTitle}>Brain Dump</Text>
            <TextInput
              value={draftTranscript}
              onChangeText={setDraftTranscript}
              multiline
              placeholder="Speak or type everything on your mind"
              placeholderTextColor="#7e7e94"
              style={styles.modalInput}
            />
            <TouchableOpacity style={styles.doneBtn} onPress={processTranscript}>
              <Text style={styles.doneBtnText}>Organize My Plan</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={previewOpen} transparent animationType="fade" onRequestClose={resetSession}>
        <Pressable style={styles.modalBackdrop} onPress={resetSession}>
          <Pressable style={styles.previewCard} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.modalTitle}>Pick tasks for your plan</Text>
            <Text style={styles.previewSubtitle}>{previewPlan?.summary}</Text>

            <ScrollView style={styles.previewList} contentContainerStyle={{ gap: 10 }}>
              {previewPlan?.tasks.map((task) => (
                <View key={task.id} style={styles.taskCard}>
                  <View style={styles.taskIconWrap}>
                    <Ionicons name={task.isTimed ? "time-outline" : "checkbox-outline"} color="#fff" size={16} />
                  </View>
                  <View style={styles.taskBody}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <Text style={styles.taskMeta}>{task.displayLabel}</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={22} color="#27d89b" />
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.doneBtn} onPress={confirmPlan}>
              <Text style={styles.doneBtnText}>Add to Calendar + Tasks</Text>
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
    gap: 14,
  },
  processingText: {
    color: "#d7d0f8",
    fontSize: 18,
    fontWeight: "600",
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
  previewCard: {
    backgroundColor: "#1b1b24",
    borderRadius: 16,
    padding: 16,
    maxHeight: "78%",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  previewSubtitle: {
    color: "#b6b4c5",
    marginBottom: 12,
  },
  modalInput: {
    minHeight: 120,
    backgroundColor: "#101018",
    borderRadius: 12,
    color: "#fff",
    padding: 12,
    textAlignVertical: "top",
  },
  previewList: {
    marginBottom: 12,
  },
  taskCard: {
    backgroundColor: "#11111a",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  taskIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#8f5bff",
    alignItems: "center",
    justifyContent: "center",
  },
  taskBody: {
    flex: 1,
  },
  taskTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  taskMeta: {
    color: "#b6b4c5",
    marginTop: 2,
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
