import { getNearestShops } from './app.js';

async function main() {
  try {
    // Parse command-line arguments
    const lat = parseFloat(process.argv[2]);
    const lng = parseFloat(process.argv[3]);

    // Validate arguments
    if (isNaN(lat) || isNaN(lng)) {
      console.error('Usage: yarn start <lat> <lng>');
      console.error('Example: yarn start 47.581 -122.316');
      process.exit(1);
    }

    const position = { lat, lng };

    // Get nearest shops
    const shops = await getNearestShops(position);

    // Display results
    shops.forEach((shop) => {
      console.log(`${shop.name}, ${shop.distance.toFixed(4)}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();