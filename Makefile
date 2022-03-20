all: HanSimplify.user.js HanTraditionalize.user.js

clean:
	rm HanSimplify.user.js HanTraditionalize.user.js

HanSimplify.user.js: HanSimplifyHeader.user.js HanConvert.js
	cat $^ > $@

HanTraditionalize.user.js: HanTraditionalizeHeader.user.js HanConvert.js
	cat $^ > $@
