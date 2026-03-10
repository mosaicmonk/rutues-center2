import { Ionicons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Keyboard,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { CalendarItem, useCalendar } from "../CalendarContext";

import { Priority, useTasks } from "../TaskContext";

type ViewMode = "Month" | "Day";

const normalizeDate = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const MIN_BLOCK_MINUTES = 15;

const safeMinutes = (m: number | undefined | null, fallback: number) =>
  Number.isFinite(m) ? (m as number) : fallback;

const formatTime = (min: number) => {
  if (!Number.isFinite(min)) return "--:--";
  const h24 = Math.floor(min / 60);
  const m = min % 60;
  const ampm = h24 >= 12 ? "PM" : "AM";
  const h12 = ((h24 + 11) % 12) + 1;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
};
// convert minutes since midnight <-> Date (for the selected day)
const minutesToDate = (base: Date, minutes: number) => {
  const d = new Date(base);
  d.setHours(0, 0, 0, 0);
  d.setMinutes(minutes);
  return d;
};

const dateToMinutes = (date: Date) => date.getHours() * 60 + date.getMinutes();

export default function CalendarScreen() {
  const params = useLocalSearchParams<{ focusDate?: string }>();
  const { addTask, removeTask } = useTasks();
  const { items, addItem, updateItem, removeItem } = useCalendar();
  // (remove the old useState for items)


  // default Month view
  const [viewMode, setViewMode] = useState<ViewMode>("Month");

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    // Allow AI flow to focus a specific date after redirecting users here.
    if (!params.focusDate) return;
    const parsed = new Date(params.focusDate);
    if (Number.isNaN(parsed.getTime())) return;

    setSelectedDate(parsed);
    setCurrentMonth(parsed);
  }, [params.focusDate]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toggles, setToggles] = useState({
    myCalendar: true,
    tasks: true,
    birthdays: true,
    holidays: true,
  });

 

  // drag selection
  const HOUR_HEIGHT = 64;
  const MINUTE_HEIGHT = HOUR_HEIGHT / 60;

  const [draft, setDraft] = useState<null | { startMin: number; endMin: number }>(null);
  const [editingItem, setEditingItem] = useState<CalendarItem | null>(null);

  // bottom sheet
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["15%", "50%", "92%"], []);
  const [sheetOpen, setSheetOpen] = useState(false);

  // editor state
  const [kind, setKind] = useState<"task" | "event">("event");
  const [title, setTitle] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [color, setColor] = useState("#8f5bff");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState<{ name: string; uri: string }[]>([]);

  const [colorModalOpen, setColorModalOpen] = useState(false);
  const [customHex, setCustomHex] = useState("#8f5bff");
// ⏰ time picker controls
const [showStartPicker, setShowStartPicker] = useState(false);
const [showEndPicker, setShowEndPicker] = useState(false);

const [editingStart, setEditingStart] = useState<Date | null>(null);
const [editingEnd, setEditingEnd] = useState<Date | null>(null);

  // double-tap detection for month cells
  const [lastTapDate, setLastTapDate] = useState<Date | null>(null);
  const [lastTapTime, setLastTapTime] = useState(0);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setDraft(null);
        setSheetOpen(false);
        setEditingItem(null);
        Keyboard.dismiss();
      };
    }, [])
  );

  useEffect(() => {
    if (viewMode !== "Day") {
      setDraft(null);
    }
  }, [viewMode]);

  const monthLabel = useMemo(
    () =>
      currentMonth.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      }),
    [currentMonth]
  );

  const monthMatrix = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstOfMonth = new Date(year, month, 1);
    const firstWeekday = firstOfMonth.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: Date[] = [];
    for (let i = 0; i < 42; i++) {
      let date: Date;
      if (i < firstWeekday) {
        const day = daysInPrevMonth - firstWeekday + 1 + i;
        date = new Date(year, month - 1, day);
      } else if (i < firstWeekday + daysInMonth) {
        const day = i - firstWeekday + 1;
        date = new Date(year, month, day);
      } else {
        const day = i - (firstWeekday + daysInMonth) + 1;
        date = new Date(year, month + 1, day);
      }
      cells.push(date);
    }

    const rows: Date[][] = [];
    for (let r = 0; r < 6; r++) rows.push(cells.slice(r * 7, r * 7 + 7));
    return rows;
  }, [currentMonth]);

  const goToPrevMonth = () => {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() - 1);
    setCurrentMonth(d);
  };

  const goToNextMonth = () => {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() + 1);
    setCurrentMonth(d);
  };

  const itemsForSelectedDay = items.filter((it) => sameDay(it.date, selectedDate));
  const itemsForDay = (date: Date) => items.filter((it) => sameDay(it.date, date));
  const hasItemsOnDay = (date: Date) => itemsForDay(date).length > 0;

  // ---------- open editor helpers ----------

  const openEditor = (openKind: "task" | "event") => {
    setEditingItem(null);
    setKind(openKind);
    setTitle("");
    setAllDay(false);
    setDescription("");
    setAttachments([]);
    setColor("#8f5bff");

    setSheetOpen(true);
    requestAnimationFrame(() => sheetRef.current?.snapToIndex(0));
  };

  const openEditorForItem = (item: CalendarItem) => {
    setEditingItem(item);
    setKind(item.kind);
    setSelectedDate(item.date);
    setAllDay(item.allDay);
    setTitle(item.title);
    setDescription(item.description);
    setAttachments(item.attachments);
    setColor(item.color);
    setDraft({
      startMin: safeMinutes(item.startMin, 9 * 60),
      endMin: safeMinutes(item.endMin, 10 * 60),
    });

    setSheetOpen(true);
    requestAnimationFrame(() => sheetRef.current?.snapToIndex(1));
  };

  const closeEditor = () => {
    setSheetOpen(false);
    setDraft(null);
    setEditingItem(null);
    Keyboard.dismiss();
  };

  // ---------- day grid interaction ----------

  const onDayGridPress = (y: number) => {
    if (viewMode !== "Day") return;

    const dayItems = itemsForDay(selectedDate).filter((it) => !it.allDay);

    // if click falls inside an existing block, edit it, not new draft
    const hit = dayItems.find((it) => {
      const top = safeMinutes(it.startMin, 9 * 60) * MINUTE_HEIGHT;
      const bottom = safeMinutes(it.endMin, 10 * 60) * MINUTE_HEIGHT;
      return y >= top && y <= bottom;
    });

    if (hit) {
      openEditorForItem(hit);
      return;
    }

    const rawMin = Math.round(y / MINUTE_HEIGHT);
    let startMin = Math.floor(rawMin / 15) * 15;
    startMin = clamp(startMin, 0, 1440 - 60);
    let endMin = startMin + 60;
    endMin = clamp(endMin, startMin + MIN_BLOCK_MINUTES, 1440);

    if (!Number.isFinite(startMin) || !Number.isFinite(endMin)) return;

    setEditingItem(null);
    setDraft({ startMin, endMin });

    setTitle("");
    setAllDay(false);
    setDescription("");
    setAttachments([]);
    setColor("#8f5bff");

    setSheetOpen(true);
    requestAnimationFrame(() => sheetRef.current?.snapToIndex(0));
  };

  const topHandlePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        setDraft((prev) => {
          if (!prev) return prev;
          const deltaMin = Math.round(g.dy / MINUTE_HEIGHT);
          const nextStart = clamp(prev.startMin + deltaMin, 0, prev.endMin - MIN_BLOCK_MINUTES);
          return { ...prev, startMin: nextStart };
        });
      },
    })
  ).current;

  const bottomHandlePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        setDraft((prev) => {
          if (!prev) return prev;
          const deltaMin = Math.round(g.dy / MINUTE_HEIGHT);
          const nextEnd = clamp(prev.endMin + deltaMin, prev.startMin + MIN_BLOCK_MINUTES, 1440);
          return { ...prev, endMin: nextEnd };
        });
      },
    })
  ).current;

  // attachments

  const pickAttachment = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      multiple: true,
      copyToCacheDirectory: true,
    });
    if (res.canceled) return;
    const picks = res.assets.map((a) => ({ name: a.name ?? "file", uri: a.uri }));
    setAttachments((prev) => [...prev, ...picks]);
  };

  const removeAttachment = (uri: string) => {
    setAttachments((prev) => prev.filter((a) => a.uri !== uri));
  };

  // save / update

  const onSave = () => {
    const finalTitle = title.trim() ? title.trim() : "(No title)";
    const baseStart = safeMinutes(draft?.startMin, 9 * 60);
    const baseEnd = safeMinutes(draft?.endMin, baseStart + 60);
  
    if (editingItem) {
      const updated: CalendarItem = {
        ...editingItem,
        title: finalTitle,
        allDay,
        startMin: baseStart,
        endMin: baseEnd,
        color,
        description,
        attachments,
      };
      updateItem(updated); // <-- shared context
    } else {
      const newItem: CalendarItem = {
        id: Date.now().toString(),
        kind,
        title: finalTitle,
        date: normalizeDate(selectedDate),
        startMin: baseStart,
        endMin: baseEnd,
        allDay,
        color,
        description,
        attachments,
        source: "Manual",
      };
  
      addItem(newItem); // <-- shared context
  
      if (kind === "task") {
        addTask({
          id: newItem.id,
          title: finalTitle,
          time: `By ${selectedDate.toDateString()}`,
          app: "Manual Task",
          priority: "Medium" as Priority,
        });
      }
    }
  
    closeEditor();
  };
  
  const onDeleteItem = (item: CalendarItem) => {
    // Delete from calendar source and mirror removal from tasks when needed.
    removeItem(item.id);
    if (item.kind === "task") {
      removeTask(item.id);
    }

    if (editingItem?.id === item.id) {
      closeEditor();
    }
  };

  // collapse sheet when fields lose focus
  const collapseSheetOnBlur = () => {
    Keyboard.dismiss();
    sheetRef.current?.snapToIndex(0);
  };
  // Nudge start/end time in 15-minute steps
  const adjustDraftTime = (field: "start" | "end", deltaMinutes: number) => {
    setDraft((prev) => {
      if (!prev) return prev;

      let start = prev.startMin;
      let end = prev.endMin;

      if (field === "start") {
        // move start but never past end - MIN_BLOCK_MINUTES
        start = clamp(start + deltaMinutes, 0, end - MIN_BLOCK_MINUTES);
      } else {
        // move end but never before start + MIN_BLOCK_MINUTES
        end = clamp(end + deltaMinutes, start + MIN_BLOCK_MINUTES, 1440);
      }

      return { startMin: start, endMin: end };
    });
  };

  const selectedLabel = selectedDate.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  // ---------- Month cell behavior (double-tap -> Day view + draft) ----------

  const handleDayCellPress = (date: Date) => {
    const now = Date.now();

    if (lastTapDate && sameDay(lastTapDate, date) && now - lastTapTime < 350) {
      // double tap
      setSelectedDate(date);
      setViewMode("Day");

      const startMin = 9 * 60;
      const endMin = startMin + 60;
      setDraft({ startMin, endMin });

      setEditingItem(null);
      setKind("event");
      setTitle("");
      setAllDay(false);
      setDescription("");
      setAttachments([]);
      setColor("#8f5bff");

      setSheetOpen(true);
      requestAnimationFrame(() => sheetRef.current?.snapToIndex(0));
    } else {
      // single tap: just select day
      setSelectedDate(date);
      setLastTapDate(date);
      setLastTapTime(now);
    }
  };

  const itemsForSelected = itemsForSelectedDay;

  // ---------- UI ----------

  return (
    <SafeAreaView style={styles.safe}>
      {/* top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconButton} onPress={() => setDrawerOpen(true)}>
          <Ionicons name="menu" size={20} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.topTitle}>{viewMode === "Month" ? monthLabel : selectedLabel}</Text>

        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="search" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {
              setViewMode("Month");
              setCurrentMonth(new Date());
              setSelectedDate(new Date());
              setDraft(null);
              setSheetOpen(false);
              setEditingItem(null);
              Keyboard.dismiss();
            }}
          >
            <Ionicons name="calendar-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* view mode toggle */}
      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[styles.modePill, viewMode === "Day" && styles.modePillActive]}
          onPress={() => setViewMode("Day")}
        >
          <Text style={[styles.modeText, viewMode === "Day" && styles.modeTextActive]}>Day</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modePill, viewMode === "Month" && styles.modePillActive]}
          onPress={() => setViewMode("Month")}
        >
          <Text style={[styles.modeText, viewMode === "Month" && styles.modeTextActive]}>
            Month
          </Text>
        </TouchableOpacity>
      </View>

      {/* main */}
      {viewMode === "Month" ? (
        <View style={{ flex: 1 }}>
          {/* month nav */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={goToPrevMonth} style={styles.monthNavBtn}>
              <Ionicons name="chevron-back" size={18} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.monthNavLabel}>{monthLabel}</Text>
            <TouchableOpacity onPress={goToNextMonth} style={styles.monthNavBtn}>
              <Ionicons name="chevron-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* week header */}
          <View style={styles.weekHeaderRow}>
  {["S", "M", "T", "W", "T", "F", "S"].map((w, index) => (
    <Text key={`${w}-${index}`} style={styles.weekHeaderText}>
      {w}
    </Text>
  ))}
</View>


          {/* month grid */}
<View style={styles.monthGrid}>
  {monthMatrix.map((week, i) => (
    <View key={i} style={styles.weekRow}>
      {week.map((date) => {
        const inMonth = date.getMonth() === currentMonth.getMonth();
        const selected = sameDay(date, selectedDate);

        // all items for this day
        const dayItems = itemsForDay(date);
        // show at most 2 pills in the cell
        const visibleItems = dayItems.slice(0, 2);
        const extraCount = dayItems.length - visibleItems.length;

        return (
          <TouchableOpacity
            key={date.toISOString()}
            style={[styles.dayCell, selected && styles.dayCellSelected]}
            onPress={() => handleDayCellPress(date)}
          >
            {/* date number */}
            <Text
              style={[
                styles.dayNumber,
                !inMonth && styles.dayNumberFaded,
                selected && styles.dayNumberSelected,
              ]}
            >
              {date.getDate()}
            </Text>

            {/* pills under the number */}
            {visibleItems.length > 0 && (
              <View style={styles.pillsContainer}>
                {visibleItems.map((it) => (
                  <View key={it.id} style={styles.pill}>
                    <Text style={styles.pillText} numberOfLines={1}>
                      {it.title}
                    </Text>
                  </View>
                ))}

                {/* "+2" style indicator if more events than we can show */}
                {extraCount > 0 && (
                  <View style={[styles.pill, styles.morePill]}>
                    <Text style={styles.pillText}>+{extraCount}</Text>
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  ))}
</View>


          {/* selected-day list */}
<ScrollView style={styles.selectedList}>
  <Text style={styles.selectedTitle}>
    {selectedDate.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    })}
  </Text>

  {itemsForSelected.length === 0 ? (
    <Text style={styles.emptyText}>No tasks/events for this day.</Text>
  ) : (
    itemsForSelected.map((it) => (
      <View key={it.id} style={styles.swipeRowWrap}>
        <Swipeable
          overshootRight={false}
          friction={2}
          rightThreshold={38}
          renderRightActions={(progress, dragX) => {
            const scale = dragX.interpolate({
              inputRange: [-120, -20, 0],
              outputRange: [1, 0.92, 0.92],
              extrapolate: "clamp",
            });

            return (
              <Animated.View style={[styles.deleteAction, { transform: [{ scale }] }]}>
                <TouchableOpacity
                  style={styles.deleteActionBtn}
                  onPress={() => onDeleteItem(it)}
                  activeOpacity={0.82}
                >
                  <Ionicons name="trash-outline" size={20} color="#fff" />
                  <Text style={styles.deleteActionText}>Delete</Text>
                </TouchableOpacity>
              </Animated.View>
            );
          }}
        >
          {/* Keep row press behavior so existing edit flow still works. */}
          <TouchableOpacity onPress={() => openEditorForItem(it)} activeOpacity={0.9}>
            <View style={styles.itemCard}>
              <View style={styles.itemHeaderRow}>
                <View style={styles.itemTitleRow}>
                  <Ionicons
                    name={it.kind === "event" ? "calendar" : "checkmark-circle-outline"}
                    size={16}
                    color={it.kind === "event" ? "#4fd1c5" : "#a7a3c2"}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.itemTitle}>{it.title}</Text>
                </View>

                <View style={[styles.colorDotSmall, { backgroundColor: it.color }]} />
              </View>

              {it.allDay ? (
                <Text style={styles.itemTime}>All day</Text>
              ) : (
                Number.isFinite(it.startMin) &&
                Number.isFinite(it.endMin) && (
                  <Text style={styles.itemTime}>
                    {formatTime(it.startMin)} – {formatTime(it.endMin)}
                  </Text>
                )
              )}
            </View>
          </TouchableOpacity>
        </Swipeable>
      </View>
    ))
  )}
</ScrollView>

        </View>
      ) : (
        // Day view
        <View style={{ flex: 1 }}>
          <Pressable
            style={styles.dayGridWrap}
            onPress={(evt) => onDayGridPress(evt.nativeEvent.locationY)}
          >
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 90 }}>
              <View style={styles.dayGrid}>
                {Array.from({ length: 24 }).map((_, hour) => (
                  <View key={hour} style={[styles.hourRow, { height: HOUR_HEIGHT }]}>
                    <Text style={styles.hourLabel}>
                      {hour === 0 ? "" : `${((hour + 11) % 12) + 1}${hour < 12 ? "a" : "p"}`}
                    </Text>
                    <View style={styles.hourLine} />
                  </View>
                ))}

                {/* existing blocks */}
                {itemsForDay(selectedDate)
                  .filter((it) => !it.allDay)
                  .map((it) => (
                    <Pressable
                      key={it.id}
                      onPress={() => openEditorForItem(it)}
                      style={[
                        styles.block,
                        {
                          top: safeMinutes(it.startMin, 9 * 60) * MINUTE_HEIGHT,
                          height:
                            (safeMinutes(it.endMin, 10 * 60) -
                              safeMinutes(it.startMin, 9 * 60)) *
                            MINUTE_HEIGHT,
                          backgroundColor: it.color,
                          borderColor: it.color,
                        },
                      ]}
                    >
                      <Text style={styles.blockTitle} numberOfLines={2}>
                        {it.title}
                      </Text>
                      <Text style={styles.blockTime}>
                        {formatTime(it.startMin)} – {formatTime(it.endMin)}
                      </Text>
                    </Pressable>
                  ))}

                {/* draft block */}
                {draft && (
                  <View
                    style={[
                      styles.draftBlock,
                      {
                        top: draft.startMin * MINUTE_HEIGHT,
                        height: (draft.endMin - draft.startMin) * MINUTE_HEIGHT,
                      },
                    ]}
                  >
                    <View style={styles.handleArea} {...topHandlePan.panHandlers}>
                      <View style={styles.handleBar} />
                    </View>

                    <View style={styles.draftInner}>
                      <Text style={styles.draftText}>
                        {editingItem ? "Edit" : "Draft"}
                      </Text>
                      <Text style={styles.draftTextSmall}>
                        {formatTime(draft.startMin)} – {formatTime(draft.endMin)}
                      </Text>
                    </View>

                    <View style={styles.handleArea} {...bottomHandlePan.panHandlers}>
                      <View style={styles.handleBar} />
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>
          </Pressable>
        </View>
      )}

      {/* floating + */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            setDraft(null);
            openEditor("event");
          }}
        >
          <Ionicons name="add" size={26} color="#fff" />
        </TouchableOpacity>

        <View style={styles.fabMenu}>
          <TouchableOpacity
            style={styles.fabMenuItem}
            onPress={() => {
              setDraft(null);
              openEditor("task");
            }}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
            <Text style={styles.fabMenuText}>Task</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.fabMenuItem}
            onPress={() => {
              setDraft(null);
              openEditor("event");
            }}
          >
            <Ionicons name="calendar-outline" size={18} color="#fff" />
            <Text style={styles.fabMenuText}>Event</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* drawer */}
      <Modal visible={drawerOpen} transparent animationType="slide">
        <Pressable style={styles.drawerBackdrop} onPress={() => setDrawerOpen(false)}>
          <Pressable style={styles.drawer} onPress={() => {}}>
            <Text style={styles.drawerTitle}>Rutues Calendar</Text>

            <Text style={styles.drawerSection}>Views</Text>
            {["Schedule", "Day", "3 Day", "Week", "Month"].map((v) => (
              <TouchableOpacity key={v} style={styles.drawerItem}>
                <Text style={styles.drawerItemText}>{v}</Text>
              </TouchableOpacity>
            ))}

            <View style={styles.drawerDivider} />

            <Text style={styles.drawerSection}>Calendars</Text>

            {[
              { key: "myCalendar", label: "My calendar" },
              { key: "tasks", label: "Tasks" },
              { key: "birthdays", label: "Birthdays" },
              { key: "holidays", label: "Holidays" },
            ].map((row) => (
              <View key={row.key} style={styles.drawerToggleRow}>
                <Text style={styles.drawerItemText}>{row.label}</Text>
                <Switch
                  value={(toggles as any)[row.key]}
                  onValueChange={(v) => setToggles((p) => ({ ...p, [row.key]: v }))}
                />
              </View>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {/* bottom sheet editor */}
      {sheetOpen && (
        <BottomSheet
          ref={sheetRef}
          index={0}
          snapPoints={snapPoints}
          enablePanDownToClose
          onClose={closeEditor}
          backgroundStyle={styles.sheetBg}
          handleIndicatorStyle={styles.sheetHandle}
        >
          {/* pinned header */}
          <View style={styles.sheetHeader}>
            <TouchableOpacity onPress={closeEditor}>
              <Text style={styles.sheetCancel}>Cancel</Text>
            </TouchableOpacity>

            <Text style={styles.sheetHeaderTitle}>
              {title.trim() ? title.trim() : "(No title)"}
            </Text>

            <TouchableOpacity onPress={onSave}>
              <Text style={styles.sheetSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
            {/* title */}
            <TextInput
              placeholder="Add title"
              placeholderTextColor="#6d668f"
              value={title}
              onChangeText={setTitle}
              style={styles.titleInput}
              onFocus={() => sheetRef.current?.snapToIndex(1)}
              onBlur={collapseSheetOnBlur}
            />

            {/* all-day + time */}
            <View style={styles.row}>
              <Ionicons name="time-outline" size={18} color="#a7a3c2" style={styles.rowIcon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>All-day</Text>
                <Text style={styles.rowValue}>
                  {draft
                    ? `${selectedDate.toDateString()} • ${formatTime(
                        draft.startMin
                      )} – ${formatTime(draft.endMin)}`
                    : selectedDate.toDateString()}
                </Text>
              </View>
              <Switch value={allDay} onValueChange={setAllDay} />
            </View>
                       {/* Native time rows (only when not all-day and we have a draft) */}
                       {!allDay && draft && (
              <>
                {/* Start time row */}
                <TouchableOpacity
                  style={styles.timeRow}
                  onPress={() => {
                    setEditingStart(minutesToDate(selectedDate, draft.startMin));
                    setShowStartPicker(true);
                  }}
                >
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color="#a7a3c2"
                    style={styles.rowIcon}
                  />
                  <Text style={styles.timeLabel}>Start time</Text>
                  <Text style={styles.timeValue}>{formatTime(draft.startMin)}</Text>
                </TouchableOpacity>

                {/* End time row */}
                <TouchableOpacity
                  style={styles.timeRow}
                  onPress={() => {
                    setEditingEnd(minutesToDate(selectedDate, draft.endMin));
                    setShowEndPicker(true);
                  }}
                >
                  <Ionicons
                    name="time"
                    size={18}
                    color="#a7a3c2"
                    style={styles.rowIcon}
                  />
                  <Text style={styles.timeLabel}>End time</Text>
                  <Text style={styles.timeValue}>{formatTime(draft.endMin)}</Text>
                </TouchableOpacity>
              </>
            )}


            {/* color */}
            <TouchableOpacity style={styles.row} onPress={() => setColorModalOpen(true)}>
              <Ionicons
                name="color-palette-outline"
                size={18}
                color="#a7a3c2"
                style={styles.rowIcon}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>Color</Text>
                <Text style={styles.rowValue}>Tap to choose</Text>
              </View>
              <View style={[styles.colorSwatch, { backgroundColor: color }]} />
              <Ionicons name="chevron-forward" size={16} color="#6d668f" />
            </TouchableOpacity>

            {/* description */}
            <View style={styles.row}>
              <Ionicons
                name="document-text-outline"
                size={18}
                color="#a7a3c2"
                style={styles.rowIcon}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>Description</Text>
                <TextInput
                  placeholder="Add details…"
                  placeholderTextColor="#6d668f"
                  value={description}
                  onChangeText={setDescription}
                  style={styles.descInput}
                  multiline
                  onFocus={() => sheetRef.current?.snapToIndex(2)}
                  onBlur={collapseSheetOnBlur}
                />
              </View>
            </View>

            {/* attachments */}
            <TouchableOpacity style={styles.row} onPress={pickAttachment}>
              <Ionicons name="attach-outline" size={18} color="#a7a3c2" style={styles.rowIcon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>Attachments</Text>
                <Text style={styles.rowValue}>Tap to add files</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#6d668f" />
            </TouchableOpacity>

            {attachments.length > 0 && (
              <View style={styles.attachList}>
                {attachments.map((a) => (
                  <View key={a.uri} style={styles.attachRow}>
                    <Ionicons name="document-outline" size={16} color="#a7a3c2" />
                    <Text style={styles.attachName} numberOfLines={1}>
                      {a.name}
                    </Text>
                    <TouchableOpacity onPress={() => removeAttachment(a.uri)}>
                      <Ionicons name="close" size={16} color="#ff4d67" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <View style={{ height: 40 }} />
          </BottomSheetScrollView>
        </BottomSheet>
      )}
 {/* native start time picker */}
 {showStartPicker && draft && (
        <DateTimePicker
          mode="time"
          value={editingStart ?? minutesToDate(selectedDate, draft.startMin)}
          is24Hour={false}
          display="spinner"
          onChange={(_: any, date?: Date) => {
            setShowStartPicker(false);
            if (!date) return;

            const newMinutes = dateToMinutes(date);
            setEditingStart(date);

            setDraft((prev) => {
              if (!prev) return prev;
              const safeStart = clamp(
                newMinutes,
                0,
                prev.endMin - MIN_BLOCK_MINUTES
              );
              return { startMin: safeStart, endMin: prev.endMin };
            });
          }}
        />
      )}

      {/* native end time picker */}
      {showEndPicker && draft && (
        <DateTimePicker
          mode="time"
          value={editingEnd ?? minutesToDate(selectedDate, draft.endMin)}
          is24Hour={false}
          display="spinner"
          onChange={(_: any, date?: Date) => {
            setShowEndPicker(false);
            if (!date) return;

            const newMinutes = dateToMinutes(date);
            setEditingEnd(date);

            setDraft((prev) => {
              if (!prev) return prev;
              const safeEnd = clamp(
                newMinutes,
                prev.startMin + MIN_BLOCK_MINUTES,
                1440
              );
              return { startMin: prev.startMin, endMin: safeEnd };
            });
          }}
        />
      )}
      {/* color picker modal */}
      <Modal visible={colorModalOpen} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setColorModalOpen(false)}>
          <Pressable style={styles.colorModal} onPress={() => {}}>
            <Text style={styles.colorTitle}>Pick a color</Text>

            <View style={styles.colorRow}>
              {["#8f5bff", "#5665ff", "#4fd1c5", "#ffb547", "#ff4d67", "#5ad49b"].map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c },
                    c === color && styles.colorDotActive,
                  ]}
                  onPress={() => setColor(c)}
                />
              ))}
            </View>

            <Text style={styles.colorSub}>Create new (hex)</Text>
            <TextInput
              value={customHex}
              onChangeText={setCustomHex}
              autoCapitalize="none"
              style={styles.hexInput}
              placeholder="#8f5bff"
              placeholderTextColor="#6d668f"
              onBlur={collapseSheetOnBlur}
            />

            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => {
                const v = customHex.trim();
                if (v.startsWith("#") && (v.length === 7 || v.length === 4)) setColor(v);
                setColorModalOpen(false);
              }}
            >
              <Text style={styles.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#070319" },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#18122f",
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: { color: "#fff", fontSize: 14, fontWeight: "600" },

  modeRow: { flexDirection: "row", gap: 8, paddingHorizontal: 14, paddingBottom: 8 },
  modePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "#18122f",
  },
  modePillActive: { backgroundColor: "#8f5bff" },
  modeText: { color: "#a7a3c2", fontSize: 12 },
  modeTextActive: { color: "#fff", fontWeight: "600" },

  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingBottom: 6,
  },
  monthNavBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#18122f",
    alignItems: "center",
    justifyContent: "center",
  },
  monthNavLabel: { color: "#fff", fontSize: 15, fontWeight: "700" },

  weekHeaderRow: { flexDirection: "row", paddingHorizontal: 12, paddingVertical: 4 },
  weekHeaderText: { flex: 1, textAlign: "center", color: "#6d668f", fontSize: 11 },

  monthGrid: { paddingHorizontal: 8 },
  weekRow: { flexDirection: "row" },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 6,
  },
  dayCellSelected: { backgroundColor: "#18122f", borderRadius: 10 },
  dayNumber: { color: "#fff", fontSize: 13 },
  dayNumberFaded: { color: "#4a425f" },
  dayNumberSelected: { fontWeight: "700" },
  dotBelow: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#4fd1c5",
    marginTop: 3,
  },
  pillsContainer: {
    width: "100%",
    marginTop: 4,
    alignItems: "center",
  },
  pill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "#101024", // dark chip background
    marginTop: 2,
    maxWidth: "90%",
  },
  morePill: {
    backgroundColor: "#18122f", // slightly different for "+N"
  },
  pillText: {
    color: "#66d3ff", // bright-ish blue text
    fontSize: 9,
    fontWeight: "600",
  },

  selectedList: { flex: 1, marginTop: 8, paddingHorizontal: 16 },
  selectedTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  emptyText: { color: "#6d668f", fontSize: 12, marginTop: 6, fontStyle: "italic" },

  swipeRowWrap: { marginTop: 8, borderRadius: 16, overflow: "hidden" },
  itemCard: { backgroundColor: "#18122f", borderRadius: 16, padding: 10, borderWidth: 1, borderColor: "#241a44" },
  deleteAction: {
    width: 108,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#3a165f",
    borderRadius: 16,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: "#7d3cff",
  },
  deleteActionBtn: { alignItems: "center", justifyContent: "center", gap: 4 },
  deleteActionText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  itemHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemTitleRow: { flexDirection: "row", alignItems: "center" },
  itemTitle: { color: "#fff", fontSize: 14, fontWeight: "600" },
  itemTime: { color: "#a7a3c2", fontSize: 12, marginTop: 4 },
  colorDotSmall: { width: 10, height: 10, borderRadius: 5 },

  dayGridWrap: { flex: 1 },
  dayGrid: { paddingHorizontal: 14, position: "relative" },
  hourRow: { flexDirection: "row", alignItems: "flex-start" },
  hourLabel: { width: 40, color: "#6d668f", fontSize: 11, paddingTop: 2 },
  hourLine: { flex: 1, height: 1, backgroundColor: "#18122f", marginTop: 10 },

  block: {
    position: "absolute",
    left: 54,
    right: 8,
    borderRadius: 10,
    padding: 8,
  },
  blockTitle: { color: "#070319", fontWeight: "700", fontSize: 12 },
  blockTime: { color: "#070319", fontWeight: "600", fontSize: 11, marginTop: 2 },

  draftBlock: {
    position: "absolute",
    left: 54,
    right: 8,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#8f5bff",
    backgroundColor: "rgba(143,91,255,0.12)",
    overflow: "hidden",
  },
  handleArea: { height: 18, alignItems: "center", justifyContent: "center" },
  handleBar: { width: 34, height: 4, borderRadius: 2, backgroundColor: "#8f5bff" },
  draftInner: { flex: 1, paddingHorizontal: 8, justifyContent: "center" },
  draftText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  draftTextSmall: { color: "#a7a3c2", fontSize: 11, marginTop: 2 },

  fabContainer: { position: "absolute", right: 16, bottom: 16, alignItems: "flex-end" },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#5665ff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  fabMenu: {
    marginTop: 10,
    backgroundColor: "#18122f",
    padding: 10,
    borderRadius: 16,
    gap: 10,
  },
  fabMenuItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  fabMenuText: { color: "#fff", fontWeight: "700" },

  drawerBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  drawer: {
    width: 280,
    height: "100%",
    backgroundColor: "#070319",
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  drawerTitle: { color: "#fff", fontSize: 18, fontWeight: "800", marginBottom: 16 },
  drawerSection: { color: "#a7a3c2", fontSize: 12, marginTop: 10, marginBottom: 6 },
  drawerItem: { paddingVertical: 10 },
  drawerItemText: { color: "#fff", fontSize: 14 },
  drawerDivider: { height: 1, backgroundColor: "#18122f", marginVertical: 12 },
  drawerToggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },

  sheetBg: { backgroundColor: "#070319" },
  sheetHandle: { backgroundColor: "#2a2145" },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  sheetCancel: { color: "#ff4d67", fontSize: 14 },
  sheetSave: { color: "#4fd1c5", fontSize: 14, fontWeight: "800" },
  sheetHeaderTitle: { color: "#a7a3c2", fontSize: 12 },

  sheetContent: { paddingHorizontal: 16, paddingBottom: 30 },
  titleInput: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#18122f",
    marginBottom: 10,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#18122f",
  },
  rowIcon: { marginRight: 10 },
  rowLabel: { color: "#fff", fontSize: 14, fontWeight: "700" },
  rowValue: { color: "#6d668f", fontSize: 12, marginTop: 2 },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#18122f",
  },
  timeLabel: { color: "#fff", fontSize: 14, fontWeight: "700", flex: 1 },
  timeValue: { color: "#6d668f", fontSize: 12 },

  descInput: { color: "#fff", fontSize: 13, marginTop: 6, minHeight: 60 },

  colorSwatch: { width: 18, height: 18, borderRadius: 9, marginRight: 6 },

  attachList: { marginTop: 10, backgroundColor: "#18122f", borderRadius: 14, padding: 10 },
  attachRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6 },
  attachName: { color: "#fff", flex: 1 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 18,
  },
  colorModal: {
    backgroundColor: "#070319",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#18122f",
  },
  colorTitle: { color: "#fff", fontSize: 16, fontWeight: "800" },
  colorSub: { color: "#a7a3c2", marginTop: 12, marginBottom: 6 },
  colorRow: { flexDirection: "row", gap: 10, marginTop: 12, flexWrap: "wrap" },
  colorDot: { width: 26, height: 26, borderRadius: 13 },
  colorDotActive: { borderWidth: 2, borderColor: "#fff" },
  hexInput: {
    backgroundColor: "#18122f",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#fff",
  },
  applyBtn: {
    marginTop: 10,
    backgroundColor: "#8f5bff",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  applyBtnText: { color: "#fff", fontWeight: "800" },
});
