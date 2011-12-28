/**
 * Simple use case:
 *
 * NoConflict.ensureDefined = true;
 * var  $ = jQuery = NoConflict.noConflict('jQuery'),
 *      _ = NoConflict.noConflict('_'),
 *      Backbone = NoConflict.noConflict('Backbone');
 *
 * doStuffWithNewContext();
 *
 *
 * Slightly more complicated use case:
 *
 * var nc = NoConflict.noConflict();
 * nc.require( [ ...declarations... ] );
 * nc.load( $.getScript, function(){
 *      var context = nc.noConflict( NoConflict.ALL ),
 *          $ = context.$,
 *          jQuery = context.jQuery,
 *          MaiBlog = context.MaiBlog,
 *          Blog = context.Blog;
 *
 *      doStuffWithNewContext();
 * });
 *
 * Sample declarations:
 *
 * {
 *      name:       'jquery17',
 *      src:        'http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js',
 *      symbols:    ['jQuery'],
 *      aliases:    { jQuery: ['$'] },
 *      version:    function(){ return NoConflict.testVersion(jQuery.fn.jquery, '1.7.1'); }
 *      nc_args:    [ true ],
 *      load:       function(source){ ...early-bird actions with jQuery while other deps load... }
 * }
 *
 * {
 *      name:       'blog',
 *      src:        '/media/js/blog.js',
 *      symbols:     ['MaiBlog', 'Blog'],
 *      version:    '>=1.0.1',
 *      depends:    ['jquery17', 'other-lib', ...]
 * }
 */

( function() {

    var root = this;
    var prevNC = root.NoConflict;
    var libCache = {};

    var isArray = Array.isArray || function(obj) { return Object.prototype.toString.call( obj ); };

    var NoConflict = function(){
        this.useNative = true;
        this.ensureDefined = false;
        this.removeGlobals = false;
        this.modules = {};
        this.orderRequired = [];
    };

    NoConflict.prototype.ALL = '__all__';

    NoConflict.prototype.noConflict = function( symbol, nc_args ) {

        if ( symbol ){

            if ( symbol === NoConflict.ALL ) {
                var ns = {};
                for ( var name in libCache ) {
                    libCache.hasOwnProperty( name ) && ( ns[ name ] = this.noConflict( libCache[ name ], nc_args ) );
                }
                return ns;
            }

            var instance = this.resolve( symbol );
            if ( instance && this.useNative ){
                var nativeNC = context[ 'noConflict' ];
                if ( nativeNC && nativeNC[ 'apply' ] ) { return nativeNC.apply( context, nc_args ); }
            }

            this.reset( symbol, libCache[ symbol ]);

            return instance;

        } else {

            this.ensureDefined && typeof prevNC === "undefined" || ( root[ 'NoConflict' ] = prevNC );

            return this;
        }
    };

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

    NoConflict.prototype.check = function( symbol, versionTest, context ) {

        var instance = this.resolve( symbol, context );
        if ( instance ) {
            !instance[ 'noConflict' ] && ( libCache[ symbol ] = instance );
            if ( !versionTest || versionTest( instance ) ) { return instance; }
        }
        return false;
    };

    NoConflict.prototype.reset = function( symbol, instance, context ) {
        var parts = (symbol || '').split( '.' ),
            instanceName = parts.pop();

        context = this.resolve( parts.join( '.' ), context);

        if ( ! ( context && instanceName && instance ) ) { return; }
        return ( context[ instanceName ] = instance );
    };

    // Methods for loading dependencies.

    NoConflict.prototype.require = function( specs ) {
        isArray( specs ) || ( specs = [ specs ] );
        var seqStart = this.orderRequired.length;
        for ( var i = 0; i < specs.length; i++ ) {
            specs[ i ].sequenceNum = seqStart + i;
            specs[ i ].blocks = {};
            this.modules[ specs[ i ].name ] = specs[ i ];
            this.orderRequired.push( specs[ i ] );
        }
    };

    NoConflict.prototype.load = function( loadFunc, callback ) {
        var deps = this.dependencyTree();
        for ( var i = 0; i < deps.length; i++ ) {
        }
    };

    NoConflict.prototype.dependencyTree = function() {
        // First pass: parent linkage.
        for ( var i = 0; i < this.modules.length; i++ ) {
            if ( !this.modules[ i ].depends ) { continue; }
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

    NoConflict.prototype.testVersion = function( actual, required ) {

        if ( typeof required === "undefined" ) { return true; }
        if ( typeof actual === "undefined" ) { return false; }

        var condition = /^[^\d]*/.exec( '' + required );
        condition || ( condition = '=' );

        // We'll hold 'n.0' as equivalent to 'n'.
        var trailingZero = /[.]0$/;
        actual = ('' + actual).replace( trailingZero,'' ), required = ('' + required).replace( trailingZero,'' );

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

        // Test each segment of the version string separately.
        actual = actual.split( '.' ), required = required.replace( condition, '' ).split( '.' );
        for ( var i = 0; i < actual.length; i++ ){
            if ( !( i in required ) ) { return false; }

            // Force integer comparison.
            actual[ i ] = parseInt( actual[ i ] ), required[ i ] = parseInt( required[ i ] );

            if ( !test( actual[ i ], required[ i ] ) ) { return false; }
            if ( actual[ i ] === required[ i ] ) { continue; }
            return true;
        }

        return true;
    };

    NoConflict.prototype.clear = function() { libCache = {}; };

    root[ 'NoConflict' ] = new NoConflict;

} ).call( this );