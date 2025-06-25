import { Stack, useNavigation } from 'expo-router';
import { StyleSheet, View, Text, TextInput, Alert, FlatList, Dimensions } from 'react-native';
import {
  DefaultFocus,
  SpatialNavigationFocusableView,
  SpatialNavigationRoot,
  SpatialNavigationNode,
  SpatialNavigationScrollView,
} from 'react-tv-space-navigation';
import { scaledPixels } from '@/hooks/useScale';
import { useMenuContext } from '../../components/MenuContext';
import { DrawerActions, useIsFocused } from '@react-navigation/native';
import { Direction } from '@bam.tech/lrud';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StremioAddon } from '../models/StremioAddon';
import { StremioAddonService } from '../services/StremioAddonService';
import FocusablePressable from '@/components/FocusablePressable';
import { LinearGradient } from 'expo-linear-gradient';
import LoadingIndicator from '@/components/LoadingIndicator';

export default function AddonsScreen() {
  const styles = useAddonsStyles();
  const { isOpen: isMenuOpen, toggleMenu } = useMenuContext();
  const isFocused = useIsFocused();
  const isActive = isFocused && !isMenuOpen;
  const navigation = useNavigation();
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [addonUrl, setAddonUrl] = useState('');
  const [installedAddons, setInstalledAddons] = useState<StremioAddon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const inputRef = useRef<TextInput>(null);

  const onDirectionHandledWithoutMovement = useCallback(
    (movement: Direction) => {
      if (movement === 'left') {
        navigation.dispatch(DrawerActions.openDrawer());
        toggleMenu(true);
      }
    },
    [toggleMenu, navigation],
  );

  useEffect(() => {
    loadInstalledAddons();
  }, []);

  const loadInstalledAddons = async () => {
    try {
      const addons = await StremioAddonService.getInstalledAddons();
      setInstalledAddons(addons);
    } catch (error) {
      console.error('Failed to load addons:', error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  const handleInstallAddon = async () => {
    if (!addonUrl) {
      Alert.alert('Error', 'Please enter a valid addon URL');
      return;
    }

    setIsLoading(true);
    try {
      // If the URL doesn't include manifest.json, append it
      let fullUrl = addonUrl;
      if (!fullUrl.includes('manifest.json')) {
        fullUrl = fullUrl.endsWith('/') ? `${fullUrl}manifest.json` : `${fullUrl}/manifest.json`;
      }

      const addon = await StremioAddonService.fetchAddonManifest(fullUrl);
      await StremioAddonService.installAddon(addon);
      setAddonUrl('');
      loadInstalledAddons();
      Alert.alert('Success', `Addon "${addon.name}" installed successfully!`);
    } catch (error: any) {
      Alert.alert('Error', `Failed to install addon: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUninstallAddon = async (addon: StremioAddon) => {
    try {
      await StremioAddonService.uninstallAddon(addon.id);
      loadInstalledAddons();
      Alert.alert('Success', `Addon "${addon.name}" uninstalled successfully!`);
    } catch (error: any) {
      Alert.alert('Error', `Failed to uninstall addon: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleFocusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const renderAddonItem = ({ item, index }: { item: StremioAddon; index: number }) => (
    <SpatialNavigationNode>
      <View style={styles.addonItem}>
        <View style={styles.addonInfo}>
          <Text style={styles.addonName}>{item.name}</Text>
          <Text style={styles.addonDescription}>{item.description}</Text>
          <View style={styles.addonMetaContainer}>
            <Text style={styles.addonVersion}>Version: {item.version}</Text>
            <Text style={styles.addonTypes}>Types: {item.types.join(', ')}</Text>
          </View>
        </View>
        <SpatialNavigationFocusableView onFocus={() => setFocusedIndex(index + 2)}>
          {({ isFocused }) => (
            <View
              style={[styles.uninstallButton, isFocused && styles.buttonFocused]}
              onTouchEnd={() => handleUninstallAddon(item)}
            >
              <Text style={[styles.buttonText, isFocused && styles.buttonTextFocused]}>Uninstall</Text>
            </View>
          )}
        </SpatialNavigationFocusableView>
      </View>
    </SpatialNavigationNode>
  );

  if (isInitialLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <LoadingIndicator />
      </View>
    );
  }

  return (
    <SpatialNavigationRoot isActive={isActive} onDirectionHandledWithoutMovement={onDirectionHandledWithoutMovement}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.3)']}
          locations={[0, 0.3, 0.7, 1]}
          style={styles.headerGradient}
        >
          <Text style={styles.title}>Stremio Addons</Text>
        </LinearGradient>

        <SpatialNavigationNode orientation="vertical">
          <View style={styles.contentContainer}>
            <View style={styles.inputSection}>
              <Text style={styles.sectionTitle}>Add New Addon</Text>

              <SpatialNavigationNode orientation="vertical">
                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <SpatialNavigationFocusableView
                      onFocus={() => {
                        setFocusedIndex(0);
                        handleFocusInput();
                      }}
                    >
                      {({ isFocused }) => (
                        <View style={[styles.inputWrapperFocusable, isFocused && styles.inputWrapperFocused]}>
                          <TextInput
                            ref={inputRef}
                            style={styles.input}
                            placeholder="Enter addon URL (e.g., https://v3-cinemeta.strem.io)"
                            placeholderTextColor="#888"
                            value={addonUrl}
                            onChangeText={setAddonUrl}
                          />
                        </View>
                      )}
                    </SpatialNavigationFocusableView>
                  </View>

                  <View style={styles.buttonGroup}>
                    <SpatialNavigationNode orientation="horizontal">
                      <View style={styles.buttonRow}>
                        <SpatialNavigationFocusableView onFocus={() => setFocusedIndex(1)}>
                          {({ isFocused }) => (
                            <View
                              style={[styles.actionButton, isFocused && styles.buttonFocused]}
                              onTouchEnd={handleFocusInput}
                            >
                              <Text style={[styles.buttonText, isFocused && styles.buttonTextFocused]}>Edit URL</Text>
                            </View>
                          )}
                        </SpatialNavigationFocusableView>

                        <DefaultFocus>
                          <SpatialNavigationFocusableView>
                            {({ isFocused }) => (
                              <View
                                style={[styles.actionButton, styles.installButton, isFocused && styles.buttonFocused]}
                                onTouchEnd={handleInstallAddon}
                              >
                                <Text style={[styles.buttonText, isFocused && styles.buttonTextFocused]}>
                                  {isLoading ? 'Installing...' : 'Install Addon'}
                                </Text>
                              </View>
                            )}
                          </SpatialNavigationFocusableView>
                        </DefaultFocus>
                      </View>
                    </SpatialNavigationNode>
                  </View>
                </View>
              </SpatialNavigationNode>
            </View>

            <View style={styles.addonsSection}>
              <Text style={styles.sectionTitle}>Installed Addons ({installedAddons.length})</Text>

              {installedAddons.length > 0 ? (
                <SpatialNavigationScrollView style={styles.addonsList}>
                  {installedAddons.map((addon, index) => (
                    <View key={addon.id} style={styles.addonItemContainer}>
                      {renderAddonItem({ item: addon, index })}
                    </View>
                  ))}
                </SpatialNavigationScrollView>
              ) : (
                <View style={styles.noAddonsContainer}>
                  <Text style={styles.noAddonsText}>No addons installed</Text>
                  <Text style={styles.noAddonsSubText}>Install addons to access content catalogs</Text>
                </View>
              )}
            </View>
          </View>
        </SpatialNavigationNode>
      </View>
    </SpatialNavigationRoot>
  );
}

const useAddonsStyles = function () {
  const { width, height } = Dimensions.get('window');

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000',
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerGradient: {
      paddingTop: scaledPixels(40),
      paddingBottom: scaledPixels(20),
      paddingHorizontal: scaledPixels(40),
    },
    contentContainer: {
      flex: 1,
      paddingHorizontal: scaledPixels(40),
    },
    title: {
      fontSize: scaledPixels(48),
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: scaledPixels(10),
    },
    inputSection: {
      marginBottom: scaledPixels(40),
    },
    addonsSection: {
      flex: 1,
    },
    inputContainer: {
      marginTop: scaledPixels(20),
      flexDirection: 'column',
    },
    inputWrapper: {
      backgroundColor: '#222',
      borderRadius: scaledPixels(5),
      padding: scaledPixels(5),
      marginBottom: scaledPixels(20),
    },
    inputWrapperFocusable: {
      padding: scaledPixels(2),
      borderWidth: scaledPixels(2),
      borderColor: 'transparent',
      borderRadius: scaledPixels(7),
    },
    inputWrapperFocused: {
      borderColor: '#fff',
    },
    input: {
      color: '#fff',
      fontSize: scaledPixels(20),
      padding: scaledPixels(10),
    },
    buttonGroup: {
      marginTop: scaledPixels(10),
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
    },
    actionButton: {
      backgroundColor: '#333',
      paddingVertical: scaledPixels(15),
      paddingHorizontal: scaledPixels(30),
      borderRadius: scaledPixels(5),
      marginRight: scaledPixels(20),
      minWidth: scaledPixels(180),
      alignItems: 'center',
    },
    installButton: {
      backgroundColor: '#1976D2',
    },
    buttonFocused: {
      backgroundColor: '#fff',
      transform: [{ scale: 1.05 }],
    },
    buttonText: {
      color: '#fff',
      fontSize: scaledPixels(20),
      fontWeight: 'bold',
    },
    buttonTextFocused: {
      color: '#000',
    },
    sectionTitle: {
      fontSize: scaledPixels(32),
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: scaledPixels(20),
    },
    addonsList: {
      flex: 1,
    },
    addonItemContainer: {
      marginBottom: scaledPixels(15),
    },
    addonItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#222',
      padding: scaledPixels(20),
      borderRadius: scaledPixels(10),
    },
    addonInfo: {
      flex: 1,
      paddingRight: scaledPixels(20),
    },
    addonName: {
      fontSize: scaledPixels(24),
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: scaledPixels(10),
    },
    addonDescription: {
      fontSize: scaledPixels(18),
      color: '#ccc',
      marginBottom: scaledPixels(15),
    },
    addonMetaContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    addonVersion: {
      fontSize: scaledPixels(16),
      color: '#999',
    },
    addonTypes: {
      fontSize: scaledPixels(16),
      color: '#999',
    },
    uninstallButton: {
      backgroundColor: '#D32F2F',
      paddingVertical: scaledPixels(15),
      paddingHorizontal: scaledPixels(30),
      borderRadius: scaledPixels(5),
      minWidth: scaledPixels(160),
      alignItems: 'center',
    },
    noAddonsContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: scaledPixels(60),
    },
    noAddonsText: {
      fontSize: scaledPixels(28),
      color: '#fff',
      fontWeight: 'bold',
      marginBottom: scaledPixels(10),
    },
    noAddonsSubText: {
      fontSize: scaledPixels(20),
      color: '#999',
    },
  });
};
