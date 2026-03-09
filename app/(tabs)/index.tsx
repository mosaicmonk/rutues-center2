import { useRouter } from 'expo-router';
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Task, useTasks } from '../../TaskContext';

/**
 * HomeScreen
 * ==========
 * - Shows AI summary + task list
 * - "+ New Task / Goal" -> AI tab
 * - Tapping a task -> Calendar screen
 */
export default function HomeScreen() {
  const router = useRouter();
  const { tasks } = useTasks();

  const goToAi = () => {
    router.push('/(tabs)/ai'); // AI tab
  };

  const goToCalendar = () => {
    router.push('/calendar'); // Calendar hub screen
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Good morning</Text>
            <Text style={styles.appName}>Rutues Center</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>RC</Text>
          </View>
        </View>

        {/* AI summary card */}
        <View style={styles.aiCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.aiDate}>8 June</Text>
            <Text style={styles.aiTitle}>Today&apos;s AI Analysis</Text>
            <Text style={styles.aiSubtitle}>
              You have <Text style={styles.aiHighlight}>{tasks.length} tasks</Text> for today.
            </Text>
          </View>

          <View style={styles.robotBubble}>
            <Text style={styles.robotEmoji}>🤖</Text>
            <Text style={styles.robotLabel}>AI Report</Text>
          </View>
        </View>

        {/* Priority summary */}
        <Text style={styles.sectionTitle}>Priority Tasks</Text>
        <View style={styles.priorityCard}>
          <View style={styles.priorityItem}>
            <Text style={styles.priorityLabel}>In Progress</Text>
            <Text style={styles.priorityValue}>
              {Math.max(1, tasks.length - 1)}
            </Text>
          </View>
          <View style={styles.priorityItem}>
            <Text style={styles.priorityLabel}>Completed</Text>
            <Text style={styles.priorityValue}>1</Text>
          </View>
        </View>

        {/* Task list */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>All Tasks</Text>

        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onPress={goToCalendar} // tap task -> calendar hub
          />
        ))}

        {/* Button: ONLY this goes to AI */}
        <TouchableOpacity style={styles.addButton} onPress={goToAi}>
          <Text style={styles.addButtonText}>+ New Task / Goal</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * One row in the task list.
 */
function TaskCard({
  task,
  onPress,
}: {
  task: Task;
  onPress: () => void;
}) {
  const { priority, title, time, app } = task;

  return (
    <TouchableOpacity style={styles.taskCard} onPress={onPress}>
      <View style={styles.taskLeft}>
        <View
          style={[
            styles.dot,
            priority === 'High' && { backgroundColor: '#ff4d67' },
            priority === 'Medium' && { backgroundColor: '#f6c945' },
            priority === 'Low' && { backgroundColor: '#5ad49b' },
          ]}
        />
        <View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{priority}</Text>
          </View>
          <Text style={styles.taskTitle}>{title}</Text>
          <Text style={styles.taskMeta}>
            {time ?? 'Anytime'} {app ? `• ${app}` : ''}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0f0b1f',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    color: '#a7a3c2',
    fontSize: 14,
  },
  appName: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 4,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#8f5bff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  aiCard: {
    flexDirection: 'row',
    backgroundColor: '#18122f',
    borderRadius: 24,
    padding: 18,
    marginBottom: 24,
    alignItems: 'center',
  },
  aiDate: {
    color: '#a7a3c2',
    fontSize: 12,
  },
  aiTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  aiSubtitle: {
    color: '#c4c0e0',
    fontSize: 13,
    marginTop: 6,
  },
  aiHighlight: {
    color: '#ffb547',
    fontWeight: '600',
  },
  robotBubble: {
    backgroundColor: '#8f5bff',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  robotEmoji: {
    fontSize: 22,
  },
  robotLabel: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  priorityCard: {
    flexDirection: 'row',
    backgroundColor: '#18122f',
    borderRadius: 20,
    padding: 16,
    justifyContent: 'space-between',
  },
  priorityItem: {},
  priorityLabel: {
    color: '#a7a3c2',
    fontSize: 12,
  },
  priorityValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  taskCard: {
    backgroundColor: '#18122f',
    borderRadius: 20,
    padding: 14,
    marginTop: 10,
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    backgroundColor: '#5ad49b',
  },
  chip: {
    alignSelf: 'flex-start',
    backgroundColor: '#2a2145',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 4,
  },
  chipText: {
    color: '#c4c0e0',
    fontSize: 11,
  },
  taskTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  taskMeta: {
    color: '#a7a3c2',
    fontSize: 12,
    marginTop: 2,
  },
  addButton: {
    marginTop: 24,
    backgroundColor: '#8f5bff',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
