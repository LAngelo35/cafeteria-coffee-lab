import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AboutData, ApiSuccessResponse } from '../models/cafeteria.models';

@Injectable({
  providedIn: 'root',
})
export class AboutApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;
  private aboutCache$?: Observable<AboutData>;

  getAbout(): Observable<AboutData> {
    if (!this.aboutCache$) {
      this.aboutCache$ = this.http
        .get<ApiSuccessResponse<AboutData>>(`${this.baseUrl}/about`)
        .pipe(
          map((res) => res.data),
          shareReplay(1),
        );
    }
    return this.aboutCache$;
  }
}
