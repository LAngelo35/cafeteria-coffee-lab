import { Component, input } from '@angular/core';

@Component({
  selector: 'app-skeleton-card',
  standalone: true,
  template: `
    <div class="skeleton" [style.min-height]="height()" aria-hidden="true">
      <div class="skeleton__media"></div>
      <div class="skeleton__body">
        <span class="skeleton__line skeleton__line--short"></span>
        <span class="skeleton__line skeleton__line--title"></span>
        <span class="skeleton__line"></span>
      </div>
    </div>
  `,
  styles: `
    .skeleton {
      display: flex;
      flex-direction: column;
      border: 1px solid var(--line-hairline);
      background: var(--bg-card);
      overflow: hidden;
    }
    .skeleton__media {
      height: 180px;
      background: linear-gradient(90deg, var(--bg-linen) 25%, #e6ded2 50%, var(--bg-linen) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite linear;
    }
    .skeleton__body {
      display: grid;
      gap: 0.75rem;
      padding: 1.25rem;
    }
    .skeleton__line {
      height: 12px;
      border-radius: 2px;
      background: var(--bg-linen);
    }
    .skeleton__line--short {
      width: 38%;
    }
    .skeleton__line--title {
      width: 72%;
      height: 18px;
    }
    @keyframes shimmer {
      from {
        background-position: 200% 0;
      }
      to {
        background-position: -200% 0;
      }
    }
  `,
})
export class SkeletonCardComponent {
  readonly height = input<string>('320px');
}
