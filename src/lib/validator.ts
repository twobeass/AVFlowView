import Ajv from 'ajv/dist/2020';
import schema from '../schemas/av-wiring-graph.schema.json';

const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(schema);

export function validateGraph(data) {
  const valid = validate(data);
  if (!valid) {
    return {
      valid: false,
      errors: validate.errors?.map(err => ({
        path: err.instancePath,
        message: err.message
      }))
    };
  }
  return { valid: true };
}
