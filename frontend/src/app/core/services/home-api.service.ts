import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiSuccessResponse,
  HomeData,
  MediaAsset,
} from '../models/cafeteria.models';

@Injectable({
  providedIn: 'root',
})
export class HomeApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getHome(): Observable<HomeData> {
    return this.http
      .get<ApiSuccessResponse<HomeData>>(`${this.baseUrl}/home`)
      .pipe(map((res) => res.data));
  }

  getHeroMedia(refresh = false): Observable<MediaAsset | null> {
    const query = refresh ? '?refresh=true' : '';
    return this.http
      .get<ApiSuccessResponse<MediaAsset | null>>(`${this.baseUrl}/media/hero${query}`)
      .pipe(map((res) => res.data));
  }
}
