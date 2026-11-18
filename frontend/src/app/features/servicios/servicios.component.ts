import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { CatalogApiService } from '../../core/services/catalog-api.service';
import { ChatbotApiService } from '../../core/services/chatbot-api.service';
import { PriceBadgeComponent } from '../../shared/components/price-badge/price-badge.component';
import { SkeletonCardComponent } from '../../shared/components/skeleton-card/skeleton-card.component';
import { RevealDirective } from '../../shared/directives/reveal.directive';

type ServiceFilter = 'all' | 'featured' | 'reservation' | 'walkin';

@Component({
  selector: 'app-servicios',
  standalone: true,
  imports: [RouterLink, RevealDirective, SkeletonCardComponent, PriceBadgeComponent],
  templateUrl: './servicios.component.html',
  styleUrl: './servicios.component.scss',
})
export class ServiciosComponent {
  private readonly catalogApi = inject(CatalogApiService);
  private readonly chatbotApi = inject(ChatbotApiService);

  protected readonly activeFilter = signal<ServiceFilter>('all');
  protected readonly error = signal<string | null>(null);

  protected readonly services = toSignal(
    this.catalogApi.getServices().pipe(
      catchError(() => {
        this.error.set('No pudimos cargar los servicios desde la API.');
        return of([]);
      }),
    ),
    { initialValue: undefined },
  );

  protected readonly filteredServices = computed(() => {
    const list = this.services() ?? [];
    switch (this.activeFilter()) {
      case 'featured':
        return list.filter((s) => s.isFeatured);
      case 'reservation':
        return list.filter((s) => s.requiresReservation);
      case 'walkin':
        return list.filter((s) => !s.requiresReservation);
      default:
        return list;
    }
  });

  protected setFilter(filter: ServiceFilter): void {
    this.activeFilter.set(filter);
  }

  protected askAboutService(title: string): void {
    this.chatbotApi.askBarista(`Dame detalles, disponibilidad y precio del servicio "${title}".`);
  }
}
