# Commands
COMPILE_CMD = node_modules/.bin/babel
LINT_CMD = node_modules/.bin/eslint

# Directories
SRC = src/
LIB = lib/
DIST = build/
TEST = test/

.PHONY: build lint compile-lib compile-dev test

build: lint test compile

lint:
	$(LINT_CMD) $(SRC) $(TEST)

compile:
	mkdir -p $(DIST)$(LIB)
	mkdir -p $(DIST)$(SRC)
	mkdir -p $(DIST)$(TEST)
	$(COMPILE_CMD) $(LIB) --out-dir $(DIST)$(LIB) --optional runtime
	$(COMPILE_CMD) $(SRC) --out-dir $(DIST)$(SRC) --optional runtime
	$(COMPILE_CMD) $(TEST) --out-dir $(DIST)$(TEST) --optional runtime

test:
	npm test
