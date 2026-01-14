import { getNearestShops, calculateDistance, fetchWithRetry } from '../src/app';

describe('App', () => {
  describe('getNearestShops', () => {
    it('should return an array when the input is valid', async () => {
      const result = await getNearestShops({
        lat: 0,
        lng: 0,
      });
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return shops sorted by distance', async () => {
      const result = await getNearestShops({
        lat: 47.581,
        lng: -122.316,
      });

      const sortedByDistance = [...result].sort((a, b) => a.distance - b.distance);
      expect(result).toEqual(sortedByDistance);
    });

    it('should include distance property for each shop', async () => {
      const result = await getNearestShops({
        lat: 47.581,
        lng: -122.316,
      });

      result.forEach(shop => {
        expect(shop).toHaveProperty('distance');
        expect(typeof shop.distance).toBe('number');
      });
    });

    it('should throw error when position is invalid', async () => {
      await expect(getNearestShops({})).rejects.toThrow('Invalid position');
      await expect(getNearestShops({ lat: 0 })).rejects.toThrow('Invalid position');
      await expect(getNearestShops({ lng: 0 })).rejects.toThrow('Invalid position');
    });
  });

  describe('calculateDistance', () => {
    it('should calculate Euclidean distance correctly (Pythagorean triple)', () => {
      const distance = calculateDistance(0, 0, 3, 4);
      expect(distance).toBe(5);
    });

    it('should calculate distance between same points as 0', () => {
      const distance = calculateDistance(10, 20, 10, 20);
      expect(distance).toBe(0);
    });

    it('should handle negative coordinates', () => {
      const distance = calculateDistance(-3, -4, 0, 0);
      expect(distance).toBe(5);
    });
  });

  describe('fetchWithRetry', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should retry on 5xx server errors and eventually succeed', async () => {
      global.fetch
        .mockResolvedValueOnce({
          status: 500,
          ok: false,
        })
        .mockResolvedValueOnce({
          status: 200,
          ok: true,
          json: async () => ({ data: 'success' }),
        });

      const result = await fetchWithRetry('http://test.com', {});

      expect(result).toEqual({ data: 'success' });
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should fail after exhausting all retries', async () => {
      global.fetch.mockResolvedValue({
        status: 500,
        ok: false,
      });

      await expect(fetchWithRetry('http://test.com', {}, 2)).rejects.toThrow('Server Error: 500');
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should not retry on 4xx client errors', async () => {
      global.fetch.mockResolvedValueOnce({
        status: 404,
        ok: false,
      });

      await expect(fetchWithRetry('http://test.com', {})).rejects.toThrow('HTTP Error: 404');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});
