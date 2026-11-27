import * as THREE from 'three';

// Canonical Mixamo (sanitized without ':') -> VRoid VRM 1.0 humanoid bone map
export const MIXAMO_TO_VROID: Record<string, string> = {
  mixamorigHips: 'J_Bip_C_Hips',
  mixamorigSpine: 'J_Bip_C_Spine',
  mixamorigSpine1: 'J_Bip_C_Chest',
  mixamorigSpine2: 'J_Bip_C_UpperChest',
  mixamorigNeck: 'J_Bip_C_Neck',
  mixamorigHead: 'J_Bip_C_Head',
  mixamorigLeftShoulder: 'J_Bip_L_Shoulder',
  mixamorigLeftArm: 'J_Bip_L_UpperArm',
  mixamorigLeftForeArm: 'J_Bip_L_LowerArm',
  mixamorigLeftHand: 'J_Bip_L_Hand',
  mixamorigRightShoulder: 'J_Bip_R_Shoulder',
  mixamorigRightArm: 'J_Bip_R_UpperArm',
  mixamorigRightForeArm: 'J_Bip_R_LowerArm',
  mixamorigRightHand: 'J_Bip_R_Hand',
  mixamorigLeftUpLeg: 'J_Bip_L_UpperLeg',
  mixamorigLeftLeg: 'J_Bip_L_LowerLeg',
  mixamorigLeftFoot: 'J_Bip_L_Foot',
  mixamorigRightUpLeg: 'J_Bip_R_UpperLeg',
  mixamorigRightLeg: 'J_Bip_R_LowerLeg',
  mixamorigRightFoot: 'J_Bip_R_Foot',
};

function sanitizeBoneKey(raw: string): string {
  return raw.replace(/[:.\s]/g, '');
}

/**
 * Retargets a Mixamo AnimationClip onto a VRoid J_Bip_* humanoid skeleton
 * using exact world-space rest-pose quaternion conversion:
 *   deltaW = W_srcParent * q_src * inv(W_src)
 *   q_dst  = inv(W_dstParent) * deltaW * W_dst
 *
 * Hips position keeps only vertical delta (scaled to VRoid hips height) so
 * characters never drift horizontally off their physics/story anchors.
 */
export function retargetMixamoClip(
  clip: THREE.AnimationClip,
  srcRoot: THREE.Object3D,
  dstRoot: THREE.Object3D,
): THREE.AnimationClip {
  srcRoot.updateMatrixWorld(true);
  dstRoot.updateMatrixWorld(true);

  // Index source bones by sanitized name
  const srcByKey = new Map<string, THREE.Object3D>();
  srcRoot.traverse((o) => {
    if (o.name) srcByKey.set(sanitizeBoneKey(o.name), o);
  });

  const tracks: THREE.KeyframeTrack[] = [];

  const wSrc = new THREE.Quaternion();
  const wSrcParent = new THREE.Quaternion();
  const invWSrc = new THREE.Quaternion();
  const wDst = new THREE.Quaternion();
  const wDstParent = new THREE.Quaternion();
  const invWDstParent = new THREE.Quaternion();
  const qSrc = new THREE.Quaternion();
  const qDst = new THREE.Quaternion();

  const srcHips = srcByKey.get('mixamorigHips') ?? null;
  const dstHips = dstRoot.getObjectByName('J_Bip_C_Hips') ?? null;
  const srcHipsWorldPos = new THREE.Vector3();
  const dstHipsWorldPos = new THREE.Vector3();
  let hipsScale = 1;
  if (srcHips && dstHips) {
    srcHips.getWorldPosition(srcHipsWorldPos);
    dstHips.getWorldPosition(dstHipsWorldPos);
    if (Math.abs(srcHipsWorldPos.y) > 0.1) {
      hipsScale = Math.abs(dstHipsWorldPos.y / srcHipsWorldPos.y);
    }
  }

  for (const track of clip.tracks) {
    const dot = track.name.lastIndexOf('.');
    if (dot < 0) continue;
    const rawNode = track.name.slice(0, dot);
    const prop = track.name.slice(dot + 1);
    const key = sanitizeBoneKey(rawNode);
    const dstName = MIXAMO_TO_VROID[key];
    if (!dstName) continue;

    const srcBone = srcByKey.get(key);
    const dstBone = dstRoot.getObjectByName(dstName);
    if (!srcBone || !dstBone) continue;

    if (prop === 'quaternion' && track instanceof THREE.QuaternionKeyframeTrack) {
      srcBone.getWorldQuaternion(wSrc);
      if (srcBone.parent) srcBone.parent.getWorldQuaternion(wSrcParent);
      else wSrcParent.identity();
      invWSrc.copy(wSrc).invert();

      dstBone.getWorldQuaternion(wDst);
      if (dstBone.parent) dstBone.parent.getWorldQuaternion(wDstParent);
      else wDstParent.identity();
      invWDstParent.copy(wDstParent).invert();

      const vals = track.values;
      const out = new Float32Array(vals.length);
      for (let i = 0; i < vals.length; i += 4) {
        qSrc.set(vals[i], vals[i + 1], vals[i + 2], vals[i + 3]);
        // deltaW = wSrcParent * qSrc * invWSrc
        qDst.copy(wSrcParent).multiply(qSrc).multiply(invWSrc);
        // qDst = invWDstParent * deltaW * wDst
        qDst.premultiply(invWDstParent).multiply(wDst).normalize();
        out[i] = qDst.x;
        out[i + 1] = qDst.y;
        out[i + 2] = qDst.z;
        out[i + 3] = qDst.w;
      }
      tracks.push(new THREE.QuaternionKeyframeTrack(`${dstName}.quaternion`, track.times.slice(), out));
    } else if (prop === 'position' && key === 'mixamorigHips' && srcBone.parent) {
      const parentMat = srcBone.parent.matrixWorld;
      const vTmp = new THREE.Vector3();
      const restLocal = dstBone.position;
      const vals = track.values;
      const out = new Float32Array(vals.length);
      for (let i = 0; i < vals.length; i += 3) {
        vTmp.set(vals[i], vals[i + 1], vals[i + 2]).applyMatrix4(parentMat);
        const dy = (vTmp.y - srcHipsWorldPos.y) * hipsScale;
        out[i] = restLocal.x;
        out[i + 1] = restLocal.y + dy;
        out[i + 2] = restLocal.z;
      }
      tracks.push(new THREE.VectorKeyframeTrack(`${dstName}.position`, track.times.slice(), out));
    }
  }

  return new THREE.AnimationClip(clip.name, clip.duration, tracks);
}
