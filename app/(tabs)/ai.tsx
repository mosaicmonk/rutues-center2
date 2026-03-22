import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { CalendarItem, useCalendar } from "../../CalendarContext";
import { Task, useTasks } from "../../TaskContext";
import AIActivationBubble, { BubbleVisualState } from "../../components/ai/AIActivationBubble";
import { buildPlanFromTranscript } from "../../services/aiPlanner";
import { askAI } from "../../services/aiService";

type VoiceState = "idle" | "listening" | "processing" | "saving";

const formatTime = (minutes: number) => {
  const hour24 = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const meridiem = hour24 >= 12 ? "PM" : "AM";
  const hour12 = ((hour24 + 11) % 12) + 1;
  return `${hour12}:${minute.toString().padStart(2, "0")} ${meridiem}`;
};

const formatTaskMirror = (item: CalendarItem): Task | null => {
  if (item.kind !== "task") {
    return null;
  }

  const time = item.allDay
    ? "To-Do"
    : `${item.date.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      })} • ${formatTime(item.startMin)}-${formatTime(item.endMin)}`;

  return {
    id: item.id,
    title: item.title,
    time,
    app: item.source === "AI" ? "AI Planner" : "Manual Task",
    priority: item.allDay ? "Medium" : "High",
  };
};

const waitForStateFlush = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

export default function AIScreen() {
  const router = useRouter();
  const { items: calendarItems, addItems } = useCalendar();
  const { addTasks } = useTasks();

  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [listeningModalOpen, setListeningModalOpen] = useState(false);
  const [processingModalOpen, setProcessingModalOpen] = useState(false);
  const [draftTranscript, setDraftTranscript] = useState("");
  const [savedTranscript, setSavedTranscript] = useState("");
  const [statusMessage, setStatusMessage] = useState("Matching the right titles...");
  const [previewItems, setPreviewItems] = useState<CalendarItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const speakTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetSession = () => {
    if (speakTimeoutRef.current) {
      clearTimeout(speakTimeoutRef.current);
      speakTimeoutRef.current = null;
    }

    setListeningModalOpen(false);
    setProcessingModalOpen(false);
    setVoiceState("idle");
    setDraftTranscript("");
    setStatusMessage("Matching the right titles...");
    setPreviewItems([]);
    setErrorMessage(null);
  };

  const startListening = () => {
    if (voiceState !== "idle") return;
    setDraftTranscript("");
    setSavedTranscript("");
    setPreviewItems([]);
    setErrorMessage(null);
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
    setProcessingModalOpen(true);
    setVoiceState("processing");
    setSavedTranscript(transcript);
    setStatusMessage("Matching the right titles...");
    setErrorMessage(null);

    try {
      const plan = buildPlanFromTranscript(transcript, calendarItems);
      setPreviewItems(plan.items);

      setVoiceState("saving");
      setStatusMessage("Saving tasks to your calendar...");

      addItems(plan.items);
      const taskMirrors = plan.items.map(formatTaskMirror).filter((item): item is Task => Boolean(item));
      addTasks(taskMirrors);

      void askAI(transcript);

      await waitForStateFlush();

      const orderedDates = [...plan.items]
        .map((item) => item.date)
        .sort((left, right) => left.getTime() - right.getTime());
      const focusDate = orderedDates[0] ?? new Date();

      resetSession();
      router.push({
        pathname: "/(tabs)/calendar",
        params: { focusDate: focusDate.toISOString() },
      });
    } catch (error) {
      setVoiceState("idle");
      setStatusMessage("We couldn’t save that plan.");
      setErrorMessage(error instanceof Error ? error.message : "Unknown planner error");
    }
  };

  const bubbleState: BubbleVisualState = voiceState === "idle" ? "idle" : "active";
  const isFlowActive = voiceState === "listening" || voiceState === "processing" || voiceState === "saving";

  const bubbleLabel = useMemo(() => {
    if (voiceState === "listening") return "Listening";
    if (voiceState === "processing") return "Matching";
    if (voiceState === "saving") return "Saving";
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

      <Modal visible={processingModalOpen} transparent animationType="fade" onRequestClose={resetSession}>
        <Pressable style={styles.modalBackdrop} onPress={resetSession}>
          <Pressable style={styles.processingCard} onPress={(event) => event.stopPropagation()}>
            <View style={styles.processingHeader}>
              <Text style={styles.processingTitle}>Your brain dump</Text>
              <View style={styles.processingBadge}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.processingBadgeText}>{statusMessage}</Text>
              </View>
            </View>

            <View style={styles.transcriptCard}>
              <Text style={styles.transcriptText}>{savedTranscript}</Text>
            </View>

            <Text style={styles.processingSubtitle}>Matching the right titles...</Text>

            <ScrollView style={styles.previewList} contentContainerStyle={styles.previewListContent}>
              {previewItems.map((item) => (
                <View key={item.id} style={styles.previewItem}>
                  <View style={styles.previewIconWrap}>
                    <Ionicons
                      name={item.allDay ? "checkmark-circle" : item.kind === "event" ? "calendar" : "time"}
                      size={18}
                      color="#1ec78b"
                    />
                  </View>
                  <View style={styles.previewTextWrap}>
                    <Text style={styles.previewTitle}>{item.title}</Text>
                    <Text style={styles.previewMeta}>
                      {item.kind === "event"
                        ? "Scheduled event"
                        : item.allDay
                          ? "To-do"
                          : `${item.date.toLocaleDateString(undefined, {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })} at ${formatTime(item.startMin)}`}
                    </Text>
                  </View>
                </View>
              ))}

              {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
            </ScrollView>
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
  processingCard: {
    maxHeight: "82%",
    backgroundColor: "#171722",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#2d2d3f",
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
  processingHeader: {
    gap: 12,
  },
  processingTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  processingBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    backgroundColor: "#25253a",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  processingBadgeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  transcriptCard: {
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#101018",
    borderWidth: 1,
    borderColor: "#2a2a3b",
  },
  transcriptText: {
    color: "#f4f2ff",
    fontSize: 15,
    lineHeight: 22,
  },
  processingSubtitle: {
    marginTop: 18,
    color: "#d7d3ff",
    fontSize: 16,
    fontWeight: "700",
  },
  previewList: {
    marginTop: 12,
  },
  previewListContent: {
    gap: 12,
    paddingBottom: 4,
  },
  previewItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#11111a",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#222235",
  },
  previewIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(30,199,139,0.12)",
  },
  previewTextWrap: {
    flex: 1,
    gap: 4,
  },
  previewTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  previewMeta: {
    color: "#bcb8d8",
    fontSize: 13,
  },
  errorText: {
    color: "#ff8a9d",
    fontSize: 14,
    lineHeight: 20,
  },
});
