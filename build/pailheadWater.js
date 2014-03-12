//first version
//3 buffers, i couldn't do it with two
//need to add the shader to turn the heightfield into a normal map,
//example:
//http://dusanbosnjak.com/test/webGL/new/waterShader/waterShader.html


var pailhead = pailhead || {};


pailhead.waterShader = function (scn, bufferSize, nth){
	
	if(!scn){
		console.log("you must designate a scene");
		return;
	}
	else
		this.effectScene = scn;


	this.settings = {
		damping:.95,
		duration: 1,
		nth : nth || 1,
		dropletNth : 10,
		strength : 1
	}


	this.dropletCounter = 0;//frames
	this.globalCounter = 0;


	this.BUFFERSIZE = bufferSize || 256;

	this.renderTextures = {
		currentFrameOutput:null,
		previousFrame:null,
		twoFramesAgo:null
	}

	this.renderBuffers = [];
	this.bufferIndex = [];

    this.initBuffers();
	this.initMaterials();
    this.initEffectScene();
}

pailhead.waterShader.prototype = {
	update: function(){
		//updpate counter
		this.counter ++;
		this.globalCounter++;
		this.generateDroplet(this.settings.dropletNth);
		this.renderWater();

		this.quadMeshWater.material.uniforms._damping.value = this.settings.damping;
		this.quadMeshWater.material.uniforms._duration.value = this.settings.duration;
		this.quadMeshWater.material.uniforms._strength.value = this.settings.strength;

		
	},

	initBuffers: function (){
		for (var i=0; i<3; i++){
			this.renderBuffers[i] = new THREE.WebGLRenderTarget(BUFFERSIZE, BUFFERSIZE, { 
	            minFilter: THREE.LinearFilter, 
	            magFilter: THREE.LinearFilter, 
	            format: THREE.RGBFormat
        	});
        	this.renderBuffers[i].name = "buffer"+i;
        	this.bufferIndex[i] = i;
		}	

		console.log('\u25e4\u25e2\u25e4\u25e2 pailhead.waterShader \u25e3\u25e5\u25e3\u25e5');
		console.log('..renderBuffers initialized');
		console.log(this.renderBuffers);
	},

	initEffectScene: function (){
    	this.effectCamera = new THREE.PerspectiveCamera(35, scrASPECT , 0.5, 200);
    	this.quadMeshWater = new THREE.Mesh(new THREE.PlaneGeometry(2,2,1,1), this.quadMaterialWater);

    	this.effectScene.add(this.effectCamera);
    	this.effectScene.add(this.quadMeshWater);

		console.log('\u25e4\u25e2\u25e4\u25e2 pailhead.waterShader \u25e3\u25e5\u25e3\u25e5');
		console.log('..scene effect initialized');
		console.log(this.effectScene);
		console.log(this.effectCamera);
		console.log(this.quadMeshWater);
	},

	initMaterials: function(){
		this.shaderUniforms = {
	        _waterTwoFrameBefore:{
	            type:"t",
	            value: null
	        },
	        _waterPreviousFrame:{
	            type:"t",
	            value: null
	        },
	        _dropletPos:{
	            type:"v2",
	            value: new THREE.Vector2()
	        },
	        _makeDroplet:{
	            type:"i",
	            value: 0
	        },
	        _size:{
	            type:"f",
	            value:this.BUFFERSIZE
	        },
	        _damping:{
	            type:"f",
	            value: .95
	        },
	        _duration:{
	            type:"f",
	            value: 1.0
	        },
	        _strength:{
	        	type:"f",
	        	value: this.settings.strength
	        }
	    }
    	//custom shader material water
    	this.quadMaterialWater = new THREE.ShaderMaterial({
	        uniforms: this.shaderUniforms,
	        
	        vertexShader: [
		        'varying vec2 vUv;',
				'void main(){',
				'vUv = uv;',
				'gl_Position = vec4(position.xy, -.041, 1.0);',
				'}'
			].join("\n"),

	        fragmentShader: [
				'varying vec2 vUv;',
				'uniform sampler2D _waterPreviousFrame;',
				'uniform sampler2D _waterTwoFrameBefore;',
				'uniform vec2 _dropletPos;',
				'uniform int _makeDroplet;',
				'uniform float _size;',
				'uniform float _damping;',
				'uniform float _duration;',
				'uniform float _strength;',

				'void main(){',
				'float texelSize = 1.0/_size;', //resi se
				'texelSize *= _duration;',
				'vec2 UV = vUv;',
			  	'ivec2 iUV = ivec2(int(UV.x*_size), int(UV.y*_size));',
			  	'ivec2 iPos = ivec2(int(_dropletPos.x * _size), int(_dropletPos.y * _size));',
			  	'float dropValue = 0.0;',
			  	'if(_makeDroplet==1)',
			  	'if(iUV==iPos)',
		  		'dropValue+=_strength;',
				'vec2 twoFramesAgo = texture2D(_waterTwoFrameBefore, vec2(UV)).xy;',
				'vec2 oneFrameAgo = texture2D(_waterPreviousFrame, vec2(UV.x, UV.y)).xy;',
				'vec4 bluredPreviousFrame = (',
				'		texture2D(_waterPreviousFrame, vec2(UV.x - texelSize, UV.y) )',
				'	+	texture2D(_waterPreviousFrame, vec2(UV.x + texelSize, UV.y) )',
				'	+	texture2D(_waterPreviousFrame, vec2(UV.x, UV.y + texelSize) )',
				'	+	texture2D(_waterPreviousFrame, vec2(UV.x, UV.y - texelSize) )',
				'	) * .25; ',
				'vec2 currentResult = bluredPreviousFrame.xy * 2.0 - twoFramesAgo;',
				'currentResult *= _damping;',
				'currentResult.x += dropValue;',
				'gl_FragColor = vec4(currentResult, 0.0, 1.0);',
				'}'

	        ].join("\n")
    	});  
	},


	generateDroplet: function(countTo){
		if(!countTo)
			countTo = 1;

	    if (this.globalCounter%countTo == 0){

	        var randomDropletPosition = new THREE.Vector2(Math.random(), Math.random());

	        this.quadMeshWater.material.uniforms._dropletPos.value.set(randomDropletPosition.x, randomDropletPosition.y);
	        this.quadMeshWater.material.uniforms._makeDroplet.value = 1;
	    }
	    else
	        this.quadMeshWater.material.uniforms._makeDroplet.value = 0;
	},


	renderWater: function(){

		if(this.globalCounter%this.settings.nth!=0)
			return;
		
		renderer.clear();

	    this.quadMeshWater.visible = true;

	    //shift buffers
	    for(var i = 0; i<3; i++){
	    	this.bufferIndex[i]--;
	    	this.bufferIndex[i] = this.bufferIndex[i] < 0 ? this.bufferIndex[i] + 3 : this.bufferIndex[i];
	    }

	    this.output = this.renderBuffers[this.bufferIndex[0]];
	    this.oneFrameAgo = this.renderBuffers[this.bufferIndex[1]];
	    this.twoFrameAgo = this.renderBuffers[this.bufferIndex[2]];
	    this.quadMeshWater.material.uniforms._waterPreviousFrame.value = this.oneFrameAgo;
	    this.quadMeshWater.material.uniforms._waterTwoFrameBefore.value = this.twoFrameAgo;
	    renderer.render(this.effectScene, this.effectCamera, this.output, true);
	    this.quadMeshWater.visible = false;
	}
}
		


