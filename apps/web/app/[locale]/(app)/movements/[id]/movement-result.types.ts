export type WeightUnit = 'KG' | 'LB';

export type MeasurementType = {
  key: string;
  name: string;
};

export type MovementResultSource =
  | {
      type: 'MANUAL';
    }
  | {
      type: 'WORKOUT';
      workoutResultId: string;
      workout: {
        id: string;
        name: string;
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
    };

export type MovementResult = {
  id: string;
  measurementType: {
    key: string;
    name: string;
  };
  source: MovementResultSource;
  performedAt: string;
  reps: number | null;
  load: number | string | null;
  weightUnit: WeightUnit | null;
  distance: number | null;
  durationSeconds: number | null;
  calories: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};