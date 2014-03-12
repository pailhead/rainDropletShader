////////////////////////////////////
//global
////////////////////////////////////

var controls,
    clock, 
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

var BUFFERSIZE = 256;

var mouse = {
    x:0,
    y:0
}

////////////////////////////////////
//quad 
////////////////////////////////////

//main quad
var quadMesh,
    quadMaterial;

var twn = {val:1};
var tween;








////////////////////////////////////
//gui 
////////////////////////////////////

var guiParam = {
    damping: 1,
    duration: 1,
    speedNth: 1,
    dropletNth: 10,
    strength: 1,
    tweening: false,
    screen2threed: function(){

        function updateLerpShader( val ){
            quadMesh.material.uniforms._lerpFromScreen.value = val;
            // console.log(val);
        }
        
        var twTime = 3000;

        if(tween)
            tween.stop();

        if(guiParam.tweening){

            console.log('TWEEN VALUE IS = ' + twn.val);
            tween = new TWEEN.Tween( twn )
            .to(  {val:1} , twTime )
            .easing( TWEEN.Easing.Quadratic.InOut )
            .onUpdate( function(){
                updateLerpShader(twn.val);
            })
            .start();

        } else {
            console.log('TWEEN VALUE IS = ' + twn.val);

            tween = new TWEEN.Tween(  twn  )
            // tween.Tween( twn )
            .to(  {val:0} , twTime )
            .easing( TWEEN.Easing.Quadratic.InOut )
            .onUpdate( function(){
                updateLerpShader(twn.val);
            })
            .start();

        }
        guiParam.tweening = !guiParam.tweening;
    }
};

var gui = new dat.GUI({});

gui.add(guiParam, "damping", .9, 1).onChange(function(){
    waterShader.settings.damping = guiParam.damping;
});
gui.add(guiParam, "duration", .5, 1).name('duration').onChange(function(){
    waterShader.settings.duration = guiParam.duration;
});

gui.add(guiParam, "speedNth", 1, 6).step(1).onChange(function(){
    waterShader.settings.nth = guiParam.speedNth;
});
gui.add(guiParam, "dropletNth", 1, 20).step(1).onChange(function(){
    waterShader.settings.dropletNth = guiParam.dropletNth;
});
gui.add(guiParam, "strength", 0, 3).step(.01).onChange(function(){
    waterShader.settings.strength = guiParam.strength;
});
gui.add(guiParam, "screen2threed");


init();






var waterShader;


function init() {



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





    time = 0;


    waterShader = new pailhead.waterShader(scene, BUFFERSIZE, 1 );

    camera = new THREE.PerspectiveCamera(35, scrASPECT , 0.5, 200);
    scene.add(camera);
    camera.position.set(2,2,2);

    
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
            value: null
        },
        _texelSize:{
            type:"f",
            value: 1/BUFFERSIZE
        },
        _lerpFromScreen:{
            type:"f",
            value: 1
        }

    }

    //custom shader material
    quadMaterial = new THREE.ShaderMaterial({
        uniforms: quadUniforms,
        vertexShader: jQuery("#vertexShader").text(),
        fragmentShader: jQuery("#fragmentShader").text()
    });  


    quadMesh = new THREE.Mesh(new THREE.PlaneGeometry(2,2,1,1), quadMaterial);
    quadMesh.rotation.x = (-Math.PI/2);
    scene.add(quadMesh);
    quadMesh.visible = false;

    controls = new THREE.OrbitControls( camera );
    controls.addEventListener( 'change', render );

    window.addEventListener("resize", onWindowResize, false);



    //start the render loop
    animate();
}



function animate() {
    requestAnimationFrame( animate ); 
    update();
    renderer.clear();
    waterShader.update();
    quadMesh.visible = true;
    render();
    quadMesh.visible = false;
}


function animate2() {
    setTimeout( function() {
        requestAnimationFrame( animate );
    }, 1000 / 1 );
    update();
    renderer.clear();
    waterShader.update();
}

var counter = 0;
var countTo = 10;

function update(){

    deltaTime = clock.getDelta();
    time += deltaTime;
    stats.update();
    TWEEN.update();
    controls.update();
}




function render(){


    quadMesh.material.uniforms._texture.value = waterShader.output;
    // console.log('water shader output');
    // console.log(waterShader.output.name);
    renderer.render(scene, camera);
    


}


function onWindowResize(){

    //get new info about the window
    scrWIDTH = window.innerWidth;
    scrHEIGHT = window.innerHeight;
    console.log(scrWIDTH, scrHEIGHT);
    scrASPECT = scrWIDTH / scrHEIGHT;
    renderer.setSize(scrWIDTH, scrHEIGHT);
}


function deg2rad(val){
    return val*(Math.PI/180);
}



function onDocumentMouseMove( event ) 
{      
    // mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    // mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    mouse.x = ( event.clientX / window.innerWidth );
    mouse.y = 1 - ( event.clientY / window.innerHeight );
}

