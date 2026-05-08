import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import MapView, { PROVIDER_GOOGLE, type Region } from "react-native-maps";
import * as Location from "expo-location";
import { router } from "expo-router";
import { MapPin, Navigation, Search, X } from "lucide-react-native";

import { GOOGLE_MAPS_KEY } from "../../src/config";
import { mapResultStore } from "../../src/stores/mapResult";
import { Button } from "../../src/components/Button";
import { colors, radius, shadows, spacing, typography } from "../../src/theme";

const DEFAULT_REGION: Region = {
  latitude: -34.6037,
  longitude: -58.3816,
  latitudeDelta: 0.012,
  longitudeDelta: 0.012,
};

export default function MapPickerScreen() {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [address, setAddress] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [reversing, setReversing] = useState(false);
  const reverseDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    moveToCurrentLocation();
  }, []);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setReversing(true);
    try {
      const resp = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_KEY}&language=es`,
      );
      const data = await resp.json();
      if (data.results?.[0]) {
        setAddress(data.results[0].formatted_address);
      } else {
        setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }
    } catch {
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    } finally {
      setReversing(false);
    }
  }, []);

  const moveToCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const next: Region = {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      latitudeDelta: 0.012,
      longitudeDelta: 0.012,
    };
    setRegion(next);
    mapRef.current?.animateToRegion(next, 600);
    reverseGeocode(next.latitude, next.longitude);
  };

  const handleRegionChangeComplete = (next: Region) => {
    setRegion(next);
    if (reverseDebounce.current) clearTimeout(reverseDebounce.current);
    reverseDebounce.current = setTimeout(() => {
      reverseGeocode(next.latitude, next.longitude);
    }, 600);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const resp = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchQuery)}&key=${GOOGLE_MAPS_KEY}&language=es`,
      );
      const data = await resp.json();
      if (data.results?.[0]) {
        const loc = data.results[0].geometry.location;
        const next: Region = {
          latitude: loc.lat,
          longitude: loc.lng,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        };
        setRegion(next);
        mapRef.current?.animateToRegion(next, 600);
        setAddress(data.results[0].formatted_address);
        setSearchQuery("");
      } else {
        Alert.alert("Sin resultados", "No encontramos esa dirección. Intentá con otra búsqueda.");
      }
    } catch {
      Alert.alert("Error", "No se pudo buscar la dirección.");
    } finally {
      setSearching(false);
    }
  };

  const handleConfirm = () => {
    mapResultStore.set({ lat: region.latitude, lng: region.longitude, address });
    router.back();
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={DEFAULT_REGION}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation
        showsMyLocationButton={false}
      />

      {/* Fixed center pin — tip points to map center */}
      <View style={styles.pinLayer} pointerEvents="none">
        <View style={styles.pinWrapper}>
          <MapPin color={colors.brandRed} fill={colors.redSoft} size={40} strokeWidth={2} />
          <View style={styles.pinShadow} />
        </View>
      </View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Search color={colors.muted} size={18} strokeWidth={2.2} />
        <TextInput
          returnKeyType="search"
          placeholder="Buscar dirección..."
          placeholderTextColor={colors.placeholder}
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
        {searching ? (
          <ActivityIndicator color={colors.brandRed} size="small" />
        ) : searchQuery.length > 0 ? (
          <Pressable hitSlop={10} onPress={() => setSearchQuery("")}>
            <X color={colors.muted} size={16} />
          </Pressable>
        ) : null}
      </View>

      {/* GPS button */}
      <Pressable
        accessibilityLabel="Ir a mi ubicación"
        style={({ pressed }) => [styles.gpsButton, pressed && styles.gpsButtonPressed]}
        onPress={moveToCurrentLocation}
      >
        <Navigation color={colors.brandRed} size={22} strokeWidth={2.4} />
      </Pressable>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.addressRow}>
          <MapPin color={colors.brandRed} size={16} strokeWidth={2.4} />
          {reversing ? (
            <ActivityIndicator color={colors.brandRed} size="small" style={styles.spinner} />
          ) : (
            <Text numberOfLines={2} style={styles.addressText}>
              {address || "Mové el mapa para seleccionar una ubicación"}
            </Text>
          )}
        </View>
        <Text style={styles.coordsText}>
          {region.latitude.toFixed(6)}, {region.longitude.toFixed(6)}
        </Text>
        <Button icon={MapPin} title="Confirmar ubicación" onPress={handleConfirm} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  pinLayer: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  pinWrapper: {
    alignItems: "center",
    // shift up by half icon height so the tip points to map center
    transform: [{ translateY: -20 }],
  },
  pinShadow: {
    backgroundColor: "rgba(0,0,0,0.18)",
    borderRadius: 4,
    height: 6,
    marginTop: -2,
    width: 10,
  },
  searchBar: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing.sm,
    left: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    position: "absolute",
    right: spacing.md,
    top: spacing.lg,
    ...shadows.md,
  },
  searchInput: {
    ...typography.body,
    color: colors.ink,
    flex: 1,
    paddingVertical: 0,
  },
  gpsButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    bottom: 248,
    height: 50,
    justifyContent: "center",
    position: "absolute",
    right: spacing.md,
    width: 50,
    ...shadows.md,
  },
  gpsButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.94 }],
  },
  footer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    bottom: 0,
    gap: spacing.sm,
    left: 0,
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    position: "absolute",
    right: 0,
    ...shadows.lg,
  },
  addressRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.xs,
  },
  addressText: {
    ...typography.bodyStrong,
    color: colors.ink,
    flex: 1,
  },
  coordsText: {
    ...typography.caption,
    color: colors.muted,
  },
  spinner: {
    flex: 1,
  },
});
