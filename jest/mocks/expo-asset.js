module.exports = {
    Asset: {
        loadAsync: jest.fn(),
        fromModule: jest.fn(() => ({ uri: 'test-uri' })),
    },
};
