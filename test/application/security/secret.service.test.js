'use strict';

const SecretRotationPolicy = require('@policy/permissions/secret-rotation.policy');

describe('T086: Secret Rotation Service', () => {
  test('rotates secret and revokes old key', () => {
    const service = new SecretRotationPolicy({ currentSecretKey: 'v1' });

    expect(service.isKeyActive('v1')).toBe(true);
    service.rotateSecret('v2');
    expect(service.isKeyActive('v1')).toBe(false);
    expect(service.isKeyActive('v2')).toBe(true);
  });
});
