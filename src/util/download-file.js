const fs = require('fs-extra')
const path = require('path');
const https = require('https');
const http = require('http');
const URL = require('url');

module.exports = function download(url,filepath,filename,callback){
    var urlProtocol = url.protocol
    
    if (urlProtocol === undefined){
        url = 'http:'+url
        urlProtocol = http
    }
    

    const req = urlProtocol.get(url,(res) => {
        const fileStream = fs.createWriteStream(path.resolve(filepath,filename));
        res.pipe(fileStream);

        fileStream.on('error',(err) => {
            console.log('error writing to the stream');
            console.log(err);
        });

        fileStream.on('close', () => {
            callback(filename)
        })
        fileStream.on('finish',function(){
            fileStream.close();
          
        })
    })
    req.on('error', function(err) {
        console.log('err downloading the file')
        console.log(err)
    })
}

