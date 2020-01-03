import express from 'express';
import {connect, createDummyData} from './lib/db';
import nodemailer from 'nodemailer';
import bodyParse from 'body-parser';
import cors from 'cors';
import {
  signUpRouter,
  verification,
  adminLogin,
  addAdminIpRoute,
  userResetPasswordRequest,
  resetPassword,
  verifyResetCode,
} from './routes/Verifications';
import {
  doesUserExistRouter,
  createEvent,
  getAllUsers,
  getAllEvents,
  getNumberOfSpots,
  editEvent,
  getEventData,
  attendEvent,
  editUser,
  userLogin,
  getImage,
  sendReport,
  changeUserImage,
  clientGetAllEvents,
  deleteEvent
} from './routes/users';
import {osRouter, getCPU, Icpu, getRAM, getDISK, Idisk} from './routes/os';

export let app: express.Express = express();

app.use(bodyParse.json());
app.use(cors());

// export let defaultServerUrl: string = 'http://admin.heavenya.com/';
export let defaultServerUrl: string = 'http://localhost:5500/';

export let transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 25,
  auth: {
    user: 'account@heavenya.com', // generated ethereal user
    pass: 'Testing123456', // generated ethereal password
  },
});

app.use(signUpRouter);

app.use(verification);

app.use(doesUserExistRouter);

app.use(adminLogin);

app.use(addAdminIpRoute);

app.use(userResetPasswordRequest);

app.use(resetPassword);

app.use(createEvent);

app.use(getAllUsers);

app.use(getAllEvents);

app.use(getNumberOfSpots);

app.use(editEvent);

app.use(getEventData);

app.use(attendEvent);

app.use(editUser);

app.use(userLogin);

app.use(verifyResetCode);
app.use(getImage);

app.use(sendReport);

app.use(changeUserImage);

app.use(osRouter);

app.use(clientGetAllEvents);

app.use(deleteEvent);

var http = require('http').Server(app);

import path from 'path';

app.use(express.static(path.resolve('./administrationpanel/build/')));

app.use((req, res, next) => {
  let domain = req.subdomains[0];
  if (domain == 'admin') {
    if (req.url == '/' || req.url == '/front/login') {
      res.sendFile(path.resolve('./administrationpanel/build/index.html'));
    } else {
      next();
    }
  }else{
    next();
  }
});

app.listen(80, () => {
  console.log('running on 80');
  connect().then(() => {
    createDummyData((r: boolean) => {
      console.log(r);
    });
  });
});

var io = require('socket.io')(http);

let connectionArray: Array<any> = [];

io.on('connection', function(socket: any) {
  if (!connectionArray.includes(socket)) {
    connectionArray.push(socket);
    setInterval(() => {
      getCPU((cpu: Icpu) => {
        socket.emit('CPUDATA', cpu);
        socket.emit('RAMDATA', getRAM());
        getDISK((disk: Idisk) => {
          socket.emit('DISKDATA', disk);
        });
      });
    }, 1000);
  }

  socket.on('disconnect', () => {
    connectionArray.splice(0, connectionArray.indexOf(socket));
  });
});

const server = http.listen( process.env.PORT || 5500, function() {
  console.log('listening on *5500');
});
