nlp = require('nlp_compromise');

var result=nlp.text('Hi my name is Sam Abdalhamid Mog').people(); // first name , last name
//console.log(result);

//console.log(nlp.sentence('Glomac Damansara, Kuala Lumpur, Malaysia').places()); // address

console.log(nlp.text('my phone number is 43897').match('my phone *'));

// 