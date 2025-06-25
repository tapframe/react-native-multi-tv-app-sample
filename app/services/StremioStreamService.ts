import { StremioAddonService } from './StremioAddonService';

export interface StremioStream {
  name: string;
  title: string;
  url: string;
  behaviorHints?: {
    bingeGroup?: string;
    notWebReady?: boolean;
    [key: string]: any;
  };
}

export class StremioStreamService {
  static async getStreams(id: string, type: string = 'movie'): Promise<StremioStream[]> {
    try {
      const installedAddons = await StremioAddonService.getInstalledAddons();
      const streams: StremioStream[] = [];
      
      // Filter addons that support streams
      const streamAddons = installedAddons.filter(addon => 
        addon.resources && addon.resources.includes('stream')
      );
      
      if (streamAddons.length === 0) {
        throw new Error('No stream addons installed. Please install stream addons from the Addons page.');
      }
      
      // For each addon that supports streams, fetch the streams for this content
      for (const addon of streamAddons) {
        if (!addon.url) continue;
        
        const baseUrl = addon.url.replace('manifest.json', '');
        const streamUrl = `${baseUrl}stream/${type}/${id}.json`;
        
        try {
          const response = await fetch(streamUrl);
          if (!response.ok) continue;
          
          const data = await response.json();
          if (data.streams && Array.isArray(data.streams)) {
            // Add addon name to each stream for identification
            const addonStreams = data.streams.map((stream: any) => ({
              ...stream,
              addonName: addon.name,
              addonId: addon.id
            }));
            
            streams.push(...addonStreams);
          }
        } catch (error) {
          console.error(`Error fetching streams from ${addon.name}:`, error);
          // Continue to the next addon even if one fails
        }
      }
      
      return streams;
    } catch (error) {
      console.error('Error getting streams:', error);
      throw error;
    }
  }
  
  static getBestStream(streams: StremioStream[]): StremioStream | null {
    if (!streams || streams.length === 0) return null;
    
    // Filter out streams that are not web-ready if we're on web
    const webReadyStreams = streams.filter(stream => 
      !stream.behaviorHints || !stream.behaviorHints.notWebReady
    );
    
    // If we have web-ready streams, use those, otherwise fall back to all streams
    const usableStreams = webReadyStreams.length > 0 ? webReadyStreams : streams;
    
    // For now, just return the first stream
    // In a real app, you might want to implement more sophisticated selection logic
    return usableStreams[0] || null;
  }
} 