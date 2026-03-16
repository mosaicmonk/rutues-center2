import { CalendarItem } from "../CalendarContext";

export type ParsedUserInput = {
  goalTitle: string;
  planningModel: PlanningModel;
  eventDate?: Date;
  eventTimeMin?: number;
  taskDate?: Date;
  location?: string;
  vendor?: string;
  phone?: string;
  notes?: string;
  checklistItems: string[];
  durationMin?: number;
  preferredWindow?: "morning" | "afternoon" | "evening";
};

export type PlannerResult = {
  summary: string;
  items: CalendarItem[];
};

export type PlanningModel = "backward" | "milestone" | "checklist";

const normalizeDate = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const MINUTES_IN_DAY = 24 * 60;
const SLOT_INTERVAL = 15;

const clampDate = (date: Date, min: Date, max: Date) => {
  if (date < min) return new Date(min);
  if (date > max) return new Date(max);
  return date;
};

const parseDate = (text: string): Date | undefined => {
  const slashMatch = text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
  if (slashMatch) {
    const month = Number(slashMatch[1]) - 1;
    const day = Number(slashMatch[2]);
    const year = Number(slashMatch[3]);
    const date = new Date(year, month, day);
    return Number.isNaN(date.getTime()) ? undefined : date;
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

const parseTimeMin = (text: string): number | undefined => {
  const match = text.match(/\b(\d{1,2})(?::(\d{2}))?\s?(AM|PM)\b/i);
  if (!match) return undefined;
  let hour = Number(match[1]) % 12;
  const min = Number(match[2] ?? "0");
  const meridiem = match[3].toUpperCase();
  if (meridiem === "PM") hour += 12;
  return hour * 60 + min;
};

const parseDuration = (text: string): number | undefined => {
  const hourMatch = text.match(/for\s+(\d+(?:\.\d+)?)\s+hours?/i);
  if (hourMatch) {
    return Math.max(15, Math.round(Number(hourMatch[1]) * 60));
  }

  const minMatch = text.match(/for\s+(\d+)\s+minutes?/i);
  if (minMatch) {
    return Math.max(15, Number(minMatch[1]));
  }

  return undefined;
};

const parsePreferredWindow = (text: string): ParsedUserInput["preferredWindow"] => {
  if (/\bmorning\b/i.test(text)) return "morning";
  if (/\bafternoon\b/i.test(text)) return "afternoon";
  if (/\bevening\b/i.test(text)) return "evening";
  return undefined;
};

const parseLocation = (text: string): string | undefined => {
  const matches = Array.from(text.matchAll(/\bat\s+([^,.]+(?:\s[^,.]+){0,8})/gi));
  for (const match of matches) {
    const candidate = match[1]?.trim();
    if (!candidate) continue;
    if (/^\d{1,2}(?::\d{2})?\s?(AM|PM)$/i.test(candidate)) continue;
    return candidate;
  }
  return undefined;
};

const parsePhone = (text: string): string | undefined => {
  const match = text.match(/\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/);
  return match?.[0];
};

const parseChecklistItems = (text: string): string[] => {
  const numbered = Array.from(text.matchAll(/(?:^|\n|\s)(?:\d+\.|-|•)\s*([^\n]+)/g)).map((m) => m[1]?.trim());
  const validNumbered = numbered.filter((item): item is string => Boolean(item && item.length > 2));
  if (validNumbered.length) return validNumbered;

  const directiveMatch = text.match(/(?:need to|tasks?:|to do:|todo:)(.+)/i);
  if (directiveMatch?.[1]) {
    return directiveMatch[1]
      .split(/,| and /i)
      .map((piece) => piece.trim())
      .filter((piece) => piece.length > 2);
  }

  return [];
};

export const parseUserInput = (transcript: string): ParsedUserInput => {
  const eventDate = parseDate(transcript);
  const eventTimeMin = parseTimeMin(transcript);
  const phone = parsePhone(transcript);
  const location = parseLocation(transcript);
  const checklistItems = parseChecklistItems(transcript);
  const durationMin = parseDuration(transcript);
  const preferredWindow = parsePreferredWindow(transcript);

  const vendorMatch = transcript.match(/(?:cater(?:ing|er)?\s+(?:from|by)|vendor\s+is|food\s+from)\s+([^,.]+)/i);

  const lower = transcript.toLowerCase();
  const planningModel =
    /checklist|step by step|to-?do/i.test(transcript)
      ? "checklist"
      : /milestone|phase|stages?/i.test(transcript)
        ? "milestone"
        : "backward";

  const goalTitle =
    transcript.match(/(?:plan|organize|schedule)\s+(?:a\s+)?([^,.]+)/i)?.[1]?.trim() ||
    (lower.includes("birthday")
      ? "Birthday party"
      : lower.includes("wedding")
        ? "Wedding"
        : lower.includes("meeting")
          ? "Meeting"
          : "Planned event");

  const taskDateMatch = transcript.match(/on\s+(\d{1,2}\/\d{1,2}\/\d{4})/i);
  const taskDate = taskDateMatch ? parseDate(taskDateMatch[1]) : eventDate;

  return {
    goalTitle,
    planningModel,
    eventDate,
    eventTimeMin,
    taskDate,
    location,
    vendor: vendorMatch?.[1]?.trim(),
    phone,
    notes: transcript,
    checklistItems,
    durationMin,
    preferredWindow,
  };
};

const scheduleWithinWindow = (eventDate: Date, planningWindowStart: Date, daysBeforeEvent: number) =>
  clampDate(
    new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate() - daysBeforeEvent),
    planningWindowStart,
    eventDate
  );

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const overlaps = (startA: number, endA: number, startB: number, endB: number) => startA < endB && startB < endA;

const findBestStartForWindow = (window: ParsedUserInput["preferredWindow"]): number => {
  if (window === "morning") return 9 * 60;
  if (window === "afternoon") return 13 * 60;
  if (window === "evening") return 18 * 60;
  return 10 * 60;
};

const findOpenSlot = (
  date: Date,
  durationMin: number,
  existingItems: CalendarItem[],
  preferredWindow?: ParsedUserInput["preferredWindow"]
): { startMin: number; endMin: number } => {
  const sameDateItems = existingItems.filter((item) => normalizeDate(item.date).getTime() === normalizeDate(date).getTime());

  const initialStart = findBestStartForWindow(preferredWindow);
  for (let start = initialStart; start <= MINUTES_IN_DAY - durationMin; start += SLOT_INTERVAL) {
    const end = start + durationMin;
    const hasConflict = sameDateItems.some((item) => overlaps(start, end, item.startMin, item.endMin));
    if (!hasConflict) return { startMin: start, endMin: end };
  }

  for (let start = 8 * 60; start <= MINUTES_IN_DAY - durationMin; start += SLOT_INTERVAL) {
    const end = start + durationMin;
    const hasConflict = sameDateItems.some((item) => overlaps(start, end, item.startMin, item.endMin));
    if (!hasConflict) return { startMin: start, endMin: end };
  }

  return { startMin: 20 * 60, endMin: Math.min(20 * 60 + durationMin, MINUTES_IN_DAY) };
};

const buildPlanningTask = (
  title: string,
  date: Date,
  description: string,
  sourceGoalId: string,
  existingItems: CalendarItem[],
  durationMin = 60,
  preferredWindow?: ParsedUserInput["preferredWindow"],
  reminderAt?: string
): CalendarItem => {
  const slot = findOpenSlot(date, durationMin, existingItems, preferredWindow);
  return {
    id: createId(),
    kind: "task",
    title,
    date: normalizeDate(date),
    startMin: slot.startMin,
    endMin: slot.endMin,
    allDay: false,
    color: "#8f5bff",
    description,
    attachments: [],
    source: "AI",
    relatedGoalId: sourceGoalId,
    reminderAt,
  };
};

const pushModelTasks = (
  model: PlanningModel,
  parsed: ParsedUserInput,
  transcript: string,
  goalId: string,
  eventDate: Date,
  planningWindowStart: Date,
  items: CalendarItem[],
  existingItems: CalendarItem[]
) => {
  if (model === "checklist") {
    const generated = [
      [
        `Budget + guest list for ${parsed.goalTitle}`,
        scheduleWithinWindow(eventDate, planningWindowStart, 21),
        "Set spending limits, guest count, and top priorities.",
      ],
      [
        `Book location and key vendors for ${parsed.goalTitle}`,
        scheduleWithinWindow(eventDate, planningWindowStart, 14),
        "Reserve venue and lock in must-have vendors.",
      ],
      [
        `Finalize checklist for ${parsed.goalTitle}`,
        scheduleWithinWindow(eventDate, planningWindowStart, 7),
        "Confirm every line item is assigned and ready.",
      ],
    ] as const;

    generated.forEach(([title, date, description]) => {
      const nextItem = buildPlanningTask(title, date, description, goalId, [...existingItems, ...items]);
      items.push(nextItem);
    });
    return;
  }

  if (model === "milestone") {
    const generated = [
      [
        `Milestone 1: Foundation for ${parsed.goalTitle}`,
        scheduleWithinWindow(eventDate, planningWindowStart, 30),
        "Define scope, budget, and non-negotiables.",
      ],
      [
        `Milestone 2: Vendor lock-in for ${parsed.goalTitle}`,
        scheduleWithinWindow(eventDate, planningWindowStart, 18),
        "Secure vendors and draft run-of-show.",
      ],
      [
        `Milestone 3: Final readiness for ${parsed.goalTitle}`,
        scheduleWithinWindow(eventDate, planningWindowStart, 5),
        "Confirm attendees, logistics, and contingency plans.",
      ],
    ] as const;

    generated.forEach(([title, date, description]) => {
      const nextItem = buildPlanningTask(title, date, description, goalId, [...existingItems, ...items]);
      items.push(nextItem);
    });
    return;
  }

  if (/invitation/i.test(transcript)) {
    items.push(
      buildPlanningTask(
        `Send invitations for ${parsed.goalTitle}`,
        scheduleWithinWindow(eventDate, planningWindowStart, 14),
        "Scheduled from your request to send invitations before the event.",
        goalId,
        [...existingItems, ...items]
      )
    );
  }

  if (parsed.vendor) {
    items.push(
      buildPlanningTask(
        `Confirm catering with ${parsed.vendor}`,
        scheduleWithinWindow(eventDate, planningWindowStart, 7),
        `Vendor requested: ${parsed.vendor}`,
        goalId,
        [...existingItems, ...items]
      )
    );
  }
};

const pushChecklistTasks = (
  parsed: ParsedUserInput,
  goalId: string,
  items: CalendarItem[],
  existingItems: CalendarItem[]
) => {
  if (!parsed.checklistItems.length) return;

  const baseDate = normalizeDate(parsed.taskDate ?? parsed.eventDate ?? new Date());
  parsed.checklistItems.slice(0, 8).forEach((entry, index) => {
    const taskDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + Math.floor(index / 2));
    items.push(
      buildPlanningTask(
        entry.charAt(0).toUpperCase() + entry.slice(1),
        taskDate,
        "Generated from your AI planning checklist.",
        goalId,
        [...existingItems, ...items],
        parsed.durationMin ?? 45,
        parsed.preferredWindow
      )
    );
  });
};

export const buildPlanFromTranscript = (transcript: string, existingItems: CalendarItem[] = []): PlannerResult => {
  const parsed = parseUserInput(transcript);
  const now = new Date();
  const goalId = `goal-${Date.now()}`;
  const items: CalendarItem[] = [];

  if (parsed.eventDate) {
    const eventDate = normalizeDate(parsed.eventDate);
    const planningWindowStart = normalizeDate(
      new Date(eventDate.getFullYear(), eventDate.getMonth() - 2, eventDate.getDate())
    );

    const eventDuration = parsed.durationMin ?? 60;
    const slot = findOpenSlot(eventDate, eventDuration, existingItems, parsed.preferredWindow);

    items.push({
      id: goalId,
      kind: "event",
      title: parsed.goalTitle,
      date: eventDate,
      startMin: parsed.eventTimeMin ?? slot.startMin,
      endMin: Math.min((parsed.eventTimeMin ?? slot.startMin) + eventDuration, MINUTES_IN_DAY),
      allDay: false,
      color: "#6d8bff",
      description:
        [parsed.location ? `Location: ${parsed.location}` : "", parsed.vendor ? `Catering: ${parsed.vendor}` : ""]
          .filter(Boolean)
          .join("\n") || "Created from AI voice planning",
      attachments: [],
      source: "AI",
      reminderAt: new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate() - 1, 9, 0).toISOString(),
    });

    pushModelTasks(parsed.planningModel, parsed, transcript, goalId, eventDate, planningWindowStart, items, existingItems);
  }

  pushChecklistTasks(parsed, goalId, items, existingItems);

  if (parsed.vendor && parsed.taskDate) {
    const vendorDetails = [`Vendor: ${parsed.vendor}`];
    if (parsed.phone) vendorDetails.push(`Phone: ${parsed.phone}`);

    let vendorDate = normalizeDate(parsed.taskDate);
    if (parsed.eventDate) {
      const eventDate = normalizeDate(parsed.eventDate);
      const planningWindowStart = normalizeDate(
        new Date(eventDate.getFullYear(), eventDate.getMonth() - 2, eventDate.getDate())
      );
      vendorDate = clampDate(vendorDate, planningWindowStart, eventDate);
    }

    items.push(
      buildPlanningTask(
        `Add vendor details for ${parsed.goalTitle}`,
        vendorDate,
        vendorDetails.join("\n"),
        goalId,
        [...existingItems, ...items],
        30,
        "afternoon",
        new Date(vendorDate.getFullYear(), vendorDate.getMonth(), vendorDate.getDate() - 1, 9, 0).toISOString()
      )
    );
  }

  if (!items.length) {
    const fallbackDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    items.push(
      buildPlanningTask(
        "Review plan details",
        fallbackDate,
        "I only used details that were spoken. Add date/time/location for more precise planning.",
        goalId,
        existingItems
      )
    );
  }

  return {
    summary: `Used the ${parsed.planningModel} planning model and created ${items.length} calendar item(s) synced to your schedule.`,
    items,
  };
};
