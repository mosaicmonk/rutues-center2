// CalendarContext.tsx
import React, {
    createContext,
    ReactNode,
    useContext,
    useState,
} from "react";
  
  export type CalendarItemKind = "task" | "event";
  export type CalendarItemSource = "AI" | "Manual";
  
  export interface CalendarItem {
    id: string;
    kind: CalendarItemKind;
    title: string;
    date: Date; // calendar date (no time portion)
    startMin: number; // minutes from midnight
    endMin: number;
    allDay: boolean;
    color: string;
    description: string;
    attachments: { name: string; uri: string }[];
    source: CalendarItemSource;
  // Optional link to a parent goal/event created by AI planning.
  relatedGoalId?: string;
  // Optional ISO timestamp for reminder scheduling/display.
  reminderAt?: string;
  }
  
  interface CalendarContextValue {
    items: CalendarItem[];
    addItem: (item: CalendarItem) => void;
    updateItem: (item: CalendarItem) => void;
    clearAll: () => void;
  }
  
  const CalendarContext = createContext<CalendarContextValue | undefined>(
    undefined
  );
  
  export const CalendarProvider = ({ children }: { children: ReactNode }) => {
    const [items, setItems] = useState<CalendarItem[]>([]);
  
    const addItem = (item: CalendarItem) => {
      setItems((prev) => [...prev, item]);
    };
  
    const updateItem = (item: CalendarItem) => {
      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? item : it))
      );
    };
  
    const clearAll = () => setItems([]);
  
    return (
      <CalendarContext.Provider
        value={{ items, addItem, updateItem, clearAll }}
      >
        {children}
      </CalendarContext.Provider>
    );
  };
  
  export const useCalendar = () => {
    const ctx = useContext(CalendarContext);
    if (!ctx) {
      throw new Error(
        "useCalendar must be used inside a CalendarProvider"
      );
    }
    return ctx;
  };
  