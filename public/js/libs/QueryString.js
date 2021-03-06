/**
 * Query String Parser
 *
 * Parse URL querystrings, extract keys and values, manipulate them, and
 * re-serialize with minimal munging.
 *
 * This horrid querystring will be interpreted as follows:
 *  Input: ??a=b&foo=bar&with+space=also%20space&foo=baz&mult=iple=equals&blank=&missing&&&
 *  Output:  Key          | .values(key)
 *           ============================
 *           '?a'         | ['b']
 *           'foo'        | ['bar', 'baz']
 *           'with space' | ['also space']
 *           'foo'        | ['baz']
 *           'mult'       | ['iple=equals']
 *           'blank'      | ['']
 *           'missing'    | [null]
 *           'XXX'        | []
 *
 * Data model:
 * - Keys are strings, possibly empty. A key may be repeated.
 * - Values are strings, possibly empty, or null (when there is no '=').
 * - Order of key-value pairs is preserved.
 * - Encoding details are preserved where possible. If QS receives input
 *   with alphanumerics needlessly URL-encoded, it will preserve that for
 *   output.
 * - Not preserved: Leading, trailing, or multiple consecutive ampersands
 *
 * API:
 * - Constructor: Explicit querystring, or default to current URL's querystring
 * - Methods:
 *   - .keys(): List of keys in arbitrary order
 *   - .value(key): Last value of key, or undefined
 *   - .values(key): Array of values of key, in order
 *   - .plus(key, val): New QS with pair added to end
 *   - .minus(key): New QS without any pairs for the key
 *   - .minus(key,val): New QS without any pairs matching both key and val
 *   - .pairs(): Array of [key, val] arrays, in order.
 *   - .toString(): Serialize as "" or "?...&..."
 * - Constants:
 *   - .blank: Empty QueryString, for convenience
 * - Functions:
 *   - .fromDict(d): Build a QueryString from a dictionary
 *
 * QueryString objects are intended to be immutable. The plus and minus
 * methods return new objects that may share some structure with their
 * previous incarnations, so meddling with internals may have surprising
 * consequences.
 *
 * The instance methods are also presented unbound as functions in
 * QueryString.fns. For example: QueryString.fns.plus(someQS, "key", "val").
 *
 * This is based on public domain code written in 2011 by Jan Wolter and
 * distributed at <http://unixpapa.com/js/querystring.html>. Modifications
 * in 2012 by Tim McCormack -- still under public domain. Tim McCormack's
 * version is maintained at <https://github.com/timmc/js-tools/>.
 *
 * @author Jan Wolter
 * @author Tim McCormack
 */

//== Constructor ==//

/**
 * Construct a QueryString object from current location or provided string.
 * If a string is provided, it should either start with a '?' or be empty.
 * Safe to call without "new" keyword.
 *
 * @constructor
 * @this {QueryString}
 * @param {string} qs Optional querystring -- should start with '?' or be empty
 */
function QueryString(qs) {
    // If no query string  was passed in use the one from the current page
    if (arguments.length === 0) { qs = location.search; }

    // in case 'new' was omitted
    if (!(this instanceof QueryString)) { return new QueryString(qs); }

    // QS values may be either a string (possibly empty) or null.

    /* Dictionary of decoded keys to non-empty lists of decoded values. */
    this.dict = {};
    /* List of key/value pairs in order as map with both encoded and decoded
     * strings for each (or possibly undefined in the case of values.)
     * Map keys: key_enc, key_dec, val_enc, val_dec
     * val_enc and val_dec may be === null.
     */
    this.alist = [];

    //TODO: Move parsing code into separate fn

    // Delete leading question mark, if there is one
    if (qs.charAt(0) == '?') qs = qs.substring(1);

    // Parse it
    var re = /([^=&]+)(=([^&]*))?/g;
    while (match = re.exec(qs)) {
        var key_enc = match[1];
        var val_enc = match[3];
        val_enc = val_enc === undefined ? null : val_enc;

        var key_dec = decodeURIComponent(key_enc.replace(/\+/g,' '));
        var val_dec = val_enc === null ? null : QueryString.decode(val_enc);

        if (this.dict[key_dec]) {
            this.dict[key_dec].push(val_dec);
        } else {
            this.dict[key_dec] = [val_dec];
        }
        this.alist.push({key_enc:key_enc, key_dec:key_dec,
                         val_enc:val_enc, val_dec:val_dec});
    }
}

//== Internal static utility functions ==//

/**
 * Map over a dictionary, replacing vals.
 * @private
 * @param {object} d An input dictionary
 * @param {function} fkv Binary function of [key, value -> value]
 * @return {object} A new dictionary with vals as produced by fkv.
 */
QueryString.mapDict = function mapDict(d, fkv) {
    var ret = {};
    for(var k in d) {
        if (!d.hasOwnProperty(k)) { continue; }
        var replace = fkv(k, d[k]);
        if (replace !== undefined) {
            ret[k] = replace;
        }
    }
    return ret;
};

/**
 * Filter an array using a unary filtering function.
 * @private
 * @param {array} arr An input array
 * @param {function} fe Unary function of [{?} -> {boolean}]
 * @return {array} A new array with values approved by the filtering function.
 */
QueryString.filter = function filter(arr, fe) {
    var ret = [];
    for (var i=0; i < arr.length; i++) {
        if (fe(arr[i])) {
            ret.push(arr[i]);
        }
    }
    return ret;
};

/**
 * This static method is an error tolerant version of the builtin
 * function decodeURIComponent(), modified to also change pluses into
 * spaces, so that it is suitable for query string decoding. You
 * shouldn't usually need to call this yourself as the value(),
 * values(), and keys() methods already decode everything they return.
 * @private
 * @param {string} s URL-encoded string
 * @return {string}
 */
QueryString.decode = function decode(s) {
    s= s.replace(/\+/g,' ');
    s= s.replace(/%([EF][0-9A-F])%([89AB][0-9A-F])%([89AB][0-9A-F])/g,
        function(code,hex1,hex2,hex3) {
            var n1= parseInt(hex1,16)-0xE0;
            var n2= parseInt(hex2,16)-0x80;
            if (n1 == 0 && n2 < 32) return code;
            var n3= parseInt(hex3,16)-0x80;
            var n= (n1<<12) + (n2<<6) + n3;
            if (n > 0xFFFF) return code;
            return String.fromCharCode(n);
        });
    s= s.replace(/%([CD][0-9A-F])%([89AB][0-9A-F])/g,
        function(code,hex1,hex2) {
            var n1= parseInt(hex1,16)-0xC0;
            if (n1 < 2) return code;
            var n2= parseInt(hex2,16)-0x80;
            return String.fromCharCode((n1<<6)+n2);
        });
    s= s.replace(/%([0-7][0-9A-F])/g,
        function(code,hex) {
            return String.fromCharCode(parseInt(hex,16));
        });
    return s;
};

/**
 * The approximate inverse of QueryString.decode.
 * @private
 * @param {string} s any string
 * @return {string} URL-encoded string
 */
QueryString.encode = function encode(s) {
    return encodeURIComponent(s).replace(/%20/g, '+');
};

/**
 * Coerce an input to a string, unless it is null.
 * @private
 * @param {*} val Any value
 * @return {string|null}
 */
QueryString.coerceValue = function coerceValue(val) {
    return (val === null) ? val : String(val);
};

//== Instance methods ==//

/**
 * Return first value for the named key. If the key was not defined,
 * it will return undefined. If the key was multiply defined it will
 * return the last value set.
 * @param {string} key Key to query for.
 * @return {string|null|undefined} Last value for key, or undefined
 */
QueryString.prototype.value = function value(key) {
    if (!this.dict.hasOwnProperty(key)) return;
    var vs = this.dict[key];
    return vs[vs.length-1];
};

/**
 * Return an array of values for the named key, possibly empty.
 * @param {string} key Key to query for.
 * @return {array} Possibly empty array of values.
 */
QueryString.prototype.values = function values(key) {
    return this.dict.hasOwnProperty(key) ? this.dict[key] : [];
};

/**
 * Return an array of *unique* keys in the query string in some order.
 * @return {array} Possibly empty array of the set of key names.
 */
QueryString.prototype.keys = function keys() {
    var a= [];
    for (var key in this.dict) {
        if (!this.dict.hasOwnProperty(key)) continue;
        a.push(key);
    }
    return a;
};

/**
 * Create a new QueryString object with an additional key/value pair.
 * @param {string} k Key of pair to add
 * @param {string|null} v Value of pair to add
 * @return {QueryString} new QueryString object
 */
QueryString.prototype.plus = function plus(k, v) {
    var v = QueryString.coerceValue(v);
    var retQS = new QueryString("");
    if (this.dict.hasOwnProperty(k)) {
        retQS.dict = QueryString.mapDict(this.dict, function(ok, ovs) {
            if (ok !== k) return ovs;
            var retVs = ovs.slice();
            retVs.push(v);
            return retVs;
        });
    } else {
        retQS.dict = QueryString.mapDict(this.dict, function(_, vs) {
            return vs;
        });
        retQS.dict[k] = [v];
    }
    retQS.alist = this.alist.slice();
    retQS.alist.push({key_enc:QueryString.encode(k),
                      key_dec:k,
                      val_enc:v === null ? null : QueryString.encode(v),
                      val_dec:v});
    return retQS;
};

/**
 * Create a new QueryString object without any copies of specified param.
 * If called as unary function without(k), params are removed without
 * checking the value.
 * @param {string} k Key to remove
 * @param {string|null} v
 * @return {QueryString} new QueryString object
 */
QueryString.prototype.minus = function minus(k, v) {
    var v = QueryString.coerceValue(v);
    var checkVals = arguments.length === 2;
    var retQS = new QueryString("");
    retQS.dict = QueryString.mapDict(this.dict, function(ok, ovs) {
        if (checkVals) {
            var vs = QueryString.filter(ovs, function(el) { return el !== v; });
            return vs.length === 0 ? undefined : vs;
        } else {
            return ok === k ? undefined : ovs;
        }
    });
    retQS.alist = QueryString.filter(this.alist, function(pair) {
        var matches = pair.key_dec === k && (!checkVals || pair.val_dec === v);
        return !matches;
    });
    return retQS;
};

/**
 * Return an decoded key-value pairs.
 * @return {array} Array of key-value pair arrays, in order.
 */
QueryString.prototype.pairs = function pairs() {
    var ret = [];
    for(var i=0; i<this.alist.length; i++) {
        ret.push([this.alist[i].key_dec, this.alist[i].val_dec]);
    }
    return ret;
}

/**
 * Convert QueryString object back into a URL query-string.
 * @return {string} querystring that starts with a '?' or is empty
 */
QueryString.prototype.toString = function toString() {
    var al = this.alist;
    if (al.length === 0) { return ""; }
    var ret = "";
    for (var i=0; i<al.length; i++) {
        var pair = al[i];
        ret += "&" + pair.key_enc;
        if (pair.val_enc !== null) {
            ret += '=' + pair.val_enc;
        }
    }
    return '?' + ret.substring(1);
};

/*== Public utilities ==*/

/**
 * A blank querystring that may be used to build up a new qs.
 */
QueryString.blank = new QueryString("");

/**
 * Build a QueryString from a dictionary. Values that are not strings,
 * null, or undefined are coerced to strings.
 * @param {Object} d Dictionary of keys to values.
 * @return {QueryString} Instance containing dict key/value pairs in
 *   some order.
 */
QueryString.fromDict = function fromDict(d) {
    var retQS = QueryString.blank;
    for (var key in d) {
        if (!d.hasOwnProperty(key)) continue;
        retQS = retQS.plus(key, QueryString.coerceValue(d[key]));
    }
    return retQS;
};

/*== Instance functions ==*/

(function makeAdapters() {
    QueryString.fns = {};
    var restArgs = "Array.prototype.slice.call(arguments, 1)";
    function adapt(methName) {
        var body = "return qs['"+methName+"'].apply(qs, "+restArgs+");"
        QueryString.fns[methName] = Function("qs", body);
    }
    adapt('keys');
    adapt('value');
    adapt('values');
    adapt('minus');
    adapt('plus');
    adapt('pairs');
    adapt('toString');
})();

