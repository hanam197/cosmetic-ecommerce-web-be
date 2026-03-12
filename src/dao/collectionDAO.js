import Collection from "../models/Collection.js";

export const findCollections = async (filter = {}, options = {}) => {
  try {
    const { page = 1, limit = 10 } = options;

    const skip = (page - 1) * limit;

    const collections = await Collection.find(filter)
      .populate("items.product")
      .skip(skip)
      .limit(limit)
      .lean();

    const result = collections.map((collection) => ({
      ...collection,
      items: collection.items.map((item) => {
        const product = item.product;

        const variant = product.variants.find((v) => v.sku === item.variantSku);

        return {
          ...item,
          product: {
            ...product,
            variants: variant ? [variant] : [],
          },
        };
      }),
    }));

    const total = await Collection.countDocuments(filter);

    return {
      data: result,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    throw error;
  }
};

export const findCollectionBySlug = async (slug) => {
  try {
    const collection = await Collection.findOne({ slug })
      .populate("items.product")
      .lean();

    if (!collection) return null;

    const result = {
      ...collection,
      items: collection.items.map((item) => {
        const product = item.product;

        if (!product) return item;

        const variant = product.variants?.find((v) => v.sku === (item.variantSku || item.variant));

        return {
          ...item,
          product: {
            ...product,
            variants: variant ? [variant] : [],
          },
        };
      }),
    };

    return result;
  } catch (error) {
    throw error;
  }
};
