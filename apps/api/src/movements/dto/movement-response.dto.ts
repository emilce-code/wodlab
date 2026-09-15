export class MovementCategoryResponseDto {
  key: string;
  name: string;
}

export class MeasurementTypeResponseDto {
  key: string;
  name: string;
}

export class MovementResponseDto {
  id: string;
  name: string;
  category: MovementCategoryResponseDto;
  measurementTypes: MeasurementTypeResponseDto[];
  isFoundational: boolean;
  official: boolean;
  scope: 'GLOBAL' | 'BOX' | 'PERSONAL';
  box: { id: string; name: string } | null;
  aliases: string[];
  description: string | null;
  videoUrl: string | null;
  canEdit: boolean;
  canDelete: boolean;
}
