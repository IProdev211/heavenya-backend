import mongoose, { Connection, Collection } from 'mongoose';
// let url:string = 'mongodb://127.0.0.1:27017/heavenya'
let url: string = 'mongodb://164.68.125.203:27017/heavenya';

import { emailVerificationModel, usersModel, eventsModel } from './models';
import { IEventsN, IUsersN } from './schemas';

let db: Connection = mongoose.connection;
let emailVerificationCollection = 'emailverifications';

export function connect() {
  return mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    socketTimeoutMS: 0,
    connectTimeoutMS: 0
  });
}

db.on('error', () => {
  console.error('ERROR TRYING TO CONNECT TO THE DATABASE');
});

db.once('open', () => {
  console.log('CONNECTED TO DB');
});

export function createDummyData(callback: any) {
  let userData: IUsersN = {
    email: 'test@test.test',
    password: 'test password',
    username: 'test username',
    phone: 'test phone',
    job: 'test jobs',
    type: 'NORMAL',
  };
  let users = new usersModel(userData);

  let emailVerification = new emailVerificationModel({
    user: userData,
    createdAt: '2019-10-24T16:47:46.779Z',
    verificationLink: 'testLink',
    status: 'NOT VERIFIED',
  });



  console.log('CREATING DUMMY DATA...');
  db.collection('emailverifications')
    .findOne({ "user.username": userData.username.toString() })
    .then(e => {
      if (e == null) {
        emailVerification
          .save()
          .then(es => {
            console.log('EMAIL VERIFICATION DUMMY DATA CREATED.');
            db.collection('users')
              .findOne({ "user.username": userData.username.toString() })
              .then(u => {
                if (u == null) {
                  users
                    .save()
                    .then(us => {
                      let adminUserData = {
                        email: 'admin@test.test',
                        password: 'test password',
                        username: 'test Adminusername',
                        phone: 'test phone',
                        job: 'test jobs',
                        type: 'SU',
                        publicIPs: [],
                      };
                      let adminUser = new usersModel(adminUserData);
                      adminUser
                        .save()
                        .then((iu) => {
                          let eventsData: IEventsN = {
                            endTime: new Date(Date.now()),
                            name: 'testName',
                            publish: false,
                            startTime: new Date(Date.now()),
                            type: 'EVENT',
                            userId: iu.id,
                            details: 'TEST DETAILS',
                            date: new Date(Date.now()),
                            eventuality: 'DAILY',
                            location: 'TEST LOCATION',
                            numberOfSpots: 3,
                            photo: 'TEST URL',
                            status: 'PRIVATE',
                            going: [userData.username, userData.username, userData.username],
                          };

                          let eventModel = new eventsModel(eventsData);
                          eventModel
                            .save()
                            .then(() => {
                              console.log('USER DUMMY DATA CREATED.');
                              callback(true);
                            })
                            .catch(err => {
                              console.error(
                                'ERROR TRYING TO CREATE EVENT DUMMY DATA',
                                err,
                              );
                              callback(false);
                            });
                        })
                        .catch(err => {
                          console.error(
                            'ERROR TRYING TO CREATE ADMIN USER DUMMY DATA',
                            err,
                          );
                          callback(false);
                        });
                    })
                    .catch(err => {
                      console.error(
                        'ERROR TRYING TO CREATE USER DUMMY DATA',
                        err,
                      );
                      callback(false);
                    });
                } else {
                  console.log('USER DUMMY DATA ALREADY EXIST... SKIPPING');
                  callback(true);
                }
              });
          })
          .catch(err => {
            console.error(
              'ERROR TRYING TO SAVE EMAIL VERIFICATION DUMMY DATA',
              err,
            );
            callback(false);
          });
      } else {
        console.log('EMAIL VERIFICATION DUMMY DATA ALREADY EXIST... SKIPPING');
        db.collection('users')
          .findOne({ username: userData.username })
          .then(u => {
            if (u == null) {
              users
                .save()
                .then(us => {
                  console.log('USER DUMMY DATA CREATED.');
                  callback(true);
                })
                .catch(err => {
                  console.error('ERROR TRYING TO CREATE USER DUMMY DATA');
                  callback(false);
                });
            } else {
              console.log('USER DUMMY DATA ALREADY EXIST... SKIPPING');
              callback(true);
            }
          });
      }
    });
}

export function createEmailVerificationRequest(
  userData: any,
  verificationLink: string,
  callback: any,
) {
  let emailVerification = new emailVerificationModel({
    user: userData,
    createdAt: new Date(Date.now()),
    verificationLink: verificationLink,
    status: 'NOT VERIFIED',
  });

  doesUserExist(userData.username).then(v => {
    if (v == true) {
      callback(null);
    } else {
      db.collection(emailVerificationCollection)
        .findOne({ "user.username": userData.username })
        .then(evu => {
          console.log(evu)
          if (evu == null) {
            emailVerification
              .save()
              .then(ev => {
                callback(true);
              })
              .catch(e => {
                callback({
                  error: 'ERROR TRYING TO SAVE EMAIL VERIFICATION REQUEST',
                });
              });
          } else {
            callback({ error: 'EMAIL VERIFICATION REQUEST ALREADY EXIST' });
          }
        });
    }
  });
}

export function verificateEmail(username: string, callback: any) {
  db.collection('emailverifications')
    .findOne({ "user.username": username })
    .then(e => {
      let emailVerification = new emailVerificationModel(e);
      let user = new usersModel(emailVerification.user);
      user.type = 'NORMAL';
      emailVerification
        .update({ status: 'VERIFIED' })
        .then(() => {
          user
            .save()
            .then(() => {
              callback(true);
            })
            .then(err => {
              console.error(
                'ERROR TRYING TO SAVE A USER AFTER SAVING A EMAIL CONFIRMATION', err
              );
            });
        })
        .catch(err => {
          console.error('ERROR SAVING EMAIL VERIFICATION DATA', err);
          callback(false);
        });
    })
    .catch(err => {
      console.error('ERROR SEARCHING EMAIL VERIFICATION DATA', err);
      callback({ error: 'ERROR SEARCHING EMAIL VERIFICATION DATA' });
    });
}

export function doesUserExist(user: string): Promise<boolean> {
  return new Promise<boolean>((resolve, reject) => {
    db.collection('users')
      .findOne({ "username": user })
      .then(u => {
        if (u == null) {
          resolve(false);
        } else {
          return resolve(true);
        }
      })
      .catch(e => {
        console.error('ERROR TRYING TO FIND USER: ', e);
        reject(e);
      });
  });
}

export function doesUserExistReturn(user: string): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    db.collection('users')
      .findOne({ username: user.toString() })
      .then(u => {
        if (u == null) {
          resolve(null);
        } else {
          return resolve(u);
        }
      })
      .catch(e => {
        console.error('ERROR TRYING TO FIND USER: ', e);
        reject(e);
      });
  });
}

export function doesEventExistReturn(userid: string, name: string ): Promise<any> {
  
  return new Promise<any>((resolve, reject) => {
    db.collection('events')
      .findOne({ userId: userid.toString(), name: name })
      .then(u => {
        if (u == null) {
          resolve(null);
        } else {
          return resolve(u);
        }
      })
      .catch(e => {
        console.error('ERROR TRYING TO FIND EVENT: ', e);
        reject(e);
      });
  });
}

export function doesUserEmailExist(user: string): Promise<boolean> {
  return new Promise<boolean>((resolve, reject) => {
    db.collection(emailVerificationCollection)
      .findOne({ username: user.toString() })
      .then(u => {
        if (u == null) {
          resolve(false);
        } else {
          return resolve(true);
        }
      })
      .catch(e => {
        console.error('ERROR TRYING TO FIND USER: ', e);
        reject(e);
      });
  });
}

export function doesEmailExist(email: string): Promise<any> {
  return db.collection('users').findOne({ email: email.toString() });
}

export function addAdminIp(username: string, ip: string, callback: any) {
  db.collection('users')
    .findOne({ username: username.toString() })
    .then(u => {
      let user = new usersModel(u);
      user.publicIPs !== undefined ? user.publicIPs.push(ip) : '';
      user
        .updateOne({ $push: { publicIPs: ip } })
        .then(() => {
          callback(true);
        })
        .catch(err => {
          callback({ error: err });
        });
    })
    .catch(err => {
      callback({ error: err });
    });
}

export function modifyUser(doc: any, filter: any) {
  let user = new usersModel(doc);
  return user.updateOne(filter);
}

export function createUserEvent(data: IEventsN) {
  let events = new eventsModel(data);
  return events.save();
}

export function getAllUsersDb() {
  return db
    .collection('users')
    .find({}, { projection: { _id: 0, publicIPs: 0, password: 0 } });
}

export function getAllEventsDb() {
  return db.collection('events').find({});
}

export function getEventsDbWithLimit(username: string, pageNum: number, perPage: number) {
    return db.collection('users')
      .findOne({ "username": username.toString() })
      .then(u => {
        return db.collection('events').find({}).skip(perPage * pageNum).limit(perPage);
      });
}

export function searchEventByUser(username: string) {
  console.log(username)
  return db.collection('events').find({ userId: username.toString() })
}

export function changeEventPublishDb(
  username: string,
  name: string,
  change: any,
  callback: any,
) {
  console.log(username)
  db.collection('events')
    .findOne({ userId: username.toString(), name: name.toString() })
    .then(e => {
      let event = new eventsModel(e);
      event.update(change).then(() => {
        callback(true);
      });
    });
}

export function getEventDataDb(username: string, name: string) {
  return db.collection("events").findOne({ "userId": username.toString(), name: name.toString() })
}

export function attendEventDb(
  username: string,
  name: string,
  attender: string,
  callback: any,
) {
  db.collection('events')
    .findOne({ name: name.toString(), userId: username.toString() })
    .then(e => {
      console.log(e)
      let event = new eventsModel(e);
      if (event.going !== undefined) {
        for (let i = 0; i < event.going.length; i++) {
          if (event.going[i] == attender) {
            callback({ error: 'THE ATTENDER IS ALREADY IN THIS EVENT' });
          }
        }
        event.update({ $push: { going: attender } }).then(() => {
          callback(true);
        });
      }
    });
}

export function editUserDb(username: string, changes: any, callback: any) {
  db.collection('users')
    .findOne({ username: username.toString() })
    .then(u => {
      if (u == null) {
        callback(false);
      } else {
        let user = new usersModel(u);
        user.update(changes).then(callback());
      }
    });
}

export function changeUserImageDb(id: string, photo: string) {
  return db.collection("users").updateOne({ "_id": id }, { $set: { "photo": photo } })
}

export function getUserById(id: string) {
  return db.collection("users").findOne({
    $where: function () {
      return (this.id == id.toString())
    }
  })
}

export function getUserId(username: string) {
  return db.collection("users").findOne({ "username": username })
}

export function doesEventExist(eventname: string) {
  return new Promise<boolean>((resolve, reject) => {
    db.collection('events')
      .findOne({ "name": eventname })
      .then(u => {
        if (u == null) {
          resolve(false);
        } else {
          return resolve(true);
        }
      })
      .catch(e => {
        console.error('ERROR TRYING TO FIND EVENT: ', e);
        reject(e);
      });
  });
}

export function deleteOneEvent(
  userid: string,
  eventname: string,
  callback: any,
) {
  db.collection('events')
    .findOneAndDelete({ name: eventname.toString(), userId: userid.toString() })
    .then(e => {
      callback(e.value !== null)
    });
}