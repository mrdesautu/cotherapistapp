// Mock Expo modules
jest.mock('expo-font', () => ({
    loadAsync: jest.fn(),
    isLoaded: jest.fn(() => true),
}));

jest.mock('expo-asset', () => ({
    Asset: {
        loadAsync: jest.fn(),
        fromModule: jest.fn(() => ({ uri: 'test-uri' })),
    },
}));

jest.mock('expo-sqlite', () => ({
    openDatabase: jest.fn(() => ({
        transaction: jest.fn((cb) => cb({ executeSql: jest.fn() })),
    })),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
}));
