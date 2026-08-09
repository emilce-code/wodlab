export class WorkoutTypeResponseDto {
  key: string;
  name: string;

  defaultResultType: {
    key: string;
    name: string;
  } | null;
}

export class WorkoutMovementResponseDto {
  id: string;
  order: number;
  reps: number | null;
  weight: number | null;
  weightUnit: 'KG' | 'LB' | null;
  distance: number | null;
  calories: number | null;
  durationSeconds: number | null;
  notes: string | null;

  movement: {
    id: string;
    name: string;
  };
}

export class WorkoutSectionResponseDto {
  id: string;
  order: number;
  rounds: number | null;
  durationSeconds: number | null;
  restSeconds: number | null;
  repScheme: number[];
  notes: string | null;

  type: WorkoutTypeResponseDto;
  movements: WorkoutMovementResponseDto[];
}

export class WorkoutResponseDto {
  id: string;
  name: string;
  description: string | null;
  isBenchmark: boolean;
  createdAt: Date;
  updatedAt: Date;

  type: WorkoutTypeResponseDto;

  createdByUser: {
    id: string;
    email: string;
  };

  sections: WorkoutSectionResponseDto[];
}