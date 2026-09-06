export type CoachRelationship = {
  id: string;
  status: "PENDING" | "ACTIVE" | "ARCHIVED";
  coachProfile: { id: string; displayName: string; bio: string | null };
  athleteProfile: {
    id: string;
    displayName: string;
    user: { email: string };
  };
};

export type CoachWorkspace = {
  coachProfile: {
    id: string;
    displayName: string;
    bio: string | null;
  } | null;
  receivedInvitations: CoachRelationship[];
  coaches: CoachRelationship[];
  athletes: CoachRelationship[];
  sentInvitations: CoachRelationship[];
};
