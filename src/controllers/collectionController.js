import { findCollections, findCollectionBySlug } from "../dao/collectionDAO.js";

export const getCollections = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const result = await findCollections({}, { page, limit });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCollectionBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const result = await findCollectionBySlug(slug);

    if (!result) {
      return res.status(404).json({ message: "Collection not found" });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};