import { StyleSheet } from 'react-native';

export default StyleSheet.create ({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    flex: 0.7,
    justifyContent: 'center',
    alignSelf: 'center',

  },
  title: {
    fontWeight: '800',
    fontSize: 28,
    marginBottom: 10,
    color: '#1A1A1A',        // Changed to app's primary dark text color
    textAlign: 'center',
  },
  description: {
    fontWeight: '400',        // Slightly bolder for better readability
    fontSize: 16,             // Added explicit font size
    color: '#666666',         // Changed to app's secondary text color
    textAlign: 'center',
    paddingHorizontal: 64,
    lineHeight: 24,           // Added for better text spacing
  },
});