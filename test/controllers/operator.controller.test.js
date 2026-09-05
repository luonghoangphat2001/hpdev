'use strict';

const OperatorController = require('@controllers/OperatorController');

describe('OperatorController', () => {
  let mockIntakeService;
  let mockControlService;
  let mockReplayService;
  let controller;
  let res;

  beforeEach(() => {
    mockIntakeService = {
      intake: jest.fn().mockResolvedValue({ eventId: 'evt-1', received: true }),
    };
    mockControlService = {
      getStatus: jest.fn().mockResolvedValue({ level: 'NORMAL', stopped: false }),
      setLevel: jest.fn().mockResolvedValue({ previous: 'NORMAL', current: 'HIGH' }),
      emergencyStop: jest.fn().mockResolvedValue({ stopped: true }),
      resume: jest.fn().mockResolvedValue({ resumed: true }),
    };
    mockReplayService = {
      replay: jest.fn().mockResolvedValue({ replayed: true }),
    };
    controller = new OperatorController(mockIntakeService, mockControlService, mockReplayService);
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('intake ingests event and returns 202 status with event_id', async () => {
    const req = { body: { event_type: 'order_created' } };
    await controller.intake(req, res);
    expect(mockIntakeService.intake).toHaveBeenCalledWith({ event_type: 'order_created' });
    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ event_id: 'evt-1' }));
  });

  test('getStatus returns status', async () => {
    await controller.getStatus({}, res);
    expect(mockControlService.getStatus).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('setLevel sets level safely', async () => {
    const req = { body: { level: 'HIGH', actorId: 'op-1' } };
    await controller.setLevel(req, res);
    expect(mockControlService.setLevel).toHaveBeenCalledWith('HIGH', 'op-1');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('emergencyStop executes stop', async () => {
    const req = { body: { reason: 'anomaly', actorId: 'op-1' } };
    await controller.emergencyStop(req, res);
    expect(mockControlService.emergencyStop).toHaveBeenCalledWith('anomaly', 'op-1');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('resume resumes operations', async () => {
    const req = { body: { actorId: 'op-1' } };
    await controller.resume(req, res);
    expect(mockControlService.resume).toHaveBeenCalledWith('op-1');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('replay executes replay', async () => {
    const req = { body: { workflowId: 'wf-1' } };
    await controller.replay(req, res);
    expect(mockReplayService.replay).toHaveBeenCalledWith({ workflowId: 'wf-1' });
    expect(res.status).toHaveBeenCalledWith(202);
  });
});
