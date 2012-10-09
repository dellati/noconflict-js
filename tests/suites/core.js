describe('NoConflict Tests', function () {
    describe('Environment Tests', function () {
        it('should exist, and contain a nested namespace class.', function () {
            expect(NoConflict).toBeDefined();
            expect(NoConflict.Namespace).toBeDefined();
            expect(NoConflictTest).toBeDefined();
        });

        it('should expose constants for the version and for all cached symbols', function () {
            expect(NoConflict.ALL).toBeDefined();
            expect(NoConflict.version).toBeDefined();
        });
    });

    describe('NoConflict Tests', function () {
        var ns,
            nc = NoConflict,
            nsGlobal = NoConflictTest;

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
            nc.cache(['NoConflictTest.duck.duck', 'NoConflictTest.duck.!@#$']);
            expect(nc._symbolCache).toEqual({
                'NoConflict': nc,
                'NoConflictTest.duck.duck': 'goose',
                'NoConflictTest.duck.!@#$': 'stuff'
            });
        });

        it('generates a new context for conflict management [factory method]', function () {
        });

        it('replaces the current instance assigned to a symbol with the cached instance.', function () {
        });

        it('can empty the symbol cache', function () {
        });

        it('can replace itself with a previous instance', function () {
        });

        it('can replace all current instances of cached symbols with their cached instances', function () {
        });

        it('can replace instances bound to a list of cached symbols with their cached instances', function () {
        });

        it('provides an option to use (or not use) an object\'s native noConflict method', function () {
        });

        it('accepts arguments to pass to an object\'s native noConflict method', function () {
        });

        it('provides an option to preserve the current instance if there is no cached instance', function () {
        });

        it('exports noConflict functionality as a mixin for adding conflict management to any object', function () {
        });
    });

    describe('NoConflictNamespace Tests', function () {
        it('provides insert-order preserving accessor methods', function () {
        });

        it('executes a callback with namespace values as arguments in insert order', function () {
        });

        it('executes a callback with namespace values as arguments in a specified order', function () {
        });
    });
});