/*
nlp = require('nlp_compromise');

var result=nlp.text('John fuck node js').people();
console.log(result);

var result=nlp.text('Hi my name is Sam Abdalhamid Mog').people();
console.log(result);
*/
var natural = require('natural'),
    TfIdf = natural.TfIdf,
    tfidf = new TfIdf();

tfidf.addDocument('Hey, Hey man, or Hi');
tfidf.addDocument('what\'s up, Whats up?, Whats new?, or Whats going on?');
tfidf.addDocument('this document is about ruby and node.');

tfidf.tfidfs("what's up", function(i, measure) {
    console.log('document #' + i + ' is ' + measure);
});