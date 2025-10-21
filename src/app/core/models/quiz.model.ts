import { User } from './user.model';
import { Lesson, Matiere, Classe } from './lesson.model';

/**
 * Model Quiz - Quiz/Évaluation
 */
export interface Quiz {
  id: number;
  lesson_id?: number;
  matiere_id?: number;
  classe_id?: number;
  created_by: number;
  title: string;
  description?: string;
  instructions?: string;
  type: QuizType;
  duration_minutes?: number;
  max_attempts: number;
  passing_score: number;
  shuffle_questions: boolean;
  shuffle_answers: boolean;
  show_correct_answers: boolean;
  allow_review: boolean;
  status: QuizStatus;
  published_at?: string;
  available_from?: string;
  available_until?: string;
  total_questions: number;
  total_points: number;
  attempts_count: number;
  average_score?: number;
  created_at: string;
  updated_at: string;

  // Relations
  creator?: User;
  lesson?: Lesson;
  matiere?: Matiere;
  classe?: Classe;

  // Infos utilisateur
  user_attempts_count?: number;
  user_can_attempt?: boolean;
  user_best_attempt?: QuizAttempt;
  user_latest_attempt?: QuizAttempt;
}

export type QuizType = 'formative' | 'summative' | 'diagnostic';
export type QuizStatus = 'draft' | 'published' | 'archived';

export interface QuizQuestion {
  id: number;
  quiz_id: number;
  question_text: string;
  explanation?: string;
  type: QuestionType;
  order: number;
  points: number;
  is_required: boolean;
  metadata?: any;
  created_at: string;
  updated_at: string;

  // Relations
  answers?: QuizAnswer[];
}

export type QuestionType = 'multiple_choice' | 'multiple_response' | 'true_false' | 'short_answer' | 'essay';

export interface QuizAnswer {
  id: number;
  question_id: number;
  answer_text: string;
  is_correct: boolean;
  order: number;
  feedback?: string;
  created_at: string;
  updated_at: string;
}

export interface QuizAttempt {
  id: number;
  quiz_id: number;
  user_id: number;
  attempt_number: number;
  status: AttemptStatus;
  started_at?: string;
  submitted_at?: string;
  time_spent_seconds?: number;
  score?: number;
  points_earned?: number;
  points_possible?: number;
  passed?: boolean;
  answers?: { [key: number]: any };
  teacher_feedback?: string;
  graded_by?: number;
  graded_at?: string;
  created_at: string;
  updated_at: string;

  // Relations
  user?: User;
  quiz?: Quiz;
  grader?: User;

  // Helpers
  time_spent_formatted?: string;
  time_remaining?: number;
  questions_with_results?: QuestionResult[];
}

export type AttemptStatus = 'in_progress' | 'submitted' | 'graded' | 'abandoned';

export interface QuestionResult {
  question: QuizQuestion;
  user_answer: any;
  is_correct: boolean | null;
  points_earned: number;
  correct_answers: QuizAnswer[];
}

export interface StartAttemptResponse {
  attempt: QuizAttempt;
  quiz: Quiz;
  questions: QuizQuestion[];
  time_remaining?: number;
}

export interface SubmitAttemptData {
  answers: { [key: number]: any };
}

export interface CreateQuizData {
  title: string;
  description?: string;
  instructions?: string;
  lesson_id?: number;
  matiere_id?: number;
  classe_id?: number;
  type?: QuizType;
  duration_minutes?: number;
  max_attempts?: number;
  passing_score?: number;
  shuffle_questions?: boolean;
  shuffle_answers?: boolean;
  show_correct_answers?: boolean;
  allow_review?: boolean;
}

export interface QuizFilters {
  lesson_id?: number;
  matiere_id?: number;
  classe_id?: number;
  type?: QuizType;
  status?: QuizStatus;
  search?: string;
  sort?: 'recent' | 'title' | 'popular';
  per_page?: number;
  page?: number;
}
