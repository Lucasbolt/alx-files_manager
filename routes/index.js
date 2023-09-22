import AppController from '../controllers/AppController';
import UserController from '../controllers/UserController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';
const express = require('express');
const router = express.Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.post('/users', UserController.postNew);
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);
router.get('/users/me', AuthController.getMe);
router.post('/files', FilesController.postUpload);
router.get('/files/:id', FilesController.getshow);
router.get('/files', FilesController.getIndex);
router.put('/files/:id/publish', FilesController.putPublish);
router.put('/files/:id/unpublish', FilesController.putUnPublish);
module.exports = router;
