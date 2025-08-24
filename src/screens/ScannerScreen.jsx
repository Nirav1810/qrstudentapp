import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Text, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';

const ScannerScreen = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const handleBarCodeScanned = async (scanningResult: BarcodeScanningResult) => {
    if (scanned) return;
    setScanned(true); // Prevent multiple scans

    try {
      const token = await AsyncStorage.getItem('userToken');
      // For now, let's hardcode a courseId. In a real app, the student would select this.
      const courseId = 'CS101';

      const response = await apiClient.post('/attendance/mark',
        { qrToken: scanningResult.data, courseId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert('Success', response.data.message, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to mark attendance.', [
        { text: 'Try Again', onPress: () => setScanned(false) }, // Allow user to try again
      ]);
    }
  };

  if (!permission) {
    return <View />; // Permissions are still loading
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={{ textAlign: 'center', color: 'white' }}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeTypes={['qr']}
        style={StyleSheet.absoluteFillObject}
      >
        <View style={styles.overlay}>
          <Text style={styles.overlayText}>Scan the QR Code</Text>
          <View style={styles.scanBox} />
        </View>
      </CameraView>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 5,
    position: 'absolute',
    top: 100,
  },
  scanBox: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 10,
  },
  backButton: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    padding: 15,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 10,
  },
  backButtonText: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
  }
});

export default ScannerScreen;