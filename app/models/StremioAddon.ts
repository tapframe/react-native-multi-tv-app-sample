export interface StremioAddonCatalog {
    type: string;
    id: string;
    name: string;
  }
  
  export interface StremioAddonCatalogExtra {
    name: string;
    options?: string[];
    isRequired?: boolean;
    optionsLimit?: number;
  }
  
  export interface StremioAddonCatalogItem {
    type: string;
    id: string;
    genres?: string[];
    extra?: StremioAddonCatalogExtra[];
    extraSupported?: string[];
    extraRequired?: string[];
    name: string;
    addonId?: string;
    addonName?: string;
  }
  
  export interface StremioAddon {
    id: string;
    version: string;
    description: string;
    name: string;
    resources: string[];
    types: string[];
    idPrefixes?: string[];
    addonCatalogs?: StremioAddonCatalog[];
    catalogs?: StremioAddonCatalogItem[];
    behaviorHints?: {
      [key: string]: any;
    };
    url?: string;
  } 