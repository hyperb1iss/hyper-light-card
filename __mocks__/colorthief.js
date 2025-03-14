// Mock implementation of ColorThief
module.exports = function ColorThief() {
  return {
    getColor: () => [128, 128, 128],
    getPalette: () => [[128, 128, 128], [200, 200, 200], [50, 50, 50]]
  };
}; 