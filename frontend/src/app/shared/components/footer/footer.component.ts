import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AboutApiService } from '../../../core/services/about-api.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  private readonly aboutApi = inject(AboutApiService);

  protected readonly currentYear = new Date().getFullYear();
  protected readonly aboutData = toSignal(this.aboutApi.getAbout(), {
    initialValue: undefined,
  });
}
