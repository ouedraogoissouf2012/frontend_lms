import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import {
  User,
  AuthResponse,
  AuthCredentials,
  RegisterData,
  UserHelper
} from '../models/user.model';
import { ApiResponse } from '../models/api-response.model';

/**
 * Service d'authentification
 * Gère le login, logout, et la session utilisateur
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;

  private tokenKey = 'auth_token';
  private userKey = 'current_user';

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {
    // Charger l'utilisateur depuis le localStorage au démarrage
    const storedUser = localStorage.getItem(this.userKey);
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  /**
   * Obtenir l'utilisateur courant (valeur actuelle)
   */
  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Vérifier si l'utilisateur est connecté
   */
  get isLoggedIn(): boolean {
    return !!this.currentUserValue && !!this.getToken();
  }

  /**
   * Obtenir le token stocké
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Login
   */
  login(credentials: AuthCredentials): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse['data']>('auth/login', credentials)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.setSession(response.data.user, response.data.token);
          }
        }),
        map(response => response as AuthResponse)
      );
  }

  /**
   * Register (si activé)
   */
  register(data: RegisterData): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse['data']>('auth/register', data)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.setSession(response.data.user, response.data.token);
          }
        }),
        map(response => response as AuthResponse)
      );
  }

  /**
   * Logout
   */
  logout(): Observable<any> {
    return this.apiService.post('auth/logout', {})
      .pipe(
        tap(() => this.clearSession()),
        catchError(error => {
          // Même si l'API échoue, on déconnecte localement
          this.clearSession();
          return of(null);
        })
      );
  }

  /**
   * Récupérer le profil utilisateur depuis l'API
   */
  me(): Observable<User | null> {
    return this.apiService.get<User>('auth/me')
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.updateUser(response.data);
          }
        }),
        map(response => response.data || null),
        catchError(error => {
          // Si l'API échoue (token invalide), déconnecter
          if (error.status === 401) {
            this.clearSession();
          }
          return of(null);
        })
      );
  }

  /**
   * Vérifier si le token est toujours valide
   */
  checkAuth(): Observable<boolean> {
    if (!this.getToken()) {
      return of(false);
    }

    return this.apiService.get<any>('auth/check')
      .pipe(
        map(response => response.success === true),
        catchError(() => {
          this.clearSession();
          return of(false);
        })
      );
  }

  /**
   * Refresh token (si implémenté côté backend)
   */
  refreshToken(): Observable<any> {
    return this.apiService.post('auth/refresh', {})
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            localStorage.setItem(this.tokenKey, response.data.token);
          }
        })
      );
  }

  /**
   * Sauvegarder la session (token + user)
   */
  private setSession(user: User, token: string): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  /**
   * Mettre à jour l'utilisateur courant
   */
  private updateUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  /**
   * Effacer la session
   */
  private clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  // ========== Helpers de rôles ==========

  isStudent(): boolean {
    const user = this.currentUserValue;
    return user ? UserHelper.isStudent(user) : false;
  }

  isTeacher(): boolean {
    const user = this.currentUserValue;
    return user ? UserHelper.isTeacher(user) : false;
  }

  isCoordinator(): boolean {
    const user = this.currentUserValue;
    return user ? UserHelper.isCoordinator(user) : false;
  }

  isAdmin(): boolean {
    const user = this.currentUserValue;
    return user ? UserHelper.isAdmin(user) : false;
  }

  canCreateLesson(): boolean {
    const user = this.currentUserValue;
    return user ? UserHelper.canCreateLesson(user) : false;
  }

  canModerate(): boolean {
    const user = this.currentUserValue;
    return user ? UserHelper.canModerate(user) : false;
  }

  hasRole(roles: string[]): boolean {
    const user = this.currentUserValue;
    if (!user) return false;
    return roles.includes(user.role);
  }
}
