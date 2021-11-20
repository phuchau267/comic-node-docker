const Comic     = require('../models/Comic');
const Chapter   = require('../models/Chapter');
const Comment   = require('../models/Comment');
const Config   = require('../models/Config');
const Category   = require('../models/Category');
const User      = require('../models/User');
const dbHelper  = require('./dbHelper')


const { canViewProject, canDeleteProject } = require('../../config/permissions/comics.permission');
const { IMAGE_URL } = require('../../config/config');


const puppeteer = require('puppeteer');
const removeVietnameseTones = require('../../config/middleware/VnameseToEng');
const download = require('../../util/download-file');
const path = require('path');

const filepath = path.resolve(__dirname,'../../public/leech-chapter-img')
async function autoScroll(page){
  await page.evaluate(async () => {
      await new Promise((resolve, reject) => {
          var totalHeight = 0;
          var distance = 10000;
          var timer = setInterval(() => {
              var scrollHeight = document.body.scrollHeight;
              window.scrollBy(0, distance);
              totalHeight += distance;

              if(totalHeight >= scrollHeight){
                  clearInterval(timer);
                  resolve();
              }
          }, 100);
      });
  });
}
class meController {

  /***** Comic Controller *****
  -3. delete Categories
  -2. Create Categories
  -1. Category List Page
  0. default page
  1. Render comic list
  2. Render Create comics
  3. Create comics
  4. Render Edit Page
  5. Update comic
  6. Destroy comic
  7. Handle Form Action Comic
  ***** Comic Controller *****/

  /***** Chapter Controller *****
  8.  Render ChapterList
  9.  Render create Chapter
  10. destroy Chapter
  11. Handle Form Action Chapter
  ***** Chapter Controller *****/

  // -3. delete Categories: [DELETE] / me / stored / category-list / destroy / :_id

  leechPage(req, res, next) {
    res.render('me/Leech.hbs',{
      layout: 'admin',
    })
  }
  async leechComic(req, res, next) {
    const chapterfilepath = path.resolve(__dirname,'../../public/leech-chapter-img')
    const thumbnailfilepath = path.resolve(__dirname,'../../public/leech-img')
    
    try{
        const browser = await puppeteer.launch({ 
            headless: true,
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36 Edg/95.0.1020.40');

        await page.goto(req.body.comicUrl);
        console.log('got in '+req.body.comicUrl)
        await page.waitForSelector('#item-detail')
        const comicName = await page.evaluate(() => document.querySelector('#item-detail > .title-detail').textContent);
        console.log(comicName)
        await Comic.findOne({title:comicName}).lean()
        .select('_id')
        .then(async comicDoc => {
          if(comicDoc){
            console.log('truyen nay da co roi')
          }else {
            const comicAuthorExist = await page.$('.list-info > .author p a')
            const subtitleExist = await page.$('.list-info > .othername .other-name')
            var comicAuthor
            var subTitle
            var categoriesIds = []; 

            if(!subtitleExist){
              subTitle = 'Đang cập nhật';
            }else{
              subTitle = await page.evaluate(() => document.querySelector('.list-info > .othername .other-name').textContent);
            }
            console.log(subTitle)

            if(!comicAuthorExist){
              comicAuthor = 'Đang cập nhật';
            }else{
              comicAuthor = await page.evaluate(() => document.querySelector('.list-info > .author p a').textContent);
            }
            console.log(comicAuthor)
            
            
            
            const comicStatus = await page.evaluate(() => document.querySelector('.list-info > .status p.col-xs-8').textContent);

            console.log(comicStatus)
            // const comicCategories = await page.$$('.list-info > .kind p a')
            const comicCategories = await page.evaluate(() => Array.from(document.querySelectorAll('.list-info > .kind p a'), element => element.textContent));
            
            for(var i=0;i<comicCategories.length;i++){
              Category.findOne({name:comicCategories[i]}).lean()
              .select('_id')
              .then(category => {
                console.log('id cua the loai ne '+category._id)
                categoriesIds.push(category._id);
              })
              
            }
            setTimeout(() => {
              console.log('id the loai ne'+categoriesIds)
            }, 1000);
            
            const seeMoreDescription = await page.$('a.morelink')
            if(seeMoreDescription){
              await seeMoreDescription.click()
            }
            const comicDescription = await page.evaluate(() => document.querySelector('.detail-content > p').textContent);
            const comicImgSrc = await page.$eval("#item-detail img",element=> element.getAttribute("src"))
            const thumbnailName = await removeVietnameseTones(comicName)+'.jpg'
          //  await download(comicImgSrc,thumbnailfilepath,thumbnailName, (thumbnailName) => {
          //  console.log(thumbnailName+ ' downloaded')
          //   })
            /////////////////////////////////////////////////////////////////////////////


            // lam function tao comic o day

            //tiep theo up thumbnail luon
      

            /////////////////////////////////////////////


            await autoScroll(page);
            const seeMoreChapter = await page.$('a.view-more')
            if(seeMoreChapter){
              await seeMoreChapter.click()
            }
            
            
            
            
            const chapters = await page.$$('#item-detail  .chapter > a') // tong so chapter co tren nettruyen
            console.log('so luong chapter '+chapters.length)


            for(let i = 0; i < chapters.length; i++){

            // khuc nay vong lap lay tat ca img trong tung chap

              await page.goto(req.body.comicUrl);
              await page.waitForSelector('#item-detail')
              await autoScroll(page);
              
              const seeMoreChapter = await page.$('a.view-more')
              if(seeMoreChapter){
                await seeMoreChapter.click()
              }
              
              
              const chapters = await page.$$('#item-detail  .chapter > a')
              const chapter = chapters[i]
              if(i>0){
  
                const previousChapter = chapters[i-1]
                const chapterName = await ( await chapter.getProperty( 'innerText' ) ).jsonValue()
                const previousChapterName = await ( await previousChapter.getProperty( 'innerText' ) ).jsonValue()
                if(chapterName == previousChapterName){
                    //  khuc nay check coi dang loop no co update them chapter moi k
                  chaptersNeedLoop++  
                
                  continue
                }
  
              }
              
              await chapter.click()
              
              
              await page.waitForSelector('#ctl00_divCenter');
              
              await autoScroll(page);
              const chapterImgs = await page.$$('.reading-detail .page-chapter > img');
              
              console.log(chapterImgs.length);
              for(let i = 0; i < chapterImgs.length; i++){
               
                const chapterImgSrc = await page.$eval(`.reading-detail  #page_${i+1} > img`,element=> element.getAttribute("src"))
                const chapterImgAlt = await page.$eval(`.reading-detail  #page_${i+1} > img`,element=> element.getAttribute("alt"))
                
                const chapterImgName = removeVietnameseTones(chapterImgAlt)+'.jpg'
                console.log(chapterImgName)
                // download(chapterImgSrc,chapterfilepath,chapterImgName, (chapterImgName) => {
                //   console.log(chapterImgName+ ' downloaded')
                // })
                
                
              }


                  // khuc nay la co het chapter img cua 1 chapter r , tao function tao chapter o day di


              
            } 










          }
        })
        
        
        
       
        await browser.close()
        console.log('leech function runned')
        req.flash('success-message',req.body.comicUrl+ ` leech comic thanh cong !!`)
        res.redirect('/me/leech')
    }catch(e){
        console.log('leech error', e)
    }

    
    
  }

  async autoLeech(req, res, next){
    const chapterfilepath = path.resolve(__dirname,'../../public/leech-chapter-img')
    const thumbnailfilepath = path.resolve(__dirname,'../../public/leech-img')
    const pageStartNumber = req.body.pageStart
    const pageEndNumber = req.body.pageEnd
    try{
      const browser = await puppeteer.launch({ 
        headless: false,
       
      });
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36 Edg/95.0.1020.40');
      
      for(let i = pageStartNumber; i <= pageEndNumber; i++){
        const pageNumber = i
        await page.goto(`http://www.nettruyenpro.com/?page=${pageNumber}`);
        console.log(`got in http://www.nettruyenpro.com/?page=${pageNumber}`)
        await page.waitForSelector('#ctl00_divCenter')
        await autoScroll(page);
        const comics = await page.$$('#ctl00_divCenter .item')
        console.log(comics.length)
        for(let i = 0; i < comics.length; i++){

          await page.goto(`http://www.nettruyenpro.com/?page=${pageNumber}`);
          console.log(`got in http://www.nettruyenpro.com/?page=${pageNumber} lan ${i+1}`);
          await page.waitForSelector('#ctl00_divCenter')
          await autoScroll(page);
          const comics = await page.$$('#ctl00_divCenter .item')
          const comic = comics[i];
          const comicCheckNames = await page.$$('#ctl00_divCenter .item .jtip')
          const comicCheckName = comicCheckNames[i];
          const comicName = await ( await comicCheckName.getProperty( 'innerText' ) ).jsonValue()
          console.log( comicName );
          
          await Comic.find({title:comicName}).lean()
          .select('title')
           .then(async comicDoc =>{
              if(!comicDoc){
                const comicLink = await comic.$('a')
                await comicLink.click()
                await page.waitForSelector('#item-detail')
                const currentComicUrl = page.url();


                const comicName = await page.evaluate(() => document.querySelector('#item-detail > .title-detail').textContent);
                const comicAuthorExist = await page.$('.list-info > .author p a')
                const subtitleExist = await page.$('.list-info > .othername .other-name')
                var comicAuthor
                var subTitle
                var categoriesIds = [];
    
                if(!subtitleExist){
                  subTitle = 'Đang cập nhật';
                }else{
                  subTitle = await page.evaluate(() => document.querySelector('.list-info > .othername .other-name').textContent);
                }
                console.log(subTitle)
    
                if(!comicAuthorExist){
                  comicAuthor = 'Đang cập nhật';
                }else{
                  comicAuthor = await page.evaluate(() => document.querySelector('.list-info > .author p a').textContent);
                }
                console.log(comicAuthor)
                  const comicStatus = await page.evaluate(() => document.querySelector('.list-info > .status p.col-xs-8').textContent);
            
                console.log(comicStatus)
                // const comicCategories = await page.$$('.list-info > .kind p a')
                const comicCategories = await page.evaluate(() => Array.from(document.querySelectorAll('.list-info > .kind p a'), element => element.textContent));
                
                for(var i=0;i<comicCategories.length;i++){
                  Category.findOne({name:comicCategories[i]}).lean()
                  .select('_id')
                  .then(category => {
                    console.log('id cua the loai ne '+category._id)
                    categoriesIds.push(category._id);
                  })
                  
                }
                  

                  const seeMoreDescription = await page.$('a.morelink')
                  if(seeMoreDescription){
                    await seeMoreDescription.click()
                  }
                  const comicDescription = await page.evaluate(() => document.querySelector('.detail-content > p').textContent);
                  const comicImgSrc = await page.$eval("#item-detail img",element=> element.getAttribute("src"))
                  const thumbnailName = removeVietnameseTones(comicName)+'.jpg'
                // await download(comicImgSrc,thumbnailfilepath,thumbnailName, (thumbnailName) => {
                //   console.log(thumbnailName+ ' downloaded')
                // })
                

                /////////////////////////////////////////////////////////////////////////////


                // lam function tao comic o day

                //tiep theo up thumbnail luon
          

                /////////////////////////////////////////////






                await autoScroll(page);
                const seeMoreChapter = await page.$('a.view-more')
                if(seeMoreChapter){
                  await seeMoreChapter.click()
                }
                
                const chapters = await page.$$('#item-detail  .chapter > a') // tong so chapter co tren nettruyen
                console.log('so luong chapter '+chapters.length)
                var chapterLength = chapters.length;
                  for(let i = 0; i < chapterLength; i++){
                    await page.goto(currentComicUrl);
                    await page.waitForSelector('#item-detail')
                    await autoScroll(page);
                    
                    const seeMoreChapter = await page.$('a.view-more')
                    if(seeMoreChapter){
                      await seeMoreChapter.click()
                    }
                    
                    
                    const chapters = await page.$$('#item-detail  .chapter > a')



            //////////////////////////////// cai nay la sợ giua chung` no update them chapter moi cho nen phai check coi co bi trung chapter vua r ko, neu co trung thi skip qua vong lap tiep theo



                    const chapter = chapters[i]
                    if(i>0){
                    const previousChapter = chapters[i-1]
                      const chapterName = await ( await chapter.getProperty( 'innerText' ) ).jsonValue()
                      const previousChapterName = await ( await previousChapter.getProperty( 'innerText' ) ).jsonValue()
                      if(chapterName == previousChapterName){
                        chapterLength++      
                          continue
                      }
                    }
                    await chapter.click()
                    await page.waitForSelector('#ctl00_divCenter');
                    
                    await autoScroll(page);
                    const chapterImgs = await page.$$('.reading-detail .page-chapter > img');
                    
                    console.log(chapterImgs.length);
                    for(let i = 0; i < chapterImgs.length; i++){
                    
                      const chapterImgSrc = await page.$eval(`.reading-detail  #page_${i+1} > img`,element=> element.getAttribute("src"))
                      const chapterImgAlt = await page.$eval(`.reading-detail  #page_${i+1} > img`,element=> element.getAttribute("alt"))
                      
                      const chapterImgName = removeVietnameseTones(chapterImgAlt)+'.jpg'
                      
                      //  download(chapterImgSrc,chapterfilepath,chapterImgName, (chapterImgName) => {
                      //    console.log(chapterImgName+ ' downloaded')
                      //  })
                      
                      
                    }


                  // khuc nay la co het chapter img cua 1 chapter r , tao function tao chapter o day di
                  
                  
                } 
          
            }else{
              console.log('do nothing')
            
            }
          })
        }
      }
      await browser.close()
    }catch(e){

    }
    
    

  }

  destroyCategory(req, res, next) {
    Category
    .findOne({_id: req.params._id})
    .then(category => {
      deleteCategoryInComic(category)
    })
    .then(() => {
      deleteCategoryModel(req.params._id)
      req.flash('success-message', `Xóa Category thành công !!`)
      res.redirect('/me/stored/comics/category-list')
    })
    .catch(err => next(err))

    function deleteCategoryInComic(category) {
      category.comic.forEach(comic_id => {
        Comic.findOneAndUpdate(
          { _id: comic_id },
          { $pull: { category: category._id } })
          .then()
          .catch(err => next(err))
      })
    };
    function deleteCategoryModel(category_id) {
      Category.findOneAndRemove({_id: category_id}).exec()
    };
  };
  // -2. Create Categories: [GET] / me / stored / category-list / create
  createCategories(req, res, next) {
    
    const { category } = req.body;

    checkInput(category)
    
    function checkInput(category) {
        Category
          .findOne({ name: category })
          .then(categoryExisted => {
            if (categoryExisted == null) {
              createCategories(category)
            } else {
              req.flash('error-message', `Category <${category}>  đã tồn tại`)
              res
                .status(201)
                .redirect('/me/stored/comics/category-list')
            }
      })
    };

    function createCategories(category) {
      Category
        .create({ name: category })
        .then(() => {
          req.flash('success-message', `Tạo Category thành công !!`)
          res
            .status(201)
            .redirect('/me/stored/comics/category-list')
        })
        .catch(err => next(err))
    }

  };

  // -1. Category List Page: [GET] / me / stored / category-list
  categoryListPage(req, res, next) {
    
    Category.aggregate([
      { $match: { } },
      { $project: { 
        numberOfComics: { $cond: { if: { $isArray: "$comic" }, then: { $size: "$comic" }, else: "NA"} },
        name: "$name",
        // test: { $cond: { if: { $regexMatch: { input: {$reduce: "$comic", } , regex: /test/ } }, then: "$comic", else: "$name"} },
      } }
    ])
    .then(categories => {
      res.status(200).render('me/Pages.Category.List.hbs',
      {
        layout: 'admin',
        user: req.user,
        categories
      })
    })
    .catch(next)
  }
  
  // 0. default: [GET] / me / stored / comics
  adminDashboard(req, res, next) {

    Promise.all([
        Comic.find({ $and: [{ title: { $exists: true } }, { chaptername: { $not: { $exists: true } } }] }).lean()
      , Comic.find({}).lean().select('view title slug').sort({view:-1}).limit(12) // desc
      , Comic.countDocuments({isPublish: true})
      , Comic.countDocuments({isPublish: false})
      , User.find({}).select('banned role name _id').lean()
    ])

      .then(([comics, comicListView, publishedComic, pendingComic, users]) => {
        res.render('me/Dashboard.Admin.hbs',
          {
            layout: 'admin',
            publishedComic, pendingComic,
            comicListView: (comicListView),
            comics: (comics),
            users: users,
            user: req.user,
          })
      })
      .catch(next);
  }

  extraAdminDashboard(req, res, next) {

    Promise.all([Comic.find({ $and: [{ title: { $exists: true } }, { chaptername: { $not: { $exists: true } } }] }), Comic.countDocumentsDeleted()
      , User.find({})]
    )

      .then(([mangas, deletedCount]) =>
        res.render('me/Dashboard.extraAdmin.hbs',
          {
            layout: 'admin',
            deletedCount,
            user: req.user,
          })
      )
      .catch(next);
  }

  faqPage(req, res, next) {
    res.render('me/faqPage.hbs',
      {
        layout: 'admin',
        user: req.user,
      })
  }

  configBannerPage(req, res, next) {
    Config.findOne({category: 'image'}).lean()
      .then(config => {
        res.render('me/Config.banner.hbs',
          {
            layout: 'admin',
            user: req.user,
            title: 'Config - Banner',
            config: config,
            configString: JSON.stringify(config),
            img_url: IMAGE_URL
          })
      })
  }
  
  // 1. comic List Page: [GET] / me / stored / comics / comic-list  + (/:comicId )
  comicListPage(req, res, next) {
    var comicList = new Object()
    // Tức là role admin và route comic-list của admin
    if (req.user.role == "admin" && req.params.comicId == undefined) {
      comicList = Comic.find({})
    } else {
      // Route comic-list của user. VD: comiclist/6084e73384620a19a88780da
      comicList = Comic.find({ userId: req.params.comicId })
    }

    if (req.query.hasOwnProperty('_sort')) {
      comicList = comicList.sort({
        [req.query.column]: [req.query.type] //column=title&type=desc
      })
    }

    authGetProject(comicList, req, res, next)

    async function authGetProject(comicList, req, res, next) {
      var check = await canViewProject(req.user, comicList)
      if (!check) {
        console.log("not ok")
        res.status(401).redirect('/dashboard')
        req.flash('error-message', 'Bạn không đủ điều kiện để xem nội dung này')
      } else {
        console.log("ok")
        dbHelper.comicListPage_Pagination_Helper(comicList, req, res, next, null)
      }
    }


  }

  // 2. Render Create comics Page: [GET] / me / stored / comics / create
  createComicPage(req, res, next) {
    Category
    .find({}).lean()
    .select("_id name")
    .then(categories => {
      res.status(200).render('me/Pages.Comic.Create.hbs',
        {
          layout: 'admin',
          user: req.user,
          categories: categories
        })
    });
  }

  // 3. Create comics: [Post] / me / stored / comics / create [create comic]
  createComic(req, res, next) {
    dbHelper.CreateComic_Helper(req, res, next, null)
  };

  // 4. Edit Page: [GET] / me / stored /comics /:slug / edit
  comicEditPage(req, res, next) {
    dbHelper.comicEditPage_Helper(req, res, next, null)
  }
  // 5. Update comic: [GET] / me / stored / comics / :slug -> update
  updateComic(req, res, next) {
    dbHelper.UpdateComic_Helper(req, res, next, null)

  }

  // 6. Destroy comic: [DELETE] / me / stored / destroyComic / :slug
  async destroyComic(req, res, next) {
    // var comicList = new Object()
    // comicList = await Comic.findOne({ slug: req.params.slug })
    // authDeleteProject(comicList, req, res, next)

    // async function authDeleteProject(comicList, req, res, next) {
    //   var check = await canDeleteProject(req.user, comicList)
    //   if (!check) {
    //     console.log("delete not ok")
    //     res.status(401).redirect('/dashboard')
    //     req.flash('error-message', 'Bạn không đủ điều kiện để delete nội dung này')
    //   } else {
    //     console.log("delete ok")
    //     dbHelper.destroyComic_Helper(req, res, next, null)
    //   }
    // }
    dbHelper.destroyComic_Helper(req, res, next, null)

  }

  // 7. Handle Form Action Comic: [POST] / me / stored / handle-form-action-for-comic
  async handleFormActionForComics(req, res, next) {
    dbHelper.handleFormActionForComics_Helper(req, res, next, null)
  }








  // 8. Render ChapterList: [GET] / me / stored / comics / :slug / chapter-list
  chapterListPage(req, res, next) {
    var chapterList = Chapter.find({ comicSlug: req.params.slug }).lean()
    var chapterLength = Chapter.countDocuments({ comicSlug: req.params.slug })
    dbHelper.chapterListPage_Helper(chapterList, chapterLength, req, res, next, null)
    
  }

  // 9. Render create Chapter: [GET] / me / stored / comics / :slug / create-chapter
  createChapterPage(req, res, next) {
    var linkComics = req.params.slug;
    res.status(200).render('me/Pages.Chapter.Create.hbs', {
      layout: 'admin',
      linkComics,
    })
  }

  // 10. destroy Chapter
  destroyChapter(req, res, next) {
    dbHelper.destroyChapter_Helper(req, res, next, null)
  }

  // 11. Handle Form Action Chapter: [POST] / me / stored / handle-form-action-for-comic
  async handleFormActionForChapters(req, res, next) {
    dbHelper.handleFormActionForChapters_Helper(req, res, next, null)
  }

}

//export (SiteController) thì lát require nhận được nó
module.exports = new meController();
