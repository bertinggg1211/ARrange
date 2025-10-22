import AsyncStorage from '@react-native-async-storage/async-storage';

const clearStorage = async () => {
  try {
    await AsyncStorage.removeItem('userData');
    await AsyncStorage.removeItem('hasSeenOnboarding');
    console.log('Storage successfully cleared!');
  } catch (e) {
    console.log('Failed to clear the async storage.');
  }
};

clearStorage();