
# OS X Sublime Text 2 hack
PATH := $(PATH):/usr/local/bin

COFFEE = PATH=$(PATH) coffee
LESS = PATH=$(PATH) lessc

AVISPA_JS_OUT = dist/avispa.js
AVISPA_JS_SRC = src/avispa.litcoffee        \
                src/templates.litcoffee     \
                src/util.litcoffee          \
                src/objects/base.litcoffee  \
                src/objects/group.litcoffee \
                src/objects/node.litcoffee  \
                src/objects/link.litcoffee  \

AVISPA_CSS_OUT = dist/avispa.css
AVISPA_CSS_SRC = src/avispa.less

all: $(AVISPA_JS_OUT) $(AVISPA_CSS_OUT)

$(AVISPA_JS_OUT): $(AVISPA_JS_SRC)
	$(COFFEE) -j $(AVISPA_JS_OUT) -c $(AVISPA_JS_SRC)

$(AVISPA_CSS_OUT): $(AVISPA_CSS_SRC)
	$(LESS) -x --no-color $< $@

clean:
	@rm -f $(AVISPA_JS_OUT) $(AVISPA_CSS_OUT)
