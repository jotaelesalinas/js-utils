/*
 * tabularjs v2.0
 * (c) Jose Luis Salinas <https://github.com/jotaelesalinas>
 * Reads and converts text from/to Excel (as tab-separated values) and JS objects.
 * See tabular.md for details.
 * Released under the MIT license.
 */

class Tabular {
    constructor(data) {
        if (Tabular.isTable(data)) {
            this.data = data;
        } else if (Tabular.isText(data)) {
            this.data = Tabular.tsvToTable(data);
        } else if (Tabular.isArray(data)) {
            this.data = Tabular.arrayToTable(data);
        } else {
            throw new Error("Unknown data type.");
        }

        this.snaked = false;
    }

    static _snakify(text) {
        return text.replace(/\W+/g, ' ').trim().replace(/\s+/g, '_').toLowerCase();
    }

    // Slugifies text using "_" as separator
    snakeHeaders() {
        if (this.data.length === 0) {
            return;
        }
        this.data[0] = this.data[0].map(Tabular._snakify);

        this.snaked = true;
        return this;
    };

    reorderColumns(column_names) {
        if (!column_names || !Array.isArray(column_names)) {
          throw new Error("Invalid column names argument. Must be an array of strings.");
        }
      
        if (this.snaked) {
            column_names = column_names.map(Tabular._snakify);
        }

        const existing_columns = new Set(this.data[0]);
        column_names.forEach(name => {
            if (!existing_columns.has(name)) {
                throw new Error(`Column name "${name}" does not exist in the data.`);
            }
        });
      
        const old_order_map = new Map();
        this.data[0].forEach((col_name, idx) => old_order_map.set(col_name, idx));

        // Map column names to their new order
        const new_order_map = new Map();
        column_names.forEach((col_name, idx) => new_order_map.set(col_name, idx));
        this.data[0].forEach(col_name => {
            if (!new_order_map.has(col_name)) {
                new_order_map.set(col_name, new_order_map.size);
            }
        });
      
        if (new_order_map.size() !== this.data[0].length) {
            throw new Error("Error while reordering the headers.");
        }

        const old_idx_to_new_idx = new Map();
        new_order_map.forEach((col_name, new_idx) => old_idx_to_new_idx.set(old_order_map.get(col_name), new_idx))

        // Reorder data rows based on header order
        this.data = this.data.map(row => {
            let arr = [];
            old_idx_to_new_idx.forEach((old_idx, new_idx) => arr[new_idx] = row[old_idx]);
            return arr;
        });

        return this;
    }
      
    dedupHeaders() {
        this.data[0].forEach((cell_value, colnum) => {
            if (this.data[0].indexOf(cell_value) === colnum) {
                return;
            }
            
            var n = 2;
            while (this.data[0].indexOf(cell_value + '_' + n) > -1) {
                n++;
            }
            this.data[0][colnum] = cell_value + '_' + n;
        } );
        
        return this;
    };

    toTsv() {
        return this.data.map(row => row.join("\t")).join("\n");
    }
    
    toCsv() {
        return this.data.map(row =>
            row.map(cell => {
                if (cell.indexOf('"') >= 0 || cell.indexOf(',') >= 0) {
                    cell = '"' + cell.replace(/"/g, '""') + '"';
                }
                return cell.toString();
            }).join(',')
        ).join("\n");
    };

    /**
     * Downloads the data as an Excel file.
     * @param {string} filename 
     * @param {XLSX} xlsx XLSX object from http://sheetjs.com
     */
    downloadAsExcel(filename, xlsx) {
        if (typeof xlsx == 'undefined' || !xlsx) {
            throw new Error("Missing XLSX object in Tabular.downloadAsExcel().");
        }
        
        var wb = xlsx.utils.book_new(),
            ws = xlsx.utils.aoa_to_sheet(this.data);
        
        xlsx.utils.book_append_sheet(wb, ws);
        
        if (typeof filename == 'undefined') {
            filename = 'download';
        }
        
        if (!filename.match(/\.xlsx?$/i)) {
            filename += '.xlsx';
        }
        
        xlsx.writeFile(wb, filename);
    };

    toArray() {
        const headers = this.data.shift();
        const objs = this.data.map(row => Object.fromEntries(headers.map((h, i) => [h, row[i]])));
        this.data.unshift(headers);
        return objs;
    };

    copyToClipboard() {
        return navigator.clipboard.writeText(this.toTsv());
    };

    /**
     * Get the data as an HTML table.
     * @param css_class_func A funcion to provide CSS classes for the table, rows and cells.
     *   It accepts one of these combination of arguments:
     *     - function ('table', all_data) { ... }
     *     - function ('row', all_data, row_contents, row_index) { ... }
     *     - function ('cell', all_data, row_contents, row_index, cell_contents, cell_index) { ... }
     *   and should return a class to be applied or null.
     *   the headers row is row[0].
     * @returns {string}
     */
    toHtmlTable(css_class_func) {
        css_class_func = css_class_func ?? (() => null);
        
        const openTag = (tag, css) => "<" + tag + (css ? ' class="' + css + '"' : "") + ">";
        const closeTag = (tag) => '</' + tag + '>';

        let html = [];
        
        html.push(openTag("table", css_class_func("table", this.data)));
        this.data.forEach((row, row_idx) => {
            html.push(openTag("tr", css_class_func("row", this.data, row, row_idx)));
                row.forEach((cell, cell_idx) => {
                    let tag = row_idx == 0 ? "th" : "td";
                    html.push(
                        openTag(tag, css_class_func("cell", this.data, row, row_idx, cell, cell_idx)) +
                        cell +
                        closeTag(tag)
                    );
                });
            html.push(closeTag("tr"));
        });
        html.push(closeTag("table"));
        
        return html.join("\n");
    };

    static from(data) {
        return new Tabular(data);
    }

    static isTable(data) {
        return data.constructor.name == "Array" &&
               data.length > 0 &&
               data[0].constructor.name == "Array";
    }

    static isText(data) {
        return typeof data === "string";
    }

    static isArray(data) {
        return data.constructor.name == "Array" &&
               data.length > 0 &&
               data[0].constructor.name == "Object";
    }

    static tsvToTable(data) {
        return data.split(/\r?\n/g)
                   .filter(x => x.trim() !== "")
                   .map(x => x.split(/\t/g));
    };

    static arrayToTable(data) {
        const add_keys_to_map = (map, obj) => {
            Object.keys(obj).forEach(key => map.set(key, 1));
            return map;
        };
        const keys = [...data.reduce(add_keys_to_map, new Map()).keys()];

        return [
            keys,
            ...data.map(obj => keys.map(k => obj[k] ?? ""))
        ];
    }
}
