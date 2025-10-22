import { StyleSheet, Dimensions } from 'react-native';
const { width } = Dimensions.get('window');

export default  StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  toggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderWidth: 1,
    borderColor: '#ccc',
    marginHorizontal: 5,
    borderRadius: 20,
  },
  activeToggle: {
    backgroundColor: '#ff9900',
  },
  toggleText: {
    fontSize: 16,
    color: '#333',
  },
  activeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  inputIcon: {
    marginRight: 8,
  },
  inputText: {
    flex: 1,
    height: 50,
    color: '#000',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  checkboxLabel: {
    marginLeft: 5,
    fontSize: 14,
    color: '#333',
  },
  signupButton: {
    backgroundColor: '#ff9900',
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },
  loginText: {
    fontSize: 14,
    color: '#333',
  },
  loginHighlight: {
    fontSize: 14,
    color: '#ff9900',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
     textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
     textAlign: 'center',
  },
});