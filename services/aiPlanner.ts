import type { CalendarItem } from "../CalendarContext";

export type PlannerResult = {
  summary: string;
  items: CalendarItem[];
};

type ParsedSegment = {
  raw: string;
  title: string;
  date: Date;
  startMin?: number;
  endMin?: number;
  durationMin?: number;
  timed: boolean;
};

type EventPlanDetails = {
  title: string;
  eventDate: Date;
  eventStartMin?: number;
  eventDurationMin: number;
  location?: string;
  vendor?: string;
  needsInvitations: boolean;
};

const MINUTES_IN_DAY = 24 * 60;
const DEFAULT_TIMED_DURATION = 60;
const DEFAULT_EVENT_DURATION = 120;
const DEFAULT_DAY_OF_DURATION = 90;

const normalizeDate = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate());

const createId = (prefix = "plan") => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const titleCase = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

const overlaps = (startA: number, endA: number, startB: number, endB: number) => startA < endB && startB < endA;

const safeMinute = (value: number) => Math.max(0, Math.min(MINUTES_IN_DAY, value));

const parseMonthDate = (text: string): Date | undefined => {
  const namedMonthMatch = text.match(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,)?\s+(\d{4})\b/i
  );

  if (!namedMonthMatch) {
    return undefined;
  }

  const parsed = new Date(`${namedMonthMatch[1]} ${namedMonthMatch[2]}, ${namedMonthMatch[3]}`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const parseSlashDate = (text: string): Date | undefined => {
  const slashMatch = text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
  if (!slashMatch) {
    return undefined;
  }

  const parsed = new Date(Number(slashMatch[3]), Number(slashMatch[1]) - 1, Number(slashMatch[2]));
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const parseRelativeDate = (text: string): Date | undefined => {
  const now = new Date();
  if (/\btomorrow\b/i.test(text)) {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  }

  if (/\btoday\b/i.test(text)) {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  return undefined;
};

const parseDateFromText = (text: string): Date | undefined => parseMonthDate(text) ?? parseSlashDate(text) ?? parseRelativeDate(text);

const parseTimeToken = (token: string, fallbackMeridiem?: "AM" | "PM"): number | undefined => {
  const normalized = token.trim().toUpperCase();
  const match = normalized.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/);
  if (!match) {
    return undefined;
  }

  let hour = Number(match[1]);
  const minute = Number(match[2] ?? "0");
  const explicitMeridiem = match[3] as "AM" | "PM" | undefined;
  const meridiem = explicitMeridiem ?? fallbackMeridiem;

  if (meridiem) {
    hour %= 12;
    if (meridiem === "PM") {
      hour += 12;
    }
  }

  if (!meridiem && hour <= 7) {
    hour += 12;
  }

  if (hour > 23 || minute > 59) {
    return undefined;
  }

  return hour * 60 + minute;
};

const parseAtTime = (text: string): { startMin: number; durationMin: number } | undefined => {
  const match = text.match(/\b(?:at|around)\s+(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)\b/i);
  if (!match) {
    return undefined;
  }

  const startMin = parseTimeToken(match[1]);
  if (startMin === undefined) {
    return undefined;
  }

  return { startMin, durationMin: DEFAULT_TIMED_DURATION };
};

const parseRangeTime = (text: string): { startMin: number; endMin: number } | undefined => {
  const match = text.match(
    /\bfrom\s+(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)\s+(?:to|-)\s+(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)\b/i
  );

  if (!match) {
    return undefined;
  }

  const startMeridiem = /AM|PM/i.test(match[1]) ? undefined : (/AM|PM/i.exec(match[2])?.[0]?.toUpperCase() as "AM" | "PM" | undefined);
  const endMeridiem = /AM|PM/i.exec(match[2])?.[0]?.toUpperCase() as "AM" | "PM" | undefined;
  const startMin = parseTimeToken(match[1], startMeridiem);
  const endMin = parseTimeToken(match[2], endMeridiem);

  if (startMin === undefined || endMin === undefined) {
    return undefined;
  }

  if (endMin <= startMin) {
    return { startMin, endMin: safeMinute(startMin + DEFAULT_TIMED_DURATION) };
  }

  return { startMin, endMin };
};

const parseExplicitDuration = (text: string): number | undefined => {
  const hourMatch = text.match(/\bfor\s+(\d+(?:\.\d+)?)\s+hours?\b/i);
  if (hourMatch) {
    return Math.max(15, Math.round(Number(hourMatch[1]) * 60));
  }

  const minuteMatch = text.match(/\bfor\s+(\d+)\s+minutes?\b/i);
  if (minuteMatch) {
    return Math.max(15, Number(minuteMatch[1]));
  }

  return undefined;
};

const splitBrainDump = (transcript: string) => {
  const cleaned = transcript
    .replace(/[\n•]/g, ", ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned
    .split(/,(?![^()]*\))|\band\b/gi)
    .map((part) => part.trim())
    .filter(Boolean);
};

const cleanSegmentLead = (segment: string) =>
  segment
    .replace(/^i(?:'m| am)?\s+/i, "")
    .replace(/^tomorrow\s+/i, "")
    .replace(/^today\s+/i, "")
    .replace(/^i\s+(?:need|have)\s+to\s+/i, "")
    .replace(/^need\s+to\s+/i, "")
    .replace(/^plan\s+/i, "")
    .replace(/^also\s+/i, "")
    .replace(/^to\s+/i, "")
    .trim();

const cleanTitle = (segment: string) => {
  const trimmed = cleanSegmentLead(segment)
    .replace(/\bfrom\s+\d{1,2}(?::\d{2})?\s*(?:AM|PM)?\s+(?:to|-)\s+\d{1,2}(?::\d{2})?\s*(?:AM|PM)?\b/gi, "")
    .replace(/\b(?:at|around)\s+\d{1,2}(?::\d{2})?\s*(?:AM|PM)?\b/gi, "")
    .replace(/\bfor\s+\d+(?:\.\d+)?\s+(?:hours?|minutes?)\b/gi, "")
    .replace(/[.]/g, "")
    .trim();

  if (/deep\s+work/i.test(trimmed)) return "Deep Work Block";
  if (/\btherapy\b/i.test(trimmed)) return "Therapy Session";
  if (/\bwalk\b/i.test(trimmed)) return "Go for a Walk";
  if (/\btext\s+jeremy\s+back\b/i.test(trimmed)) return "Text Jeremy Back";
  if (/\bclean\s+my\s+room\b/i.test(trimmed) || /\btidy\s+(?:my\s+)?room\b/i.test(trimmed)) return "Clean My Room";
  if (/\binvitation/i.test(trimmed)) return "Send Invitations";
  if (/\bcater/i.test(trimmed)) return "Confirm Catering";

  return titleCase(trimmed.replace(/^a\s+/i, "").trim());
};

const findOpenSlot = (date: Date, startMin: number, durationMin: number, existingItems: CalendarItem[]) => {
  const normalizedTarget = normalizeDate(date).getTime();
  const sameDayItems = existingItems.filter((item) => normalizeDate(item.date).getTime() === normalizedTarget && !item.allDay);

  let candidateStart = safeMinute(startMin);
  let candidateEnd = safeMinute(candidateStart + durationMin);

  while (candidateEnd <= MINUTES_IN_DAY) {
    const conflict = sameDayItems.find((item) => overlaps(candidateStart, candidateEnd, item.startMin, item.endMin));
    if (!conflict) {
      return { startMin: candidateStart, endMin: candidateEnd };
    }

    candidateStart = Math.max(candidateStart + 15, conflict.endMin);
    candidateEnd = candidateStart + durationMin;
  }

  const fallbackEnd = safeMinute(Math.max(candidateStart, MINUTES_IN_DAY - durationMin) + durationMin);
  return {
    startMin: safeMinute(Math.max(8 * 60, fallbackEnd - durationMin)),
    endMin: fallbackEnd,
  };
};

const createTimedTask = (
  title: string,
  date: Date,
  startMin: number,
  durationMin: number,
  existingItems: CalendarItem[],
  description: string,
  relatedGoalId?: string,
  color = "#8f5bff"
): CalendarItem => {
  const slot = findOpenSlot(date, startMin, durationMin, existingItems);
  return {
    id: createId("item"),
    kind: "task",
    title,
    date: normalizeDate(date),
    startMin: slot.startMin,
    endMin: slot.endMin,
    allDay: false,
    color,
    description,
    attachments: [],
    source: "AI",
    relatedGoalId,
  };
};

const createTodoTask = (title: string, date: Date, description: string, relatedGoalId?: string): CalendarItem => ({
  id: createId("item"),
  kind: "task",
  title,
  date: normalizeDate(date),
  startMin: 0,
  endMin: 0,
  allDay: true,
  color: "#8f5bff",
  description,
  attachments: [],
  source: "AI",
  relatedGoalId,
});

const parseBrainDumpSegments = (transcript: string): ParsedSegment[] => {
  const baseDate = normalizeDate(parseDateFromText(transcript) ?? new Date());
  const parsedSegments: ParsedSegment[] = [];

  splitBrainDump(transcript).forEach((segment) => {
    const cleanedSegment = cleanSegmentLead(segment);
    if (!cleanedSegment) {
      return;
    }

    const range = parseRangeTime(cleanedSegment);
    if (range) {
      parsedSegments.push({
        raw: cleanedSegment,
        title: cleanTitle(cleanedSegment),
        date: baseDate,
        startMin: range.startMin,
        endMin: range.endMin,
        durationMin: range.endMin - range.startMin,
        timed: true,
      });
      return;
    }

    const atTime = parseAtTime(cleanedSegment);
    if (atTime) {
      parsedSegments.push({
        raw: cleanedSegment,
        title: cleanTitle(cleanedSegment),
        date: baseDate,
        startMin: atTime.startMin,
        endMin: atTime.startMin + atTime.durationMin,
        durationMin: atTime.durationMin,
        timed: true,
      });
      return;
    }

    parsedSegments.push({
      raw: cleanedSegment,
      title: cleanTitle(cleanedSegment),
      date: baseDate,
      durationMin: parseExplicitDuration(cleanedSegment),
      timed: false,
    });
  });

  return parsedSegments.filter((segment) => Boolean(segment.title));
};

const parseLocation = (text: string): string | undefined => {
  const matches = Array.from(text.matchAll(/\bat\s+([^,.]+(?:\s[^,.]+){0,6})/gi));

  for (const match of matches) {
    const candidate = match[1]?.trim();
    if (!candidate) continue;

    if (/^\d{1,2}(?::\d{2})?\s*(AM|PM)\s+at\s+.+$/i.test(candidate)) {
      return candidate.replace(/^\d{1,2}(?::\d{2})?\s*(AM|PM)\s+at\s+/i, "").trim();
    }

    if (/^\d{1,2}(?::\d{2})?\s*(AM|PM)$/i.test(candidate)) continue;

    return candidate;
  }

  return undefined;
};

const parseVendor = (text: string): string | undefined => {
  const match = text.match(/(?:cater(?:ing)?\s+from|food\s+from|vendor\s+is)\s+([^,.]+)/i);
  return match?.[1]?.trim();
};

const inferEventTitle = (text: string) => {
  if (/birthday\s+party/i.test(text)) return "Birthday Party";
  if (/birthday/i.test(text)) return "Birthday";
  if (/party/i.test(text)) return "Party";
  if (/meeting/i.test(text)) return "Meeting";
  return "Planned Event";
};

const parseEventPlanDetails = (transcript: string): EventPlanDetails | undefined => {
  const eventDate = parseDateFromText(transcript);
  if (!eventDate) {
    return undefined;
  }

  const eventTime = parseAtTime(transcript)?.startMin;
  const title = inferEventTitle(transcript);
  const vendor = parseVendor(transcript);

  return {
    title,
    eventDate: normalizeDate(eventDate),
    eventStartMin: eventTime,
    eventDurationMin: parseExplicitDuration(transcript) ?? DEFAULT_EVENT_DURATION,
    location: parseLocation(transcript),
    vendor,
    needsInvitations: /invitation/i.test(transcript),
  };
};

const scheduleWithinWindow = (eventDate: Date, daysBeforeEvent: number, windowStart: Date) => {
  const candidate = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate() - daysBeforeEvent);
  return normalizeDate(candidate < windowStart ? windowStart : candidate);
};

const buildEventPlanningItems = (details: EventPlanDetails, existingItems: CalendarItem[]) => {
  const relatedGoalId = createId("goal");
  const items: CalendarItem[] = [];
  const windowStart = normalizeDate(new Date(details.eventDate.getFullYear(), details.eventDate.getMonth() - 2, details.eventDate.getDate()));
  const eventStart = details.eventStartMin ?? 14 * 60;

  items.push({
    id: relatedGoalId,
    kind: "event",
    title: details.title,
    date: details.eventDate,
    startMin: eventStart,
    endMin: safeMinute(eventStart + details.eventDurationMin),
    allDay: false,
    color: "#6d8bff",
    description: [details.location ? `Location: ${details.location}` : undefined, details.vendor ? `Catering: ${details.vendor}` : undefined]
      .filter(Boolean)
      .join("\n"),
    attachments: [],
    source: "AI",
  });

  if (details.needsInvitations) {
    items.push(
      createTimedTask(
        "Send Invitations",
        scheduleWithinWindow(details.eventDate, 21, windowStart),
        11 * 60,
        45,
        [...existingItems, ...items],
        "Created because invitations need to be sent before the event.",
        relatedGoalId
      )
    );
  }

  if (details.vendor) {
    items.push(
      createTimedTask(
        `Confirm Catering with ${details.vendor}`,
        scheduleWithinWindow(details.eventDate, 14, windowStart),
        13 * 60,
        45,
        [...existingItems, ...items],
        `Created from your request for catering from ${details.vendor}.`,
        relatedGoalId
      )
    );
  }

  const dayOfStart = Math.max(8 * 60, eventStart - DEFAULT_DAY_OF_DURATION);
  items.push(
    createTimedTask(
      `${details.title} Setup`,
      details.eventDate,
      dayOfStart,
      DEFAULT_DAY_OF_DURATION,
      [...existingItems, ...items],
      "Day-of setup task created for the event date.",
      relatedGoalId
    )
  );

  return items;
};

const buildBrainDumpItems = (transcript: string, existingItems: CalendarItem[]) => {
  const segments = parseBrainDumpSegments(transcript);
  if (!segments.length) {
    return [] as CalendarItem[];
  }

  const items: CalendarItem[] = [];

  segments.forEach((segment) => {
    if (segment.timed && segment.startMin !== undefined) {
      const durationMin = segment.durationMin ?? DEFAULT_TIMED_DURATION;
      items.push(
        createTimedTask(
          segment.title,
          segment.date,
          segment.startMin,
          durationMin,
          [...existingItems, ...items],
          `Created from your planning request: ${segment.raw}`
        )
      );
      return;
    }

    items.push(createTodoTask(segment.title, segment.date, `Created from your planning request: ${segment.raw}`));
  });

  return items;
};

export const buildPlanFromTranscript = (transcript: string, existingItems: CalendarItem[] = []): PlannerResult => {
  const trimmedTranscript = transcript.trim();
  const eventPlan = /planning\s+(?:a|an)?\s+/i.test(trimmedTranscript) ? parseEventPlanDetails(trimmedTranscript) : undefined;

  const items = eventPlan
    ? buildEventPlanningItems(eventPlan, existingItems)
    : buildBrainDumpItems(trimmedTranscript, existingItems);

  if (!items.length) {
    const fallbackDate = normalizeDate(parseDateFromText(trimmedTranscript) ?? new Date());
    items.push(
      createTodoTask(
        "Review Plan Details",
        fallbackDate,
        "I only created a single review task because the request did not contain enough concrete planning details."
      )
    );
  }

  const scheduledCount = items.filter((item) => !item.allDay).length;
  const todoCount = items.filter((item) => item.kind === "task" && item.allDay).length;

  return {
    summary: `Created ${items.length} item(s): ${scheduledCount} scheduled and ${todoCount} to-do.`,
    items,
  };
};
