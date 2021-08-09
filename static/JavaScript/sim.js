function resizeCanvas() {
    document.getElementById("rendersim").style.height = 0.9*document.documentElement.clientHeight + "px";
}

resizeCanvas()

window.addEventListener("resize", resizeCanvas)

/* Here we generate the bodies - Planet and Star 
 using classes that can be later assigned to create objects of Planets and Stars
 */
function randint(min, max) {
    return (Math.random() * (max - min) + min).toFixed(2);
}
// declaring the gravitational constant to be used to calculate the gravitational force between 2 bodies
const G = 1;
// declaring the base system 
// mass in earth masses, radii in earth radii, semi major axis in AU * 214.84, eccentricity normal
var planets = [
    {mass: 0.0553, radius: 0.383, semi_major: 0.387*214.84, eccentricity: 0.206, inclination: 7, name:"Mercury", jrad: null, period:88},
    {mass: 0.815, radius: 0.949, semi_major: 0.723*214.84, eccentricity: 0.007, inclination: 3.4, name:"Venus", jrad: null, period:224},
    {mass: 1, radius: 1, semi_major: 1*214.84, eccentricity: 0.017, inclination: 0, name:"Earth", jrad: null, period:365.2},
    {mass: 0.107, radius: 0.532, semi_major: 1.52*214.84, eccentricity: 0.094, inclination: 5.1, name:"Mars", jrad: null, period:687},
    {mass: 317.8, radius: 11.21, semi_major: 5.2*214.84, eccentricity: 0.049, inclination: 1.3, name:"Jupiter", jrad: null, period:4331},
    {mass: 95.2, radius: 9.45, semi_major: 9.58*214.84, eccentricity: 0.057, inclination: 2.5, name:"Saturn", jrad: null, period:10747},
    {mass: 14.5, radius: 4.05, semi_major: 19.2*214.84, eccentricity: 0.046, inclination: 0.8, name:"Uranus", jrad: null, period:30589},
    {mass: 17.1, radius: 3.88, semi_major: 30.05*214.84, eccentricity: 0.011, inclination: 1.8, name:"Neptune", jrad: null, period:59800},
]
// radius in solar radii, mass in earth masses
var Sun = {radius: 1, mass: 333000, rotationalvel: 0, name: "Sun", spectraltype:"M", luminosity: 1, radvel: 0, distance: 0}

class Planet {
    constructor(radius, mass, star, semi_major_axis, eccentricity, inclination, period, scene, name) {
        this.period = period;
        this.scaling = "Earth";
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
        if (this.period) {
            this.mean_velocity = ((2*Math.PI*(this.a/214.84))/this.period)*(1-((1/4)*(this.e**2))-((3/64)*(this.e**4))-((5/256)*(this.e**6))).toFixed(2)
        }
        else {
            this.mean_velocity = "-";
        }
        if (inclination) {
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
    attachlabel(advancedTexture) {
        this.rect1 = new BABYLON.GUI.Rectangle();
        this.rect1.adaptHeightToChildren = true;
        this.rect1.adaptWidthToChildren = true;
        this.rect1.cornerRadius = 10;
        this.rect1.color = "lightgray";
        this.rect1.thickness = 1;
        this.rect1.background = "#333";
        advancedTexture.addControl(this.rect1);

        this.label = new BABYLON.GUI.TextBlock();
        this.label.text = this.plname;
        this.label.resizeToFit = true;
        this.label.fontSize = 11;
        this.label.paddingLeft = 10;
        this.label.paddingRight = 10;
        this.label.paddingBottom = 7;
        this.label.paddingTop = 7;
        this.rect1.addControl(this.label);
        this.rect1.linkWithMesh(this.body);   
        this.rect1.linkOffsetY = 10;
        this.rect1.linkOffsetX = 10;
    }
}

class Star {
    constructor(radius, mass, rotationalvel, spectraltype, radvel, distance, scene, name) {
        this.bodytype = "star";
        this.radius = radius;
        this.distance = distance;
        this.mass = mass;
        this.rv = rotationalvel
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.radvel = radvel;
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
        if (this.radius < 15 || !(this.radvel)) {
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
    attachlabel(advancedTexture) {
        this.rect1 = new BABYLON.GUI.Rectangle();
        this.rect1.adaptHeightToChildren = true;
        this.rect1.adaptWidthToChildren = true;
        this.rect1.cornerRadius = 10;
        this.rect1.color = "lightgray";
        this.rect1.thickness = 1;
        this.rect1.background = "#333";
        advancedTexture.addControl(this.rect1);

        this.label = new BABYLON.GUI.TextBlock();
        this.label.text = this.stname;
        this.label.resizeToFit = true;
        this.label.fontSize = 11;
        this.label.paddingLeft = 10;
        this.label.paddingRight = 10;
        this.label.paddingBottom = 7;
        this.label.paddingTop = 7;
        this.rect1.addControl(this.label);
        this.rect1.linkWithMesh(this.body);   
        this.rect1.linkOffsetY = 20;
        this.rect1.linkOffsetX = 20;
    }
}
 
class Orbit {
    constructor (semi_major, inclination, eccentricity, origin, scene, name) {
        // the equation for ellipse is (x/a)^2 + (y/b)^2 = 1
        this.path = [];
        this.a = semi_major;
        this.e = eccentricity;
        this.incl = (inclination*Math.PI)/180;
        this.deltaTheta = 0.001;
        for(this.theta = 0; this.theta < 2 * Math.PI; this.theta += this.deltaTheta ) {
            this.radius = (this.a*(1-(this.e**2)))/(1+this.e*Math.cos(this.theta))
            this.path.push(new BABYLON.Vector3(this.radius * Math.sin(this.theta) + origin.position.x, this.radius * Math.cos(this.theta) + origin.position.y, 0 + origin.position.z)); 
        }
        this.body = BABYLON.MeshBuilder.CreateLines(name, {points: this.path}, scene);
        this.body.rotation.y = -this.incl;
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
var prev = 0;
var scene;
function main(canvas, engine){
    var pl_bodies = []
    var pl_orbits = []
    var viewing;
    var orbs = true;
    var habitzone = false;
    var labels = true;
    // creating the scene function to generate a scene with a camera, lights and shapes 
    var createScene = function() {
        scene = new BABYLON.Scene(engine);
        scene.autoClear = false; // Color buffer
        scene.autoClearDepthAndStencil = false; // Depth and stencil, obviously
        var camera = new BABYLON.ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 3, 2, new BABYLON.Vector3(0,0,0), scene);
        camera.setPosition(new BABYLON.Vector3(0, 0, 20));
        camera.attachControl(canvas, true);
        
        camera.useAutoRotationBehavior = true;
        camera.idleRotationWaitTime = 30000;
        camera.idleRotationSpinUpTime  = 10;

        var bg = new Background(scene)
        // adding a galactic backlight to see the dark side of the planets
        var galacticlight = new BABYLON.HemisphericLight( 'galacticlight', new BABYLON.Vector3( 0, 1, 0 ), scene);

        galacticlight.intensity = 0.5;

        galacticlight.groundColor = new BABYLON.Color3( 0.5, 0.5, 1.0 );
        var starlight = new BABYLON.PointLight("pointlight", new BABYLON.Vector3(0,0,0), scene);
        starlight.diffuseColor = new BABYLON.Color3.White()
        starlight.specularColor = new BABYLON.Color3.Black()
        var star = new Star(Sun.radius, Sun.mass, Sun.rotationalvel, Sun.spectraltype, Sun.radvel, Sun.distance, scene, Sun.name);
        // excluding the galactiv light from uncessarily lighting up our sun
        galacticlight.excludedMeshes.push(star.body)
        viewing = star;
        camera.lowerRadiusLimit = viewing.radius * 1.5
        star.calc_habitable(Sun.luminosity, scene);
        var lensFlareSystem = new BABYLON.LensFlareSystem("lensFlareSystem", starlight, scene);
        var flare00 = new BABYLON.LensFlare(0.025, 0, new BABYLON.Color3(1, 1, 1), "static/Images/Textures/Flares/Flare3.png", lensFlareSystem);
        var flare01 = new BABYLON.LensFlare(0.1, 0.1, new BABYLON.Color3(1, 1, 1), "static/Images/Textures/Flares/Flare.png", lensFlareSystem);
        var flare02 = new BABYLON.LensFlare(0.05, 0.2, new BABYLON.Color3(1, 1, 1), "static/Images/Textures/Flares/Flare.png", lensFlareSystem);
        var flare02 = new BABYLON.LensFlare(0.025, 0.3, new BABYLON.Color3(1, 1, 1), "static/Images/Textures/Flares/Flare3.png", lensFlareSystem);
        var flare03 = new BABYLON.LensFlare(0.075, 0.4, new BABYLON.Color3(0.5, 0.5, 1), "static/Images/Textures/Flares/Flare.png", lensFlareSystem);
        var flare05 = new BABYLON.LensFlare(0.2, 1.0, new BABYLON.Color3(1, 1, 1), "static/Images/Textures/Flares/Flare2.png", lensFlareSystem);
        var flare05 = new BABYLON.LensFlare(0.2, 1.0, new BABYLON.Color3(1, 1, 1), "static/Images/Textures/Flares/Flare.png", lensFlareSystem);
        var flare02 = new BABYLON.LensFlare(0.025, 1.3, new BABYLON.Color3(1, 1, 1), "static/Images/Textures/Flares/Flare.png", lensFlareSystem);
        var flare03 = new BABYLON.LensFlare(0.0375, 1.4, new BABYLON.Color3(0.5, 0.5, 1.0), "static/Images/Textures/Flares/Flare.png", lensFlareSystem);
        var flare04 = new BABYLON.LensFlare(0.0125, 1.5, new BABYLON.Color3(1, 1, 1), "static/Images/Textures/Flares/Flare3.png", lensFlareSystem);
        for(planet=0; planet<planets.length; planet++) {
            if(planets[planet].radius >= 9 || Sun.radius < 0) {
                var pl = new Planet(planets[planet].jrad, planets[planet].mass, star, planets[planet].semi_major, planets[planet].eccentricity, planets[planet].inclination, planets[planet].period, scene, planets[planet].name)
                pl.scaling = "Jupiter";
                pl_bodies.push(pl)
            }
            else {
                var pl = new Planet(planets[planet].radius, planets[planet].mass, star, planets[planet].semi_major, planets[planet].eccentricity, planets[planet].inclination, planets[planet].period, scene, planets[planet].name)
                pl_bodies.push(pl)
            }
            galacticlight.excludedMeshes.push(pl.orb)
        }
        for(planet=0; planet<planets.length; planet++) {
            var pl = new Orbit(planets[planet].semi_major, planets[planet].inclination, planets[planet].eccentricity, star.body, scene, planets[planet].name+"_orb")
            pl_orbits.push(pl)
        }
        prev = document.getElementById("planet").length;
        for(opt=0; opt<prev; opt++) {
            document.getElementById("planet").remove(0)
        }
        for(planet=0; planet<pl_bodies.length; planet++) {
            var option = document.createElement("OPTION")
            option.text = pl_bodies[planet].plname + " (Planet)";
            document.getElementById("planet").add(option);
        }
        var stoption = document.createElement("OPTION")
        stoption.text = star.stname + " (Star)";
        document.getElementById("planet").add(stoption)
        function showpldata () {
            document.getElementById("plname").innerHTML = "Name: " + viewing.plname;
            document.getElementById("pltype").innerHTML = "Type: " + viewing.pltype;
            document.getElementById("plrad").innerHTML = "Radius: " + viewing.radius.toFixed(2);
            document.getElementById("plmass").innerHTML = "Mass: " + viewing.mass.toFixed(2) + " Earth Masses";
            document.getElementById("a").innerHTML = "Semi-Major: " + (viewing.a/214.84).toFixed(2) + " AU";
            document.getElementById("b").innerHTML = "Semi-Minor: " + (viewing.b/214.84).toFixed(2) + " AU";
            if (viewing.period) {
                document.getElementById("orbper").innerHTML = "Orbital Period: " + viewing.period + " days";
            }
            else {
                document.getElementById("orbper").innerHTML = "Orbital Period: -";
            }
            document.getElementById("orbvel").innerHTML = "Mean Orbital Velocity: " + viewing.mean_velocity;
            document.getElementById("ap").innerHTML = "Apoapsis: " + (viewing.ap/214.84).toFixed(2) + " AU";
            document.getElementById("pe").innerHTML = "Periapsis: " + (viewing.distance/214.84).toFixed(2) + " AU";
            document.getElementById("eccen").innerHTML = "Eccentricity: " + viewing.e;
            document.getElementById("incl").innerHTML = "Inclination: " + ((viewing.incl*180)/Math.PI).toFixed(2) + "&deg";
            document.getElementById("hab").innerHTML = "Habitable: " + viewing.habitable;
            document.getElementById("plscale").innerHTML = "Planet Scaling: " + viewing.scaling;
        }
        function clearpldata() {
            document.getElementById("plname").innerHTML = "Name: ";
            document.getElementById("pltype").innerHTML = "Type: ";
            document.getElementById("plrad").innerHTML = "Radius: ";
            document.getElementById("plmass").innerHTML = "Mass: ";
            document.getElementById("a").innerHTML = "Semi-Major: ";
            document.getElementById("b").innerHTML = "Semi-Minor: ";
            document.getElementById("orbper").innerHTML = "Orbital Period: ";
            document.getElementById("orbvel").innerHTML = "Mean Orbital Period: ";
            document.getElementById("ap").innerHTML = "Apoapsis: ";
            document.getElementById("pe").innerHTML = "Periapsis: ";
            document.getElementById("eccen").innerHTML = "Eccentricity: ";
            document.getElementById("incl").innerHTML = "Inclination: ";
            document.getElementById("hab").innerHTML = "Habitable: ";
            document.getElementById("plscale").innerHTML = "Planet Scaling: ";
        }
        function showstdata () {
            document.getElementById("stname").innerHTML = "Name: " + star.stname;
            if(Sun.spectraltype) {
                document.getElementById("sttype").innerHTML = "Type: " + Sun.spectraltype;
            }
            else {
                document.getElementById("sttype").innerHTML = "Type: Unknown";
            }
            document.getElementById("strad").innerHTML = "Radius: " + star.radius.toFixed(2) + " Solar radii";
            document.getElementById("stmass").innerHTML = "Mass: " + star.mass + " Solar masses";
            if (star.distance) {
                document.getElementById("distance").innerHTML = "Distance From Earth: " + star.distance + " parsecs";
            }
            else {
                document.getElementById("distance").innerHTML = "Distance From Earth: " + star.distance;
            }
            document.getElementById("inner").innerHTML = "Inner: " + star.innerh.toFixed(2) + " AU";
            document.getElementById("outer").innerHTML = "Outer: " + star.outerh.toFixed(2) + " AU";
            document.getElementById("stscale").innerHTML = "Stellar Scaling: Solar Radii";
            document.getElementById("distscale").innerHTML = "Distance Scaling: solar radius to AU ratio (214.84:1)";
        }
        showstdata()
        function setcam() {
            var campl = document.getElementById("planet").value
            for(planet=0; planet<pl_bodies.length; planet++) {
                if(pl_bodies[planet].plname === campl.slice(0, -9)) {
                    camera.setTarget(pl_bodies[planet].body)
                    viewing = pl_bodies[planet]
                    showpldata()
                }
                else if(star.stname === campl.slice(0, -7)) {
                    camera.setTarget(star.body)
                    viewing = star
                    clearpldata()
                }
            }
        }
        document.getElementById("show").onclick = setcam;
        function showorbs() {
            for(planet=0; planet<pl_orbits.length; planet++) {
                pl_orbits[planet].body.isVisible = orbs;
            }
            if (orbs) {
                document.getElementById("predorbits").innerHTML = "Show Predicted Orbits";
            }
            else {
                document.getElementById("predorbits").innerHTML = "Hide Predicted Orbits";
            }
            orbs = !(orbs);
        }
        document.getElementById("predorbits").onclick = showorbs;
        function showhabitzone() {
            star.habitable_zone.isVisible = habitzone;
            if (habitzone) {
                document.getElementById("habitable_zone").innerHTML = "Hide Habitable Zone";
            }
            else {
                document.getElementById("habitable_zone").innerHTML = "Show Habitable Zone";
            }
            habitzone = !(habitzone);
        }
        document.getElementById("habitable_zone").onclick = showhabitzone;

        var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

        for(planet=0; planet < pl_bodies.length; planet++) {
            pl_bodies[planet].attachlabel(advancedTexture);
        }
        star.attachlabel(advancedTexture)
        window.addEventListener("resize", function () {
            if (document.documentElement.clientWidth > 1000) {
                labels = true;
            }
            else if (document.documentElement.clientWidth < 1000) {
                labels = false;
            }
        })

        if (document.documentElement.clientWidth > 1000) {
            labels = true;
        }
        else if (document.documentElement.clientWidth < 1000) {
            labels = false;
        }

        var dt = 0.01;
        var t = 0;
        var t_counter = 1;

        function slowdown() {
            dt /= 2
            t_counter /= 2
        }
        document.getElementById("slowdowntime").onclick = slowdown;

        function speedup() {
            if (dt <= 0.02){
                dt *= 2
                t_counter *= 2
            }
            else {
                alert("Max Time Speed Reached!")
            }
        }
        document.getElementById("speeduptime").onclick = speedup;

        function resetdt() {
            dt = 0.01
            t_counter = 1
        }
        document.getElementById("resettime").onclick = resetdt;

        //updating the positions before rendering the scene
        scene.registerBeforeRender(function() {
            for(planet=0; planet<pl_bodies.length; planet++) {
                current = pl_bodies[planet]
                current.calc_gravity(star)
                star.calc_gravity(current)
                for(p=0; p<pl_bodies.length; p++) {
                    if(current != pl_bodies[p]){
                        current.calc_gravity(pl_bodies[p])
                    }
                }
            }
            if (viewing.bodytype === "planet") {
                if(camera.radius > viewing.radius*100) {
                    lensFlareSystem.isEnabled = false;
                    for(planet=0; planet < pl_bodies.length; planet++) {
                        pl_bodies[planet].rect1.isVisible = labels;
                    }
                    star.rect1.isVisible = labels;
                    for(planet=0; planet<pl_orbits.length; planet++) {
                        pl_orbits[planet].body.isVisible = orbs;
                    }
                    for(planet=0; planet<pl_bodies.length; planet++) {
                        pl_bodies[planet].orb.isVisible = true;
                    }
                }
                else {
                    lensFlareSystem.isEnabled = true;
                    for(planet=0; planet < pl_bodies.length; planet++) {
                        pl_bodies[planet].rect1.isVisible = false;
                    }
                    star.rect1.isVisible = false;
                    for(planet=0; planet<pl_orbits.length; planet++) {
                        pl_orbits[planet].body.isVisible = false;
                    }
                    for(planet=0; planet<pl_bodies.length; planet++) {
                        pl_bodies[planet].orb.isVisible = false;
                    }
                }
            }
            else if (viewing.bodytype === "star") {
                lensFlareSystem.isEnabled = false;
                for(planet=0; planet < pl_bodies.length; planet++) {
                    pl_bodies[planet].rect1.isVisible = labels;
                }
                star.rect1.isVisible = labels;
                for(planet=0; planet<pl_orbits.length; planet++) {
                    pl_orbits[planet].body.isVisible = orbs;
                }
                for(planet=0; planet<pl_bodies.length; planet++) {
                    pl_bodies[planet].orb.isVisible = true;
                }
            }
            for(planet=0; planet<pl_bodies.length; planet++) {
                pl_bodies[planet].move(dt)
            }
            star.move(dt)
            starlight.position = star.body.position;
            // camera.setTarget(star.body.position)
            t = dt;
        })
        return scene;
    }
    
    var mainscene = createScene();
    
    engine.runRenderLoop(function() {
        mainscene.render();
    })
    
    window.addEventListener("resize", function(){
        engine.resize();
    })
}

main(canvas, engine)

// get the data when search is triggered
var returned_obj;
function get_data(st_name) {
    fetch('/data', {

        // Declare what type of data we're sending
        headers: {
        'Content-Type': 'application/json'
        },
    
        // Specify the method
        method: 'POST',
    
        // A JSON payload
        body: JSON.stringify({
            "query": st_name
        })
    }).then(function (response) { // At this point, Flask has printed our JSON
        return response.text();
    }).then(function (text) {

        returned_obj = JSON.parse(text);

    
        // Should be the javascript object containing planetary and stellar data if everything was successful
        if (!(returned_obj.message)) {
            scene.dispose()
            planets = returned_obj.Planets
            Sun = returned_obj.Star
            document.getElementById("error").innerHTML = returned_obj.message;
            main(canvas, engine)
        }
        else {
            document.getElementById("error").innerHTML = returned_obj.message;
        }
        
    });
}

function setdata() {
    var st_name = document.getElementById("starname").value;
    get_data(st_name)
}

document.getElementById("simulate").onclick = setdata;

function showrand() {
    fetch('/randomsyst').then(function (response) { // At this point, Flask has printed our JSON
        return response.text();
    }).then(function (text) {

        returned_obj = JSON.parse(text);

    
        // Should be the javascript object containing planetary and stellar data if everything was successful
        if (!(returned_obj.message)) {
            scene.dispose()
            planets = returned_obj.Planets
            Sun = returned_obj.Star
            document.getElementById("error").innerHTML = returned_obj.message;
            main(canvas, engine)
        }
        else {
            document.getElementById("error").innerHTML = returned_obj.message;
        }
        
    });
}

document.getElementById("randomsystem").onclick = showrand;
 