import React, {
    createContext,
    ReactNode,
    useContext,
    useState,
} from 'react';
  
  export type Priority = 'High' | 'Medium' | 'Low';
  
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
    reorderTasks: (newOrder: Task[]) => void; // 👈 NEW
  removeTask: (id: string) => void;
  }
  
  const TaskContext = createContext<TaskContextValue | undefined>(undefined);
  
  /**
   * TaskProvider
   * ============
   * Holds the list of tasks for the whole app.
   * Home screen reads tasks from here.
   * AI screen can add new tasks.
   * Calendar will also read tasks.
   */
  export function TaskProvider({ children }: { children: ReactNode }) {
    const [tasks, setTasks] = useState<Task[]>([
      {
        id: '1',
        title: 'Design dashboard for admin',
        time: '09:30 - 10:30 AM',
        app: 'Zoom',
        priority: 'High',
      },
      {
        id: '2',
        title: 'Marketing huddle',
        time: '12:00 - 12:30 PM',
        app: 'Google Meet',
        priority: 'Medium',
      },
      {
        id: '3',
        title: 'Check emails & follow-ups',
        time: 'Anytime today',
        app: 'Inbox',
        priority: 'Low',
      },
    ]);
  
    const addTask = (task: Task) => {
      setTasks((prev) => [...prev, task]);
    };

    const removeTask = (id: string) => {
      setTasks((prev) => prev.filter((task) => task.id !== id));
    };
  
    // 👇 NEW — required for drag & drop
    const reorderTasks = (newOrder: Task[]) => {
      setTasks(newOrder);
    };
  
    return (
      <TaskContext.Provider value={{ tasks, addTask, reorderTasks, removeTask }}>
        {children}
      </TaskContext.Provider>
    );
  }
  
  /**
   * useTasks()
   * ==========
   * Hook for accessing tasks anywhere in the app.
   */
  export function useTasks() {
    const context = useContext(TaskContext);
    if (!context) {
      throw new Error('useTasks must be used inside a TaskProvider');
    }
    return context;
  }
  
  