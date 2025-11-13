const express = require('express');
const router = express.Router();
const studentController = require('./TaskControllers');
const upload = require('./fileupload'); // multer config
const multer = require('multer');


router.post('/add', upload.single('studentImage'), studentController.addStudent);

router.post('/signup', studentController.signup);
router.post('/login', studentController.login);
router.get('/getstudent',studentController.getAllStudents)
router.get('/getByStudentId',studentController.getByStudentId)

module.exports = router;