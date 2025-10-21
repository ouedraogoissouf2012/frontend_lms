/**
 * Modèles pour les réponses API standardisées
 */

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: ValidationErrors;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: {
    current_page: number;
    data: T[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
  };
}

export interface ValidationErrors {
  [key: string]: string[];
}

export interface ErrorResponse {
  success: false;
  message: string;
  errors?: ValidationErrors;
  code?: string;
  status?: number;
}

/**
 * Helper pour extraire les données paginées
 */
export class PaginationHelper {
  static extractData<T>(response: PaginatedResponse<T>): T[] {
    return response.data.data;
  }

  static getPaginationInfo(response: PaginatedResponse): PaginationInfo {
    return {
      currentPage: response.data.current_page,
      lastPage: response.data.last_page,
      perPage: response.data.per_page,
      total: response.data.total,
      from: response.data.from,
      to: response.data.to,
      hasNextPage: response.data.next_page_url !== null,
      hasPrevPage: response.data.prev_page_url !== null
    };
  }
}

export interface PaginationInfo {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
  from: number;
  to: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Helper pour gérer les erreurs API
 */
export class ErrorHelper {
  static extractMessage(error: any): string {
    if (error?.error?.message) {
      return error.error.message;
    }
    if (error?.message) {
      return error.message;
    }
    return 'Une erreur est survenue';
  }

  static extractValidationErrors(error: any): string[] {
    const errors: string[] = [];
    if (error?.error?.errors) {
      Object.values(error.error.errors).forEach((msgs: any) => {
        if (Array.isArray(msgs)) {
          errors.push(...msgs);
        }
      });
    }
    return errors;
  }

  static isUnauthorized(error: any): boolean {
    return error?.status === 401 || error?.error?.status === 401;
  }

  static isForbidden(error: any): boolean {
    return error?.status === 403 || error?.error?.status === 403;
  }

  static isNotFound(error: any): boolean {
    return error?.status === 404 || error?.error?.status === 404;
  }

  static isValidationError(error: any): boolean {
    return error?.status === 422 || error?.error?.status === 422;
  }

  static isServerError(error: any): boolean {
    const status = error?.status || error?.error?.status;
    return status >= 500 && status < 600;
  }
}
