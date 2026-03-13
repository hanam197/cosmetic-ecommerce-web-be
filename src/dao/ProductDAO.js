import Product from "../models/Product.js";

export const findProducts = async ({ category, tag, search, sort: sortValue, page = 1, limit = 4 }) => {
  const filter = {};

  // category filter
  if (category && category !== "all") {
    filter.category = category;
  }

  // tag filter
  if (tag) {
    filter.tag = tag;
  }

  // search by name
  if (search) {
    filter.name = { $regex: search, $options: "i" };
  }

  // Sorting logic
  const sort = {};
  if (sortValue === "price_asc") sort.price = 1;
  else if (sortValue === "price_desc") sort.price = -1;

  const total = await Product.countDocuments(filter);

  let query = Product.find(filter)
    .skip((page - 1) * limit)
    .limit(limit);

  if (Object.keys(sort).length > 0) {
    query = query.sort(sort);
  }

  const products = await query.lean();

  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    products,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null,
    },
  };
};

export const findProductsByCategory = async ({
    filter,
    page = 1,
    limit = 12,
    sortByPrice
}) => {
    const skip = (page - 1) * limit;
    const sort = {};

    if (sortByPrice === "price_asc") sort.price = 1; // ascending
    else if (sortByPrice === "price_desc") sort.price = -1; // descending

    const query = Product.find(filter).skip(skip).limit(limit);
    console.log("dasasasdad");
    // Apply sort only if sort object is not empty
    if (Object.keys(sort).length > 0) {
        query.sort(sort);
    }

    const [products, total] = await Promise.all([
        query,
        Product.countDocuments(filter),
    ]);

    return {
        products,
        total,
        page,
        limit,
    };
};
