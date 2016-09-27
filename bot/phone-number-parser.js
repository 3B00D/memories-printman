var PhoneNumberParser = function() {

    var minimum = 9;            // typical minimum phone number length
    this.items = [];

    var public = PhoneNumberParser.prototype;
    public.parse = function(str) {
        var items = this.items = [];

        var i = 0, n = '', min = minimum;

        while(i < str.length) {
            switch(str[i]) {
            case '+':                                   // start of international number
                if (n.length >= min) items.push(n);
                n = str[i];
                min = minimum + 2;                      // at least 2 more chars in number
                break;
            case '-': case '.': case '(': case ')':     // ignore punctuation
                break;
            case ' ':
                if (n.length >= min) {              // space after consuming enough digits is end of number
                    items.push(n);
                    n = '';
                }
                break;
            default:
                if (str[i].match(/[0-9]/)) {            // add digit to number
                    n += str[i];
                    if (n.length == 1 && n != '0') {
                        min = 3;                        // local number (extension possibly)
                    }
                } else {
                    if (n.length >= min) {
                        items.push(n);                  // else end of number
                    }
                    n = '';
                }
                break;
            }
            i++;
        }

        if (n.length >= min) {              // EOF
            items.push(n);
        }
    }

    public.placeCall = function(i) {
        if (i < this.items.length) {
            var a = document.createElement("a");
            a.href = "tel:"+this.items[i];
            var e = document.createEvent('MouseEvents');
            e.initMouseEvent('click', true, true);
            a.dispatchEvent(e);
        }
    }
};

module.exports = PhoneNumberParser;