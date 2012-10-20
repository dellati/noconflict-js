                                  __ _ _      _      _
     _ __   ___   ___ ___  _ __  / _| (_) ___| |_   (_)___
    | '_ \ / _ \ / __/ _ \| '_ \| |_| | |/ __| __|  | / __|
    | | | | (_) | (_| (_) | | | |  _| | | (__| |_ _ | \__ \
    |_| |_|\___/ \___\___/|_| |_|_| |_|_|\___|\__(_)/ |___/
                                                   |__/

Conflict management for JavaScript.

The world of JavaScript libraries and plugins is still somewhat of a wilderness. Some attempts to correct this
 (CommonJS, AMD + requirejs) go pretty far, but often at the expense of developers having to modify
 their dependencies, and these solutions require new projects to adopt certain conventions (which in most cases
 is justified).  NoConflict aims to be a bridge between the wilderness and the packaged-JavaScript world.  It permits
  the use of older or otherwise packaging-unaware scripts in a controlled and conflict-free manner, and in their
  vanilla state, and helps library developers embed basic `noConflict` functionality with minimal effort.


Features
=========

* `NoConflict` provides a unified interface for managing conflicts with global objects, whether or not those objects
  provide conflict management on their own.

* Use `NoConflict` as a mixin, adding conflict management to your own global exports.   NoConflict weighs just 3.1k
minified (~1.1k gzipped), so it won't add significantly to your download weight.

* Use `NoConflict` as an import tool, creating an environment for your module while restoring previous global state.

* Ideal for managing resources in embedded web widgets, or any context in which the environment your module runs in
  is unknown or uncontrollable.

Source
=======

The project source and licensing information is available on [github](http://github.com/mattucf/noconflict).

You can view the annotated source listing [here](docs/noconflict.html).

Examples
========


Single Object
-------------

With `NoConflict`, conflict management is generally a two-step process: look for an existing object matching the name
you're using, and prevent your code from clobbering that object permanently.

    <script type="text/javascript">
        NoConflict.cache('swfobject');
    </script>

    <script type="text/javascript" src="path/to/vanilla/swfobject.js"></script>

    <script type="text/javascript">
        (function () {
            var swfobject = NoConflict.noConflict('swfobject');
            // ... do stuff with swfobject
        })();
    </script>

(From here forward, let's pretend the script tags are there so I don't have to type them.)


Multiple Objects
-----------------

If you had to manage your global objects individually as above, that wouldn't be too useful. You can do the following:

    NoConflict.cache('swfobject', 'MyLibrary', '_', 'jQuery');

    // ...load scripts

    (function () {
        var nameSpace = NoConflict.noConflict('swfobject', '_', 'MyLibrary', ['jQuery', true]);
        // ...do stuff with namespace object.
    }();

Note that `jQuery` is passed as an array: this format allows for zero or more arguments to be passed to `jQuery`'s
native `noConflict` method (passing `true` in this case causes `jQuery` to remove both itself and `$` from the global
object).  By default, `NoConflict` uses an object's native `noConflict` method if present, so in this case underscore's
would be called as well.

Note that in the example above, it isn't strictly necessary to pass `_` and `jQuery` to the `cache()` method, but it
can be a benefit depending on what you're wanting to do.  For instance, you can use `noConflict` in the following way:

    var ns = NoConflict.noConflict(NoConflict.ALL);

This mode grabs all the names in `NoConflict`'s cache and runs the equivalent of the multiple-object mode on
the list.


Namespace Object
----------------

In any case where multiple names are passed to `NoConflict.noConflict()`, the return value is a namespace object,
which keeps track of the order in which names are specified in the `noConflict` call.  The main benefit to this is
importing:

    var ns = NoConflict.noConflict('swfobject', '_', 'MyLibrary', ['jQuery', true]);
    ns.with(function (swfobject, _, MyLibrary, jQuery) {
        // do stuff
    });

If you're importing a large number of objects, you may wish to do the following instead:

    ns.with(function () {
        var $ = this.get('jQuery'),
            node = $('body'),
            // ...
    });

Note that `this` is bound to the namespace object inside the `with` function.  `with` has a couple variations:

    ns.with(handler, thisObj);

(Binds `this` to an object of your choosing in the call to `handler`.)

    ns.with(names, handler [, thisObj])

(Passes values to `handler` in the order dictated by `names` instead of insert order. This variant can also accept a
`thisObj` to bind the `handler` to.)


Recusal
--------

Naturally, `NoConflict` can conflict manage itself:

    var nc = NoConflict.noConflict();


Mixin
======

You can use `NoConflict`'s `mixin` method to add a `noConflict` method to your own module or global object:

    (function () {
        var top = this,
            MyModule = NoConflict.mixin('MyModule');

        MyModule.awesomeness = function () {
            //...
        };

        // ...

        top.MyModule = MyModule;
    })();

Then users of your module can simply do the following:

    var better = MyModule.noConflict();

"Far better," indeed.


Options + Factory Method
========================

`NoConflict` can operate over any namespace that's a real object (which excludes free variables and the local scope).
To create a new `NoConflict` instance, use the factory method:

    jQuery.fn.myPlugin = function () {...};

    var options = {
            useNative: false,
            ensureDefined: true,
            context: jQuery.fn
        },
        nc2 = NoConflict.context(options);

        nc2.cache('myPlugin');
        var myPlugin = nc2.noConflict('myPlugin');

The `ensureDefined` option tells `NoConflict`
to leave the current object in place after a `noConflict` call, if replacing it with the previous value would leave it
`undefined`.  The default value for this option is `false`.

The `useNative` option tells `NoConflict` whether to call the affected object's native `noConflict` method if present.
The default value is `true`.

The `context` option defines the object that serves as the basis for name resolution. In this case, the `jQuery` plugin
space.

(Admittedly, this example is silly: almost no proper jQuery plugin is usable outside the $.fn namespace. Contact me if
you have a better example. I'm begging you.)

After a `NoConflict` instance is created, you can change `useNative` and `ensureDefined` as follows:

    nc2.ensureDefined(false);
    nc2.useNative(true);

Instances created via the `context` method are identical to the global instance with one exception: only `NoConflict`
can conflict-manage itself.