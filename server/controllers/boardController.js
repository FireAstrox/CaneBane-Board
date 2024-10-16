const Board = require('../models/Board');
const mongoose = require('mongoose');

exports.getBoards = async (req, res) => {
  try {
    const boards = await Board.find({ $or: [{ owner: req.user.id }, { members: req.user.id }] });
    res.json(boards);
  } catch (error) {
    console.error('Error fetching boards:', error);
    res.status(500).json({ message: 'Error fetching boards', error: error.message });
  }
};

exports.getBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) {
      console.error(`Board not found: ${req.params.id}`); // Log only the ID if not found
      return res.status(404).json({ message: 'Board not found' });
    }
    
    // Log a success message without the board contents
    console.log(`Board loaded successfully: ${board.name} (ID: ${board._id})`); // Log only the name and ID

    res.json(board);
  } catch (error) {
    console.error('Error fetching board:', error.message);
    res.status(500).json({ message: 'Error fetching board' });
  }
};

exports.createBoard = async (req, res) => {
  try {
    const { name } = req.body;
    const owner = req.user.id;

    const board = new Board({
      name,
      owner,
      members: [owner], // Add the owner to the members list
      columns: [
        { id: 'backlog', title: 'Backlog', hasSubsections: false, allowWipLimit: false },
        { id: 'specification', title: 'Specification', hasSubsections: true, allowWipLimit: true },
        { id: 'implementation', title: 'Implementation', hasSubsections: true, allowWipLimit: true },
        { id: 'test', title: 'Test', hasSubsections: false, allowWipLimit: true },
        { id: 'done', title: 'Done', hasSubsections: false, allowWipLimit: false }
      ]
    });

    await board.save();

    res.status(201).json(board);
  } catch (error) {
    console.error('Error creating board:', error);
    res.status(500).json({ message: 'Error creating board', error: error.message });
  }
};

exports.updateBoard = async (req, res) => {
  try {
    const { boardId } = req.params;
    const { columns } = req.body;

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    board.columns = columns.map(column => ({
      ...column,
      wipLimit: column.wipLimit || null,
      doneRule: column.doneRule || ''
    }));

    await board.save();
    res.status(200).json(board);
  } catch (error) {
    console.error('Error updating board:', error.message);
    res.status(400).json({ error: 'Update failed' });
  }
};

exports.deleteBoard = async (req, res) => {
  try {
    const board = await Board.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!board) {
      return res.status(404).json({ message: 'Board not found or permission denied' });
    }
    res.json({ message: 'Board deleted successfully' });
  } catch (error) {
    console.error('Error deleting board:', error.message);
    res.status(500).json({ message: 'Deletion failed' });
  }
};

exports.createTask = async (req, res) => {
  try {
    const { id } = req.params; // board id
    const { title, status, color } = req.body;
    
    const board = await Board.findById(id);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const newTask = {
      _id: new mongoose.Types.ObjectId().toString(),
      title,
      status: status || 'Backlog',
      color: color || '#' + Math.floor(Math.random()*16777215).toString(16)
    };

    board.tasks.push(newTask);
    await board.save();

    res.status(201).json(newTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Error creating task', error: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { boardId, taskId } = req.params;
    const { title, description, status, color, assignedTo } = req.body;

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const taskIndex = board.tasks.findIndex(task => task._id.toString() === taskId);
    if (taskIndex === -1) {
      return res.status(404).json({ message: 'Task not found' });
    }

    board.tasks[taskIndex].title = title || board.tasks[taskIndex].title;
    board.tasks[taskIndex].description = description || board.tasks[taskIndex].description;
    board.tasks[taskIndex].status = status || board.tasks[taskIndex].status;
    board.tasks[taskIndex].color = color || board.tasks[taskIndex].color;
    board.tasks[taskIndex].assignedTo = assignedTo || board.tasks[taskIndex].assignedTo;

    await board.save();

    res.json({ success: true, task: board.tasks[taskIndex] });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Error updating task', error: error.message });
  }
};


exports.joinBoard = async (req, res) => {
  try {
    const { code } = req.body;
    const board = await Board.findOne({ code });

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    if (board.members.includes(req.user.id)) {
      return res.status(400).json({ message: 'You are already a member of this board' });
    }

    board.members.push(req.user.id);
    await board.save();

    res.json(board);
  } catch (error) {
    console.error('Error joining board:', error);
    res.status(500).json({ message: 'Error joining board', error: error.message });
  }
};

exports.updateColumn = async (req, res) => {
  try {
    const { boardId, columnId } = req.params;
    const { wipLimit, doneRule } = req.body;

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    const columnIndex = board.columns.findIndex(col => col.id === columnId);
    if (columnIndex === -1) {
      return res.status(404).json({ error: 'Column not found' });
    }

    if (wipLimit !== undefined) {
      if (wipLimit !== null && wipLimit < 1) {
        return res.status(400).json({ error: 'WIP Limit must be at least 1' });
      }
      board.columns[columnIndex].wipLimit = wipLimit;
    }

    if (doneRule !== undefined) {
      board.columns[columnIndex].doneRule = doneRule;
    }

    await board.save();
    res.status(200).json(board.columns[columnIndex]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { boardId, taskId } = req.params;

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const taskIndex = board.tasks.findIndex(task => task._id.toString() === taskId);
    if (taskIndex === -1) {
      return res.status(404).json({ message: 'Task not found' });
    }

    board.tasks.splice(taskIndex, 1);
    await board.save();

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Error deleting task', error: error.message });
  }
};

exports.getBoardMembers = async (req, res) => {
  try {
    const { boardId } = req.params;
    const board = await Board.findById(boardId).populate('members', '_id name email');
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }
    res.json(board.members);
  } catch (error) {
    console.error('Error fetching board members:', error);
    res.status(500).json({ message: 'Error fetching board members', error: error.message });
  }
};
