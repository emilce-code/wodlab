export type ScheduledWorkoutStatus = "PLANNED" | "COMPLETED";

export type ScheduledWorkout = {
  id: string;
  scheduledDate: string;
  status: ScheduledWorkoutStatus;
  completedAt: string | null;
  notes: string | null;
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
