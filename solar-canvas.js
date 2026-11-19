/* ============================================================
   Árstraumur — Continuous Cinematic 3D Solar System Engine
   One Camera · One Continuous 3D World · Master Scroll Timeline
   Real Geographic Satellite Earth Exploration (Gävle 60.6737° N 17.1696° E)
   ============================================================ */

(function () {
  'use strict';

  var canvas = document.getElementById('sky');
  if (!canvas || typeof THREE === 'undefined') return;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.02, 3500);

  var renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  /* ---------- Texture Loader with Anisotropy & ColorSpace ---------- */
  var texLoader = new THREE.TextureLoader();
  var maxAniso = renderer.capabilities.getMaxAnisotropy();

  function loadTexture(path, isSRGB) {
    var tex = texLoader.load(path);
    tex.anisotropy = Math.min(maxAniso, 8);
    if (isSRGB && THREE.sRGBEncoding) {
      tex.encoding = THREE.sRGBEncoding;
    }
    return tex;
  }

  // High-Resolution Scientific Planetary Maps
  var texEarth = loadTexture('assets/textures/earth_atmos_2048.jpg', true);
  var texEarthNormal = loadTexture('assets/textures/earth_normal_2048.jpg', false);
  var texEarthSpec = loadTexture('assets/textures/earth_specular_2048.jpg', false);
  var texEarthClouds = loadTexture('assets/textures/earth_clouds_1024.png', true);
  var texEarthLights = loadTexture('assets/textures/earth_lights_2048.png', true);

  var texMoon = loadTexture('assets/textures/moon_1024.jpg', true);
  var texMercury = loadTexture('assets/textures/mercury_2k.jpg', true);
  var texVenus = loadTexture('assets/textures/venus_2k.jpg', true);
  var texVenusSurface = loadTexture('assets/textures/venus_surface_2k.jpg', true);
  var texMars = loadTexture('assets/textures/mars_2k.jpg', true);
  var texJupiter = loadTexture('assets/textures/jupiter_2k.jpg', true);
  var texSaturn = loadTexture('assets/textures/saturn_2k.jpg', true);
  var texSaturnRing = loadTexture('assets/textures/saturn_ring_alpha.png', true);
  var texUranus = loadTexture('assets/textures/uranus_2k.jpg', true);
  var texNeptune = loadTexture('assets/textures/neptune_2k.jpg', true);
  var texSun = loadTexture('assets/textures/sun_2k.jpg', true);
  var texMilkyWay = loadTexture('assets/textures/stars_milky_way_2k.jpg', true);

  /* ---------- Deep Space Milky Way Dome & Starfield ---------- */
  var bgGeo = new THREE.SphereGeometry(1500, 48, 48);
  var bgMat = new THREE.MeshBasicMaterial({
    map: texMilkyWay,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.38
  });
  var bgMesh = new THREE.Mesh(bgGeo, bgMat);
  scene.add(bgMesh);

  var starCount = 8000;
  var starGeo = new THREE.BufferGeometry();
  var starPositions = new Float32Array(starCount * 3);
  var starColors = new Float32Array(starCount * 3);

  for (var i = 0; i < starCount; i++) {
    var sx = (Math.random() - 0.5) * 2200;
    var sy = (Math.random() - 0.5) * 1600;
    var sz = (Math.random() - 0.5) * 2200 - 380;
    starPositions[i * 3] = sx;
    starPositions[i * 3 + 1] = sy;
    starPositions[i * 3 + 2] = sz;

    var sr = 0.82 + Math.random() * 0.18;
    var sg = 0.85 + Math.random() * 0.15;
    var sb = 0.92 + Math.random() * 0.08;
    if (Math.random() > 0.86) { sr = 0.65; sg = 0.85; sb = 1.0; }
    if (Math.random() < 0.12) { sr = 1.0; sg = 0.82; sb = 0.55; }
    starColors[i * 3] = sr;
    starColors[i * 3 + 1] = sg;
    starColors[i * 3 + 2] = sb;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

  var starMat = new THREE.PointsMaterial({
    size: 1.15,
    vertexColors: true,
    transparent: true,
    opacity: 0.88,
    sizeAttenuation: true
  });
  var starField = new THREE.Points(starGeo, starMat);
  scene.add(starField);

  /* ---------- Solar System Dominant Lighting Engine ---------- */
  var ambientLight = new THREE.AmbientLight(0x181f2c, 1.25);
  scene.add(ambientLight);

  var sunPos = new THREE.Vector3(0, 0, -380);
  var sunPointLight = new THREE.PointLight(0xfffaea, 4.2, 1800, 0.4);
  sunPointLight.position.copy(sunPos);
  scene.add(sunPointLight);

  var sunDirLight = new THREE.DirectionalLight(0xfffaea, 2.6);
  sunDirLight.position.set(0, 20, -380);
  sunDirLight.castShadow = true;
  sunDirLight.shadow.mapSize.width = 2048;
  sunDirLight.shadow.mapSize.height = 2048;
  sunDirLight.shadow.camera.near = 10;
  sunDirLight.shadow.camera.far = 1200;
  scene.add(sunDirLight);

  var camFillLight = new THREE.DirectionalLight(0xffffff, 1.1);
  camFillLight.position.set(0, 10, 20);
  scene.add(camFillLight);

  /* ---------- Realistic Planetary Atmosphere Shader Generator ---------- */
  function createAtmosphereShader(colorVec, power, intensity) {
    return new THREE.ShaderMaterial({
      vertexShader: [
        'varying vec3 vNormal;',
        'varying vec3 vViewPosition;',
        'void main() {',
        '  vNormal = normalize(normalMatrix * normal);',
        '  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);',
        '  vViewPosition = -mvPosition.xyz;',
        '  gl_Position = projectionMatrix * mvPosition;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'varying vec3 vNormal;',
        'varying vec3 vViewPosition;',
        'void main() {',
        '  vec3 normal = normalize(vNormal);',
        '  vec3 viewDir = normalize(vViewPosition);',
        '  float rim = 1.0 - max(0.0, dot(normal, viewDir));',
        '  float alpha = pow(rim, ' + power.toFixed(1) + ') * ' + intensity.toFixed(2) + ';',
        '  gl_FragColor = vec4(' + colorVec + ', alpha);',
        '}'
      ].join('\n'),
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false
    });
  }

  /* ============================================================
     REALISTIC EARTH ATMOSPHERE SCATTERING (NO NEON CIRCLE)
     Physically based Fresnel + Sun-direction terminator lighting.
     Limb glows softly on the sunlit hemisphere; dark side fades into space.
     ============================================================ */
  function createEarthAtmosphereMaterial() {
    return new THREE.ShaderMaterial({
      uniforms: {
        sunPosition: { value: sunPos }
      },
      vertexShader: [
        'varying vec3 vNormal;',
        'varying vec3 vWorldPos;',
        'varying vec3 vViewDir;',
        'void main() {',
        '  vNormal = normalize(normalMatrix * normal);',
        '  vec4 wp = modelMatrix * vec4(position, 1.0);',
        '  vWorldPos = wp.xyz;',
        '  vViewDir = normalize(cameraPosition - wp.xyz);',
        '  gl_Position = projectionMatrix * viewMatrix * wp;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform vec3 sunPosition;',
        'varying vec3 vNormal;',
        'varying vec3 vWorldPos;',
        'varying vec3 vViewDir;',
        'void main() {',
        '  vec3 normal = normalize(vNormal);',
        '  vec3 viewDir = normalize(vViewDir);',
        '  vec3 sunDir = normalize(sunPosition - vWorldPos);',
        '  float rim = 1.0 - max(0.0, dot(normal, viewDir));',
        '  float limb = pow(rim, 3.6) * 1.6;',
        '  float sunFacing = dot(normal, sunDir);',
        '  float sunScatter = smoothstep(-0.2, 0.45, sunFacing);',
        '  vec3 dayAtmosphere = vec3(0.28, 0.65, 1.0);',
        '  vec3 sunsetGlow = vec3(0.95, 0.52, 0.2);',
        '  float sunsetFactor = smoothstep(0.25, -0.1, abs(sunFacing));',
        '  vec3 atmoColor = mix(dayAtmosphere, sunsetGlow, sunsetFactor * 0.35);',
        '  float alpha = limb * sunScatter * 0.92;',
        '  if (alpha < 0.005) discard;',
        '  gl_FragColor = vec4(atmoColor, alpha);',
        '}'
      ].join('\n'),
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
      transparent: true,
      depthWrite: false
    });
  }

  /* ============================================================
     1. EARTH GLOBE & MULTI-LAYER ASSEMBLY
     Earth Center: (-110, 0, -380), Radius R = 4.2
     ============================================================ */
  var solarGroup = new THREE.Group();
  scene.add(solarGroup);

  var earthGlobeGroup = new THREE.Group();
  earthGlobeGroup.position.set(-110, 0, -380);

  // Layer 1: Solid Blue Marble Crust
  var earthGeo = new THREE.SphereGeometry(4.2, 80, 80);
  var earthMat = new THREE.MeshStandardMaterial({
    map: texEarth,
    normalMap: texEarthNormal,
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughnessMap: texEarthSpec,
    roughness: 0.72,
    metalness: 0.06
  });
  var earthGlobeMesh = new THREE.Mesh(earthGeo, earthMat);
  earthGlobeMesh.castShadow = true;
  earthGlobeMesh.receiveShadow = true;
  earthGlobeGroup.add(earthGlobeMesh);

  // Layer 2: Night-Side City Lights (Shader active on dark hemisphere)
  var earthLightsMat = new THREE.ShaderMaterial({
    uniforms: {
      tLights: { value: texEarthLights },
      sunPosition: { value: sunPos }
    },
    vertexShader: [
      'varying vec2 vUv;',
      'varying vec3 vNormal;',
      'varying vec3 vWorldPos;',
      'void main() {',
      '  vUv = uv;',
      '  vNormal = normalize(normalMatrix * normal);',
      '  vec4 wp = modelMatrix * vec4(position, 1.0);',
      '  vWorldPos = wp.xyz;',
      '  gl_Position = projectionMatrix * viewMatrix * wp;',
      '}'
    ].join('\n'),
    fragmentShader: [
      'uniform sampler2D tLights;',
      'uniform vec3 sunPosition;',
      'varying vec2 vUv;',
      'varying vec3 vNormal;',
      'varying vec3 vWorldPos;',
      'void main() {',
      '  vec3 sunDir = normalize(sunPosition - vWorldPos);',
      '  float sunDot = dot(normalize(vNormal), sunDir);',
      '  float nightFactor = smoothstep(0.15, -0.25, sunDot);',
      '  vec4 lights = texture2D(tLights, vUv);',
      '  gl_FragColor = vec4(lights.rgb * 1.5, lights.r * nightFactor * 0.95);',
      '}'
    ].join('\n'),
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
  });
  var earthLightsMesh = new THREE.Mesh(new THREE.SphereGeometry(4.205, 80, 80), earthLightsMat);
  earthGlobeGroup.add(earthLightsMesh);

  // Layer 3: Cloud Layer
  var cloudGeo = new THREE.SphereGeometry(4.25, 80, 80);
  var cloudMat = new THREE.MeshStandardMaterial({
    map: texEarthClouds,
    transparent: true,
    opacity: 0.82,
    roughness: 0.9,
    metalness: 0.0
  });
  var cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
  cloudMesh.castShadow = true;
  earthGlobeGroup.add(cloudMesh);

  // Layer 4: Razor-Thin Physically Based Atmospheric Limb (Radius 4.225)
  var earthAtmoGeo = new THREE.SphereGeometry(4.225, 64, 64);
  var earthAtmoMat = createEarthAtmosphereMaterial();
  var earthRimMesh = new THREE.Mesh(earthAtmoGeo, earthAtmoMat);
  earthGlobeGroup.add(earthRimMesh);

  // Earth's Moon (Luna)
  var moonGeo = new THREE.SphereGeometry(1.14, 48, 48);
  var moonMat = new THREE.MeshStandardMaterial({
    map: texMoon,
    bumpMap: texMoon,
    bumpScale: 0.035,
    roughness: 0.92,
    metalness: 0.05
  });
  var moonMesh = new THREE.Mesh(moonGeo, moonMat);
  moonMesh.position.set(11, 2.5, 0);
  moonMesh.castShadow = true;
  moonMesh.receiveShadow = true;
  earthGlobeGroup.add(moonMesh);

  solarGroup.add(earthGlobeGroup);

  /* ============================================================
     2. REAL GEOGRAPHIC SATELLITE MAP TILE SYSTEM
     Google-Earth-Style Hierarchical Geospatial Imagery
     Location: Gävle, Sweden (60.6737° N, 17.1696° E)
     No procedural boxes, no fake city grids. Authentic satellite photography.
     ============================================================ */

  // Multi-Tile Satellite Mosaic Generator
  function createSatelliteMosaic(zoom, cx, cy) {
    var c = document.createElement('canvas');
    c.width = 768;
    c.height = 768;
    var ctx = c.getContext('2d');
    var texture = new THREE.CanvasTexture(c);
    texture.anisotropy = Math.min(maxAniso, 8);

    for (var dy = -1; dy <= 1; dy++) {
      for (var dx = -1; dx <= 1; dx++) {
        (function (dx, dy) {
          var x = cx + dx;
          var y = cy + dy;
          var img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = function () {
            var destX = (dx + 1) * 256;
            var destY = (dy + 1) * 256;
            ctx.drawImage(img, destX, destY, 256, 256);
            texture.needsUpdate = true;
          };
          img.onerror = function () {
            // Online fallback if tile fails
            var fallbackUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/' + zoom + '/' + y + '/' + x;
            if (img.src !== fallbackUrl) {
              img.src = fallbackUrl;
            }
          };
          img.src = 'assets/textures/sat_z' + zoom + '_' + x + '_' + y + '.jpg';
        })(dx, dy);
      }
    }
    return texture;
  }

  // Helper: Curvature-conformal terrain mesh matching Earth sphere radius R = 4.2
  function createCurvedSatelliteMesh(width, segments, radius, material) {
    var geo = new THREE.PlaneGeometry(width, width, segments, segments);
    var pos = geo.attributes.position;
    for (var i = 0; i < pos.count; i++) {
      var px = pos.getX(i);
      var py = pos.getY(i);
      var distSq = px * px + py * py;
      // Conform plane to spherical curvature: drop z by (dist^2)/(2*radius)
      var zDrop = distSq / (2.0 * radius);
      pos.setZ(i, -zDrop);
    }
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, material);
  }

  // Earth Surface Group positioned at Gävle (60.6737° N) on Earth's crust
  var earthSurfaceGroup = new THREE.Group();
  earthSurfaceGroup.position.set(-110, 3.662, -377.943);

  var surfBasis = new THREE.Matrix4().makeBasis(
    new THREE.Vector3(1, 0, 0),                        // East
    new THREE.Vector3(0, 0.8718, 0.4898).normalize(),  // Up normal
    new THREE.Vector3(0, -0.4898, 0.8718).normalize()  // South
  );
  earthSurfaceGroup.rotation.setFromRotationMatrix(surfBasis);

  // Level 1: Street & District Real Satellite View (Zoom 15: ~2.5m/pixel, Gavle city center & river)
  var texSatStreet = createSatelliteMosaic(15, 17946, 9391);
  var matSatStreet = new THREE.MeshStandardMaterial({
    map: texSatStreet,
    roughness: 0.85,
    metalness: 0.05,
    transparent: true,
    opacity: 1.0
  });
  var meshSatStreet = createCurvedSatelliteMesh(0.55, 32, 4.2, matSatStreet);
  meshSatStreet.rotation.x = -Math.PI / 2;
  meshSatStreet.position.y = 0.003;
  earthSurfaceGroup.add(meshSatStreet);

  // Level 2: Metropolitan City Satellite View (Zoom 12: ~20m/pixel, Gavle metropolitan area & Bothnian coast)
  var texSatCity = createSatelliteMosaic(12, 2243, 1173);
  var matSatCity = new THREE.MeshStandardMaterial({
    map: texSatCity,
    roughness: 0.88,
    metalness: 0.04,
    transparent: true,
    opacity: 1.0
  });
  var meshSatCity = createCurvedSatelliteMesh(1.8, 48, 4.2, matSatCity);
  meshSatCity.rotation.x = -Math.PI / 2;
  meshSatCity.position.y = 0.001;
  earthSurfaceGroup.add(meshSatCity);

  // Level 3: Regional & Baltic Subcontinent Satellite View (Zoom 8: ~300m/pixel, Sweden & Gulf of Bothnia)
  var texSatRegion = createSatelliteMosaic(8, 140, 73);
  var matSatRegion = new THREE.MeshStandardMaterial({
    map: texSatRegion,
    roughness: 0.90,
    metalness: 0.02,
    transparent: true,
    opacity: 0.95
  });
  var meshSatRegion = createCurvedSatelliteMesh(4.2, 64, 4.2, matSatRegion);
  meshSatRegion.rotation.x = -Math.PI / 2;
  meshSatRegion.position.y = 0.0;
  earthSurfaceGroup.add(meshSatRegion);

  scene.add(earthSurfaceGroup);

  /* ============================================================
     3. INTERPLANETARY CELESTIAL BODIES & SUN
     ============================================================ */
  // 1. MERCURY (Orbit Radius = 45) at (45, 0, -345)
  var mercGeo = new THREE.SphereGeometry(1.6, 64, 64);
  var mercMat = new THREE.MeshStandardMaterial({
    map: texMercury,
    bumpMap: texMercury,
    bumpScale: 0.045,
    roughness: 0.92,
    metalness: 0.08
  });
  var mercuryMesh = new THREE.Mesh(mercGeo, mercMat);
  mercuryMesh.position.set(45, 0, -345);
  mercuryMesh.castShadow = true;
  mercuryMesh.receiveShadow = true;
  solarGroup.add(mercuryMesh);

  // 2. VENUS (Orbit Radius = 75) at (75, 0, -420)
  var venusGroup = new THREE.Group();
  venusGroup.position.set(75, 0, -420);

  var venusSurfaceGeo = new THREE.SphereGeometry(2.78, 64, 64);
  var venusSurfaceMat = new THREE.MeshStandardMaterial({
    map: texVenusSurface,
    bumpMap: texVenusSurface,
    bumpScale: 0.03,
    roughness: 0.85,
    metalness: 0.1
  });
  var venusSurfaceMesh = new THREE.Mesh(venusSurfaceGeo, venusSurfaceMat);
  venusGroup.add(venusSurfaceMesh);

  var venusAtmoGeo = new THREE.SphereGeometry(2.82, 64, 64);
  var venusAtmoMat = new THREE.MeshStandardMaterial({
    map: texVenus,
    roughness: 0.45,
    metalness: 0.02,
    transparent: true,
    opacity: 0.95
  });
  var venusMesh = new THREE.Mesh(venusAtmoGeo, venusAtmoMat);
  venusMesh.castShadow = true;
  venusMesh.receiveShadow = true;
  venusGroup.add(venusMesh);

  var venusHazeGeo = new THREE.SphereGeometry(2.94, 48, 48);
  var venusHazeMat = createAtmosphereShader('vec3(0.92, 0.78, 0.48)', 2.4, 1.4);
  venusGroup.add(new THREE.Mesh(venusHazeGeo, venusHazeMat));
  solarGroup.add(venusGroup);

  // 3. MARS (Orbit Radius = 145) at (-145, 0, -430)
  var marsGeo = new THREE.SphereGeometry(2.4, 64, 64);
  var marsMat = new THREE.MeshStandardMaterial({
    map: texMars,
    bumpMap: texMars,
    bumpScale: 0.065,
    roughness: 0.84,
    metalness: 0.08
  });
  var marsMesh = new THREE.Mesh(marsGeo, marsMat);
  marsMesh.position.set(-145, 0, -430);
  marsMesh.castShadow = true;
  marsMesh.receiveShadow = true;

  var marsAtmoGeo = new THREE.SphereGeometry(2.48, 48, 48);
  var marsAtmoMat = createAtmosphereShader('vec3(0.85, 0.42, 0.22)', 3.2, 0.95);
  marsMesh.add(new THREE.Mesh(marsAtmoGeo, marsAtmoMat));

  var phobosMesh = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 16), moonMat);
  phobosMesh.position.set(4.5, 1, 0);
  marsMesh.add(phobosMesh);

  var deimosMesh = new THREE.Mesh(new THREE.SphereGeometry(0.20, 16, 16), moonMat);
  deimosMesh.position.set(-6.5, -0.8, 0);
  marsMesh.add(deimosMesh);
  solarGroup.add(marsMesh);

  // 4. JUPITER (Orbit Radius = 195) at (195, 0, -320)
  var jupiterGeo = new THREE.SphereGeometry(6.5, 80, 80);
  var jupiterMat = new THREE.MeshStandardMaterial({
    map: texJupiter,
    roughness: 0.42,
    metalness: 0.02
  });
  var jupiterMesh = new THREE.Mesh(jupiterGeo, jupiterMat);
  jupiterMesh.position.set(195, 0, -320);
  jupiterMesh.castShadow = true;
  jupiterMesh.receiveShadow = true;

  var jupAtmoGeo = new THREE.SphereGeometry(6.62, 48, 48);
  var jupAtmoMat = createAtmosphereShader('vec3(0.82, 0.68, 0.52)', 2.8, 1.1);
  jupiterMesh.add(new THREE.Mesh(jupAtmoGeo, jupAtmoMat));

  var ioMesh = new THREE.Mesh(new THREE.SphereGeometry(0.48, 24, 24), new THREE.MeshStandardMaterial({
    color: 0xf5d042, roughness: 0.8
  }));
  ioMesh.position.set(-9.5, 2.2, 0);
  jupiterMesh.add(ioMesh);

  var europaMesh = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 24), new THREE.MeshStandardMaterial({
    color: 0xdde5ed, roughness: 0.35
  }));
  europaMesh.position.set(13.0, -1.5, 0);
  jupiterMesh.add(europaMesh);

  var ganymedeMesh = new THREE.Mesh(new THREE.SphereGeometry(0.65, 24, 24), moonMat);
  ganymedeMesh.position.set(-17.0, 1.0, 0);
  jupiterMesh.add(ganymedeMesh);

  var callistoMesh = new THREE.Mesh(new THREE.SphereGeometry(0.58, 24, 24), moonMat);
  callistoMesh.position.set(21.0, -2.5, 0);
  jupiterMesh.add(callistoMesh);
  solarGroup.add(jupiterMesh);

  // 5. SATURN (Orbit Radius = 250) at (-250, 0, -350)
  var saturnGroup = new THREE.Group();
  saturnGroup.position.set(-250, 0, -350);

  var saturnGeo = new THREE.SphereGeometry(5.2, 80, 80);
  var saturnMat = new THREE.MeshStandardMaterial({
    map: texSaturn,
    roughness: 0.55,
    metalness: 0.03
  });
  var saturnMesh = new THREE.Mesh(saturnGeo, saturnMat);
  saturnMesh.castShadow = true;
  saturnMesh.receiveShadow = true;
  saturnGroup.add(saturnMesh);

  var saturnAtmoGeo = new THREE.SphereGeometry(5.32, 48, 48);
  var saturnAtmoMat = createAtmosphereShader('vec3(0.85, 0.74, 0.55)', 2.6, 0.95);
  saturnGroup.add(new THREE.Mesh(saturnAtmoGeo, saturnAtmoMat));

  var saturnRingGeo = new THREE.RingGeometry(6.5, 13.5, 128);
  var rPos = saturnRingGeo.attributes.position;
  var rUvs = saturnRingGeo.attributes.uv;
  for (var rIdx = 0; rIdx < rPos.count; rIdx++) {
    var rx = rPos.getX(rIdx);
    var ry = rPos.getY(rIdx);
    var rDist = Math.sqrt(rx * rx + ry * ry);
    var uVal = (rDist - 6.5) / (13.5 - 6.5);
    rUvs.setXY(rIdx, uVal, 0.5);
  }
  rUvs.needsUpdate = true;

  var saturnRingMat = new THREE.MeshStandardMaterial({
    map: texSaturnRing,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.92,
    roughness: 0.65,
    metalness: 0.05
  });
  var saturnRingMesh = new THREE.Mesh(saturnRingGeo, saturnRingMat);
  saturnRingMesh.rotation.x = Math.PI / 2.25;
  saturnRingMesh.castShadow = true;
  saturnRingMesh.receiveShadow = true;
  saturnGroup.add(saturnRingMesh);
  saturnGroup.rotation.z = 0.32;

  var titanMesh = new THREE.Mesh(new THREE.SphereGeometry(0.75, 32, 32), new THREE.MeshStandardMaterial({
    color: 0xdf9438, roughness: 0.4
  }));
  titanMesh.position.set(14.5, -2.5, 0);
  saturnGroup.add(titanMesh);

  var enceladusMesh = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 20), new THREE.MeshStandardMaterial({
    color: 0xf5f8fc, roughness: 0.2
  }));
  enceladusMesh.position.set(-8.5, 1.2, 0);
  saturnGroup.add(enceladusMesh);
  solarGroup.add(saturnGroup);

  // 6. URANUS (Orbit Radius = 305) at (305, 0, -450)
  var uranusGeo = new THREE.SphereGeometry(3.8, 64, 64);
  var uranusMat = new THREE.MeshStandardMaterial({
    map: texUranus,
    roughness: 0.48,
    metalness: 0.02
  });
  var uranusMesh = new THREE.Mesh(uranusGeo, uranusMat);
  uranusMesh.rotation.z = Math.PI / 1.84;
  uranusMesh.position.set(305, 0, -450);
  uranusMesh.castShadow = true;
  uranusMesh.receiveShadow = true;

  var uranusAtmoGeo = new THREE.SphereGeometry(3.92, 48, 48);
  var uranusAtmoMat = createAtmosphereShader('vec3(0.48, 0.82, 0.88)', 2.5, 1.2);
  uranusMesh.add(new THREE.Mesh(uranusAtmoGeo, uranusAtmoMat));
  solarGroup.add(uranusMesh);

  // 7. NEPTUNE (Orbit Radius = 360) at (-360, 0, -330)
  var neptuneGeo = new THREE.SphereGeometry(3.6, 64, 64);
  var neptuneMat = new THREE.MeshStandardMaterial({
    map: texNeptune,
    roughness: 0.45,
    metalness: 0.02
  });
  var neptuneMesh = new THREE.Mesh(neptuneGeo, neptuneMat);
  neptuneMesh.position.set(-360, 0, -330);
  neptuneMesh.castShadow = true;
  neptuneMesh.receiveShadow = true;

  var nepAtmoGeo = new THREE.SphereGeometry(3.72, 48, 48);
  var nepAtmoMat = createAtmosphereShader('vec3(0.22, 0.48, 0.95)', 2.4, 1.4);
  neptuneMesh.add(new THREE.Mesh(nepAtmoGeo, nepAtmoMat));

  var tritonMesh = new THREE.Mesh(new THREE.SphereGeometry(0.52, 24, 24), new THREE.MeshStandardMaterial({
    color: 0xc4d8e2, bumpMap: texMoon, bumpScale: 0.02, roughness: 0.75
  }));
  tritonMesh.position.set(-6.5, -2.2, 0);
  neptuneMesh.add(tritonMesh);
  solarGroup.add(neptuneMesh);

  // 8. THE SUN (Center at (0, 0, -380))
  var sunGroup = new THREE.Group();
  sunGroup.position.set(0, 0, -380);

  var sunGeo = new THREE.SphereGeometry(18, 64, 64);
  var sunMat = new THREE.MeshBasicMaterial({
    map: texSun,
    color: 0xffffff
  });
  var sunMesh = new THREE.Mesh(sunGeo, sunMat);
  sunGroup.add(sunMesh);

  var coronaGeo1 = new THREE.SphereGeometry(19.8, 48, 48);
  var coronaMat1 = new THREE.MeshBasicMaterial({
    color: 0xffcc44,
    transparent: true,
    opacity: 0.32,
    side: THREE.BackSide
  });
  var coronaMesh1 = new THREE.Mesh(coronaGeo1, coronaMat1);
  sunMesh.add(coronaMesh1);

  var coronaGeo2 = new THREE.SphereGeometry(24.0, 32, 32);
  var coronaMat2 = new THREE.MeshBasicMaterial({
    color: 0xff8822,
    transparent: true,
    opacity: 0.18,
    side: THREE.BackSide
  });
  var coronaMesh2 = new THREE.Mesh(coronaGeo2, coronaMat2);
  sunMesh.add(coronaMesh2);

  solarGroup.add(sunGroup);

  /* ---------- Concentric Planetary Orbital Paths ---------- */
  var orbits = [
    { radius: 45 }, { radius: 75 }, { radius: 110 }, { radius: 145 },
    { radius: 195 }, { radius: 250 }, { radius: 305 }, { radius: 360 }
  ];
  orbits.forEach(function (orb) {
    var oGeo = new THREE.RingGeometry(orb.radius - 0.25, orb.radius + 0.25, 128);
    var oMat = new THREE.MeshBasicMaterial({
      color: 0x8fc7a4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.18
    });
    var oMesh = new THREE.Mesh(oGeo, oMat);
    oMesh.rotation.x = Math.PI / 2;
    oMesh.position.set(0, -5, -380);
    solarGroup.add(oMesh);
  });

  /* ============================================================
     4. CENTRALIZED GOOGLE-EARTH-STYLE CAMERA TRAJECTORY
     Continuous Geographic Zoom:
     Street (150m) → City (3.5km) → Region (35km) → Curvature (100km) → Low Orbit (2,000km)
     ============================================================ */
  var S_x = -110.0, S_y = 3.662, S_z = -377.943;
  var Ny = 0.8718, Nz = 0.4898;
  var Ty = -0.4898, Tz = 0.8718;

  var keyframes = [
    // 0: SATELLITE STREET VIEW (Altitude ~150 m: Real aerial satellite imagery of Gävle streets & river)
    {
      name: 'earth-surface',
      pos: new THREE.Vector3(S_x, S_y + Ny * 0.022 + Ty * 0.08, S_z + Nz * 0.022 + Tz * 0.08),
      target: new THREE.Vector3(S_x, S_y, S_z),
      satVisible: 1.0,
      altitudeKm: 0.15,
      altStr: 'ALTITUDE 150 M',
      altBand: 'GÄVLE · REAL SATELLITE STREET VIEW'
    },
    // 1: METROPOLITAN REGION (Altitude ~3.5 km: Gävle city, surrounding coastal forests & highways)
    {
      name: 'earth-city',
      pos: new THREE.Vector3(S_x, S_y + Ny * 0.35 + Ty * 0.25, S_z + Nz * 0.35 + Tz * 0.25),
      target: new THREE.Vector3(S_x, S_y, S_z),
      satVisible: 0.92,
      altitudeKm: 3.5,
      altStr: 'ALTITUDE 3.5 KM',
      altBand: 'GÄVLE METROPOLITAN AREA & COAST'
    },
    // 2: EARTH CURVATURE & STRATOSPHERE (Altitude ~100 km: Sweden, Baltic Sea & atmospheric limb)
    {
      name: 'earth-atmosphere',
      pos: new THREE.Vector3(S_x, S_y + Ny * 2.8 + Ty * 1.4, S_z + Nz * 2.8 + Tz * 1.4),
      target: new THREE.Vector3(S_x, 1.2, -380.0),
      satVisible: 0.18,
      altitudeKm: 100,
      altStr: 'ALTITUDE 100 KM',
      altBand: 'KARMAN LINE · SPACE BOUNDARY'
    },
    // 3: LOW EARTH ORBIT (Altitude 2,000 km: Centered Earth globe, ZERO buildings, pure space)
    {
      name: 'earth-orbit',
      pos: new THREE.Vector3(-110.0, 1.8, -354.0),
      target: new THREE.Vector3(-110.0, 0.0, -380.0),
      satVisible: 0.0,
      altitudeKm: 2000,
      altStr: 'ALTITUDE 2,000 KM',
      altBand: 'LOW EARTH ORBIT · GLOBE VIEW'
    },
    // 4: THE MOON (Lunar Flyby & Gateway to Deep Space)
    {
      name: 'moon',
      pos: new THREE.Vector3(-101.5, 3.2, -364.0),
      target: new THREE.Vector3(-101.5, 1.8, -378.0),
      satVisible: 0.0,
      altitudeKm: 384400,
      altStr: 'ALTITUDE 384,400 KM',
      altBand: 'THE MOON · DEEP SPACE GATEWAY'
    },
    // 5: MERCURY (Cratered terrestrial world, strictly centered)
    {
      name: 'mercury',
      pos: new THREE.Vector3(45.0, 1.2, -331.5),
      target: new THREE.Vector3(45.0, 0.0, -345.0),
      satVisible: 0.0,
      altitudeKm: 57900000,
      altStr: 'DISTANCE 57.9M KM',
      altBand: 'MERCURY · BARREN TERRESTRIAL'
    },
    // 6: VENUS (Dense atmosphere, strictly centered)
    {
      name: 'venus',
      pos: new THREE.Vector3(75.0, 1.6, -398.0),
      target: new THREE.Vector3(75.0, 0.0, -420.0),
      satVisible: 0.0,
      altitudeKm: 108200000,
      altStr: 'DISTANCE 108.2M KM',
      altBand: 'VENUS · TOXIC ATMOSPHERE'
    },
    // 7: MARS (The Red Planet, strictly centered)
    {
      name: 'mars',
      pos: new THREE.Vector3(-145.0, 1.5, -412.0),
      target: new THREE.Vector3(-145.0, 0.0, -430.0),
      satVisible: 0.0,
      altitudeKm: 227900000,
      altStr: 'DISTANCE 227.9M KM',
      altBand: 'MARS · THE RED PLANET'
    },
    // 8: JUPITER (Gas Giant & Great Red Spot, strictly centered)
    {
      name: 'jupiter',
      pos: new THREE.Vector3(195.0, 3.5, -270.0),
      target: new THREE.Vector3(195.0, 0.0, -320.0),
      satVisible: 0.0,
      altitudeKm: 778500000,
      altStr: 'DISTANCE 778.5M KM',
      altBand: 'JUPITER · GREAT RED SPOT'
    },
    // 9: SATURN (Unclipped 3D Rings & Cassini Division, strictly centered)
    {
      name: 'saturn',
      pos: new THREE.Vector3(-250.0, 9.5, -290.0),
      target: new THREE.Vector3(-250.0, 0.0, -350.0),
      satVisible: 0.0,
      altitudeKm: 1430000000,
      altStr: 'DISTANCE 1.43B KM',
      altBand: 'SATURN · YEAR RINGS'
    },
    // 10: URANUS (98° axial tilt, strictly centered)
    {
      name: 'uranus',
      pos: new THREE.Vector3(305.0, 2.0, -422.0),
      target: new THREE.Vector3(305.0, 0.0, -450.0),
      satVisible: 0.0,
      altitudeKm: 2870000000,
      altStr: 'DISTANCE 2.87B KM',
      altBand: 'URANUS · 98° AXIAL TILT'
    },
    // 11: NEPTUNE (Azure Ice Giant, strictly centered)
    {
      name: 'neptune',
      pos: new THREE.Vector3(-360.0, 2.0, -305.0),
      target: new THREE.Vector3(-360.0, 0.0, -330.0),
      satVisible: 0.0,
      altitudeKm: 4500000000,
      altStr: 'DISTANCE 4.50B KM',
      altBand: 'NEPTUNE · FURTHER OUT'
    },
    // 12: THE SUN (Hero Star Exploration, dynamic corona, strictly centered)
    {
      name: 'sun',
      pos: new THREE.Vector3(0.0, 6.0, -275.0),
      target: new THREE.Vector3(0.0, 0.0, -380.0),
      satVisible: 0.0,
      altitudeKm: 12000000,
      altStr: 'SOLAR PROXIMITY 12.0M KM',
      altBand: 'THE SUN · SOLAR CORONA & PLASMA'
    },
    // 13: SOLAR SYSTEM OVERVIEW (Zoomed far out, all orbiting planets revealed)
    {
      name: 'solar-system',
      pos: new THREE.Vector3(0.0, 520.0, -80.0),
      target: new THREE.Vector3(0.0, -10.0, -380.0),
      satVisible: 0.0,
      altitudeKm: 15000000000,
      altStr: 'DISTANCE 15.0B KM',
      altBand: 'SOL SYSTEM · HELIOSPHERE RE-ENTRY'
    },
    // 14: CONTACT HUB (Ground Station Transmission Relay)
    {
      name: 'contact',
      pos: new THREE.Vector3(0.0, 560.0, -50.0),
      target: new THREE.Vector3(0.0, -10.0, -380.0),
      satVisible: 0.0,
      altitudeKm: 15000000000,
      altStr: 'GROUND STATION RELAY',
      altBand: 'SIGNAL TRANSMISSION HUB'
    }
  ];

  var sectionIds = [
    'ground',        // 0: earth-surface (satellite street view)
    'earth-rise',    // 1: earth-city & curvature (metropolitan satellite)
    'music',         // 2: earth-orbit (globe view)
    'news',          // 3: moon
    'mercury-sec',   // 4: mercury
    'venus-sec',     // 5: venus
    'mars-sec',      // 6: mars
    'jupiter-sec',   // 7: jupiter
    'orbit',         // 8: saturn
    'videos-band',   // 9: uranus
    'deep-space',    // 10: neptune
    'sun-sec',       // 11: sun
    'solar-sec',     // 12: solar-system
    'contact-hub'    // 13: contact
  ];

  var sectionToKeyframe = [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

  /* ---------- Master Scroll Controller with Smooth Lerp ---------- */
  var targetScrollProgress = 0.0;
  var currentScrollProgress = 0.0;
  var currCamPos = new THREE.Vector3().copy(keyframes[0].pos);
  var currTarget = new THREE.Vector3().copy(keyframes[0].target);
  var mouseX = 0, mouseY = 0;

  window.addEventListener('mousemove', function (e) {
    mouseX = (e.clientX - window.innerWidth / 2);
    mouseY = (e.clientY - window.innerHeight / 2);
  });

  function smoothstep(t) {
    var c = Math.max(0, Math.min(1, t));
    return c * c * (3.0 - 2.0 * c);
  }

  function onScroll() {
    var scrollY = window.scrollY || window.pageYOffset;
    var maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    targetScrollProgress = Math.min(1, Math.max(0, scrollY / maxScroll));
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function getTimelineState(progress) {
    var totalSections = sectionIds.length - 1;
    var scrollY = window.scrollY || window.pageYOffset;

    var secIdx = 0;
    var secFrac = 0.0;

    for (var i = sectionIds.length - 1; i >= 0; i--) {
      var el = document.getElementById(sectionIds[i]);
      if (!el) continue;
      if (scrollY >= el.offsetTop - 80) {
        secIdx = i;
        var elNext = (i < sectionIds.length - 1) ? document.getElementById(sectionIds[i + 1]) : null;
        if (elNext) {
          var top = el.offsetTop;
          var span = Math.max(1, elNext.offsetTop - top);
          var rel = Math.min(1, Math.max(0, (scrollY - top) / span));

          if (rel < 0.55) {
            secFrac = 0.0;
          } else {
            var flightT = (rel - 0.55) / 0.45;
            secFrac = smoothstep(flightT);
          }
        } else {
          secFrac = 0.0;
        }
        break;
      }
    }

    var kf1Idx = sectionToKeyframe[secIdx];
    var nextSecIdx = Math.min(sectionIds.length - 1, secIdx + 1);
    var kf2Idx = sectionToKeyframe[nextSecIdx];

    var kf1 = keyframes[kf1Idx];
    var kf2 = keyframes[kf2Idx];

    var hudSecIdx = (secFrac >= 0.55 && secIdx < totalSections) ? secIdx + 1 : secIdx;
    var activeKfIdx = sectionToKeyframe[hudSecIdx];

    return {
      kf1: kf1,
      kf2: kf2,
      frac: secFrac,
      progress: progress,
      name: keyframes[activeKfIdx].name,
      activeSectionId: sectionIds[hudSecIdx],
      secIdx: secIdx,
      altStr: keyframes[activeKfIdx].altStr,
      altBand: keyframes[activeKfIdx].altBand
    };
  }

  /* ---------- Main Animation Loop (60 FPS Performance Target) ---------- */
  function animate() {
    requestAnimationFrame(animate);

    currentScrollProgress += (targetScrollProgress - currentScrollProgress) * 0.09;

    // Planetary Rotation Speeds
    earthGlobeMesh.rotation.y += 0.0016;
    cloudMesh.rotation.y += 0.0022;
    mercuryMesh.rotation.y += 0.0006;
    venusMesh.rotation.y += 0.0003;
    venusSurfaceMesh.rotation.y += 0.0002;
    marsMesh.rotation.y += 0.0015;
    jupiterMesh.rotation.y += 0.0035;
    saturnMesh.rotation.y += 0.0030;
    uranusMesh.rotation.x += 0.0018;
    neptuneMesh.rotation.y += 0.0022;
    sunMesh.rotation.y += 0.0005;

    // Solar Corona Dynamic Pulse
    var sTime = Date.now() * 0.0015;
    coronaMesh1.scale.setScalar(1.0 + Math.sin(sTime) * 0.02);
    coronaMesh2.scale.setScalar(1.0 + Math.cos(sTime * 0.8) * 0.03);

    // Planetary Moons Orbital Paths
    var time = Date.now() * 0.001;
    moonMesh.position.x = Math.cos(time * 0.35) * 11;
    moonMesh.position.z = Math.sin(time * 0.35) * 11;

    phobosMesh.position.x = Math.cos(time * 1.4) * 4.5;
    phobosMesh.position.z = Math.sin(time * 1.4) * 4.5;
    deimosMesh.position.x = Math.cos(time * 0.9) * 6.5;
    deimosMesh.position.z = Math.sin(time * 0.9) * 6.5;

    ioMesh.position.x = Math.cos(time * 1.1) * 9.5;
    ioMesh.position.z = Math.sin(time * 1.1) * 9.5;
    europaMesh.position.x = Math.cos(time * 0.75) * 13.0;
    europaMesh.position.z = Math.sin(time * 0.75) * 13.0;
    ganymedeMesh.position.x = Math.cos(time * 0.5) * 17.0;
    ganymedeMesh.position.z = Math.sin(time * 0.5) * 17.0;
    callistoMesh.position.x = Math.cos(time * 0.32) * 21.0;
    callistoMesh.position.z = Math.sin(time * 0.32) * 21.0;

    titanMesh.position.x = Math.cos(time * 0.55) * 14.5;
    titanMesh.position.z = Math.sin(time * 0.55) * 14.5;
    enceladusMesh.position.x = Math.cos(time * 0.95) * 8.5;
    enceladusMesh.position.z = Math.sin(time * 0.95) * 8.5;

    tritonMesh.position.x = Math.cos(time * 0.65) * 6.5;
    tritonMesh.position.z = Math.sin(time * 0.65) * 6.5;

    // Continuous Camera Trajectory Interpolation
    var st = getTimelineState(currentScrollProgress);
    var k1 = st.kf1;
    var k2 = st.kf2;
    var f = st.frac;

    var targetX = THREE.MathUtils.lerp(k1.pos.x, k2.pos.x, f) + (mouseX * 0.0003);
    var targetY = THREE.MathUtils.lerp(k1.pos.y, k2.pos.y, f) - (mouseY * 0.0003);
    var targetZ = THREE.MathUtils.lerp(k1.pos.z, k2.pos.z, f);

    var lookX = THREE.MathUtils.lerp(k1.target.x, k2.target.x, f);
    var lookY = THREE.MathUtils.lerp(k1.target.y, k2.target.y, f);
    var lookZ = THREE.MathUtils.lerp(k1.target.z, k2.target.z, f);

    var camLerp = 0.14;
    currCamPos.x += (targetX - currCamPos.x) * camLerp;
    currCamPos.y += (targetY - currCamPos.y) * camLerp;
    currCamPos.z += (targetZ - currCamPos.z) * camLerp;

    currTarget.x += (lookX - currTarget.x) * camLerp;
    currTarget.y += (lookY - currTarget.y) * camLerp;
    currTarget.z += (lookZ - currTarget.z) * camLerp;

    camera.position.copy(currCamPos);
    camera.lookAt(currTarget);

    // Multi-Scale Geographic Satellite Level Fade & Removal
    // Street -> City -> Region -> Orbit
    var satVis = THREE.MathUtils.lerp(k1.satVisible, k2.satVisible, f);
    if (st.secIdx >= 2) {
      satVis = 0.0;
    }

    if (satVis > 0.01) {
      earthSurfaceGroup.visible = true;
      matSatStreet.opacity = Math.min(1.0, satVis * 1.6);
      matSatCity.opacity = Math.min(1.0, satVis * 1.3);
      matSatRegion.opacity = Math.min(1.0, satVis);
    } else {
      earthSurfaceGroup.visible = false;
    }

    // Spacecraft Fill Light follows camera view
    if (camFillLight) {
      camFillLight.position.copy(currCamPos);
      camFillLight.position.y += 4;
      camFillLight.target.position.copy(currTarget);
      camFillLight.target.updateMatrixWorld();
    }

    // Dispatch telemetry event with accurate physical altitude
    window.dispatchEvent(new CustomEvent('arstraumur:scrollstage', { detail: st }));

    renderer.render(scene, camera);
  }

  animate();

  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
