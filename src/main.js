import { Renderer, Camera, Transform } from "ogl";
import NormalizeWheel from "normalize-wheel";

import { data } from "./lib/data.json";
import Media from "./core/media";
import { lerp } from "./utils/math";

import "./style.css";

class App {
  constructor() {
    this.speed = 0;

    this.createRenderer();
    this.createCamera();
    this.createScene();

    this.resize();

    this.createDom();
    this.createMedia();

    this.addEventListeners();
    this.update();
  }

  // Create Renderer
  createRenderer() {
    this.renderer = new Renderer({
      alpha: true,
    });

    // Create canvas Node
    this.gl = this.renderer.gl;

    // Get Script node to add canvas above
    const script = document.querySelector("#script");
    document.body.insertBefore(this.gl.canvas, script);
  }

  // Create Camera
  createCamera() {
    this.camera = new Camera(this.gl);
    this.camera.fov = 45;
    this.camera.position.z = 20;
  }

  // Create Scene
  createScene() {
    this.scene = new Transform();
  }

  createDom() {
    const home = document.querySelector("#h");
    const nameContainer = document.createElement("div");
    nameContainer.classList.add("nc");

    home.appendChild(nameContainer);
  }

  // Create webGL planes
  createMedia() {
    const length = data.planes.length;

    this.mediaList = data.planes.map((el, i) => {
      const plane = new Media({
        mediaElement: el,
        gl: this.gl,
        viewport: this.viewport,
        sizes: this.sizes,
        scene: this.scene,
        index: i,
        length: length,
      });

      return plane;
    });
  }

  onScroll(e) {
    const { pixelX, pixelY } = NormalizeWheel(e);

    const relativeSpeed = Math.min(
      100,
      Math.max(Math.abs(pixelX), Math.abs(pixelY))
    );

    this.speed = relativeSpeed * 0.015;

    if (pixelY > 0) {
      this.direction = "U";
    } else {
      this.direction = "D";
    }

    if (this.mediaList) {
      this.mediaList.forEach((el) => el.onScroll(this.speed, this.direction));
    }
  }

  // listen for the resize
  resize() {
    this.sizes = {
      height: window.innerHeight,
      width: window.innerWidth,
    };

    this.renderer.setSize(this.sizes.width, this.sizes.height);

    this.camera.perspective({
      aspect: this.gl.canvas.width / this.gl.canvas.height,
    });

    const fov = this.camera.fov * (Math.PI / 180);
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
    const width = height * this.camera.aspect;

    this.viewport = {
      height: height,
      width: width,
    };

    if (this.mediaList) {
      this.mediaList.forEach((el) =>
        el.resize({
          sizes: this.sizes,
          viewport: this.viewport,
        })
      );
    }
  }

  update() {
    // Update media
    if (this.mediaList) {
      this.mediaList.forEach((el) => el.update());
    }

    // Start renderer
    this.renderer.render({
      scene: this.scene,
      camera: this.camera,
    });

    requestAnimationFrame(this.update.bind(this));
  }

  // These are event handlers
  addEventListeners() {
    window.addEventListener("resize", this.resize.bind(this));

    window.addEventListener("mousewheel", this.onScroll.bind(this));
    window.addEventListener("wheel", this.onScroll.bind(this));

    window.addEventListener(
      "load",
      () => {
        document.addEventListener("mousemove", this.move, false);
        document.addEventListener("touchmove", this.move, false);
      },
      false
    );
    //
    // window.addEventListener('mousedown', this.onTouchDown.bind(this))
    // window.addEventListener('mousemove', this.onTouchMove.bind(this))
    // window.addEventListener('mouseup', this.onTouchUp.bind(this))
    //
    // window.addEventListener('touchstart', this.onTouchDown.bind(this))
    // window.addEventListener('touchmove', this.onTouchMove.bind(this))
    // window.addEventListener('touchend', this.onTouchUp.bind(this))
  }
}

new App();
