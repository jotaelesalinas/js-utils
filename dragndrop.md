# dragndrop v1.0

(c) Jose Luis Salinas <https://github.com/jotaelesalinas>

Add dran'n'drop capabilities to an HTML element.

## Usage

One liner:

```javascript
Dragndrop(element, mapper = null, eventHandlers = null);
```

Where:

- `element` is a DOM object descendant of HTMLElement (`element instanceof HTMLElement == true`)
  or an element's id (`document.getElementById(element)`) or a selector (`document.querySelector(element)`).

- `mapper` is a function that accepts the contents of a file and the file from the File API.

- `eventHandlers` is an object (associative array) in which the key is one of the possible values in `Dragndrop.eventType`
  and the value is a function that handles the event. Different data is passed to each type of event.

Fluent:

```javascript
new Dragndrop()
	->on('start', files => { if (files.length > 1) throw "Only one file is accepted."; })
	->on('beforeFile', file => { if (!file.name.match(/\.csv$/i)) throw new SkippedFileError("Not a CSV file."); })
	->on('progress', (total, done, pending) => console.log('Progress: ' + (done * 100 / total).toFixed(2) + '%'))
	->on('finish', files => document.querySelector('textarea.input-text').value = files[0].contents)
	->withMapper(contents => parse_csv(contents))
	->attachTo('textarea.input-text');
```

### Event types

The signatures of all possible event handlers are:

- `start`: triggered when the files are dropped on the HTML element.

  `function (array files) { /* ... */ }`

- `beforeFile`: called before processing each file.

  `function (file, idx) { /* ... */ }`

- `afterFileSkip`: called after a file has been skipped.

  `function (file, idx) { /* ... */ }`

- `afterFileOk`: called after a file has been processed with no errors.

  `function (file, idx) { /* ... */ }`

- `afterFileFail`: called after an error was found while processing a file. 

  `function (file, idx) { /* ... */ }`

- `afterFile`: called _always_ after each file, no matter how it finished.

  `function (file) { /* ... */ }`

- `finish`: called after all files have been processed.

  `function (array files) { /* ... */ }`

- `progress`: called once at the beginning and then after each file.

  `function (int total, int finished, int pending) { /* ... */ }`

### File status

Each file has a `status` property, which can be:

- waiting: work has not yet started on this file.

- inProgress: this file is curently being worked on.

- skipped: this file has been skipped.

- doneOk: this file finished without errors.

- doneFail: there was an error while processing this file.

### Skipping a file

If you want to skip a file, throw a `SkippedFileError` during the event handlers of `beforeFile` or `afterFile`.

Any other type of error thrown will make the file fail.

## Changelog

v0.1, 2020-10-20
Initial release.

## License

Released under the MIT license.
