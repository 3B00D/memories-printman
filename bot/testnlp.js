nlp = require('nlp_compromise');

var result=nlp.text('John fuck node js').people();
console.log(result);

var result=nlp.text('Hi my name is Sam Abdalhamid Mog').people();
console.log(result);