const express = require('express');
const router = express.Router();
const {
  getMyFavorites,
  addFavorite,
  removeFavorite,
  getFavoriteStatus,
} = require('../controllers/favoriteController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, getMyFavorites);
router.post('/:movieId', protect, addFavorite);
router.delete('/:movieId', protect, removeFavorite);
router.get('/:movieId/status', protect, getFavoriteStatus);

module.exports = router;
