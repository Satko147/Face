#include <packing>
uniform float time;
uniform float progress;
uniform sampler2D depthInfo;
uniform vec4 resolution;
varying float vDepth;
varying vec2 vUv;
varying vec2 vUv1;
varying vec3 vPosition;
uniform float cameraNear;
uniform float cameraFar;

float PI = 3.141592653589793238;

float readDepth(sampler2D depthSampler, vec2 coord) {
    float fragCoordZ = texture2D(depthSampler, coord).x;
    float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar);

    return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar);
}

void main() {
//    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);

    float depth = readDepth(depthInfo, vUv);
    float toMix = smoothstep(0.4, 1., vDepth);
    gl_FragColor.rgb = mix(vec3(0.901, 0, 0.835), vec3(0.003, 0.023, 0.196), toMix);
    gl_FragColor.a = 1.0;
}
