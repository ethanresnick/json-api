import Linkage, { LinkageJSON } from './Linkage';
import Resource from './Resource';
import Collection from './Collection';
import APIError from "./APIError";
export declare type PrimaryData = Resource | Collection | null | Linkage;
export declare type PrimaryDataJSON = Resource | Collection | null | LinkageJSON;
export declare type PrimaryDataOrErrors = PrimaryData | APIError[];
