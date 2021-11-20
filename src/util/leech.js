const puppeteer = require('puppeteer');
const removeVietnameseTones = require('../config/middleware/VnameseToEng');
const download = require('./download-file');
const path = require('path');
const Comic = require('../app/models/Comic')
const thumbnailFilepath = path.resolve(__dirname,'../public/leech-img')
const chapterImgFilepath = path.resolve(__dirname,'../public/leech-chapter-img')


module.exports = (async () => {
    try{

        setInterval(async () => {
            
            const browser = await puppeteer.launch({ 
                headless: false,
            });
            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36 Edg/95.0.1020.40');
    
            
            const allComic = await Comic.find({}).lean().select('title')
           
            console.log(allComic.length)
            for(i = 0; i < allComic.length; i++){
                const currentComicTitle = allComic[i].title
                var chaptersNeedLoop
                
                            
                await page.goto('http://www.nettruyenpro.com/');
                await page.waitForSelector('.searchinput ')
                const searchSubmit = await page.$('.input-group-btn input')
                await page.type('.searchinput', currentComicTitle)
                
                await searchSubmit.click()
                const comicItem = await page.$('.item .image a')
                await comicItem.click()
                var currentPage = page.url();
                await page.waitForSelector('#item-detail')
                await autoScroll(page);
                const seeMoreChapter = await page.$('a.view-more')
                if(seeMoreChapter){
                await seeMoreChapter.click()
                }
                
                
                
                
                const chapters = await page.$$('#item-detail  .chapter > a') // tong so chapter co tren nettruyen
               
                const dtbChapter = await Comic.findOne({title:currentComicTitle}).lean()
                                                .select('chapters')
                                                console.log('so luong chapter trong dtb '+dtbChapter.chapters.length)
                chaptersNeedLoop = chapters.length - dtbChapter.chapters.length
                if(chaptersNeedLoop > 0){
                    for(let i = 0; i < chaptersNeedLoop; i++){

                    // khuc nay vong lap lay tat ca img trong tung chap

                    await page.goto(currentPage);
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
                        // download(chapterImgSrc,chapterImgFilepath,chapterImgName, (chapterImgName) => {
                        //   console.log(chapterImgName+ ' downloaded')
                        // })
                        
                        
                    }


                        // khuc nay la co het chapter img cua 1 chapter r , tao function tao chapter o day di


                    
                    } 
                }
                
            }
            await browser.close()

        },10000000);
    }catch(e){
        console.log(e)
    }
    

    

    

    
  
    
})
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