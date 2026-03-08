import { findCollections } from "../dao/collectionDAO.js";

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