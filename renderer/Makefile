COMPILER = g++
EXE = game
LIBS = -I/usr/local/include -isystem. -L. -L/usr/local/lib -lraylib -lGL -lm -lpthread -ldl -lrt -lX11 -lstdc++ -std=c++17 -ljson11
FlAGS =-Wall -Wno-missing-braces -O1 -Wno-unused-result -Wno-narrowing -Wno-enum-compare
DEBUG = -g -ggdb
SOURCES = $(wildcard ./*.cpp)
OBJ_DIR = obj
OBJECTS = $(patsubst ./%.cpp,$(OBJ_DIR)/%.o,$(SOURCES))


all: $(EXE)	

$(EXE): $(OBJECTS)
	$(COMPILER) -o $(EXE) $(DEBUG) $(OBJECTS) $(FlAGS) $(LIBS) -lchipmunk

$(OBJ_DIR)/%.o: ./%.cpp
	$(COMPILER) -c -o $@ $< $(FlAGS) $(LIBS)

web:	
	cp -r resources/* resources.wasm
	for file in ./resources.wasm/*.png; do convert $$file -rotate 180 -flop $$file; done
	/home/foxmoss/Projects/emsdk/upstream/emscripten/em++ -o build/$(EXE).html $(DEBUG) $(SOURCES)  -L./lib -lchipmunk $(FlAGS) $(LIBS) -s USE_GLFW=3 -s ASYNCIFY --shell-file ./minshell.html -DPLATFORM_WEB --preload-file resources.wasm -s TOTAL_MEMORY=67108864 -s ALLOW_MEMORY_GROWTH=1 -s FORCE_FILESYSTEM=1 -DWASM
