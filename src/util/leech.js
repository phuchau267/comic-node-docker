const puppeteer = require('puppeteer');
const removeVietnameseTones = require('../config/middleware/VnameseToEng');
const download = require('./download-file');
const path = require('path');
const Comic = require('../app/models/Comic')
const filepath = path.resolve(__dirname,'../public/leech-img')


module.exports = (async () => {
    

    // Comic.find({}).lean()
    // .select('title')
    // .then(comic => {
    //     console.log(comic)
    // })
    

    
    // try{
    //     const browser = await puppeteer.launch({ 
    //         headless: true,
           
           
    //     });
    //     const page = await browser.newPage();
    //     await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36 Edg/95.0.1020.40');

    //     await page.goto('http://www.nettruyenpro.com/');
        
    //     await page.waitForSelector('#ctl00_divCenter')
        

    //     const comics = await page.$$('#ctl00_divCenter .item')
    //     console.log(comics.length)
    //     for(let i = 0; i < comics.length; i++){
            
    //         await page.goto('http://www.nettruyenpro.com/');
    //         await page.waitForSelector('#ctl00_divCenter')
    //         await autoScroll(page);
            
            
    //         const comics = await page.$$('#ctl00_divCenter .item')
    //         const comic = comics[i];
            
    //         const comicLink = await comic.$('a')
            
    //         await comicLink.click()

    //         await page.waitForSelector('#item-detail')
            
    //         const comicName = await page.evaluate(() => document.querySelector('#item-detail > .title-detail').textContent);
    //         const comicImg = await page.$eval("#item-detail img",
    //             element=> element.getAttribute("src"))
            
    //         download(comicImg,filepath, (comicName) => {
    //             console.log(comicName+ ' downloaded')
    //         })
           
              
            
    //         console.log(comicName);
           
    //     }
    //     await browser.close()
    //     console.log('leech function runned')
    // }catch(e){
    //     console.log('leech error', e)
    // }
    
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