import { User } from './user.model';

/**
 * Model Lesson - Cours/Leçon
 */
export interface Lesson {
  id: number;
  matiere_id?: number;
  classe_id?: number;
  enseignant_id: number;
  title: string;
  description?: string;
  content?: string;
  type: LessonType;
  status: LessonStatus;
  order: number;
  duration_minutes?: number;
  published_at?: string;
  archived_at?: string;
  attachments?: string[];
  created_at: string;
  updated_at: string;

  // Relations
  enseignant?: User;
  matiere?: Matiere;
  classe?: Classe;
  user_progress?: LessonProgress;

  // Stats (pour enseignants)
  students_started?: number;
  students_completed?: number;
  average_completion_rate?: number;
}

export type LessonType = 'cours' | 'tp' | 'td' | 'projet' | 'autre';
export type LessonStatus = 'draft' | 'published' | 'archived';

export interface LessonProgress {
  id: number;
  user_id: number;
  lesson_id: number;
  status: ProgressStatus;
  progress_percentage: number;
  time_spent_minutes: number;
  last_accessed_at?: string;
  completed_at?: string;
  rating?: number;
  created_at: string;
  updated_at: string;
}

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface Matiere {
  id: number;
  klassci_id: number;
  libelle: string;
  code?: string;
  coefficient?: number;
  created_at: string;
  updated_at: string;
}

export interface Classe {
  id: number;
  klassci_id: number;
  libelle: string;
  effectif?: number;
  niveau?: string;
  created_at: string;
  updated_at: string;
}

export interface LessonFilters {
  matiere_id?: number;
  classe_id?: number;
  enseignant_id?: number;
  type?: LessonType;
  status?: LessonStatus;
  search?: string;
  sort?: 'recent' | 'title' | 'popular';
  per_page?: number;
  page?: number;
}

export interface CreateLessonData {
  title: string;
  description?: string;
  content?: string;
  matiere_id?: number;
  classe_id?: number;
  type?: LessonType;
  duration_minutes?: number;
  order?: number;
}

export interface UpdateProgressData {
  progress_percentage: number;
  time_spent_minutes?: number;
}
