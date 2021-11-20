const User = require('../models/User');
const Notification = require('../models/Notification');
const Comic = require('../models/Comic');
const ObjectID  = require('mongodb').ObjectID;

module.exports = function sendNotificationToUser(comicSlug,chapter,chapterId){
    Comic.findOne({slug:comicSlug})
    .then(comic => {
        const notifiObjId =new ObjectID();
        const notifi = {
            _id: notifiObjId,
            comic:comic.title,
            comicImg:comic.thumbnail.url,
            text:`đã thêm chapter ${chapter}`,
            comicSlug:comicSlug,
            chapterId:chapterId
        }
        saveNotifi(notifi);

        User.updateMany({subscribed: comic._id},{ $addToSet: { notification: notifiObjId },$inc : {seen : 1}})
        .then(() => {
            console.log('updated notifi')
        })
        .catch(err => {
            console.log(err)
            next(err)
        })
        
        User.find({subscribed: comic._id}).lean()
        .then(users => {
          
            
            
            users.forEach(user => {
                var userIdWithQuotes =JSON.stringify(user._id);
                var userIdWithOutQuotes= userIdWithQuotes.replace(/['"]+/g, '')
                
                global.io.in(userIdWithOutQuotes).emit('send_notifi',{userId:user._id, comicTitle:notifi.comic, notifiText:notifi.text})
            })
        })
        .catch(err => console.log("error", err.message))
    })
    .catch(err => console.log("error", err.message))

    async function saveNotifi(notifi) {
        const notification = new Notification(notifi)
        await notification.save()
        
    }
}
// 