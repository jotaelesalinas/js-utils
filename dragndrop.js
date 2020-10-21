/*
 * Drag'n'Drop v1.0
 * 
 * (c) Jose Luis Salinas <https://github.com/jotaelesalinas>
 * 
 * Reads and converts text from/to Excel (as tab-separated values) and JS objects.
 * 
 * See dragndrop.md for details.
 *
 * Released under the MIT license.
 */

/////////////////////////////////////////////////////////////////////////////
// Error to throw when a file is not meant to be processed, but that is ok.
/////////////////////////////////////////////////////////////////////////////

function SkippedFileError(message, fileName, lineNumber) {
    var err = new Error(message, fileName, lineNumber);
    Object.setPrototypeOf(err, Object.getPrototypeOf(this));
    err.name = 'SkippedFileError';
    return err;
}
SkippedFileError.prototype = Object.create(
    Error.prototype,
    {
        constructor: {
            value: SkippedFileError,
            enumerable: false,
            writable: true,
            configurable: true
        }
    }
);
if (Object.setPrototypeOf) {
    Object.setPrototypeOf(SkippedFileError, Error);
} else {
    SkippedFileError.__proto__ = Error;
}

/////////////////////////////////////////////////////////////////////////////
// Class to use for dranndrop
/////////////////////////////////////////////////////////////////////////////

function Dragndrop(el, mapper, eventHandlers) {
    if (this.constructor.name != 'Dragndrop') {
        return new Dragndrop(el, mapper, eventHandlers);
    }
    
    this._mapper = null;
    this._el = null;
    this._listeners = {};
    
    this._files = null;
    
    if (typeof mapper != 'undefined') {
        this.withMapper(mapper);
    }

    if (typeof eventHandlers != 'undefined') {
        if (typeof eventHandlers != 'object') {
            throw new Error('Argument "eventHandlers" has to be an object.');
        }
        for (var event_name in eventHandlers) {
            this.on(event_name, eventHandlers[event_name]);
        }
    }

    if (typeof el != 'undefined') {
        this.attachTo(el);
    }
}

Dragndrop.debug = true;

Dragndrop.prototype._log = function (message, idx) {
    if (!Dragndrop.debug) {
        return;
    }
    if (typeof idx != 'undefined') {
        var file = '[#' + idx + ' ' + this._files[idx].name + ']';
        console.log('DEBUG ' + file + ':', message)
    } else {
        console.log('DEBUG:',  message)
    }
};

Dragndrop.prototype.on = function (event_name, callback) {
    if (typeof Dragndrop.eventType[event_name] == 'undefined') {
        throw new Error('Invalid listener "' + event_name + '".');
    }
    if (typeof this._listeners[event_name] != 'undefined') {
        console.warn('Listener "' + event_name + '" already exists.');
    }
    this._listeners[event_name] = callback;
    
    return this;
};

Dragndrop.prototype.withMapper = function (mapper) {
    if (typeof mapper != 'function') {
        throw new Error('Mapper is not a function.');
    }
    this._mapper = mapper;
    
    return this;
};

Dragndrop.prototype.attachTo = function (el) {
    el = Dragndrop._getHtmlElement(el);
    
    // set missing listeners to noop
    var noop = () => {};
    for (var cb in Dragndrop.eventType) {
        if (typeof this._listeners[cb] == 'undefined') {
            this._listeners[cb] = noop;
        }
    }

    // What to do when dragging over the element -- change the cursor
    var handleDragOver = evt => {
        evt.stopPropagation();
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'copy';
    };
    
    // What to do when the files are dropped
    var handleDrop = evt => {
        evt.stopPropagation();
        evt.preventDefault();
        
        this._files = Array.from(evt.dataTransfer.files).map(Dragndrop._initFileDataFromFileApi);

        this._processFiles(evt.dataTransfer.files);
    };
    
    el.addEventListener('dragover', handleDragOver, false);
    el.addEventListener('drop', handleDrop, false);
};

Dragndrop.eventType = {
    start:         'start',
    beforeFile:    'beforeFile',
    afterFileSkip: 'afterFileSkip',
    afterFileOk:   'afterFileOk',
    afterFileFail: 'afterFileFail',
    afterFile:     'afterFile',
    finish:        'finish',
    progress:      'progress'
};

Dragndrop.fileStatus = {
    waiting:    'waiting',
    inProgress: 'inProgress',
    skipped:    'skipped',
    doneOk:     'doneOk',
    doneFail:   'doneFail',
};

Dragndrop.prototype.files = function () {
    return this._files;
};

Dragndrop.prototype.count = function () {
    return this._files.length;
};

Dragndrop.prototype.filesByStatus = function () {
    var statuses = Array.from(arguments);
    
    if (statuses.length < 1) {
            throw 'Missing file status(es).';
    }
    
    return statuses.reduce((acc, status) => {
        if (typeof Dragndrop.fileStatus[status] == 'undefined') {
            throw 'Wrong file status "' + status + '".';
        }
        acc.push(...this._files.filter(x => x.status == status));
        return acc;
    }, []);
};

Dragndrop.prototype.countByStatus = function () {
    return this.filesByStatus(...arguments).length;
};

Dragndrop.prototype.countPending = function () {
    return this.countByStatus(Dragndrop.fileStatus.waiting, Dragndrop.fileStatus.inProgress);
};

Dragndrop.prototype.countFinished = function () {
    return this.countByStatus(Dragndrop.fileStatus.skipped, Dragndrop.fileStatus.doneOk, Dragndrop.fileStatus.doneFail);
};

Dragndrop.prototype._callListener = function (event_name, ...data) {
    if (typeof Dragndrop.eventType[event_name] == 'undefined') {
        throw "Wrong event name '" + event_name + "'.";
    } else if (typeof this._listeners[event_name] != 'function') {
        throw "There is no listener for event '" + event_name + "'.";
    }
    
    this._listeners[event_name](...data);
};

Dragndrop.prototype._processFiles = function () {
    this._log('Processing ' + this._files.length + ' file' + (this._files.length != 1 ? 's' : '') + '...');
    this._files.forEach((f,i) => this._log('#' + i + ': ' + f.name + ' (' + f.file.size + ' bytes)'));
    
    this._callListener(Dragndrop.eventType.start, this._files);
    this._callListener(Dragndrop.eventType.progress, this.count(), this.countFinished(), this.countPending());
    
    return new Promise(resolve => {
        this._files.forEach((file, idx) => {
            try {
                this._log('Triggering event ' + Dragndrop.eventType.beforeFile + '...', idx);
                this._callListener(Dragndrop.eventType.beforeFile, file, idx);                
                
                Dragndrop._readFileContentsAsync(file.file)
                    .then((data) => {
                        this._log('file was read by the File API', idx);
                        if (this._mapper) {
                            this._log('applying mapper...', idx);
                            data = this._mapper(data, file.file);
                            if (data instanceof Promise) {
                                this._log('mapper returns a promise', idx);
                                data.then(data => {
                                    this._log('mapper promise succeeds', idx);
                                    this._succeed(idx, data);
                                    this._always(idx);
                                    if (this.countPending() == 0) {
                                        this._log('finished');
                                        this._log(this._files);
                                        this._callListener(Dragndrop.eventType.finish, this._files);
                                        resolve(this._files);
                                    }
                                })
                                .catch((err) => {
                                    this._log('mapper promise fails', idx);
                                    this._fail(idx, err);
                                    this._always(idx);
                                    if (this.countPending() == 0) {
                                        this._log('finished');
                                        this._log(this._files);
                                        this._callListener(Dragndrop.eventType.finish, this._files);
                                        resolve(this._files);
                                    }
                                });
                                return;
                            }
                        }
                        // there is no mapping function, or it returns a real value, vs a promise
                        this._succeed(idx, data);
                        this._always(idx);
                        if (this.countPending() == 0) {
                            this._log('finished');
                            this._log(this._files);
                            this._callListener(Dragndrop.eventType.finish, this._files);
                            resolve(this._files);
                        }
                    })
                    .catch((evt) => {
                        this._log('file could not be read by the File API', idx);
                        this._fail(idx, evt);
                        this._always(idx);
                        if (this.countPending() == 0) {
                            this._log('finished');
                            this._log(this._files);
                            this._callListener(Dragndrop.eventType.finish, this._files);
                            resolve(this._files);
                        }
                    });
            } catch (err) {
                this._fail(idx, err);
                this._always(idx);
                if (this.countPending() == 0) {
                    this._log('finished');
                    this._log(this._files);
                    this._callListener(Dragndrop.eventType.finish, this._files);
                    resolve(this._files);
                }
            }
        });
    });
};

Dragndrop.prototype._succeed = function (idx, data) {
    this._log('succeeded', idx);
    this._files[idx].status = Dragndrop.fileStatus.doneOk;
    this._files[idx].contents = data;
    this._callListener(Dragndrop.eventType.afterFileOk, this._files[idx], idx);
};

Dragndrop.prototype._fail = function (idx, err) {
    if (err instanceof SkippedFileError) {
        this._log('skipped', idx);
        this._files[idx].status = Dragndrop.fileStatus.skipped;
        this._callListener(Dragndrop.eventType.afterFileSkip, this._files[idx], idx);
    } else {
        this._log('failed', idx);
        this._log(err, idx);
        this._files[idx].status = Dragndrop.fileStatus.doneFail;
        this._files[idx].error = err instanceof Error ? err.message : err;
        this._callListener(Dragndrop.eventType.afterFileFail, this._files[idx], idx);
    }
};

Dragndrop.prototype._always = function (idx) {
    this._callListener(Dragndrop.eventType.afterFile, this._files[idx], idx);
    this._callListener(Dragndrop.eventType.progress, this.count(), this.countFinished(), this.countPending());
};

Dragndrop._getHtmlElement = function (el) {
    var dom_el = null;
    
    if (el instanceof HTMLElement) {
        dom_el = el;
    } else if (typeof el == 'string') {
        dom_el = document.getElementById(el);
        if (!dom_el) {
            dom_el = document.querySelector(el);
        }
    }
    
    if (!dom_el) {
        throw new Error('Unable to locate element ' + el);
    }
    
    return dom_el;
};

Dragndrop._readFileContentsAsync = function (file) {
    return new Promise((resolve, reject) => {
        var fr = new window.FileReader();
        fr.onload = function (evt) {
            resolve(evt.target.result);
        };
        fr.onerror = function (evt) {
            reject(evt);
        };
        //fr.readAsText(file);
        fr.readAsBinaryString(file);
    });
};

Dragndrop._initFileDataFromFileApi = function (file) {
    return {
        name: file.name,
        status: Dragndrop.fileStatus.waiting,
        file: file,
        contents: null,
        error: null,
    };
};

