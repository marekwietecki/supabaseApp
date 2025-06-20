import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button, TextInput, Platform, Linking } from 'react-native';
import * as Location from 'expo-location';
import supabase from '../../../lib/supabase-client';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

export default function LocationScreen() {
    const [location, setLocation] = useState(null);
    const [address, setAddress] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [manualAddress, setManualAddress] = useState('');
    const [nearestTask, setNearestTask] = useState(null);
    const mapRef = useRef(null);
  

    const toRad = (value) => (value * Math.PI) / 180;

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const findNearestTask = async (coords) => {
        const { data: tasks, error } = await supabase
            .from('tasks')
            .select('id, name, place, latitude, longitude');

        if (error || !tasks) {
            console.error('Błąd pobierania zadań:', error);
            return null;
        }

        const filtered = tasks.filter((t) => t.latitude && t.longitude);
        if (filtered.length === 0) return null;

        let nearest = null;
        let minDist = Infinity;

        for (const task of filtered) {
            const dist = calculateDistance(
                coords.latitude,
                coords.longitude,
                task.latitude,
                task.longitude
            );
            if (dist < minDist) {
                minDist = dist;
                nearest = { ...task, distance: dist };
            }
        }

        return nearest;
    };

    
    const requestLocation = async () => {
        setIsLoading(true);
        setErrorMsg(null);

        try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            setErrorMsg('Nie przyznano uprawnień do lokalizacji');
            setIsLoading(false);
            return;
        }

            const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
                mayShowUserSettingsDialog: true,
            });
            console.log("Pobrana lokalizacja:", loc.coords);
            setLocation(loc);

            // Szukamy najbliższego taska
            const nearest = await findNearestTask(loc.coords);
            console.log('Najbliższe zadanie:', nearest);
            setNearestTask(nearest);


            const reverseGeocode = await Location.reverseGeocodeAsync(loc.coords);
            console.log("Reverse geocode:", reverseGeocode);
            if (reverseGeocode && reverseGeocode.length > 0) {
                setAddress(reverseGeocode[0]);
            }
            } catch (err) {
            setErrorMsg(`Błąd lokalizacji: ${err.message}`);
            } finally {
            setIsLoading(false);
        }
    };

    const geocodeAddress = async () => {
        if (!manualAddress.trim()) return;
        setIsLoading(true);
        setErrorMsg(null);
        try {
            const results = await Location.geocodeAsync(manualAddress);
            if (results.length > 0) {
                const coords = results[0];
                console.log("Wynik geocode:", coords);
                // Utwórz obiekt nowej lokalizacji
                const newLocation = {
                    coords: {
                        latitude: coords.latitude,
                        longitude: coords.longitude,
                    }
                };
                // Ustaw nową lokalizację w stanie
                setLocation(newLocation);
                // Pobierz dane adresowe
                const reverse = await Location.reverseGeocodeAsync(newLocation.coords);
                if (reverse.length > 0) setAddress(reverse[0]);
                // Przelicz najbliższe zadanie na podstawie nowej lokalizacji
                const nearest = await findNearestTask(newLocation.coords);
                console.log('Najbliższe zadanie:', nearest);
                setNearestTask(nearest);
            } else {
                setErrorMsg('Nie znaleziono podanego adresu');
            }
        } catch (error) {
            setErrorMsg(`Błąd geocode: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    

    const openInMaps = () => {
        if (
          nearestTask &&
          typeof nearestTask.latitude === 'number' &&
          typeof nearestTask.longitude === 'number'
        ) {
          const lat = nearestTask.latitude;
          const lon = nearestTask.longitude;
          // Używamy nazwy miejsca lub nazwy zadania jako etykiety
          const label = nearestTask.place || nearestTask.name || "Task Location";
          const url = Platform.select({
            ios: `http://maps.apple.com/?ll=${lat},${lon}&q=${label}`,
            android: `geo:${lat},${lon}?q=${lat},${lon}(${label})`,
          });
          Linking.openURL(url);
        } else {
          console.warn('Brak współrzędnych zadania do otwarcia mapy');
        }
    };
      

    useEffect(() => {
        requestLocation();
    }, []);

    useEffect(() => {
        if (
          location &&
          location.coords &&
          nearestTask &&
          nearestTask.latitude &&
          nearestTask.longitude &&
          mapRef.current
        ) {
          const coordinates = [
            { latitude: location.coords.latitude, longitude: location.coords.longitude },
            { latitude: nearestTask.latitude, longitude: nearestTask.longitude }
          ];
          // Małe opóźnienie, aby mieć pewność, że markery są już w drzewie komponentów
          setTimeout(() => {
            mapRef.current.fitToCoordinates(coordinates, {
              edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
              animated: true,
            });
          }, 500);
        }
      }, [location, nearestTask]);
      

    return (
        <View style={styles.container}>
            {isLoading ? (
                <ActivityIndicator size="large" color="#2196F3" />
            ) : errorMsg ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{errorMsg}</Text>
                    <Button title="Spróbuj ponownie" onPress={requestLocation} color="#2196F3" />
                </View>
            ) : (
                <View style={styles.locationContainer}>
                {address && (
                    <Text style={styles.text}>
                    {address.city || address.subregion || address.region}, {address.country}
                    </Text>
                )}
                
                <View style={{ marginVertical: 8 }}>
                    <Button title="Odśwież lokalizację" onPress={requestLocation} color="#2196F3" />
                </View>
                <TextInput
                    style={styles.input}
                    placeholder="Wpisz adres (np. Warszawa)"
                    value={manualAddress}
                    onChangeText={setManualAddress}
                />
                <Button title="Zamień adres na lokalizację" onPress={geocodeAddress} color="#4CAF50" />
                
                {nearestTask && (
                    <View style={{ marginTop: 12 }}>
                        <Text style={styles.text}>
                            📍 Najbliższe zadanie: {nearestTask.name}
                        </Text>
                        <Text style={styles.text}>
                            Lokalizacja: {nearestTask.place}
                        </Text>
                        <Text style={styles.text}>
                            Odległość: {nearestTask.distance.toFixed(2)} km
                        </Text>
                    </View>
                )}

                <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
                onMapReady={() => {
                    if (
                    location &&
                    location.coords &&
                    nearestTask &&
                    nearestTask.latitude &&
                    nearestTask.longitude
                    ) {
                    const coordinates = [
                        {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        },
                        {
                        latitude: nearestTask.latitude,
                        longitude: nearestTask.longitude,
                        },
                    ];
                    mapRef.current.fitToCoordinates(coordinates, {
                        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                        animated: true,
                    });
                    }
                }}
                >
                {/* Twoje Markery */}
                <Marker
                    coordinate={{
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    }}
                    title="Twoja lokalizacja"
                />
                {nearestTask && nearestTask.latitude && nearestTask.longitude && (
                    <Marker
                    coordinate={{
                        latitude: nearestTask.latitude,
                        longitude: nearestTask.longitude,
                    }}
                    title="Najbliższe zadanie"
                    description={nearestTask.place}
                    pinColor="blue"
                    />
                )}
                </MapView>

                <View style={{ marginVertical: 8 }}>
                    <Button title="Otwórz w mapach" onPress={openInMaps} color="#FF5722" />
                </View>
                </View>
            )}
        </View>
    );
}      

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  locationContainer: {
    alignItems: 'center',
    width: '100%',
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    marginVertical: 12,
    width: '100%',
  },
  text: {
    fontSize: 18,
    color: 'black',
    marginVertical: 4,
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 12,
  },
  map: {
    width: '100%',
    height: 300,
    borderRadius: 24,
  },
});
