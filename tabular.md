# tabularjs v1.0

(c) Jose Luis Salinas <https://github.com/jotaelesalinas>

Reads and converts text from/to Excel (as tab-separated values) and JS objects

## Usage

You can pass either a string with tab-separated values (as copied and pasted from Excel) or
an array of objects.

```javascript
let sample_input_tsv = `Col 1	Col 2	col-1
a	b	c
1	2	3
d	e	
g		i`;

let sample_input_objarr = [
    {"Col 1": 'a', "Col 2": 'b', "col-1": 'c'},
    {"Col 1": '1', "Col 2": '2', "col-1": '3'},
    {"Col 1": 'd', "Col 2": 'e'              },
    {"Col 1": 'g',               "col-1": 'i'},
];

let tab1 = new Tabular(sample_input_tsv);
let tab2 = new Tabular(sample_input_objarr);
```

Now, both `tab1` and `tab2` have the same _internal data representation_ and both of them will
output the same results.

```javascript
let tsv1 = tab1.toTsv();
let tsv2 = tab2.toTsv();
let objarr1 = tab1.toObjArr();
let objarr2 = tab2.toObjArr();
let html1 = tab1.toHtml();
let html2 = tab2.toHtml();
```

Bear in mind that the _headers_ or _column names_ are normalized before generating the output:

1. The column name is slugified using underscores `_` instead of dashes `-`.
2. If a column name is repeated, an underscore and a sequential number (starting with 2) is appended.

In this sample case, the output headers are:

```
col_1
col_2
col_1_2
```

## To do (pull requests _with tests_ are very welcome)

- [ ] add tests
  - [x] load TSV
  - [x] load object array
  - [x] to TSV
  - [x] to object array
  - [ ] to HTML

- [x] add usage instructions to this file

- [ ] method toCsv(sep = ',', quote = '"') --> must accept also Csv
  - [ ] static method _csvToRaw(data, sep = ',', quote = '"')
- [ ] method toJson() --> shortcut for JSON.stringify(<tabular object>.toObjectArray())
  - [ ] static method _jsonToRaw(data) --> shortcut for new Tabular(JSON.parse(data))
- [ ] method downloadAsExcel(filename, xlsx "instance") --> needs xlsx.js passed as argument <https://github.com/SheetJS/sheetjs#installation>
- [ ] static method fromExcelFile(file, xlsx "instance") --> used for drag'n'drop

- [ ] method downloadAsCsv(filename)
- [ ] method downloadAsTsv(filename)
- [ ] method downloadAsJson(filename)
- [ ] method toMarkdown()
- [ ] method downloadAsMarkdown(filename)

- [ ] static method fromFile(file) --> used for drag'n'drop, try to guess file type
- [ ] static method fromTsv(data)
- [ ] static method fromObjectArray(data)
- [ ] static method fromCsv(data)
- [ ] static method fromJson(data)

## Changelog

v1.0, 2020-10-06
Initial release.

## License

Released under the MIT license.
