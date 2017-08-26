import Linkage, { LinkageJSON } from './Linkage';
import Resource from './Resource';
import Collection from './Collection';
import APIError from "./APIError";

export type PrimaryData = Resource | Collection | null | Linkage;
export type PrimaryDataJSON = Resource | Collection | null | LinkageJSON;

export type PrimaryDataOrErrors = PrimaryData | APIError[];

export type Sort = {field: string; direction: 'ASC' | 'DESC'};
