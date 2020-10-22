/*
 * tabularjs v1.0
 * 
 * (c) Jose Luis Salinas <https://github.com/jotaelesalinas>
 * 
 * Reads and converts text from/to Excel (as tab-separated values) and JS objects.
 * 
 * See tabular.md for details.
 *
 * Released under the MIT license.
 */

/**
 * Create a Tabular object.
 * @param data TSV string or array of JS objects
 * @constructor
 */
Tabular = function (data) {
    this._raw = null;
    
    if (data.constructor.name == 'String') {
        this._raw = Tabular._tsvToRaw(data);
    } else if (data.constructor.name == 'Array') {
        this._raw = Tabular._objectArrayToRaw(data);
    } else {
        throw 'Tabular(): Wrong data format.';
    }
}

/**
 * Get the data as tab-separated-values.
 * @returns {string}
 */
Tabular.prototype.toTsv = function () {
    if (this._raw.length > 0) {
        this._raw[0] = Tabular._makeHeaders(this._raw[0]);
    }
    return this._raw.map(row => row.join("\t")).join("\n");
};

/**
 * Get the data as an array of objects.
 * @returns {array} Array of vanilla objects
 */
Tabular.prototype.toObjectArray = function () {
    const first_line = this._raw.shift();
    const headers = Tabular._makeHeaders(first_line);
    var data = this._raw.map(line => Tabular._makeObjectFromRawEntry(line, headers));
    this._raw.unshift(first_line);
    return data;
};


/**
 * Get the data as an HTML table.
 * @param css_class_func A funcion to provide CSS classes for the table, rows and cells.
 *   It accepts one of these combination of arguments:
 *     - function ('table') { ... }
 *     - function ('row', row_contents, row_index) {}
 *     - function ('cell', row_contents, row_index, cell_contents, cell_index) {}
 *   and should return a class to be applied or null.
 *   the headers row is row[0].
 * @returns {string}
 */
Tabular.prototype.toHtml = function (css_class_func) {
    if (typeof css_class_func != 'function') {
        css_class_func = () => null;
    }
    
    var openTag = (tag, css) => '<' + tag + (css ? ' class="' + css + '"' : '') + '>';

    var html = [];
    
    html.push(openTag('table', css_class_func('table', this._raw)));
    this._raw.forEach((row, row_idx) => {
        html.push(openTag('tr', css_class_func('row', row, row_idx)));
            row.forEach((cell, cell_idx) => {
                var tag = row_idx == 0 ? 'th' : 'td';
                html.push(
                    openTag(tag, css_class_func('cell', row, row_idx, cell, cell_idx)) +
                    cell +
                    '</' + tag + '>'
                );
            });
        html.push('</tr>');
    });
    html.push('</table>');
    
    return html.join("\n");
};

// Converts TSV to the internal format of the data
Tabular._tsvToRaw = function (data) {
    return data.replace(/\r/g, '')
               .split(/\n/g)
               .filter(x => x.trim() !== '')
               .map(x => x.split(/\t/g));
};

// Converts an array of objects to the internal format of the data
Tabular._objectArrayToRaw = function (data) {
    if (data.constructor.name != 'Array') {
        throw "Tabular._objectArrayToRaw(): data must be of type Array.";
    }
    
    data = data.map(x => {
            if (x.constructor.name == 'Object') {
                return x;
            } else if (typeof x.toObject == 'function') {
                var obj = x.toObject();
                if (obj.constructor.name != 'Object') {
                    throw "Tabular._objectArrayToRaw(): returned value from toObject() is not an object.";
                }
                return obj;
            } else {
                throw "Tabular._objectArrayToRaw(): not all items are objects or implement toObject().";
            }
        });
    
    var headers = Tabular._allKeysFromObjectArray(data);
    
    var rows = [];
    rows.push(headers);
    rows.push(...data.map(item => headers.map(h => typeof item[h] != 'undefined' ? item[h] : '')));
    
    return rows;
};

// Slugifies text using "_" as separator
Tabular._textToColumnHeader = function (text) {
    return text.replace(/\W+/g, ' ').trim().replace(/\s+/g, '_').toLowerCase();
};

// Creates an array of headers (column names) from a line of the raw data,
// making sure that names are not repeated by adding "_2", "_3", and so on
Tabular._makeHeaders = function (line) {
    var headers = line.map(Tabular._textToColumnHeader);
    
    headers.forEach((header, colnum) => {
        if ( headers.indexOf(header) == colnum ) {
            return;
        }
        
        var n = 2;
        while ( headers.indexOf(header + '_' + n) > -1 ) {
            n++;
        }
        headers[colnum] = header + '_' + n;
    } );
    
    return headers;
};

// Creates an object out of an entry in the raw data and the headers
Tabular._makeObjectFromRawEntry = function (line, headers) {
    var row = {};
    for ( var i = 0, l = headers.length; i < l; i++ ) {
        row[headers[i]] = typeof line[i] !== 'undefined' ? line[i] : null;
    }
    return row;
};

// Tells whether a value is the first occurrence in an array
// (meant to be used as callback of Array.filter())
Tabular._isFirstInArray = function (value, index, arr) {
    return arr.indexOf(value) === index;
};

// Gets all the properties from the passed objects
Tabular._allKeysFromObjectArray = function (data) {
    var cols = [];
    data.map(x => Object.keys(x))
        .forEach(x => cols.push(...x));
    
    return cols.filter(Tabular._isFirstInArray);
};
