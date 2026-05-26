import { http } from '../../../shared/lib/http.js';
import type { HealthResponse } from '@genograma/shared';

export const getHealth = () => http<HealthResponse>('/health');
