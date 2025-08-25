import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Text, TouchableOpacity, Button, Modal } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';
import FaceLivelinessScreen from './FaceLivelinessScreen';

const ScannerScreen = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [showFaceVerification, setShowFaceVerification] = useState(false);
  const [qrToken, setQrToken] = useState(null);
  const [courseId] = useState('CS101'); // Hardcoded for now
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const handleBarCodeScanned = async (scanningResult) => {
    if (scanned || isProcessing) return;
    
    setScanned(true);
    setIsProcessing(true);
    setQrToken(scanningResult.data);
    
    // Navigate to face verification after scanning
    setShowFaceVerification(true);
  };

  const handleFaceVerificationComplete = async (success) => {
    setShowFaceVerification(false);
    
    if (success) {
      // Face verification successful, now mark attendance
      try {
        const token = await AsyncStorage.getItem('userToken');
        const response = await apiClient.post('/attendance/mark',
          { qrToken: qrToken, courseId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        Alert.alert('Success', response.data.message, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } catch (error) {
        Alert.alert('Error', error.response?.data?.error || 'Failed to mark attendance.', [
          { text: 'Try Again', onPress: () => {
            setScanned(false);
            setIsProcessing(false);
          }},
        ]);
      }
    } else {
      // Face verification failed
      Alert.alert('Verification Failed', 'Face verification failed. Please try again.', [
        { text: 'Try Again', onPress: () => {
          setScanned(false);
          setIsProcessing(false);
        }},
      ]);
    }
  };

  const cancelFaceVerification = () => {
    setShowFaceVerification(false);
    setScanned(false);
    setIsProcessing(false);
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
      {!showFaceVerification ? (
        <>
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
        </>
      ) : null}

      {/* Face Verification Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={showFaceVerification}
        onRequestClose={cancelFaceVerification}
      >
        <FaceLivelinessScreen 
          onComplete={handleFaceVerificationComplete}
          onCancel={cancelFaceVerification}
          qrToken={qrToken}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: 'black' 
  },
  permissionContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'black' 
  },
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