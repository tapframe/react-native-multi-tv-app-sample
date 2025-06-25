import { StyleSheet, FlatList, View, Image, Text, ActivityIndicator, Dimensions } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DrawerActions, useIsFocused } from '@react-navigation/native';
import { useMenuContext } from '../../components/MenuContext';
import {
  SpatialNavigationFocusableView,
  SpatialNavigationRoot,
  SpatialNavigationScrollView,
  SpatialNavigationNode,
  SpatialNavigationVirtualizedList,
  SpatialNavigationVirtualizedListRef,
  DefaultFocus,
} from 'react-tv-space-navigation';
import { Direction } from '@bam.tech/lrud';
import { scaledPixels } from '@/hooks/useScale';
import { LinearGradient } from 'expo-linear-gradient';
import { StremioAddonCatalogItem } from '../models/StremioAddon';
import { StremioContent, StremioContentService } from '../services/StremioContentService';
import LoadingIndicator from '@/components/LoadingIndicator';

// Fallback to use when no Stremio addons are installed
const fallbackMoviesData = [
  {
    id: '0',
    title: 'Sintel',
    description:
      'Sintel is an independently produced short film, initiated by the Blender Foundation as a means to further improve and validate the free/open source 3D creation suite Blender.',
    poster: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg',
    backdrop: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg',
    logo: undefined,
    movie: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    type: 'movie',
    year: '2010',
    genre: 'Animation',
  },
  // ... other fallback movies
];

export default function IndexScreen() {
  const styles = useGridStyles();
  const router = useRouter();
  const navigation = useNavigation();
  const { isOpen: isMenuOpen, toggleMenu } = useMenuContext();
  const [focusedIndex, setFocusedIndex] = useState(0);
  const isFocused = useIsFocused();
  const isActive = isFocused && !isMenuOpen;

  const [catalogs, setCatalogs] = useState<StremioAddonCatalogItem[]>([]);
  const [catalogContent, setCatalogContent] = useState<Record<string, StremioContent[]>>({});
  const [loading, setLoading] = useState(true);
  const [currentContent, setCurrentContent] = useState<StremioContent[]>(fallbackMoviesData as StremioContent[]);

  // Fetch catalogs from installed addons
  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        const addonCatalogs = await StremioContentService.getCatalogs();
        setCatalogs(addonCatalogs);

        if (addonCatalogs.length > 0) {
          // Load content for each catalog
          const contentMap: Record<string, StremioContent[]> = {};

          for (const catalog of addonCatalogs) {
            if (catalog.addonId && catalog.type && catalog.id) {
              const content = await StremioContentService.getCatalogContent(catalog.addonId, catalog.type, catalog.id);

              if (content.length > 0) {
                const catalogKey = `${catalog.addonId}_${catalog.type}_${catalog.id}`;
                contentMap[catalogKey] = content;

                // Set the first catalog as the current content
                if (Object.keys(contentMap).length === 1) {
                  setCurrentContent(content);
                }
              }
            }
          }

          setCatalogContent(contentMap);
        }
      } catch (error) {
        console.error('Error fetching Stremio catalogs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalogs();
  }, []);

  const focusedItem = useMemo(() => {
    if (currentContent.length > 0 && focusedIndex < currentContent.length) {
      return currentContent[focusedIndex];
    }
    return fallbackMoviesData[0];
  }, [currentContent, focusedIndex]);

  const renderHeader = useCallback(
    () => (
      <View style={styles.header}>
        <Image
          style={styles.headerImage}
          source={{
            uri: focusedItem.backdrop || focusedItem.poster || 'https://via.placeholder.com/1920x1080',
          }}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.3)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientLeft}
        />
        <LinearGradient
          colors={['rgb(0,0,0)', 'rgba(0,0,0, 0.8)', 'rgba(0,0,0, 0.6)', 'rgba(0,0,0, 0.2)', 'transparent']}
          locations={[0, 0.2, 0.4, 0.7, 1]}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={styles.gradientBottom}
        />
        <View style={styles.headerTextContainer}>
          {focusedItem.logo ? (
            <Image source={{ uri: focusedItem.logo }} style={styles.headerLogo} resizeMode="contain" />
          ) : (
            <Text style={styles.headerTitle}>{focusedItem.title}</Text>
          )}
          <Text style={styles.headerDescription}>{focusedItem.description}</Text>
          {focusedItem.year && (
            <Text style={styles.headerMetadata}>
              {focusedItem.year} {focusedItem.genre && `• ${focusedItem.genre}`}
            </Text>
          )}
        </View>
      </View>
    ),
    [focusedItem, styles.header, styles.gradientLeft, styles.gradientBottom],
  );

  const onDirectionHandledWithoutMovement = useCallback(
    (movement: Direction) => {
      if (movement === 'left') {
        navigation.dispatch(DrawerActions.openDrawer());
        toggleMenu(true);
      }
    },
    [toggleMenu, navigation],
  );

  const renderCatalogRow = useCallback(
    (catalog: StremioAddonCatalogItem) => {
      const catalogKey = `${catalog.addonId}_${catalog.type}_${catalog.id}`;
      const content = catalogContent[catalogKey] || [];

      if (content.length === 0) return null;

      const renderItem = ({ item, index }: { item: StremioContent; index: number }) => (
        <SpatialNavigationFocusableView
          onSelect={() => {
            router.push({
              pathname: '/details',
              params: {
                title: item.title,
                description: item.description || '',
                headerImage: item.backdrop || item.poster || '',
                movie: item.id,
                logo: item.logo || '',
              },
            });
          }}
          onFocus={() => {
            setFocusedIndex(index);
            setCurrentContent(content);
          }}
        >
          {({ isFocused }) => (
            <View style={[styles.highlightThumbnail, isFocused && styles.highlightThumbnailFocused]}>
              <Image
                source={{ uri: item.poster || 'https://via.placeholder.com/200x300' }}
                style={styles.posterImage}
              />
            </View>
          )}
        </SpatialNavigationFocusableView>
      );

      return (
        <View style={styles.highlightsContainer} key={catalogKey}>
          <Text style={styles.highlightsTitle}>{catalog.name}</Text>
          <SpatialNavigationNode>
            <DefaultFocus>
              <View style={styles.listContainer}>
                <SpatialNavigationVirtualizedList
                  data={content}
                  orientation="horizontal"
                  renderItem={renderItem}
                  itemSize={scaledPixels(220)}
                  numberOfRenderedItems={12}
                  numberOfItemsVisibleOnScreen={6}
                  onEndReachedThresholdItemsNumber={3}
                />
              </View>
            </DefaultFocus>
          </SpatialNavigationNode>
        </View>
      );
    },
    [catalogContent, router, styles],
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <LoadingIndicator />
      </View>
    );
  }

  return (
    <SpatialNavigationRoot isActive={isActive} onDirectionHandledWithoutMovement={onDirectionHandledWithoutMovement}>
      <View style={styles.container}>
        {renderHeader()}
        <SpatialNavigationScrollView offsetFromStart={scaledPixels(60)} style={styles.scrollContent}>
          {catalogs.length > 0 ? (
            catalogs.map(renderCatalogRow)
          ) : (
            <View style={styles.noAddonsContainer}>
              <Text style={styles.noAddonsText}>No Stremio addons installed.</Text>
              <Text style={styles.noAddonsSubText}>Go to the Addons page to install some addons.</Text>
            </View>
          )}
        </SpatialNavigationScrollView>
      </View>
    </SpatialNavigationRoot>
  );
}

const useGridStyles = function () {
  const { height } = Dimensions.get('window');

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'black',
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollContent: {
      flex: 1,
      marginBottom: scaledPixels(48),
      position: 'absolute',
      top: height * 0.6,
      left: 0,
      right: 0,
      bottom: 0,
      paddingTop: scaledPixels(0),
    },
    highlightsTitle: {
      color: '#fff',
      fontSize: scaledPixels(34),
      fontWeight: 'bold',
      marginBottom: scaledPixels(10),
      marginTop: scaledPixels(15),
      paddingHorizontal: scaledPixels(40),
      textShadowColor: 'rgba(0, 0, 0, 0.75)',
      textShadowOffset: { width: -1, height: 1 },
      textShadowRadius: 10,
    },
    headerTitle: {
      color: '#fff',
      fontSize: scaledPixels(48),
      fontWeight: 'bold',
      textShadowColor: 'rgba(0, 0, 0, 0.75)',
      textShadowOffset: { width: -1, height: 1 },
      textShadowRadius: 10,
    },
    headerDescription: {
      color: '#fff',
      fontSize: scaledPixels(24),
      fontWeight: '500',
      paddingTop: scaledPixels(16),
      textShadowColor: 'rgba(0, 0, 0, 0.75)',
      textShadowOffset: { width: -1, height: 1 },
      textShadowRadius: 10,
    },
    headerMetadata: {
      color: '#ccc',
      fontSize: scaledPixels(18),
      paddingTop: scaledPixels(8),
      textShadowColor: 'rgba(0, 0, 0, 0.75)',
      textShadowOffset: { width: -1, height: 1 },
      textShadowRadius: 10,
    },
    posterImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    highlightThumbnail: {
      width: scaledPixels(200),
      height: scaledPixels(300),
      marginRight: scaledPixels(20),
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: scaledPixels(10),
      overflow: 'hidden',
      borderWidth: scaledPixels(2),
      borderColor: 'transparent',
    },
    highlightThumbnailFocused: {
      borderColor: '#fff',
      borderWidth: scaledPixels(4),
      transform: [{ scale: 1.05 }],
    },
    highlightsContainer: {
      paddingVertical: scaledPixels(10),
      height: scaledPixels(400),
      marginBottom: scaledPixels(20),
    },
    listContainer: {
      paddingHorizontal: scaledPixels(40),
    },
    thumbnailPlaceholder: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      width: '100%',
      height: '100%',
      borderRadius: scaledPixels(5),
    },
    header: {
      width: '100%',
      height: '100%',
      position: 'relative',
    },
    headerImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    gradientLeft: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      height: '100%',
    },
    gradientBottom: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: '50%',
    },
    headerTextContainer: {
      position: 'absolute',
      left: scaledPixels(40),
      top: 0,
      bottom: height * 0.4,
      justifyContent: 'flex-end',
      paddingBottom: scaledPixels(40),
      width: '50%',
    },
    highlightsList: {
      paddingLeft: scaledPixels(20),
    },
    cardImage: {
      width: '100%',
      height: '70%',
      borderTopLeftRadius: scaledPixels(10),
      borderTopRightRadius: scaledPixels(10),
    },
    noAddonsContainer: {
      padding: scaledPixels(20),
      alignItems: 'center',
    },
    noAddonsText: {
      color: '#fff',
      fontSize: scaledPixels(24),
      fontWeight: 'bold',
      marginBottom: scaledPixels(10),
    },
    noAddonsSubText: {
      color: '#ccc',
      fontSize: scaledPixels(18),
    },
    headerLogo: {
      width: scaledPixels(400),
      height: scaledPixels(120),
      marginBottom: scaledPixels(20),
    },
  });
};
