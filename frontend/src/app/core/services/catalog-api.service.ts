import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiSuccessResponse,
  CafeService,
  PricesData,
  SpecialtiesData,
} from '../models/cafeteria.models';

@Injectable({
  providedIn: 'root',
})
export class CatalogApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getServices(featuredOnly = false): Observable<CafeService[]> {
    const params = featuredOnly ? new HttpParams().set('featured', '1') : undefined;
    return this.http
      .get<ApiSuccessResponse<CafeService[]>>(`${this.baseUrl}/services`, { params })
      .pipe(map((res) => res.data));
  }

  getSpecialties(filters?: { tag?: string; category?: string }): Observable<SpecialtiesData> {
    let params = new HttpParams();
    if (filters?.tag) {
      params = params.set('tag', filters.tag);
    }
    if (filters?.category) {
      params = params.set('category', filters.category);
    }
    return this.http
      .get<ApiSuccessResponse<SpecialtiesData>>(`${this.baseUrl}/specialties`, { params })
      .pipe(map((res) => res.data));
  }

  getPrices(filters?: { category?: string; search?: string }): Observable<PricesData> {
    let params = new HttpParams();
    if (filters?.category) {
      params = params.set('category', filters.category);
    }
    if (filters?.search) {
      params = params.set('search', filters.search);
    }
    return this.http
      .get<ApiSuccessResponse<PricesData>>(`${this.baseUrl}/prices`, { params })
      .pipe(map((res) => res.data));
  }
}
