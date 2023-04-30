const index = require("./index");

test("Test getCode works", () => {

	let code = index.getCode("piet", 0);
	expect(code).toBe("f614430");

});

afterAll((done) => {
	index.server.close(done);
});
