
SRC_DIR = .
DOCS_DIR = docs
TESTS_DIR = tests

COMPILE_EXEC ?= `which uglifyjs 2>/dev/null` 
COMPILER = ${COMPILE_EXEC} --unsafe
DOC_EXEC ?= `which docco 2>/dev/null`

NC = ${SRC_DIR}/noconflict.js
NC_COMPILED = ${SRC_DIR}/noconflict.min.js

default: all

all: build doc test

build:
	@@echo "Compiling."
	${COMPILER} ${NC} >${NC_COMPILED}

doc:
	@@echo "Building docco annotated source."
	${DOC_EXEC} ${NC}	

test:
	@@echo "Running tests in node.js:"
	node ${TESTS_DIR}/runner-node.js
