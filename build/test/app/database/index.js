"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const fixtures = require("node-mongoose-fixtures");
const person_1 = require("./models/person");
const school_1 = require("./models/school");
const organization_1 = require("./models/organization");
const ObjectId = mongoose.Types.ObjectId;
const govtId = ObjectId("54419d550a5069a2129ef254");
const smithId = ObjectId("53f54dd98d1e62ff12539db2");
const doeId = ObjectId("53f54dd98d1e62ff12539db3");
const echoOrgId = ObjectId("59ac9c0ecc4c356fcda65202");
const genderPersonId = ObjectId("59af14d3bbd18cd55ea08ea1");
const invisibleResourceId = ObjectId("59af14d3bbd18cd55ea08ea2");
const elementaryId = ObjectId("59af14d3bbd18cd55ea08ea3");
const OrganizationModel = organization_1.default.model;
const OrganizationSchema = organization_1.default.schema;
const models = {
    Person: person_1.default,
    Organization: OrganizationModel,
    School: school_1.default(OrganizationModel, OrganizationSchema)
};
fixtures.save("all", {
    Person: [
        { name: "John Smith", email: "jsmith@gmail.com", gender: "male", _id: smithId },
        { name: "Jane Doe", gender: "female", _id: doeId },
        { name: "Doug Wilson", gender: "male" },
        { name: "Jordi Jones", _id: genderPersonId, gender: "other" },
        { name: "An Inivisible Sorcerer", gender: "other", _id: invisibleResourceId },
    ],
    Organization: [
        { name: "State Government", description: "Representing the good people.", liaisons: [doeId, smithId], _id: govtId },
        { name: "Org whose echo prop I'll change", reversed: "Test", _id: echoOrgId, liaisons: [doeId], modified: new Date("2015-01-01") }
    ],
    School: [
        { name: "City College", description: "Just your average local college.", liaisons: [smithId] },
        { name: "State College", description: "Just your average state college." },
        { name: "Elementary School", description: "For the youngins.", principal: invisibleResourceId, _id: elementaryId }
    ]
});
exports.default = mongoose.connect("mongodb://localhost/integration-test", { useMongoClient: true }).then(function () {
    function fixturesRemoveAll() {
        return new Promise((resolve, reject) => {
            fixtures.reset((err, res) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(res);
                }
            });
        });
    }
    return {
        models() {
            return models;
        },
        instance() {
            return mongoose;
        },
        fixturesRemoveAll,
        fixturesReset() {
            return fixturesRemoveAll().then(function () {
                return new Promise((resolve, reject) => {
                    fixtures("all", (err, res) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(res);
                        }
                    });
                });
            });
        }
    };
});
