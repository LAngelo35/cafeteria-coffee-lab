import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { Product, ProductVariant } from '../../core/models/cafeteria.models';
import { CatalogApiService } from '../../core/services/catalog-api.service';
import { ChatbotApiService } from '../../core/services/chatbot-api.service';
import { PriceBadgeComponent } from '../../shared/components/price-badge/price-badge.component';
import { SkeletonCardComponent } from '../../shared/components/skeleton-card/skeleton-card.component';
import { RevealDirective } from '../../shared/directives/reveal.directive';

@Component({
  selector: 'app-precios',
  standalone: true,
  imports: [FormsModule, RevealDirective, SkeletonCardComponent, PriceBadgeComponent],
  templateUrl: './precios.component.html',
  styleUrl: './precios.component.scss',
})
export class PreciosComponent {
  private readonly catalogApi = inject(CatalogApiService);
  private readonly chatbotApi = inject(ChatbotApiService);

  protected readonly selectedCategory = signal<string>('all');
  protected readonly searchQuery = signal<string>('');
  protected readonly selectedVariants = signal<Record<number, number>>({});
  protected readonly error = signal<string | null>(null);

  protected readonly pricesData = toSignal(
    this.catalogApi.getPrices().pipe(
      catchError(() => {
        this.error.set('No pudimos cargar la carta de precios desde el servidor.');
        return of({ categories: [], combos: [] });
      }),
    ),
    { initialValue: undefined },
  );

  protected readonly filteredCategories = computed(() => {
    const categories = this.pricesData()?.categories ?? [];
    const activeCat = this.selectedCategory();
    const query = this.searchQuery().trim().toLowerCase();

    return categories
      .filter((cat) => activeCat === 'all' || cat.slug === activeCat)
      .map((cat) => {
        if (!query) {
          return cat;
        }
        const items = cat.items.filter((item) =>
          [
            item.name,
            item.description,
            item.tastingNotes || '',
            item.origin || '',
            item.brewMethod || '',
          ]
            .join(' ')
            .toLowerCase()
            .includes(query),
        );
        return { ...cat, items };
      })
      .filter((cat) => cat.items.length > 0);
  });

  protected setCategory(slug: string): void {
    this.selectedCategory.set(slug);
  }

  protected selectVariant(productId: number, variantId: number): void {
    this.selectedVariants.update((current) => ({
      ...current,
      [productId]: variantId,
    }));
  }

  protected activeVariant(product: Product): ProductVariant | null {
    if (product.variants.length === 0) {
      return null;
    }
    const chosenId = this.selectedVariants()[product.id];
    return (
      product.variants.find((variant) => variant.id === chosenId) ??
      product.variants[0]
    );
  }

  protected askAboutCombo(comboName: string): void {
    this.chatbotApi.askBarista(`¿Qué incluye y cuál es el precio del combo "${comboName}"?`);
  }
}
