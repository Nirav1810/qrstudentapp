import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Modal, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Button } from 'react-native-paper';
import apiClient from '../api/client';

const RegisterScreen = ({ navigation }) => {
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [cameraRef, setCameraRef] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [registrationStep, setRegistrationStep] = useState(1); // 1: form, 2: camera

  const handleRegister = async () => {
    if (!studentId || !name || !password) {
      Alert.alert('Error', 'Please fill out all fields.');
      return;
    }
    
    try {
      // First register the account using your existing endpoint
      await apiClient.post('/students/register', { studentId, name, password });
      
      // Then proceed to face registration
      setRegistrationStep(2);
    } catch (error) {
      Alert.alert('Registration Failed', error.response?.data?.message || 'An error occurred.');
    }
  };

  const requestCameraPermission = async () => {
    if (!permission?.granted) {
      await requestPermission();
    }
    
    if (permission?.granted) {
      setShowCamera(true);
    } else {
      Alert.alert('Permission Required', 'Camera permission is needed for face registration.');
    }
  };

  const captureSelfie = async () => {
    if (cameraRef) {
      try {
        setIsUploading(true);
        const photo = await cameraRef.takePictureAsync({
          quality: 0.8,
          skipProcessing: true,
        });
        
        // Upload the face image to your backend
        const formData = new FormData();
        formData.append('faceImage', {
          uri: photo.uri,
          type: 'image/jpeg',
          name: 'face.jpg',
        });
        formData.append('studentId', studentId);
        
        await apiClient.post('/students/register-face', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        setIsUploading(false);
        setShowCamera(false);
        
        Alert.alert('Success', 'Registration successful! Please log in.', [
          { text: 'OK', onPress: () => navigation.navigate('Login') },
        ]);
      } catch (error) {
        setIsUploading(false);
        console.error('Error capturing/uploading selfie:', error);
        Alert.alert('Error', 'Failed to capture selfie. Please try again.');
      }
    }
  };

  const cancelCamera = () => {
    setShowCamera(false);
  };

  if (!permission) {
    return <View style={styles.container}><Text>Loading camera permissions...</Text></View>;
  }

  return (
    <View style={styles.container}>
      {registrationStep === 1 ? (
        <>
          <Text style={styles.title}>Create Account</Text>
          <TextInput
            style={styles.input}
            placeholder="Student ID"
            value={studentId}
            onChangeText={setStudentId}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity style={styles.button} onPress={handleRegister}>
            <Text style={styles.buttonText}>Register</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkText}>Already have an account? Login</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.cameraContainer}>
          <Text style={styles.cameraTitle}>Face Registration</Text>
          <Text style={styles.cameraInstructions}>
            Please take a well-lit selfie for face recognition
          </Text>
          <Text style={styles.lightingTip}>
            💡 Tip: Face a light source for better results
          </Text>
          
          <TouchableOpacity 
            style={styles.cameraButton} 
            onPress={requestCameraPermission}
          >
            <Text style={styles.cameraButtonText}>Open Camera</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Camera Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={showCamera}
        onRequestClose={cancelCamera}
      >
        <View style={styles.cameraModal}>
          <CameraView
            ref={ref => setCameraRef(ref)}
            style={StyleSheet.absoluteFillObject}
            facing="front"
          />
          
          <View style={styles.cameraOverlay}>
            <Text style={styles.cameraGuideText}>
              Position your face in the center
            </Text>
            
            <View style={styles.faceOutline} />
            
            <TouchableOpacity 
              style={styles.captureButton} 
              onPress={captureSelfie}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.captureButtonText}>Capture</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.cancelButton} onPress={cancelCamera}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkText: {
    color: '#007bff',
    textAlign: 'center',
    marginTop: 20,
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cameraTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  cameraInstructions: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  lightingTip: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  cameraButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    width: '80%',
  },
  cameraButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cameraModal: {
    flex: 1,
    backgroundColor: 'black',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  cameraGuideText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  faceOutline: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 100,
    marginBottom: 30,
  },
  captureButton: {
    backgroundColor: '#28a745',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  captureButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 10,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default RegisterScreen;