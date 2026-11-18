import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { RoastLevel } from '../../core/models/cafeteria.models';
import { CatalogApiService } from '../../core/services/catalog-api.service';
import { ChatbotApiService } from '../../core/services/chatbot-api.service';
import { PriceBadgeComponent } from '../../shared/components/price-badge/price-badge.component';
import { SkeletonCardComponent } from '../../shared/components/skeleton-card/skeleton-card.component';
import { RevealDirective } from '../../shared/directives/reveal.directive';

@Component({
  selector: 'app-especialidades',
  standalone: true,
  imports: [RouterLink, RevealDirective, SkeletonCardComponent, PriceBadgeComponent],
  templateUrl: './especialidades.component.html',
  styleUrl: './especialidades.component.scss',
})
export class EspecialidadesComponent {
  private readonly catalogApi = inject(CatalogApiService);
  private readonly chatbotApi = inject(ChatbotApiService);

  protected readonly selectedCategory = signal<string>('all');
  protected readonly selectedTag = signal<string>('all');
  protected readonly error = signal<string | null>(null);

  protected readonly dietaryFilters = [
    { key: 'all', label: 'Todas las etiquetas' },
    { key: 'origen_unico', label: 'Origen Único' },
    { key: 'vegano', label: 'Vegano' },
    { key: 'sin_lactosa', label: 'Sin Lactosa' },
    { key: 'sin_tacc', label: 'Sin TACC' },
  ];

  protected readonly data = toSignal(
    this.catalogApi.getSpecialties().pipe(
      catchError(() => {
        this.error.set('No pudimos cargar las especialidades del laboratorio.');
        return of({ categories: [], items: [] });
      }),
    ),
    { initialValue: undefined },
  );

  protected readonly filteredItems = computed(() => {
    const items = this.data()?.items ?? [];
    const category = this.selectedCategory();
    const tag = this.selectedTag();

    return items.filter((item) => {
      const catMatch = category === 'all' || item.categorySlug === category;
      const tagMatch = tag === 'all' || item.dietaryTags.includes(tag);
      return catMatch && tagMatch;
    });
  });

  protected setCategory(slug: string): void {
    this.selectedCategory.set(slug);
  }

  protected setTag(tag: string): void {
    this.selectedTag.set(tag);
  }

  protected askBarista(name: string): void {
    this.chatbotApi.askBarista(`¿Con qué maridar "${name}" y qué variantes/precios tiene?`);
  }

  protected formatTag(tag: string): string {
    const labels: Record<string, string> = {
      vegano: 'Vegano',
      origen_unico: 'Origen Único',
      sin_lactosa: 'Sin Lactosa',
      sin_tacc: 'Sin TACC',
    };
    return labels[tag] ?? tag;
  }

  protected roastDots(level: RoastLevel): number {
    const map: Record<RoastLevel, number> = {
      ligero: 2,
      medio: 3,
      medio_oscuro: 4,
      oscuro: 5,
      no_aplica: 0,
    };
    return map[level];
  }

  protected roastText(level: RoastLevel): string {
    const map: Record<RoastLevel, string> = {
      ligero: 'Ligero · Floral',
      medio: 'Medio · Balanceado',
      medio_oscuro: 'Medio Oscuro · Cacao',
      oscuro: 'Oscuro · Intenso',
      no_aplica: 'Obrador',
    };
    return map[level];
  }
}
