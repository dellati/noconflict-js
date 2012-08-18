//     noconflict.js, version 0.1
//     (c) 2011-2012 Matt Brown
//     License: BSD (see LICENSE)

( function () {

    // Environment
    // ===========

    // Save a reference to the global object.
    var root = this;

    // Save a reference to the current `NoConflict` object.
    var prevNC = root.NoConflict;

    // The current version, for introspection
    var VERSION = '0.1';

    // We cache current values of symbols having no native `noConflict` method.
    var symbolCache = {};

    // Tests whether the argument is an array.  Uses the native `isArray` where available.
    var isArray = Array.isArray || function (obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    };

    // Class - NoConflict
    // ==================

    // For most use cases, the default options for the constructor should suffice.
    // Use the `factory` method to get a new instance with custom options, or
    // change options directly on the global object.
    var NoConflict = function (options) {
        // If `true`, use the native `noConflict` method of each symbol, where available.
        this.useNative = ('useNative' in options) ? options.useNative : true;

        // If `true`, replace a symbol from cache only if the cached object is defined.
        this.ensureDefined = ('ensureDefined' in options) ? options.ensureDefined : false;
    };

    // Class variables:
    // -----------

    // Set the current version.
    NoConflict.version = VERSION;

    // Constant representing all symbols in cache.
    NoConflict.ALL = '__all__';

    // Factory method:
    // ---------------

    // Creates a new context for loading or no-conflict actions.
    // By default, the new instance shares its symbol cache with the global instance.
    // Set the `privateCache` option to disable such sharing.
    NoConflict.prototype.context = function (options) {
        options || (options = {});

        if (options.privateCache) {
            return (function () {
                var symbolCache = {};
                return new NoConflict(options);
            })();
        }

        return new NoConflict(options);
    };

    // Methods:
    // --------

    // Normalized `noConflict` method. Has the following modes:

    // 1. If no args, or the first arg fails a truth test, replace the global `NoConflict` object with its previous value.
    // 2. If the first arg matches the ALL constant, call `noConflict` on all cached symbols.
    // 3. If the first arg is an array, call `noConflict` on each member of the array.
    // 4. Assume the first arg is a symbol. Resolve the symbol and replace the current value with the cached value.

    // The returned value is a namespace (in the case of multiple symbols specified), or the current value of the resolved symbol.
    NoConflict.prototype.noConflict = function (symbol, nc_args) {
        if (symbol) {
            var ns = {};
            if (symbol === NoConflict.ALL) {
                for (var name in symbolCache) {
                    symbolCache.hasOwnProperty(name) && (ns[name] = this.noConflict(symbolCache[name], nc_args));
                }
                return ns;
            }

            if (isArray(symbol)) {
                for (var i = 0; i < symbol.length; i++) {
                    ns[symbol[i]] = this.noConflict(symbol[i]);
                }
                return ns;
            }

            var instance = this.resolve(symbol);
            
            if (instance && this.useNative) {
                var nativeNC = this.resolve('noConflict.apply', instance);
                if (nativeNC) {
                    return nativeNC(instance, nc_args);
                }
            }

            this.reset(symbol, symbolCache[symbol]);

            return instance;

        } else {

            this.ensureDefined && typeof prevNC === "undefined" || ( root['NoConflict'] = prevNC );

            return this;
        }
    };

    // Match a symbol (e.g. `'$.fn.metadata'`) to the object it references.
    // Return the object matching the symbol, or `undefined`.  If the `context` parameter
    // is specified, use that object as the starting point, else the global object.
    // TODO: consider making this static.
    NoConflict.prototype.resolve = function (symbol, context) {
        context || ( context = root );
        isArray(symbol) || (symbol = symbol.split('.'));

        context = context[symbol.shift()];

        if (!symbol.length || typeof context === 'undefined') {
            return context;
        }

        return this.resolve(symbol, context);
    };

    // Determine whether the symbol specified already matches a real object.  An optional
    // `versionTest( instance )` function can be used to verify that the matching object
    // meets certain requirements.  The `context` object, if provided, serves as the
    // starting point for resolving the symbol.
    NoConflict.prototype.check = function (symbol, versionTest, context) {
        var instance = this.resolve(symbol, context);

        if (instance) {
            symbolCache[symbol] = instance;
            if (!versionTest || versionTest(instance)) {
                return instance;
            }
        }

        return false;
    };

    // Set up a poll of the environment for each of the specified symbols.
    // (Note: symbols are assumed to be relative to the global object.)
    // When a symbol has a value assigned, cache the value and stop polling.
    NoConflict.prototype.watch = function (symbols, duration) {
        isArray(symbols) || ( symbols = [symbols] );

        for (var i = 0; i < symbols.length; i++) {
            if (this.check(symbols[i])) {
                continue;
            }

            var observer = this,
                symbol = symbols[i],
                timer = setInterval(function () { observer.check(symbol) && clearInterval(timer); }, duration || 50);
        }
    };

    // Replace the current value matching `symbol` with the `instance`.
    // The `context` object, if provided, serves as the starting point for resolving the symbol.
    // If the replacement `instance` is `undefined`, remove the object reference altogether.
    NoConflict.prototype.reset = function (symbol, instance, context) {
        var parts = (symbol || '').split('.'),
            instanceName = parts.pop();

        context = this.resolve(parts, context);

        if (/undefined/.text(typeof context + typeof instanceName)) {
            return;
        }

        if (typeof instance === "undefined") {
            delete context[instanceName];
            return;
        }
        return ( context[instanceName] = instance );
    };

    // Erases the symbol cache.
    NoConflict.prototype.clear = function () {
        symbolCache = {};
    };

    // Exports:
    // --------

    // Create the global `NoConflict` object.
    root['NoConflict'] = NoConflict.context();

    // Register [AMD](https://github.com/amdjs/amdjs-api/wiki/AMD) module, if applicable.
    typeof define === 'function' && define('noconflict', [], function () { return NoConflict; });

}).call(this);