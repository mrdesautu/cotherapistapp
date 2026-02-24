module.exports = {
    preset: 'jest-expo',
    testEnvironment: 'node',
    rootDir: '.',
    transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|firebase|@firebase|@react-native-async-storage)',
    ],
    setupFilesAfterEnv: ['<rootDir>/jest/setup.js'],
    fakeTimers: {
        enableGlobally: true
    },
    moduleNameMapper: {
        '^expo-asset$': '<rootDir>/jest/mocks/expo-asset.js',
        '^expo-font$': '<rootDir>/jest/mocks/expo-font.js',
        '^expo-sqlite$': '<rootDir>/jest/mocks/expo-sqlite.js',
    }
};
