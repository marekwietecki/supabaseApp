import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button, TextInput, Platform, Linking, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import * as Location from 'expo-location';
import supabase from '../../../lib/supabase-client';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { FontAwesome } from '@expo/vector-icons';

export default function LocationScreen() {
    const [location, setLocation] = useState(null);
    const [address, setAddress] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [manualAddress, setManualAddress] = useState('');
    const [nearestTask, setNearestTask] = useState(null);
    const [showManualInput, setShowManualInput] = useState(false);

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
                setLocation(newLocation);
                // Pobierz dane adresowe
                const reverse = await Location.reverseGeocodeAsync(newLocation.coords);
                if (reverse.length > 0) setAddress(reverse[0]);
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
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: 'Lokalizacja',
                    headerLeft: () => null,
                    headerBackVisible: false,
                }}
            />
            {isLoading ? (
                <ActivityIndicator size="large" color="#2196F3" />
            ) : errorMsg ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{errorMsg}</Text>
                    <Button title="Spróbuj ponownie" onPress={requestLocation} color="#2196F3" />
                </View>
            ) : (
                <View>    
                    <View style={{ marginVertical: 8, flexDirection: 'row', justifyContent: 'center', alignContent: 'center', gap: 4 }}>
                        {address && (
                            <Text style={styles.mainText}>
                                📍 {address.city || address.subregion || address.region}, {address.country}
                            </Text>
                        )}
                        <TouchableOpacity onPress={requestLocation} color="#2196F3" style={{flexDirection: 'row', alignSelf: 'center', padding: 8}}>
                            <FontAwesome
                                name="rotate-left"
                                size={18}
                                color="black"
                                style={styles.itemIcon}
                            />                   
                        </TouchableOpacity> 
                        <TouchableOpacity onPress={() => setShowManualInput((prev) => !prev)} style={{ padding: 8, marginLeft: 8 }}>
                            {showManualInput ? (
                                <FontAwesome name="chevron-up" size={18} color="black" />
                            ) : (
                                <FontAwesome name="pencil" size={18} color="black" />
                            )}
                        </TouchableOpacity>
                    </View>
                    {showManualInput && (
                    <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', borderRadius: 32, borderWidth: 2, borderColor: '#ccc', }}>
                        <TextInput
                            style={styles.input}
                            placeholder="Wpisz Lokalizację"
                            value={manualAddress}
                            onChangeText={setManualAddress}
                        />
                        <TouchableOpacity onPress={() => {geocodeAddress(); setShowManualInput(false)}} style={{ paddingHorizontal: 16, justifyContent: 'center' }}>
                            <FontAwesome name="check" size={24} color='#ccc' style={[styles.itemIcon, {}]} />
                        </TouchableOpacity>
                    </View>
                    )}
                </View>
            )}  
                {nearestTask && (
                    <View style={{ marginBottom: 12, marginTop: 32 }}>
                        <Text style={styles.midText}>
                            Najbliższe zadanie: 
                        </Text>
                        <Text style={styles.text}>
                            {nearestTask.name}
                        </Text>
                        <View style={{flexDirection: 'row', width: '84%', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'center', paddingTop: 12, paddingHorizontal: '4%',}}>
                            <View style={{flexDirection: 'column', width: '40%', gap: 8 }}>     
                                <Text style={styles.text}>
                                    🛣️
                                </Text>
                                <Text style={styles.text}>
                                    {nearestTask.distance.toFixed(1).replace('.', ',')} km
                                </Text>
                            </View>
                            <View style={{flexDirection: 'column', width: '40%', gap: 8 }}>    
                                <Text style={styles.text}>
                                {' '}🎯
                                </Text>
                                <Text style={styles.text}>
                                {nearestTask.place}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {location && location.coords && (
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
                    <Marker
                        coordinate={{
                            latitude: location.coords.latitude,
                            longitude: location.coords.longitude,
                        }}
                        title="Twoja lokalizacja"
                    />
                </MapView>
                )}

                <View style={{ marginVertical: 8 }}>
                    <TouchableOpacity onPress={openInMaps} style={styles.button}>
                        <Text style={styles.buttonText}>Nawiguj do zadania</Text>
                    </TouchableOpacity>
                </View>
            </View>
    );
}      

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: '6%',
  },
  locationContainer: {
    alignItems: 'center',
    width: '100%',
  },
  input: {
    padding: 16,
    marginVertical: 6,
    borderRadius: 24,
    color: 'black',
    paddingVertical: 6,
    paddingHorizontal: 16,
    fontSize: 16,
    flex: 1,
  },
  text: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
    fontWeight: '500',
  },
  mainText: {
    fontSize: 24,
    color: 'black',
    marginVertical: 4,
    textAlign: 'center',
    fontWeight: '600',
  },
  midText: {
    fontSize: 16,
    color: 'black',
    textAlign: 'center',
    fontWeight: '600',
    paddingBottom: 4,
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
  button: {
    borderRadius: 36,
    backgroundColor: '#2196F3',
    paddingHorizontal: 38,
    paddingVertical: 14,
    marginTop: 12,
    alignItems: 'center',
    maxWidth: '70%',
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 700,
  },
});
