import { Socket } from 'ks-adapters';

(async () => {
  try {
    const serverUrl = `https://test.microservices.kizansolutions.com`;
    const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhIjoxNywidSI6MTAwNzksImMiOltdLCJ1YyI6bnVsbCwib2MiOltdLCJwIjoiIiwiY3AiOltdLCJsdHMiOjEsImFwcHYiOiIxLjAuNjc0MiIsImlhdCI6MTc0NTg1ODc3OSwiZXhwIjoxNzUzNjM0Nzc5fQ.qaKmy5XRw57ejvahIyZAwz-hm8XHJo3s25BZsKXwv_s`;
    const SocketAdapter = new Socket('socketIO', serverUrl, { transports: ['websocket'], auth: { token: token } });
    SocketAdapter.connect();
    SocketAdapter.on('connect', () => {
      console.log('Connected to server');
    });
    SocketAdapter.on('disconnect', () => {
      console.log('Disconnected from server');
    });
    SocketAdapter.on('insertSMSConversationMessage', data => {
      console.log('insertSMSConversationMessage', data);
      //SocketAdapter.disconnect();
    });
  } catch (err) {
    console.log(err);
  }
})();
