import { Mesh, Program, Texture, Plane } from "ogl";
import gsap from "gsap";
import _ from "lodash";

import fragment from "../shaders/fragment.glsl";
import vertex from "../shaders/vertex.glsl";

const IMAGE_PATH = "../../assets/";

export default class Media {
  constructor({ mediaElement, gl, viewport, sizes, scene, index, length }) {
    this.mediaElement = mediaElement;
    this.gl = gl;
    this.viewport = viewport;
    this.sizes = sizes;
    this.scene = scene;
    this.index = index;
    this.length = length;
    this.active = false;

    this.passes = 0;

    this.tl = gsap.timeline({ paused: true });
    this.tlTwo = gsap.timeline({ paused: true });

    this.createMesh();
    this.createDom();
    this.createTween();

    this.resize();
  }

  createMesh() {
    const texture = new Texture(this.gl, {
      generateMipmaps: false,
    });

    // Get image
    const img = new Image();
    img.src = IMAGE_PATH + this.mediaElement.src;

    // Wait for image to load
    img.onload = () => {
      program.uniforms.uImageSizes.value = [
        img.naturalWidth,
        img.naturalHeight,
      ];

      texture.image = img;
    };

    // Create geometry
    const planeGeometry = new Plane(this.gl, {
      heightSegments: 50,
      widthSegments: 100,
    });

    // Create program
    const program = new Program(this.gl, {
      fragment,
      vertex,
      uniforms: {
        tMap: { value: texture },
        uPlaneSizes: { value: [0, 0] },
        uImageSizes: { value: [0, 0] },
        uViewportSizes: { value: [0, 0] },
        uAlpha: { value: 0.5 },
      },
      transparent: true,
    });

    // Create plane with geometry and program we created
    this.plane = new Mesh(this.gl, {
      geometry: planeGeometry,
      program,
    });

    // Add plane to scene
    this.plane.setParent(this.scene);
  }

  createDom() {
    const nc = document.querySelector(".nc");
    const name = document.createElement("div");
    name.classList.add("n");
    name.innerHTML = `<p>${this.mediaElement.title}</p>`;

    nc.appendChild(name);
  }

  createTween() {
    this.tlTwo.to(
      this.plane.program.uniforms.uAlpha,
      {
        value: 1,
        ease: "circ.easeIn",
        duration: 0.5,
      },
      "start"
    );
  }

  onScroll(speed, direction) {
    let target = this.scroll.targetY + (direction == "U" ? speed : -speed);
    target = Math.max(this.bottomBoundary, Math.min(this.topBoundary, target));

    this.scroll.targetY = target;

    this.scroll.newCurrentY =
      this.scroll.currentY +
      (this.scroll.targetY - this.scroll.currentY) * 5.5 * 0.033;

    // if (Math.abs(this.scroll.newCurrentY - this.scroll.targetY) <= 0.001) {
    //   this.scroll.newCurrentY = this.scroll.targetY;
    // }

    let itemIndex = Math.round(this.scroll.newCurrentY / this.planeHeight);
    if (itemIndex === -0) itemIndex = 0; // to not fuck it up!
    const itemSnap = itemIndex * this.planeHeight;

    this.tl.clear();
    this.tl.to(
      this.scroll,
      {
        newCurrentY: itemSnap,
        ease: "circ.easeIn",
        duration: 0.4,
        delay: 0.1,
      },
      "start"
    );
  }

  update() {
    // Update plane position with the target position and snaps to target
    this.plane.position.y = this.scroll.newCurrentY;

    // Update variable
    this.scroll.currentY = this.scroll.newCurrentY;
    this.tl.play();

    if (this.plane.position.y === 0) {
      this.active = true;
      this.tlTwo.play();
    } else {
      this.active = false;
      this.tlTwo.reverse();
    }
  }

  resize({ sizes, viewport } = {}) {
    if (sizes) {
      this.sizes = sizes;
    }

    if (viewport) {
      this.viewport = viewport;

      this.plane.program.uniforms.uViewportSizes.value = [
        this.viewport.width,
        this.viewport.height,
      ];
    }

    this.scale = this.sizes.height / 1500;

    // Update plane scale
    this.plane.scale.y =
      (this.viewport.height * (500 * this.scale)) / this.sizes.height;
    this.plane.scale.x =
      (this.viewport.width * (1000 * this.scale)) / this.sizes.width;

    this.plane.program.uniforms.uPlaneSizes.value = [
      this.plane.scale.x,
      this.plane.scale.y,
    ];

    // Add padding between planes
    this.padding = 1;

    // Get plane height and scroll limit, which is the sum of all the planes height
    this.planeHeight = this.plane.scale.y + this.padding;
    this.scrollLimit = this.planeHeight * (this.length - 1);

    // Get top and bottom boundary for each plane
    this.bottomBoundary = -this.planeHeight * this.index;
    this.topBoundary = this.bottomBoundary + this.scrollLimit;

    // Set Default Y position
    this.scroll = {
      newCurrentY: this.bottomBoundary,
      currentY: this.bottomBoundary,
      targetY: this.bottomBoundary,
    };
  }
}
