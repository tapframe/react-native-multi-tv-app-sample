import AsyncStorage from '@react-native-async-storage/async-storage';
import { StremioAddon } from '../models/StremioAddon';

const INSTALLED_ADDONS_KEY = 'stremio_installed_addons';

// Default Cinemeta addon
const DEFAULT_CINEMETA_ADDON: StremioAddon = {
  "id": "com.linvo.cinemeta",
  "version": "3.0.13",
  "description": "The official addon for movie and series catalogs",
  "name": "Cinemeta",
  "resources": ["catalog", "meta", "addon_catalog"],
  "types": ["movie", "series"],
  "idPrefixes": ["tt"],
  "addonCatalogs": [
    {"type": "all", "id": "official", "name": "Official"},
    {"type": "movie", "id": "official", "name": "Official"},
    {"type": "series", "id": "official", "name": "Official"},
    {"type": "channel", "id": "official", "name": "Official"},
    {"type": "all", "id": "community", "name": "Community"},
    {"type": "movie", "id": "community", "name": "Community"},
    {"type": "series", "id": "community", "name": "Community"},
    {"type": "channel", "id": "community", "name": "Community"},
    {"type": "tv", "id": "community", "name": "Community"},
    {"type": "Podcasts", "id": "community", "name": "Community"},
    {"type": "other", "id": "community", "name": "Community"}
  ],
  "catalogs": [
    {
      "type": "movie",
      "id": "top",
      "genres": ["Action", "Adventure", "Animation", "Biography", "Comedy", "Crime", "Documentary", "Drama", "Family", "Fantasy", "History", "Horror", "Mystery", "Romance", "Sci-Fi", "Sport", "Thriller", "War", "Western"],
      "extra": [
        {"name": "genre", "options": ["Action", "Adventure", "Animation", "Biography", "Comedy", "Crime", "Documentary", "Drama", "Family", "Fantasy", "History", "Horror", "Mystery", "Romance", "Sci-Fi", "Sport", "Thriller", "War", "Western"]},
        {"name": "search"},
        {"name": "skip"}
      ],
      "extraSupported": ["search", "genre", "skip"],
      "name": "Popular"
    },
    {
      "type": "series",
      "id": "top",
      "genres": ["Action", "Adventure", "Animation", "Biography", "Comedy", "Crime", "Documentary", "Drama", "Family", "Fantasy", "History", "Horror", "Mystery", "Romance", "Sci-Fi", "Sport", "Thriller", "War", "Western", "Reality-TV", "Talk-Show", "Game-Show"],
      "extra": [
        {"name": "genre", "options": ["Action", "Adventure", "Animation", "Biography", "Comedy", "Crime", "Documentary", "Drama", "Family", "Fantasy", "History", "Horror", "Mystery", "Romance", "Sci-Fi", "Sport", "Thriller", "War", "Western", "Reality-TV", "Talk-Show", "Game-Show"]},
        {"name": "search"},
        {"name": "skip"}
      ],
      "extraSupported": ["search", "genre", "skip"],
      "name": "Popular"
    }
  ],
  "url": "https://v3-cinemeta.strem.io/manifest.json",
  "behaviorHints": {
    "newEpisodeNotifications": true
  }
};

export class StremioAddonService {
  static async fetchAddonManifest(url: string): Promise<StremioAddon> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch addon: ${response.statusText}`);
      }
      
      const manifest = await response.json();
      return {
        ...manifest,
        url: url
      };
    } catch (error) {
      console.error('Error fetching addon manifest:', error);
      throw error;
    }
  }

  static async getInstalledAddons(): Promise<StremioAddon[]> {
    try {
      const storedAddons = await AsyncStorage.getItem(INSTALLED_ADDONS_KEY);
      const addons = storedAddons ? JSON.parse(storedAddons) : [];
      
      // If no addons are installed, add the default Cinemeta addon
      if (addons.length === 0) {
        await this.installAddon(DEFAULT_CINEMETA_ADDON);
        return [DEFAULT_CINEMETA_ADDON];
      }
      
      return addons;
    } catch (error) {
      console.error('Error getting installed addons:', error);
      return [];
    }
  }

  static async installAddon(addon: StremioAddon): Promise<void> {
    try {
      const installedAddons = await this.getInstalledAddons();
      
      // Check if addon is already installed
      const existingIndex = installedAddons.findIndex(a => a.id === addon.id);
      if (existingIndex >= 0) {
        // Update existing addon
        installedAddons[existingIndex] = addon;
      } else {
        // Add new addon
        installedAddons.push(addon);
      }
      
      await AsyncStorage.setItem(INSTALLED_ADDONS_KEY, JSON.stringify(installedAddons));
    } catch (error) {
      console.error('Error installing addon:', error);
      throw error;
    }
  }

  static async uninstallAddon(addonId: string): Promise<void> {
    try {
      const installedAddons = await this.getInstalledAddons();
      const filteredAddons = installedAddons.filter(addon => addon.id !== addonId);
      await AsyncStorage.setItem(INSTALLED_ADDONS_KEY, JSON.stringify(filteredAddons));
    } catch (error) {
      console.error('Error uninstalling addon:', error);
      throw error;
    }
  }
} 