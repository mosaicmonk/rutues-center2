import React, { createContext, ReactNode, useContext, useMemo, useState } from "react";

export type CalendarItemKind = "task" | "event";
export type CalendarItemSource = "AI" | "Manual";

export interface CalendarItem {
  id: string;
  kind: CalendarItemKind;
  title: string;
  date: Date;
  startMin: number;
  endMin: number;
  allDay: boolean;
  color: string;
  description: string;
  attachments: { name: string; uri: string }[];
  source: CalendarItemSource;
  relatedGoalId?: string;
  reminderAt?: string;
}

interface CalendarContextValue {
  items: CalendarItem[];
  addItem: (item: CalendarItem) => void;
  addItems: (items: CalendarItem[]) => void;
  updateItem: (item: CalendarItem) => void;
  removeItem: (id: string) => void;
  clearAll: () => void;
}

const CalendarContext = createContext<CalendarContextValue | undefined>(undefined);

const sortItems = (items: CalendarItem[]) =>
  [...items].sort((left, right) => {
    const dateDiff = left.date.getTime() - right.date.getTime();
    if (dateDiff !== 0) return dateDiff;
    return left.startMin - right.startMin;
  });

export const CalendarProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CalendarItem[]>([]);

  const addItem = (item: CalendarItem) => {
    setItems((prev) => sortItems([...prev, item]));
  };

  const addItems = (nextItems: CalendarItem[]) => {
    if (!nextItems.length) return;
    setItems((prev) => sortItems([...prev, ...nextItems]));
  };

  const updateItem = (item: CalendarItem) => {
    setItems((prev) => sortItems(prev.map((entry) => (entry.id === item.id ? item : entry))));
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((entry) => entry.id !== id));
  };

  const clearAll = () => setItems([]);

  const value = useMemo(
    () => ({ items, addItem, addItems, updateItem, removeItem, clearAll }),
    [items]
  );

  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>;
};

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error("useCalendar must be used inside a CalendarProvider");
  }

  return context;
};
