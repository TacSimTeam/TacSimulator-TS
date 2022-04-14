module.exports = {
  transform: {
    "^.+\\.tsx?$": "ts-jest"
  },
  moduleFileExtensions: [
    "ts",
    "tsx",
    "js",
    "json",
    "jsx"
  ],
  roots: ["<rootDir>/src/", "<rootDir>/test/"]
};
