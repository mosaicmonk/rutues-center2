import { CalendarItem } from "../CalendarContext";
import { Priority, Task } from "../TaskContext";

const MINUTES_IN_DAY = 24 * 60;
const DEFAULT_TIMED_DURATION = 60;

const normalizeDate = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const toTitleCase = (text: string) =>
  text
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

const formatDateLabel = (date: Date) =>
  date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

const formatTimeLabel = (min: number) => {
  const h24 = Math.floor(min / 60);
  const m = min % 60;
  const ampm = h24 >= 12 ? "PM" : "AM";
  const h12 = ((h24 + 11) % 12) + 1;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
};

const parseDate = (text: string): Date | undefined => {
  const slashMatch = text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
  if (slashMatch) {
    const month = Number(slashMatch[1]) - 1;
    const day = Number(slashMatch[2]);
    const year = Number(slashMatch[3]);
    const parsed = new Date(year, month, day);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  const namedMonthMatch = text.match(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,)?\s+(\d{4})\b/i
  );
  if (namedMonthMatch) {
    const parsed = new Date(`${namedMonthMatch[1]} ${namedMonthMatch[2]}, ${namedMonthMatch[3]}`);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  const today = new Date();
  if (/\btomorrow\b/i.test(text)) {
    return new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  }
  if (/\btoday\b/i.test(text)) {
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }

  return undefined;
};

const parseClockTime = (raw: string): number | undefined => {
  const trimmed = raw.trim();
  const match = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) return undefined;

  const hourRaw = Number(match[1]);
  const min = Number(match[2] ?? "0");
  const meridiem = match[3]?.toLowerCase();
  if (hourRaw > 24 || min > 59) return undefined;

  if (!meridiem) {
    if (hourRaw >= 0 && hourRaw <= 23) return hourRaw * 60 + min;
    return undefined;
  }

  let hour = hourRaw % 12;
  if (meridiem === "pm") hour += 12;
  return hour * 60 + min;
};

const parseTimeRange = (text: string): { startMin: number; endMin: number } | undefined => {
  const rangeMatch = text.match(
    /\b(?:from\s+)?(\d{1,2}(?::\d{2})?\s?(?:am|pm)?)\s*(?:to|-|until)\s*(\d{1,2}(?::\d{2})?\s?(?:am|pm)?)\b/i
  );
  if (!rangeMatch) return undefined;

  const start = parseClockTime(rangeMatch[1]);
  let end = parseClockTime(rangeMatch[2]);
  if (start === undefined || end === undefined) return undefined;

  if (end <= start) {
    const startHour = Math.floor(start / 60);
    const endHour = Math.floor(end / 60);
    const endHasMeridiem = /(am|pm)/i.test(rangeMatch[2]);
    const startHasMeridiem = /(am|pm)/i.test(rangeMatch[1]);

    if (!endHasMeridiem && !startHasMeridiem && endHour <= 12 && startHour <= 12) {
      end += 12 * 60;
    } else {
      end += 24 * 60;
    }
  }

  return {
    startMin: Math.max(0, Math.min(start, MINUTES_IN_DAY - 15)),
    endMin: Math.max(15, Math.min(end, MINUTES_IN_DAY)),
  };
};

const parseSingleTime = (text: string): number | undefined => {
  const atMatch = text.match(/\b(?:at|around)\s+(\d{1,2}(?::\d{2})?\s?(?:am|pm)?)\b/i);
  if (atMatch) return parseClockTime(atMatch[1]);

  const plainMatch = text.match(/\b(\d{1,2}(?::\d{2})\s?(?:am|pm)?)\b/i);
  if (plainMatch) return parseClockTime(plainMatch[1]);

  return undefined;
};

const inferDurationMin = (text: string): number => {
  const hourMatch = text.match(/for\s+(\d+(?:\.\d+)?)\s+hours?/i);
  if (hourMatch) return Math.max(15, Math.round(Number(hourMatch[1]) * 60));

  const minuteMatch = text.match(/for\s+(\d+)\s+minutes?/i);
  if (minuteMatch) return Math.max(15, Number(minuteMatch[1]));

  if (/\bwalk\b/i.test(text)) return 60;
  if (/\btherapy\b/i.test(text)) return 60;
  if (/\bdeep work\b/i.test(text)) return 120;
  return DEFAULT_TIMED_DURATION;
};

const splitBrainDumpParts = (transcript: string): string[] => {
  const compact = transcript.replace(/\s+/g, " ").trim();
  if (!compact) return [];

  return compact
    .split(/,|\band\b/gi)
    .map((part) => part.trim())
    .filter(Boolean);
};

const cleanSegmentText = (segment: string) =>
  segment
    .replace(/^i\s+(need to|have to|want to|should)\s+/i, "")
    .replace(/^also\s+/i, "")
    .replace(/^plan\s+/i, "")
    .trim();

const buildCleanTitle = (raw: string): string => {
  const text = cleanSegmentText(raw);

  const textJeremyMatch = text.match(/\btext\s+([a-z]+)\s+back\b/i);
  if (textJeremyMatch) return `Text ${toTitleCase(textJeremyMatch[1])} Back`;

  if (/\bdeep work\b/i.test(text)) return "Deep Work Block";
  if (/\btherapy\b/i.test(text)) return "Therapy Session";
  if (/\bwalk\b/i.test(text)) return "Go for a Walk";
  if (/\bclean\b.*\broom\b/i.test(text) || /\btidy\b.*\broom\b/i.test(text)) return "Clean My Room";

  const stripped = text
    .replace(/\bfrom\s+\d{1,2}(?::\d{2})?\s?(?:am|pm)?\s*(?:to|-|until)\s*\d{1,2}(?::\d{2})?\s?(?:am|pm)?\b/gi, "")
    .replace(/\b(?:at|around)\s+\d{1,2}(?::\d{2})?\s?(?:am|pm)?\b/gi, "")
    .trim();

  return toTitleCase(stripped || text || "Task");
};

const overlaps = (startA: number, endA: number, startB: number, endB: number) => startA < endB && startB < endA;

const findOpenSlot = (date: Date, durationMin: number, existingItems: CalendarItem[]): { startMin: number; endMin: number } => {
  const sameDateItems = existingItems.filter((item) => normalizeDate(item.date).getTime() === normalizeDate(date).getTime());

  for (let start = 8 * 60; start <= MINUTES_IN_DAY - durationMin; start += 15) {
    const end = start + durationMin;
    const hasConflict = sameDateItems.some((item) => overlaps(start, end, item.startMin, item.endMin));
    if (!hasConflict) return { startMin: start, endMin: end };
  }

  return { startMin: 20 * 60, endMin: Math.min(20 * 60 + durationMin, MINUTES_IN_DAY) };
};

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export type BrainDumpDraftTask = {
  id: string;
  rawText: string;
  title: string;
  isTimed: boolean;
  date: Date;
  startMin?: number;
  endMin?: number;
  durationMin?: number;
  displayLabel: string;
};

export type BrainDumpPlan = {
  summary: string;
  tasks: BrainDumpDraftTask[];
  calendarItems: CalendarItem[];
  todoTasks: Task[];
};

const toTaskPriority = (title: string): Priority => {
  if (/urgent|asap|critical/i.test(title)) return "High";
  if (/deep work|therapy|meeting/i.test(title)) return "Medium";
  return "Low";
};

export const buildBrainDumpPlan = (transcript: string, existingItems: CalendarItem[] = []): BrainDumpPlan => {
  const baseDate = normalizeDate(parseDate(transcript) ?? new Date());
  const parts = splitBrainDumpParts(transcript);

  const draftTasks: BrainDumpDraftTask[] = [];
  const calendarItems: CalendarItem[] = [];
  const todoTasks: Task[] = [];

  for (const part of parts) {
    const title = buildCleanTitle(part);
    const range = parseTimeRange(part);
    const singleTime = parseSingleTime(part);

    let isTimed = false;
    let startMin: number | undefined;
    let endMin: number | undefined;

    if (range) {
      isTimed = true;
      startMin = range.startMin;
      endMin = range.endMin;
    } else if (singleTime !== undefined) {
      isTimed = true;
      const durationMin = inferDurationMin(part);
      startMin = singleTime;
      endMin = Math.min(singleTime + durationMin, MINUTES_IN_DAY);
    }

    if (isTimed && startMin !== undefined && endMin !== undefined) {
      const slot = findOpenSlot(baseDate, Math.max(15, endMin - startMin), [...existingItems, ...calendarItems]);
      const finalStart = slot.startMin > startMin ? slot.startMin : startMin;
      const finalEnd = finalStart + Math.max(15, endMin - startMin);

      const taskId = createId();
      const calItem: CalendarItem = {
        id: taskId,
        kind: "task",
        title,
        date: baseDate,
        startMin: finalStart,
        endMin: Math.min(finalEnd, MINUTES_IN_DAY),
        allDay: false,
        color: "#8f5bff",
        description: `Created from AI brain dump: ${part}`,
        attachments: [],
        source: "AI",
      };

      calendarItems.push(calItem);
      draftTasks.push({
        id: taskId,
        rawText: part,
        title,
        isTimed: true,
        date: baseDate,
        startMin: calItem.startMin,
        endMin: calItem.endMin,
        durationMin: calItem.endMin - calItem.startMin,
        displayLabel: `${formatDateLabel(baseDate)} at ${formatTimeLabel(calItem.startMin)} • ${Math.round(
          (calItem.endMin - calItem.startMin) / 60
        )}h`,
      });
      continue;
    }

    const todoId = createId();
    const todo: Task = {
      id: todoId,
      title,
      time: "To-Do",
      app: "AI Planner",
      priority: toTaskPriority(title),
    };

    todoTasks.push(todo);
    draftTasks.push({
      id: todoId,
      rawText: part,
      title,
      isTimed: false,
      date: baseDate,
      displayLabel: "To-Do",
    });
  }

  if (!draftTasks.length) {
    const fallbackId = createId();
    const fallbackTitle = "Review Brain Dump";
    const fallback: Task = {
      id: fallbackId,
      title: fallbackTitle,
      time: "To-Do",
      app: "AI Planner",
      priority: "Low",
    };

    todoTasks.push(fallback);
    draftTasks.push({
      id: fallbackId,
      rawText: transcript,
      title: fallbackTitle,
      isTimed: false,
      date: baseDate,
      displayLabel: "To-Do",
    });
  }

  return {
    summary: `Split your brain dump into ${draftTasks.length} task${draftTasks.length === 1 ? "" : "s"}.`,
    tasks: draftTasks,
    calendarItems,
    todoTasks,
  };
};

// Backward-compatible export for older call sites.
export const buildPlanFromTranscript = (transcript: string, existingItems: CalendarItem[] = []) => {
  const result = buildBrainDumpPlan(transcript, existingItems);
  return { summary: result.summary, items: result.calendarItems };
};
