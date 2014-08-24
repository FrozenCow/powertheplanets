define(['platform', 'game', 'vector', 'staticcollidable', 'linesegment', 'editor', 'required', 'state', 'level', 'mouse', 'collision', 'keyboard', 'quake', 'resources'], function(platform, Game, Vector, StaticCollidable, LineSegment, editor, required, state, level, mouse, collision, keyboard, quake, resources) {
    var t = new Vector(0, 0);
    var t2 = new Vector(0, 0);
    var rs = {
        'images': ['test','background','finish','spacecontinue','moon','earth01','earth02','earth03','earth04','earth05','car_base','car_wheel','hook','cable','disconnected','connected'],
        'audio': []
    };
    var g, game;
    platform.once('load', function() {
        var canvas = document.getElementById('main');
        game = g = new Game(startGame, canvas, [required(['chrome']), mouse, keyboard, resources(rs), state, level, collision, quake]);
        g.resources.status.on('changed', function() {
            g.graphics.context.clearRect(0, 0, game.width, game.height);
            g.graphics.context.fillStyle = 'black';
            g.graphics.context.font = 'arial';
            g.graphics.fillCenteredText('Preloading ' + g.resources.status.ready + '/' + g.resources.status.total + '...', 400, 300);
        });
    });

    function startGame(err) {
        if (err) {
            console.error(err);
        }
        var images = g.resources.images;
        var audio = g.resources.audio;
        g.objects.lists.particle = g.objects.createIndexList('particle');
        g.objects.lists.spring = g.objects.createIndexList('spring');
        g.objects.lists.start = g.objects.createIndexList('start');
        g.objects.lists.finish = g.objects.createIndexList('finish');
        g.objects.lists.enemy = g.objects.createIndexList('enemy');
        g.objects.lists.usable = g.objects.createIndexList('usable');
        g.objects.lists.collectable = g.objects.createIndexList('collectable');
        g.objects.lists.shadow = g.objects.createIndexList('shadow');
        g.objects.lists.background = g.objects.createIndexList('background');
        g.objects.lists.foreground = g.objects.createIndexList('foreground');
        g.objects.lists.planet = g.objects.createIndexList('isplanet');
        g.objects.lists.grounded = g.objects.createIndexList('grounded');

        game.graphics.context.imageSmoothingEnabled = true;
        // Gravity.
        // g.gravity = (function() {
        //  var me = {
        //      enabled: true,
        //      enable: enable,
        //      disable: disable,
        //      toggle: toggle
        //  };
        //  function enable() { me.enabled = true; }
        //  function disable() { me.enabled = false; }
        //  function toggle() { if (me.enabled) disable(); else enable(); }
        //  function update(dt,next) {
        //      g.objects.lists.particle.each(function(p) {
        //          if (me.enabled) {
        //              p.velocity.y += 200*dt;
        //          }
        //      });
        //      next(dt);
        //  }
        //  g.chains.update.push(update);
        //  return me;
        // })();
        // Auto-refresh
        // (function() {
        //  var timeout = setTimeout(function() {
        //      document.location.reload(true);
        //  }, 3000);
        //  g.once('keydown',function() {
        //      disable();
        //  });
        //  g.once('mousemove',function() {
        //      disable();
        //  });
        //  g.chains.draw.unshift(draw);
        //  function draw(g,next) {
        //      // console.log(game.chains.draw.slice(0));
        //      g.fillStyle('#ff0000');
        //      g.fillCircle(game.width,0,30);
        //      g.fillStyle('black');
        //      next(g);
        //  }
        //  function disable() {
        //      clearTimeout(timeout);
        //      g.chains.draw.remove(draw);
        //  }
        // })();
        // Camera
        (function() {
            game.camera = new Vector(0, 0);
            game.camera.zoom = 1;
            game.camera.PTM = 32;
            game.camera.screenToWorld = function(screenV, out) {
                var ptm = getPixelsPerMeter();
                out.x = screenV.x / ptm + game.camera.x;
                out.y = -(screenV.y / ptm - game.camera.y);
            };
            game.camera.worldToScreen = function(worldV, out) {
                var ptm = getPixelsPerMeter();
                out.x = (worldV.x - game.camera.x) * ptm;
                out.y = (worldV.y - game.camera.y) * ptm * -1;
            };
            game.camera.getPixelsPerMeter = getPixelsPerMeter;

            function getPixelsPerMeter() {
                return game.camera.PTM / game.camera.zoom;
            }
            game.camera.reset = function() {
                var ptm = getPixelsPerMeter();
                var targetx = player.position.x - (game.width * 0.5) / ptm;
                var targety = player.position.y + (game.height * 0.5) / ptm;
                targetx += player.velocity.x * 10;
                targety += player.velocity.y * 10;
                game.camera.x = targetx;
                game.camera.y = targety;
            };
            var pattern;

            function drawCamera(g, next) {
                var ptm = getPixelsPerMeter();
                // if (!pattern) {
                //   pattern = g.context.createPattern(images.background,'repeat');
                // }
                // Follow player
                var targetx = player.position.x - (game.width * 0.5) / ptm;
                var targety = player.position.y + (game.height * 0.5) / ptm;
                // Look forward
                // targetx += player.velocity.x * 10;
                // targety += player.velocity.y * 10;
                // Smooth
                // game.camera.x = 0.8 * game.camera.x + 0.2 * targetx;
                // game.camera.y = 0.8 * game.camera.y + 0.2 * targety;
                // No smoothing
                game.camera.x = targetx;
                game.camera.y = targety;
                // g.save();
                // g.context.translate(-x*ptm,y*ptm);
                // g.fillStyle(pattern);
                // g.fillRectangle(x*ptm,-y*ptm,game.width,game.height);
                // g.restore();
                g.save();
                g.context.scale(ptm, -ptm);
                g.context.lineWidth /= ptm;
                g.context.translate(-game.camera.x, -game.camera.y);
                next(g);
                g.restore();
            }
            g.chains.draw.camera = drawCamera;
            g.chains.draw.insertBefore(drawCamera, g.chains.draw.objects);
        })();

        // Draw background
        (function() {
            var topLeft = new Vector(0,0);
            var bottomRight = new Vector(0,0);
            game.chains.draw.insertAfter(function(g,next) {
                var pixelSize = 2;
                var worldSize = pixelSize * game.camera.PTM;
                t.set(0,0);
                game.camera.screenToWorld(t,topLeft);
                t.set(game.width,game.height);
                game.camera.screenToWorld(t,bottomRight);
                topLeft.x = Math.floor(topLeft.x / worldSize) * worldSize;
                topLeft.y = Math.floor(topLeft.y / worldSize) * worldSize;
                bottomRight.x = Math.floor(bottomRight.x / worldSize + 1) * worldSize;
                bottomRight.y = Math.floor(bottomRight.y / worldSize - 1) * worldSize;
                for(var x = topLeft.x; x <= bottomRight.x; x += worldSize) {
                for(var y = topLeft.y; y >= bottomRight.y; y -= worldSize) {
                    g.drawImage(images.background,x,y,worldSize,worldSize);
                }}
                next(g);

            },game.chains.draw.camera);
        })

        // Collision
        (function() {
            var t = new Vector(0, 0)
            var t2 = new Vector(0, 0);
            g.objects.lists.collidable = g.objects.createIndexList('collidable');
            g.objects.lists.collide = g.objects.createIndexList('collide');
            g.chains.update.insertAfter(function(dt, next) {
                handleCollision();
                next(dt);
            }, g.chains.update.objects);

            function handleCollision() {
                g.objects.lists.collide.each(function(o) {
                    if (!o.velocity) {
                        return;
                    }
                    o.surface = null;
                    while (true) {
                        var collisions = [];

                        function handleCollisionLineSegments(lineSegments) {
                            for (var i = 0; i < lineSegments.length; i++) {
                                var lineSegment = lineSegments[i];
                                t.setV(lineSegment.normal);
                                t.normalRight();
                                var l = lineSegment.start.distanceToV(lineSegment.end);
                                t2.setV(o.position);
                                t2.substractV(lineSegment.start);
                                var offY = lineSegment.normal.dotV(t2) - o.collisionRadius;
                                var offX = t.dotV(t2);
                                if (offY < -o.collisionRadius * 2) {
                                    continue;
                                } else if (offY < 0) {
                                    if (offX > 0 && offX < l) {
                                        offY *= -1;
                                        collisions.push({
                                            normalx: lineSegment.normal.x,
                                            normaly: lineSegment.normal.y,
                                            offset: offY
                                        });
                                    } else if (offX < 0 && offX > -o.collisionRadius) {
                                        var d = o.position.distanceToV(lineSegment.start);
                                        if (d < o.collisionRadius) {
                                            t.setV(o.position);
                                            t.substractV(lineSegment.start);
                                            t.normalize();
                                            collisions.push({
                                                normalx: t.x,
                                                normaly: t.y,
                                                offset: o.collisionRadius - d
                                            });
                                        }
                                    } else if (offX > l && offX < l + o.collisionRadius) {
                                        var d = o.position.distanceToV(lineSegment.end);
                                        if (d < o.collisionRadius) {
                                            t.setV(o.position);
                                            t.substractV(lineSegment.end);
                                            t.normalize();
                                            collisions.push({
                                                normalx: t.x,
                                                normaly: t.y,
                                                offset: o.collisionRadius - d
                                            });
                                        }
                                    }
                                } else {
                                    continue;
                                }
                            }
                        }
                        g.objects.lists.collidable.each(function(collidable) {
                            handleCollisionLineSegments(collidable.collisionlines);
                        });
                        if (collisions.length > 0) {
                            collisions.sort(function(a, b) {
                                return b.offset - a.offset;
                            });
                            var c = collisions[0];
                            o.position.add(c.normalx * (c.offset + 1), c.normaly * (c.offset + 1));
                            var vc = o.velocity.dot(c.normalx, c.normaly);
                            o.velocity.substract(c.normalx * vc, c.normaly * vc);
                            o.surface = c;
                            if (o.collided) {
                                o.collided(c);
                            }
                        } else {
                            break;
                        }
                    }
                });
            }
        }());
        // Tracing
        (function() {
            var t = new Vector(0, 0);

            function IsOnSegment(xi, yi, xj, yj, xk, yk) {
                return (xi <= xk || xj <= xk) && (xk <= xi || xk <= xj) && (yi <= yk || yj <= yk) && (yk <= yi || yk <= yj);
            }

            function ComputeDirection(xi, yi, xj, yj, xk, yk) {
                var a = (xk - xi) * (yj - yi);
                var b = (xj - xi) * (yk - yi);
                return a < b ? -1 : a > b ? 1 : 0;
            }
            // From: http://ptspts.blogspot.nl/2010/06/how-to-determine-if-two-line-segments.html
            function DoLineSegmentsIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
                var d1 = ComputeDirection(x3, y3, x4, y4, x1, y1);
                var d2 = ComputeDirection(x3, y3, x4, y4, x2, y2);
                var d3 = ComputeDirection(x1, y1, x2, y2, x3, y3);
                var d4 = ComputeDirection(x1, y1, x2, y2, x4, y4);
                return (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) || (d1 == 0 && IsOnSegment(x3, y3, x4, y4, x1, y1)) || (d2 == 0 && IsOnSegment(x3, y3, x4, y4, x2, y2)) || (d3 == 0 && IsOnSegment(x1, y1, x2, y2, x3, y3)) || (d4 == 0 && IsOnSegment(x1, y1, x2, y2, x4, y4));
            }
            // From: http://www.ahristov.com/tutorial/geometry-games/intersection-lines.html
            function intersection(x1, y1, x2, y2, x3, y3, x4, y4, result) {
                var d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
                if (d == 0) return false;
                var xi = ((x3 - x4) * (x1 * y2 - y1 * x2) - (x1 - x2) * (x3 * y4 - y3 * x4)) / d;
                var yi = ((y3 - y4) * (x1 * y2 - y1 * x2) - (y1 - y2) * (x3 * y4 - y3 * x4)) / d;
                result.set(xi, yi);
                return true;
            }
            g.cantrace = function(fromx, fromy, tox, toy) {
                var result = true;
                game.objects.lists.collidable.each(function(collidable, BREAK) {
                    for (var i = 0; i < collidable.collisionlines.length; i++) {
                        var cl = collidable.collisionlines[i];
                        var fd = cl.normal.dot(fromx - tox, fromy - toy);
                        // Is collision in right direction (toward fromxy)
                        if (fd < 0) {
                            continue;
                        }
                        // Are line-segments intersecting?
                        if (!DoLineSegmentsIntersect(fromx, fromy, tox, toy, cl.start.x, cl.start.y, cl.end.x, cl.end.y)) {
                            continue;
                        }
                        result = false;
                        return BREAK;
                    }
                });
                return result;
            };
            g.trace = function(fromx, fromy, tox, toy) {
                var c = null;
                game.objects.lists.collidable.each(function(collidable) {
                    for (var i = 0; i < collidable.collisionlines.length; i++) {
                        var fd = cl.normal.dot(fromx - tox, fromy - toy);
                        // Is collision in right direction (toward fromxy)
                        if (fd < 0) {
                            return;
                        }
                        // Are line-segments intersecting?
                        if (!DoLineSegmentsIntersect(fromx, fromy, tox, toy, cl.start.x, cl.start.y, cl.end.x, cl.end.y)) {
                            return;
                        }
                        // Get intersection
                        if (!intersection(fromx, fromy, tox, toy, cl.start.x, cl.start.y, cl.end.x, cl.end.y, t)) {
                            return;
                        }
                        // Determine the closest intersecting collisionline
                        var distance = t.distanceTo(fromx, fromy);
                        if (!c || c.distance > distance) {
                            c = {
                                collidable: collidable,
                                cl: cl,
                                distance: distance,
                                x: t.x,
                                y: t.y
                            };
                        }
                    }
                });
                return c;
            }
        })();
        // Foreground and background
        (function() {
            var game = g;
            game.chains.draw.push(function(g, next) {
                game.objects.lists.background.each(function(o) {
                    o.drawBackground(g);
                });
                game.objects.lists.shadow.each(function(o) {
                    o.drawShadow(g);
                });
                game.objects.lists.foreground.each(function(o) {
                    o.drawForeground(g);
                });
                // game.objects.lists.drawItem.each(function(o) {
                //  o.drawItem(g);
                // });
                next(g);
            });
        })();
        // Touching
        (function() {
            g.objects.lists.touchable = g.objects.createIndexList('touchable');
            g.chains.update.push(function(dt, next) {
                g.objects.lists.touchable.each(function(ta) {
                    g.objects.lists.touchable.each(function(tb) {
                        if (ta === tb) { return; }
                        var areTouching = ta.position.distanceToV(tb.position) <= ta.touchRadius + tb.touchRadius;
                        if (ta.touching) {
                            var tbWasTouchingTa = ta.touching.indexOf(tb) !== -1;
                            if (areTouching && !tbWasTouchingTa) {
                                ta.touching.push(tb);
                                if (ta.touch) { ta.touch(tb); }
                            } else if (!areTouching && tbWasTouchingTa) {
                                ta.touching.remove(tb);
                                if (ta.untouch) { ta.untouch(tb); }
                            }
                        }
                        if (tb.touching) {
                            var taWasTouchingTb = tb.touching.indexOf(ta) !== -1;
                            if (areTouching && !taWasTouchingTb) {
                                tb.touching.push(ta);
                                if (tb.touch) { tb.touch(ta); }
                            } else if (!areTouching && taWasTouchingTb) {
                                tb.touching.remove(ta);
                                if (tb.untouch) { tb.untouch(ta); }
                            }
                        }
                    });
                });
                next(dt);
            });
        })();

        function getAngle(v) {
            return Math.atan2(v.y,v.x);
        }
        function getAngleFrom(from,v) {
            return Math.atan2(v.y-from.y,v.x-from.x);
        }
        function getVectorFromAngle(angle,v) {
            v.set(
                Math.cos(angle),
                Math.sin(angle)
            );
        }
        function getVectorFromAngleRadius(angle,radius,v) {
            getVectorFromAngle(angle,v);
            v.multiply(radius);
        }
        function getPositionFromAngleRadius(angle,radius,position,v) {
            getVectorFromAngleRadius(angle,radius,v);
            v.addV(position);
        }

        //#gameobjects
        function circleFiller(r) {
            return function(g) {
                g.fillCircle(this.position.x, this.position.y, r);
            };
        }

        function slide(a, b) {
            return (a ? 0 : 1) - (b ? 0 : 1);
        }
        var zoomLevel = 0.1;
        var zoomLevelTarget = 0.1;
        g.on('mousewheel', function(delta) {
            delta = (delta > 0 ? 1 : -1);
            zoomLevelTarget = Math.max(0, zoomLevelTarget + delta);
        });
        g.chains.update.push(function(dt, next) {
            var zooming = (g.keys.z ? 1 : 0) - (g.keys.a ? 1 : 0);
            zoomLevelTarget = Math.max(0,zoomLevelTarget + zooming * 0.2);
            zoomLevel = zoomLevelTarget * 0.1 + zoomLevel * 0.9;
            g.camera.zoom = Math.pow(zoomLevel + 10, 2) / 100;
            next(dt);
        });

        // Player
        function Player() {
            this.position = new Vector(0, 0);
            this.velocity = new Vector(0, 0);
            this.movement = new Vector(0,0);
            this.angle = 0;
            this.touchRadius = this.radius = 1;
            this.touching = [];
            this.cable = null;
            this.cables = 0;
            this.attachment = null;
            this.attachmentDistance = 0;
        }
        (function(p) {
            p.updatable = true;
            p.touchable = true;
            p.foreground = true;
            p.getPosition = function(v) { v.setV(this.position); },
            p.update = function(dt) {
                var me = this;

                var movement = this.movement;
                var speed = g.keys.shift ? 0.05 : 0.3;
                if (me.attachment) {
                    this.attachmentDistance += movement.y * speed;
                    var otherAttachment = me.attachment.cable.otherAttachment(me.attachment);
                    t.setV(otherAttachment.position);
                    t.substractV(me.attachment.position);
                    var cableLength = t.length();
                    t.normalizeOrZero();
                    this.angle = Math.atan2(t.y,t.x);
                    me.velocity.setV(t);
                    me.velocity.multiply(movement.y * speed);
                    t.multiply(me.attachmentDistance);
                    t.addV(me.attachment.position);
                    me.position.setV(t);
                } else if (me.planet) {
                    var perimeter = me.planet.radius * 2 * Math.PI;
                    var angleSpeed = (speed / perimeter) * Math.PI * 2;
                    me.angle -= movement.x * angleSpeed * (me.cable ? 0 : 1);
                    me.velocity.set(me.planet.velocity.x + Math.sin(me.angle) * angleSpeed, me.planet.velocity.y + Math.cos(me.angle) * angleSpeed);
                    var d = me.radius + me.planet.radius;
                    me.position.set(me.planet.position.x + Math.cos(me.angle) * d, me.planet.position.y + Math.sin(me.angle) * d);
                }
                // g.camera.screenToWorld(g.mouse,t);
                // t.substractV(me.position);
                // t.normalize();
                // this.angle = Math.atan2(t.y,t.x);
                // t.multiply(0.005);
                // if (g.mouse.buttons[2]) {
                //  me.velocity.addV(t);
                // }
            };
            p.drawForeground = function(g) {
                var me = this;
                var scale = (1/256);
                g.context.save();
                g.context.translate(me.position.x, me.position.y);
                g.context.rotate(me.angle+Math.PI*0.5);
                g.context.scale(scale, scale);

                if (!me.cable) {
                    g.drawCenteredImage(images.hook, 0, -100);
                }

                g.context.save();
                g.context.translate(0,100);
                g.drawCenteredImage(images.car_base, 0, 0);
                g.context.scale(1.5,1.5);

                for (var x=-130;x<=130;x+=130) {
                    g.context.save();
                    g.context.translate(x,90);
                    g.context.rotate(me.angle*10);
                    g.drawCenteredImage(images.car_wheel, 0, 0);
                    g.context.restore();
                }

                g.context.restore();


                g.context.restore();
            };
            p.touch = function(other) {
                var me = this;
                // Planet transitions
                if (other.isplanet && other !== me.planet) {
                    // Transfer to other planet
                    t.setV(me.position);
                    t.substractV(other.position);
                    var newAngle = Math.atan2(t.y,t.x);
                    t.normalizeOrZero();
                    me.planet = other;
                    me.angle = newAngle;
                    me.attachment = null;
                }
            };
            p.jump = function() {
                var me = this;
                if (!me.planet) { return; }
                var closestAttachment = null;
                var closestDistance = me.radius+0.5;
                this.planet.attachments.forEach(function(a) {
                    var planetDistance = a.position.distanceToV(me.position);
                    if (planetDistance < closestDistance) {
                        closestAttachment = a;
                        closestDistance = planetDistance;
                    }
                });
                if (closestAttachment) {
                    // Ignore next touch.
                    this.touching.push(this.planet);

                    this.planet = null;
                    this.attachment = closestAttachment;
                    this.attachmentDistance = this.radius-0.001;
                }
            };
            p.fire = function() {
                if (!this.planet) {
                    return;
                }
                if (this.cable) {
                    // Cancel cable.
                    this.cables++;
                    this.cable.detach();
                    return;
                }
                if (this.cables <= 0) {
                    return;
                }
                var speed = 1;
                var cable = new Cable();
                var hook = new Hook(
                    this.position.x,
                    this.position.y,
                    this.velocity.x+Math.cos(this.angle)*speed,
                    this.velocity.y+Math.sin(this.angle)*speed
                );
                hook.angle = this.angle;
                cable.addAttachment(this);
                cable.addAttachment(hook);
                g.objects.add(cable);
                g.objects.add(hook);
                this.cables--;
            };
        })(Player.prototype);

        function Hook(x,y,vx,vy,cable) {
            this.position = new Vector(x,y);
            this.velocity = new Vector(vx,vy);
            this.touchRadius = this.radius = 0.5;
            this.touching = [];
            this.mass = 3;
        }
        (function(p) {
            p.updatable = true;
            p.foreground = true;
            p.touchable = true;
            p.getPosition = function(v) {
                v.setV(this.position);
            };
            p.applyForce = function(x,y) {
                this.velocity.add(x/this.mass,y/this.mass);
            };
            p.update = function(dt) {
                this.position.addV(this.velocity);
            };
            p.drawForeground = function(g) {
                var me = this;
                var scale = (1/256);
                g.context.save();
                g.context.translate(me.position.x, me.position.y);
                g.context.rotate(this.angle+Math.PI*0.5);
                g.context.scale(scale, scale);

                g.drawCenteredImage(images.hook, 0, -100);

                g.context.restore();
            };
            p.touch = function(other) {
                if (other.isplanet && this.cable) {
                    var cable = this.cable;
                    var otherAttachment = cable.otherAttachment(this);

                    if (other === otherAttachment.planet) {
                        // Cancel this cable if its attachments are both on the same planet.
                        this.cable.detach();
                        player.cables++;
                        return;
                    }

                    var newPlanetAttachment = new Attachment(
                        other,
                        getAngleFrom(other.position,this.position)
                    );
                    g.objects.add(newPlanetAttachment);
                    cable.swapAttachment(this,newPlanetAttachment);

                    var oldPlanetAttachment = new Attachment(
                        otherAttachment.planet,
                        getAngleFrom(otherAttachment.planet.position,otherAttachment.position)
                    );
                    g.objects.add(oldPlanetAttachment);
                    cable.swapAttachment(otherAttachment,oldPlanetAttachment);
                }
            };
            p.detached = function() {
                g.objects.remove(this);
            };
        })(Hook.prototype);

        function Attachment(planet,angle) {
            this.position = new Vector(0,0);
            this.planet = planet;
            this.angle = angle;
            this.planet.attachments.push(this);
        }
        (function(p) {
            p.foreground = true;
            p.updatable = true;
            p.update = function(dt) {
                if (!this.cable) { return; }
                getPositionFromAngleRadius(this.angle, this.planet.radius, this.planet.position, this.position);
                var otherPlanet = this.cable.otherAttachment(this).planet;
                if (otherPlanet.position.distanceToV(this.position) < otherPlanet.radius) {
                    this.cable.detach();
                }
            };
            p.applyForce = function(x,y) {
                this.planet.velocity.add(x/this.planet.mass,y/this.planet.mass);
            };
            p.drawForeground = function(g) {
                var me = this;
                var scale = (1/256);
                g.context.save();
                g.context.translate(me.position.x, me.position.y);
                g.context.rotate(this.angle-Math.PI*0.5);
                g.context.scale(scale, scale);

                g.drawCenteredImage(images.hook, 0, -60);

                g.context.restore();
            };
            p.detached = function() {
                this.planet.attachments.remove(this);
                g.objects.remove(this);
            };
        })(Attachment.prototype);

        function Cable() {
            this.attachments = new Array(2);
            this.length = 30;
        }
        (function(p) {
            p.background = true;
            p.updatable = true;
            p.update = function(dt) {
                if (!(this.attachments[0] && this.attachments[1])) { return; }
                if (!this.length) { return; }
                t.setV(this.attachments[0].position);
                t.substractV(this.attachments[1].position);
                var l = t.length();
                var over = l - this.length 
                if (over <= 0) { return; }
                t.normalizeOrZero();
                t.multiply(Math.min(3,over*0.001));
                var mass0 = this.attachments[0].mass || this.attachments[0].planet.mass;
                var mass1 = this.attachments[1].mass || this.attachments[1].planet.mass;
                var totalMass = mass0 + mass1;
                t.multiply(1/totalMass);
                if (this.attachments[1].applyForce) {
                    this.attachments[1].applyForce(
                        t.x*mass0,
                        t.y*mass0
                    );
                }
                t.negate();
                if (this.attachments[0].applyForce) {
                    this.attachments[0].applyForce(
                        t.x*mass1,
                        t.y*mass1
                    );
                }
            };
            p.drawBackground = function(g) {
                if (!this.attachments[0] || !this.attachments[1]) { return; }
                // g.strokeStyle('blue');
                // g.strokeLine(
                //     this.attachments[0].position.x, this.attachments[0].position.y,
                //     this.attachments[1].position.x, this.attachments[1].position.y
                // );
                var me = this;

                t.setV(this.attachments[0].position);
                t.substractV(this.attachments[1].position);
                var length = t.length();
                var angle = Math.atan2(t.y,t.x);//-Math.PI*0.5;

                if (length <= 0) {
                    return;
                }

                t.setV(this.attachments[0].position);
                t.addV(this.attachments[1].position);
                t.multiply(0.5);

                var scale = (1/128);
                g.context.save();
                g.context.translate(t.x, t.y);
                g.context.rotate(angle+Math.PI*0.5);
                g.context.scale(scale, length/128);

                g.drawCenteredImage(images.cable, 0, 0);

                g.context.restore();
            };
            p.otherAttachment = function(thisAttachment) {
                if (this.attachments[0] === thisAttachment) { return this.attachments[1]; }
                else if (this.attachments[1] === thisAttachment) { return this.attachments[0]; }
                else { return null; }
            };
            p.swapAttachment = function(oldAttachment,newAttachment) {
                var i = this.attachments.indexOf(oldAttachment);
                this.removeAttachment(oldAttachment);
                this.setAttachment(newAttachment,i);
            };
            p.addAttachment = function(attachment) {
                this.setAttachment(attachment, this.getFreeSlot());
            };
            p.removeAttachment = function(attachment) {
                var i = this.attachments.indexOf(attachment);
                if (i < 0) { throw "Attachment not found"; }
                if (attachment.cable !== this) { throw "Attachment not part of cable"; }
                attachment.cable = null;
                this.attachments[i] = null;
                if (attachment.detached) {
                    attachment.detached();
                }
            };
            p.setAttachment = function(attachment,slot) {
                if (attachment.cable) {
                    throw "Attachment already on cable";
                }
                if (this.attachments[slot]) {
                    throw "Slot " + slot + " already used";
                }
                if (slot < 0 || slot >= this.attachments.length) {
                    throw "Invalid slot";
                }
                this.attachments[slot] = attachment;
                attachment.cable = this;
            };
            p.getFreeSlot = function() {
                for(var i=0;i<this.attachments.length;i++) {
                    if (!this.attachments[i]) { return i; }
                }
                return -1;
            };
            p.getLength = function() {
                this.attachments[0].getPosition(t);
                this.attachments[1].getPosition(t2);
                return t.distanceToV(t2);
            };
            p.detach = function() {
                if (this.attachments[0]) { this.removeAttachment(this.attachments[0]); }
                if (this.attachments[1]) { this.removeAttachment(this.attachments[1]); }
            };
        })(Cable.prototype);

        // Planet
        function Planet(x, y, radius, image) {
            this.position = new Vector(x, y);
            this.velocity = new Vector(0, 0);
            this.mass = 4*Math.PI*(radius*radius*radius)/3 * 0.55;
            this.touchRadius = this.radius = radius;
            this.image = image || images.moon;
            this.touching = [];
            this.attachments = [];
            this.ishappy = false;
        }
        (function(p) {
            p.isplanet = true;
            p.updatable = true;
            p.touchable = true;
            p.foreground = true;
            p.update = function(dt) {
                var me = this;
                this.touching.forEach(function(t) {
                    if (!t.isplanet) { return; }
                    var totalMass = me.mass+t.mass;
                    var fraction = 0.01 * (t.mass / totalMass);
                    me.velocity.set(
                        me.velocity.x * (1-fraction) + t.velocity.x * fraction,
                        me.velocity.y * (1-fraction) + t.velocity.y * fraction
                    );
                });
                me.position.addV(me.velocity);
            };
            p.drawForeground = function(g) {
                var me = this;
                // if (me.position.distanceToV(game.camera)*game.camera.getPixelsPerMeter() > (me.radius*game.camera.getPixelsPerMeter())+game.width*game.width) {
                //  return;
                // }
                
                // g.fillStyle(this.ishappy ? 'green' : 'white');
                // g.fillCircle(me.position.x, me.position.y, me.radius);
                var size = (me.radius*2.2) * (1/512);
                g.scale(me.position.x,me.position.y,size,size,function() {
                    g.drawCenteredImage(me.image, me.position.x, me.position.y);
                    g.context.globalAlpha = 0.7;
                    g.drawCenteredImage(me.ishappy ? images.connected : images.disconnected,me.position.x,me.position.y);
                    g.context.globalAlpha = 1;
                });

                // g.strokeCircle(me.position.x,me.position.y,me.radius);
                // g.context.save();
                // g.context.translate(me.position.x,me.position.y);
                // g.context.scale(me.radius,me.radius);
                // g.context.beginPath();
                // g.context.moveTo(0,1);
                // var segments = Math.floor(100 / (1+0.01*(game.camera.zoom-1)));
                // console.log(segments);
                // for(var i=0;i<segments;i++) {
                //  var angle = i*Math.PI*2/segments;
                //  g.context.lineTo(Math.sin(angle),Math.cos(angle));
                // }
                // g.context.closePath();
                // g.fillStyle('#ffffff');
                // g.context.fill();
                // g.context.restore();
            };
        })(Planet.prototype);

        function Message(x,y,w,h,text) {
            this.position = new Vector(x,y);
            this.size = new Vector(w,h);
            this.text = text;
            this.time = 0;
        }
        (function(p) {
            p.updatable = true;
            p.foreground = true;
            p.update = function(dt) {
                this.time += dt;
            };
            p.drawForeground = function(g) {
                var padding = 0.5;
                g.context.save();
                g.context.translate(this.position.x-this.size.x*0.5,this.position.y-this.size.y*0.5);
                g.context.scale(1,-1);
                g.context.globalAlpha = 0.5;
                g.fillStyle('#000000');
                g.fillRectangle(-padding,-padding,this.size.x+padding*2,this.size.y+padding*2);
                // g.fillRectangle(0,0,this.size.x,this.size.y);
                g.context.globalAlpha = 1;
                g.fillStyle('#00ff00');
                g.font('10px monospace');
                g.context.scale(0.1,0.1);
                g.context.translate(0,10);
                var lines = this.text.split('\n');
                for(var i=0;i<lines.length;i++) {
                    g.fillText(lines[i],0,0,this.size.x);
                    g.context.translate(0,10);
                }
                g.context.restore();
            };
        })(Message.prototype);


        // Gravity
        // g.chains.update.push(function(dt,next) {
        //  g.objects.lists.grounded.each(function(o) {
        //      var planet = o.grounded;
        //      var volume = 4*Math.PI*(planet.radius*planet.radius*planet.radius)/3;
        //      var density = 0.55; // Earth density
        //      var mass = volume*density;
        //      t.setV(planet.position);
        //      t.substractV(o.position);
        //      var d = t.length();
        //      var f = 100000 / (d * d);
        //      t.normalizeOrZero();
        //      t2.setV(t);
        //      t2.multiply(f);
        //      o.velocity.addV(t2);
        //      if (d <= planet.radius+o.radius) {
        //          var v = o.velocity.dotV(t);
        //          if (v > 0) {
        //              t2.setV(t);
        //              t2.multiply(-v);
        //              o.velocity.addV(t2);
        //          }
        //      }
        //      o.position.addV(o.velocity);
        //  });
        //  next(dt);
        // });

        //#states
        function gameplayState() {
            var me = {
                enabled: false,
                enable: enable,
                disable: disable
            };

            function enable() {
                g.chains.update.push(update);
                g.chains.draw.insertBefore(draw, g.chains.draw.camera);
                g.on('mousedown', mousedown);
                g.on('keydown',keydown);
            }

            function disable() {
                g.chains.update.remove(update);
                g.chains.draw.remove(draw);
                g.removeListener('mousedown', mousedown);
                g.removeListener('keydown',keydown);
            }

            function keydown(key) {
                if (key === 'r') {
                    g.restartLevel();
                    g.changeState(gameplayState());
                } else if (key === 'space') {
                    player.fire();
                } else if (key === 'up') {
                    player.jump();
                } else if (key === 'e') {
                    g.changeState(editState());
                } else if (key === 'n') {
                    g.nextLevel();
                    g.changeState(gameplayState());
                }
            }

            function update(dt, next) {
                player.movement.set(
                    (g.keys.right ? 1 : 0) - (g.keys.left ? 1 : 0),
                    (g.keys.up ? 1 : 0) - (g.keys.down ? 1 : 0)
                );

                // Post update
                next(dt);

                var totalPlanetCount = 0;
                g.objects.lists.planet.each(function(planet) {
                    planet.ishappy = false;
                    totalPlanetCount++;
                });
                var happyPlanetCount = makeHappy(homePlanet);
                if (happyPlanetCount == totalPlanetCount) {
                    player.movement.set(0,0);
                    g.changeState(finishedLevelState());
                }
            }

            function makeHappy(planet) {
                if (planet.ishappy) { return 0; }
                var happyCount = 1;
                planet.ishappy = true;
                planet.attachments.forEach(function(attachment) {
                    happyCount += makeHappy(attachment.cable.otherAttachment(attachment).planet);
                });
                planet.touching.forEach(function(touch) {
                    if (touch.isplanet) {
                        happyCount += makeHappy(touch);
                    }
                });
                return happyCount;
            }

            function draw(g, next) {
                // Draw HUD
                next(g);
                drawHUD(g);
            }

            function mousedown(button) {}
            return me;
        }

        function editState() {
            var me = {
                enabled: false,
                enable: enable,
                disable: disable
            };

            function enable() {
                g.chains.update.push(update);
                g.chains.draw.insertBefore(draw, g.chains.draw.camera);
                g.on('keydown',keydown);
                g.on('mousedown',mousedown);
            }

            function disable() {
                g.chains.update.remove(update);
                g.chains.draw.remove(draw);
                g.removeListener('keydown',keydown);
                g.removeListener('mousedown',mousedown);
            }

            function keydown(key) {
                if (key === 'e') {
                    g.changeState(gameplayState());
                } else if (key === 'p') {
                    var s = '[\n';
                    g.objects.lists.planet.each(function(p) {
                        s += 'new Planet('+Math.round(p.position.x,2)+','+Math.round(p.position.y,2)+','+p.radius+'),\n';
                    });
                    s = s.substr(0,s.length-2);
                    s += '\n]';
                    console.log(s);
                }
            }

            function mousedown(button) {
                var mousePosition = new Vector(0,0);
                g.camera.screenToWorld(g.mouse,mousePosition);
                console.log(button,mousePosition.x,mousePosition.y);
                if (button === 0) {
                    var planet = new Planet(mousePosition.x, mousePosition.y, 5);
                    g.objects.add(planet);
                } else if (button === 2) {
                    var planet;
                    g.objects.lists.planet.each(function(o) {
                        if (o.position.distanceToV(mousePosition) < o.radius) {
                            planet = o;
                        }
                    });
                    if (planet) {
                        g.objects.remove(planet);
                    }
                }
            }

            function update(dt, next) {
                // Post update
                next(dt);
            }

            function draw(g, next) {
                // Draw HUD
                var mousePosition = new Vector(0,0);
                game.camera.screenToWorld(game.mouse,mousePosition);

                next(g);

                g.fillStyle('white');
                g.fillText(Math.round(player.position.distanceToV(mousePosition),2),game.mouse.x,game.mouse.y);
                g.fillCenteredText('EDIT',game.width*0.5,50);
            }
            return me;
        }

        function finishedLevelState() {
            var me = {
                enabled: false,
                enable: enable,
                disable: disable
            };

            function enable() {
                g.chains.update.push(update);
                g.chains.draw.insertBefore(draw, g.chains.draw.camera);
                g.on('keydown',keydown);
            }

            function disable() {
                g.chains.update.remove(update);
                g.chains.draw.remove(draw);
                g.removeListener('keydown',keydown);
            }

            function keydown(key) {
                if (key === 'space') {
                    g.nextLevel();
                    g.changeState(gameplayState());
                } else if (key === 'r') {
                    g.restartLevel();
                    g.changeState(gameplayState());
                }
            }

            function update(dt, next) {
                // Post update
                next(dt);
            }

            function draw(g, next) {
                // Draw HUD
                next(g);
                g.drawCenteredImage(images.finish,game.width*0.5,game.height*0.5);
                g.drawCenteredImage(images.spacecontinue,game.width*0.5,game.height-60);
            }
            return me;
        }

        function drawHUD(g) {

            var x = game.width*0.5 - player.cables*0.5*40;
            for(var i=0;i<player.cables;i++) {
                g.context.save();
                g.context.translate(x+i*20,40);
                g.context.rotate(Math.cos(game.time+i*7)*0.3);
                var scale = (1+Math.cos(game.time*0.5)*0.1) * 0.1;
                g.context.scale(scale,scale);
                g.drawCenteredImage(images.hook,0,0);
                g.context.restore();
            }
            // g.fillStyle('white');
            // var cablesText = isFinite(player.cables) ? player.cables.toString() : '∞';
            // g.fillCenteredText(player.cables + ' cables',game.width*0.5,50);
        }

        function createHighlightMask(x, y, radius) {
            var mask = document.createElement('canvas');
            mask.width = game.width;
            mask.height = game.height;
            var ctx = mask.getContext('2d');
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, game.width, game.height);
            ctx.globalCompositeOperation = 'xor';
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.fill();
            return mask;
        }

        function drawProgress(g, amount, max) {
            var size = 64;
            var maxCeil = Math.ceil(max);
            var columns = Math.ceil(Math.sqrt(max));
            g.scale(0, 0, 0.5, 0.5, function() {
                g.strokeStyle('white');
                g.fillStyle('white');
                for (var i = 0; i < maxCeil; i++) {
                    var x = Math.floor(i / columns);
                    var y = i % columns;
                    var scale;
                    scale = Math.max(0, Math.min(1, max - i));
                    g.strokeCircle(x * size, y * size, size * 0.5);
                    scale = Math.max(0, Math.min(1, amount - i));
                    g.scale(x * size, y * size, scale, scale, function() {
                        g.drawCenteredImage(images.bubble, x * size, y * size);
                    });
                }
            });
        }
        var player;
        var homePlanet;
        g.on('levelchanged', function() {
            homePlanet = game.level.objects[0];
            player = new Player();
            player.cables = game.level.cables;
            player.position.set(0, 0);
            player.angle = Math.PI*0.5;
            player.planet = homePlanet;
            g.objects.add(player);
        });
        g.chains.draw.insertBefore(function(g, next) {
            next(g);
        }, g.chains.draw.objects);
        g.on('levelunloaded', function() {
            g.objects.clear();
            g.objects.handlePending();
        });
        g.changeLevel(level_1planet());

        function flatten(arr) {
            var r = [];
            for (var i = 0; i < arr.length; i++) {
                if (arr[i].length !== undefined) {
                    r = r.concat(flatten(arr[i]));
                } else {
                    r.push(arr[i]);
                }
            }
            return r;
        }

        //#levels

        function level_1planet() {
            return {
                cables: 1,
                objects: flatten([
new Planet(0, 0, 10,images.earth01),
new Planet(20, 0, 5,images.earth02),
new Message(0,25,15,8,'Welcome power engineer.\nWe need you to power all\nour neighbor planets.\nYou can move around with\nthe arrow keys and shoot\na power cable using\nspacebar. Good luck.')
]),
                clone: arguments.callee,
                nextLevel: level_3circle
            };
        }

        function level_3circle() {
            return {
                cables: 3,
                objects: flatten([
new Planet(0, 0, 10,images.earth03),
new Planet(20, 0, 5,images.earth01),
new Planet(-20, 10, 5,images.earth02),
new Planet(-20, -10, 5,images.earth05),
new Message(0,20,15,4,'Notice that you only get\na limited number of\ncables to do your job.'),
new Message(0,-12,15,3,'You can start over by\npressing R.')
]),
                clone: arguments.callee,
                nextLevel: level_lineof3planets
            };
        }

        function level_lineof3planets() {
            return {
                cables: 3,
                objects: flatten([
new Planet(0,0,10,images.earth04),
new Planet(-76,-5,5,images.earth01),
new Planet(-51,1,5,images.earth02),
new Planet(-26,-2,5,images.earth03),
new Message(0,24,15,7,'Nice job.\nSome of our planets are\nfurther away. Place a\ncable and hop onto it\nusing the up and\ndown buttons.')
]),
                clone: arguments.callee,
                nextLevel: level_longdistance
            };
        }

        function level_longdistance() {
            return {
                cables: 1,
                objects: flatten([
new Planet(0,0,10,images.earth03),
new Planet(66,0,5,images.earth04),
new Message(0,22,15,6,'You\'re doing good work.\nTime to let you do long\ndistance connections.\n\nUse A and Z to zoom.')
]),
                clone: arguments.callee,
                nextLevel: level_crashsmallintobig
            };
        }

        function level_crashsmallintobig() {
            return {
                cables: 1,
                objects: flatten([
new Planet(0,0,10,images.earth01),
new Planet(40,10,8,images.earth02),
new Planet(66,0,5,images.earth05),
new Message(0,22,15,6,'Planets can power other\nplanets if they make\ncontact.\nDon\'t question it,\nwe\'re just doing our job.')
]),
                clone: arguments.callee,
                nextLevel: level_crashsmallinto2
            };
        }

        function level_crashsmallinto2() {
            return {
                cables: 1,
                objects: flatten([
new Planet(0,0,10,images.earth04),
new Planet(-18,0,5,images.earth03),
new Planet(64,-1,5,images.earth02)
]),
                clone: arguments.callee,
                nextLevel: level_launch
            };
        }

        function level_launch() {
            return {
                cables: 2,
                objects: flatten([
new Planet(0,0,5,images.earth01),
new Planet(1,52,10,images.earth05),
new Planet(47,50,10,images.earth03),
new Planet(-42,54,10,images.earth04)
]),
                clone: arguments.callee,
                nextLevel: level_diagonalshot
            };
        }

        function level_diagonalshot() {
            return {
                cables: 2,
                objects: flatten([
new Planet(0,0,10,images.earth02),
new Planet(12,14,5,images.earth05),
new Planet(-79,0,5,images.earth04),
new Planet(1,-69,5,images.earth03)
]),
                clone: arguments.callee,
                nextLevel: level_planetinbetween
            };
        }

        function level_planetinbetween() {
            return {
                cables: 3,
                objects: flatten(
[
new Planet(0,0,10,images.earth03),
new Planet(67,-51,5,images.earth04),
new Planet(76,-35,5,images.earth01),
new Planet(123,-2,10,images.earth05),
new Planet(25,1,5,images.earth02)
]),
                clone: arguments.callee,
                nextLevel: level_nuts
            };
        }

        function level_nuts() {
            return {
                cables: 8,
                objects: flatten(
                    [
new Planet(0, 0, 10,images.earth01),
new Planet(50,41,5,images.earth02),
new Planet(71,90,5,images.earth03),
new Planet(52,137,5,images.earth04),
new Planet(-12,163,5,images.earth05),
new Planet(-63,158,5,images.earth01),
new Planet(-90,121,5,images.earth02),
new Planet(-102,68,5,images.earth03),
new Planet(-74,22,5,images.earth01),
new Message(0,20,15,3,'Lots of work to do\nhere. Go nuts!')
]),
                clone: arguments.callee,
                nextLevel: level_final
            };
        }

        function level_final() {
            return {
                cables: 0,
                objects: flatten([
new Planet(0, 0, 10,images.earth01),
new Planet(-33,0,5),
new Planet(-12,-31,5),
new Planet(25,-27,5),
new Planet(34,5,5),
new Planet(-2,32,5),
new Message(0,20,15,4,'That\'s it. We\'re out\nof cables and levels!\nThanks for playing!')
]),
                clone: arguments.callee,
                nextLevel: level_final
            };
        }

        g.changeState(gameplayState());
        game.objects.handlePending();
        game.camera.reset();
        g.start();
    }
});