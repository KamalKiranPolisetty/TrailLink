import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, Animated, Share, SafeAreaView, StatusBar, Platform, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const NavigateScreen = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [region, setRegion] = useState(null);
  const [distance, setDistance] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [avgSpeed, setAvgSpeed] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [elevationGain, setElevationGain] = useState(0);
  const [tracking, setTracking] = useState(false);
  const [calories, setCalories] = useState(0);
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  
  const startTime = useRef(null);
  const prevLocation = useRef(null);
  const locationSubscription = useRef(null);
  const trackingInterval = useRef(null);
  const lastSpeedUpdate = useRef(Date.now());
  const movementTimeout = useRef(null);
  const panelAnimation = useRef(new Animated.Value(0)).current;
  const totalMovingTime = useRef(0);
  const lastActiveTime = useRef(null);
  const movingDistanceRef = useRef(0);

  const PANEL_COLLAPSED_HEIGHT = 40;
  const PANEL_EXPANDED_HEIGHT = height * 0.35;

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log("Location permission denied");
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
        setUserLocation(location.coords);
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
      } catch (error) {
        console.error("Error getting location:", error);
      }
    })();

    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
      if (trackingInterval.current) {
        clearInterval(trackingInterval.current);
      }
      if (movementTimeout.current) {
        clearTimeout(movementTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    if (tracking) {
      startTime.current = Date.now() - (elapsedTime * 1000);
      trackingInterval.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime.current) / 1000));
        updateAverageSpeed();

        if (isMoving && Date.now() - lastSpeedUpdate.current > 3000) {
          setIsMoving(false);
          if (lastActiveTime.current) {
            const activeTimePeriod = (Date.now() - lastActiveTime.current) / 1000;
            totalMovingTime.current += activeTimePeriod;
            lastActiveTime.current = null;
          }
        }
      }, 1000);
      startTracking();
    } else {
      if (trackingInterval.current) {
        clearInterval(trackingInterval.current);
      }
      stopTracking();
      setIsMoving(false);
      if (lastActiveTime.current) {
        const activeTimePeriod = (Date.now() - lastActiveTime.current) / 1000;
        totalMovingTime.current += activeTimePeriod;
        lastActiveTime.current = null;
      }
    }
    
    return () => {
      if (trackingInterval.current) {
        clearInterval(trackingInterval.current);
      }
      if (movementTimeout.current) {
        clearTimeout(movementTimeout.current);
      }
    };
  }, [tracking]);

  useEffect(() => {
    if (tracking) {
      if (isMoving && !lastActiveTime.current) {
        lastActiveTime.current = Date.now();
      } else if (!isMoving && lastActiveTime.current) {
        const activeTimePeriod = (Date.now() - lastActiveTime.current) / 1000;
        totalMovingTime.current += activeTimePeriod;
        lastActiveTime.current = null;
      }
    }
  }, [isMoving, tracking]);

  useEffect(() => {
    if (!tracking || !isMoving) return;
    const weight = 70; // kg
    const timeSinceLastUpdate = 1 / 3600; // 1 second in hours
    const currentSpeed = speed > 0 ? speed : 0;
    let met = 0;
    if (currentSpeed < 0.1) met = 0;
    else if (currentSpeed < 2) met = 2.0;
    else if (currentSpeed < 3) met = 2.5;
    else if (currentSpeed < 4) met = 3.5;
    else if (currentSpeed < 5) met = 4.3;
    else if (currentSpeed < 6) met = 6.0;
    else if (currentSpeed < 8) met = 8.3;
    else met = 11.5;
    const calorieIncrement = met * weight * timeSinceLastUpdate;
    if (calorieIncrement > 0) {
      setCalories(prev => prev + calorieIncrement);
    }
  }, [elapsedTime, isMoving, tracking, speed]);

  const startTracking = async () => {
    try {
      locationSubscription.current = await Location.watchPositionAsync(
        { 
          accuracy: Location.Accuracy.BestForNavigation, 
          distanceInterval: 1,
          timeInterval: 1000 
        },
        (location) => {
          setUserLocation(location.coords);
          if (prevLocation.current) {
            const newDistance = getDistance(prevLocation.current, location.coords);
            const currentSpeedMps = location.coords.speed !== null && !isNaN(location.coords.speed) && location.coords.speed >= 0 ? location.coords.speed : 0;
            const currentSpeedMph = currentSpeedMps * 2.237;
            setSpeed(currentSpeedMph);
            const isCurrentlyMoving = (currentSpeedMps > 0.2) || (newDistance > 0.001);
            if (newDistance > 0 && newDistance < 0.05) {
              setDistance(prev => prev + newDistance);
              if (isCurrentlyMoving) {
                movingDistanceRef.current += newDistance;
                setIsMoving(true);
                lastSpeedUpdate.current = Date.now();
                if (movementTimeout.current) {
                  clearTimeout(movementTimeout.current);
                }
                movementTimeout.current = setTimeout(() => {
                  if (Date.now() - lastSpeedUpdate.current > 3000) {
                    setIsMoving(false);
                  }
                }, 3000);
              }
            }
            if (location.coords.altitude !== undefined && prevLocation.current.altitude !== undefined) {
              const elevationChange = location.coords.altitude - prevLocation.current.altitude;
              if (elevationChange > 0.5) {
                setElevationGain((prev) => prev + elevationChange * 3.28084);
              }
            }
          }
          prevLocation.current = {
            ...location.coords,
            timestamp: location.timestamp
          };
          updateAverageSpeed();
        }
      );
    } catch (error) {
      console.error("Error tracking location:", error);
    }
  };

  const updateAverageSpeed = () => {
    let timeToUse;
    if (isMoving && lastActiveTime.current) {
      const currentActivePeriod = (Date.now() - lastActiveTime.current) / 1000;
      timeToUse = (totalMovingTime.current + currentActivePeriod) / 3600;
    } else {
      timeToUse = totalMovingTime.current / 3600;
    }
    if (timeToUse < 0.0003) {
      timeToUse = elapsedTime / 3600;
    }
    if (timeToUse > 0 && distance > 0) {
      const newAvgSpeed = distance / timeToUse;
      setAvgSpeed(newAvgSpeed);
    } 
  };


  useEffect(() => {
    // This will now also depend on `distance` and total moving time to trigger updates
    const intervalId = setInterval(() => {
        if (isMoving) {
            const now = Date.now();
            const deltaTime = (now - lastActiveTime.current) / 1000; // time since last active in seconds
            totalMovingTime.current += deltaTime;
            lastActiveTime.current = now;
            updateAverageSpeed();
        }
    }, 1000); // Update every second

    return () => clearInterval(intervalId);
}, [distance, isMoving]);

useEffect(() => {
    if (!isMoving) {
        updateAverageSpeed(); // Also update when movement stops
    }
}, [isMoving]);

  const stopTracking = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    prevLocation.current = null;
    if (movementTimeout.current) {
      clearTimeout(movementTimeout.current);
    }
  };

  const getDistance = (prev, curr) => {
    const toRad = (angle) => (angle * Math.PI) / 180;
    const R = 6371e3; // Earth radius in meters
    const φ1 = toRad(prev.latitude);
    const φ2 = toRad(curr.latitude);
    const Δφ = toRad(curr.latitude - prev.latitude);
    const Δλ = toRad(curr.longitude - prev.longitude);
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c) / 1609.34;
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const shareLocation = async () => {
    if (!userLocation) return;
    try {
      const locationUrl = `https://maps.google.com/?q=${userLocation.latitude},${userLocation.longitude}`;
      const shareMessage = `Check out my current location: ${locationUrl}`;
      await Share.share({
        message: shareMessage,
        title: 'My Current Location',
      });
    } catch (error) {
      console.error("Error sharing location:", error);
    }
  };

  const resetTracking = () => {
    if (tracking) {
      Alert.alert(
        "Active Tracking",
        "You have an active tracking session. Stop tracking before resetting?",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Stop & Reset", 
            style: "destructive", 
            onPress: () => {
              setTracking(false);
              performReset();
            }
          }
        ]
      );
    } else {
      performReset();
    }
  };

  const performReset = () => {
    setDistance(0);
    setElapsedTime(0);
    setAvgSpeed(0);
    setSpeed(0);
    setElevationGain(0);
    setCalories(0);
    setIsMoving(false);
    startTime.current = null;
    prevLocation.current = null;
    totalMovingTime.current = 0;
    lastActiveTime.current = null;
    movingDistanceRef.current = 0;
  };

  const togglePanel = () => {
    setIsPanelExpanded(!isPanelExpanded);
    Animated.timing(panelAnimation, {
      toValue: isPanelExpanded ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const panelHeight = panelAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [PANEL_COLLAPSED_HEIGHT, PANEL_EXPANDED_HEIGHT],
  });

  const centerOnUser = () => {
    if (userLocation && region) {
      setRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.00922,
        longitudeDelta: 0.00421,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={region => setRegion(region)}
        showsUserLocation={true}
        showsTraffic={true}
        showsPointsOfInterest={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
      >
        {userLocation && (
          <Marker
            coordinate={{ latitude: userLocation.latitude, longitude: userLocation.longitude }}
            title="Your Location"
            description="You are here"
          />
        )}
      </MapView>
      <View style={styles.topButtonsContainer}>
        <TouchableOpacity style={styles.circleButton} onPress={centerOnUser}>
          <Ionicons name="locate" size={24} color="#10ac84" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.circleButton} onPress={shareLocation}>
          <Ionicons name="share-social" size={24} color="#10ac84" />
        </TouchableOpacity>
      </View>
      {tracking && (
        <View style={styles.activityIndicator}>
          <View style={[styles.statusDot, isMoving ? styles.activeStatus : styles.idleStatus]} />
          <Text style={styles.statusText}>{isMoving ? 'Active' : 'Idle'}</Text>
        </View>
      )}
      <Animated.View style={[styles.panel, { height: panelHeight }]}>
        <TouchableOpacity style={styles.panelHandle} onPress={togglePanel}>
          <View style={styles.handleBar} />
        </TouchableOpacity>
        {isPanelExpanded && (
          <>
            <View style={styles.statsContainer}>
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{formatTime(elapsedTime)}</Text>
                <Text style={styles.statLabel}>Time</Text>
              </View>
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{distance.toFixed(2)} mi</Text>
                <Text style={styles.statLabel}>Distance</Text>
              </View>
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{elevationGain.toFixed(0)} ft</Text>
                <Text style={styles.statLabel}>Elev. gain</Text>
              </View>
            </View>
            <View style={styles.statsContainer}>
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{calories.toFixed(0)}</Text>
                <Text style={styles.statLabel}>Calories</Text>
              </View>
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{avgSpeed.toFixed(1)} mph</Text>
                <Text style={styles.statLabel}>Avg Speed</Text>
              </View>
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{speed.toFixed(1)} mph</Text>
                <Text style={styles.statLabel}>Current</Text>
              </View>
            </View>
            <View style={styles.buttonsContainer}>
              <TouchableOpacity style={[styles.button, styles.resetButton]} onPress={resetTracking}>
                <Ionicons name="refresh" size={18} color="white" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, tracking ? styles.stopButton : styles.startButton]} onPress={() => setTracking(!tracking)}>
                <Ionicons name={tracking ? "stop-circle" : "play"} size={18} color="white" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>{tracking ? 'Stop' : 'Start'}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
    zIndex: 1,
  },
  topButtonsContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 20,
    zIndex: 2,
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  activityIndicator: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    zIndex: 2,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  activeStatus: {
    backgroundColor: '#10ac84',
  },
  idleStatus: {
    backgroundColor: '#f9ca24',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  panel: {
    backgroundColor: '#1f1e1e',
    position: 'absolute',
    bottom: 0,
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 15,
    paddingBottom: Platform.OS === 'ios' ? 25 : 15,
    zIndex: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  panelHandle: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 20,
  },
  handleBar: {
    width: 40,
    height: 5,
    backgroundColor: '#ccc',
    borderRadius: 3,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingHorizontal: 5,
    marginTop: 10,
  },
  statBlock: {
    width: '33%',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    color: 'white',
    opacity: 0.75,
    marginTop: 3,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#2a2929',
    padding: Platform.OS === 'ios' ? 12 : 10,
    borderRadius: 20,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 5,
  },
  startButton: {
    backgroundColor: '#10ac84',
  },
  stopButton: {
    backgroundColor: '#ee5253',
  },
  resetButton: {
    backgroundColor: '#3182CE',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NavigateScreen;
