import express, { Router } from 'express';
import {
  doesUserExist,
  doesUserExistReturn,
  deleteOneEvent,
  createUserEvent,
  getAllUsersDb,
  getAllEventsDb,
  searchEventByUser,
  changeEventPublishDb,
  getEventDataDb,
  getEventsDbWithLimit,
  attendEventDb,
  editUserDb,
  doesEmailExist,
  changeUserImageDb,
  getUserById
} from '../lib/db';
import url from 'url';
import multer from 'multer';
import { IEventsN } from '../lib/schemas';

const Storage = multer.diskStorage({
  destination(req, file, callback) {
    callback(null, './uploads');
  },
  filename(req, file, callback) {
    callback(null, `${file.fieldname}_${Date.now()}_${file.originalname}`);
  },
});

const uploads = multer({ storage: Storage });

export let doesUserExistRouter: Router = express.Router();
doesUserExistRouter.get('/doesUserExist', (req, res) => {
  doesUserExist(String(url.parse(req.url, true).query.u))
    .then(v => {
      res.status(200).send(v);
    })
    .catch(e => {
      res.status(5000).send(e);
    });
});

export let changeUserImage: Router = express.Router();

changeUserImage.post(
  '/users/image/change',
  uploads.array('photo', 3),
  (req, res) => {
    if (req.file) {
      console.log("req.filefilefile", req.file)
      if (!req.file.mimetype.includes('image')) {
        res.status(400).send({ error: 'NOT IMAGE TYPE' });
      }

      if (req.file.size > 2e6) {
        res.status(400).send({ error: 'SIZE IS MORE THAN 2MBS' });
      }
    }

    let userData = req.body;
    console.log(userData)
    doesUserExistReturn(userData.username).then((u) => {
      if (u == null) {
        doesEmailExist(userData.username).then((ue) => {
          if (ue == null) {
            res.status(400).send({ error: "USERNAME NOT FOUND" })
          } else {
            changeUserImageDb(ue["_id"], req.file.filename).then(() => {
              res.send()
            }).catch((err) => {
              res.status(500).send({ error: err })
            })
          }
        })
      } else {
        changeUserImageDb(u["_id"], req.file.filename).then(() => {
          res.send()
        }).catch((err) => {
          console.error(err)
          res.status(500).send({ error: err })
        })
      }
    })
  },
);

export let createEvent: Router = express.Router();

createEvent.post('/createEvent', uploads.array('photo', 3), (req, res) => {
  if (req.file) {
    if (!req.file.mimetype.includes('image')) {
      res.status(400).send({ error: 'NOT IMAGE TYPE' });
    }

    if (req.file.size > 2e6) {
      res.status(400).send({ error: 'SIZE IS MORE THAN 2MBS' });
    }
  }

  doesUserExistReturn(req.body.username).then(u => {
    if (u == null) {
      res.status(400).send({ error: 'NO USER FOUND' });
    } else {
      const filename = req.file?`${req.file.filename}`:`null`;
      let data: IEventsN = {
        date: new Date(Number(req.body.date) * 1000),
        endTime: new Date(Number(req.body.endTime) * 1000),
        name: req.body.name,
        publish: req.body.publish,
        startTime: new Date(Number(req.body.startTime) * 1000),
        type: req.body.type,
        details: req.body.details,
        eventuality: req.body.eventuality,
        location: req.body.location,
        numberOfSpots: req.body.numberOfSpots,
        photo: filename,
        status: req.body.status,
        userId: u['_id'],
      };
      createUserEvent(data)
        .then(() => {
          res.status(200).send({ message: 'EVENT CREATED' });
        })
        .catch(e => {
          console.error(e);
          res.status(500).send({ error: 'ERROR TRYING TO CREATE EVENT' });
        });
    }
  });
});

export let getNumberOfSpots: Router = express.Router();

getNumberOfSpots.get('/events/numberSpotsAvailable', (req, res) => {
  let eventData = req.body.eventData;

  doesUserExistReturn(eventData.username).then(u => {
    if (u == null) {
      res.status(400).send({ error: 'USER NOT FOUND' });
    } else {
      let sendError: boolean = true;
      //console.log(u)
      searchEventByUser(u['_id'])
        .forEach(e => {
          console.log(e);
          if (e.name == eventData.name) {
            sendError = false;
            res.send({ numberSpotsAvailable: e.numberOfSpots - e.going.length });
          }
        })
        .then(() => {
          if (sendError == true) {
            res.status(400).send({ error: 'EVENT NOT FOUND' });
          }
        });
    }
  });
});

export let getEventData: Router = express.Router();

getEventData.get('/events/getEventData', (req, res) => {
  let eventData = req.body.eventData;

  doesUserExistReturn(eventData.username).then(u => {
    console.log(eventData.name);
    getEventDataDb(u['_id'], eventData.name)
      .then(e => {
        res.send(e);
      })
      .catch(e => {
        res.status(500).send();
      });
  });
});

export let editEvent: Router = express.Router();

editEvent.post('/events/changeEventPublish', (req, res) => {
  let eventData = req.body.eventData;

  doesUserExistReturn(eventData.username).then(u => {
    changeEventPublishDb(
      u['_id'],
      eventData.name,
      eventData.change,
      (r: boolean) => {
        r == true ? res.send() : res.status(400).send();
      },
    );
  });
});

export let attendEvent: Router = express.Router();

attendEvent.post('/events/attend', (req, res) => {
  let eventData = req.body.eventData;
  doesUserExistReturn(eventData.username).then(u => {
    attendEventDb(u['_id'], eventData.name, eventData.attender, (r: any) => {
      r == true ? res.send() : res.status(400).send(r);
    });
  });
});

export let getAllUsers: Router = express.Router();

getAllUsers.get('/admin/getAllUsers', (req, res) => {
  let users: Array<any> = [];

  getAllUsersDb()
    .forEach(u => {
      users.push(u);
    })
    .then(() => {
      res.status(200).send(users);
    });
});

export let getAllEvents: Router = express.Router();

getAllUsers.get('/admin/getAllEvents', (req, res) => {
  let events: Array<any> = [];

  getAllEventsDb()
    .forEach(e => {
      events.push(e);
    })
    .then(() => {
      res.status(200).send(events);
    });
});

export let userLogin: Router = express.Router();

userLogin.post('/login', (req, res) => {
  let userData = req.body.userData;

  doesUserExistReturn(userData.username).then(u => {
    if (u == null) {
      doesEmailExist(userData.username).then((ue) => {
        if (ue == null) {
          res.status(400).send({ error: 'USER DOES NOT EXIST' });
        } else {
          if (userData.password == ue.password) {
            res.status(200).send({ message: 'USER LOGED IN' });
          } else {
            console.log(`${userData.password}   ${ue.password}`);
            res.status(400).send({ error: 'BAD PASSWORD' });
          }
        }
      })

    } else {
      if (userData.password == u.password) {
        res.status(200).send({ message: 'USER LOGED IN' });
      } else {
        console.log(`${userData.password}   ${u.password}`);
        res.status(400).send({ error: 'BAD PASSWORD' });
      }
    }
  });
});

export let editUser: Router = express.Router();

editUser.post('/editUser', (req, res) => {
  let userData = req.body.userData;

  if (userData == null) {
    res.status(400).send({ error: 'NO USER DATA FOUND' });
  } else {
    editUserDb(userData.username, userData.change, (r: any) => {
      if (r == false) {
        res.status(400).send({ error: 'USERNAME NOT FOUND' });
      } else {
        res.send();
      }
    });
  }
});

export let getImage: Router = express.Router();

import path from 'path';
import { sendEmail } from '../lib/utils';

getImage.get('/getImage', (req, res) => {
  let p: any = url.parse(req.url, true).query.p;
  res.sendFile(path.resolve(`./uploads/${p}`));
});

export let sendReport: Router = express.Router();

sendReport.post('/sendReport', (req, res) => {
  let userData = req.body.userData;
  doesUserExistReturn(userData.username).then(u => {
    if (u == null) {
      doesEmailExist(userData.username).then(uE => {
        if (uE == null) {
          res.status(400).send({ error: 'USERNAME NOT FOUND' });
        } else {
          sendEmail(
            'support@heavenya.com',
            'Heavenya - USER REPORT',

            `<h2>USERNAME:</h2><p>    ${userData.username}</p>
            <h2>EMAIL:</h2><p>        ${userData.email}</p>
            <h2>REPORT TYPE:</h2><p>  ${userData.reportType}</p>
            <h2>MESSAGE:</h2><p>      ${userData.message}</p>
            `,
          )
            .then(() => {
              res.status(200).send({ message: 'Email sent' });
            })
            .catch(err => {
              res.status(400).send({ error: err });
            });
        }
      });
    } else {
      sendEmail(
        'support@heavenya.com',
        'Heavenya - USER REPORT',

        `<h2>USERNAME:</h2><p>    ${userData.username}</p>
        <h2>EMAIL:</h2><p>        ${userData.email}</p>
        <h2>REPORT TYPE:</h2><p>  ${userData.reportType}</p>
        <h2>MESSAGE:</h2><p>      ${userData.message}</p>
        `,
      )
        .then(() => {
          res.status(200).send({ message: 'Email sent' });
        })
        .catch(err => {
          res.status(400).send({ error: err });
        });
    }
  });
});

export let clientGetAllEvents: Router = express.Router();

clientGetAllEvents.get("/events/getAll", async (req, res) => {

  let events = await getAllEventsDb();

  events.toArray(async (err, arrayEvents) => {
    for (let i = 0; i < arrayEvents.length; i++) {
      await getUserById(arrayEvents[i].userId).then((u) => {
        delete arrayEvents[i].userId;
        arrayEvents[i].username = u.username;
      })
    }
    res.send(arrayEvents)
  })
})


export let clientGetEventsForAnUser: Router = express.Router();

clientGetEventsForAnUser.get("/events/getForAnUser", async (req, res) => {

  const eventData = req.body.eventData;
  const username = eventData.username;
  const page_num = eventData.page;

  doesUserExistReturn(username).then(async user => {
    let events = getEventsDbWithLimit(user["_id"], page_num, 10);
    events.toArray(async (err, arrayEvents) => {
      for (let i = 0; i < arrayEvents.length; i++) {
        delete arrayEvents[i].userId;
        arrayEvents[i].username = user.username;
      }
      res.send(arrayEvents)
    })
  })
})

export let deleteEvent: Router = express.Router();

deleteEvent.get("/events/delete", async (req, res) => {
  const eventData = req.body.eventData;

  doesUserExistReturn(eventData.username).then(u => {
    if (u) {
      deleteOneEvent(u["_id"], eventData.name, (r: any) => {
        r == true ? res.status(200).send({ message: "Deleted" }) : res.status(400).send({ message: "Not Deleted" });
      })
    }
  })
})

export let saveEvent: Router = express.Router();

saveEvent.get("/events/save", async (req, res) => {

})