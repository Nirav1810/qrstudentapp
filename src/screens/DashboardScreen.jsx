import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const DashboardScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, Student!</Text>
      <Text style={styles.subtitle}>Ready to mark your attendance?</Text>
      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => navigation.navigate('Scanner')}>
        <Text style={styles.buttonText}>Scan QR to Mark Attendance</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 40,
        textAlign: 'center',
    },
    scanButton: {
        backgroundColor: '#3182ce',
        paddingVertical: 20,
        paddingHorizontal: 40,
        borderRadius: 12,
        elevation: 3, // for Android shadow
        shadowColor: '#000', // for iOS shadow
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    }
});

export default DashboardScreen;