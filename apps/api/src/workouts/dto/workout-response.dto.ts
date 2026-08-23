export class WorkoutTypeResponseDto {
  key: string;
  name: string;

  defaultResultType: {
    key: string;
    name: string;
  } | null;
}

export class WorkoutPrescriptionResponseDto {
  id: string;

  category: {
    key: string;
    name: string;
  };

  reps: number | null;
  weight: number | null;
  weightUnit: 'KG' | 'LB' | null;
  distance: number | null;
  calories: number | null;
  durationSeconds: number | null;
  notes: string | null;
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

    measurementTypes: {
      key: string;
      name: string;
    }[];
  };

  prescriptions: WorkoutPrescriptionResponseDto[];
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

export class WorkoutVariantResponseDto {
  id: string;
  name: string | null;
  notes: string | null;

  level: {
    key: string;
    name: string;
  };

  sections: WorkoutSectionResponseDto[];
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

  variants: WorkoutVariantResponseDto[];
}