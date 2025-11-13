const sql = require('mssql')
const config = require('./ConctionString');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');




exports.signup = async (req, res) => {
  try {
    const { username, phone_no, password } = req.body;

    // Check if any required field is missing
    if (!username || !phone_no || !password) {
      return res.status(400).json({ error: 'All fields (username, phone_no, password) are required.' });
    }

    const pool = await sql.connect(config);

    // ✅ Check if username already exists
    const checkUser = await pool.request()
      .input('username', sql.VarChar, username)
      .query('SELECT user_id FROM users WHERE username = @username');

    if (checkUser.recordset.length > 0) {
      return res.status(400).json({ error: 'Username already exists. Please choose a different one.' });
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Insert new user and return inserted record
    const result = await pool.request()
      .input('username', sql.VarChar, username)
      .input('phone_no', sql.VarChar, phone_no)
      .input('password_hash', sql.VarChar, hashedPassword)
      .query(`
        INSERT INTO users (username, phone_no, password_hash)
        OUTPUT INSERTED.user_id, INSERTED.username, INSERTED.phone_no, INSERTED.created_at
        VALUES (@username, @phone_no, @password_hash)
      `);

    const insertedUser = result.recordset[0];

    // ✅ Send success response
    res.status(201).json({
      message: 'Signup successful',
      data: insertedUser
    });

  } catch (err) {
    console.error('Signup Error:', err);
    if (err.number === 2627) {
      return res.status(400).json({ error: 'Username already exists. Please choose a different user Name.' });
    }
    res.status(500).json({ error: 'Signup failed' });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('username', sql.VarChar, username)
      .query('SELECT * FROM users WHERE username = @username');

    const user = result.recordset[0];
    if (!user) {
     return res.status(404).json({ error: 'You are not an existing user. Please sign up.' });

    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.user_id, username: user.username },
      process.env.SECRET_KEY,  
      { expiresIn: '1d' }
    );

    // ✅ Send clean response
    res.json({
      message: 'Login successful',
      data: {
        user_id: user.user_id,
        username: user.username,
        phone_no: user.phone_no,
        created_at: user.created_at
      },
      token
    });

  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};



exports.addStudent = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Uploaded file:', req.file);

    const {
      name, class: studentClass, section, school_name, gender, dob,
      blood_group, father_name, mother_name, parent_contact, emergency_contact,
      address1, address2, city, state, zip_code, location_lat, location_lng,AddAddress
    
    } = req.body;

    // Check if image was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'Student image is required' });
    }

    const studentImagePath = `/uploads/${req.file.filename}`;
    
    // Parse date properly
    let dobValue = null;
    if (dob) {
      // Handle DD/MM/YYYY format from frontend
      const [day, month, year] = dob.split('/');
      dobValue = new Date(`${year}-${month}-${day}`);
    }

    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('name', sql.VarChar, name)
      .input('class', sql.VarChar, studentClass)
      .input('section', sql.VarChar, section)
      .input('school_name', sql.VarChar, school_name)
      .input('gender', sql.VarChar, gender)
      .input('dob', sql.Date, dobValue)
      .input('blood_group', sql.VarChar, blood_group)
      .input('father_name', sql.VarChar, father_name)
      .input('mother_name', sql.VarChar, mother_name)
      .input('parent_contact', sql.VarChar, parent_contact)
      .input('emergency_contact', sql.VarChar, emergency_contact)
      .input('address1', sql.VarChar, address1)
      .input('address2', sql.VarChar, address2 || null)
      .input('city', sql.VarChar, city)
      .input('state', sql.VarChar, state)
      .input('zip_code', sql.VarChar, zip_code)
      .input('location_lat', sql.Float, location_lat || null)
      .input('location_lng', sql.Float, location_lng || null)
      .input('profile_image_url', sql.VarChar, studentImagePath)
     .input('AddAddress', sql.VarChar(sql.MAX), AddAddress)
      .query(`
        INSERT INTO students (
          name, class, section, school_name, gender, dob, blood_group,
          father_name, mother_name, parent_contact, emergency_contact,
          address1, address2, city, state, zip_code,
          location_lat, location_lng, profile_image_url,Add_Address
        ) VALUES (
          @name, @class, @section, @school_name, @gender, @dob, @blood_group,
          @father_name, @mother_name, @parent_contact, @emergency_contact,
          @address1, @address2, @city, @state, @zip_code,
          @location_lat, @location_lng, @profile_image_url,@AddAddress
        )
      `);

    // Prepare response data
    const data = {
      name,
      class: studentClass,
      section,
      school_name,
      gender,
      dob,
      blood_group,
      father_name,
      mother_name,
      parent_contact,
      emergency_contact,
      address1,
      address2: address2 || null,
      city,
      state,
      zip_code,
      location_lat: location_lat || null,
      location_lng: location_lng || null,
      profile_image_url: studentImagePath,
      AddAddress:AddAddress
      
    };

    res.status(201).json({
      message: 'Student added successfully',
      student: data
    });

  } catch (err) {
    console.error('Add Student Error:', err);
    
    // Delete the uploaded file if there was an error
    if (req.file) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting uploaded file:', unlinkErr);
      });
    }
    
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
};

// exports.getStudents = async (req, res) => {
//   try {
//     const pool = await sql.connect(config);
//     const result = await pool.request().query('SELECT * FROM students ORDER BY student_id DESC');
//     res.json(result.recordset);
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to fetch students' });
//   }
// };
exports.getAllStudents = async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query("SELECT * FROM students ORDER BY student_id DESC  ");
    res.json(result.recordset);
  } catch (err) {
    console.error("GetStudent Error:", err); // log exact error
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getByStudentId = async (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Student ID is required" });
  }

  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input("id", sql.Int, id) 
      .query("SELECT * FROM students WHERE student_id = @id");

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json(result.recordset[0]); // return single student
  } catch (err) {
    console.error("Get Student Error:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
};
