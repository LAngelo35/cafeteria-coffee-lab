import {
  Component,
  ElementRef,
  PLATFORM_ID,
  ViewChild,
  effect,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { RoastLevel } from '../../core/models/cafeteria.models';
import { ChatbotApiService } from '../../core/services/chatbot-api.service';
import { HomeApiService } from '../../core/services/home-api.service';
import { PriceBadgeComponent } from '../../shared/components/price-badge/price-badge.component';
import { SkeletonCardComponent } from '../../shared/components/skeleton-card/skeleton-card.component';
import { RevealDirective } from '../../shared/directives/reveal.directive';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink, RevealDirective, SkeletonCardComponent, PriceBadgeComponent],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.scss',
})
export class InicioComponent {
  @ViewChild('heroVideoEl') private heroVideoEl?: ElementRef<HTMLVideoElement>;

  private readonly homeApi = inject(HomeApiService);
  private readonly chatbotApi = inject(ChatbotApiService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly error = signal<string | null>(null);
  protected readonly prefersReducedMotion = signal(
    this.isBrowser &&
      (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false),
  );

  protected readonly homeData = toSignal(
    this.homeApi.getHome().pipe(
      catchError(() => {
        this.error.set('No pudimos cargar el contenido en vivo del Coffee Lab.');
        return of(undefined);
      }),
    ),
    { initialValue: undefined },
  );

  constructor() {
    effect(() => {
      const data = this.homeData();
      if (!this.isBrowser || !data?.heroVideo || this.prefersReducedMotion()) {
        return;
      }
      setTimeout(() => {
        const video = this.heroVideoEl?.nativeElement;
        if (video) {
          video.muted = true;
          video.play().catch(() => {
            // El navegador mantiene el poster estático si el ahorro de energía bloquea autoplay
          });
        }
      }, 40);
    });
  }

  protected openBarista(prompt?: string): void {
    if (prompt) {
      this.chatbotApi.askBarista(prompt);
    } else {
      this.chatbotApi.openChat();
    }
  }

  protected roastDots(level: RoastLevel): number {
    switch (level) {
      case 'ligero':
        return 2;
      case 'medio':
        return 3;
      case 'medio_oscuro':
        return 4;
      case 'oscuro':
        return 5;
      default:
        return 0;
    }
  }

  protected roastLabel(level: RoastLevel): string {
    switch (level) {
      case 'ligero':
        return 'Tueste Ligero';
      case 'medio':
        return 'Tueste Medio';
      case 'medio_oscuro':
        return 'Medio Oscuro';
      case 'oscuro':
        return 'Oscuro';
      default:
        return 'Artesanal';
    }
  }
}
