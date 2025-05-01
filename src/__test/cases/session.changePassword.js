import '../config.js';
import { Cache, Auth, Data, Event } from 'ks-adapters';
import Session from '../../clientLogic/Session.js';

(async () => {
  try {
    const cacheAdapter = new Cache('localStorage');
    const authAdapter = new Auth('JWT');
    const dataAdapter = new Data('mock');
    const eventAdapter = new Event('eventBus');

    const session = new Session(
      { cacheAdapter, authAdapter, dataAdapter, eventAdapter },
      { anonymous: { id: 10000, username: 'anonymous@kizansolutions.com', password: '123456' }, appToken: process.env.APP_JWT }
    );

    const response = await session.changePassword({
      password: '123456',
      confirmPassword: '123456',
      userRecoveryUuid: 'abcdefghijklmnopqrstuvwxyz',
    });

    console.log('Change Password Response:', response);
  } catch (error) {
    console.log(error);
  }
})();
