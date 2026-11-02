// Recipe catalog (assets/recipes/*.json) and validation of scene content against its limits.
import {readFileSync, readdirSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'assets', 'recipes');

export function loadRecipes() {
  return readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .sort()
    .map(f => JSON.parse(readFileSync(join(dir, f), 'utf8')));
}

function checkField(name, rule, value, errors) {
  if (value === undefined || value === null) {
    if (rule.required) errors.push(`${name} is required`);
    return;
  }
  const text = (v, label) => {
    if (typeof v !== 'string') errors.push(`${label} must be text`);
    else if (rule.maxChars && v.length > rule.maxChars) errors.push(`${label} has ${v.length} characters (max ${rule.maxChars})`);
  };
  const count = v => {
    if (rule.minItems && v.length < rule.minItems) errors.push(`${name} needs at least ${rule.minItems} items`);
    if (rule.maxItems && v.length > rule.maxItems) errors.push(`${name} has ${v.length} items (max ${rule.maxItems})`);
  };
  if (rule.type === 'string') text(value, name);
  else if (rule.type === 'number') {
    if (typeof value !== 'number') errors.push(`${name} must be a number`);
  } else if (rule.type === 'enum') {
    if (!rule.values.includes(value)) errors.push(`${name} must be one of: ${rule.values.join(', ')}`);
  } else if (rule.type === 'array') {
    if (!Array.isArray(value)) return errors.push(`${name} must be a list`);
    count(value);
    value.forEach((v, i) => text(v, `${name}[${i}]`));
  } else if (rule.type === 'object') {
    checkProps(rule.props, value, `${name}.`, errors);
  } else if (rule.type === 'objects') {
    if (!Array.isArray(value)) return errors.push(`${name} must be a list`);
    count(value);
    value.forEach((v, i) => checkProps(rule.props, v, `${name}[${i}].`, errors));
  }
}

function checkProps(rules, values, prefix, errors) {
  if (typeof values !== 'object' || values === null || Array.isArray(values)) return errors.push(`${prefix || 'props'} must be an object`);
  for (const [name, rule] of Object.entries(rules)) checkField(prefix + name, rule, values[name], errors);
  for (const name of Object.keys(values)) if (!rules[name]) errors.push(`${prefix}${name} is not a known property`);
}

/** List of problems with the content of a scene that uses this recipe; empty when it is valid. */
export function validateProps(recipe, props) {
  const errors = [];
  checkProps(recipe.props, props, '', errors);
  return errors;
}
