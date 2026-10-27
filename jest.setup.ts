import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

// AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// SecureStore
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getAllScheduledNotificationsAsync: jest.fn().mockResolvedValue([]),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('test-notification-id'),
  cancelAllScheduledNotificationsAsync: jest.fn().mockResolvedValue(undefined),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  dismissNotificationAsync: jest.fn().mockResolvedValue(undefined),
  dismissAllNotificationsAsync: jest.fn().mockResolvedValue(undefined),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  removeNotificationSubscription: jest.fn(),
  AndroidImportance: { MAX: 5, HIGH: 4 },
  SchedulableTriggerInputTypes: { DATE: 'date', TIME_INTERVAL: 'timeInterval', DAILY: 'daily', WEEKLY: 'weekly', YEARLY: 'yearly' },
}));

// Location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: { latitude: -34.6037, longitude: -58.3816, altitude: null, accuracy: 10, altitudeAccuracy: null, heading: null, speed: null },
    timestamp: Date.now(),
  }),
  reverseGeocodeAsync: jest.fn().mockResolvedValue([{ city: 'Buenos Aires', country: 'Argentina', region: 'CABA', street: 'Test', postalCode: '1000' }]),
  hasServicesEnabledAsync: jest.fn().mockResolvedValue(true),
  Accuracy: { Balanced: 3, High: 4, Highest: 5, Low: 1, Lowest: 0 },
}));

// Camera
jest.mock('expo-camera', () => ({
  Camera: {
    requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    getCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  },
  CameraView: 'CameraView',
  useCameraPermissions: jest.fn(() => [{ status: 'granted' }, jest.fn()]),
  BarcodeScanningResult: {},
}));

// Contacts
jest.mock('expo-contacts', () => ({
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getContactsAsync: jest.fn().mockResolvedValue({ data: [] }),
  Fields: { PhoneNumbers: 'phoneNumbers', Emails: 'emails', Name: 'name' },
  ContactField: { FULL_NAME: 'fullName', PHONES: 'phones' },
  Contact: {
    presentPicker: jest.fn().mockResolvedValue(null),
  },
}));

// ImagePicker
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchCameraAsync: jest.fn().mockResolvedValue({ canceled: true }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true }),
  MediaTypeOptions: { Images: 'Images' },
}));

// ImageManipulator
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn().mockResolvedValue({ uri: 'file://test.jpg' }),
  SaveFormat: { JPEG: 'jpeg', PNG: 'png' },
}));

// FileSystem
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file://document/',
  cacheDirectory: 'file://cache/',
  readDirectoryAsync: jest.fn().mockResolvedValue([]),
  getInfoAsync: jest.fn().mockResolvedValue({ exists: false }),
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  copyAsync: jest.fn().mockResolvedValue(undefined),
  moveAsync: jest.fn().mockResolvedValue(undefined),
}));

// Sharing
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));

// Constants / Linking
jest.mock('expo-constants', () => ({
  expoConfig: { version: '0.1.0', extra: {} },
  manifest: {},
}));

jest.mock('expo-linking', () => ({
  createURL: jest.fn(),
  openURL: jest.fn(),
}));

// Reducir ruido: silencia solo warnings conocidos de Expo Go.
const originalWarn = console.warn;
jest.spyOn(console, 'warn').mockImplementation((...args) => {
  const msg = args[0]?.toString?.() ?? '';
  const silenciar =
    msg.includes('expo-notifications') ||
    msg.includes('modulo no disponible') ||
    msg.includes('usando fallback');
  if (silenciar) return;
  originalWarn(...args);
});