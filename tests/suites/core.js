describe('NoConflict Tests', function () {
    var root = typeof window === 'undefined' ? global : window,
        ncGlobal = root.NoConflict;

    root.NoConflictTest = {};

    describe('Environment Tests', function () {
        it('should exist, and contain a nested namespace class.', function () {
            expect(root.NoConflict).toBeDefined();
            expect(root.NoConflictTest).toBeDefined();
        });

        it('should expose the version on the global object and instances', function () {
            expect(root.NoConflict.version).toBeDefined();
            expect(root.NoConflict().version).toBeDefined();
        });
    });

    describe('NoConflict Tests', function () {
        var ns,
            nc,
            nsGlobal = root.NoConflictTest;

        beforeEach(function () {
            nc = root.NoConflict();
            ns = {duck: {duck: 'goose', '!@#$': 'stuff'}};
            nsGlobal.duck = ns.duck;
        });

        afterEach(function () {
            nc.clear();
            // Some tests displace the global object.
            root.NoConflict = ncGlobal;
        });

        it('resolves symbols into object instances, with an optional starting context', function () {
            expect(nc.resolve('NoConflict')).toBe(root.NoConflict);
            expect(nc.resolve('NoConflictTest.duck.duck')).toBe('goose');
            expect(nc.resolve('duck', ns.duck)).toBe('goose');
            expect(nc.resolve('duck.!@#$', ns)).toBe('stuff');
        });

        it('checks for and caches objects matching a symbol or list of symbols', function () {
            expect(nc._symbolCache).toEqual({});
            nc.cache('NoConflict');
            nc.cache('NoConflictTest.duck.duck', 'NoConflictTest.duck.!@#$', {symbol: 'jQuery', args: [true]});
            expect(nc._symbolCache).toEqual({
                'NoConflict': root.NoConflict,
                'NoConflictTest.duck.duck': 'goose',
                'NoConflictTest.duck.!@#$': 'stuff',
                'jQuery': undefined
            });
        });

        it('generates a new context for conflict management [factory method]', function () {
            nc.cache('NoConflictTest');
            expect(nc._symbolCache['NoConflictTest']).toBe(nsGlobal);
            var nc2 = root.NoConflict();
            expect(nc2._symbolCache).toEqual({});
            expect(nc._symbolCache['NoConflictTest']).toBe(nsGlobal);
        });

        it('replaces the current instance assigned to a symbol with the cached instance.', function () {
            nc.cache('NoConflictTest');
            expect(nc._symbolCache['NoConflictTest']).toBe(nsGlobal);

            var clobberNS = {other: 'object'};
            root.NoConflictTest = clobberNS;

            nc.with(function () {
                expect(this.get('NoConflictTest')).toEqual(clobberNS);
            });

            expect(root.NoConflictTest).toBe(nsGlobal);
        });

        it('can empty the symbol cache', function () {
            nc.cache('NoConflict', 'NoConflictTest');
            expect(nc._symbolCache['NoConflict']).toBe(root.NoConflict);
            expect(nc._symbolCache['NoConflictTest']).toBe(nsGlobal);
            nc.clear();
            expect(nc._symbolCache).toEqual({});
        });

        it('can replace itself with a previous instance, if it\'s the global instance', function () {
            var ncG = root.NoConflict.noConflict();
            expect(ncG).toBe(ncGlobal);
            expect(root.NoConflict).toBeUndefined();
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

            nc.noConflict();

            expect(root.a).toBe(a);
            expect(root.b).toBe(b);
            expect(root.c).toBe(c);
            expect(root.d).toBe(d);
            expect(nc.namespace().get('a')).toBe(e);
            expect(nc.namespace().get('b')).toBe(f);
            expect(nc.namespace().get('c')).toBe(g);
            expect(nc.namespace().get('d')).toBe(h);

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

            nc.noConflict('a', 'b', 'c', 'd');

            expect(root.a).toBe(a);
            expect(root.b).toBe(b);
            expect(root.c).toBe(c);
            expect(root.d).toBe(d);
            expect(nc.namespace().get('a')).toBe(e);
            expect(nc.namespace().get('b')).toBe(f);
            expect(nc.namespace().get('c')).toBe(g);
            expect(nc.namespace().get('d')).toBe(h);

            delete root.a, delete root.b, delete root.c, delete root.d;
        });

        it('provides an option to use (or not use) an object\'s native noConflict method', function () {
            var a = {old: 'object', id: 'a'};

            root.a = a;
            nc.cache('a');
            expect(nc._symbolCache['a']).toBe(a);

            var e = {};
            nc.mixin().call(e);
            e.not = 'old';
            e.id = 'a';
            root.a = e;

            spyOn(e, 'noConflict').andCallThrough();
            nc.noConflict();

            expect(e.noConflict).toHaveBeenCalled();
            expect(nc.namespace().get('a')).toEqual(e);
            expect(root.a).toBe(a);

            delete root.a;
        });

        it('accepts arguments to pass to an object\'s native noConflict method', function () {
            var a = {old: 'object', id: 'a'};

            root.a = a;
            nc.cache('a');
            expect(nc._symbolCache['a']).toBe(a);

            var e = {};
            nc.mixin('a').call(e);
            e.not = 'old';
            e.id = 'a';
            root.a = e;

            spyOn(e, 'noConflict').andCallThrough();
            nc.noConflict({symbol: 'a', args:['arg1', 'arg2']});

            expect(e.noConflict).toHaveBeenCalledWith('arg1', 'arg2');
            expect(nc.namespace().get('a')).toBe(e);
            expect(root.a).toBe(a);

            delete root.a;
        });

        it('provides an option to preserve the current instance if there is no cached instance', function () {
            nc = root.NoConflict(['a']);
            nc.cache('a');
            var a = {not: 'old', id: 'a'};
            root.a = a;
            expect(nc.namespace().get('a')).toBe(a);
            expect(root.a).toBe(a);
            nc._settings.ensureDefined = false;
            nc.noConflict('a');
            expect(nc.namespace().get('a')).toBe(a);
            expect(root.a).toBeUndefined();
            expect('a' in root).toBe(false);
        });

        it('provides an option to set the effective root object for conflict management', function () {
            var ncx = root.NoConflict([], {context: nsGlobal}),
                orig = nsGlobal.duck,
                obj = {clobbered: 'yes'};

            ncx.cache('duck');
            nsGlobal.duck = obj;
            expect(ncx.namespace().get('duck')).toBe(obj);
            expect(nsGlobal.duck).toBe(orig);
        });

        it('exports noConflict functionality as a mixin for adding conflict management to any object', function () {
            var oldObj = {old: 'object'}, mixin = {};

            root.MixinRef = root.Mixin = oldObj;
            root.NoConflict(['Mixin', 'MixinRef']).mixin().call(mixin);
            root.MixinRef = root.Mixin = mixin;
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
        var nc = root.NoConflict(),
            ns,
            objA = {duck: 'goose'},
            objB = {not: 'a duck'},
            objC = {a: 'computer'};

        beforeEach(function () {
            ns = nc.namespace();
            ns.set('duck', objA);
            ns.set('apple', objB);
            ns.set('apple2', objC);
        });

        it('provides order aware (and order preserving) accessor methods', function () {
            var objD = {an: 'animal'};
            ns.set('cat', objD);
            expect(ns.getValues()).toEqual([objA, objB, objC, objD]);
        });

        it('executes a callback with namespace values as arguments in insert order', function () {
            ns.with(function (duck, apple, apple2) {
                expect(duck).toBe(objA);
                expect(this.get('duck')).toBe(objA);
                expect(apple).toBe(objB);
                expect(this.get('apple')).toBe(objB);
                expect(apple2).toBe(objC);
                expect(this.get('apple2')).toBe(objC);
            });
        });
    });
});