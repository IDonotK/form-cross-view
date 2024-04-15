import Schema, {
  RuleItem, Rules, ValidateError
} from 'async-validator';
import { clone } from 'lodash-es';

export interface Descriptor extends RuleItem {
  fields?: Record<string, Descriptor | Descriptor[]>;
  defaultField?: Descriptor;
  editable?: boolean;
  comment?: string | Function;
  defaultValue?: any;
  unit?: string;
  name?: string;
  extendRules?: Array<Function>;
}

export interface DescriptorCompiled {
  descriptor?: Descriptor;
  fieldName?: string;
  type?: string;
  path?: string;
  comment?: string;
  owner?: DescriptorCompiled;
  isArrayItem?: boolean;
  order?: number;
  defaultValue?: any;
  fields?: Record<string, DescriptorCompiled>
}

export type FieldValidateError = ValidateError

export type SettingsValue = { [k: string]: any };

export type SettingsError = {
  type: 'compiletime' | 'runtime' | 'validate' | 'business';
  data: any;
}

Schema.register('positiveInteger', (rule: any, value: any) => {
  const pass = Number.isInteger(value) && value > 0;

  if (typeof rule.max === 'number' && typeof rule.min === 'number') {
    return pass && (
      (value <= rule.max && value >= rule.min) ||
      new Error(`${rule.fullField} 需要在 ${rule.min} 到 ${rule.max} 之间`)
    );
  }
  return pass || new Error(`${rule.fullField} is not a positive integer`);
});

const defaultMessages: { [k: string]: any } = {
  number: (fieldName: string, descriptor: Descriptor) => {
    const {
      min, max, unit = '', name,
    } = descriptor;
    if (fieldName !== 'root' && typeof min === 'number' && typeof max === 'number') {
      return `${name || `${fieldName} `}需要在 ${min} 到 ${max}${unit} 之间`;
    }
  },
  boolean: (fieldName: string, descriptor: Descriptor) => {
    const {
      name,
    } = descriptor;
    return `${name || `${fieldName} `}需要是 true 或 false`;
  },
  integer: (fieldName: string, descriptor: Descriptor) => {
    const {
      min, max, unit = '', name,
    } = descriptor;
    if (fieldName !== 'root' && typeof min === 'number' && typeof max === 'number') {
      return `${name || `${fieldName} `}需要是（${min} 到 ${max}${unit} 之间的整数）`;
    }
  },
  positiveInteger: (fieldName: string, descriptor: Descriptor) => {
    const {
      min, max, unit = '', name,
    } = descriptor;
    if (fieldName !== 'root' && typeof min === 'number' && typeof max === 'number') {
      return `${name || `${fieldName} `}需要是（${min} 到 ${max}${unit} 之间的正整数）`;
    }
  }
}

const defaultComments: { [k: string]: any } = {
  number: (fieldName: string, descriptor: Descriptor) => {
    const {
      min, max, unit = '', name,
    } = descriptor;
    if (fieldName !== 'root' && typeof min === 'number' && typeof max === 'number') {
      return `${name || `${fieldName} `}的大小(${min} 到 ${max}${unit})`;
    }
  },
  boolean: (fieldName: string, descriptor: Descriptor) => {
    const {
      name,
    } = descriptor;
    return `${name || `${fieldName}（true 或 false） `}`;
  },
  integer: (fieldName: string, descriptor: Descriptor) => {
    const {
      min, max, unit = '', name,
    } = descriptor;
    if (fieldName !== 'root' && typeof min === 'number' && typeof max === 'number') {
      return `${name || `${fieldName} `}的大小（${min} 到 ${max}${unit}的整数）`;
    }
  },
  positiveInteger: (fieldName: string, descriptor: Descriptor) => {
    const {
      min, max, unit = '', name,
    } = descriptor;
    if (fieldName !== 'root' && typeof min === 'number' && typeof max === 'number') {
      return `${name || `${fieldName} `}的大小（${min} 到 ${max}${unit}的正整数）`;
    }
  }
}

const defaultValues: { [k: string]: any } = {
  array: () => [],
  object: () => ({}),
  string: '',
  number: 0,
  integer: 0,
  float: 0.0,
  boolean: false,
  method: () => (function () { }),
  enum: () => [],
  regexp: '',
  date: () => new Date(),
  url: '',
  // hex: 0x00,
  email: 'play@pjlab.org.cn',
  // any: '',
}

const editableDefault = false;

function getDefaultMessage(fieldName: string, descriptor: Descriptor) {
  // descriptor: readonly!
  const { type } = descriptor;
  const value = type && defaultMessages[type];
  return typeof value === 'function' ? value(fieldName, descriptor) : value;
}

function getDefaultComment(fieldName: string, descriptor: Descriptor) {
  // descriptor: readonly!
  const { type } = descriptor;
  const value = type && defaultComments[type];
  return typeof value === 'function' ? value(fieldName, descriptor) : value;
}

function getDefaultValue(type: string) {
  const value = defaultValues[type];
  return typeof value === 'function' ? value() : value;
}

function validateDescriptor(descriptor: Descriptor | Descriptor[] | null) {
  // TODO:
}

/**
 * rules:
 * 1.no len
 *  defaultField
 *    fields => error
 *    no fields => skip
 *  no defaultField
 *    fields
 *      defaultValue => defaultValue.len === fields.len
 *      no defaultValue => skip
 *    no fields => error
 * 2.len
 *  defaultField
 *    fields => error
 *    no fields
 *      defaultValue => defaultValue.len === len
 *      no defaultValue => skip
 *  no defaultField
 *    fields => fields.len === len
 *      defaultValue => defaultValue.len === len
 *      no defaultValue => skip
 *    no fields => error
 *
 * @param descriptor
 * @param fieldName
 */
function validateArrayDescriptor(descriptor: Descriptor, fieldName: string) {
  const throwError = (detail: string) => { throw Error(`${fieldName}: ${detail}`); }

  const {
    type, len, defaultField, fields, defaultValue
  } = descriptor;

  if (type !== 'array') {
    throwError('Array descriptor must describe array.');
  }
  if ((defaultField && fields) || (!defaultField && !fields)) {
    throwError("Array descriptor must choose between 'defaultField' and 'fields'.");
  }
  if (defaultField && typeof defaultField !== 'object') {
    throwError("'defaultField' must be an object.");
  }
  if (fields && typeof fields !== 'object') {
    throwError("'fields' must be an object.");
  }
  if (defaultValue !== undefined && !Array.isArray(defaultValue)) {
    throwError("'defaultValue' must be 'array' in type.");
  }
  if (len !== undefined &&
    (typeof len !== 'number' || (typeof len === 'number' && (len < 0 || len % 1 !== 0)))
  ) {
    throwError("'len' must be a positive integer.");
  }

  if (len === undefined) {
    if (fields) {
      if (defaultValue && defaultValue.length !== Object.keys(fields).length) {
        throwError("Length of 'defaultValue' must equal length of 'fields'.");
      }
    }
  } else {
    if (fields) {
      if (Object.keys(fields).length !== len) {
        throwError(`'fields' must be ${len} in length.`);
      }
    }
    if (defaultValue && defaultValue.length !== len) {
      throwError(`'defaultValue' must be ${len} in length.`);
    }
  }
}

function defaultFieldToFields(
  descriptor: Descriptor, fieldName: string, lenSpecified?: number
): Descriptor {
  // descriptor: readonly!
  validateArrayDescriptor(descriptor, fieldName);
  const { type, defaultField } = descriptor;
  if (type === 'array' && defaultField) {
    const target: Descriptor = {};
    Object.keys(descriptor).forEach(k => {
      if (!['defaultField'].includes(k)) {
        target[k as keyof Descriptor] = (descriptor as Descriptor)[k as keyof Descriptor];
      }
    });
    const { len, defaultValue } = descriptor;
    const lenTarget = len ?? (
      lenSpecified ?? (defaultValue ?? (getDefaultValue(type) || [])).length
    );
    const fieldsSub: Record<string, Descriptor> = {};
    for (let i = 0; i < lenTarget; i++) {
      fieldsSub[i] = clone(defaultField);
    }
    target.fields = fieldsSub;
    return target;
  } else {
    return descriptor;
  }
}

async function validateField(fieldName: string, value: any, descriptor: Descriptor) {
  descriptor = standardizeDescriptorComplete(
    fieldName,
    descriptor,
    value,
    (_descriptor: Descriptor) => {
      const { editable = editableDefault } = _descriptor;
      return !editable;
    }
  ) as Descriptor;

  const descriptorFinal: Rules = {
    [fieldName]: descriptor,
  };
  const dataFinal = {
    [fieldName]: value,
  };

  const validator = new Schema(descriptorFinal);
  const res = await validator.validate(dataFinal).catch(({ errors, fields }) => {
    return { __errors__: errors, __fields__: fields };
  });
  const { __errors__ } = res;
  if (__errors__ && __errors__.length > 0) {
    const error: SettingsError = {
      type: 'validate',
      data: __errors__,
    }
    return error;
  }
  return null;
}

function isCommonObject(obj: Object) {
  return Object.prototype.toString.call(obj) === '[object Object]';
}

function isAsyncFunction(fn: Function) {
  return Object.prototype.toString.call(fn) === '[object AsyncFunction]';
}

function convertToMultiRules(descriptor: Descriptor): Descriptor | Descriptor[] {
  const { extendRules } = descriptor;
  if (!extendRules) {
    return descriptor;
  }
  if (!Array.isArray(extendRules)) {
    throw Error("'extendRules' must be array in type.");
  }
  if (!extendRules.length) {
    return descriptor;
  }

  const ruleBase = clone(descriptor);
  delete ruleBase.extendRules;
  return [
    ruleBase,
    ...extendRules.map(r => {
      if (!r || (!isCommonObject(r) && typeof r !== 'function')) {
        throw Error('Extend rule must be object or function in type.');
      }
      return typeof r === 'function' ? (isAsyncFunction(r) ? ({
        asyncValidator(...args: any[]) {
          return r(...args);
        }
      }) : ({
        validator(...args: any[]) {
          return r(...args);
        }
      })) : r;
    })
  ];
}

function standardizeDescriptorComplete(
  fieldName: string,
  descriptor: Descriptor,
  data: SettingsValue,
  ignore?: Function
): Descriptor | Descriptor[] | null {
  const excludes = [
    'editable', 'comment', 'defaultValue', 'unit', 'name',
  ];

  function walkDescriptor(
    _descriptor: Descriptor, fieldName: string, _data: SettingsValue
  ): Descriptor | Descriptor[] | null {
    if (ignore && typeof ignore === 'function' && ignore(_descriptor)) {
      return null;
    }

    let target: Descriptor | Descriptor[] = {};

    let { message } = _descriptor;
    if (message == null) {
      message = getDefaultMessage(fieldName, _descriptor);
    } else if (typeof message === 'function') {
      message = (message as Function)(fieldName, _descriptor);
    }
    if (message != null) {
      target.message = message;
    }

    const { type } = _descriptor;
    if (type === 'array') {
      _descriptor = defaultFieldToFields(_descriptor, fieldName, _data && _data.length);
    }

    Object.keys(_descriptor).forEach(k => {
      if (!excludes.includes(k) && k !== 'message') {
        const v = _descriptor[k as keyof Descriptor];
        if (k === 'fields') {
          const fieldsSub: Record<string, Descriptor | Descriptor[]> = {};
          Object.keys(v).forEach(ks => {
            const vs = v[ks];
            const ts = walkDescriptor(vs, ks, _data && _data[ks]);
            validateDescriptor(ts);
            if (ts) {
              fieldsSub[ks] = ts;
            }
          });
          (target as Descriptor)[k] = fieldsSub;
        } else {
          // if (typeof v === 'object') {
          //   // such as 'options'
          //   target[k] = cloneDeep(v);
          // } else {
          //   target[k] = v;
          // }
          (target as Descriptor)[k as keyof Descriptor] = v; // origin descriptor: readonly!
        }
      }
    });

    if (target.extendRules) {
      target = convertToMultiRules(target);
    }

    return target;
  }

  const target = walkDescriptor(descriptor, fieldName, data);

  // console.log('standardizeDescriptorComplete', target);

  return target;
}

function compileDescriptor(
  descriptor: Descriptor,
  fieldName: string,
  owner?: DescriptorCompiled,
): DescriptorCompiled | undefined {
  const { type, editable = editableDefault, name } = descriptor;

  if (!editable) {
    return;
  }

  fieldName = name ?? fieldName;

  const descriptorOrigin = descriptor; // cloneDeep?

  let { comment, defaultValue } = descriptor;

  if (comment == null) {
    comment = getDefaultComment(fieldName, descriptor);
  } else if (typeof comment === 'function') {
    comment = comment(fieldName, descriptor);
  }

  if (type === 'array') {
    descriptor = defaultFieldToFields(descriptor, fieldName);
  }

  const descriptorCompiled: DescriptorCompiled = {
    descriptor: descriptorOrigin,
    fieldName,
    type,
    path: `${(owner && owner.path) ? `${owner && owner.path}.` : ''}${fieldName}`,
    comment: (comment && parseComment(comment as string, fieldName)) || '',
    owner,
    isArrayItem: !!(owner && owner.type === 'array'),
    order: 0,
  };

  if (['object', 'array'].includes(type as string)) {
    if (defaultValue === undefined) {
      descriptorCompiled.defaultValue = type === 'object' ? {} : [];
    } else {
      descriptorCompiled.defaultValue = defaultValue;
    }

    descriptorCompiled.fields = {};
    const { fields = {} } = descriptor;
    Object.keys(fields).forEach((f, i) => {
      const descriptorChild = compileDescriptor(
        fields[f] as Descriptor, f, descriptorCompiled
      );
      if (descriptorChild) {
        descriptorChild.order = i;
        descriptorCompiled.fields![f] = descriptorChild;
        descriptorCompiled.defaultValue[f] = descriptorChild.defaultValue;
      }
    });
  } else {
    if (defaultValue === undefined) {
      defaultValue = getDefaultValue(type as string);
    }
    descriptorCompiled.defaultValue = defaultValue;
  }

  return descriptorCompiled;
}

function parseComment(raw: string, fieldName: string): string {
  let c = '';
  if (raw.includes('\n') || fieldName === 'root') {
    const lines = raw.split('\n');
    c += `/**\n * ${lines.join('\n * ')}\n */`;
  } else {
    c += `// ${raw}`;
  }
  return c;
}

export {
  compileDescriptor,
  validateField,
}
