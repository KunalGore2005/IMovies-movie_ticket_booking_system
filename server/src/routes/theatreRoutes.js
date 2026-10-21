const express = require('express');
const router = express.Router();
const {
  getTheatres,
  getTheatreById,
  createTheatre,
  updateTheatre,
  deleteTheatre,
} = require('../controllers/theatreController');
const { protect, requireAdmin } = require('../middlewares/authMiddleware');

router.get('/', getTheatres);
router.get('/:id', getTheatreById);
router.post('/', protect, requireAdmin, createTheatre);
router.put('/:id', protect, requireAdmin, updateTheatre);
router.delete('/:id', protect, requireAdmin, deleteTheatre);

module.exports = router;
