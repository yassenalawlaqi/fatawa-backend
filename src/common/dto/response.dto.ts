import { ApiProperty } from '@nestjs/swagger';

export class PaginationDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}

export class ErrorDetailsDto {
  @ApiProperty({ example: 'VALIDATION_ERROR' })
  code: string;

  @ApiProperty({ example: 'Invalid input data' })
  message: string;
}

export class ApiResponseDto<T> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ nullable: true })
  data?: T;

  @ApiProperty({ required: false, type: PaginationDto })
  pagination?: PaginationDto;

  @ApiProperty({ required: false, nullable: true })
  message?: string;

  @ApiProperty({ required: false, type: ErrorDetailsDto })
  error?: ErrorDetailsDto;
}
