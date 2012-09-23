describe('NoConflict Tests', function () {
    it('should exist, and contain a nested namespace class.', function (){
        expect(NoConflict).toBeDefined();
        expect(NoConflict.Namespace).toBeDefined();
    });

    it('should expose constants version and all cached symbols', function (){
        expect(NoConflict.ALL).toBeDefined();
        expect(NoConflict.version).toBeDefined();
    });
});