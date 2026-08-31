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
  aliases: string[];
}
