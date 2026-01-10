import mongoose from 'mongoose';
import Product from './src/models/Product.js';
import Variant from './src/models/Variant.js';
import dotenv from 'dotenv';

dotenv.config();

const seedData = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cosmetic-db';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Clear existing data and drop old indexes
    await Product.deleteMany({});
    await Variant.deleteMany({});
    await Variant.collection.dropIndex('id_1').catch(() => {});
    console.log('🗑️  Cleared old data and indexes');

    // Create product first (without variants)
    const productData = {
      slug: 'lolli-glow-tint',
      name: 'Lolli Glow Tint',
      images: {
        gallery: [
          '/img/4glowtint.webp',
          'https://ofelia.vn/cdn/shop/files/1.1.2._Hero_Banner_bb498b90-f1cf-4ec0-9a8b-f621df996b7a.jpg?v=1742027785&width=1400',
          'https://amuseseoulmakeup.com/cdn/shop/files/0728_Peach_fd_04.jpg?v=1753785126&width=3000'
        ],
        thumbnail: '/img/4glowtint.webp',
        hover: 'https://ofelia.vn/cdn/shop/files/1.1.2._Hero_Banner_bb498b90-f1cf-4ec0-9a8b-f621df996b7a.jpg?v=1742027785&width=1400',
        banner: 'https://amuseseoulmakeup.com/cdn/shop/files/0728_Peach_fd_04.jpg?v=1753785126&width=3000'
      },
      price: 194000,
      oldPrice: 259000,
      tag: 'sale',
      videoSrc: './video/dew-tint.mp4',
      description:
        "Get a natural, radiant glow with Ofelia's Lolli Glow Tint. This lightweight tint provides a sheer wash of color that enhances your complexion while giving you a dewy finish. Perfect for everyday wear, it blends seamlessly into the skin for a fresh and youthful look.",
      category: 'lip',
      variants: []
    };

    const product = await Product.create(productData);
    console.log('✅ Created product');

    // Create variants with productId
    const variantsData = [
      {
        productId: product._id,
        sku: 'GT14-SUNNIES-TOTE',
        colorName: 'GT14 SUNNIES & TOTE',
        colorCode: '#E6727E',
        stock: 10,
        images: [
          'https://ofelia.vn/cdn/shop/files/Frame_14317-3.png?v=1761211918&width=1000'
        ]
      },
      {
        productId: product._id,
        sku: 'GT15-PALOMA',
        colorName: 'GT15 PALOMA',
        colorCode: '#FF8B87',
        stock: 5,
        images: [
          'https://ofelia.vn/cdn/shop/files/Frame_14318-2.png?v=1761211918&width=1000'
        ]
      },
      {
        productId: product._id,
        sku: 'GT16-FREEDOM-BEACH',
        colorName: 'GT16 FREEDOM BEACH',
        colorCode: '#E25B66',
        stock: 3,
        images: [
          'https://ofelia.vn/cdn/shop/files/Frame_14319.png?v=1761211918&width=1000'
        ]
      }
    ];

    const createdVariants = [];
    for (const variantData of variantsData) {
      const variant = await Variant.create(variantData);
      createdVariants.push(variant);
    }
    console.log(`✅ Created ${createdVariants.length} variants`);

    // Update product with variant IDs
    product.variants = createdVariants.map(v => v._id);
    await product.save();
    console.log('✅ Updated product with variants');

    console.log('\n✨ Seed data successfully created!');
    console.log(`Product: ${product.name} (ID: ${product._id})`);
    console.log(`Variants: ${createdVariants.length} colors`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
    process.exit(1);
  }
};

seedData();
