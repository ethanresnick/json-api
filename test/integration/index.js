process.env.TESTING = true;

import Q from "q";
Q.longStackSupport = true;

import {expect} from 'chai';
import Agent from '../app/agent';
import Db from '../app/database';
/*
beforeEach((done) => {
  Db.then((module) => {
    module.fixturesReset().then((data) => {
      done();
    }).done();
  });
});*/
