const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const studentRoutes = require('./Routing');
const path = require('path');
const app = express();
app.use(cors({
  origin: ["http://localhost:8081", "http://localhost:5000"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(bodyParser.json());
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static('C:/Users/shoba/ReactProjects/uploads'));

// Routes
app.use('/api/students', studentRoutes);


app.use('/api/login', studentRoutes);   
app.use('/api/signup', studentRoutes);
app.use('/getstudents', studentRoutes);
app.use('/getByStudentId', studentRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
