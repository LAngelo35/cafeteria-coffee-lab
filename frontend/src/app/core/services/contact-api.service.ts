import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiSuccessResponse,
  ContactPayload,
  ContactSubmissionResult,
} from '../models/cafeteria.models';

@Injectable({
  providedIn: 'root',
})
export class ContactApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  submitContact(payload: ContactPayload): Observable<ContactSubmissionResult> {
    return this.http
      .post<ApiSuccessResponse<ContactSubmissionResult>>(`${this.baseUrl}/contact`, payload)
      .pipe(map((res) => res.data));
  }
}
