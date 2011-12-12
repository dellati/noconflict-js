
(function(){

    var root = this;
    var prevNC = root.NoConflict;
    var libCache = {};

    var NoConflict = {

        resolve: function( symbol, context ) {
            context || ( context = root );
            var parts = symbol.split( '.' );

            for ( var i = 0; i < parts.length; i++ ) {

                if (typeof context[ parts[ i ] ] !== "undefined") {
                    context = context[ parts[ i ] ];
                }
                else { return; }
            }
            
            return context;
        },

        check: function( symbol, versionTest, context ){
            var instance = NoConflict.resolve( symbol, context );
            if ( instance ) {
                !instance[ 'noConflict' ] && ( libCache[ symbol ] = instance );
                if ( !versionTest || versionTest( instance ) ) { return instance; }
            }
            return false;
        },

        reset: function( symbol, instance, context ) {
            var parts = (symbol || '').split( '.' ),
                instanceName = parts.pop();

            context = NoConflict.resolve( parts.join( '.' ), context);

            if ( ! ( context && instanceName && instance ) ){ return; }
            return ( context[ instanceName ] = instance );
        },

        noConflict: function( symbol ) {
            if ( symbol ){

                var nativeNC = NoConflict.resolve( symbol + '.noConflict' );
                if ( nativeNC ) { return nativeNC(); }

                var nc = NoConflict.resolve( symbol );
                NoConflict.reset( symbol, libCache[ symbol ]);
                return nc;

            } else {

                root[ 'NoConflict' ] = prevNC;
                return NoConflict;
            }
        },

        clear: function(){ libCache = {}; }
    };

    root[ 'NoConflict' ] = NoConflict;

}).call(this);