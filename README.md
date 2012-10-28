                                  __ _ _      _      _
     _ __   ___   ___ ___  _ __  / _| (_) ___| |_   (_)___
    | '_ \ / _ \ / __/ _ \| '_ \| |_| | |/ __| __|  | / __|
    | | | | (_) | (_| (_) | | | |  _| | | (__| |_ _ | \__ \
    |_| |_|\___/ \___\___/|_| |_|_| |_|_|\___|\__(_)/ |___/
                                                   |__/

Conflict management for JavaScript.

The world of JavaScript libraries and plugins is still somewhat of a wilderness. Some attempts to correct this (CommonJS, AMD + requirejs) go pretty far, but often at the expense of developers having to modify their dependencies, and these solutions require new projects to adopt certain conventions (which in most cases is justified).  NoConflict aims to be a bridge between the wilderness and the packaged-JavaScript world.  It promotes the use of older or otherwise packaging-unaware scripts in a controlled and conflict-free manner, and in their vanilla state, and helps library developers embed basic `noConflict` functionality with minimal effort.

Features
=========

* `NoConflict` provides a unified interface for managing conflicts with global objects, whether or not those objects provide conflict management on their own.

* Use `NoConflict` as a mixin, adding conflict management to your own global exports.   NoConflict weighs just 3.1k minified (1.1k gzipped), so it won't add significantly to your download weight.

* Use `NoConflict` as an import tool, creating an environment for your module while restoring previous global state.

* Ideal for managing resources in embedded web widgets, or any context in which the environment your module runs in is unknown or otherwise uncontrollable.

Source
=======

The project source and licensing information is available on [github](http://github.com/mattucf/noconflict-js/).

You can view the annotated source listing [here](http://mattucf.github.com/noconflict-js/docs/noconflict.html).

Examples
========


Single Object
-------------

With `NoConflict`, conflict management is generally a two-step process: look for an existing object matching the global name you're assigning to, and prevent your code from clobbering that object permanently.

    <script type="text/javascript">
        var imports = NoConflict(['swfobject']);
    </script>

    <script type="text/javascript" src="path/to/vanilla/swfobject.js"></script>

    <script type="text/javascript">
        (function () {
            var swfobject = imports.get('swfobject');
            // do stuff with your conflict-managed swfobject....
        })();
    </script>

(From here forward, let's pretend the script tags are there so I don't have to type them.)


Multiple Objects
-----------------

If you had to manage your global objects individually as above, that wouldn't be too useful. You can do the following:

    var imports = NoConflict(['swfobject', 'MyLibrary', '_', {symbol: 'jQuery', args: [true]}]);

    // load scripts

    imports.with(function(swfobject, MyLibrary, _, $) {
        // do stuff with your conflict-managed dependencies....
    });

Note that `jQuery` is passed as an object: this format allows for zero or more arguments to be passed to `jQuery`'s native `noConflict` method (passing `true` in this case causes `jQuery` to remove itself and restore `$` in the global scope).  By default, `NoConflict` uses an object's native `noConflict` method if present, so in this case underscore's would be called as well.

`NoConflict` will also ensure, by default, that restoring a global name's previous value will not leave it undefined, if the current value is defined. Both of these default behaviors can be overridden by passing an `options` object:

    var symbols = ['swfobject', 'MyLibrary', '_', {symbol: 'jQuery', args: [true]}],
        options = {
            useNative: false,
            ensureDefined: false
        },
        imports = NoConflict(symbols, options);

    // ...

In this case, when conflict management occurs (i.e. when `.get()` or `.with()` are called), any names whose previous
values were not defined are removed from global scope, and native `.noConflict()` methods are ignored.


Context Option
---------------

`NoConflict` can operate over any object as its scope, by setting the `context` option:

    var classes = {
        Model: function(){},
        Widget: function () {console.log(Model().value);}
    };

    var nc = NoConflict(['Model'], {context: classes});

    classes.Model = function () {
        console.log('Super-specialty variant: actually does stuff!');
        this.value = 'Fusion';
    };

    classes.Widget(); // Logs 'Fusion'

    // Restore previous state.
    nc.noConflict();
    classes.Widget(); // Logs undefined


The `context` option defines the object that serves as the basis for name resolution. In this case, we create a
`NoConflict` instance on the `classes` scope in order to temporarily alter its state in a reversible manner.



Recusal
========

Naturally, `NoConflict` can conflict manage itself:

    var NoConflict = NoConflict.noConflict();



Mixin
======

You can use `NoConflict`'s `mixin` method to add a `noConflict` method to your own global export\[s\]:

    (function () {
        var top = this,
            MyGlobal = function () {};

        NoConflict(['MyGlobal']).mixin().call(MyGlobal.prototype);

        MyGlobal.prototype.awesomeness = function () {
            //...
        };

        // ...

        top.MyGlobal = MyGlobal;
    })();

Then users of your module can simply do the following:

    var better = MyGlobal.noConflict();

"Far better," indeed.
