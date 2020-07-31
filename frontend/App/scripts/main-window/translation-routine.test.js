const { getDeeplTranslationsForOne } = require("./translation-routine");
const needle = require("needle");

/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable no-undef */

test('getDeeplTranslationsForOneSpliceOk', () => {
	jest.mock(needle);
	needle.mockResolvedValue({
		statusCode: 200,
		body: {
			translations: 
		}
	});
});
