import { StremioAddon, StremioAddonCatalogItem } from '../models/StremioAddon';
import { StremioAddonService } from './StremioAddonService';

export interface StremioContent {
  id: string;
  title: string;
  description?: string;
  poster?: string;
  backdrop?: string;
  logo?: string;
  type: string;
  genre?: string;
  year?: string;
  runtime?: string;
  catalogs?: string[];
  videos?: any[];
}

export class StremioContentService {
  static async getCatalogs(): Promise<StremioAddonCatalogItem[]> {
    try {
      const installedAddons = await StremioAddonService.getInstalledAddons();
      const allCatalogs: StremioAddonCatalogItem[] = [];

      for (const addon of installedAddons) {
        if (addon.catalogs && addon.catalogs.length > 0) {
          for (const catalog of addon.catalogs) {
            allCatalogs.push({
              ...catalog,
              addonId: addon.id,
              addonName: addon.name
            } as any);
          }
        }
      }

      return allCatalogs;
    } catch (error) {
      console.error('Error getting catalogs:', error);
      return [];
    }
  }

  static async getCatalogContent(
    addonId: string, 
    type: string, 
    catalogId: string, 
    extra?: Record<string, string>
  ): Promise<StremioContent[]> {
    try {
      const installedAddons = await StremioAddonService.getInstalledAddons();
      const addon = installedAddons.find(a => a.id === addonId);
      
      if (!addon || !addon.url) {
        throw new Error('Addon not found or has no URL');
      }

      // Construct the catalog URL
      const baseUrl = addon.url.replace('manifest.json', '');
      let catalogUrl = `${baseUrl}catalog/${type}/${catalogId}.json`;
      
      // Add extra parameters if provided
      if (extra) {
        const extraParams = new URLSearchParams();
        Object.entries(extra).forEach(([key, value]) => {
          extraParams.append(key, value);
        });
        const extraParamsString = extraParams.toString();
        if (extraParamsString) {
          catalogUrl += `?${extraParamsString}`;
        }
      }

      // Fetch catalog content
      const response = await fetch(catalogUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch catalog: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transform the response to our content format
      return (data.metas || []).map((item: any) => ({
        id: item.id,
        title: item.name || item.title,
        description: item.description || item.overview,
        poster: item.poster || item.thumbnail,
        backdrop: item.background || item.backdrop,
        logo: item.logo,
        type: item.type,
        genre: Array.isArray(item.genres) ? item.genres[0] : item.genre,
        year: item.year?.toString(),
        runtime: item.runtime?.toString(),
        catalogs: item.catalogs,
        videos: item.videos
      }));
    } catch (error) {
      console.error('Error getting catalog content:', error);
      return [];
    }
  }
} 