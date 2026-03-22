import React, { createContext, ReactNode, useContext, useMemo, useState } from "react";

export type Priority = "High" | "Medium" | "Low";

export interface Task {
  id: string;
  title: string;
  time?: string;
  app?: string;
  priority: Priority;
}

interface TaskContextValue {
  tasks: Task[];
  addTask: (task: Task) => void;
  addTasks: (tasks: Task[]) => void;
  upsertTask: (task: Task) => void;
  reorderTasks: (newOrder: Task[]) => void;
  removeTask: (id: string) => void;
}

const TaskContext = createContext<TaskContextValue | undefined>(undefined);

const starterTasks: Task[] = [
  {
    id: "1",
    title: "Design dashboard for admin",
    time: "09:30 - 10:30 AM",
    app: "Zoom",
    priority: "High",
  },
  {
    id: "2",
    title: "Marketing huddle",
    time: "12:00 - 12:30 PM",
    app: "Google Meet",
    priority: "Medium",
  },
  {
    id: "3",
    title: "Check emails & follow-ups",
    time: "Anytime today",
    app: "Inbox",
    priority: "Low",
  },
];

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(starterTasks);

  const addTask = (task: Task) => {
    setTasks((prev) => [...prev, task]);
  };

  const addTasks = (nextTasks: Task[]) => {
    if (!nextTasks.length) return;
    setTasks((prev) => [...prev, ...nextTasks]);
  };

  const upsertTask = (task: Task) => {
    setTasks((prev) => {
      const exists = prev.some((entry) => entry.id === task.id);
      if (exists) {
        return prev.map((entry) => (entry.id === task.id ? task : entry));
      }

      return [...prev, task];
    });
  };

  const removeTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const reorderTasks = (newOrder: Task[]) => {
    setTasks(newOrder);
  };

  const value = useMemo(
    () => ({ tasks, addTask, addTasks, upsertTask, reorderTasks, removeTask }),
    [tasks]
  );

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTasks must be used inside a TaskProvider");
  }

  return context;
}
