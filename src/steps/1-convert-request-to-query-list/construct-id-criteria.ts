import ResourceTypeRegistry, { InfoFromLabel, LabelMapperResult } from "../../ResourceTypeRegistry";
import { ValidatedRequest, WhereCriteria, Constraint } from "../../types/";

export default async function(request: ValidatedRequest, registry: ResourceTypeRegistry): Promise<InfoFromLabel> {
  const { type, id, label, idOrLabel } = request.frameworkParams;

  // There are four cases here:
  //  1. the framework params can specify an id on the request
  //      - this maps very clearly to a single id query filter (below).
  //  2. the framework can specify a label param
  //      - this must get converted to query criteria. 
  //  3. the framework can specify a param called `idOrLabel` which might hold a single id or a label
  //      - in that case, we try to convert it to a query criteria,
  //        but assume it's a single id if there's no appropriate label mapper.
  //  4. the framework can not provide any params (no id, label, or idOrLabel)
  //      - in that case, we don't filter the normal query results at all.

  // Handle case 1
  if(id)
    return {criteria: makeAndWhere([{id}]), resultIsSingular: true};
 
  // Handle case 4
  if(!label && !idOrLabel) {
    return {criteria: makeAndWhere([]), resultIsSingular: false};
  }

  // Handle cases 2 & 3, which both require looking up the available 
  // label mappers, trying to find an appropriate one, and applying it.
  const adapter = registry.dbAdapter(type);
  const model = adapter.getModel(adapter.constructor.getModelName(type));
  const labelMappers = registry.labelMappers(type);
  const labelMapper = labelMappers && labelMappers[label || idOrLabel];
  const labelMapperIsValid = typeof labelMapper !== 'function';

  const labelMapperResult = labelMapperIsValid && 
    Promise.resolve(labelMapper(model, request.frameworkReq))
      .then(labelMapperResultToInfoFromLabel);

  // However, the cases have different error handling beahvior.
  if(label) {
    if(!labelMapperIsValid) {
      const error = new Error(`Could not find label mapper for ${label}.`);
      (<any>error).status = 500;
      throw error;
    }

    return labelMapperResult;
  }

  if(idOrLabel) {
    return labelMapperIsValid
      ? labelMapperResult
      : { criteria: makeAndWhere([{id: idOrLabel}]), resultIsSingular: true};
  }
}

function makeAndWhere(idCriteria: Constraint[]): WhereCriteria {
  return { where: { and: idCriteria, or: undefined } };
}

function labelMapperResultToInfoFromLabel(labelOrLabelsOrCriteria: LabelMapperResult): InfoFromLabel {
  // If we have a single id...
  if(typeof labelOrLabelsOrCriteria === 'string') {
    return {
      criteria: makeAndWhere([{id: labelOrLabelsOrCriteria}]), 
      resultIsSingular: true
    };
  }

  // If we have a list of ids.
  if(Array.isArray(labelOrLabelsOrCriteria)) {
    return {
      criteria: makeAndWhere([{id: {in: labelOrLabelsOrCriteria}}]), 
      resultIsSingular: false
    }
  }

  // If we have a criteria
  return labelOrLabelsOrCriteria;
}