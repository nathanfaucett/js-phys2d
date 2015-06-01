var odin = require("odin"),
    phys2d = require("../../../src/index"),
    Phys2DPlugin = require("odin-phys2d-plugin"),
    Phys2DRigidBody = require("odin-phys2d-rigidbody");


var assets = odin.Assets.create(),
    canvas = odin.Canvas.create({
        disableContextMenu: false,
        aspect: 1.5,
        keepAspect: true
    }),
    renderer = odin.Renderer.create();

var texture = odin.Texture.create("image_hospital", "img/hospital.png");

var shader = odin.Shader.create(
    [
        "void main(void) {",
        "    gl_Position = perspectiveMatrix * modelViewMatrix * getPosition();",
        "}"
    ].join("\n"), [
        "uniform vec3 color;",

        "void main(void) {",
        "    gl_FragColor = vec4(color, 1.0);",
        "}"
    ].join("\n")
);

var material0 = odin.Material.create("mat_box0", null, {
    shader: shader,
    uniforms: {
        color: [1, 0, 0]
    }
});

var material1 = odin.Material.create("mat_box1", null, {
    shader: shader,
    uniforms: {
        color: [0, 1, 0]
    }
});

assets.add(material0, material1, texture);

var camera = global.camera = odin.Entity.create("main_camera").addComponent(
    odin.Transform.create()
        .setPosition([0, -0.1, 1]),
    odin.Camera.create()
        .setOrthographic(true)
        .setOrthographicSize(5)
        .setActive(),
    odin.OrbitControl.create()
);

var sprite = odin.Entity.create().addComponent(
    odin.Transform2D.create()
        .setPosition([0, 0, 0]),
    odin.Sprite.create({
        material: material0
    })
);

var rigidbody = Phys2DRigidBody.create();

rigidbody.body.setMotionState(phys2d.motionType.DYNAMIC);
rigidbody.body.add(phys2d.Circle.create());

var sprite2 = odin.Entity.create().addComponent(
    odin.Transform2D.create()
        .setPosition([0, 5, 0]),
    odin.Sprite.create({
        material: material1
    }),
    rigidbody
);

var scene = global.scene = odin.Scene.create("scene")
        .addPlugin(Phys2DPlugin.create())
        .add(camera, sprite, sprite2),
    cameraComponent = camera.components.Camera;

scene.assets = assets;

canvas.on("resize", function(w, h) {
    cameraComponent.set(w, h);
});
cameraComponent.set(canvas.pixelWidth, canvas.pixelHeight);

renderer.setCanvas(canvas.element);

var loop = odin.createLoop(function() {
    scene.update();
    renderer.render(scene, cameraComponent);
}, canvas.element);

assets.load(function() {
    scene.init(canvas.element);
    scene.awake();
    loop.run();
});
