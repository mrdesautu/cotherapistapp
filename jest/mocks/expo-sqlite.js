module.exports = {
    openDatabase: jest.fn(() => ({
        transaction: jest.fn((cb) => cb({ executeSql: jest.fn() })),
    })),
};
