/**
 * Model User - Utilisateur de l'application
 */
export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  klassci_id?: number;
  klassci_data?: any;
  last_klassci_sync?: string;
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'etudiant' | 'student' | 'enseignant' | 'teacher' | 'coordinateur' | 'coordinator' | 'admin' | 'administrateur';

export interface AuthResponse {
  success: boolean;
  message?: string;
  data: {
    user: User;
    token: string;
    expires_at?: string;
  };
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

/**
 * Helper pour vérifier les rôles
 */
export class UserHelper {
  static isStudent(user: User): boolean {
    return user.role === 'etudiant' || user.role === 'student';
  }

  static isTeacher(user: User): boolean {
    return user.role === 'enseignant' || user.role === 'teacher';
  }

  static isCoordinator(user: User): boolean {
    return user.role === 'coordinateur' || user.role === 'coordinator';
  }

  static isAdmin(user: User): boolean {
    return user.role === 'admin' || user.role === 'administrateur';
  }

  static canCreateLesson(user: User): boolean {
    return this.isTeacher(user) || this.isCoordinator(user) || this.isAdmin(user);
  }

  static canModerate(user: User): boolean {
    return this.isTeacher(user) || this.isCoordinator(user) || this.isAdmin(user);
  }

  static getRoleLabel(role: UserRole): string {
    const labels: Record<UserRole, string> = {
      'etudiant': 'Étudiant',
      'student': 'Étudiant',
      'enseignant': 'Enseignant',
      'teacher': 'Enseignant',
      'coordinateur': 'Coordinateur',
      'coordinator': 'Coordinateur',
      'admin': 'Administrateur',
      'administrateur': 'Administrateur'
    };
    return labels[role] || 'Utilisateur';
  }
}
