import '../config.js';
import { Event, Cache, Auth, Data } from 'ks-adapters';
import Session from '../../clientLogic/Session.js';

(async () => {
  try {
    const cacheAdapter = new Cache('localStorage');
    const authAdapter = new Auth('JWT');
    const dataAdapter = new Data('mock');
    const eventAdapter = new Event('eventBus');

    eventAdapter.subscribe('session:refreshToken', async data => {
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve();
        }, 1500);
      });
      console.log('event emited session:refreshToken', data);
    });

    const session = new Session(
      { cacheAdapter, authAdapter, dataAdapter, eventAdapter },
      { anonymous: { id: 10000, username: 'anonymous@kizansolutions.com', password: '123456' }, appToken: process.env.APP_JWT }
    );

    await session.login({
      username: 'user@kizansolutions.com',
      password: '123456',
      lts: true,
    });

    await session.refresh();
  } catch (err) {
    console.log(err);
  }
})();
