import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, Region, PROVIDER_DEFAULT } from 'react-native-maps';
import Supercluster from 'supercluster';
import { NearbyUser } from '../types';

interface MapViewComponentProps {
  userLocation: { latitude: number; longitude: number } | null;
  nearbyUsers: NearbyUser[];
  onClusterPress: (users: NearbyUser[]) => void;
}

const INITIAL_REGION = {
  latitude: 37.78825,
  longitude: -122.4324,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export default function MapViewComponent({
  userLocation,
  nearbyUsers,
  onClusterPress,
}: MapViewComponentProps) {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>(INITIAL_REGION);
  const [clusters, setClusters] = useState<any[]>([]);
  const clusterEngine = useRef<Supercluster>();

  // Initialize supercluster
  useEffect(() => {
    const points = nearbyUsers.map((user) => ({
      type: 'Feature' as const,
      properties: { cluster: false, user },
      geometry: {
        type: 'Point' as const,
        coordinates: [user.longitude, user.latitude],
      },
    }));

    clusterEngine.current = new Supercluster({
      radius: 60,
      maxZoom: 16,
    });

    clusterEngine.current.load(points);
    updateClusters();
  }, [nearbyUsers]);

  // Update clusters when region changes
  const updateClusters = () => {
    if (!clusterEngine.current) return;

    const bbox = [
      region.longitude - region.longitudeDelta / 2,
      region.latitude - region.latitudeDelta / 2,
      region.longitude + region.longitudeDelta / 2,
      region.latitude + region.latitudeDelta / 2,
    ] as [number, number, number, number];

    const zoom = Math.log2(360 / region.longitudeDelta);
    const newClusters = clusterEngine.current.getClusters(bbox, Math.floor(zoom));
    setClusters(newClusters);
  };

  useEffect(() => {
    updateClusters();
  }, [region]);

  // Center map on user location when it becomes available
  useEffect(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [userLocation]);

  const handleClusterPress = (cluster: any) => {
    if (!clusterEngine.current) return;

    const clusterId = cluster.properties.cluster_id;
    const leaves = clusterEngine.current.getLeaves(clusterId, Infinity);
    const users = leaves.map((leaf: any) => leaf.properties.user);
    onClusterPress(users);
  };

  const getMarkerColor = (distanceMeters: number) => {
    if (distanceMeters < 100) return '#22c55e'; // green - very close
    if (distanceMeters < 500) return '#FFB000'; // amber - close
    if (distanceMeters < 1000) return '#f97316'; // orange - medium
    return '#ef4444'; // red - far
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={userLocation ? {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        } : INITIAL_REGION}
        onRegionChangeComplete={setRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {clusters.map((cluster) => {
          const [longitude, latitude] = cluster.geometry.coordinates;
          const { cluster: isCluster, point_count, user } = cluster.properties;

          if (isCluster) {
            return (
              <Marker
                key={`cluster-${cluster.id}`}
                coordinate={{ latitude, longitude }}
                onPress={() => handleClusterPress(cluster)}
              >
                <View style={styles.clusterMarker}>
                  <View style={styles.clusterInner}>
                    <View style={styles.clusterText}>
                      {/* Using plain View as Text equivalent */}
                    </View>
                  </View>
                </View>
              </Marker>
            );
          }

          return (
            <Marker
              key={`user-${user.id}`}
              coordinate={{ latitude, longitude }}
              pinColor={getMarkerColor(user.distanceMeters)}
            />
          );
        })}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  clusterMarker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFB000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  clusterInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clusterText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
});
