import {
  Component,
  ElementRef,
  OnInit,
  PLATFORM_ID,
  ViewChild,
  effect,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatMessageItem } from '../../../core/models/cafeteria.models';
import { ChatbotApiService } from '../../../core/services/chatbot-api.service';

const SESSION_STORAGE_KEY = 'cafeteria_barista_session_id';

@Component({
  selector: 'app-chatbot-widget',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './chatbot-widget.component.html',
  styleUrl: './chatbot-widget.component.scss',
})
export class ChatbotWidgetComponent implements OnInit {
  @ViewChild('scrollContainer') private scrollContainer?: ElementRef<HTMLDivElement>;

  protected readonly chatbotApi = inject(ChatbotApiService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly isOpen = this.chatbotApi.isOpen;
  protected readonly messages = signal<ChatMessageItem[]>([
    {
      role: 'assistant',
      content:
        '¡Hola! Soy el Barista IA de Origen & Crema. Puedo recomendarte granos según tu gusto, confirmar precios en tiempo real u orientarte sobre opciones veganas y horarios.',
    },
  ]);
  protected readonly draftMessage = signal('');
  protected readonly isSending = signal(false);
  protected readonly activeModel = signal('gemma3:4b');
  protected readonly sessionId = signal<string | null>(null);

  protected readonly suggestedQuestions = [
    '¿Qué café en V60 recomiendas hoy?',
    '¿Cuánto cuesta el Flat White grande?',
    '¿Tienen opciones veganas?',
    '¿Cuál es la dirección y horarios?',
  ];

  constructor() {
    effect(() => {
      const queued = this.chatbotApi.queuedPrompt();
      if (queued) {
        this.chatbotApi.clearQueuedPrompt();
        this.submitPrompt(queued);
      }
    });
  }

  ngOnInit(): void {
    if (!this.isBrowser) {
      return;
    }
    const storedId = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (storedId) {
      this.sessionId.set(storedId);
      this.chatbotApi.getHistory(storedId).subscribe({
        next: (history) => {
          if (history.messages.length > 0) {
            this.messages.set(history.messages);
            this.scrollToBottom();
          }
        },
        error: () => {
          // Mantiene saludo inicial si el backend aún no tiene historial previo
        },
      });
    }
  }

  protected toggle(): void {
    this.chatbotApi.toggleChat();
    if (this.isOpen()) {
      this.scrollToBottom();
    }
  }

  protected sendFromInput(): void {
    const text = this.draftMessage().trim();
    if (!text || this.isSending()) {
      return;
    }
    this.draftMessage.set('');
    this.submitPrompt(text);
  }

  protected submitPrompt(prompt: string): void {
    const clean = prompt.trim();
    if (!clean || this.isSending()) {
      return;
    }

    this.messages.update((prev) => [...prev, { role: 'user', content: clean }]);
    this.isSending.set(true);
    this.scrollToBottom();

    this.chatbotApi.sendMessage(clean, this.sessionId()).subscribe({
      next: (res) => {
        this.persistSessionId(res.sessionId);
        this.activeModel.set(res.model || 'gemma3:4b');
        this.messages.update((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: res.reply,
            latencyMs: res.latencyMs,
          },
        ]);
        this.isSending.set(false);
        this.scrollToBottom();
      },
      error: (err: { message?: string; detail?: { fallbackReply?: string; sessionId?: string } }) => {
        if (err.detail?.sessionId) {
          this.persistSessionId(err.detail.sessionId);
        }
        const fallback = err.detail?.fallbackReply;
        const text = fallback
          ? `${fallback}\n\n[Nota: Gemma 3 en Ollama local no respondió en este instante; respuesta generada con datos en vivo de nuestra carta.]`
          : err.message || 'No pudimos conectar con el Barista IA en este momento.';

        this.messages.update((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: text,
            isFallback: true,
          },
        ]);
        this.isSending.set(false);
        this.scrollToBottom();
      },
    });
  }

  private persistSessionId(id: string): void {
    if (!id) {
      return;
    }
    this.sessionId.set(id);
    if (this.isBrowser) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, id);
    }
  }

  private scrollToBottom(): void {
    if (!this.isBrowser) {
      return;
    }
    setTimeout(() => {
      const el = this.scrollContainer?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }, 30);
  }
}
