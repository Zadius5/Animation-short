
var canvas;
var gl;

var program;

var near = 1;
var far = 100;


var left = -6.0;
var right = 6.0;
var ytop =6.0;
var bottom = -6.0;


var lightPosition2 = vec4(100.0, 100.0, 100.0, 1.0 );
var lightPosition = vec4(0.0, 0.0, 100.0, 1.0 );
var lightPosition3 = vec4(0.0,100.0,0.0,1.0);

var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialSpecular = vec4( 0.4, 0.4, 0.4, 1.0 );
var materialShininess = 30.0;
var defaultSpecular = vec4( 0.4, 0.4, 0.4, 1.0 );
var defaultShininess = 30.0;
//lighting and shader variables
var ambientColor, diffuseColor, specularColor;
var cellshadeangle1 = Math.cos(60*Math.PI/180);
var cellshadeangle2 = Math.cos(120*Math.PI/180);
var impact = 0;
var pointofimpact = vec4(0.0,0.0,0.0,1.0);
var impactangle1 = Math.cos(90*Math.PI/180);
var impactangle2 = Math.cos(45*Math.PI/180);
var modelMatrix, viewMatrix, modelViewMatrix, projectionMatrix, normalMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc, viewMatrixLoc;
var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var RX = 0;
var RY = 0;
var RZ = 0;

var MS = []; // The modeling matrix stack
var TIME = 0.0; // Realtime
var dt = 0.0
var prevTime = 0.0;
var resetTimerFlag = true;

//imported noise function source: https://www.zazow.com/info/perlin-noise.php
const PERLIN_YWRAPB = 4;
const PERLIN_YWRAP = 1 << PERLIN_YWRAPB;
const PERLIN_ZWRAPB = 8;
const PERLIN_ZWRAP = 1 << PERLIN_ZWRAPB;
const PERLIN_SIZE = 4095;
const scaled_cosine = i => 0.5 * (1.0 - Math.cos(i * Math.PI));
var perlin = null;
let perlin_octaves = 4; // default to medium smooth
let perlin_amp_falloff = 0.55; // 50% reduction/octave

noise = function(x, y = 0, z = 0) {
    if (perlin == null) {
    perlin = new Array(PERLIN_SIZE + 1);
    for (let i = 0; i < PERLIN_SIZE + 1; i++) {
        perlin[i] = Math.random();
    }
    }

    if (x < 0) {
    x = -x;
    }
    if (y < 0) {
    y = -y;
    }
    if (z < 0) {
    z = -z;
    }

    let xi = Math.floor(x),
    yi = Math.floor(y),
    zi = Math.floor(z);
    let xf = x - xi;
    let yf = y - yi;
    let zf = z - zi;
    let rxf, ryf;

    let r = 0;
    let ampl = 0.5;

    let n1, n2, n3;

    for (let o = 0; o < perlin_octaves; o++) {
    let of = xi + (yi << PERLIN_YWRAPB) + (zi << PERLIN_ZWRAPB);

    rxf = scaled_cosine(xf);
    ryf = scaled_cosine(yf);

    n1 = perlin[of & PERLIN_SIZE];
    n1 += rxf * (perlin[(of + 1) & PERLIN_SIZE] - n1);
    n2 = perlin[(of + PERLIN_YWRAP) & PERLIN_SIZE];
    n2 += rxf * (perlin[(of + PERLIN_YWRAP + 1) & PERLIN_SIZE] - n2);
    n1 += ryf * (n2 - n1);

    of += PERLIN_ZWRAP;
    n2 = perlin[of & PERLIN_SIZE];
    n2 += rxf * (perlin[(of + 1) & PERLIN_SIZE] - n2);
    n3 = perlin[(of + PERLIN_YWRAP) & PERLIN_SIZE];
    n3 += rxf * (perlin[(of + PERLIN_YWRAP + 1) & PERLIN_SIZE] - n3);
    n2 += ryf * (n3 - n2);

    n1 += scaled_cosine(zf) * (n2 - n1);

    r += n1 * ampl;
    ampl *= perlin_amp_falloff;
    xi <<= 1;
    xf *= 2;
    yi <<= 1;
    yf *= 2;
    zi <<= 1;
    zf *= 2;

    if (xf >= 1.0) {
        xi++;
        xf--;
    }
    if (yf >= 1.0) {
        yi++;
        yf--;
    }
    if (zf >= 1.0) {
        zi++;
        zf--;
    }
    }
    return r;
};

// These are used to store the current state of objects.
// In animation it is often useful to think of an object as having some DOF
// Then the animation is simply evolving those DOF over time.
var currentRotation = [0,0,0];

var useTextures = 4;

var useWorldLight = 0;
var globalIllumination = 1.0;
var blackholepercent = 1.0;
//making a texture image procedurally
//Let's start with a 1-D array
var texSize = 8;
var imageCheckerBoardData = new Array();
// use perlin noise function to generate greyscale 2d image which will be mapped to a texture
// noise function came from the p5.js library
// generate a greyscale 2d image and then map the dark color to dark orange and white color to bright yellow
var noiseSizex = 256;
var noiseSizey = 128;
var noiseData = new Array();
var noiseScale = 0.05;
for (var i = 0; i < noiseSizey; i++){
    noiseData[i] = new Array();
}

for (var i =0; i<noiseSizey; i++)
	for ( var j = 0; j < noiseSizex; j++)
		noiseData[i][j] = new Float32Array(4);

for (var i =0; i<noiseSizey; i++)
	for ( var j = 0; j < noiseSizex; j++) {
        var n = noise(i*noiseScale,j*noiseScale);
		noiseData[i][j] = [1,n,0,1]; //mapping white to yellow, black to red
}

var fireTexture = new Uint8Array(4 * noiseSizey * noiseSizex);
for (var i =0; i<noiseSizey; i++)
	for ( var j = 0; j < noiseSizex; j++) 
        for(var k = 0; k < 4; k++){
        fireTexture[4*noiseSizex*i+4*j+k] = 255*noiseData[i][j][k];
}

// Now for each entry of the array make another array
// 2D array now!
for (var i =0; i<texSize; i++)
	imageCheckerBoardData[i] = new Array();

// Now for each entry in the 2D array make a 4 element array (RGBA! for colour)
for (var i =0; i<texSize; i++)
	for ( var j = 0; j < texSize; j++)
		imageCheckerBoardData[i][j] = new Float32Array(4);

// Now for each entry in the 2D array let's set the colour.
// We could have just as easily done this in the previous loop actually
for (var i =0; i<texSize; i++) 
	for (var j=0; j<texSize; j++) {
		var c = (i + j ) % 2;
		imageCheckerBoardData[i][j] = [c, c, c, 1];
}

//Convert the image to uint8 rather than float.
var imageCheckerboard = new Uint8Array(4*texSize*texSize);

for (var i = 0; i < texSize; i++)
	for (var j = 0; j < texSize; j++)
	   for(var k =0; k<4; k++)
			imageCheckerboard[4*texSize*i+4*j+k] = 255*imageCheckerBoardData[i][j][k];

// For this example we are going to store a few different textures here
var textureArray = [] ;

// Setting the colour which is needed during illumination of a surface
function setColor(c)
{
    ambientProduct = mult(lightAmbient, c);
    diffuseProduct = mult(lightDiffuse, c);
    specularProduct = mult(lightSpecular, materialSpecular);
    
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "specularProduct"),flatten(specularProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "lightPosition"),flatten(lightPosition2) );
    gl.uniform1f( gl.getUniformLocation(program, 
                                        "shininess"),materialShininess );
    gl.uniform1f( gl.getUniformLocation(program, 
                                        "globalIllumination"),globalIllumination ); //or brightness
}

// We are going to asynchronously load actual image files this will check if that call if an async call is complete
// You can use this for debugging
function isLoaded(im) {
    if (im.complete) {
        console.log("loaded") ;
        return true ;
    }
    else {
        console.log("still not loaded!!!!") ;
        return false ;
    }
}

// Helper function to load an actual file as a texture
// NOTE: The image is going to be loaded asyncronously (lazy) which could be
// after the program continues to the next functions. OUCH!
function loadFileTexture(tex, filename)
{
	//create and initalize a webgl texture object.
    tex.textureWebGL  = gl.createTexture();
    tex.image = new Image();
    tex.image.src = filename ;
    tex.isTextureReady = false ;
    tex.image.onload = function() { handleTextureLoaded(tex); }
}

// Once the above image file loaded with loadFileTexture is actually loaded,
// this funcion is the onload handler and will be called.
function handleTextureLoaded(textureObj) {
	//Binds a texture to a target. Target is then used in future calls.
		//Targets:
			// TEXTURE_2D           - A two-dimensional texture.
			// TEXTURE_CUBE_MAP     - A cube-mapped texture.
			// TEXTURE_3D           - A three-dimensional texture.
			// TEXTURE_2D_ARRAY     - A two-dimensional array texture.
    gl.bindTexture(gl.TEXTURE_2D, textureObj.textureWebGL);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // otherwise the image would be flipped upsdide down
	
	//texImage2D(Target, internalformat, width, height, border, format, type, ImageData source)
    //Internal Format: What type of format is the data in? We are using a vec4 with format [r,g,b,a].
        //Other formats: RGB, LUMINANCE_ALPHA, LUMINANCE, ALPHA
    //Border: Width of image border. Adds padding.
    //Format: Similar to Internal format. But this responds to the texel data, or what kind of data the shader gets.
    //Type: Data type of the texel data
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureObj.image);
	
	//Set texture parameters.
    //texParameteri(GLenum target, GLenum pname, GLint param);
    //pname: Texture parameter to set.
        // TEXTURE_MAG_FILTER : Texture Magnification Filter. What happens when you zoom into the texture
        // TEXTURE_MIN_FILTER : Texture minification filter. What happens when you zoom out of the texture
    //param: What to set it to.
        //For the Mag Filter: gl.LINEAR (default value), gl.NEAREST
        //For the Min Filter: 
            //gl.LINEAR, gl.NEAREST, gl.NEAREST_MIPMAP_NEAREST, gl.LINEAR_MIPMAP_NEAREST, gl.NEAREST_MIPMAP_LINEAR (default value), gl.LINEAR_MIPMAP_LINEAR.
    //Full list at: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texParameter
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
	
	//Generates a set of mipmaps for the texture object.
        /*
            Mipmaps are used to create distance with objects. 
        A higher-resolution mipmap is used for objects that are closer, 
        and a lower-resolution mipmap is used for objects that are farther away. 
        It starts with the resolution of the texture image and halves the resolution 
        until a 1x1 dimension texture image is created.
        */
    gl.generateMipmap(gl.TEXTURE_2D);
	
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating)
    gl.bindTexture(gl.TEXTURE_2D, null);
    console.log(textureObj.image.src) ;
    
    textureObj.isTextureReady = true ;
}

// Takes an array of textures and calls render if the textures are created/loaded
// This is useful if you have a bunch of textures, to ensure that those files are
// actually loaded from disk you can wait and delay the render function call
// Notice how we call this at the end of init instead of just calling requestAnimFrame like before
function waitForTextures(texs) {
    setTimeout(
		function() {
			   var n = 0 ;
               for ( var i = 0 ; i < texs.length ; i++ )
               {
                    console.log(texs[i].image.src) ;
                    n = n+texs[i].isTextureReady ;
               }
               wtime = (new Date()).getTime() ;
               if( n != texs.length )
               {
               		console.log(wtime + " not ready yet") ;
               		waitForTextures(texs) ;
               }
               else
               {
               		console.log("ready to render") ;
					render(0);
               }
		},
	5) ;
}

// This will use an array of existing image data to load and set parameters for a texture
// We'll use this function for procedural textures, since there is no async loading to deal with
function loadImageTexture(tex, image, x, y) {
	//create and initalize a webgl texture object.
    tex.textureWebGL  = gl.createTexture();
    tex.image = new Image();

	//Binds a texture to a target. Target is then used in future calls.
		//Targets:
			// TEXTURE_2D           - A two-dimensional texture.
			// TEXTURE_CUBE_MAP     - A cube-mapped texture.
			// TEXTURE_3D           - A three-dimensional texture.
			// TEXTURE_2D_ARRAY     - A two-dimensional array texture.
    gl.bindTexture(gl.TEXTURE_2D, tex.textureWebGL);

	//texImage2D(Target, internalformat, width, height, border, format, type, ImageData source)
    //Internal Format: What type of format is the data in? We are using a vec4 with format [r,g,b,a].
        //Other formats: RGB, LUMINANCE_ALPHA, LUMINANCE, ALPHA
    //Border: Width of image border. Adds padding.
    //Format: Similar to Internal format. But this responds to the texel data, or what kind of data the shader gets.
    //Type: Data type of the texel data
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, x, y, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
	
	//Generates a set of mipmaps for the texture object.
        /*
            Mipmaps are used to create distance with objects. 
        A higher-resolution mipmap is used for objects that are closer, 
        and a lower-resolution mipmap is used for objects that are farther away. 
        It starts with the resolution of the texture image and halves the resolution 
        until a 1x1 dimension texture image is created.
        */
    gl.generateMipmap(gl.TEXTURE_2D);
	
	//Set texture parameters.
    //texParameteri(GLenum target, GLenum pname, GLint param);
    //pname: Texture parameter to set.
        // TEXTURE_MAG_FILTER : Texture Magnification Filter. What happens when you zoom into the texture
        // TEXTURE_MIN_FILTER : Texture minification filter. What happens when you zoom out of the texture
    //param: What to set it to.
        //For the Mag Filter: gl.LINEAR (default value), gl.NEAREST
        //For the Min Filter: 
            //gl.LINEAR, gl.NEAREST, gl.NEAREST_MIPMAP_NEAREST, gl.LINEAR_MIPMAP_NEAREST, gl.NEAREST_MIPMAP_LINEAR (default value), gl.LINEAR_MIPMAP_LINEAR.
    //Full list at: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texParameter
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating)
    gl.bindTexture(gl.TEXTURE_2D, null);

    tex.isTextureReady = true;
}

// This just calls the appropriate texture loads for this example adn puts the textures in an array
function initTexturesForExample() {
    textureArray.push({}) ;
    loadFileTexture(textureArray[textureArray.length-1],"ruby.jpg") ;
    
    textureArray.push({}) ;
    loadImageTexture(textureArray[textureArray.length-1],imageCheckerboard,texSize,texSize) ;

    textureArray.push({}) ;
    loadImageTexture(textureArray[textureArray.length-1],fireTexture,noiseSizex,noiseSizey) ;
}

// Changes which texture is active in the array of texture examples (see initTexturesForExample)
function toggleTextures() {
      //useTextures = (useTextures + 1) % 5
	gl.uniform1i(gl.getUniformLocation(program, "useTextures"), useTextures);
}

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    //bgColor = [0.5 * globalIllumination, 0.5 * globalIllumination, 1.0 * globalIllumination];
    gl.clearColor(0.5 * globalIllumination, 0.5 * globalIllumination, 1.0 * globalIllumination, 1.0);
    //gl.clearColor(0.5, 0.5, 1, 1.0);
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    

    setColor(materialDiffuse);
	
	// Initialize some shapes, note that the curved ones are procedural which allows you to parameterize how nice they look
	// Those number will correspond to how many sides are used to "estimate" a curved surface. More = smoother
    Cube.init(program);
    Cylinder.init(20,program);
    Cone.init(20,program);
    Sphere.init(36,program);
    BgCylinder.init(60,program);
    Ruby.init(program);
    // Matrix uniforms
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
    viewMatrixLoc = gl.getUniformLocation(program,"viewMatrix");
    // Lighting Uniforms
    gl.uniform4fv( gl.getUniformLocation(program, 
       "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, 
       "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, 
       "specularProduct"),flatten(specularProduct) );	
    gl.uniform4fv( gl.getUniformLocation(program, 
       "lightPosition"),flatten(lightPosition2) );
    gl.uniform1f( gl.getUniformLocation(program, 
       "shininess"),materialShininess );
    gl.uniform1i( gl.getUniformLocation(program, 
       "useWorldLight"),useWorldLight );
    gl.uniform1i(gl.getUniformLocation(program,
        "useTextures"), useTextures);
    gl.uniform1f(gl.getUniformLocation(program,
        "blackholepercent"), blackholepercent);
    gl.uniform1f(gl.getUniformLocation(program,
        "cellshadeangle1"), cellshadeangle1);
    gl.uniform1f(gl.getUniformLocation(program,
        "cellshadeangle2"), cellshadeangle2);
    gl.uniform1i(gl.getUniformLocation(program,
        "impact"), impact);
    gl.uniform1f(gl.getUniformLocation(program,
        "impactangle1"), impactangle1);
    gl.uniform1f(gl.getUniformLocation(program,
        "impactangle2"), impactangle2);
    gl.uniform4fv(gl.getUniformLocation(program,
        "pointofimpact"), pointofimpact);
    document.getElementById("textureToggleButton").onclick = function() {
        toggleTextures() ;
        window.requestAnimFrame(render);
    };
	// Helper function just for this example to load the set of textures
    initTexturesForExample() ;

    waitForTextures(textureArray);
}
//materials setter for models
function setMaterial(ms,shiny) {
    materialSpecular = ms;
    materialShininess = shiny;
}
// Sets the modelview and normal matrix in the shaders
function setMV() {
    modelViewMatrix = mult(viewMatrix,modelMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    normalMatrix = inverseTranspose(modelViewMatrix);
    gl.uniformMatrix4fv(normalMatrixLoc, false, flatten(normalMatrix) );
    gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(viewMatrix) );
}

// Sets the projection, modelview and normal matrix in the shaders
function setAllMatrices() {
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    setMV();   
}

// Draws a 2x2x2 cube center at the origin
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawCube() {
    setMV();
    Cube.draw();
}

// Draws a sphere centered at the origin of radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawSphere() {
    setMV();
    Sphere.draw();
}

// Draws a cylinder along z of height 1 centered at the origin
// and radius 0.5.
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawCylinder() {
    setMV();
    Cylinder.draw();
}

// Draws a cone along z of height 1 centered at the origin
// and base radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawCone() {
    setMV();
    Cone.draw();
}
//drawing round and curved skybox, why was this not in the base code????
function drawBgCylinder() {
    setMV();
    BgCylinder.draw();
}
//drawing ruby shape (used in the mage staff in the mage class)
function drawRuby() {
    setMV();
    Ruby.draw();
}
// Post multiples the modelview matrix with a translation matrix
// and replaces the modeling matrix with the result
function gTranslate(x,y,z) {
    modelMatrix = mult(modelMatrix,translate([x,y,z]));
}

// Post multiples the modelview matrix with a rotation matrix
// and replaces the modeling matrix with the result
function gRotate(theta,x,y,z) {
    modelMatrix = mult(modelMatrix,rotate(theta,[x,y,z]));
}

// Post multiples the modelview matrix with a scaling matrix
// and replaces the modeling matrix with the result
function gScale(sx,sy,sz) {
    modelMatrix = mult(modelMatrix,scale(sx,sy,sz));
}

// Pops MS and stores the result as the current modelMatrix
function gPop() {
    modelMatrix = MS.pop();
}

// pushes the current modelViewMatrix in the stack MS
function gPush() {
    MS.push(modelMatrix);
}

//set the lightvector in world coordinates (default is viewcoordinates in the vertex shader)
function setWorldLight(pos){
    worldlightPos = mult(viewMatrix, pos);
    gl.uniform4fv( gl.getUniformLocation(program, 
       "lightPosition"),flatten(worldlightPos) );
    //console.log(worldlightPos);
}
//All model data for animations
//Humanoid class for animation data
class Humanoid {
    constructor() {
        this.Pos = [0,0,0];
        this.Rot = [0,0,0];
        this.HeadRot = [0,0,0];
        this.Lshouderrot = [0,0,0];
        this.Lelbowrot = [0,0,0];
        this.Lhandrot = [0,0,0];
        this.Rshouderrot = [0,0,0];
        this.Relbowrot = [0,0,0];
        this.Rthandrot = [0,0,0];
        this.Lthighrot = [0,0,0];
        this.Lkneerot = [0,0,0];
        this.Rthighrot = [0,0,0];
        this.Rkneerot = [0,0,0];
        this.Lhandrot = [0,0,0];
        this.Rhandrot = [0,0,0];
        this.Bodycol = vec4(1,1,1,1);
        this.Headcol = vec4(0.85,0.65,0.35,1.0); //Baige color default
        this.Armcol = vec4(1,1,1,1);
        this.Forearmcol = vec4(0.85,0.65,0.35,1.0);
        this.Thighcol = vec4(1,1,1,1);
        this.Legcol =vec4(0.85,0.65,0.35,1.0);
        this.Handcol = vec4(0.85,0.65,0.35,1.0);
        this.Material = defaultSpecular;
        this.shiny = defaultShininess;
    }
    rotate(angle) {
        gRotate(angle[2],0,0,1);
        gRotate(angle[1],0,1,0);
        gRotate(angle[0],1,0,0);
    }
    drawHandL() {
        gPush();
        gTranslate(0,1.3,0);
        this.rotate(this.Lhandrot);
            gPush();
            gTranslate(0,0.35,0);
            gScale(0.35,0.35,0.1);
            drawCube();
            gPop();
        gPop();
    }
    drawHandR() {
        gPush();
        gTranslate(0,1.3,0);
        this.rotate(this.Rhandrot);
            gPush();
            gTranslate(0,0.35,0);
            gScale(0.35,0.35,0.1);
            drawCube();
            gPop();
        gPop();
    }
    drawHead() {
        gPush();
        gTranslate(0,0.85,0);
        gScale(0.85,0.85,0.85);
        drawSphere();
        gPop();
    }
    drawArms() {
        //Left arm
        gPush();
        gTranslate(0.75,0.9,0);
        gRotate(-90,0,0,1);
        this.rotate(this.Lshouderrot);
            //bicep
            setColor(this.Armcol);
            gPush();
            gTranslate(0,0.75,0);
            gScale(0.3,0.75,0.1);
            drawCube();
            gPop();
                //forearm
                setColor(this.Forearmcol);
                gPush();
                gTranslate(0,1.5,0);
                this.rotate(this.Lelbowrot);
                gPush();
                gTranslate(0,0.65,0);
                gScale(0.3,0.65,0.1);
                drawCube();
                gPop();
                    //hand
                    setColor(this.Handcol);
                    this.drawHandL();
                gPop();
        gPop();
        //Right arm
        gPush();
        gTranslate(-0.75,0.9,0);
        gRotate(90,0,0,1);
        this.rotate(this.Rshouderrot);
            setColor(this.Armcol);
            gPush();
            gTranslate(0,0.75,0);
            gScale(0.3,0.75,0.1);
            drawCube();
            gPop();
                setColor(this.Forearmcol);
                gPush();
                gTranslate(0,1.5,0);
                this.rotate(this.Relbowrot);
                gPush();
                gTranslate(0,0.65,0);
                gScale(0.3,0.65,0.1);
                drawCube();
                gPop();
                    setColor(this.Handcol);
                    this.drawHandR();
                gPop();
        gPop();
    }
    drawLegs() {
        //Left leg
        gPush();
        gTranslate(0.35,-1.5,0);
        this.rotate(this.Lthighrot);
            //thigh
            setColor(this.Thighcol);
            gPush();
            gTranslate(0,-0.625,0);
            gScale(0.3,0.625,0.5);
            drawCube();
            gPop();
                //ankle
                setColor(this.Legcol);
                gPush();
                gTranslate(0,-1.25,0);
                this.rotate(this.Lkneerot);
                    gPush();
                    gTranslate(0,-1.25,0);
                    gScale(0.3,1.25,0.5);
                    drawCube();
                    gPop();
                gPop();
        gPop();
        //Right leg
        gPush();
        gTranslate(-0.35,-1.5,0);
        this.rotate(this.Rthighrot);
            setColor(this.Thighcol);
            gPush();
            gTranslate(0,-0.625,0);
            gScale(0.3,0.625,0.5);
            drawCube();
            gPop();
                //ankle
                setColor(this.Legcol);
                gPush();
                gTranslate(0,-1.25,0);
                this.rotate(this.Rkneerot);
                    gPush();
                    gTranslate(0,-1.25,0);
                    gScale(0.3,1.25,0.5);
                    drawCube();
                    gPop();
                gPop();
        gPop();
    }
    draw(){
        setMaterial(this.Material,this.shiny);
        gPush();
        gTranslate(this.Pos[0],this.Pos[1],this.Pos[2]);
        this.rotate(this.Rot);
            gPush();
                //torso
                gPush();
                setColor(this.Bodycol);
                gScale(0.75,1.5,0.5);
                drawCube();
                gPop();
                gPush();
                    gTranslate(0,1.5,0);
                    this.rotate(this.HeadRot);
                    setColor(this.Headcol);
                    this.drawHead();
                gPop();
                this.drawArms();
                this.drawLegs();
            gPop();
        gPop();
    }
}
//ALL the model class for the animation, main atributes are position and rotations for the DRAW functions of every part
//Pyshic
class Phsyic extends Humanoid {
    constructor() {
        super();
        this.Bodycol = vec4(0,0,0,1);
        this.Headcol = vec4(0,0,0,1.0);
        this.Armcol = vec4(0,0,0,1);
        this.Forearmcol = vec4(0,0,0,1);
        this.Thighcol = vec4(0,0,0,1);
        this.Legcol = vec4(0,0,0,1);
        this.Handcol = vec4(0,0,0,1.0);
        this.Material = vec4(0,0,0,1);
    }
    drawEyes() {
        var tempt = globalIllumination;
        var tempti = false;
        globalIllumination = 1.0;
        lightAmbient = vec4(1.0,1.0,1.0,1.0);
        if(impact){
            tempti = true;
            setColor(vec4(0,0,0,1));
                impact = 0;
                gl.uniform1i(gl.getUniformLocation(program,
            "impact"), impact);
        }
        else{
            setColor(vec4(1.0,1.0,1.0,1.0));
        }
        gPush();
        gTranslate(0.25,0.8,0.75);
            gPush();
            gScale(0.2,0.2,0.1);
            drawSphere();
            gPop();
        gPop();
        gPush();
        gTranslate(-0.25,0.8,0.75);
            gPush();
            gScale(0.2,0.2,0.1);
            drawSphere();
            gPop();
        gPop();
        lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
        globalIllumination = tempt;
        if(tempti){
            impact = 1;
                gl.uniform1i(gl.getUniformLocation(program,
            "impact"), impact);
        } 
    }
    drawHead() {
            gPush();
            gTranslate(0,0.85,0);
            gScale(0.85,0.85,0.85);
            drawSphere();
            gPop();
            this.drawEyes();
    }
}

class Mage extends Humanoid {
    constructor() {
        super();
        this.Bodycol = vec4(1,0,0,1);
        this.Thighcol = vec4(1,0,0,1);
        this.Legcol = vec4(1,0,0,1);
        this.Thighcol = vec4(1,0,0,1);
        this.Armcol = vec4(1,0,0,1);
        this.Forearmcol = vec4(1,0,0,1);
    }
    drawMageHat(){
        setColor(vec4(1,0,0,1));
        gPush();
        gTranslate(0,1.5,0);
            gPush();
            gScale(1.5,0.1,1.5);
            drawSphere();
            gPop();
            gPush();
            gTranslate(0,0.75,0);
            gRotate(-90,1,0,0);
            gScale(1,1,1.5);
            drawCone();
            gPop();
        gPop();
    }
    drawHead() {

            gPush();
            gTranslate(0,0.85,0);
            gScale(0.85,0.85,0.85);
            drawSphere();
            gPop();
            this.drawMageHat();
    }
    drawStaff() {
        //stick
        setColor(vec4(0.75,0.4,0,1));
        gPush();
        gTranslate(0,-2,0);
        gScale(0.2,3,0.2);
        drawCube();
        gPop();
        //crystal
        gl.bindTexture(gl.TEXTURE_2D, textureArray[0].textureWebGL);
		gl.uniform1i(gl.getUniformLocation(program, "texture3"), 0);
        useTextures = 2;
        gl.uniform1i(gl.getUniformLocation(program, "useTextures"), useTextures);
        gPush();
        gTranslate(0,1.75,0);
        gScale(0.75,1,0.75);
        drawRuby();
        gPop();
        useTextures = 4;
        gl.uniform1i(gl.getUniformLocation(program, "useTextures"), useTextures);
}
    drawHandR() {
        gPush();
        gTranslate(0,1.3,0);
        this.rotate(this.Rhandrot);
            gPush();
            gTranslate(0,0.35,0);
            gScale(0.35,0.35,0.1);
            drawCube();
            gPop();
            gPush();
            gTranslate(0,0.35,0);
            gRotate(-90,0,0,1);
            this.drawStaff();
            gPop();
        gPop();
    }
}
class Fighter extends Humanoid {
    constructor() {
    super();
    this.Bodycol = vec4(1,1,0,1);
    this.Thighcol = vec4(1,1,0,1);
    this.Armcol = vec4(1,1,0,1);
    this.Material = vec4(0,0,0,1);
    this.shiny = 1;
    }
}
class Swordsman extends Humanoid {
    constructor() {
    super();
    this.Bodycol = vec4(0,0,1,1);
    this.Thighcol = vec4(0,0,1,1);
    this.Armcol = vec4(0,0,1,1);
    this.Forearmcol = vec4(0,0,1,1);
    this.Legcol = vec4(0,0,1,1);
    this.Material = vec4(0,0,0,1);
    this.shiny = 1;
    }
    drawCirlet() {
        setColor(vec4(0.75,0.75,0.75,1));
        gPush();
        gTranslate(0,1.25,0);
        gRotate(90,1,0,0);
        gScale(1.75,1.75,0.2);
        drawCylinder();
        gPop();
        setColor(vec4(0,0.75,1,1));
        gPush();
        gTranslate(0,1.25,0.75);
        gScale(0.2,0.2,0.2);
        drawSphere();
        gPop();
    }
    drawHead() {

        gPush();
        gTranslate(0,0.85,0);
        gScale(0.85,0.85,0.85);
        drawSphere();
        gPop();
        this.drawCirlet();
    }
    drawSword() {
        //pomel
        setColor(vec4(0.75,0.75,0.75));
        gPush();
        gScale(0.15,0.5,0.15);
        drawCube();
        gPop();
        //hilt
        gPush();
        gTranslate(0,0.5,0);
        gScale(0.5,0.1,0.5);
        drawCube();
        gPop();
        //shaft
        gPush();
        gTranslate(0,1.4,0)
        gScale(0.4,1,0.1);
        drawCube();
        gPop();
        //pointy end
        gPush();
        gTranslate(0,2.9,0)
        gRotate(-90,1,0,0);
        gScale(0.425 ,0.125,1);
        drawCone();
        gPop();
        //gem
        setColor(vec4(0,0.75,1,1));
        gPush();
        gTranslate(0,1,0)
        gScale(0.25 ,0.25,0.25);
        drawSphere();
        gPop();
    }
    drawHandR() {
        gPush();
        gTranslate(0,1.3,0);
        this.rotate(this.Rhandrot);
            gPush();
            gTranslate(0,0.35,0);
            gScale(0.35,0.35,0.1);
            drawCube();
            gPop();
            gPush();
            gTranslate(0,0.35,0);
            gRotate(-90,0,0,1);
            this.drawSword();
            gPop();
        gPop();
    }
}
class Archer extends Humanoid {
    constructor() {
        super();
        this.Bodycol = vec4(0,0.4,0,1);
        this.Thighcol = vec4(0,0.4,0,1);
        this.Armcol = vec4(0,0.4,0,1);
        this.Forearmcol = vec4(0,0.4,0,1);
        this.Legcol = vec4(0,0.4,0,1);
        this.Material = vec4(0,0,0,1);
        this.shiny = 1;
    }
    drawBow() {
        setColor(vec4(0.4,0.2,0,1));
        gPush();
        gScale(1.5,0.25,0.25);
        drawCube();
        gPop();
        gPush();
        gTranslate(-1.5,0,0);
        gRotate(45,0,1,0);
        gTranslate(1.5,0,0);
        gScale(1.5,0.25,0.25);
        drawCube();
        gPop();
        gPush();
        gTranslate(-1.5,0,0);
        gRotate(-45,0,1,0);
        gTranslate(1.5,0,0);
        gScale(1.5,0.25,0.25);
        drawCube();
        gPop();
    }
    drawHandR() {
        gPush();
        gTranslate(0,1,0);
        this.rotate(this.Rhandrot);
            gPush();
            gTranslate(0,0.35,0);
            gScale(0.35,0.35,0.1);
            drawCube();
            gPop();
            gPush();
            gTranslate(0.5,0.35,0);
            gRotate(-90,0,0,1);
            this.drawBow();
            gPop();
        gPop();
    }
}
class Arrow {
    constructor() {
        this.Pos = [0,0,0];
        this.Rot = [0,0,0];
        this.Sca = [1.5,1.5,1.5];
    }
    rotate(angle) {
        gRotate(angle[2],0,0,1);
        gRotate(angle[1],0,1,0);
        gRotate(angle[0],1,0,0);
    }
    draw() {
        gPush();
        gTranslate(this.Pos[0],this.Pos[1],this.Pos[2]);
        this.rotate(this.Rot);
        gScale(this.Sca[0],this.Sca[1],this.Sca[2])
            gPush();
            setColor(vec4(0.75,0.4,0,1));
            gScale(1,0.15,0.15);
            drawCube();
            gPop();
            gPush();
            setColor(vec4(0.6,0.6,0.6,1));
            gTranslate(-1.25,0,0);
            gRotate(-90,0,1,0);
            gScale(0.2,0.2,0.5);
            drawCone();
            gPop();
        gPop();
    }
}

function drawlightning(){
    setColor(vec4(0,0.75,1,1));
    gPush();
    //gScale(3,3,3);
    gPush();
    gTranslate(1,7.5,0);
    gRotate(30,0,0,1);
    gScale(2,4,0.5);
    drawCube();
    gPop();
    gPush();
    gTranslate(1,4.6,0);
    gRotate(-60,0,0,1);
    gScale(1.5  ,3,0.5);
    drawCube();
    gPop();
    gPush();
    gTranslate(0,2.3,0);
    gRotate(30,0,0,1);
    gScale(1,3,0.5);
    drawCube();
    gPop();
    gPush();
    gRotate(-60,0,0,1);
    gScale(1,2,0.5);
    drawCube();
    gPop();
    gPush();
    gTranslate(0,-2.5,0);
    gRotate(30,0,0,1);
    gScale(0.75,2,0.5);
    drawCube();
    gPop();
    gPop();
}

function drawblast(x,y,z,timestamp) {
    setColor(vec4(1,1,1,1));
    gPush();
    gTranslate(x,y,z);
    gScale(5,5,3);
    drawSphere();
    gPop();
    gPush();
    gTranslate(x,y,z);
    gScale(10,10,1);
    gTranslate(0,0,timestamp/2);
    gScale(1,1,1+timestamp);
    drawCylinder();
    gPop();
}
var model = new Humanoid();
//Pyshic
var MC = new Phsyic();
//Mage
var mage = new Mage();
//Fighter
var fighter = new Fighter();
//Swordman
var swordman = new Swordsman();
//Archer
var archer = new Archer();
//other objects
var a1 = new Arrow();
var a2 = new Arrow();
var a3 = new Arrow();
function drawGround() {
    setAllMatrices();
    setMaterial(defaultSpecular,defaultShininess);
    setColor(vec4(0.0,1.0,0.0,1.0));
	gPush();
	{
        gTranslate(0,-1,0);
        gScale(200,1,200);
		drawCube();
	}
	gPop() ;
    projectionMatrix = perspective( 60, 1, near, far );
    setAllMatrices();
}
//draw rudimentary skybox, disabling lighting calculations and setting cosntant color 
function drawBgC(){
    projectionMatrix = perspective( 60, 1, near, 1000 );
    setAllMatrices();
    lightAmbient = vec4(1.0,1.0,1.0,1.0);
    lightDiffuse = vec4(0,0,0,1);
    setMaterial(vec4(0,0,0,1),1);
    setColor(vec4(0.5,0.5,1.0,1.0));
    gPush();
        gRotate(90,1,0,0);
        gScale(500,500,500);
        drawBgCylinder();
    gPop();
    lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
    lightDiffuse = vec4(1.0,1.0,1.0,1.0);
    projectionMatrix = perspective( 60, 1, near, far );
    setAllMatrices();
}

function drawfireball(pos,scale,rotate){
    gl.bindTexture(gl.TEXTURE_2D, textureArray[2].textureWebGL);
	gl.uniform1i(gl.getUniformLocation(program, "texture4"), 0);
    useTextures = 3;
    gl.uniform1i(gl.getUniformLocation(program, "useTextures"), useTextures);
    gPush();
    gTranslate(pos[0],pos[1],pos[2]);
    gRotate(rotate,0,1,0);
    gScale(scale,scale,scale);
    drawSphere();
    gPop();
    useTextures = 4;
    gl.uniform1i(gl.getUniformLocation(program, "useTextures"), useTextures);
}
function snapCamera(camcor, lookcor) {
    eye = camcor;
    at = lookcor;
    viewMatrix = lookAt(eye, at, up);
    setMV();
}

function setImpact(point){
    pointofimpact = point;
    impact = 1;
    gl.uniform1i(gl.getUniformLocation(program,
        "impact"), impact);
    gl.uniform4fv(gl.getUniformLocation(program,
        "pointofimpact"), pointofimpact);
}
function offImpact() {
    impact = 0;
    gl.uniform1i(gl.getUniformLocation(program,
        "impact"), impact);
}
//initial set up
MC.Pos[1] = 5;
MC.Lshouderrot[2] = -90;
MC.Rshouderrot[2] = 90;
archer.Lshouderrot[0] = 100;
archer.Rshouderrot[0] = 100;
a1.Pos = [20,7,0];
a2.Pos = [25,5,2.5];
a3.Pos = [30,3,-2.5];
archer.Pos = [60,5,5];
archer.Rot = [0,-90,0];
swordman.Pos = [60,5,-5];
swordman.Rot = [0,-60,0];
swordman.Lshouderrot[2] = -60;
swordman.Rshouderrot[2] = 60;
fighter.Pos = [70,5,8];
fighter.Rot = [0,-90,0];
fighter.Lshouderrot[0] = -90;
fighter.Rshouderrot[0] = -90;
fighter.Lshouderrot[1] = -90;
fighter.Rshouderrot[1] = 90;
fighter.Lelbowrot[2] = -90;
fighter.Relbowrot[2] = 90;
fighter.Lkneerot[0] = 45;
fighter.Rkneerot[0] = 45;
mage.Pos = [50,5,30];
mage.Rot = [0,-90,0];
mage.Rshouderrot[0] = 80;
mage.Relbowrot[0] = 55;
mage.Rhandrot[1] = 30;
mage.Rhandrot[2] = 15;
mage.Lshouderrot[0] = 65;
mage.Lshouderrot[1] = 55;
mage.Lelbowrot[0] = 55;
mage.HeadRot[0] = 20;
var timelasp = 0.0;
var arows = [a1,a2,a3];
var temptrot = 0.0;
var fireballpos = [43.5,9.5,30];
var fireballsize = 0.0;
function render(timestamp) {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); 
    //adjust camera
    eye = vec3(0,5,10);
    at = vec3(0,5,0);
    MS = []; // Initialize modeling matrix stack
	
	// initialize the modeling matrix to identity
    modelMatrix = mat4();
    
    // set the camera matrix
    viewMatrix = lookAt(eye, at, up);
   
    // set the projection matrix
    //projectionMatrix = ortho(left, right, bottom, ytop, near, far);
    projectionMatrix = perspective( 60, 1, near, far );
    
    // set all the matrices
    setAllMatrices();
    //setWorldLight(lightPosition);
	// dt is the change in time or delta time from the last frame to this one
	// in animation typically we have some property or degree of freedom we want to evolve over time
	// For example imagine x is the position of a thing.
	// To get the new position of a thing we do something called integration
	// the simpelst form of this looks like:
	// x_new = x + v*dt
	// That is the new position equals the current position + the rate of of change of that position (often a velocity or speed), times the change in time
	// We can do this with angles or positions, the whole x,y,z position or just one dimension. It is up to us!
	dt = (timestamp - prevTime) / 1000.0;
	prevTime = timestamp;
    //timestamp += curani;
	// We need to bind our textures, ensure the right one is active before we draw
	//Activate a specified "texture unit".
    //Texture units are of form gl.TEXTUREi | where i is an integer.
	gl.activeTexture(gl.TEXTURE0);
    if(timestamp >= 1000 && timestamp <= 2000){
        snapCamera(vec3(5,7.5,0),vec3(0,7.5,0));
        if(MC.HeadRot[1] < 90){
            MC.HeadRot[1] += 120*dt;
        }
    }
    if(timestamp >= 2000 && timestamp <= 9000){
        snapCamera(vec3(10,5,7.5),vec3(0,5,-5));
        if(MC.Lshouderrot[2] < 0){
           MC.Lshouderrot[2] +=  120*dt;
        }
        if(timestamp <= 5000){
            for(const a of arows){
                if (a.Pos[0] > 6){
                    a.Pos[0] -= 25 * dt;
                }
            }
        }
        else if(timestamp <= 8000){
            for(const a of arows){
                if (a.Rot[1] < 180){
                    a.Rot[1] += 90 * dt;
                }
            }
        }
        else{
            for(const a of arows){
                a.Pos[0] += 25 * dt; 
            }
        }
        a1.draw();
        a2.draw();
        a3.draw();
    }
    if(timestamp > 9000 && timestamp <= 13000){
        a1.Pos[2] = 5
        snapCamera(vec3(55,8,10),vec3(60,8,2.5));
        if(a1.Pos[0] < 60) {
            a1.Pos[0] += 30*dt;
            archer.draw();
            a1.draw();
        }
        else{
            if(timelasp < 0.5){
                timelasp += dt;
                setImpact(vec4(60,8,5,1.0));
                archer.draw();
                a1.draw();
            }
            else{
                offImpact();
                if(temptrot > -90){
                temptrot -= 10 *dt;
                gPush();
                gRotate(temptrot,0,0,1);
                archer.draw();
                a1.draw();
                gPop();
            }
            if(swordman.HeadRot[1] < 90){
                swordman.HeadRot[1] += 125*dt;
            }
            }
        }
        if(timestamp > 12000){
            fighter.Pos[0] -= 30*dt;
            fighter.draw();
        }
        swordman.draw();
        fighter.draw();
    }
    if(timestamp > 13000 && timestamp <= 17000){
        timelasp = 0.0;
        snapCamera(vec3(fighter.Pos[0] - 5,5,10),vec3(fighter.Pos[0],5+ 0.5*Math.sin(timestamp/200),fighter.Pos[2]));
        if(timestamp  >= 16000){
            fighter.Pos[1] += dt * 20;
            fighter.Rot[1] += dt * 90;
        }
        else{
            fighter.Pos[0] -= 12.5 *dt;
            fighter.Lshouderrot[1] = -90 + 60 * Math.sin(timestamp/200);
            fighter.Rshouderrot[1] = 90 + 60 * Math.sin(timestamp/200);
            fighter.Lthighrot[0] =  -90 * Math.sin(timestamp/200);
            fighter.Rthighrot[0] =  90 * Math.sin(timestamp/200);
        }
        fighter.draw();
        MC.HeadRot = [0,45,0];
        MC.Rot = [0,45,0];
        MC.Lshouderrot[2] = -90;
        if(timestamp >= 16900){
            fighter.Pos = [25,25,0];
        }
        fighter.draw();
    }
    if(timestamp > 17000 && timestamp <= 20000){
        fighter.Rkneerot[0] = 0;
        fighter.Lthighrot[0] = 45;
        snapCamera(vec3(fighter.Pos[0] - 10 * Math.sin((fighter.Rot[1]+45) * Math.PI / 180) ,fighter.Pos[1],fighter.Pos[2]- 10 * Math.cos((fighter.Rot[1]+45) * Math.PI / 180)),
        vec3(fighter.Pos[0],fighter.Pos[1],fighter.Pos[2]));
        if(fighter.Rot[1] <= 250){
            fighter.Rot[1] += dt * 90;
            fighter.Pos[1] -= dt * 5;
            fighter.Pos[0] -= dt * 7.5;
        }
        if(timestamp > 19000){
            if(MC.Lshouderrot[2] < 0){
                MC.Lshouderrot[2] += dt * 180;
            }
            if(MC.Lelbowrot[2] < 90){
                MC.Lelbowrot[2] += dt * 180;
            }
        }
        MC.draw();
        fighter.draw();
    }
    if(timestamp > 20000 && timestamp <=22000){
        snapCamera(vec3(-2.5,3,-10),vec3(0,7,0));
        if(timestamp > 21000){
        if(MC.Lelbowrot[2] > 0){
                MC.Lelbowrot[2] -= dt * 360;
            }
        fighter.Pos[2] -= dt * 50; 
        }
        fighter.draw();
        swordman.Pos = [0,5,20];
        swordman.Rot = [0,-180,0];
        swordman.HeadRot[1] = 0;
        swordman.Lshouderrot[2] = 0;
        swordman.Rshouderrot[2] = 0;
    }
    if(timestamp > 22000 && timestamp <=25000){
        snapCamera(vec3(0,7,15),vec3(0,7,20));
        if(swordman.Lelbowrot[0] < 130){
            swordman.Lelbowrot[0] += dt * 100;
            swordman.Lshouderrot[0] += dt * 40;
        }
        if(swordman.Relbowrot[0] < 130){
            swordman.Relbowrot[0] += dt * 100;
            swordman.Rshouderrot[0] += dt * 40;
        }
        if(timestamp > 23500){
            swordman.Lshouderrot[1] -= dt * 15;
            swordman.Rshouderrot[1  ] += dt * 15;
            swordman.Lelbowrot[2] -= dt * 20;
            swordman.Relbowrot[2] += dt * 20;
            swordman.Lhandrot[2] -= dt * 10;
            swordman.Rhandrot[2] += dt * 10;
        }
        MC.Lshouderrot = [0,0,-90];
        swordman.draw();
    }
    if(timestamp > 25000 && timestamp < 27000){
        snapCamera(vec3(0,5,15),vec3(0,5,0));
        if(timestamp > 25500){
            MC.Pos = [0,5,30];
            MC.Rot = [0,180,0];
            MC.HeadRot = [0,0,0];
            setImpact(vec4(0,7,0,1));
        }
        if(timestamp > 26000){
            offImpact();
            gPush();
            gTranslate(0,5,0);
            gScale(1,1,1);
            drawlightning();
            gPop();
        }
    }
    if(timestamp >= 27000 && timestamp < 30000){
        var x = (timestamp - 27000) / 950;
        snapCamera(vec3(-x,7,15),vec3(-x/2,7,30));
        if(swordman.HeadRot[1] < 45){
            swordman.HeadRot[1] += dt * 15;
        }
        swordman.draw();
        if(MC.Rshouderrot[0] < 90) {
            MC.Rshouderrot[0] += 30 * dt;
        }
    }
    if(timestamp >= 30000 && timestamp < 35000){
        snapCamera(vec3(15,10,35),vec3(0,5,25));
        if(timestamp >= 33000){
            var x = (timestamp - 33000) / 100;
            snapCamera(vec3(45 + x,10,30),vec3(0,5,30));
            mage.draw();
        }
        var delta = timestamp - 31000;
        if(timestamp >= 30250 && timestamp <= 30750){
            setImpact(vec4(0,5,25,1));
        }
        if(timestamp >= 31000){
            offImpact();
            gPush();
            drawblast(0,5,25,-delta);
            gPop();
        }
        swordman.draw();
        MC.Pos = [0,5,30];
        MC.Rot = [0,180,0];
    }
    if(timestamp >= 35000 && timestamp < 46000){
        var x = (timestamp - 43000)/1000;
        var y =  0;
        snapCamera(vec3(43.5 + 10*Math.sin(1.5*(timestamp/1000)),9.5,30 + 10*Math.cos(1.5*(timestamp/1000))),vec3(43.5,9.5,30));
        if(fireballsize < 2){
            fireballsize += dt/3;
        }
        if(timestamp >= 43000){
            y = x;
            if(fireballpos[0] > 5){
                fireballpos[0] -= dt*20;
                fireballpos[1] -= dt*2;
                var x = (timestamp - 43000)/1000;
                snapCamera(vec3(fireballpos[0] + 10,fireballpos[1]+ 4*x,fireballpos[2]),vec3(fireballpos[0] -4 *x,fireballpos[1],fireballpos[2]));
            }
            if(timestamp >= 44500){
            MC.Lshouderrot[2] = 0;
            MC.Rshouderrot[2] = 0;
            MC.Lshouderrot[0] = 45;
            MC.Rshouderrot[0] = 45;
            MC.Lelbowrot[0] = 45;
            MC.Relbowrot[0] = 45;
            if(MC.Rot[1] > 90){
                MC.Rot[1] -= dt * 230;
            }
        snapCamera(vec3(fireballpos[0] + 10,fireballpos[1]+ 6,fireballpos[2]),vec3(fireballpos[0] -6,fireballpos[1],fireballpos[2]));
        }
        }
        drawfireball(fireballpos,fireballsize,90*y);
        mage.draw();
    }
    if(timestamp >=46000 && timestamp < 47000){
        snapCamera(vec3(47.5,8,27.5),vec3(50,8,30));
        if(mage.HeadRot[0] > 0){
            mage.HeadRot[0] -= 40 * dt;
        }
        mage.draw();
    }
    if(timestamp >=47000 && timestamp < 50000) {
        var x = (timestamp - 47000) /1000;
        if(globalIllumination > 0.25){
            globalIllumination -= dt/5;
        }
        snapCamera(vec3(10,8,30),vec3(0,8,30));
        drawfireball([3,5,30],1,90*x);
    }
    if(timestamp >= 50000 && timestamp < 51000){
        snapCamera(vec3(42.5,8,22.5),vec3(50,8,30));
        if(mage.Rshouderrot[1] > -60){
            mage.Rshouderrot[1] -= 90 * dt;
            mage.Lshouderrot[1] += 90 * dt;
        }
        mage.draw();
        fireballpos = [3,5,30];
        MC.Pos = [0,5,30];
            MC.Rot = [0,90,0];
            MC.Lshouderrot[2] = 0;
            MC.Rshouderrot[2] = 0;
            MC.Lshouderrot[0] = 45;
            MC.Rshouderrot[0] = 45;
            MC.Lelbowrot[0] = 45;
            MC.Relbowrot[0] = 45;
    }
    if(timestamp >=51000 && timestamp < 53000){
            
        var x = (timestamp - 51000) /1000;
        if(blackholepercent > 0.0){
            blackholepercent -= dt;
        }
        gl.uniform1f(gl.getUniformLocation(program,
        "blackholepercent"), blackholepercent);
        snapCamera(vec3(10,8,30),vec3(0,8,30));
        if(fireballpos[1] < 10){
            fireballpos[1] += dt * 2.5;
        }
        drawfireball(fireballpos,1,90*x);
        if(MC.HeadRot[0] > -20){
            MC.HeadRot[0] -= dt * 10;
            MC.Rshouderrot[2] -= dt * 20;
            MC.Relbowrot[2] -= dt * 20;
            MC.Relbowrot[0] -= dt * 30;
            MC.Lshouderrot[2] += dt * 5;
            MC.Lelbowrot[2] += dt * 10;
            MC.Lelbowrot[0] -= dt * 15;
        }
        fireballsize = 1.0;
    }
    if(timestamp >= 53000 && timestamp < 55000){
        if(timestamp >= 53500 && timestamp <= 54000){
            setImpact(vec4(fireballpos[0],fireballpos[1],fireballpos[2],1));
        }
        if(timestamp > 54000){
            offImpact();
            fireballsize += 55*dt;
        }
        snapCamera(vec3(65,5,20),vec3(40,8,30));
        mage.draw();
        drawfireball(fireballpos,fireballsize,0);
    }
    if(timestamp >= 55000){
        snapCamera(vec3(0,20,125),vec3(0,0,0));
        if(timestamp <= 60000){
            fireballsize += 10*dt;
        }
        drawfireball([0,0,0],fireballsize,0);
    }

    MC.draw();
	drawGround();
    drawBgC();
    window.requestAnimFrame(render);
}
