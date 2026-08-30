export type WeightUnit = 'KG' | 'LB';

export type NamedKey = {
  key: string;
  name: string;
};

export type ResultType = NamedKey;

export type MeasurementType = NamedKey;

export type WorkoutLevel = NamedKey;

export type PrescriptionCategory = NamedKey;

export type WorkoutResultVariant = {
  id: string;
  name: string | null;
  level: WorkoutLevel;
};

export type PerformedMovement = {
  id: string;
  workoutMovementId: string;

  reps: number | null;
  load: number | null;
  weightUnit: WeightUnit | null;
  distance: number | null;
  calories: number | null;
  durationSeconds: number | null;
  notes: string | null;

  workoutMovement?: {
    id: string;
    order: number;

    section: {
      id: string;
      order: number;
    };

    movement: {
      id: string;
      name: string;
    };
  } | null;

  createdAt?: string;
  updatedAt?: string;
};

export type WorkoutResult = {
  id: string;
  workoutId: string;
  athleteProfileId: string;

  resultTypeId?: string;
  resultType: ResultType;

  performedAt: string;

  timeSeconds: number | null;
  rounds: number | null;
  reps: number | null;
  load: number | null;
  weightUnit: WeightUnit | null;

  workoutVariant: WorkoutResultVariant | null;
  prescriptionCategory: PrescriptionCategory | null;

  performedMovements: PerformedMovement[];

  notes: string | null;

  createdAt: string;
  updatedAt: string;
};

export type WorkoutResultSummary = {
  personalBest: WorkoutResult | null;
  lastResult: WorkoutResult | null;
  totalResults: number;
};

export type WorkoutResultForEdit = {
  id: string;
  performedAt: string;

  timeSeconds: number | null;
  rounds: number | null;
  reps: number | null;
  load: number | null;
  weightUnit: WeightUnit | null;

  notes: string | null;

  workoutVariant: WorkoutResultVariant | null;
  prescriptionCategory: PrescriptionCategory | null;

  performedMovements: Array<
    Pick<
      PerformedMovement,
      | 'id'
      | 'workoutMovementId'
      | 'reps'
      | 'load'
      | 'weightUnit'
      | 'distance'
      | 'calories'
      | 'durationSeconds'
      | 'notes'
    >
  >;
};

export type MeasurementResultValues = {
  reps: number | null;
  load: number | null;
  weightUnit: WeightUnit | null;
  distance: number | null;
  durationSeconds: number | null;
  calories: number | null;
};