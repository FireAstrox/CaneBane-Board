const express = require('express');
const { getBoards, getBoard, createBoard, updateBoard, deleteBoard, listBoardIds } = require('../controllers/boardController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', getBoards);
router.get('/ids', listBoardIds);
router.get('/:id', getBoard);
router.post('/', createBoard);
router.put('/:id', updateBoard);
router.delete('/:id', deleteBoard);

module.exports = router;