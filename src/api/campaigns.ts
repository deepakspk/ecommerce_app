import { apiGet } from './client';
import { Campaign } from '@/types/campaign';

export function getHomeCampaigns() {
  return apiGet<{ campaigns: Campaign[] }>('/campaigns/home').then((data) => data.campaigns ?? []);
}
