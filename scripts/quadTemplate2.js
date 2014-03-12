////////////
//global
////////////

var clock, 
    camera, 
    scene,
    renderer,
    stats,
    container,
    deltaTime,
    time,
    scrHEIGHT,
    scrWIDTH,
    scrASPECT;


////////////
//quad 
////////////

//main quad
var quadMesh,
    quadMaterial;




//render textures and water

var quadMeshWater,
    quadMaterialWater;

var rttBuffer1,
    rttBuffer2,
    rttBuffer3,
    BUFFERSIZE;

var mouse = {
    x:0,
    y:0
}




////////////
//gui 
////////////

var guiParam = {
    damping: 1,
    speed: 1,
    speedNth: 1
};

var gui = new dat.GUI({});

gui.add(guiParam, "damping", .9, 1).onChange(function(){
    quadMeshWater.material.uniforms._damping.value = guiParam.damping;
});
gui.add(guiParam, "speed", .5, 1).name('duration').onChange(function(){
    quadMeshWater.material.uniforms._speed.value = guiParam.speed;
});

gui.add(guiParam, "speedNth", 1, 6).step(1);


init();


function initBuffers(){
    BUFFERSIZE = 256;
    rttBuffer1 = new THREE.WebGLRenderTarget(
        BUFFERSIZE, 
        BUFFERSIZE, { 
            minFilter: THREE.NearestFilter, 
            magFilter: THREE.NearestFilter, 
            // minFilter: THREE.LinearFilter, 
            // magFilter: THREE.LinearFilter, 


            format: THREE.RGBFormat,
            // type: THREE.FloatType
            // stencil:false
        });
    rttBuffer2 = new THREE.WebGLRenderTarget(
        BUFFERSIZE, 
        BUFFERSIZE, { 
            minFilter: THREE.NearestFilter, 
            magFilter: THREE.NearestFilter, 
            // minFilter: THREE.LinearFilter, 
            // magFilter: THREE.LinearFilter, 


            format: THREE.RGBFormat,
            // type: THREE.FloatType
            // stencil:false
        });
    rttBuffer3 = new THREE.WebGLRenderTarget(
        BUFFERSIZE, 
        BUFFERSIZE, { 
            minFilter: THREE.NearestFilter, 
            magFilter: THREE.NearestFilter, 
            // minFilter: THREE.LinearFilter, 
            // magFilter: THREE.LinearFilter, 


            format: THREE.RGBFormat,
            // type: THREE.FloatType
            // stencil:false
        });
}





function init() {

    initBuffers();

    time = 0;


    //DOM element
    container = document.getElementById("container");

    //window info
    scrWIDTH = window.innerWidth;
    scrHEIGHT = window.innerHeight;
    // console.log(scrWIDTH, scrHEIGHT);
    scrASPECT = scrWIDTH / scrHEIGHT;

    //init renderera
    if ( Detector.webgl )
        renderer = new THREE.WebGLRenderer();
    else
        renderer = new THREE.CanvasRenderer(); 

    renderer.setSize(scrWIDTH, scrHEIGHT);
    container.appendChild( renderer.domElement );
    renderer.autoClear = false;
    renderer.autoClearColor = false;
    console.log(renderer);

    clock = new THREE.Clock;
    scene = new THREE.Scene;

    camera = new THREE.PerspectiveCamera(35, scrASPECT , 0.5, 200);
    scene.add(camera);

    //resize event
    window.addEventListener("resize", onWindowResize, false);
    
    //stats
    stats = new Stats;
    stats.domElement.style.position = "absolute";
    stats.domElement.style.bottom = "0px";
    stats.domElement.style.zIndex = 100; 
    container.appendChild(stats.domElement);

    texture = new THREE.ImageUtils.loadTexture( './textures/airport_night_final.jpg' );


    //custom uniforms
    var quadUniforms = {
    
        //texture
        _texture:{
            type:"t",
            value: texture
        },
        _texelSize:{
            type:"f",
            value: 1/BUFFERSIZE
        }

    }

    //custom shader material
    quadMaterial = new THREE.ShaderMaterial({
        uniforms: quadUniforms,
        vertexShader: jQuery("#vertexShader").text(),
        fragmentShader: jQuery("#fragmentShader").text()
    });  


    //full screen quad
    quadMesh = new THREE.Mesh(new THREE.PlaneGeometry(2,2,1,1), quadMaterial);
    scene.add(quadMesh);
    

    //custom uniforms
    var quadUniformsWater = {
        
        _waterTwoFrameBefore:{
            type:"t",
            value: null
        },
        _waterPreviousFrame:{
            type:"t",
            value: null
        },
        _mousePos:{
            type:"v2",
            value: new THREE.Vector2()
        },
        _currentBfNumber:{
            type:"i",
            value: 1
        },
        _mouseClicked:{
            type:"i",
            value: 0
        },
        _time:{
            type:"f",
            value:0
        },
        _size:{
            type:"f",
            value:BUFFERSIZE
        },
        _damping:{
            type:"f",
            value: guiParam.damping
        },
        _speed:{
            type:"f",
            value: guiParam.speed
        }

    }

    //custom shader material water
    quadMaterialWater = new THREE.ShaderMaterial({
        uniforms: quadUniformsWater,
        vertexShader: jQuery("#vertexShaderWater").text(),
        fragmentShader: jQuery("#fragmentShaderWater").text()
    });  
    quadMeshWater = new THREE.Mesh(new THREE.PlaneGeometry(2,2,1,1), quadMaterialWater);
    scene.add(quadMeshWater);

    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
   
    document.addEventListener( 'mousedown', onDocumentMouseDown, false );
    document.addEventListener( 'mouseup', onDocumentMouseUP, false );




    //start the render loop
    animate();
}

var frameCounter = 0;
function animate() {
    requestAnimationFrame( animate ); 
    update();
    renderer.clear();
    // renderNth(guiParam.speedNth, frameCounter );
    renderWater();
    render();
    frameCounter++;
}


function animate2() {
    setTimeout( function() {
        requestAnimationFrame( animate );
    }, 1000 / 1 );
    update();
}

var counter = 0;
var countTo = 10;

function update(){

    deltaTime = clock.getDelta();
    time += deltaTime;
    quadMeshWater.material.uniforms._time.value = time;
    shaderClicked();
    stats.update();
    counter++;
    if (counter==countTo){
        counter=0;
        var randomDropletPosition = new THREE.Vector2(Math.random(), Math.random());
        quadMeshWater.material.uniforms._mousePos.value.set(randomDropletPosition.x, randomDropletPosition.y);
        quadMeshWater.material.uniforms._mouseClicked.value = 1;
    }
    else
        quadMeshWater.material.uniforms._mouseClicked.value = 0;

}

var flipFlop = true;
var changeTo3rd = true;


var bufferOrder = 0;

function renderNth(frameN, frameCurrent){
    if(frameCurrent%frameN == 0)
        renderWater();
}

function renderWater(){


    //render water effect first
    quadMesh.visible = false;
    quadMeshWater.visible = true;

    var thisFrame,
        oneFrameAgo,
        twoFrameAgo;

    if(bufferOrder ==0){
        thisFrame = rttBuffer1;
        oneFrameAgo = rttBuffer2;
        twoFrameAgo = rttBuffer3;
        quadMeshWater.material.uniforms._waterPreviousFrame.value = oneFrameAgo;
        quadMeshWater.material.uniforms._waterTwoFrameBefore.value = twoFrameAgo;
        renderer.render(scene, camera, rttBuffer1,true);
        quadMesh.material.uniforms._texture.value = rttBuffer1;

    }
    else if(bufferOrder ==1){
        thisFrame = rttBuffer3;
        oneFrameAgo = rttBuffer1;
        twoFrameAgo = rttBuffer2;
        quadMeshWater.material.uniforms._waterPreviousFrame.value = oneFrameAgo;
        quadMeshWater.material.uniforms._waterTwoFrameBefore.value = twoFrameAgo;
        renderer.render(scene, camera, rttBuffer3,true);
        quadMesh.material.uniforms._texture.value = rttBuffer3;

    }
    else if(bufferOrder ==2){
        thisFrame = rttBuffer2;
        oneFrameAgo = rttBuffer3;
        twoFrameAgo = rttBuffer1;
        quadMeshWater.material.uniforms._waterPreviousFrame.value = oneFrameAgo;
        quadMeshWater.material.uniforms._waterTwoFrameBefore.value = twoFrameAgo;
        renderer.render(scene, camera, rttBuffer2,true);
        quadMesh.material.uniforms._texture.value = rttBuffer2;

    }   

    quadMeshWater.visible = false;
    quadMesh.visible = true;

    bufferOrder++;
    if(bufferOrder > 2)
        bufferOrder = 0;


}

function render(){
    // mouse


   
    renderer.render(scene, camera);
    


}


function onWindowResize(){

    //get new info about the window
    scrWIDTH = window.innerWidth;
    scrHEIGHT = window.innerHeight;
    console.log(scrWIDTH, scrHEIGHT);
    scrASPECT = scrWIDTH / scrHEIGHT;
    
    //apply where needed
    quadMesh.material.uniforms._scrSizeAsp.value.set(scrWIDTH, scrHEIGHT, scrASPECT);//say we want to let the shader know this
    renderer.setSize(scrWIDTH, scrHEIGHT);
}


function deg2rad(val){
    return val*(Math.PI/180);
}



 
var loopCounter = 0;
function onDocumentMouseMove( event ) 
{      
    if(loopCounter%100==0)
        console.log(mouse.x, mouse.y);
    // mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    // mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    mouse.x = ( event.clientX / window.innerWidth );
    mouse.y = 1 - ( event.clientY / window.innerHeight );
    loopCounter++;
}


var clickOnce = false;

function onDocumentMouseDown( event ) 
{
    clickOnce = true;
    console.log(clickOnce);
}

function onDocumentMouseUP( event ) 
{
    clickOnce = false;
    console.log(clickOnce);
}

function shaderClicked(){
    quadMeshWater.material.uniforms._mouseClicked.value = clickOnce ? 1 : 0;

    // clickOnce = false;

}