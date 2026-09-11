export type BoxSummary = {
  id: string;
  name: string;
  description: string | null;
  timezone: string;
  joinCode: string;
  role: "OWNER" | "COACH" | "ATHLETE";
  _count: { memberships: number };
};

export type ClassSession = {
  id: string;
  name: string;
  description: string | null;
  startsAt: string;
  durationMinutes: number;
  capacity: number;
  bookedCount: number;
  workout: { id: string; name: string } | null;
  workoutVariant: {
    id: string;
    name: string | null;
    level: { key: string; name: string };
  } | null;
  currentUserBooking: { id: string; status: "BOOKED" | "ATTENDED" } | null;
  bookings: Array<{
    id: string;
    userId: string;
    status: "BOOKED" | "ATTENDED";
    user: {
      email: string;
      athleteProfile: { displayName: string } | null;
    };
  }>;
};

export type WorkoutOption = {
  id: string;
  name: string;
  variants: Array<{
    id: string;
    name: string | null;
    level: { key: string; name: string };
  }>;
};

export type BoxMember = {
  id: string;
  userId: string;
  role: "OWNER" | "COACH" | "ATHLETE";
  user: {
    email: string;
    athleteProfile: { displayName: string } | null;
    coachProfile: { displayName: string } | null;
  };
};
