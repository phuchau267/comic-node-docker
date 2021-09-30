const User = require('../models/User');
const Comic = require('../models/Comic');
const ObjectID  = require('mongodb').ObjectID;
const globalSocket = require("../../index.js");
module.exports = function sendNotificationToUser(comicSlug){
    Comic.findOne({slug:comicSlug})
    .then(comic => {
        User.find({subscribed: comic.id}).lean()
        .select('_id')
        .then(users => {
            const notifi = {
                _id: new ObjectID(),
                comic:comic.title,

            }
            users.forEach(user => globalSocket.io.in(user._id).emit('send_notifi',{userId:user._id, notifi:notifi.comic}) )
        })
        .catch(err => console.log("error", err.message))
    })
    .catch(err => console.log("error", err.message))
}
// 