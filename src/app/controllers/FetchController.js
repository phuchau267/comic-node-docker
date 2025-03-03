const Comic     = require('../models/Comic');
const Chapter   = require('../models/Chapter');
const Comment   = require('../models/Comment');
const User   = require('../models/User');
const { singleMongooseToObject, multiMongooseToObject } =  require('../../util/mongoose');
const { IMAGE_URL } = require('../../config/config');

class SiteController {


    fetchBookmarkContents(req, res, next) {
      if (!req.user) return renderLocalData()
      else return renderBookmarkData()

      function renderLocalData() {
        res.status(200).render('template/history_bookmark.template.hbs', {
          layout: 'fetch_layout',
          isLoggedIn: false,
          historyItems: req.body
        })
      };

      function renderBookmarkData() {
        const userBookmarks = (req.user.subscribed) ? req.user.subscribed : []
        
        if (userBookmarks.length == 0) return res.send({message: "false", status: 404});
        else return findBookmarkedComic()
        
        function findBookmarkedComic() {
          Comic
          .find({ _id: { $in: userBookmarks } })
          .lean()
          .select("-category -description -lastest_chapters")
          .then(subList => {
            res.status(200).render('template/history_bookmark.template.hbs', {
              layout: 'fetch_layout',
              isLoggedIn: true,
              sublist: subList,
              img_url: IMAGE_URL
            })
          })
          .catch(err => console.log(err))
        };

      };
    }

    getAuth(req, res, next) {
      
      res.status(200).render('template/auth.template.hbs', {
        layout: 'fetch_layout',
        user: req.user
      })
    }

    getSubsbribeStatus(req, res, next) {
      if (!req.user) return res.send({login: false})

      let subscribe       = false,
          subscribedComic = req.user.subscribed,
          clientComic_id  = req.body.comicId,
          subLength       = subscribedComic?.length

      for (let i = 0; i <= subLength; i++) {
        if (JSON.stringify(subscribedComic[i]) === JSON.stringify(clientComic_id)) {
          subscribe = true
          break;
        }
      }

      
      res.send({
        isSub: subscribe,
        status: 200,
        message: 'You had subscribed this comic'
      })
    }

    fetchUsers(req, res, next) {
        
        User
        .find({}).lean()
        .select('banned role name _id')
        .then(users => res.send(users))
        .catch(next)
    }
    
    fetchSubList(req, res, next) {
        if (!req.user) return res.send({login: false})
        
        User
        .findOne({ _id: req.user._id}).lean()
        .select('subscribed -_id')
        .populate('subscribed')
        // .then(subList => console.log(subList))
        .then(subList => res.send(subList))
        .catch(next)
    }

    fetchComics(req, res, next) {
        
        Comic
        .find({}).lean()
        .select('-userId')
        .then(comics => res.send(comics))
        .catch(next)
    }

    fetchChapters(req, res, next) {
        
        Chapter
        .find({comicSlug: req.params.chapterSlug}).lean()
        .select('-image')
        .then(chapters => res.send(chapters))
        .catch(next)
    }

    fetchComments(req, res, next) {
        let chapter = (req.params.chapter == 'null') ? null : req.params.chapter
        let sort = (req.query.hasOwnProperty('_sort')) ? { [req.query.column]: parseInt(req.query.type) } : { commentArr: -1 }
        let match = (req.query.hasOwnProperty('_match')) 
        ? { comicSlug: req.params.comicSlug, chapter: { $ne: null } } 
        : { comicSlug: req.params.comicSlug, chapter: chapter }
        let page        = +req.body.page || 1;
        let PageSize    = 10;
        let firstLimit  = (req.query.hasOwnProperty('_match')) ? PageSize : 1
        let skipComment = (page - 1) * PageSize;
        let withUIContainer  = (page == 1) ? true : false;

        Comment.aggregate([
            { $match: match },
            { $limit: firstLimit },
            {
              $addFields: {
                maxComment: { $size: "$commentArr" }
              }
            },
            { $unwind: "$commentArr" },
            { $sort: sort },
            { $skip: skipComment },
            { $limit: PageSize },
            {
              $addFields: {
                replyLength: { $size: "$commentArr.reply" },
              }
            },
            {
              $group: {
                _id: '$_id',
                title: { $first: '$title' },
                chapter: { $first: '$chapter' },
                comicSlug: { $first: '$comicSlug' },
                maxComment: { $first: '$maxComment' },
                commentArr: { $push: '$commentArr' },
                replyLength: { $push: '$replyLength' },
              }
            },
            { $sort: sort },
          ])
          .then(commentdoc => {
            
            res.render('template/commentBox.hbs',
            {
              layout: 'fetch_layout.hbs',
              comments: commentdoc,
              user: req.user,
              withUIContainer: withUIContainer
            })
          })
          .catch(err => console.log(err))
    }
}

//export (SiteController) thì lát require nhận được nó
module.exports = new SiteController();
