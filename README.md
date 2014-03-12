rainDropletShader
=================

three.js rain droplet GLSL shader


I couldn't pull this off with two buffers, so if anyone has any tips... by all means.

The idea was to call this waterShader object, and update it every frame. There is another shader in the html file that lerps the quad form screen to 3d.


for now its at this

```javascript

    waterShader = new pailhead.waterShader(scene, BUFFERSIZE);
    
    //render loop
    waterShader.update();
    
```


Original work:
http://freespace.virgin.net/hugo.elias/graphics/x_water.htm
