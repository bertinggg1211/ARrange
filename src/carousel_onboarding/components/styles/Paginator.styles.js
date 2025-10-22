import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  paginatorContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    flexDirection: 'row',
    height: 50,
    alignItems: 'center',
  },
  dot: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#493d8a',
    marginHorizontal: 4,
  },
});