
//     noconflict.js, version 0.1
//     (c) 2011-2012 Matt Brown
//     License: BSD (see LICENSE)

( function() {

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

    // Basic object merge. Returns the first argument with properties clobbered/extended by the remaining arguments.
    var extendObj = function( obj ) {

        if ( !obj ) { return; }

        var nextObj, chain = Array.prototype.slice.call( arguments, 1 );

        while ( nextObj = chain.shift() ){
            for ( var prop in nextObj ) {
                if ( nextObj.hasOwnProperty( prop ) && typeof nextObj[ prop ] !== "undefined" ){
                    obj[ prop ] = nextObj[ prop ];
                }
            }
        }

        return obj;
    };

    // Tests whether the argument is a function.
    var isFunction = function( obj ) {
        return Object.prototype.toString.call( obj ) !== '[object Function]';
    };

    // Tests whether the argument is an array.  Uses the native `isArray` where available.
    var isArray = Array.isArray || function( obj ) {
        return Object.prototype.toString.call( obj ) === '[object Array]';
    };

    // Get a list of the values of an object's own properties.
    var values = function( obj ) {

        if ( isArray( obj ) ) { return obj; }

        var out = [];
        for ( var name in obj ) {
            if ( obj.hasOwnProperty( name ) ) {
                out.push( obj[ name ] );
            }
        }
    };

    // Class - NoConflict
    // ==================

    // For most use cases, the default options for the constructor should suffice.
    // Use the `factory` method to get a new instance with custom options, or
    // change options directly on the global object.
    var NoConflict = function( options ){

        // If `true`, use the native `noConflict` method of each symbol, where available.
        this.useNative = true;

        // If `true`, replace a symbol from cache only if the cached object is defined.
        this.ensureDefined = false;

        // Variables for dependency registration and loading.
        this.modules = {};
        this.orderRequired = [];
        this.inProg = 0;

        // Apply options.
        extendObj( this, options );
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
    NoConflict.prototype.factory = function( options ) {

        options || ( options = {} );

        var nc = new NoConflict( options );

        if ( options.privateCache ) {
            return (function(){
                var symbolCache = {};
                return nc;
            })();
        }

        return nc;
    };

    // Methods:
    // --------

    // Normalized `noConflict` method. Has the following modes:

    // 1. If no args, or the first arg fails a truth test, replace the global `NoConflict` object with its previous value.
    // 2. If the first arg matches the ALL constant, call `noConflict` on all cached symbols.
    // 3. If the first arg is an array, call `noConflict` on each member of the array.
    // 4. Assume the first arg is a symbol. Resolve the symbol and replace the current value with the cached value.

    // The returned value is a namespace (in the case of multiple symbols specified), or the current value of the resolved symbol.
    NoConflict.prototype.noConflict = function( symbol, nc_args ) {

        if ( symbol ) {

            if ( symbol === NoConflict.ALL ) {
                var ns = {};
                for ( var name in symbolCache ) {
                    symbolCache.hasOwnProperty( name ) && ( ns[ name ] = this.noConflict( symbolCache[ name ], nc_args ) );
                }
                return ns;
            }

            if ( isArray( symbol ) ) {
                var ns = {};
                for ( var i = 0; i < symbol.length; i++ ) {
                    ns[ symbol[ i ] ] = this.noConflict( symbol[ i ] );
                }
                return ns;
            }

            var instance = this.resolve( symbol );
            if ( instance && this.useNative ){
                var nativeNC = instance[ 'noConflict' ];
                if ( nativeNC && nativeNC[ 'apply' ] ) { return nativeNC.apply( instance, nc_args ); }
            }

            this.reset( symbol, symbolCache[ symbol ]);

            return instance;

        } else {

            this.ensureDefined && typeof prevNC === "undefined" || ( root[ 'NoConflict' ] = prevNC );

            return this;
        }
    };

    // Match a symbol (e.g. `'$.fn.metadata'`) to the object it references.
    // Return the object matching the symbol, or `undefined`.  If the `context` parameter
    // is specified, use that object as the starting point, else the global object.
    NoConflict.prototype.resolve = function( symbol, context ) {

        context || ( context = root );

        var parts = symbol.split( '.' );

        for ( var i = 0; i < parts.length; i++ ) {

            if (typeof context[ parts[ i ] ] !== "undefined") {
                context = context[ parts[ i ] ];

            } else { return; }
        }

        return context;
    };

    // Determine whether the symbol specified already matches a real object.  An optional
    // `versionTest( instance )` function can be used to verify that the matching object
    // meets certain requirements.  The `context` object, if provided, serves as the
    // starting point for resolving the symbol.
    NoConflict.prototype.check = function( symbol, versionTest, context ) {

        var instance = this.resolve( symbol, context );

        if ( instance ) {
            symbolCache[ symbol ] = instance;
            if ( !versionTest || versionTest( instance ) ) { return instance; }
        }

        return false;
    };

    // Set up a poll of the environment for each of the specified symbols.
    // (Note: symbols are assumed to be relative to the global object.)
    // When a symbol has a value assigned, cache the value and stop polling.
    NoConflict.prototype.watch = function( symbols ) {

        isArray( symbols ) || ( symbols = [ symbols ] );

        for ( var i = 0; i < symbols.length; i++ ) {
            if ( this.check( symbols[ i ] ) ) { continue; }

            var timer, observer = this, symbol = symbols[ i ];

            timer = setInterval( function(){
                if ( observer.check( symbol ) ) { clearInterval( timer ); }
            }, 10);
        }
    };

    // Replace the current value matching `symbol` with the `instance`.
    // The `context` object, if provided, serves as the starting point for resolving the symbol.
    // If the replacement `instance` is `undefined`, remove the object reference altogether.
    NoConflict.prototype.reset = function( symbol, instance, context ) {

        var parts = (symbol || '').split( '.' ),
            instanceName = parts.pop();

        context = this.resolve( parts.join( '.' ), context);

        if ( ! ( context && instanceName ) ) { return; }

        if ( typeof instance === "undefined" ) {
            delete context[ instanceName ];
            return;
        }
        return ( context[ instanceName ] = instance );
    };


    // ### Methods to facilitate script loading:

    // Registration mechanism for dependencies. The `NoConflict` object stores a mapping of module `name` (used
    // internally to calculate the dependency graph) to a specification.
    NoConflict.prototype.require = function( specs ) {

        // A barebones spec. Specs should include a value for at least `name`, `src`, and `symbols`.
        var defaultSpec = {
            name: '',
            src: '',
            symbols: [],
            aliases: [],
            version: undefined,
            nc_args: [],
            load: function(){}
        };

        isArray( specs ) || ( specs = [ specs ] );

        var seqStart = this.orderRequired.length;

        for ( var i = 0; i < specs.length; i++ ) {

            var spec = extendObj( {}, defaultSpec, specs[ i ] );
            spec.sequenceNum = seqStart + i;
            spec.blocks = {};
            this.modules[ spec.name ] = spec;
            this.orderRequired.push( spec );
        }
    };

    // Facilitates loading of registered dependencies.
    //
    // `NoConflict` does not provide its own function to load sources, but will try to use `jQuery.getScript` if available.
    // As with `jQuery.getScript`, `loadFunc` must accept two arguments, the `url` to fetch
    // sources from, and a `success` callback.  `load` fetches all dependencies asyncrhonously,
    // except where a module blocks others that depend on it.
    //
    // After all dependencies are loaded, `load` executes the `callback` function, with the `NoConflict` object as
    // the only parameter.
    //
    // If `deps` is provided, load those dependencies. Otherwise, get the complete dependency graph and load the
    // sources recursively from the top level.
    NoConflict.prototype.load = function( loadFunc, callback, deps ) {

        // Try to use jQuery's script loader if none provided.
        loadFunc || ( loadFunc = jQuery && jQuery.getScript );
        if ( !isFunction( loadFunc ) ) { return; }

        if ( !deps ) {
            this.inProg = 0;
            deps = this.dependencyTree();
        }

        isArray( deps ) || ( deps = values( deps ) );

        for ( var i = 0; i < deps.length; i++ ) {

            // Convert the required version to a version-test function.
            var versionTest = deps[ i ].version;
            if ( !isFunction( versionTest ) ) {
                versionTest = function( instance ) {
                    return this.testVersion( instance[ 'version' ], deps[ i ].version );
                };
            }

            // Verify that the dependency isn't already satisfied.
            var symbol = deps[ i ].symbols.length && deps[ i ].symbols[ 0 ];
            if ( this.check( symbol, versionTest ) ) {
                deps[ i ].load();
                continue;
            }

            // Set up a callback to load dependent sources when this module is successfully loaded.
            var loader = this, dep = deps[ i ], load_cb = function() {
                dep.load.apply( dep, arguments );
                loader.load( loadFunc, callback, dep.blocks )
                loader.inProg--;

                loader.inProg || callback( loader );
            };

            this.inProg++;
            loadFunc( deps[ i ].src, load_cb );
        }

        this.inProg || callback( this );
    };

    // Given the registered dependencies, calculate the dependency graph.
    // Return a list of top-level dependencies with linkage to the modules that require them.
    NoConflict.prototype.dependencyTree = function() {

        var sources = {};

        // First pass: parent linkage.
        for ( var i = 0; i < this.modules.length; i++ ) {

            if ( !this.modules[ i ].depends ) { continue; }

            if ( sources[ this.modules[ i ].src ] ) {

                // This module's requirements are satisfied already by another.  Remove any reference to it.
                this.orderRequired[ this.modules[ i ].sequenceNum ] = null;

                for (var j = 0; j < this.modules.length; j++ ) {
                    if ( this.modules[ j ].blocks && this.modules[ j ].blocks[ this.modules[ i ].name ] ) {
                        delete this.modules[ j ].blocks[ this.modules[ i ].name ];
                    }
                }

                this.modules[ i ] = null;
                continue;
            }

            sources[ this.modules[ i ].src ] = true;
            var depends = this.modules[ i ].depends;

            for ( var j = 0; j < depends.length; j++ ) {
                this.modules[ i ].blocks[ depends[ j ].name ] = depends[ j ];
            }

            this.orderRequired[ this.modules[ i ].sequenceNum ] = null;
        }

        // Second pass: collect root nodes.
        var deps = [];
        for ( i = 0; i < this.orderRequired.length; i++ ) {
            if ( this.orderRequired[ i ] === null ) { continue; }
            deps.push( this.orderRequired[ i ] );
        }

        return deps;
    };


    // Determine whether the actual version satisfies the required version.  This method is used as the default
    // version test when an alternate is not provided.
    //
    // Assumes a period-separated format with a relational modifier, e.g. `>=1.2.3`, `<=2.3`, `<3`, `2.0`, `=2.0`.
    // If no modifier is provided, `=` is assumed.  Trailing zeros (i.e. `.0`) are ignored for the purpose
    // of comparison.
    NoConflict.prototype.testVersion = function( actual, required ) {

        if ( typeof required === "undefined" ) { return true; }
        if ( typeof actual === "undefined" ) { return false; }

        var condition = /^[^\d]*/.exec( '' + required );
        condition || ( condition = '=' );

        // We'll hold 'n.0' as equivalent to 'n'.
        var trailingZero = /[.]0$/;
        actual = ('' + actual ).replace( trailingZero,'' );
        required = ('' + required ).replace( trailingZero,'' );

        if ( condition === '=' ) { return actual == required; }

        // Determine the conditional being used for the test.
        var test;
        switch( condition ) {
            case '>=':
                test = function( a, b ){ return a >= b; };
                break;
            case '<':
            case '<=':
                test = function( a, b ){ return a < b || (condition === '>=' && a === b ); };
                break;
            default:
                return false;
        }

        // We have to test each segment of the version string separately.
        actual = actual.split( '.' );
        required = required.replace( condition, '' ).split( '.' );

        for ( var i = 0; i < actual.length; i++ ){
            if ( !( i in required ) ) { return false; }

            // Force integer comparison.
            actual[ i ] = parseInt( actual[ i ] );
            required[ i ] = parseInt( required[ i ] );

            if ( !test( actual[ i ], required[ i ] ) ) { return false; }
            if ( actual[ i ] === required[ i ] ) { continue; }
            return true;
        }

        return true;
    };

    // Erases the symbol cache.
    NoConflict.prototype.clear = function() { symbolCache = {}; };

    // Exports:
    // --------

    // Create the global `NoConflict` object.
    root[ 'NoConflict' ] = new NoConflict;



} ).call( this );