import React, { useEffect, useState } from 'react';
import Video, { VideoRef } from 'react-native-video';
import { StyleSheet, Dimensions, Platform, TouchableWithoutFeedback, View, Text } from 'react-native';
import LoadingIndicator from '@/components/LoadingIndicator';
import { StremioStreamService } from '@/app/services/StremioStreamService';

const { width } = Dimensions.get('window');

interface VideoPlayerProps {
  movie: string;
  headerImage: string;
  paused: boolean;
  controls: boolean;
  onBuffer: (isBuffering: boolean) => void;
  onProgress: (currentTime: number) => void;
  onLoad: (duration: number) => void;
  onEnd: () => void;
}

// This is a simple function to check if the movie ID is a Stremio ID
const isStremioId = (id: string): boolean => {
  return id.startsWith('tt') || id.includes(':');
};

const VideoPlayer = React.forwardRef<VideoRef, VideoPlayerProps>(
  ({ movie, headerImage, paused, controls, onBuffer, onProgress, onLoad, onEnd }, ref) => {
    const styles = useVideoPlayerStyles();
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
      // If it's a direct video URL, use it directly
      if (movie.startsWith('http') && !isStremioId(movie)) {
        setVideoUrl(movie);
        return;
      }

      // If it's a Stremio ID, we need to fetch the stream
      if (isStremioId(movie)) {
        fetchStremioStream(movie);
      }
    }, [movie]);

    const fetchStremioStream = async (id: string) => {
      try {
        setLoading(true);
        setError(null);

        // Determine content type from ID (simple heuristic)
        const type = id.startsWith('tt') ? 'movie' : 'series';

        // Get streams from installed addons
        const streams = await StremioStreamService.getStreams(id, type);

        if (streams.length === 0) {
          setError('No streams found for this content. Try installing more addons.');
          setLoading(false);
          return;
        }

        // Get the best stream
        const bestStream = StremioStreamService.getBestStream(streams);

        if (!bestStream || !bestStream.url) {
          setError('No playable stream found. Try installing more addons.');
          setLoading(false);
          return;
        }

        // Set the video URL
        setVideoUrl(bestStream.url);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching Stremio stream:', err);
        setError(err?.message || 'Failed to load stream. Please try again later.');
        setLoading(false);
      }
    };

    if (loading) {
      return (
        <View style={styles.placeholderContainer}>
          <LoadingIndicator />
          <Text style={styles.loadingText}>Loading stream...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.placeholderContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    if (!videoUrl && !isStremioId(movie)) {
      setVideoUrl(movie);
    }

    if (!videoUrl) {
      return (
        <View style={styles.placeholderContainer}>
          <Text style={styles.errorText}>No video URL available</Text>
        </View>
      );
    }

    return (
      <TouchableWithoutFeedback>
        <Video
          ref={ref}
          source={{ uri: videoUrl }}
          style={styles.video}
          controls={controls}
          paused={paused}
          onBuffer={({ isBuffering }) => onBuffer(isBuffering)}
          onProgress={({ currentTime }) => onProgress(currentTime)}
          onLoad={({ duration }) => onLoad(duration)}
          onEnd={onEnd}
          poster={
            Platform.OS === 'web'
              ? {}
              : {
                  source: { uri: headerImage },
                  resizeMode: 'cover',
                  style: { width: '100%', height: '100%' },
                }
          }
          resizeMode="cover"
        />
      </TouchableWithoutFeedback>
    );
  },
);

const useVideoPlayerStyles = () => {
  return StyleSheet.create({
    video: {
      width: '100%',
      height: width * (9 / 16),
    },
    placeholderContainer: {
      width: '100%',
      height: width * (9 / 16),
      backgroundColor: '#000',
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      color: '#fff',
      fontSize: 18,
      marginTop: 10,
    },
    errorText: {
      color: '#ff6b6b',
      fontSize: 18,
      textAlign: 'center',
      padding: 20,
    },
  });
};

export default VideoPlayer;
