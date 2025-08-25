import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, Modal, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Button } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';

const FaceLivelinessScreen = ({ onComplete, onCancel, qrToken }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraRef, setCameraRef] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAction, setCurrentAction] = useState('');
  const [actionCompleted, setActionCompleted] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Possible actions for liveliness check
  const livelinessActions = [
    'Blink your eyes',
    'Smile',
    'Turn your head slightly to the left',
    'Turn your head slightly to the right'
  ];

  // Request camera permission on component mount
  useEffect(() => {
    (async () => {
      if (!permission?.granted) {
        await requestPermission();
      }
    })();
  }, [permission]);

  // Start the liveliness check process
  const startLivelinessCheck = () => {
    setIsProcessing(true);
    // Select a random action
    const randomAction = livelinessActions[Math.floor(Math.random() * livelinessActions.length)];
    setCurrentAction(randomAction);
    setActionCompleted(false);
  };

  // Simulate action detection
  useEffect(() => {
    if (isProcessing && currentAction && !actionCompleted && cameraRef) {
      // Set a timeout to simulate action detection
      const timer = setTimeout(() => {
        setActionCompleted(true);
        // Wait a moment after action completion before capturing
        setTimeout(() => {
          captureImage();
        }, 1000);
      }, 3000); // Give user 3 seconds to perform the action
      
      return () => clearTimeout(timer);
    }
  }, [isProcessing, currentAction, actionCompleted, cameraRef]);

  // Capture the image after liveliness check
  const captureImage = async () => {
    if (cameraRef) {
      try {
        const photo = await cameraRef.takePictureAsync({
          quality: 0.8,
          skipProcessing: true,
        });
        setCapturedImage(photo.uri);
        setIsVerifying(true);
        // Send image to API for verification
        verifyFace(photo.uri);
      } catch (error) {
        console.error('Error capturing image:', error);
        Alert.alert('Error', 'Failed to capture image. Please try again.');
        resetProcess();
      }
    }
  };

  // Send image to API for face verification
  const verifyFace = async (imageUri) => {
    try {
      // Get the authentication token
      const token = await AsyncStorage.getItem('userToken');
      
      // Create a FormData object to send the image
      const formData = new FormData();
      formData.append('faceImage', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'face.jpg',
      });
      formData.append('qrToken', qrToken);
      
      // Send to your API
      const response = await apiClient.post('/attendance/verify-face', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      
      setIsVerifying(false);
      setVerificationResult(response.data.verified);
      setShowResult(true);
    } catch (error) {
      console.error('Verification error:', error);
      setIsVerifying(false);
      setVerificationResult(false);
      setShowResult(true);
    }
  };

  // Reset the process to try again
  const resetProcess = () => {
    setIsProcessing(false);
    setCurrentAction('');
    setActionCompleted(false);
    setCapturedImage(null);
    setShowResult(false);
    setVerificationResult(null);
    setIsVerifying(false);
  };

  // Handle the result modal close
  const handleCloseResult = () => {
    setShowResult(false);
    onComplete(verificationResult);
  };

  // Handle cancellation
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  if (!permission) {
    return <View style={styles.container}><Text>Requesting camera permission...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text>No access to camera</Text>
        <Button mode="contained" onPress={handleCancel} style={styles.button}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={ref => setCameraRef(ref)}
        style={styles.camera}
        facing="front"
      />

      <View style={styles.overlay}>
        {!isProcessing ? (
          <View style={styles.instructionsContainer}>
            <Text style={styles.title}>Face Verification</Text>
            <Text style={styles.instructions}>
              We need to verify your identity with a quick face scan.
            </Text>
            <Text style={styles.instructions}>
              You'll be asked to perform a simple action to confirm you're a live person.
            </Text>
            <Button 
              mode="contained" 
              onPress={startLivelinessCheck}
              style={styles.button}
            >
              Start Verification
            </Button>
            <Button 
              mode="outlined" 
              onPress={handleCancel}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
          </View>
        ) : (
          <View style={styles.actionContainer}>
            <Text style={styles.actionTitle}>Please:</Text>
            <Text style={styles.actionText}>{currentAction}</Text>
            {actionCompleted ? (
              <Text style={styles.completedText}>Action completed! Capturing image...</Text>
            ) : (
              <ActivityIndicator size="large" color="#ffffff" style={styles.loader} />
            )}
          </View>
        )}
      </View>

      {/* Result Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showResult}
        onRequestClose={handleCloseResult}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={[
              styles.modalTitle,
              { color: verificationResult ? '#4CAF50' : '#F44336' }
            ]}>
              {verificationResult ? 'Verification Successful' : 'Verification Failed'}
            </Text>
            <Text style={styles.modalMessage}>
              {verificationResult 
                ? 'Your identity has been verified successfully.' 
                : 'We could not verify your identity. Please try again.'}
            </Text>
            <Button 
              mode="contained" 
              onPress={handleCloseResult}
              style={styles.modalButton}
            >
              {verificationResult ? 'Continue' : 'Try Again'}
            </Button>
          </View>
        </View>
      </Modal>

      {/* Verification Loading Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isVerifying}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={styles.verifyingText}>Verifying your identity...</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  instructions: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  button: {
    marginTop: 20,
    width: '100%',
  },
  cancelButton: {
    marginTop: 10,
    width: '100%',
  },
  actionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  actionText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  completedText: {
    fontSize: 16,
    color: 'green',
    fontWeight: 'bold',
  },
  loader: {
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    width: '100%',
  },
  verifyingText: {
    fontSize: 16,
    marginTop: 15,
    textAlign: 'center',
  },
});

export default FaceLivelinessScreen;