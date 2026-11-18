import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-price-badge',
  standalone: true,
  template: `
    <span class="price-badge">
      @if (promoPrice() !== null && promoPrice() !== undefined) {
        <span class="price-badge__old">{{ symbol() }} {{ formatAmount(price()) }}</span>
        <span class="price-badge__current price-badge__current--promo">
          {{ symbol() }} {{ formatAmount(promoPrice()!) }}
        </span>
      } @else {
        <span class="price-badge__current">
          {{ symbol() }} {{ formatAmount(price()) }}
        </span>
      }
    </span>
  `,
  styles: `
    .price-badge {
      display: inline-flex;
      align-items: baseline;
      gap: 0.5rem;
      font-family: var(--font-mono);
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    .price-badge__old {
      font-size: 0.78rem;
      color: var(--text-muted);
      text-decoration: line-through;
    }
    .price-badge__current {
      font-size: 0.96rem;
      font-weight: 600;
      color: var(--text-espresso);
    }
    .price-badge__current--promo {
      color: var(--accent-terracotta);
    }
  `,
})
export class PriceBadgeComponent {
  readonly price = input.required<number>();
  readonly promoPrice = input<number | null>(null);
  readonly currency = input<string>('BOB');

  protected readonly symbol = computed(() =>
    this.currency() === 'BOB' ? 'Bs' : this.currency(),
  );

  protected formatAmount(amount: number): string {
    return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  }
}
