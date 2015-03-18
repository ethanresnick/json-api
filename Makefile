# Commands
COMPILE_CMD = node_modules/.bin/babel
LINT_CMD = node_modules/.bin/eslint

# Directories
SRC = src/
LIB = lib/
DIST = build/
BUILD = test/

.PHONY: build lint compile-lib compile-dev test

build: lint test compile

lint:
	$(LINT_CMD) $(SRC) $(TEST)

compile:
	mkdir -p $(DIST)$(LIB)
	mkdir -p $(DIST)$(SRC)
	mkdir -p $(DIST)$(TEST)
	$(COMPILE_CMD) $(LIB) --out-dir $(DIST)$(LIB)
	$(COMPILE_CMD) $(SRC) --out-dir $(DIST)$(SRC)
	$(COMPILE_CMD) $(TEST) --out-dir $(DIST)$(TEST)

compile-dev:
	mkdir -p $(DIST)$(LIB)
	mkdir -p $(DIST)$(SRC)
	mkdir -p $(DIST)$(TEST)
	$(COMPILE_CMD) $(LIB) --watch --out-dir $(DIST)$(LIB)
	$(COMPILE_CMD) $(SRC) --watch --out-dir $(DIST)$(SRC)
	$(COMPILE_CMD) $(TEST) --watch --out-dir $(DIST)$(TEST)

test:
	npm test