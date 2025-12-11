export enum ReminderCategory {
  FOOD = 'Food',
  GYM = 'Gym',
  WORK = 'Work',
  HEALTH = 'Health',
  OTHER = 'Other'
}

export enum Priority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  category: ReminderCategory;
  date: string; // ISO Date string
  priority: Priority;
  completed: boolean;
  createdAt: number;
}

export interface User {
  username: string;
  email: string;
}

// For the AI Service response
export interface ParsedReminderData {
  title: string;
  category: ReminderCategory;
  priority: Priority;
  description?: string;
  suggestedTime?: string; // ISO string if detected
}
