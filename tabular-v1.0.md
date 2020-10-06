# tabularjs v1.0

(c) Jose Luis Salinas <https://github.com/jotaelesalinas>

Reads and converts text from/to Excel (as tab-separated values) and JS objects

## To do

- [ ] add tests
- [ ] method toCsv(sep = ',', quote = '"')
- [ ] method toJson() --> shortcut for JSON.stringify(<tabular object>.toObjectArray())
- [ ] static method fromTsv(data)
- [ ] static method fromObjectArray(data)
- [ ] static method fromCsv(data)
- [ ] static method fromJson(data)
- [ ] static method fromExcelFile(file, xlsx "instance") --> used for drag'n'drop
- [ ] static method fromFile(file) --> used for drag'n'drop, try to guess file type
- [ ] method downloadAsTsv(filename)
- [ ] method downloadAsCsv(filename)
- [ ] method downloadAsJson(filename)
- [ ] method downloadAsText(filename) --> github markdown table?
- [ ] method downloadAsExcel(filename, xlsx "instance") --> needs xlsx.js, passed as argument

## Changelog

v1.0, 2020-10-06
Initial release.

## License

Released under the MIT license.
