import {
  Component,
  HostListener,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { AboutApiService } from '../../../core/services/about-api.service';
import { ChatbotApiService } from '../../../core/services/chatbot-api.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  private readonly router = inject(Router);
  private readonly aboutApi = inject(AboutApiService);
  private readonly chatbotApi = inject(ChatbotApiService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly menuOpen = signal(false);
  protected readonly isScrolled = signal(false);

  protected readonly aboutData = toSignal(this.aboutApi.getAbout(), {
    initialValue: undefined,
  });

  protected readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: '/' },
  );

  protected readonly overDarkHero = computed(
    () =>
      !this.isScrolled() &&
      (this.currentUrl() === '/' || this.currentUrl().startsWith('/inicio')),
  );

  @HostListener('window:scroll')
  protected onWindowScroll(): void {
    if (!this.isBrowser) {
      return;
    }
    this.isScrolled.set(window.scrollY > 36);
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected openBaristaAi(): void {
    this.closeMenu();
    this.chatbotApi.openChat();
  }
}
