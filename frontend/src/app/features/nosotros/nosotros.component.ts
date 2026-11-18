import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { MediaAsset } from '../../core/models/cafeteria.models';
import { AboutApiService } from '../../core/services/about-api.service';
import { SkeletonCardComponent } from '../../shared/components/skeleton-card/skeleton-card.component';
import { RevealDirective } from '../../shared/directives/reveal.directive';

@Component({
  selector: 'app-nosotros',
  standalone: true,
  imports: [RouterLink, RevealDirective, SkeletonCardComponent],
  templateUrl: './nosotros.component.html',
  styleUrl: './nosotros.component.scss',
})
export class NosotrosComponent {
  private readonly aboutApi = inject(AboutApiService);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly error = signal<string | null>(null);
  protected readonly activeLightboxIndex = signal<number | null>(null);

  protected readonly aboutData = toSignal(
    this.aboutApi.getAbout().pipe(
      catchError(() => {
        this.error.set('No pudimos cargar la historia y galería de la tienda.');
        return of(undefined);
      }),
    ),
    { initialValue: undefined },
  );

  protected readonly activePhoto = computed<MediaAsset | null>(() => {
    const idx = this.activeLightboxIndex();
    const gallery = this.aboutData()?.gallery ?? [];
    if (idx === null || idx < 0 || idx >= gallery.length) {
      return null;
    }
    return gallery[idx];
  });

  // Rescatado del módulo ubicacion.ts del proyecto anterior
  protected readonly mapUrl = computed(() => {
    const biz = this.aboutData()?.business;
    if (!biz || biz.latitude === null || biz.longitude === null) {
      return null;
    }
    const url = `https://www.google.com/maps?q=${biz.latitude},${biz.longitude}&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  protected openLightbox(index: number): void {
    this.activeLightboxIndex.set(index);
  }

  protected closeLightbox(): void {
    this.activeLightboxIndex.set(null);
  }

  protected stepLightbox(delta: -1 | 1): void {
    const gallery = this.aboutData()?.gallery ?? [];
    const current = this.activeLightboxIndex();
    if (current === null || gallery.length === 0) {
      return;
    }
    const next = (current + delta + gallery.length) % gallery.length;
    this.activeLightboxIndex.set(next);
  }

  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if (this.activeLightboxIndex() === null) {
      return;
    }
    if (event.key === 'Escape') {
      this.closeLightbox();
    } else if (event.key === 'ArrowRight') {
      this.stepLightbox(1);
    } else if (event.key === 'ArrowLeft') {
      this.stepLightbox(-1);
    }
  }
}
