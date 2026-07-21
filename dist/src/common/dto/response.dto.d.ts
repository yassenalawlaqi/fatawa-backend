export declare class PaginationDto {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
export declare class ErrorDetailsDto {
    code: string;
    message: string;
}
export declare class ApiResponseDto<T> {
    success: boolean;
    data?: T;
    pagination?: PaginationDto;
    message?: string;
    error?: ErrorDetailsDto;
}
