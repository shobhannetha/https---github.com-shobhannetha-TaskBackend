
const sql=require('mssql');
require('dotenv').config();


const config = {
  user: process.env.user,
  password: process.env.password,
  server:process.env.server,
  database: process.env.database,
  options: {
    encrypt: true,                  
    trustServerCertificate: true  
  }
};

module.exports=config;