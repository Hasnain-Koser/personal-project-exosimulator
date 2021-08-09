function resizeCanvas() {
    document.getElementById("rendersim").style.height = 0.9*document.documentElement.clientHeight + "px";
}

resizeCanvas()

window.addEventListener("resize", resizeCanvas)
/* here we add the gravitational forces function to the classes and compute the gravitational force applied from one body to another. */

/* Here we add velocities to the classes of movement to put them into motion through changing their position*/

/* Here we generate the 2 bodies - Planet and Star 
 using classes that can be later assigned to create objects of Planets and Stars
 */
function randint(min, max) {
    return (Math.random() * (max - min) + min).toFixed(2);
}
 // declaring the gravitational constant to be used to calculate the gravitational force between 2 bodies
const G = 1;
var numPlanets = 1;
class Planet {
    constructor(radius, mass, star, semi_major_axis, eccentricity, inclination, scene, name) {
        this.bodytype = "planet";
        this.solarMass = star.mass;
        this.a = semi_major_axis;
        if (eccentricity) {
            this.e = eccentricity;
        }
        else {
            this.e = 0;
        }
        this.radius = radius;
        this.mass = mass;
        this.distance = this.a*(1-this.e);
        this.ap = this.a*(1+this.e)
        // calculating the velocity using the vis-viva equation at periapsis
        this.velocity = Math.sqrt((G*this.solarMass)*((2/this.distance)-(1/this.a)));
        this.x = 0;
        this.y = this.distance;
        if (inclination) {
            this.incline = inclination;
            this.incl = (inclination*Math.PI)/180;
        }
        else {
            this.incl = 0;
        }
        this.z = 0;
        this.plname = name;
        this.momentum = {x:this.velocity*this.mass*Math.cos(this.incl), y:0, z:this.velocity*this.mass*Math.sin(this.incl)}
        this.dx = {x:0, y:0, z:0}
        this.gforce = new BABYLON.Vector3(0, 0, 0);
        this.calc_type();
        this.body = BABYLON.MeshBuilder.CreateSphere(this.plname, {diameter:this.radius*2}, scene);
        this.body.bakeCurrentTransformIntoVertices();
        this.body.position = new BABYLON.Vector3(this.x, this.y, this.z);;
        this.body.computeWorldMatrix(true);
        this.plmat = new BABYLON.StandardMaterial("plmat", scene)
        this.plmat.diffuseColor = this.plcolor;
        this.plmat.specularColor = new BABYLON.Color3(0,0,0);
        this.body.material = this.plmat;
        this.plmat.diffuseTexture = new BABYLON.Texture(this.textureFile, scene);
        this.body.isBlocker =  true;
        this.b = Math.sqrt((this.a**2)*(1-(this.e**2)))
        this.h = ((this.a - this.b)**2)/((this.a + this.b)**2)
        this.orbper = Math.PI * (this.a + this.b) * (1 + ((3*this.h)/(10 + Math.sqrt(4 - (3*this.h)))))
        this.orb = new BABYLON.TrailMesh(this.plname+" orb", this.body, scene, this.radius, this.orbper*4, true);
        this.sourceMat = new BABYLON.StandardMaterial('sourceMat', scene);
        this.sourceMat.emissiveColor = this.plcolor;
        this.sourceMat.specularColor = new BABYLON.Color3.Black();
        this.orb.material = this.sourceMat;
        this.density = this.mass / ((4/3)*Math.PI*(this.radius**3))
        if((this.a/214.84) < star.outerh && (this.a/214.84) > star.innerh) {
            this.habitable = "True";
        }
        else {
            this.habitable = "False";
        }
        
    }
    calc_gravity(p1) {
        // p1 and p2 are 2 celestial bodies 
        //Calculating Gravity, Formula = (G(m1*m2)/r^2) * r_hat
        /* here r_hat is for direction, G is gravitational constant, 
            r is distance and m1 and m2 are the masses of the objects */
        this.m1 = this.mass;
        this.m2 = p1.mass;
        // r is the distance between the 2 bodies
        // r_hat is calculated using the vector of r divided by the magnitude of r
        this.r = {x:this.body.position.x - p1.body.position.x, y:this.body.position.y - p1.body.position.y, z:this.body.position.z - p1.body.position.z};
        this.rmag = Math.sqrt(this.r.x**2+this.r.y**2+this.r.z**2);
        this.r_hat = {x:this.r.x/this.rmag, y:this.r.y/this.rmag, z:this.r.z/this.rmag};
        this.gravity = (G*this.m1*this.m2)/(this.rmag**2);
        this.Fgravity = {x:this.r_hat.x * -this.gravity, y:this.r_hat.y * -this.gravity, z:this.r_hat.z * -this.gravity};
        this.gforce = new BABYLON.Vector3(this.gforce.x + this.Fgravity.x, this.gforce.y + this.Fgravity.y, this.gforce.z + this.Fgravity.z);
    }
    calc_dx(dt) {
        this.momentum = {x:this.momentum.x + this.gforce.x * dt, y:this.momentum.y + this.gforce.y * dt, z:this.momentum.z + this.gforce.z * dt}
        this.dx = {x:this.momentum.x/this.mass * dt, y:this.momentum.y/this.mass * dt, z:this.momentum.z/this.mass * dt}
        this.gforce = new BABYLON.Vector3(0,0,0);
    }
    move(dt) {
        this.calc_dx(dt);
        this.body.position.x += this.dx.x;
        this.body.position.y += this.dx.y;
        this.body.position.z += this.dx.z;
    }
    calc_type() {
        this.rockybase = "static/Images/Textures/Rocky"
        this.gassybase = "static/Images/Textures/Gassy"
        this.earthbase = "static/Images/Textures/Earthly"

        this.rocky = [this.rockybase+"/eris_rocky.jpg", this.rockybase+"/haumea_rocky.jpg", this.rockybase+"/mars_rocky.jpg", this.rockybase+"/mercury_rocky.jpg"]
        this.earthly = [this.earthbase+"/earth_map_1.jpg", this.earthbase+"/earth_map_2.jpg", this.earthbase+"/earth_map_3.jpg", this.earthbase+"/earth_map_4.jpg", this.earthbase+"/earth_map_5.jpg"]
        this.plcolor = new BABYLON.Color3(randint(0.5, 1.5), randint(0.5, 1.5), randint(0.5, 1.5))
        if (0.9 <= this.mass && this.mass <= 1.2 && 0.9 <= this.radius && this.radius <= 1.2){
            this.pltype = "Earth-like";
            this.randindex = Math.round(Math.random()*this.earthly.length)
            this.textureFile = this.earthly[this.randindex]
            this.color = null;
        }
        else if (0 < this.mass && this.mass <= 3.5){
            this.pltype = "Rocky";
            this.randindex = Math.round(Math.random()*this.rocky.length)
            this.textureFile = this.rocky[this.randindex]
        }
        else if (3.5 < this.mass && this.mass <= 10){
            if (this.density >= 2) {
                this.pltype = "Super-Earth";
                this.randindex = Math.round(Math.random()*this.earthly.length)
                this.textureFile = this.rocky[this.randindex]
                this.color = null;
            } else {
                this.pltype = "Mini-Neptune";
                this.textureFile = this.gassybase + "/MiniNeptune_gassy.jpg";
            }
        }
        else if (10 < this.mass && this.mass <= 80){
            this.pltype = "Neptune-like";
            this.textureFile = this.gassybase + "/neptune_gassy.jpg";
        } 
        else if (80 < this.mass && this.mass <= 200) {
            this.pltype = "Saturn-like";
            this.textureFile = this.gassybase + "/saturn_gassy.jpg";
        }
        else if (200 < this.mass) {
            this.pltype = "Jupiter-like";
            this.textureFile = this.gassybase + "/jupiter_gassy.jpg";
        }
    }
}

class Star {
    constructor(radius, mass, spectraltype, scene, name) {
        this.bodytype = "star";
        this.radius = radius;
        this.mass = mass;
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.radvel = 0;
        if (spectraltype) {
            this.spectype = spectraltype[0]
        }
        else {
            this.spectype = "G"
        }
        this.stname = name;
        this.momentum = {x:0, y:0, z:0};
        this.dx = {x:0, y:0, z:0}
        this.gforce = new BABYLON.Vector3(0, 0, 0);
        this.body = BABYLON.MeshBuilder.CreateSphere(this.plname, {diameter:this.radius*2}, scene);
        this.body.position = new BABYLON.Vector3(this.x, this.y, this.z);
        this.sunTexture = new BABYLON.StandardMaterial("sun", scene);
        this.sunTexture.emissiveColor = new BABYLON.Color3(1, 1, 0);
        this.body.material = this.sunTexture;
        this.apply_texture(scene)
    }
    calc_gravity(p1) {
        // p1 and p2 are 2 celestial bodies 
        //Calculating Gravity, Formula = (G(m1*m2)/r^2) * r_hat
        /* here r_hat is for direction, G is gravitational constant, 
            r is distance and m1 and m2 are the masses of the objects */
        this.m1 = this.mass;
        this.m2 = p1.mass;
        // r is the distance between the 2 bodies
        // r_hat is calculated using the vector of r divided by the magnitude of r
        this.r = {x:this.body.position.x - p1.body.position.x, y:this.body.position.y - p1.body.position.y, z:this.body.position.z - p1.body.position.z};
        this.rmag = Math.sqrt(this.r.x**2+this.r.y**2+this.r.z**2);
        this.r_hat = {x:this.r.x/this.rmag, y:this.r.y/this.rmag, z:this.r.z/this.rmag};
        this.gravity = (G*this.m1*this.m2)/(this.rmag**2);
        this.Fgravity = {x:this.r_hat.x * -this.gravity, y:this.r_hat.y * -this.gravity, z:this.r_hat.z * -this.gravity};
        this.gforce = new BABYLON.Vector3(this.gforce.x + this.Fgravity.x, this.gforce.y + this.Fgravity.y, this.gforce.z + this.Fgravity.z);
    }
    calc_dx(dt) {
        this.momentum = {x:this.momentum.x + this.gforce.x * dt, y:this.momentum.y + this.gforce.y * dt, z:this.momentum.z + this.gforce.z * dt}
        this.dx = {x:this.momentum.x/this.mass * dt, y:this.momentum.y/this.mass * dt, z:this.momentum.z/this.mass * dt}
        this.gforce = new BABYLON.Vector3(0,0,0);
    }
    move(dt) {
        this.calc_dx(dt);
        this.body.position.x += this.dx.x;
        this.body.position.y += this.dx.y;
        this.body.position.z += this.dx.z;
    }
    calc_habitable(luminosity, scene) {
        this.luminosity = luminosity;
        this.innerh = Math.sqrt(this.luminosity/1.1);
        this.outerh = Math.sqrt(this.luminosity/0.53);
        this.hz = [];
        this.innerc = [];
        this.radius = this.innerh*214.84;
        this.deltaTheta = 0.001;
        for(this.theta = 0; this.theta < 2 * Math.PI; this.theta += this.deltaTheta ) {
            this.innerc.push(new BABYLON.Vector3(this.radius * Math.cos(this.theta) + this.body.position.x, this.radius * Math.sin(this.theta) + this.body.position.y, 0 + this.body.position.z)); 
        }
        this.hz.push(this.innerc);
        this.outerc = [];
        this.radius = this.outerh*214.84;
        this.deltaTheta = 0.001;
        for(this.theta = 0; this.theta < 2 * Math.PI; this.theta += this.deltaTheta ) {
            this.outerc.push(new BABYLON.Vector3(this.radius * Math.cos(this.theta) + this.body.position.x, this.radius * Math.sin(this.theta) + this.body.position.y, 0 + this.body.position.z)); 
        }
        this.hz.push(this.outerc);
        this.habitable_zone = BABYLON.MeshBuilder.CreateRibbon("ribbon", {pathArray: this.hz, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, scene);
        this.faintGreen = new BABYLON.StandardMaterial("faintGreen", scene);

        this.faintGreen.diffuseColor = new BABYLON.Color3(0.2, 1, 0.2);
        this.faintGreen.specularColor = new BABYLON.Color3(0, 0, 0);
        this.faintGreen.emissiveColor = new BABYLON.Color3(0.2, 1, 0.2);
        this.faintGreen.alpha = 0.5;

        this.habitable_zone.material = this.faintGreen;
    }
    apply_texture(scene) {
        this.coreMat = new BABYLON.StandardMaterial("coreMat", scene)
        if (this.radius < 15) {
            // Create a particle system
            this.surfaceParticles = new BABYLON.ParticleSystem("surfaceParticles", 10000, scene);

            // Texture of each particle
            this.surfaceParticles.particleTexture = new BABYLON.Texture("https://raw.githubusercontent.com/PatrickRyanMS/BabylonJStextures/master/ParticleSystems/Sun/T_SunSurface.png", scene);

            // Pre-warm
            this.surfaceParticles.preWarmStepOffset = 10;
            this.surfaceParticles.preWarmCycles = 100;

            // Initial rotation
            this.surfaceParticles.minInitialRotation = -2 * Math.PI;
            this.surfaceParticles.maxInitialRotation = 2 * Math.PI;
            
            // Where the sun particles come from
            this.sunEmitter = new BABYLON.SphereParticleEmitter();
            this.sunEmitter.radius = this.radius;
            this.sunEmitter.radiusRange = 0; // emit only from shape surface

            // Assign particles to emitters
            this.surfaceParticles.emitter = this.body; // the starting object, the emitter
            this.surfaceParticles.particleEmitterType = this.sunEmitter;

            // Color gradient over time
            this.surfaceParticles.addColorGradient(0, new BABYLON.Color4(0.8509, 0.4784, 0.1019, 0.0));

            switch(true) {
                case this.spectype === "M":
                    this.coreMat.emissiveColor = new BABYLON.Color3(0.3, 0.1, 0.05);
                    this.body.material = this.coreMat;
                    this.surfaceParticles.addColorGradient(0.4, new BABYLON.Color4(0.9, 0.2, 0.1, 0.5));
                    this.surfaceParticles.addColorGradient(0.5, new BABYLON.Color4(0.9, 0.3, 0.1, 0.5));
                    break;
                case this.spectype === "K":
                    this.coreMat.emissiveColor = new BABYLON.Color3(0.3, 0.1, 0.05);
                    this.body.material = this.coreMat;
                    this.surfaceParticles.addColorGradient(0.4, new BABYLON.Color4(0.8, 0.3, 0.1, 0.5));
                    this.surfaceParticles.addColorGradient(0.5, new BABYLON.Color4(0.8, 0.4, 0.1, 0.5));
                    break;
                case this.spectype === "G":
                    this.coreMat.emissiveColor = new BABYLON.Color3(0.3, 0.1, 0.05);
                    this.body.material = this.coreMat;
                    this.surfaceParticles.addColorGradient(0.4, new BABYLON.Color4(0.7, 0.4, 0.1, 0.5));
                    this.surfaceParticles.addColorGradient(0.5, new BABYLON.Color4(0.7, 0.5, 0.1, 0.5));
                    break;
                case this.spectype === "F":
                    this.coreMat.emissiveColor = new BABYLON.Color3(0.3, 0.2, 0.2);
                    this.body.material = this.coreMat;
                    this.surfaceParticles.addColorGradient(0.4, new BABYLON.Color4(0.6, 0.5, 0.4, 0.5));
                    this.surfaceParticles.addColorGradient(0.5, new BABYLON.Color4(0.6, 0.6, 0.4, 0.5));
                    break;
                case this.spectype === "A":
                    this.coreMat.emissiveColor = new BABYLON.Color3(0.3, 0.3, 0.3);
                    this.body.material = this.coreMat;
                    this.surfaceParticles.addColorGradient(0.4, new BABYLON.Color4(0.5, 0.5, 0.5, 0.5));
                    this.surfaceParticles.addColorGradient(0.5, new BABYLON.Color4(0.6, 0.6, 0.6, 0.5));
                    break;
                case this.spectype === "B":
                    this.coreMat.emissiveColor = new BABYLON.Color3(0.3, 0., 0.3);
                    this.body.material = this.coreMat;
                    this.surfaceParticles.addColorGradient(0.4, new BABYLON.Color4(0.3, 0.4, 0.7, 0.5));
                    this.surfaceParticles.addColorGradient(0.5, new BABYLON.Color4(0.3, 0.5, 0.7, 0.5));
                    break;
                case this.spectype === "O":
                    this.coreMat.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.5);
                    this.body.material = this.coreMat;
                    this.surfaceParticles.addColorGradient(0.4, new BABYLON.Color4(0.2, 0.3, 0.8, 0.5));
                    this.surfaceParticles.addColorGradient(0.5, new BABYLON.Color4(0.2, 0.4, 0.8, 0.5));
                    break;
            }
            
            this.surfaceParticles.addColorGradient(1.0, new BABYLON.Color4(0.3207, 0.0713, 0.0075, 0.0));

            // Size of each particle (random between...
            this.surfaceParticles.minSize = 0.4*(this.radius/2);
            this.surfaceParticles.maxSize = 0.7*(this.radius/2);
        
            // Life time of each particle (random between...
            this.surfaceParticles.minLifeTime = 8.0;
            this.surfaceParticles.maxLifeTime = 8.0;

            // Emission rate
            // emission rate should be 1000
            this.surfaceParticles.emitRate = 1000;

            // Blend mode : BLENDMODE_ONEONE, BLENDMODE_STANDARD, or BLENDMODE_ADD
            this.surfaceParticles.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;

            // Set the gravity of all particles
            this.surfaceParticles.gravity = new BABYLON.Vector3(0, 0, 0);

            // Angular speed, in radians
            this.surfaceParticles.minAngularSpeed = -0.4;
            this.surfaceParticles.maxAngularSpeed = 0.4;

            // Speed
            this.surfaceParticles.minEmitPower = 0;
            this.surfaceParticles.maxEmitPower = 0;
            this.surfaceParticles.updateSpeed = 0.05;

            // No billboard
            this.surfaceParticles.isBillboardBased = false;

            // Start the particle system
            this.surfaceParticles.start();
        }
        else {
            switch(true) {
                case this.spectype === "M":
                    this.coreMat.emissiveColor = new BABYLON.Color3(0.9, 0.2, 0.1);
                    this.body.material = this.coreMat;
                    break;
                case this.spectype === "K":
                    this.coreMat.emissiveColor = new BABYLON.Color3(0.8, 0.3, 0.1);
                    this.body.material = this.coreMat;
                    break;
                case this.spectype === "G":
                    this.coreMat.emissiveColor = new BABYLON.Color3(0.7, 0.4, 0.1);
                    this.body.material = this.coreMat;
                    break;
                case this.spectype === "F":
                    this.coreMat.emissiveColor = new BABYLON.Color3(0.6, 0.5, 0.3);
                    this.body.material = this.coreMat;
                    break;
                case this.spectype === "A":
                    this.coreMat.emissiveColor = new BABYLON.Color3(0.7, 0.7, 0.7);
                    this.body.material = this.coreMat;
                    break;
                case this.spectype === "B":
                    this.coreMat.emissiveColor = new BABYLON.Color3(0.3, 0.4, 0.7);
                    this.body.material = this.coreMat;
                    break;
                case this.spectype === "O":
                    this.coreMat.emissiveColor = new BABYLON.Color3(0.2, 0.3, 0.8);
                    this.body.material = this.coreMat;
                    break;
            }
        }
    }
}

class Background {
    constructor (scene) {
        this.skybox = BABYLON.Mesh.CreateBox("skyBox", 10000.0, scene);
        this.skyboxMaterial = new BABYLON.BackgroundMaterial("skyBox", scene);
        this.skyboxMaterial.backFaceCulling = false;
        this.skyboxMaterial.disableLighting = true;
        this.skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("static/Images/Textures/Background/galaxybg", scene);
        this.skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        this.skybox.material = this.skyboxMaterial;
        this.skybox.infiniteDistance = true;
    }
}

 
 // initializing canvas and 3D engine
var canvas = document.getElementById("rendersim");
canvas.addEventListener("wheel", evt => evt.preventDefault());
var engine = new BABYLON.Engine(canvas, true);

var spectypes = ["M", "K", "G", "F", "A", "B", "O"]

var starparam = {radius: 1, mass: 333000, name: "star1", luminosity: 1}




var Planets = [];
//  var pl_count = 0
function add_planet(parameters, count) {
        parameters.mass += 0.25;
        parameters.radius += 0.5;
        parameters.semi_major_axis += 0.5 * 214.84;
        parameters.eccentricity = Math.random()*0.1;
        parameters.inclination = Math.random()*10;
        parameters.name = "pl" + count;
        var temp_planet = new Planet(parameters.radius, parameters.mass, parameters.star, parameters.semi_major_axis, parameters.eccentricity, parameters.inclination, parameters.scene, parameters.name);
        Planets.push(temp_planet);
    }

var scene;

function main(canvas, engine, pl_nums) {
    Planets = [];
    if (scene) {
        scene.dispose()
    }
    // creating the scene function to generate a scene with a camera, lights and shape
    var createScene = function() {
        starparam.spectype = spectypes[parseInt(Math.random()*spectypes.length)]
        scene = new BABYLON.Scene(engine);
        var camera = new BABYLON.ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2, new BABYLON.Vector3(0,0,0), scene);
        camera.setPosition(new BABYLON.Vector3(0, 0, 20));
        camera.attachControl(canvas, true);
        var light = new BABYLON.PointLight("pointlight", new BABYLON.Vector3(0,0,0), scene);
        bg = new Background(scene)
         // mass and radius in comparison with earth, stellar mass in terms of earth masses (in this case asssuming the star mass is close to sun mass), semi-major axis in terms of AU * 214.84, eccentricity between 0 to 1
        var star = new Star(starparam.radius, starparam.mass, starparam.spectype, scene, starparam.name);
        star.calc_habitable(starparam.luminosity, scene);
        document.getElementById("inner").innerHTML = "Inner: " + star.innerh.toFixed(2);
        document.getElementById("outer").innerHTML = "Outer: " + star.outerh.toFixed(2);
        var parameters = {radius:0, mass:0, star:star, semi_major_axis:0, eccentricity:0, inclination:0, scene: scene};
        for(i=0; i<pl_nums; i++) {
            add_planet(parameters, i);
        }
        var dt = 0.01;
        var t = 0;
        //updating the positions before rendering the scene
        scene.registerBeforeRender(function() {
            for(pl=0; pl<Planets.length; pl++) {
                var current = Planets[pl];
                current.calc_gravity(star);
                star.calc_gravity(current);
                for(i=0; i<Planets.length; i++) {
                    if(Planets[i] != current){
                        Planets[pl].calc_gravity(Planets[i]);
                    }
                }
            }
            for(pl=0; pl<Planets.length; pl++) {
                Planets[pl].move(dt);
            }
            star.move(dt)
            light.position = star.body.position;
            t += dt;
        })
        return scene;
    }
    
    var scene = createScene();
    
    engine.runRenderLoop(function() {
        scene.render();
    })
    
    window.addEventListener("resize", function(){
        engine.resize();
    })
}

main(canvas, engine, numPlanets)

function runsim() {
    var returned_obj;
    var error = "Error: ";
    if (document.getElementById("metallicity").value) {
        var met = parseFloat(document.getElementById("metallicity").value)
        if (met < -1){
            met = -1;
            error += "Metallicity cannot be lower than -1, showing results for metallicity of -1. "
        }
        else if (met > 0.75) {
            met = 0.75
            error += "Metallicity cannot be greater than 0.75, showing results for metallicity of 0.75. "
        }
    }
    else {
        var met = document.getElementById("metallicity").value;
    }
    if (document.getElementById("masstorad").value) {
        var masstr = parseFloat(document.getElementById("masstorad").value)
        if (masstr < 0.01){
            masstr = 0.01;
            error += "Mass cannot be lower than 0.01, showing results for a mass of 0.01. "
        }
        else if (masstr > 12) {
            masstr = 12
            error += "Mass cannot be greater than 12, showing results for a mass of 12. "
        }
        starparam.mass = masstr * 333000;
        var outputs = document.getElementsByClassName("massval")
        for(output=0; output < outputs.length; output++) {
            outputs[output].innerHTML = "Mass: " + masstr;
        }
    }
    else {
        var masstr = document.getElementById("masstorad").value;
    }
    if (document.getElementById("radtomass").value) {
        var radtm = parseFloat(document.getElementById("radtomass").value)
        if (radtm < 0.1){
           radtm = 0.1;
           error += "Radius cannot be lower than 0.1, showing results for a radius of 0.1. "
        }
        else if (radtm > 80) {
           radtm = 80
           error += "Radius cannot be greater than 80, showing results for a radius of 80. "
        }
        starparam.radius = radtm;
        var outputs2 = document.getElementsByClassName("radval")
        for(output2=0; output2 < outputs2.length; output2++) {
            outputs2[output2].innerHTML = "Radius: " + radtm;
        }
    }
    else {
        var radtm = document.getElementById("radtomass").value;
    }
    if (document.getElementById("luminosity").value) {
        var lum = parseFloat(document.getElementById("luminosity").value)
        if (lum < -6){
           lum = -6;
           error += "Luminosity cannot be lower than -6, showing results for a luminosity of -6. "
        }
        else if (lum > 3.25) {
           lum = 3.25
           error += "Luminosity cannot be greater than 3.25, showing results for a luminosity of 3.25. "
        }
        starparam.luminosity = lum;
    }
    document.getElementById("error").innerHTML = error;
    fetch('/convertval', {
        
        // Declare what type of data we're sending
        headers: {
        'Content-Type': 'application/json'
        },
    
        // Specify the method
        method: 'POST',
    
        // A JSON payload
        body: JSON.stringify({
            "met": met,
            "mass": masstr,
            "radius": radtm
        })
    }).then(function (response) { // At this point, Flask has printed our JSON
        return response.text();
    }).then(function (text) {

        returned_obj = JSON.parse(text);

    
        // Should be the javascript object containing planetary and stellar data if everything was successful
        if (returned_obj.planetno) {
            numPlanets = returned_obj.planetno;
            document.getElementById("numpl").innerHTML = "Number of Planets: " + numPlanets;
        }
        if (returned_obj.rad) {
            starparam.radius = returned_obj.rad;
            var outputs = document.getElementsByClassName("radval")
            for(output=0; output < outputs.length; output++) {
                outputs[output].innerHTML = "Radius: " + starparam.radius.toFixed(2);
    }
        }
        if (returned_obj.mass) {
            starparam.mass = returned_obj.mass;
            var outputs = document.getElementsByClassName("massval")
            for(output=0; output < outputs.length; output++) {
                outputs[output].innerHTML = "Mass: " + starparam.mass.toFixed(2);
            }
        }
        main(canvas, engine, numPlanets)

    });
    document.getElementById("masstorad").value = null;
    document.getElementById("radtomass").value = null;
    document.getElementById("radtomass").disabled = false;
    document.getElementById("masstorad").disabled = false;
}

document.getElementById("go").onclick = runsim;

function checkmass() {
    if (document.getElementById("masstorad").value) {
        document.getElementById("radtomass").disabled = true;
    }
    else {
        document.getElementById("radtomass").disabled = false;
    }
}

document.getElementById("radtomass").onfocus = checkmass;

function checkradius() {
    if (document.getElementById("radtomass").value) {
        document.getElementById("masstorad").disabled = true;
    }
    else {
        document.getElementById("masstorad").disabled = false;
    }
}

document.getElementById("masstorad").onfocus = checkradius;

function setmetval() {
    document.getElementById("metval").innerHTML = document.getElementById("metallicity").value;
}
setmetval()
document.getElementById("metallicity").addEventListener("input", setmetval)

function setlumval() {
    document.getElementById("lumval").innerHTML = document.getElementById("luminosity").value;
}
setlumval()
document.getElementById("luminosity").addEventListener("input", setlumval)

function setmassval() {
    var outputs = document.getElementsByClassName("massval")
    for(output=0; output < outputs.length; output++) {
        outputs[output].innerHTML = "Mass: " + document.getElementById("masstorad").value;
    }
}
document.getElementById("masstorad").addEventListener("change", setmassval)

function setradval() {
    var outputs = document.getElementsByClassName("radval")
    for(output=0; output < outputs.length; output++) {
        outputs[output].innerHTML = "Radius: " + document.getElementById("radtomass").value;
    }
}
document.getElementById("radtomass").addEventListener("change", setradval)

