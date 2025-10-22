import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { StyleSheet } from 'react-native';

const ARScanInstructions = ({ visible, onClose, onStartScan }) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Icon name="scan" size={32} color="#FF8B47" />
            </View>
            <Text style={styles.title}>AR Product Scanner</Text>
            <Text style={styles.subtitle}>Create a 3D model of your product</Text>
          </View>

          {/* Instructions */}
          <ScrollView style={styles.instructionsContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>📱 How to Scan Your Product</Text>
            
            <View style={styles.instructionStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Prepare Your Product</Text>
                <Text style={styles.stepDescription}>
                  Place your product on a flat, well-lit surface with good contrast. 
                  Ensure there's enough space to move around it.
                </Text>
              </View>
            </View>

            <View style={styles.instructionStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Position in Frame</Text>
                <Text style={styles.stepDescription}>
                  Center your product in the scanning frame. The entire product 
                  should be visible within the orange border.
                </Text>
              </View>
            </View>

            <View style={styles.instructionStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Start Scanning</Text>
                <Text style={styles.stepDescription}>
                  Tap "Start Scan" and slowly move your device around the product. 
                  The scanner will capture 60 frames from different angles.
                </Text>
              </View>
            </View>

            <View style={styles.instructionStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Processing</Text>
                <Text style={styles.stepDescription}>
                  Wait for the 3D model to be processed. This creates an AR-ready 
                  model that customers can view in their own space.
                </Text>
              </View>
            </View>

            {/* Tips Section */}
            <View style={styles.tipsSection}>
              <Text style={styles.sectionTitle}>💡 Pro Tips</Text>
              
              <View style={styles.tip}>
                <Icon name="bulb" size={16} color="#FF8B47" />
                <Text style={styles.tipText}>
                  Use good lighting - natural light works best
                </Text>
              </View>
              
              <View style={styles.tip}>
                <Icon name="move" size={16} color="#FF8B47" />
                <Text style={styles.tipText}>
                  Move slowly and steadily around the product
                </Text>
              </View>
              
              <View style={styles.tip}>
                <Icon name="eye" size={16} color="#FF8B47" />
                <Text style={styles.tipText}>
                  Keep the product in view at all times
                </Text>
              </View>
              
              <View style={styles.tip}>
                <Icon name="refresh" size={16} color="#FF8B47" />
                <Text style={styles.tipText}>
                  You can rescan if the first attempt isn't perfect
                </Text>
              </View>
            </View>

            {/* Benefits Section */}
            <View style={styles.benefitsSection}>
              <Text style={styles.sectionTitle}>🎯 Why Use AR Scanning?</Text>
              
              <View style={styles.benefit}>
                <Icon name="eye-outline" size={20} color="#10B981" />
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Better Visualization</Text>
                  <Text style={styles.benefitDescription}>
                    Customers can see your product in their own space
                  </Text>
                </View>
              </View>
              
              <View style={styles.benefit}>
                <Icon name="trending-up" size={20} color="#10B981" />
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Increased Sales</Text>
                  <Text style={styles.benefitDescription}>
                    AR products get 40% more engagement and sales
                  </Text>
                </View>
              </View>
              
              <View style={styles.benefit}>
                <Icon name="shield-checkmark" size={20} color="#10B981" />
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Reduced Returns</Text>
                  <Text style={styles.benefitDescription}>
                    Customers know exactly what they're buying
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Maybe Later</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.startButton]}
              onPress={() => {
                onClose();
                if (onStartScan) onStartScan();
              }}
            >
              <Icon name="camera" size={16} color="#FFFFFF" />
              <Text style={styles.startButtonText}>Start Scanning</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 15,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF5F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FFE4D6',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  instructionsContainer: {
    flex: 1,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
    marginTop: 8,
  },
  instructionStep: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF8B47',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    marginTop: 2,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  tipsSection: {
    backgroundColor: '#FFF5F0',
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 12,
    flex: 1,
  },
  benefitsSection: {
    marginTop: 16,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  benefitContent: {
    marginLeft: 16,
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  benefitDescription: {
    fontSize: 14,
    color: '#666666',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: '#FF8B47',
    shadowColor: '#FF8B47',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});

export default ARScanInstructions;
