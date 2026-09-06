export type ScheduledWorkoutStatus = "PLANNED" | "COMPLETED";

export type ScheduledWorkout = {
  id: string;
  scheduledDate: string;
  status: ScheduledWorkoutStatus;
  completedAt: string | null;
  notes: string | null;
  coachNotes?: string | null;
  coachFeedback?: string | null;
  reviewedAt?: string | null;
  assignedByCoachProfile?: {
    id: string;
    displayName: string;
  } | null;
  workout: {
    id: string;
    name: string;
    description: string | null;
    isBenchmark: boolean;
    isActive: boolean;
    type: {
      key: string;
      name: string;
    };
  };
  workoutVariant: {
    id: string;
    name: string | null;
    level: {
      key: string;
      name: string;
    };
  };
  prescriptionCategory: {
    key: string;
    name: string;
  } | null;
  workoutResult: {
    id: string;
    performedAt: string;
  } | null;
};

export type ScheduledWorkoutsResponse = {
  items: ScheduledWorkout[];
};

export type TrainingCalendarWorkout = {
  id: string;
  name: string;
  isBenchmark: boolean;
  type: { key: string; name: string };
  variants: {
    id: string;
    name?: string | null;
    level: { key: string; name: string };
  }[];
};

export function toDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromDateValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function monthRange(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  return { from: toDateValue(first), to: toDateValue(last) };
}

export function calendarDays(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}
