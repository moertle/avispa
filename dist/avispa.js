// Generated by CoffeeScript 2.3.1
(function() {
  // (c) 2013-2014 Matthew Oertle <moertle@gmail.com>
  // http://github.com/moertle/avispa

  // A wrapper function to create jQuery SVG elements
  var RAD, avispa_main, context;

  if (window.$SVG == null) {
    window.$SVG = function(name) {
      return $(document.createElementNS('http://www.w3.org/2000/svg', name));
    };
  }

  // Cancel an event
  if (window.cancelEvent == null) {
    window.cancelEvent = function(event) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    };
  }

  // super
  // Standardize the way scrolling the mousewheel is handled across browsers
  jQuery.event.props.push('wheelDelta');

  jQuery.event.props.push('detail');

  if (window.normalizeWheel == null) {
    window.normalizeWheel = function(event) {
      if (event.wheelDelta) {
        return event.wheelDelta / 120;
      }
      if (event.detail) {
        return event.detail / -3;
      }
      return 0;
    };
  }

  // Constants
  RAD = 180.0 / Math.PI;

  // The template for the main surface.
  avispa_main = '<defs>\n <marker id="Arrow"\n   viewBox="0 0 10 10" refX="7" refY="5"\n   markerUnits="strokeWidth"\n   markerWidth="4" markerHeight="4"\n   fill="#eee" stroke="#999" stroke-width="1px" stroke-dasharray="10,0"\n   orient="auto">\n  <path d="M 1 1 L 9 5 L 1 9 z" />\n </marker>\n</defs>\n<g class="pan">\n <g class="zoom">\n  <g class="links"></g>\n  <g class="nodes"></g>\n  <g class="labels"></g>\n </g>\n</g>';

  context = null;

  window.Avispa = (function() {
    // Expose a global view class so that consumers of the API can instantiate a view.
    class Avispa extends Backbone.View {
      initialize(options) {
        context = this;
        _.bindAll(this, 'render', 'OnMouseDown', 'OnMouseMove', 'OnMouseUp', 'OnMouseWheel', 'OnContextMenu');
        this.scale = 1.0;
        this.links = {};
        this.offset = null;
        this.dragItem = null;
        this.arrow = null;
        this.position = {
          x: 0,
          y: 0
        };
        this.zoom = {
          step: 0.125,
          min: 0.125,
          max: 2.5
        };
        this.$parent = this.$el.parent();
        this.$pan = this.$el.find('g.pan');
        this.$zoom = this.$el.find('g.zoom');
        this.$groups = this.$el.find('g.groups');
        this.$links = this.$el.find('g.links');
        this.$objects = this.$el.find('g.objects');
        this.$labels = this.$el.find('g.labels');
        this.$pan.x = parseInt(window.innerWidth / 2);
        this.$pan.y = parseInt(window.innerHeight / 2);
        this.Pan(0, 0);
        return this;
      }

      Pan(dx, dy) {
        this.$pan.x += dx;
        this.$pan.y += dy;
        this.$pan.attr('transform', `translate(${this.$pan.x}, ${this.$pan.y})`);
        this.$parent.css('background-position', `${this.$pan.x}px ${this.$pan.y}px`);
        return this;
      }

      Scale(scale1) {
        this.scale = scale1;
        this.$zoom.attr('transform', `scale(${scale})`);
        return this;
      }

      Zoom(delta) {
        var scale;
        if (delta === 0) {
          scale = 1.0;
        } else {
          scale = this.scale + delta * this.zoom.step;
        }
        if (scale <= this.zoom.min || scale >= this.zoom.max) {
          return this;
        }
        this.Scale(scale);
        return this;
      }

      Point(event) {
        var point;
        // translates the client x,y into the surface x,y
        point = this.el.createSVGPoint();
        point.x = event.clientX;
        point.y = event.clientY;
        point = point.matrixTransform(this.el.getScreenCTM().inverse());
        // account for the current pan and scale
        point.x = parseInt((point.x - this.$pan.x) / this.scale);
        point.y = parseInt((point.y - this.$pan.y) / this.scale);
        return [point.x, point.y];
      }

      OnMouseDown(event) {
        if (this.arrow != null) {
          this.arrow.Remove();
          this.arrow = null;
          return cancelEvent(event);
        }
        switch (event.which) {
          case 1:
            this.LeftDown(event);
            break;
          case 2:
            this.MiddleDown(event);
            break;
          case 3:
            if (this.RightDown) {
              this.RightDown(event);
            }
        }
        return cancelEvent(event);
      }

      LeftDown(event) {
        //if event.shiftKey
        this.offset = [event.clientX, event.clientY];
      }

      MiddleDown(event) {
        this.Pan(-this.$pan.x + window.innerWidth / 2, -this.$pan.y + window.innerHeight / 2);
        this.Zoom(0);
      }

      //@$('#zoomslider').slider('option', 'value', 1)
      OnMouseMove(event) {
        // drag the entire scene around
        if (this.offset) {
          this.Pan(event.clientX - this.offset[0], event.clientY - this.offset[1]);
          this.offset = [event.clientX, event.clientY];
        } else if (this.arrow) {
          this.arrow.Drag(event);
        } else if (this.dragItem) {
          this.dragItem.jitter++;
          if (this.dragItem.Drag) {
            this.dragItem.Drag(event);
          }
        }
        return cancelEvent(event);
      }

      OnMouseUp(event) {
        var ref;
        this.offset = null;
        if (this.dragItem != null) {
          if (this.dragItem.jitter < 3) {
            switch (event.which) {
              case 1:
                if (this.dragItem.LeftClick) {
                  this.dragItem.LeftClick(event);
                }
                break;
              case 2:
                if (this.dragItem.MiddleClick) {
                  this.dragItem.MiddleClick(event);
                }
                break;
              case 3:
                if (this.dragItem.RightClick) {
                  this.dragItem.RightClick(event);
                }
            }
          }
          if ((ref = this.dragItem) != null ? ref.MouseUp : void 0) {
            this.dragItem.MouseUp(event);
          }
          this.dragItem = null;
        } else {
          switch (event.which) {
            case 1:
              if (this.LeftClick) {
                this.LeftClick(event);
              }
              break;
            case 2:
              if (this.MiddleClick) {
                this.MiddleClick(event);
              }
              break;
            case 3:
              if (this.RightClick) {
                this.RightClick(event);
              }
          }
        }
        return cancelEvent(event);
      }

      OnMouseWheel(event) {
        this.Zoom(normalizeWheel(event));
        //@$('#zoomslider').slider('option', 'value', @scale)
        return cancelEvent(event);
      }

      OnContextMenu(event) {}

    };

    Avispa.VERSION = '0.2';

    Avispa.prototype.events = {
      'mousedown.avispa': 'OnMouseDown',
      'mousemove.avispa': 'OnMouseMove',
      'mouseup.avispa': 'OnMouseUp',
      'mousewheel.avispa': 'OnMouseWheel',
      'DOMMouseScroll.avispa': 'OnMouseWheel',
      'contextmenu.avispa': 'OnContextMenu'
    };

    return Avispa;

  }).call(this);

  // The Avispa.BaseObject represents an abstract base class for Group and Node
  // elements.  The root is an SVG G element that is translated when dragged.
  Avispa.BaseObject = Backbone.View.extend({
    events: {
      'mousedown': 'OnMouseDown',
      'mouseenter': 'OnMouseEnter',
      'mouseleave': 'OnMouseLeave',
      'mouseup': 'OnMouseUp',
      'contextmenu': 'OnContextMenu'
    },
    // The "Position" model is defined by the project that is importing Avispa.
    initialize: function(options1) {
      this.options = options1;
      _.bindAll(this, 'OnMouseDown', 'OnMouseUp', 'OnContextMenu');
      // Expect a position to be passed in
      this.position = this.options.position;
      this.parent = this.options.parent;
      // If we have a parent, keep track of our offset from the parent
      if (this.parent) {
        this.offset = {
          x: this.position.get('x'),
          y: this.position.get('y')
        };
        this.ParentDrag(this.parent.position);
        this.parent.position.bind('change', this.ParentDrag, this);
      }
      this.position.bind('change', this.render, this);
      return this;
    },
    Size: function(w, h) {
      this.position.set({
        w: w,
        h: h
      });
      return this;
    },
    ParentDrag: function(ppos) {
      this.position.set({
        x: this.offset.x + ppos.get('x'),
        y: this.offset.y + ppos.get('y')
      });
    },
    OnMouseDown: function(event) {
      this.jitter = 0;
      this.x1 = (event.clientX / context.scale) - this.position.get('x');
      this.y1 = (event.clientY / context.scale) - this.position.get('y');
      if (this.parent) {
        this.ox1 = this.offset.x - this.position.get('x');
        this.oy1 = this.offset.y - this.position.get('y');
      }
      // TODO: calculate the bounds of the parent element
      if (event.shiftKey) {
        this.$el.parent().append(this.$el);
      }
      context.dragItem = this;
      return cancelEvent(event);
    },
    Drag: function(event) {
      var x, y;
      x = (event.clientX / context.scale) - this.x1;
      y = (event.clientY / context.scale) - this.y1;
      this.position.set({
        'x': x,
        'y': y
      });
      return cancelEvent(event);
    },
    OnMouseUp: function(event) {},
    OnContextMenu: function(event) {}
  });

  // Base class for "group" objects
  Avispa.Group = class Group extends Avispa.BaseObject {
    el() {
      return $SVG('g').attr('class', 'group');
    }

    initialize() {
      super.initialize();
      this.$rect = $SVG('rect').attr('width', this.position.get('w')).attr('height', this.position.get('h')).css('fill', this.position.get('fill')).appendTo(this.$el);
    }

    render() {
      this.$rect.attr('x', this.position.get('x')).attr('y', this.position.get('y')).attr('width', this.position.get('w')).attr('height', this.position.get('h'));
      return this;
    }

    OnMouseEnter(event) {
      if (context.dragItem == null) {
        this.$rect.attr('class', 'hover');
      }
      return cancelEvent(event);
    }

    OnMouseLeave(event) {
      if (context.dragItem == null) {
        this.$rect.removeAttr('class');
      }
      return cancelEvent(event);
    }

    Drag(event) {
      var boundsx, boundsy, newparenth, newparentw, x, y;
      x = (event.clientX / context.scale) - this.x1;
      y = (event.clientY / context.scale) - this.y1;
      if (this.offset) {
        this.offset.x = this.ox1 + x;
        this.offset.y = this.oy1 + y;
        newparentw = 0;
        newparenth = 0;
        boundsx = this.parent.position.get('w') - this.position.get('w') - 10;
        boundsy = this.parent.position.get('h') - this.position.get('h') - 10;
        if (this.offset.x < 10) {
          this.offset.x = 10;
          x = this.parent.position.get('x') + 10;
        } else if (this.offset.x > boundsx) {
          //@offset.x = boundsx
          //x = @parent.position.get('x') + boundsx
          newparentw = this.offset.x - boundsx;
          x = this.offset.x; //@parent.position.get('x') + boundsx
        }
        if (this.offset.y < 30) {
          this.offset.y = 30;
          y = this.parent.position.get('y') + 30;
        } else if (this.offset.y > boundsy) {
          //@offset.y = boundsy
          //y = @parent.position.get('y') + boundsy
          newparenth = this.offset.y - boundsy;
          y = this.offset.y; //@parent.position.get('x') + boundsx
        }
      }
      this.position.set({
        'x': x,
        'y': y
      });
      if (newparentw || newparenth) {
        newparentw = this.parent.position.get('w') + newparentw;
        newparenth = this.parent.position.get('h') + newparenth;
        this.parent.Size(newparentw, newparenth);
      }
      return cancelEvent(event);
    }

  };

  // Base class for "node" objects
  Avispa.Node = class Node extends Avispa.BaseObject {
    el() {
      return $SVG('g').attr('class', 'node');
    }

    initialize() {
      super.initialize();
      this.$circle = $SVG('circle').attr('r', this.position.get('radius')).css('fill', this.position.get('fill')).appendTo(this.$el);
      this.$label = $SVG('text').attr('dy', '0.5em').text(this.options.label).appendTo(this.$el);
      this.render();
    }

    render() {
      this.$circle.attr('cx', this.position.get('x')).attr('cy', this.position.get('y'));
      this.$label.attr('x', this.position.get('x')).attr('y', this.position.get('y'));
      return this;
    }

    OnMouseEnter(event) {
      if (context.dragItem == null) {
        this.$circle.attr('class', 'hover');
      }
      return cancelEvent(event);
    }

    OnMouseLeave(event) {
      if (context.dragItem == null) {
        this.$circle.removeAttr('class');
      }
      return cancelEvent(event);
    }

    Drag(event) {
      var x, y;
      x = (event.clientX / context.scale) - this.x1;
      y = (event.clientY / context.scale) - this.y1;
      if (this.offset) {
        this.offset.x = this.ox1 + x;
        this.offset.y = this.oy1 + y;
        if (this.offset.x < 0) {
          this.offset.x = 0;
          x = this.parent.position.get('x');
        } else if (this.offset.x > this.parent.position.get('w')) {
          this.offset.x = this.parent.position.get('w');
          x = this.parent.position.get('x') + this.parent.position.get('w');
        }
        if (this.offset.y < 0) {
          this.offset.y = 0;
          y = this.parent.position.get('y');
        } else if (this.offset.y > this.parent.position.get('h')) {
          this.offset.y = this.parent.position.get('h');
          y = this.parent.position.get('y') + this.parent.position.get('h');
        }
      }
      this.position.set({
        'x': x,
        'y': y
      });
      return cancelEvent(event);
    }

  };

  Avispa.Link = (function() {
    // Base class for "link" objects
    class Link extends Backbone.View {
      el() {
        return $SVG('g').attr('class', 'link');
      }

      initialize(options1) {
        this.options = options1;
        this.path = $SVG('path').css('marker-end', 'url(#Arrow)').css('opacity', '0.5').appendTo(this.$el);
        _.bindAll(this, 'render', 'OnMouseDown', 'OnMouseEnter', 'OnMouseLeave', 'OnContextMenu');
        this.left = this.options.left;
        this.right = this.options.right;
        this.arc = new Backbone.Model({
          arc: 10
        });
        this.arc.bind('change', this.render, this);
        // Bind to the position of the left and right sides of the connection
        this.left.position.bind('change', this.render, this);
        this.right.position.bind('change', this.render, this);
        this.render();
        if (this.options.parent != null) {
          this.options.parent.$links.append(this.$el);
        }
        return this;
      }

      update() {}

      //@label.text(name)
      render() {
        var ang, arc, lx, ly, mx, my, offset, rot, rx, ry, xc, yc;
        if (!this.arc) {
          return this;
        }
        arc = this.arc.get('arc');
        lx = this.left.position.get('x');
        ly = this.left.position.get('y');
        rx = this.right.position.get('x');
        ry = this.right.position.get('y');
        // calculate the angle between 2 nodes
        ang = Math.atan2(rx - lx, ry - ly);
        // bound the offset to about half the circle
        offset = Math.max(-1.5, Math.min(1.5, arc / 100));
        // draw to the edge of the node
        lx += 30 * Math.sin(ang + offset);
        ly += 30 * Math.cos(ang + offset);
        rx += -33 * Math.sin(ang - offset);
        ry += -33 * Math.cos(ang - offset);
        // calculate the the position for the quadratic bezier curve
        xc = ((lx + rx) >> 1) + arc * Math.cos(ang);
        yc = ((ly + ry) >> 1) - arc * Math.sin(ang);
        mx = xc - (arc >> 1) * Math.cos(ang);
        my = yc + (arc >> 1) * Math.sin(ang);
        rot = -(RAD * ang);
        if (rot > 0 && rot < 180) {
          rot -= 90;
        } else {
          rot += 90;
        }
        this.path.attr('d', `M ${lx} ${ly} Q ${xc} ${yc} ${rx} ${ry}`);
        //@label.attr('x', mx).attr('y', my).attr('transform', "rotate(#{rot}, #{mx} #{my})")
        return this;
      }

      // Events
      Drag(event) {
        var d, from_x, from_y, to_x, to_y, x, y;
        [x, y] = context.Point(event);
        from_x = this.left.position.get('x');
        from_y = this.left.position.get('y');
        to_x = this.right.position.get('x');
        to_y = this.right.position.get('y');
        d = (to_x - from_x) * (y - from_y) - (to_y - from_y) * (x - from_x);
        if (d) {
          d = Math.pow(Math.abs(d), 0.5) * (d > 0 ? -1 : 1);
        }
        if (!this.od && this.od !== 0) {
          this.od = d;
        }
        // will trigger a call to render
        this.arc.set('arc', Math.max(0, this.oarc + d - this.od));
      }

      OnMouseDown(event) {
        this.jitter = 0;
        context.dragItem = this;
        this.oarc = this.arc.get('arc');
        this.od = null;
        return cancelEvent(event);
      }

      MouseUp(event) {
        if (this.jitter > 3) {
          this.path.css('stroke-width', '3px');
        }
      }

      OnMouseEnter() {
        if (context.dragItem == null) {
          this.path.css('stroke-width', '6px');
        }
      }

      OnMouseLeave() {
        if (context.dragItem == null) {
          this.path.css('stroke-width', '3px');
        }
      }

      LeftClick(event) {
        if (event.shiftKey) {
          this.arc.set('arc', 0);
        }
      }

      OnContextMenu(event) {}

    };

    Link.prototype.events = {
      'mousedown': 'OnMouseDown',
      'mouseenter': 'OnMouseEnter',
      'mouseleave': 'OnMouseLeave',
      'contextmenu': 'OnContextMenu'
    };

    return Link;

  }).call(this);

}).call(this);

//# sourceMappingURL=avispa.js.map
