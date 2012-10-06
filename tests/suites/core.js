describe('NoConflict Tests', function () {
    describe('Environment Tests', function () {
        it('should exist, and contain a nested namespace class.', function () {
            expect(NoConflict).toBeDefined();
            expect(NoConflict.Namespace).toBeDefined();
        });

        it('should expose constants for the version and for all cached symbols', function () {
            expect(NoConflict.ALL).toBeDefined();
            expect(NoConflict.version).toBeDefined();
        });
    });

    describe('NoConflict Tests', function () {
        it('resolves symbols into object instances', function () {
        });

        it('checks for the presence of and caches an object matching a symbol', function () {
        });

        it('checks for and caches objects matching a list of symbols', function () {
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