/* @flow */

// A second optional argument can be given to further configure
// the parser process. These options are recognized:
type InputOptions = {
  sourceType?: "script" | "module",
  sourceFilename?: ?string,
  allowReturnOutsideFunction?: boolean,
  allowImportExportEverywhere?: boolean,
  allowSuperOutsideMethod?: boolean,
  plugins?: Array<string>,
  strictMode?: ?boolean,
};

type Options = {
  sourceType: "script" | "module",
  sourceFilename: ?string,
  allowReturnOutsideFunction: boolean,
  allowImportExportEverywhere: boolean,
  allowSuperOutsideMethod: boolean,
  plugins: Array<string>,
  strictMode: ?boolean,
};

export const defaultOptions: Options = {
  // Source type ("script" or "module") for different semantics
  sourceType: "script",
  // Source filename.
  sourceFilename: undefined,
  // When enabled, a return at the top level is not considered an
  // error.
  allowReturnOutsideFunction: false,
  // When enabled, import/export statements are not constrained to
  // appearing at the top of the program.
  allowImportExportEverywhere: false,
  // TODO
  allowSuperOutsideMethod: false,
  // An array of plugins to enable
  plugins: [],
  // TODO
  strictMode: null,
};

// Interpret and default an options object
export function getOptions(options?: InputOptions = {}): Options {
  const finalOptions = { ...defaultOptions };
  Object.keys(finalOptions).forEach((key: string) => {
    finalOptions[key] = options[key];
  });

  return finalOptions;
}
