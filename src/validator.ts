/* eslint-disable @typescript-eslint/no-implied-eval */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable func-names */
import { JSHINT } from 'jshint';
import Schema, { RuleType, RuleItem, Rules } from 'async-validator';
import { clone, cloneDeep } from 'lodash';
import * as prettier from 'prettier/standalone';
import prettierPluginBabel from 'prettier/plugins/babel';
import prettierPluginEstree from 'prettier/plugins/estree';

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

export type SettingsValue = { [k: string]: any };

export type SettingsError = {
  type: 'compiletime' | 'runtime' | 'validate' | 'business';
  data: any;
};

export type EditorLog = {
  type: 'error' | 'warn' | 'debug' | 'info';
  message: string;
};

Schema.register('positiveInteger', (rule: any, value: any) => {
  const pass = Number.isInteger(value) && value > 0;

  if (typeof rule.max === 'number' && typeof rule.min === 'number') {
    return pass && ((value <= rule.max && value >= rule.min) || new Error(`${rule.fullField} 需要在 ${rule.min} 到 ${rule.max} 之间`))
  }
  return pass || new Error(`${rule.fullField} is not a positive integer.`);
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

function validateRootDescriptor(descriptor: Descriptor) {
  validateDescriptor(descriptor);
  if (!descriptor.fields) {
    throw Error('Root descriptor must describe an object.');
  }
}

function validateDescriptor(descriptor: Descriptor | Descriptor[] | null) {
  // @todo
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
function validateArrayDescriptor(descriptor: Descriptor, fieldName: string) { // @todo: test?
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

/**
 * resolve default values
 * @param descriptor a descriptor
 * @returns a settings value
 */
function getSettingsDefault(descriptor: Descriptor): SettingsValue {
  function walkDescriptor(_descriptor: Descriptor, fieldName: string): SettingsValue | undefined {
    validateDescriptor(_descriptor);

    let data: SettingsValue | undefined;

    const { type } = _descriptor;
    if (type === 'array') {
      _descriptor = defaultFieldToFields(_descriptor, fieldName);
    }
    const { defaultValue } = _descriptor;
    if (defaultValue === undefined) {
      const { fields } = _descriptor;
      if (fields) {
        if (type === 'object') {
          data = {};
        } else if (type === 'array') {
          data = [];
        }
        if (data) {
          Object.keys(fields).forEach(f => {
            const t = walkDescriptor(fields[f], f);
            if (t !== undefined) {
              (data as SettingsValue)[f] = t;
            }
          });
        }
      } else {
        data = type && getDefaultValue(type);
      }
    } else {
      // if (['method'].includes(type)) {
      //   data = defaultValue;
      // } else {
      //   data = cloneDeep(defaultValue);
      // }
      data = defaultValue; // cloneDeep(model) already in createEntity
    }

    return data;
  }
  const settingsDefault = walkDescriptor(descriptor, 'root') || {};
  return settingsDefault;
}

/**
 * validate settings
 * @param descriptor a descriptor
 * @param data a settings value
 * @param mode validate mode
 * @returns a settings error
 */
async function validateSettings(
  descriptor: Descriptor,
  data: SettingsValue,
  mode: 'partital' | 'complete' | 'editable' = 'complete'
): Promise<SettingsError | null> {
  if (!isCommonObject(data)) {
    throw Error('Settings must be a common object.');
  }

  validateRootDescriptor(descriptor);

  switch (mode) {
    case 'complete': {
      descriptor = standardizeDescriptorComplete('settings', descriptor, data) as Descriptor;
      break;
    }
    case 'partital': {
      descriptor = standardizeDescriptorPartital(descriptor, data) as Descriptor;
      break;
    }
    case 'editable': {
      descriptor = standardizeDescriptorComplete(
        'settings',
        descriptor,
        data,
        (_descriptor: Descriptor) => {
          const { editable = editableDefault } = _descriptor;
          return !editable;
        }
      ) as Descriptor;
      break;
    }
    default:
  }

  validateRootDescriptor(descriptor);

  const descriptorFinal: Rules = {
    settings: {
      ...descriptor,
      type: 'object',
      required: true,
    },
  };
  const dataFinal = {
    settings: data,
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

function standardizeDescriptorPartital(
  descriptor: Descriptor, data: SettingsValue
): Descriptor | Descriptor[] {
  const excludes = [
    'editable', 'comment', 'defaultValue', 'unit', 'name',
  ];

  function walkData(
    _data: SettingsValue, _descriptor: Descriptor, fieldName: string
  ): Descriptor | Descriptor[] {
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
      if (!excludes.includes(k) && k !== 'fields' && k !== 'message') {
        const v = _descriptor[k as keyof Descriptor];
        // if (typeof v === 'object') {
        //   // such as 'options'
        //   target[k] = cloneDeep(v);
        // } else {
        //   target[k] = v;
        // }
        (target as Descriptor)[k as keyof Descriptor] = v; // origin descriptor: readonly!
      }
    });

    const { fields } = _descriptor;
    if (fields) {
      const fieldsSub: Record<string, Descriptor | Descriptor[]> = {};
      Object.keys(_data).forEach(k => {
        const desc = fields[k];
        if (desc !== undefined) {
          fieldsSub[k] = walkData(_data[k], desc as Descriptor, k);
        } else {
          // error?
        }
      });
      target.fields = fieldsSub;
    }

    if (target.extendRules) {
      target = convertToMultiRules(target);
    }

    return target;
  }

  const target = walkData(data, descriptor, 'root');

  // console.log('standardizeDescriptorPartital', target);

  return target;
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

/**
 * serialize settings
 * @param descriptor a descriptor
 * @param data a settings value
 * @returns a settings string
 */
async function serializeSettings(descriptor: Descriptor, data: SettingsValue): Promise<string> {
  const settingsTarget = compileSettingsWithDescriptor('root', data, descriptor, null);
  // console.log('settingsTarget', settingsTarget, data);
  if (!settingsTarget) {
    return '';
  }

  // hack for prettier
  const commentRoot = settingsTarget.__comment__;
  settingsTarget.__comment__ = '';

  let settingsString = '';
  settingsString = stringifySettings({
    data: settingsTarget,
  });
  // console.log('settingsString', settingsString);

  let settingsFormated = await prettier.format(`const settings = ${settingsString}`, {
    parser: 'babel',
    plugins: [prettierPluginBabel, prettierPluginEstree],
  });
  // settingsFormated = settingsFormated.replace(
  //   /^(const settings = )([\s\S]*)$/,
  //   (m, p1, p2) => {
  //     return `${p2.slice(0, -2)}\n`;
  //   }
  // );
  if (commentRoot) {
    settingsFormated = `${commentRoot}\n${settingsFormated}`;
  }
  // console.log('settingsFormated', settingsFormated);

  // for displaying error
  settingsFormated += new Array(5).fill('\n').join('');

  return settingsFormated;
}

function compileSettingsWithDescriptor(
  fieldName: string,
  data: SettingsValue,
  descriptor: Descriptor,
  owner: { descriptor: Descriptor, value: any } | null,
  cb?: (valueCompiled: { [k: string]: any }) => void
): SettingsValue | undefined {
  // @todo: should walk data?

  validateDescriptor(descriptor);

  const { type, editable = editableDefault } = descriptor;

  if (!editable) {
    return;
  }

  let { defaultValue } = descriptor;
  if (defaultValue === undefined) {
    defaultValue = getDefaultValue(type as string);
  }
  if (data === undefined && defaultValue === undefined) {
    return;
  }

  let target: SettingsValue | undefined;

  if (type === 'array') {
    descriptor = defaultFieldToFields(descriptor, fieldName, data && data.length);
  }

  if (['object', 'array'].includes(type as string)) {
    // target = type === 'object' ? {} : [];
    target = {};
    const { fields } = descriptor;
    if (fields) {
      Object.keys(fields).forEach(f => {
        const targetSub = compileSettingsWithDescriptor(
          f, data && data[f], fields[f], { descriptor, value: data }, cb
        );
        if (targetSub !== undefined) {
          (target as SettingsValue)[f] = targetSub;
        }
      });
    }
  } else {
    target = data ?? defaultValue; // cloneDeep(model) already in createEntity
  }

  let { comment } = descriptor;
  if (comment == null) {
    comment = getDefaultComment(fieldName, descriptor);
  } else if (typeof comment === 'function') {
    comment = comment(fieldName, descriptor);
  }

  if (target !== undefined) {
    target = {
      __fieldName__: fieldName,
      __descriptor__: descriptor,
      __comment__: (comment && parseComment(comment as string, fieldName)) || '',
      __type__: type,
      __value__: target,
      __isArrayItem__: !!(owner?.descriptor?.type === 'array')
    }
    if (typeof cb === 'function') {
      cb(target);
    }
  }

  return target;
}

export type DescriptorCompiled = { [k: string]: any }

function compileDescriptor(
  descriptor: Descriptor,
  fieldName: string,
  owner: DescriptorCompiled | null,
  cb?: Function
): DescriptorCompiled | undefined {
  const { type, editable = editableDefault } = descriptor;

  if (!editable) {
    return;
  }

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
    comment,
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
        fields[f] as Descriptor, f, descriptorCompiled, cb
      );
      if (descriptorChild) {
        descriptorChild.order = i;
        descriptorCompiled.fields[f] = descriptorChild;
        descriptorCompiled.defaultValue[f] = descriptorChild.defaultValue;
      }
    });
  } else {
    if (defaultValue === undefined) {
      defaultValue = getDefaultValue(type as string);
    }
    descriptorCompiled.defaultValue = defaultValue;
  }

  if (typeof cb === 'function') {
    try {
      cb(descriptorCompiled);
    } catch (e) {
      console.log(e);
    }
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

function reviseComment(comment: string, isFirstField: boolean = false): string {
  if (comment) {
    comment = `\n${isFirstField ? '' : '\n'}${comment}\n`;
  }
  return comment;
}

function reviseFieldName(
  name: string, isArrayItem: boolean = false
): string {
  return `${(name === 'root' || isArrayItem) ? '' : `${name}:`}`;
}

function stringifySettings({
  data,
  fieldName = 'root',
  isArrayItem = false,
  isFirstField = false,
}: {
  data: SettingsValue;
  fieldName?: string;
  isArrayItem?: boolean;
  isFirstField?: boolean;
}): string {
  let ret = '';

  const { __comment__: comment, __value__: value, __type__: type } = data;

  ret += reviseComment(comment, isFirstField || fieldName === 'root');

  if (['object', 'array'].includes(type)) {
    const wrapStart = type === 'object' ? '{\n' : '[';
    const wrapEnd = type === 'object' ? '}' : ']';
    const isArrayItemSub = type === 'object' ? false : true;
    ret += `${reviseFieldName(fieldName, isArrayItem)}${wrapStart}`;
    const keys = Object.keys(value);
    const ksl = keys.length;
    keys.forEach((k: string, i: number) => {
      const stringSub = stringifySettings({
        data: value[k],
        fieldName: k,
        isArrayItem: isArrayItemSub,
        isFirstField: i === 0,
      });
      ret += `${stringSub}${i < ksl - 1 ? ',' : ''}`;
    });
    ret += wrapEnd;
  } else {
    let vt = value;
    switch (type) {
      case 'string': {
        vt = `"${vt}"`;
        break;
      }
      default:
    }
    ret += `${reviseFieldName(fieldName, isArrayItem)}${vt}`;
  }

  return ret;
}

function getSettingsEditable(rootDescriptor: Descriptor): boolean {
  const { editable, fields } = rootDescriptor;
  if (typeof editable === 'boolean') {
    return editable;
  }
  if (fields) {
    return Object.keys(fields).some(k => {
      const desc = fields[k];
      const { editable: _editable = editableDefault } = desc;
      return _editable;
    });
  }
  return editableDefault;
}

/**
 * parse code string from editor
 * @param source a source code string
 * @returns an object contains settings value and settings error
 */
function parseCodeString(source: string): {
  value: SettingsValue | null,
  error: SettingsError | null
} {
  let value: SettingsValue | null = null;
  let error: SettingsError | null = null;

  const code = `${source}return settings;`;
  const errors = staticCheck(`function f(){${code}}`);
  if (errors.length) {
    error = {
      type: 'compiletime',
      data: errors,
    };
  } else {
    try {
      value = Function(code)();
    } catch (e) {
      console.log('runtime error', e);
      error = {
        type: 'runtime',
        data: e,
      };
    }
  }

  return {
    value,
    error,
  }
}

function staticCheck(source: string): [JSHINT.error] {
  let errors = [];
  try {
    const options = {
      esversion: 6,
      // undef: true,
    };
    const predef = {};
    JSHINT(source, options, predef);
    errors = JSHINT.errors.slice(0);
    // console.log('compiletime error', errors);
  } catch (e) {
    console.log(e);
  }
  return errors;
}

const parseJSRuntimeError = (() => {
  const FULL_MATCH = /^\s*at (?:(.*?) ?\()?((?:file|https?|blob|chrome-extension|address|native|eval|webpack|<anonymous>|[-a-z]+:|.*bundle|\/).*?)(?::(\d+))?(?::(\d+))?\)?\s*$/i;
  const STACKTRACE_LIMIT = 10;
  const LINENO_FIX = 3;

  const parseStackLine = (line: string) => {
    const lineMatch = line.match(FULL_MATCH);
    if (!lineMatch) {
      return {};
    }
    const filename = lineMatch[2];
    const functionName = lineMatch[1] || '';
    const lineno = parseInt(lineMatch[3], 10) - LINENO_FIX || undefined;
    const colno = parseInt(lineMatch[4], 10) || undefined;
    return {
      filename,
      functionName,
      lineno,
      colno,
    };
  }

  const parseStackFrames = (error: Error) => {
    if (!error || !error.stack) {
      return [];
    }
    const { stack } = error;
    let frames = [];
    for (const line of stack.split('\n').slice(1)) {
      const frame = parseStackLine(line);
      if (frame) {
        frames.push(frame);
      }
    }

    frames = frames.slice(0, STACKTRACE_LIMIT);
    let lastEvalIndex = -1;
    const len = frames.length;
    for (let i = len - 1; i >= 0; i--) {
      if (frames[i].functionName === 'eval') {
        lastEvalIndex = i;
        break;
      }
    }
    if (lastEvalIndex > -1) {
      frames = frames.slice(0, lastEvalIndex + 1);
    }

    return frames;
  }

  return parseStackFrames;
})();

/**
 * formate settings error to editor log
 * @param error a settings error
 * @returns an editor log
 */
function settingsError2EditorLog(error: SettingsError): EditorLog {
  const log: EditorLog = {
    type: 'error',
    message: 'unknown',
  };

  try {
    const { type, data } = error || {};
    switch (type) {
      case 'compiletime': {
        const temp = data[0] || {};
        log.message = `错误：第${temp.line}行，第${temp.character}列`;
        break;
      }
      case 'runtime': {
        const stacks = parseJSRuntimeError(data); // ErrorStackParser
        const temp = stacks[0] || {};
        log.message = `错误：第${temp.lineno}行，第${temp.colno}列`;
        break;
      }
      case 'validate': {
        if (data && data.length) {
          log.message = data.map(e => e.message).join('; ');
        }
        break;
      }
      case 'business': {
        log.message = data;
        break;
      }
      default:
    }
  } catch (e) {
    console.log(e);
  }

  return log;
}

export {
  getSettingsDefault,
  getSettingsEditable,
  validateSettings,
  validateField,
  serializeSettings,
  compileSettingsWithDescriptor,
  compileDescriptor,
  parseCodeString,
  settingsError2EditorLog,
}
