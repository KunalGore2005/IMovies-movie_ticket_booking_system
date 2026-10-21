const express = require('express');
const router = express.Router();
const {
  getShows,
  getShowById,
  getShowSeats,
  createShow,
  updateShow,
  deleteShow,
} = require('../controllers/showController');
const { protect, requireAdmin } = require('../middlewares/authMiddleware');

router.get('/', getShows);
router.get('/:id', getShowById);
router.get('/:id/seats', getShowSeats);
router.post('/', protect, requireAdmin, createShow);
router.put('/:id', protect, requireAdmin, updateShow);
router.delete('/:id', protect, requireAdmin, deleteShow);

module.exports = router;
