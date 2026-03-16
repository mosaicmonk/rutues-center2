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
};

export type PlannerResult = {
  summary: string;
  items: CalendarItem[];
};

export type PlanningModel = "backward" | "milestone" | "checklist";

const normalizeDate = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const MINUTES_IN_DAY = 24 * 60;

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
  if (!namedMonthMatch) return undefined;

  const parsed = new Date(`${namedMonthMatch[1]} ${namedMonthMatch[2]}, ${namedMonthMatch[3]}`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
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

export const parseUserInput = (transcript: string): ParsedUserInput => {
  const eventDate = parseDate(transcript);
  const eventTimeMin = parseTimeMin(transcript);
  const phone = parsePhone(transcript);

  const location = parseLocation(transcript);
  const vendorMatch = transcript.match(/(?:cater(?:ing|er)?\s+(?:from|by)|vendor\s+is|food\s+from)\s+([^,.]+)/i);

  const lower = transcript.toLowerCase();
  const planningModel =
    /checklist|step by step|to-?do/i.test(transcript)
      ? "checklist"
      : /milestone|phase|stages?/i.test(transcript)
        ? "milestone"
        : "backward";

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
    planningModel,
    eventDate,
    eventTimeMin,
    taskDate,
    location,
    vendor: vendorMatch?.[1]?.trim(),
    phone,
    notes: transcript,
  };
};

const scheduleWithinWindow = (eventDate: Date, planningWindowStart: Date, daysBeforeEvent: number) =>
  clampDate(
    new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate() - daysBeforeEvent),
    planningWindowStart,
    eventDate
  );

const pushModelTasks = (
  model: PlanningModel,
  parsed: ParsedUserInput,
  transcript: string,
  goalId: string,
  eventDate: Date,
  planningWindowStart: Date,
  items: CalendarItem[]
) => {
  if (model === "checklist") {
    items.push(
      buildPlanningTask(
        `Budget + guest list for ${parsed.goalTitle}`,
        scheduleWithinWindow(eventDate, planningWindowStart, 21),
        "Set spending limits, guest count, and top priorities.",
        goalId
      ),
      buildPlanningTask(
        `Book location and key vendors for ${parsed.goalTitle}`,
        scheduleWithinWindow(eventDate, planningWindowStart, 14),
        "Reserve venue and lock in must-have vendors.",
        goalId
      ),
      buildPlanningTask(
        `Finalize checklist for ${parsed.goalTitle}`,
        scheduleWithinWindow(eventDate, planningWindowStart, 7),
        "Confirm every line item is assigned and ready.",
        goalId
      )
    );
    return;
  }

  if (model === "milestone") {
    items.push(
      buildPlanningTask(
        `Milestone 1: Foundation for ${parsed.goalTitle}`,
        scheduleWithinWindow(eventDate, planningWindowStart, 30),
        "Define scope, budget, and non-negotiables.",
        goalId
      ),
      buildPlanningTask(
        `Milestone 2: Vendor lock-in for ${parsed.goalTitle}`,
        scheduleWithinWindow(eventDate, planningWindowStart, 18),
        "Secure vendors and draft run-of-show.",
        goalId
      ),
      buildPlanningTask(
        `Milestone 3: Final readiness for ${parsed.goalTitle}`,
        scheduleWithinWindow(eventDate, planningWindowStart, 5),
        "Confirm attendees, logistics, and contingency plans.",
        goalId
      )
    );
    return;
  }

  if (/invitation/i.test(transcript)) {
    items.push(
      buildPlanningTask(
        `Send invitations for ${parsed.goalTitle}`,
        scheduleWithinWindow(eventDate, planningWindowStart, 14),
        "Scheduled from your request to send invitations before the event.",
        goalId
      )
    );
  }

  if (parsed.vendor) {
    items.push(
      buildPlanningTask(
        `Confirm catering with ${parsed.vendor}`,
        scheduleWithinWindow(eventDate, planningWindowStart, 7),
        `Vendor requested: ${parsed.vendor}`,
        goalId
      )
    );
  }
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
    const eventDate = normalizeDate(parsed.eventDate);
    const planningWindowStart = normalizeDate(
      new Date(eventDate.getFullYear(), eventDate.getMonth() - 2, eventDate.getDate())
    );

    items.push({
      id: goalId,
      kind: "event",
      title: parsed.goalTitle,
      date: eventDate,
      startMin: parsed.eventTimeMin ?? 14 * 60,
      endMin: Math.min((parsed.eventTimeMin ?? 14 * 60) + 60, MINUTES_IN_DAY),
      allDay: false,
      color: "#6d8bff",
      description:
        [
          parsed.location ? `Location: ${parsed.location}` : "",
          parsed.vendor ? `Catering: ${parsed.vendor}` : "",
        ]
          .filter(Boolean)
          .join("\n") || "Created from AI voice planning",
      attachments: [],
      source: "AI",
      reminderAt: new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate() - 1, 9, 0).toISOString(),
    });

    pushModelTasks(parsed.planningModel, parsed, transcript, goalId, eventDate, planningWindowStart, items);

    items.push(
      buildPlanningTask(
        `Final confirmation for ${parsed.goalTitle}`,
        scheduleWithinWindow(eventDate, planningWindowStart, 3),
        "Final check before your event.",
        goalId,
        new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate() - 1, 9, 0).toISOString()
      )
    );

    items.push(
      buildPlanningTask(
        `Day-of setup for ${parsed.goalTitle}`,
        eventDate,
        "Complete setup and execution tasks for the event day.",
        goalId
      )
    );
  }

  if (parsed.vendor && parsed.taskDate) {
    const vendorDetails = [`Vendor: ${parsed.vendor}`];
    if (parsed.phone) {
      vendorDetails.push(`Phone: ${parsed.phone}`);
    }

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
        new Date(vendorDate.getFullYear(), vendorDate.getMonth(), vendorDate.getDate() - 1, 9, 0).toISOString()
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
    summary: `Used the ${parsed.planningModel} planning model and created ${items.length} calendar item(s) from your details.`,
    items,
  };
};
