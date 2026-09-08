export type ProgrammingAthlete = {
  id: string;
  displayName: string;
  user: { email: string };
};

export type CoachGroup = {
  id: string;
  name: string;
  description: string | null;
  members: {
    id: string;
    athleteProfile: ProgrammingAthlete;
  }[];
};

export type ProgramTemplateItem = {
  id: string;
  dayOffset: number;
  coachNotes: string | null;
  workout: { id: string; name: string; isActive: boolean };
  workoutVariant: {
    id: string;
    name: string | null;
    level: { key: string; name: string };
  };
  prescriptionCategory: { key: string; name: string } | null;
};

export type ProgramTemplate = {
  id: string;
  name: string;
  description: string | null;
  items: ProgramTemplateItem[];
};

export type ProgrammingWorkout = {
  id: string;
  name: string;
  variants: {
    id: string;
    name: string | null;
    level: { key: string; name: string };
  }[];
};

export type CoachProgrammingWorkspace = {
  groups: CoachGroup[];
  templates: ProgramTemplate[];
  athletes: ProgrammingAthlete[];
  workouts: ProgrammingWorkout[];
  prescriptionCategories: { key: string; name: string }[];
};

export type CoachMonitoringStatus =
  | "ALL"
  | "PLANNED"
  | "COMPLETED"
  | "OVERDUE"
  | "NEEDS_REVIEW";

export type CoachMonitoringItem = {
  id: string;
  scheduledDate: string;
  status: "PLANNED" | "COMPLETED";
  coachNotes: string | null;
  athleteComment: string | null;
  athleteCommentedAt: string | null;
  coachFeedback: string | null;
  reviewedAt: string | null;
  athleteProfile: { id: string; displayName: string };
  workout: { id: string; name: string };
  workoutVariant: {
    id: string;
    name: string | null;
    level: { key: string; name: string };
  };
  prescriptionCategory: { key: string; name: string } | null;
  workoutResult: { id: string; performedAt: string } | null;
};

export type CoachMonitoringResponse = {
  summary: {
    total: number;
    planned: number;
    completed: number;
    overdue: number;
    needsReview: number;
  };
  items: CoachMonitoringItem[];
};

export type CoachAnalyticsResponse = {
  range: { from: string; to: string };
  summary: {
    assigned: number;
    completed: number;
    overdue: number;
    completionRate: number;
    totalReps: number;
    totalLoadKg: number;
  };
  athletes: {
    id: string;
    name: string;
    assigned: number;
    completed: number;
    overdue: number;
    totalReps: number;
    totalLoadKg: number;
    completionRate: number;
  }[];
  weekly: {
    weekStart: string;
    assigned: number;
    completed: number;
    completionRate: number;
  }[];
  workoutTypes: { key: string; name: string; count: number }[];
  movementCategories: { key: string; name: string; count: number }[];
  workouts: { id: string; name: string; count: number }[];
};
