describe('NoConflict Tests', function () {
    var root = typeof window === 'undefined' ? global : window;
    root.NoConflictTest = {};

    describe('Environment Tests', function () {
        it('should exist, and contain a nested namespace class.', function () {
            expect(root.NoConflict).toBeDefined();
            expect(root.NoConflict.Namespace).toBeDefined();
            expect(root.NoConflictTest).toBeDefined();
        });

        it('should expose constants for the version and for all cached symbols', function () {
            expect(root.NoConflict.ALL).toBeDefined();
            expect(root.NoConflict.version).toBeDefined();
        });
    });

    describe('NoConflict Tests', function () {
        var ns,
            nc = root.NoConflict,
            nsGlobal = root.NoConflictTest;

        beforeEach(function () {
            ns = {duck: {duck: 'goose', '!@#$': 'stuff'}};
            nsGlobal.duck = ns.duck;
        });

        afterEach(function () {
            nc.clear();
        });

        it('resolves symbols into object instances, with an optional starting context', function () {
            expect(nc.resolve('NoConflict')).toBe(nc);
            expect(nc.resolve('NoConflictTest.duck.duck')).toBe('goose');
            expect(nc.resolve('duck', ns.duck)).toBe('goose');
            expect(nc.resolve('duck.!@#$', ns)).toBe('stuff');
        });

        it('checks for the presence of and caches an object matching a symbol', function () {
            expect(nc._symbolCache['NoConflict']).toBeUndefined();
            nc.check('NoConflict');
            expect(nc._symbolCache['NoConflict']).toBe(nc);
        });

        it('checks for and caches objects matching a symbol or list of symbols', function () {
            expect(nc._symbolCache).toEqual({});
            nc.cache('NoConflict');
            nc.cache('NoConflictTest.duck.duck', 'NoConflictTest.duck.!@#$');
            expect(nc._symbolCache).toEqual({
                'NoConflict': nc,
                'NoConflictTest.duck.duck': 'goose',
                'NoConflictTest.duck.!@#$': 'stuff'
            });
        });

        it('generates a new context for conflict management [factory method]', function () {
            nc.check('NoConflictTest');
            expect(nc._symbolCache['NoConflictTest']).toBe(nsGlobal);
            var nc2 = root.NoConflict.context();
            expect(nc2._symbolCache).toEqual({});
            expect(nc._symbolCache['NoConflictTest']).toBe(nsGlobal);
        });

        it('replaces the current instance assigned to a symbol with the cached instance.', function () {
            nc.check('NoConflictTest');
            expect(nc._symbolCache['NoConflictTest']).toBe(nsGlobal);
            var clobberNS = {other: 'object'};
            root.NoConflictTest = clobberNS;
            var unClobber = root.NoConflict.noConflict('NoConflictTest');
            expect(nc._symbolCache['NoConflictTest']).toBe(nsGlobal);
            expect(root.NoConflictTest).toBe(nsGlobal);
            expect(unClobber).toBe(clobberNS);
        });

        it('can empty the symbol cache', function () {
            nc.cache('NoConflict', 'NoConflictTest');
            expect(nc._symbolCache['NoConflict']).toBe(nc);
            expect(nc._symbolCache['NoConflictTest']).toBe(nsGlobal);
            nc.clear();
            expect(nc._symbolCache).toEqual({});
        });

        it('can replace itself with a previous instance, if it\'s the global instance', function () {
            var nc2 = nc.noConflict();
            expect(root.NoConflict).toBeUndefined();
            nc = root.NoConflict = nc2.context({global: true});
            nc2.noConflict();
            expect(root.NoConflict).toBeDefined();
        });

        it('can replace all current instances of cached symbols with their cached instances', function () {
            var a = {old: 'object', id: 'a'},
                b = {old: 'object', id: 'b'},
                c = {old: 'object', id: 'c'},
                d = {old: 'object', id: 'd'},
                e = {not: 'old', id: 'a'},
                f = {not: 'old', id: 'b'},
                g = {not: 'old', id: 'c'},
                h = {not: 'old', id: 'd'};

            root.a = a, root.b = b, root.c = c, root.d = d;
            nc.cache('a', 'b', 'c', 'd');
            root.a = e, root.b = f, root.c = g, root.d = h;

            var ns = nc.noConflict(nc.ALL);

            expect(root.a).toBe(a);
            expect(root.b).toBe(b);
            expect(root.c).toBe(c);
            expect(root.d).toBe(d);
            expect(ns.get('a')).toBe(e);
            expect(ns.get('b')).toBe(f);
            expect(ns.get('c')).toBe(g);
            expect(ns.get('d')).toBe(h);

            delete root.a, delete root.b, delete root.c, delete root.d;
        });

        it('can replace instances bound to a list of cached symbols with their cached instances', function () {
            var a = {old: 'object', id: 'a'},
                b = {old: 'object', id: 'b'},
                c = {old: 'object', id: 'c'},
                d = {old: 'object', id: 'd'},
                e = {not: 'old', id: 'a'},
                f = {not: 'old', id: 'b'},
                g = {not: 'old', id: 'c'},
                h = {not: 'old', id: 'd'};

            root.a = a, root.b = b, root.c = c, root.d = d;
            nc.cache('a', 'b', 'c', 'd');
            root.a = e, root.b = f, root.c = g, root.d = h;

            var ns = nc.noConflict('a', 'b', 'c', 'd');

            expect(root.a).toBe(a);
            expect(root.b).toBe(b);
            expect(root.c).toBe(c);
            expect(root.d).toBe(d);
            expect(ns.get('a')).toBe(e);
            expect(ns.get('b')).toBe(f);
            expect(ns.get('c')).toBe(g);
            expect(ns.get('d')).toBe(h);

            delete root.a, delete root.b, delete root.c, delete root.d;
        });

        it('provides an option to use (or not use) an object\'s native noConflict method', function () {
            var a = {old: 'object', id: 'a'};

            root.a = a;
            nc.check('a');
            expect(nc._symbolCache['a']).toBe(a);

            var e = nc.mixin('a');
            e.not = 'old';
            e.id = 'a';
            root.a = e;

            spyOn(e, 'noConflict').andCallThrough();
            var result = nc.noConflict('a');

            expect(e.noConflict).toHaveBeenCalled();
            expect(result).toBe(e);
            expect(root.a).toBe(a);

            delete root.a;
        });

        it('accepts arguments to pass to an object\'s native noConflict method', function () {
            var a = {old: 'object', id: 'a'};

            root.a = a;
            nc.check('a');
            expect(nc._symbolCache['a']).toBe(a);

            var e = nc.mixin('a');
            e.not = 'old';
            e.id = 'a';
            root.a = e;

            spyOn(e, 'noConflict').andCallThrough();
            var result = nc.noConflict(['a', 'arg1', 'arg2']);

            expect(e.noConflict).toHaveBeenCalledWith('arg1', 'arg2');
            expect(result).toBe(e);
            expect(root.a).toBe(a);

            delete root.a;
        });

        it('provides an option to preserve the current instance if there is no cached instance', function () {
            nc.check('a');
            nc.ensureDefined(true);
            var a = {not: 'old', id: 'a'};
            root.a = a;
            var result = nc.noConflict('a');
            expect(result).toBe(a);
            expect(root.a).toBe(a);
            nc.ensureDefined(false);
            result = nc.noConflict('a');
            expect(result).toBe(a);
            expect(root.a).toBeUndefined();
        });

        it('provides an option to set the effective root object for conflict management', function () {
            var ncx = nc.context({context: nsGlobal}),
                orig = nsGlobal.duck,
                obj = {clobbered: 'yes'};

            ncx.check('duck');
            nsGlobal.duck = obj;
            var result = ncx.noConflict('duck');
            expect(nsGlobal.duck).toBe(orig);
            expect(result).toBe(obj);
        });

        it('exports noConflict functionality as a mixin for adding conflict management to any object', function () {
            var oldObj = {old: 'object'};

            root.MixinRef = root.Mixin = oldObj;
            root.MixinRef = root.Mixin = nc.mixin('Mixin', 'MixinRef');
            expect(root.Mixin).not.toEqual(oldObj);

            var ncMixinNS = root.Mixin.noConflict();

            expect(ncMixinNS.Mixin).toBeDefined();
            expect(ncMixinNS.MixinRef).toBeDefined();
            expect(root.Mixin).toBe(oldObj);
            expect(root.MixinRef).toBe(oldObj);

            delete root.Mixin, root.MixinRef;
        });
    });

    describe('NoConflictNamespace Tests', function () {
        var nc = root.NoConflict,
            ns,
            objA = {duck: 'goose'},
            objB = {not: 'a duck'},
            objC = {a: 'computer'};

        beforeEach(function () {
            ns = new nc.Namespace;
            ns.set('duck', objA);
            ns.set('apple', objB);
            ns.set('apple2', objC);
        });

        it('provides order aware (and order preserving) accessor methods', function () {
            var objD = {an: 'animal'};
            ns.set('cat', objD);
            expect(ns.getValues()).toEqual([objA, objB, objC, objD]);
            expect(ns.getValues(['apple', 'apple2', 'cat', 'duck'])).toEqual([objB, objC, objD, objA]);
        });

        it('executes a callback with namespace values as arguments in the specified (or insert) order', function () {
            ns.with(function (duck, apple, apple2) {
                expect(duck).toBe(objA);
                expect(this.get('duck')).toBe(objA);
                expect(apple).toBe(objB);
                expect(this.get('apple')).toBe(objB);
                expect(apple2).toBe(objC);
                expect(this.get('apple2')).toBe(objC);
            });

            ns.with(['apple', 'apple2', 'duck'], function (apple, apple2, duck) {
                expect(duck).toBe(objA);
                expect(apple).toBe(objB);
                expect(apple2).toBe(objC);
                expect(this).toBe(ns);
            });
        });

        it('executes a callback with namespace values, bound to a custom object', function () {
            var thisObj = {thing: 'smash'};
            ns.with(function (duck, apple, apple2) {
                expect(duck).toBe(objA);
                expect(apple).toBe(objB);
                expect(apple2).toBe(objC);
                expect(this).toBe(thisObj);

            }, thisObj);

            ns.with(['apple', 'apple2', 'duck'], function (apple, apple2, duck) {
                expect(duck).toBe(objA);
                expect(apple).toBe(objB);
                expect(apple2).toBe(objC);
                expect(this).toBe(thisObj);

            }, thisObj);
        });
    });
});