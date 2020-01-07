import express, {Router} from 'express';
import {defaultServerUrl, transporter} from '../server';
import {
  createEmailVerificationRequest,
  verificateEmail,
  doesUserExist,
  doesUserExistReturn,
  addAdminIp,
  doesEmailExist,
  modifyUser,
} from '../lib/db';
import url from 'url';
import {sendEmail} from '../lib/utils';
import ejs from "ejs";
import path from 'path';

export let signUpRouter: Router = express.Router();

signUpRouter.post(
  '/signUp',
  (req, res, next) => {
    let userData = req.body.userData;
    if (userData == null) {
      res.sendStatus(400);
    } else {
      next();
    }
  },
  (req, res) => {
    let userData = req.body.userData
    //unique verification link:
    let verificationLink: string = `${defaultServerUrl}verification?u=${userData.username}`;

    createEmailVerificationRequest(userData, verificationLink, (r: any) => {
      if (r == null) {
        res.status(400).send({error: 'USER ALREADY EXIST'});
      } else {
        if (r.error !== undefined) {
          res.status(400).send(r);
        } else {
          ejs.renderFile(__dirname + "/email_template.ejs", { verificationLink: verificationLink }, function (err: any, data: any) {
            if (err) {
                console.log(err);
            } else {
              sendEmail(
                userData.email,
                'Heavenya - Confirmation link',
                data
              )
              .then(() => {
                res
                  .status(200)
                  .send({message: 'Email verification request created'});
              })
              .catch(err => {
                res.status(400).send({error: err});
              });
            }
          })
        }
      }
    });
  },
);

export let verification: Router = express.Router();

verification.get('/verification', (req, res) => {
  let username = url.parse(req.url, true).query.u;
  verificateEmail(String(username), (r: any) => {
    if( r )  
    {
      res.sendFile(path.resolve(`./src/routes/email_verified.html`))
    } else 
    {
      res.sendStatus(500);
    }
  });
});

export let adminLogin: Router = express.Router();

adminLogin.post(
  '/admin/login',
  (req, res, next) => {
    let userData = req.body.userData;
    if (userData == null) {
      res.status(400).send({error: 'NO USER DATA'});
    } else {
      res.locals.userData = userData;
      next();
    }
  },
  (req, res, next) => {
    doesUserExistReturn(res.locals.userData.username).then(e => {
      if (e === null) {
        res.status(400).send({error: "USER DOESN'T EXIST"});
      } else {
        if (e.type !== 'SU' && e.type !== 'ADMIN') {
          res.status(400).send({error: 'USER IS NOT AN ADMIN OR SUPER USER'});
        } else {
          res.locals.foundUserData = e;
          next();
        }
      }
    });
  },
  (req, res, next) => {
    let ips: Array<any> = res.locals.foundUserData.publicIPs;

    if (ips.includes(req.connection.remoteAddress)) {
      next();
    } else {
      //MAKE EMAIL VERIFICATION
      sendEmail(
        res.locals.foundUserData.email,
        'ADMIN AUTH - HEAVENYA',
        `ADMIN USER AUTENTIFICATION", "Please click this link to authorize this ip: ${defaultServerUrl}admin/addIp?ip=${encodeURIComponent(
          String(req.connection.remoteAddress),
        )}&u=${encodeURIComponent(res.locals.foundUserData.username)}`,
      )
        .then(() => {
          res.status(200).send({
            message: 'VERIFICATION EMAIL SENT' + req.connection.remoteAddress,
          });
        })
        .catch(err => {
          res
            .status(400)
            .send({error: 'ERROR TRYING TO SEND EMAIL VERIFICATION'});
        });
    }
  },
  (req, res) => {
    if (res.locals.foundUserData.password === res.locals.userData.password) {
      res
        .status(200)
        .send({message: 'USER AUNTENTICATED', userData: res.locals.userData});
    } else {
      res.status(400).send({error: 'WRONG PASSWORD'});
    }
  },
);

export let addAdminIpRoute: Router = express.Router();

addAdminIpRoute.get('/admin/addIp', (req, res) => {
  addAdminIp(
    decodeURIComponent(String(url.parse(req.url, true).query.u)),
    decodeURIComponent(String(url.parse(req.url, true).query.ip)),
    (r: any) => {
      if (r.error !== undefined) {
        console.error('ERROR TRYING TO ADD ADMIN IP', r);
        res.status(500).send({error: 'ERROR TRYING TO ADD ADMIN IP'});
      } else {
        console.log("IP ADDED!")
        res.redirect(defaultServerUrl)
      }
    },
  );
});

export let userResetPasswordRequest: Router = express.Router();

userResetPasswordRequest.post('/resetPassword', (req, res) => {
  if (req.body.userData == null) {
    res.status(400).send({error: 'NO USER DATA FOUND'});
  } else {
    if (req.body.userData.email == null) {
      res.status(400).send({error: 'NO USER EMAIL PROVIDED'});
    } else {
      doesEmailExist(req.body.userData.email).then(e => {
        if (e == null) {
          res.status(400).send({error: "EMAIL DOESN'T EXIST"});
        } else {
          let code: string = '';
          for (let i = 0; i < 4; i++) {
            let number = Math.abs(Math.round(Math.random() * (0 - 9)));
            code = code + String(number);
          }
          console.log(code);
          modifyUser(e, {passworResetCode: code})
            .then(() => {
              sendEmail(
                req.body.userData.email,
                'PASSWORD RESET - HEAVENYA',
                `HERE'S YOUR PASSWORD RESET CODE: ${code}`,
              )
                .then(() => {
                  res.send({message: 'PASSWORD RESET CODE SENT'});
                })
                .catch(err => {
                  console.error('ERROR SENDING THE EMAIL: ', err);
                  res.status(500).send({error: 'ERROR SENDING THE EMAIL'});
                });
            })
            .catch(err => {
              console.error('ERROR SENDING MODIFYING USER: ', err);
              res.status(500).send({error: 'ERROR MODIFYING USER'});
            });
        }
      });
    }
  }
});

export let resetPassword: Router = express.Router();

resetPassword.post('/updatePassword', (req, res) => {
  if (req.body.userData == null) {
    res.status(400).send({error: 'NO USER DATA FOUND'});
  } else {
    if (req.body.userData.email == null) {
      res.status(400).send({error: 'NO USER EMAIL PROVIDED'});
    } else {
      if (req.body.userData.code == null) {
        res.status(400).send({error: 'NO CODE PROVIDED'});
      } else {
        if (req.body.userData.password == null) {
          res.status(400).send({error: 'NO PASSWORD PROVIDED'});
        } else {
          doesEmailExist(req.body.userData.email).then(e => {
            if (e == null) {
              res.status(400).send({error: "EMAIL DOESN'T EXIST"});
            } else {
              if (req.body.userData.code === e.passworResetCode) {
                modifyUser(e, {
                  password: req.body.userData.password,
                  passworResetCode: '',
                })
                  .then(() => {
                    sendEmail(
                      req.body.userData.email,
                      'PASSWORD RESET - HEAVENYA',
                      `YOUR PASSWORD HAVE BEEN RESET`,
                    )
                      .then(() => {
                        res.send({message: 'PASSWORD RESET'});
                      })
                      .catch(err => {
                        console.error('ERROR SENDING THE EMAIL: ', err);
                        res
                          .status(500)
                          .send({error: 'ERROR SENDING THE EMAIL'});
                      });
                  })
                  .catch(err => {
                    console.error('ERROR SENDING MODIFYING USER: ', err);
                    res
                      .status(500)
                      .send({error: 'ERROR SENDING MODIFYING USER'});
                  });
              } else {
                res.status(400).send({error: "CODE DOESN'T MATCH"});
              }
            }
          });
        }
      }
    }
  }
});

export let verifyResetCode: Router = express.Router();

verifyResetCode.post('/verifyResetCode', (req, res) => {
  let userData = req.body.userData;

  if (userData == null || userData.code == null || userData.username == null) {
    res.status(400).send({error: 'SOME USERDATA IS MISSING'});
  } else {
    doesUserExistReturn(userData.username).then(u => {
      if (u == null) {
        doesEmailExist(userData.username).then(resE => {
          if (resE == null) {
            res.status(400).send({
              error: 'USERNAME NOT FOUND',
            });
          } else {
            if (resE.passworResetCode == undefined || resE.passworResetCode == null) {
              res.status(400).send({
                error:
                  'THE PASSWORD VERIFICATION CODE HAVE NOT BEEN CREATED YET',
              });
            } else {
              if (resE.passworResetCode == userData.code) {
                res.send();
              } else {
                res.status(400).send({error: 'VERIFICATION CODE INCORRECT'});
              }
            }
          }
        });
      } else {
        if (u.passworResetCode == undefined || u.passworResetCode == null) {
          res.status(400).send({
            error: 'THE PASSWORD VERIFICATION CODE HAVE NOT BEEN CREATED YET',
          });
        } else {
          if (u.passworResetCode == userData.code) {
            res.send();
          } else {
            res.status(400).send({error: 'VERIFICATION CODE INCORRECT'});
          }
        }
      }
    });
  }
});
