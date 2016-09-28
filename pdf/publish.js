var htmlToPdf = require('html-to-pdf');
var fs = require('fs');

html="";
fs.readFile('1.html', 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }
  
  var imagepath = "https://s3.amazonaws.com/printman-assets/themes/kids/kids1/2.jpg";
  var data = data.replace("##img1##", imagepath);
  html=data;
  

  htmlToPdf.convertHTMLString(html, 'book.pdf',
    function (error, success) {
        if (error) {
            console.log('Oh noes! Errorz!');
            console.log(error);
        } else {
            console.log('Woot! Success!');
            console.log(success);
        }
    }
    );
});

