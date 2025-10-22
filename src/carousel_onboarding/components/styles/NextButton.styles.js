import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,       // Distance from bottom of screen
    right: 20,        // Distance from right of screen
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: '#493d8a',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});