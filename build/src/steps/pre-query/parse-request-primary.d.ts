/// <reference types="q" />
import Q = require("q");
import Resource from "../../types/Resource";
import Linkage from "../../types/Linkage";
import Collection from "../../types/Collection";
export default function (data: any, parseAsLinkage?: boolean): Q.Promise<Linkage | Resource | Collection>;
