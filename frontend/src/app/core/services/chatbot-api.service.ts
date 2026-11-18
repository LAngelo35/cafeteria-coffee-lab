import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiSuccessResponse,
  ChatHistoryResponse,
  ChatMessageResponse,
} from '../models/cafeteria.models';

@Injectable({
  providedIn: 'root',
})
export class ChatbotApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  readonly isOpen = signal(false);
  readonly queuedPrompt = signal<string | null>(null);

  openChat(): void {
    this.isOpen.set(true);
  }

  closeChat(): void {
    this.isOpen.set(false);
  }

  toggleChat(): void {
    this.isOpen.update((open) => !open);
  }

  askBarista(prompt: string): void {
    this.isOpen.set(true);
    this.queuedPrompt.set(prompt);
  }

  clearQueuedPrompt(): void {
    this.queuedPrompt.set(null);
  }

  sendMessage(message: string, sessionId?: string | null): Observable<ChatMessageResponse> {
    return this.http
      .post<ApiSuccessResponse<ChatMessageResponse>>(`${this.baseUrl}/chatbot/message`, {
        sessionId: sessionId || undefined,
        message,
      })
      .pipe(map((res) => res.data));
  }

  getHistory(sessionId: string): Observable<ChatHistoryResponse> {
    return this.http
      .get<ApiSuccessResponse<ChatHistoryResponse>>(
        `${this.baseUrl}/chatbot/history/${encodeURIComponent(sessionId)}`,
      )
      .pipe(map((res) => res.data));
  }
}
