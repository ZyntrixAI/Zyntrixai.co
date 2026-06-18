// Neural Noise WebGL Background
(function() {
  const canvas = document.getElementById('shader-bg');
  if (!canvas) return;

  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  const pointer = { x: 0, y: 0, tX: 0, tY: 0 };
  const config = { color: [0.9, 0.2, 0.4], opacity: 0.95, speed: 0.001 };
  let uniforms = {};

  if (!gl) {
    console.warn('WebGL not supported');
    return;
  }

  const vsSource = `
    precision mediump float;
    varying vec2 vUv;
    attribute vec2 a_position;
    void main() {
      vUv = 0.5 * (a_position + 1.0);
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const fsSource = `
    precision mediump float;
    varying vec2 vUv;
    uniform float u_time;
    uniform float u_ratio;
    uniform vec2 u_pointer_position;
    uniform vec3 u_color;
    uniform float u_speed;

    vec2 rotate(vec2 uv, float th) {
      return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
    }

    float neuro_shape(vec2 uv, float t, float p) {
      vec2 sine_acc = vec2(0.0);
      vec2 res = vec2(0.0);
      float scale = 8.0;
      for (int j = 0; j < 15; j++) {
        uv = rotate(uv, 1.0);
        sine_acc = rotate(sine_acc, 1.0);
        vec2 layer = uv * scale + float(j) + sine_acc - t;
        sine_acc += sin(layer) + 2.4 * p;
        res += (0.5 + 0.5 * cos(layer)) / scale;
        scale *= 1.2;
      }
      return res.x + res.y;
    }

    void main() {
      vec2 uv = 0.5 * vUv;
      uv.x *= u_ratio;
      vec2 pointer = vUv - u_pointer_position;
      pointer.x *= u_ratio;
      float p = clamp(length(pointer), 0.0, 1.0);
      p = 0.5 * pow(1.0 - p, 2.0);
      float t = u_speed * u_time;
      vec3 col = vec3(1.0);
      float noise = neuro_shape(uv, t, p);
      noise = 1.2 * pow(noise, 3.0);
      noise += pow(noise, 10.0);
      noise = max(0.0, noise - 0.5);
      noise *= (1.0 - length(vUv - 0.5));
      col = mix(vec3(1.0), u_color, noise);
      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function createShader(source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader error:', gl.getShaderInfoLog(shader));
      return null;
    }
    return shader;
  }

  function createProgram(vs, fs) {
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program error:', gl.getProgramInfoLog(program));
      return null;
    }
    return program;
  }

  const vertexShader = createShader(vsSource, gl.VERTEX_SHADER);
  const fragmentShader = createShader(fsSource, gl.FRAGMENT_SHADER);
  const program = createProgram(vertexShader, fragmentShader);

  if (!program) {
    console.error('Failed to create WebGL program');
    return;
  }

  gl.useProgram(program);

  const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  const positionLocation = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  uniforms.u_time = gl.getUniformLocation(program, 'u_time');
  uniforms.u_ratio = gl.getUniformLocation(program, 'u_ratio');
  uniforms.u_pointer_position = gl.getUniformLocation(program, 'u_pointer_position');
  uniforms.u_color = gl.getUniformLocation(program, 'u_color');
  uniforms.u_speed = gl.getUniformLocation(program, 'u_speed');

  gl.uniform3f(uniforms.u_color, config.color[0], config.color[1], config.color[2]);
  gl.uniform1f(uniforms.u_speed, config.speed);

  function resizeCanvas() {
    const devicePixelRatio = Math.min(window.devicePixelRatio, 2);
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform1f(uniforms.u_ratio, canvas.width / canvas.height);
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  function render() {
    const currentTime = performance.now();
    pointer.x += (pointer.tX - pointer.x) * 0.2;
    pointer.y += (pointer.tY - pointer.y) * 0.2;

    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(uniforms.u_time, currentTime);
    gl.uniform2f(uniforms.u_pointer_position, pointer.x / window.innerWidth, 1 - pointer.y / window.innerHeight);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(render);
  }

  render();

  const updateMousePosition = (x, y) => {
    pointer.tX = x;
    pointer.tY = y;
  };

  window.addEventListener('pointermove', (e) => updateMousePosition(e.clientX, e.clientY));
  window.addEventListener('touchmove', (e) => {
    if (e.targetTouches[0]) updateMousePosition(e.targetTouches[0].clientX, e.targetTouches[0].clientY);
  });
  window.addEventListener('click', (e) => updateMousePosition(e.clientX, e.clientY));
})();
