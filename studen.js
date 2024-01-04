const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://sohaililyas487:admin123@cluster0.biprxao.mongodb.net/Attendance?retryWrites=true&w=majority')
// Define the Student schema

const plm=require('passport-local-mongoose')

const studentSchema = new mongoose.Schema({
  name: String,
  username:String,
  password:String,
  studentId: String,
  className: String,
  attendance: {
    type: Number,
    default: 100 // Attendance default value is 100%
  },
  attendanceMarked: {
    type: Boolean,
    default: false // Indicates if attendance is marked, default is false
  }
});

studentSchema.plugin(plm);



// Create a model based on the schema
module.exports =mongoose.model('Student', studentSchema);

