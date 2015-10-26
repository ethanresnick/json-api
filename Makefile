# Commands
COMPILE_CMD = node_modules/.bin/babel
LINT_CMD = node_modules/.bin/eslint

# Directories
SRC = src/
LIB = lib/
DIST = build/
TEST = test/

.PHONY: build lint test coverage compile compile-dev-src compile-dev-test

build: lint test compile

lint:
	$(LINT_CMD) $(SRC) $(TEST)

test:
	npm test

coverage:
	npm run cover_local
	open coverage/lcov-report/index.html

compile-dev-src:
	mkdir -p $(DIST)$(SRC)
	$(COMPILE_CMD) $(SRC) --out-dir $(DIST)$(SRC) --optional runtime --watch --auxiliaryComment "istanbul ignore next"

compile-dev-test:
	mkdir -p $(DIST)$(TEST)
	$(COMPILE_CMD) $(TEST) --out-dir $(DIST)$(TEST) --optional runtime --watch --auxiliaryComment "istanbul ignore next"

compile:
	mkdir -p $(DIST)$(SRC)
	mkdir -p $(DIST)$(TEST)
	$(COMPILE_CMD) $(SRC) --out-dir $(DIST)$(SRC) --optional runtime,minification.removeConsole --auxiliaryComment "istanbul ignore next"
	$(COMPILE_CMD) $(TEST) --out-dir $(DIST)$(TEST) --optional runtime,minification.removeConsole --auxiliaryComment "istanbul ignore next"
