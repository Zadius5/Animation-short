Common files:

webgl-utils.js: standard utilities from google to set up a webgl context

MV.js: our matrix/vector package. Documentation on website

initShaders.js: functions to initialize shaders in the html file

initShaders2.js: functions to initialize shaders that are in separate files

[4 Marks] At least one hierarchical object of at least three levels in the hierarchy  (e.g. human arm body -> shoulder -> elbow ...) where joint motion clearly shows the interaction between levels. A good minimum working example of this is the legs in A1, note that reuse of legs in A2 will not count (you can not simply use the legs to fulfill this requirement).
Yes, multiple humanoid models are made, pick one and look. (Ex:Body->arm->forarm->hand->etc)
[4 Marks] 360-degree camera fly around using lookAt() and setMV() to move the camera in a circle while focusing on a point that the camera is circling. This can be a single fly around or can be a part of a composed scene or can be a loop.
Yes, 2 separate instance around 17s (spinning kick) and 35s (fireball casting)
[4 Marks] Connection to real-time. You should make sure that your scene runs in real-time on fast enough machines. Real-time means that one simulated second corresponds roughly to one real second.
Yes, it does run on real time and it is synced to real time.
[6 Marks] Make use of at least two different textures either procedural or file-based. You must map them to a(n) object(s) in a meaningful way. Using the textures from the Lab modified assignment base code does not count toward the two. Simply placing a texture on a default object using the default object coordinates does not count. Using textures as in the lab code with no meaningful or non-trivial development does not count.
Yes, 1.Use of ruby texture and new object in the object.js. 2.I changed the u,v mapping of the default sphere object so that images can be wrapped into it.
[5 Marks] Convert the ADS shader in the assignment base code from a vertex shader to a fragment shader. You need to correctly compute the lighting equation per fragment!
Yes, ADS is now in frag shader.
[2 Marks] Convert the Phong to Blinn-Phong in the new fragment shader created in step 3.
Yes, now ADS is using Blinn-Phong model.
[5 Marks] At least one shader effect designed from scratch to perform a clearly visible novel effect (novel w.r.t basecode and labs). This can be directly incorporated in the given shader basecode or added to the HTML file, loaded, and compiled as an additional shader program make use of. Each line of your shader code must be commented clearly explaining exactly what the following line does and why. You must clearly identify the purpose and effect the shader produces in the submitted README. Note that some really cool effects require very little code. Note that your effect can use a texture and thus may count as part of your novel texture count above (you need to document this in your readme)! Think about how lighting works, how surfaces work, and how your favourite, games, movies, and comics look.
Past examples: Create a spotlight rather than a directional light, cel-shading, swirl effect, water caustics, blur, glow, edge highlighting, x-ray, CRT (retro gaming TV), etc.
Please be careful here, it is very tempting to pull effects from Shadertoy, YouTube gurus, or some other shader resource. You need to complete this item yourself! You are better off working out the math for and coding a simple one-line effect that is well explained than copying someone else's effect (one could get you full marks, and the other will lead to an academic integrity case).
Yes, my shader effect is the impact frame effect made in the fragment shader with some uniforms controlling its activation and parameters.
[5 Marks] Complexity: scene setup and design, movement of animated elements, shader complexity, and programming.
N/A
[5 Marks] Creativity: storytelling, scene design, object appearance and other artistic elements.
N/A
[5 Marks] Quality:  Attention to detail, modelling quality, rendering quality, motion control.
N/A
[2 Marks] Programming style.
Comments and explaination are available
[-2 Marks if not] Make and submit a movie of your complete scene. The movie should be the resolution of your canvas, and in a standard file format/codec such as mp4. Include a cover image (png or jpg) from your movie. You may use any screen capture program that is available (e.g. ShareX). Some additional info below.
Yes
[-4 Marks if not] Provide a readme.txt that describes what you have done, what you have omitted, and any other information that will help the grader evaluate your work, including what is stated below.
Yes
OtherNotes: Perlin noise function is imported from online webstie: https://www.zazow.com/info/perlin-noise.php in main.js