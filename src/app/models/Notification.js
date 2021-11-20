const mongoose        = require('mongoose');
const Schema          = mongoose.Schema;
//import plugin slug mongoose
const moment          = require('moment-timezone');
const opts = {
  // set lại time zone sang asia
  timestamps: { currentTime: () => moment.tz(Date.now(), "Asia/Ho_Chi_Minh") },
};
const Notification = new Schema({
  comic:{ type: String, index: true },
  comicImg:{type: String},
  text: { type: String, index: true },
  comicSlug:{type: String},
  chapterId:{type: String},
  userRead:[{
    type: mongoose.Schema.Types.ObjectId,
  }],

}, opts);




  //               mongoose.model('ModelName', mySchema);
  module.exports = mongoose.model('Notification', Notification);
