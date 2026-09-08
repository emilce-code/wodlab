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
