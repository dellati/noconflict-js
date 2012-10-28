//     noconflict.js, version 0.1
//     (c) 2011-2012 Matt Brown
//     License: BSD (see LICENSE)
(function () {
    // Environment
    // ===========

    // Save a reference to the global object.
    var root = this;

    // The current version.
    var VERSION = '0.1';


    // Miscellany
    // ==========

    // Tests whether the argument is an array.  Uses the native `isArray` where available.
    var isArray = Array.isArray || function (obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    };

    // Tests whether the argument is a function.
    var isFunction = function (obj) {
        return typeof obj === 'function';
    };

    // Tests whether the argument is a string.
    var isString = function (obj) {
        return Object.prototype.toString.call(obj) === '[object String]';
    };

    // Create a copy of an object's own properties.
    var clone = function (src) {
        var dest = {};

        for (var name in src) {
            if (src.hasOwnProperty(name)) {
                dest[name] = src[name];
            }
        }

        return dest;
    };

    // Extend an object with another object's properties.
    var extend = function (obj, ext) {
        for (var name in ext) {
            obj[name] = ext[name];
        }

        return obj;
    };


    // Class - NoConflict
    // ==================
    // NoConflict (symbols, options)
    // ---------------------------------
    // Creates a NoConflict instance with the given options and caches the given symbol or array of symbols.
    // One or both parameters may be omitted.
    var NoConflict = function (symbols, options) {
        isString(symbols) && (symbols = [symbols]);
        isArray(symbols) || (options = symbols, symbols = []);
        options || (options = {});

        // Reference to the list of symbols being managed.
        this._symbols = [];

        this._settings = {
            // Context object: symbols are resolved and conflict management performed relative to this object.
            context: root,

            // useNative: if `true` (default), use the native `noConflict` method of each symbol, where available.
            useNative: true,

            // ensureDefined: if `true` (default), replace a symbol from cache only if the cached object is defined.
            ensureDefined: true
        };

        extend(this._settings, options);

        // Cache for pre-conflict references.
        this._symbolCache = {};

        // Namespace object for post-conflict references.
        this._namespace = null;

        // Cache the given symbols.
        this.cache(symbols);
    };

    // context (options)
    // -----------------
    // Factory method.  Exported globally as `NoConflict`
    NoConflict.context = function (symbols, options) {
        return new NoConflict(symbols, options);
    };

    // namespace ()
    // -------------
    // Return the current namespace, or generate (and return) one by calling `.noConflict`.
    NoConflict.prototype.namespace = function () {
        return this._namespace || this.noConflict()._namespace;
    };

    // get (name)
    // ----------
    // Get the (conflict-managed) object associated with `name`, or a map of name to object (if no parameters).
    NoConflict.prototype.get = function (name) {
        return this.namespace().get(name);
    };

    // with (importFn)
    // ---------------
    // Call the given import function with the current values of conflict-managed symbols, in the order initially
    // specified.
    //
    // Within the callback, `this` references the namespace object, providing for an alternate means of accessing
    // values, e.g.:
    //     var $ = this.get('jQuery')
    NoConflict.prototype.with = function (importFn) {
        return this.namespace().with(importFn);
    };

    // noConflict (symbols...)
    // -------------------
    // Normalized `noConflict` method: assigns a symbol or symbols to their previous values.
    //
    // Each argument can be a string indicating a symbol, or an object, e.g.: `{symbol: 'jQuery', args: [true]}`, where
    // `args` is a list of arguments to pass to the object's native `noConflict` method (where applicable).
    //
    // If no arguments are present, `noConflict` processes the symbols already cached in the order initially specified.
    //
    // The return value is the `NoConflict` instance.
    NoConflict.prototype.noConflict = function () {
        this._namespace || (this._namespace = new NoConflictNamespace);

        if (!arguments.length) {
            return this._symbols.length ? this.noConflict.apply(this, this._symbols) : this;
        }

        if (arguments.length === 1) {
            var symbol = arguments[0], nc_args = [];

            if (typeof symbol.symbol !== 'undefined') {
                nc_args = symbol.args;
                symbol = symbol.symbol;
            }

            var instance = this.resolve(symbol);

            if (instance && this._settings.useNative && isFunction(instance.noConflict)) {
                var result = instance.noConflict.apply(instance, nc_args);

                if (this._settings.ensureDefined && typeof this.resolve(symbol) === 'undefined') {
                    this.reset(symbol, result);
                }
            }
            else {
                this.reset(symbol, this._symbolCache[symbol]);
            }

            this._namespace.set(symbol, instance);

            return this;
        }

        for (var i = 0; i < arguments.length; i++) {
            this.noConflict(arguments[i]);
        }

        return this;
    };

    // cache (symbols...)
    // ------------------------
    // Cache the object[s] currently assigned to the given `symbols` for later conflict management.
    // Each argument is assumed to be a symbol, or an object having a 'symbol' property that contains
    // the symbol. Alternatively, a single argument can be passed that is an array of symbol-or-object.
    NoConflict.prototype.cache = function () {
        if (arguments.length === 1 && isArray(arguments[0])) {
            return this.cache.apply(this, arguments[0]);
        }

        for (var i = 0; i < arguments.length; i++) {
            var arg = typeof arguments[i].symbol !== 'undefined' ? arguments[i].symbol : arguments[i];
            (arg in this._symbolCache) || this._symbols.push(arguments[i]);
            this._symbolCache[arg] = this.resolve(arg);
        }

        return this;
    };

    // reset (symbol, instance)
    // ------------------------------------
    // Replace the current value matching `symbol` with the `instance`, and return the `NoConflict` object.
    //
    // If the replacement `instance` is `undefined`, `reset` removes the object reference altogether. (Exception:
    // when the `ensureDefined` option is set, nothing happens.)
    NoConflict.prototype.reset = function (symbol, instance) {
        var parts = (symbol || '').split('.'),
            instanceName = parts.pop(),
            context = parts.length ? this.resolve(parts) : this._settings.context;

        if (!/undefined/.test(typeof context + typeof instanceName)) {
            if (typeof instance === 'undefined') {
                if (!this._settings.ensureDefined) {
                    delete context[instanceName];
                }
            }
            else {
                context[instanceName] = instance;
            }
        }

        return this;
    };

    // resolve (symbol [, context])
    // ----------------------------
    // Match a `symbol` (e.g. `'jQuery'`, `'$.fn.metadata'`) to the object it references.
    // Return the object assigned to the `symbol`, or `undefined`.  If the `context` parameter
    // is specified, resolve the symbol relative to that object; else use the `global` object.
    NoConflict.prototype.resolve = function (symbol, context) {
        context || ( context = this._settings.context );
        isArray(symbol) || (symbol = symbol.split('.'));

        context = context[symbol.shift()];

        if (!symbol.length || typeof context === 'undefined') {
            return context;
        }

        return this.resolve(symbol, context);
    };

    // clear ()
    // --------
    // Erases the symbol cache.
    NoConflict.prototype.clear = function () {
        this._symbolCache = {};
    };

    // mixin (options)
    // --------------------------
    // Return a mixin that provides a custom `noConflict` method for the symbol[s] managed by the `NoConflict` instance.
    // The `noConflict` method returns a single value for a single symbol; else a map of symbol to value.
    // Options default to that of the `NoConflict` instance, with the exception of `useNative`, which must be set to
    // `false`.  Any other option can be overridden via the first argument.
    NoConflict.prototype.mixin = function (options) {
        options = extend({ensureDefined: false}, options || {});

        // `useNative` can't be used in this context, as it would blow the stack.
        options.useNative = false;

        var nc = NoConflict.context(this._symbols, extend(clone(this._settings), options));

        return function () {
            this.noConflict = function () {
                var result = null;

                nc.with(function () {
                    result = arguments.length === 1 ? arguments[0] : this.get();
                });

                return result;
            };
        };
    };

    // Set the library version as a property available to instances.
    NoConflict.prototype.version = VERSION;


    // Class - NoConflictNamespace
    // =========================
    // An insert-order preserving hash.  (Use the provided `get`, `set` methods instead of directly manipulating
    // the object.)
    var NoConflictNamespace = function () {
        this._keys = [];
        this._data = {};
    };

    // set (name, value)
    // -----------------
    // Set the `value` indicated by `name`, keeping track of the order new names are inserted.
    NoConflictNamespace.prototype.set = function (name, value) {
        if (!(name in this._data)) {
            this._keys.push(name);
        }

        this._data[name] = value;

        return this;
    };

    // get (name)
    // ----------
    // Fetch the value for `name` if `name` is provided; else the complete mapping (unordered).
    NoConflictNamespace.prototype.get = function (name) {
        if (name) {
            return this._data[name];
        }

        return this._data;
    };

    // getValues (symbols)
    // -------------------
    // Returns an array of all values in the namespace, either in insert order or the order specified by `symbols`.
    NoConflictNamespace.prototype.getValues = function () {
        var values = [];

        for (var i = 0; i < this._keys.length; i++) {
            values.push(this.get(this._keys[i]));
        }

        return values;
    };

    // with (callback)
    // --------------------------
    // Execute a callback with the namespace values as arguments in insertion order.
    //
    // Within the callback, `this` references the namespace object, providing for an alternate means of accessing
    // values, e.g.:
    //     var $ = this.get('jQuery')
    //
    NoConflictNamespace.prototype.with = function (callback) {
        isFunction(callback) && callback.apply(this, this.getValues());
    };


    // Exports
    // ========

    // Set up the global `NoConflict` object (reference to the factory method).
    var nc = NoConflict.context;

    // Set the version on the global object.
    nc.version = VERSION;

    // Set up the noConflict action for the global object.
    NoConflict.context('NoConflict').mixin().call(nc);

    root['NoConflict'] = nc;

    // Define [AMD](https://github.com/amdjs/amdjs-api/wiki/AMD) module, if applicable.
    typeof root.define === 'function' && root.define(function () {
        return root.NoConflict.noConflict();
    });

}).call(null);