describe("Tabular", function() {
	var sample_raw = [
		['Col 1', 'Col 2', 'col-1'],
		['a', 'b', 'c'],
		['1', '2', '3'],
		['d', 'e', ''],
		['g', '',  'i']
	];
	
	var sample_input_tsv = `Col 1	Col 2	col-1
a	b	c
1	2	3
d	e	
g		i`;

	var sample_output_tsv = `col_1	col_2	col_1_2
a	b	c
1	2	3
d	e	
g		i`;

	var sample_input_objarr = [
		{"Col 1": 'a', "Col 2": 'b', "col-1": 'c'},
		{"Col 1": '1', "Col 2": '2', "col-1": '3'},
		{"Col 1": 'd', "Col 2": 'e'              },
		{"Col 1": 'g',               "col-1": 'i'},
	];
	
	var sample_output_objarr = [
		{col_1: 'a', col_2: 'b', col_1_2: 'c'},
		{col_1: '1', col_2: '2', col_1_2: '3'},
		{col_1: 'd', col_2: 'e', col_1_2: ''},
		{col_1: 'g', col_2: '',  col_1_2: 'i'},
	];
	
    describe("when passed a string with TSV data", function() {
		var stub;
		
		beforeAll(function () {
			try {
				stub = new Tabular(sample_input_tsv);
			} catch (err) {
				stub = err;
			}
		});
		
		it("should not throw", function() {
			expect(stub.constructor.name).toBe('Tabular');
		});
		
		it("should store proper raw data", function () {
			if (stub.constructor.name != 'Tabular') {
				fail('Wrong stub data.');
			}
			
			expect(stub.raw.constructor.name).toBe('Array');
			expect(stub.raw.length).toBe(sample_raw.length);
			stub.raw.forEach((row, idx1) => {
				expect(row.constructor.name).toBe('Array');
				expect(row.length).toBe(sample_raw[idx1].length);
				row.forEach((cell, idx2) => {
					expect(cell.constructor.name).toBe('String');
					expect(cell).toBe(sample_raw[idx1][idx2]);
				});
			});
		});
    });

    describe("when passed an array of objects", function() {
		var stub;
		
		beforeAll(function () {
			try {
				stub = new Tabular(sample_input_objarr);
			} catch (err) {
				stub = err;
			}
		});
		
		it("should not throw", function() {
			expect(stub.constructor.name).toBe('Tabular');
		});
		
		it("should store proper raw data", function () {
			if (stub.constructor.name != 'Tabular') {
				fail('Wrong stub data.');
			}
			
			expect(stub.raw.constructor.name).toBe('Array');
			expect(stub.raw.length).toBe(sample_raw.length);
			stub.raw.forEach((row, idx1) => {
				expect(row.constructor.name).toBe('Array');
				expect(row.length).toBe(sample_raw[idx1].length);
				row.forEach((cell, idx2) => {
					expect(cell.constructor.name).toBe('String');
					expect(cell).toBe(sample_raw[idx1][idx2]);
				});
			});
		});
    });

    describe("when passed something else", function() {
		var stub;
		
		beforeAll(function () {
			try {
				stub = new Tabular(sample_input_tsv);
			} catch (err) {
				stub = err;
			}
		});
		
		it("should throw for objects", function() {
			var has_thrown = false;
			try {
				stub = new Tabular({a: 1, b: 2, c: 3});
				fail('Expected to throw.');
			} catch (err) {
				has_thrown = true;
			}
			expect(has_thrown).toBe(true);
		});
		
		it("should throw for numbers", function() {
			var has_thrown = false;
			try {
				stub = new Tabular(2);
				fail('Expected to throw.');
			} catch (err) {
				has_thrown = true;
			}
			expect(has_thrown).toBe(true);
		});
		
		it("should throw for booleans", function() {
			var has_thrown = false;
			try {
				stub = new Tabular(false);
				fail('Expected to throw.');
			} catch (err) {
				has_thrown = true;
			}
			expect(has_thrown).toBe(true);
		});
		
		it("should throw for arrays with non-object items", function() {
			var has_thrown = false;
			try {
				stub = new Tabular([{a: 1, b: 2, c: 3}, {a: 4, b: 5, c: 6}, 7, '8', {a: 0, b: 10, c: 11}]);
				fail('Expected to throw.');
			} catch (err) {
				has_thrown = true;
			}
			expect(has_thrown).toBe(true);
		});
    });


    describe("once passed proper data", function() {
		var tab = null;
		
		beforeAll(function () {
			try {
				tab = new Tabular(sample_input_tsv);
			} catch (err) {
				fail(err);
			}
		});
		
        it("should return proper TSV", function() {
			var tsv = tab.toTsv();
            expect(tsv.constructor.name).toBe('String');
            expect(tsv.indexOf("\r")).toBe(-1);
            expect(tsv.charAt(tsv.length - 1)).not.toBe("\n");
            expect(tsv).toBe(sample_output_tsv);
        });
		
        it("should return proper object array", function() {
			var arr = tab.toObjectArray();
            expect(arr.constructor.name).toBe('Array');
			expect(arr.length).toBe(sample_output_objarr.length);
			
			var keys = Object.keys(sample_output_objarr[0]);
			arr.forEach(x => {
				expect(keys.length).toBe(Object.keys(x).length);
				keys.forEach(k => expect(typeof x[k]).not.toBe('undefined'))
			});
        });
    });
});
