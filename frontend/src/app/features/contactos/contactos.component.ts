import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { InquiryType } from '../../core/models/cafeteria.models';
import { AboutApiService } from '../../core/services/about-api.service';
import { ContactApiService } from '../../core/services/contact-api.service';
import { RevealDirective } from '../../shared/directives/reveal.directive';

@Component({
  selector: 'app-contactos',
  standalone: true,
  imports: [ReactiveFormsModule, RevealDirective],
  templateUrl: './contactos.component.html',
  styleUrl: './contactos.component.scss',
})
export class ContactosComponent {
  private readonly fb = inject(FormBuilder);
  private readonly aboutApi = inject(AboutApiService);
  private readonly contactApi = inject(ContactApiService);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly aboutData = toSignal(this.aboutApi.getAbout(), {
    initialValue: undefined,
  });

  protected readonly isSubmitting = signal(false);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly inquiryOptions: { value: InquiryType; label: string }[] = [
    { value: 'consulta_general', label: 'Consulta general' },
    { value: 'reserva', label: 'Reserva de mesa o cata' },
    { value: 'catering_eventos', label: 'Barra móvil / Catering para eventos' },
    { value: 'mayorista', label: 'Granos al por mayor (cafeterías / oficinas)' },
    { value: 'sugerencia', label: 'Sugerencias' },
  ];

  protected readonly contactForm = this.fb.nonNullable.group({
    full_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    phone: ['', [Validators.maxLength(40)]],
    inquiry_type: ['consulta_general' as InquiryType, Validators.required],
    subject: ['', [Validators.maxLength(180)]],
    message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(3000)]],
  });

  protected readonly mapUrl = computed(() => {
    const biz = this.aboutData()?.business;
    if (!biz || biz.latitude === null || biz.longitude === null) {
      return null;
    }
    const url = `https://www.google.com/maps?q=${biz.latitude},${biz.longitude}&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  protected submit(): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);

    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const raw = this.contactForm.getRawValue();

    this.contactApi
      .submitContact({
        full_name: raw.full_name.trim(),
        email: raw.email.trim(),
        phone: raw.phone.trim() || null,
        inquiry_type: raw.inquiry_type,
        subject: raw.subject.trim() || null,
        message: raw.message.trim(),
      })
      .subscribe({
        next: (result) => {
          this.isSubmitting.set(false);
          this.successMessage.set(`${result.message} (Ticket #${result.id})`);
          this.contactForm.reset({
            full_name: '',
            email: '',
            phone: '',
            inquiry_type: 'consulta_general',
            subject: '',
            message: '',
          });
        },
        error: (err: { message?: string }) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(
            err.message || 'No pudimos registrar tu mensaje. Intenta nuevamente.',
          );
        },
      });
  }
}
