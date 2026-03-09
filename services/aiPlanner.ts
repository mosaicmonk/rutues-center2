import { CalendarItem } from "../CalendarContext";

export type ParsedUserInput = {
  goalTitle: string;
  eventDate?: Date;
  eventTimeMin?: number;
  taskDate?: Date;
  location?: string;
  vendor?: string;
  phone?: string;
  notes?: string;
};

export type PlannerResult = {
  summary: string;
  items: CalendarItem[];
};

const normalizeDate = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const parseDate = (text: string): Date | undefined => {
  const match = text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
  if (!match) return undefined;
  const month = Number(match[1]) - 1;
  const day = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month, day);
  return Number.isNaN(date.getTime()) ? undefined : date;
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

const parsePhone = (text: string): string | undefined => {
  const match = text.match(/\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/);
  return match?.[0];
};

export const parseUserInput = (transcript: string): ParsedUserInput => {
  const eventDate = parseDate(transcript);
  const eventTimeMin = parseTimeMin(transcript);
  const phone = parsePhone(transcript);

  const locationMatch = transcript.match(/\bat\s+([^,.]+(?:\s[^,.]+){0,5})/i);
  const vendorMatch = transcript.match(/(?:caterer|service)\s+([^,.]+)/i);

  const lower = transcript.toLowerCase();
  const goalTitle = lower.includes("birthday")
    ? "Birthday party"
    : lower.includes("wedding")
      ? "Wedding"
      : lower.includes("meeting")
        ? "Meeting"
        : "Planned event";

  const taskDateMatch = transcript.match(/on\s+(\d{1,2}\/\d{1,2}\/\d{4})/i);
  const taskDate = taskDateMatch ? parseDate(taskDateMatch[1]) : undefined;

  return {
    goalTitle,
    eventDate,
    eventTimeMin,
    taskDate,
    location: locationMatch?.[1]?.trim(),
    vendor: vendorMatch?.[1]?.trim(),
    phone,
    notes: transcript,
  };
};

const buildPlanningTask = (
  title: string,
  date: Date,
  description: string,
  sourceGoalId: string,
  reminderAt?: string
): CalendarItem => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  kind: "task",
  title,
  date: normalizeDate(date),
  startMin: 10 * 60,
  endMin: 11 * 60,
  allDay: false,
  color: "#8f5bff",
  description,
  attachments: [],
  source: "AI",
  relatedGoalId: sourceGoalId,
  reminderAt,
});

export const buildPlanFromTranscript = (transcript: string): PlannerResult => {
  const parsed = parseUserInput(transcript);
  const now = new Date();
  const goalId = `goal-${Date.now()}`;
  const items: CalendarItem[] = [];

  if (parsed.eventDate) {
    items.push({
      id: goalId,
      kind: "event",
      title: parsed.goalTitle,
      date: normalizeDate(parsed.eventDate),
      startMin: parsed.eventTimeMin ?? 14 * 60,
      endMin: (parsed.eventTimeMin ?? 14 * 60) + 60,
      allDay: false,
      color: "#6d8bff",
      description: parsed.location ? `Location: ${parsed.location}` : "Created from AI voice planning",
      attachments: [],
      source: "AI",
      reminderAt: new Date(parsed.eventDate.getFullYear(), parsed.eventDate.getMonth(), parsed.eventDate.getDate() - 1, 9, 0).toISOString(),
    });

    items.push(
      buildPlanningTask(
        `Confirm guest list for ${parsed.goalTitle}`,
        new Date(parsed.eventDate.getFullYear(), parsed.eventDate.getMonth(), parsed.eventDate.getDate() - 14),
        "Suggested planning date based on your event date.",
        goalId
      )
    );

    items.push(
      buildPlanningTask(
        `Buy supplies for ${parsed.goalTitle}`,
        new Date(parsed.eventDate.getFullYear(), parsed.eventDate.getMonth(), parsed.eventDate.getDate() - 7),
        "Suggested planning date based on your event date.",
        goalId
      )
    );

    items.push(
      buildPlanningTask(
        `Final prep for ${parsed.goalTitle}`,
        new Date(parsed.eventDate.getFullYear(), parsed.eventDate.getMonth(), parsed.eventDate.getDate() - 1),
        "Suggested planning date based on your event date.",
        goalId,
        new Date(parsed.eventDate.getFullYear(), parsed.eventDate.getMonth(), parsed.eventDate.getDate() - 1, 9, 0).toISOString()
      )
    );
  }

  if (parsed.vendor && parsed.taskDate) {
    const vendorDetails = [`Vendor: ${parsed.vendor}`];
    if (parsed.phone) {
      vendorDetails.push(`Phone: ${parsed.phone}`);
    }

    items.push(
      buildPlanningTask(
        `Add vendor details for ${parsed.goalTitle}`,
        parsed.taskDate,
        vendorDetails.join("\n"),
        goalId,
        new Date(parsed.taskDate.getFullYear(), parsed.taskDate.getMonth(), parsed.taskDate.getDate() - 1, 9, 0).toISOString()
      )
    );
  }

  if (!items.length) {
    const fallbackDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    items.push(
      buildPlanningTask(
        `Review plan details`,
        fallbackDate,
        "I only used details that were spoken. Add date/time/location for more precise planning.",
        goalId
      )
    );
  }

  return {
    summary: `Planned ${items.length} calendar item(s) based only on the details you provided.`,
    items,
  };
};
