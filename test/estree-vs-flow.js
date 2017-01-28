import test from "ava" ;
import path from "path";
import { multiple as getFixtures } from "babel-helper-fixtures";
import { parse } from "../lib";
import flow from "flow-parser";

runFixtureTests(path.join(__dirname, "fixtures"));

function runFixtureTests(fixturesPath) {
  const fixtures = getFixtures(fixturesPath);

  Object.keys(fixtures).forEach(function (name) {
    fixtures[name].forEach(function (testSuite) {
      testSuite.tests.forEach(function (task) {
        if (
          task.disabled ||
          task.options.throws ||
          task.options.plugins && (
            task.options.plugins.indexOf('flow') > -1 ||
            task.options.plugins.indexOf('decorators') > -1 ||
            task.options.plugins.indexOf('functionSent') > -1 ||
            task.options.plugins.indexOf('asyncGenerators') > -1 ||
            task.options.plugins.indexOf('dynamicImport') > -1 ||
            task.options.plugins.indexOf('exportExtensions') > -1
          )
        ) return;

        const testFn = task.options.only ? test.only : test;

        task.options.plugins = task.options.plugins || [];
        task.options.plugins.push("estree");
        task.options.plugins.push("flow");

        testFn(name + "/" + testSuite.title + "/" + task.title, function () {
          try {
            return runTest(task);
          } catch (err) {
            err.message = name + "/" + task.actual.filename + ": " + err.message;
            throw err;
          }
        });
      });
    });
  });
}

function runTest(test) {
  var opts = test.options;
  opts.locations = true;
  opts.ranges = true;

  if (opts.throws && test.expect.code) {
    throw new Error("File expected.json exists although options specify throws. Remove expected.json.");
  }

  const flowOptions = {
    esproposal_class_instance_fields: true,
    esproposal_class_static_fields: true,
    esproposal_export_star_as: true,
  };

  const ast = parse(test.actual.code, opts);
  let flowAst;
  try {
    flowAst = flow.parse(test.actual.code, flowOptions);
  } catch (e) {
    e.message = `Flow could not parse code: ${e.message}`;
    throw e;
  }

  if (flowAst.errors.length > 0) {
    throw new Error(`Flow could not parse code: ${flowAst.errors[0].message}`);
  }

  const checkAst = ast.program;
  checkAst.comments = ast.comments;

  const mis = misMatch(flowAst, checkAst);
  if (mis) {
    //save(test, ast);
    throw new Error(mis);
  }
}

function ppJSON(v) {
  v = v instanceof RegExp ? v.toString() : v;
  return JSON.stringify(v, null, 2);
}

function addPath(str, pt) {
  if (str.charAt(str.length - 1) == ")") {
    return str.slice(0, str.length - 1) + "/" + pt + ")";
  } else {
    return str + " (" + pt + ")";
  }
}

function misMatch(exp, act, path = "") {
  if (exp instanceof RegExp || act instanceof RegExp) {
    const left = ppJSON(exp), right = ppJSON(act);
    if (left !== right) return left + " !== " + right;
  } else if (Array.isArray(exp)) {
    if (!Array.isArray(act)) return ppJSON(exp) + " != " + ppJSON(act);
    if (act.length != exp.length) return "array length mismatch " + exp.length + " != " + act.length;
    for (let i = 0; i < act.length; ++i) {
      const mis = misMatch(exp[i], act[i], `${path}/${i}`);
      if (mis) return addPath(mis, i);
    }
  } else if (!exp || !act || (typeof exp != "object") || (typeof act != "object")) {
    if (exp !== act && typeof exp != "function")
      return ppJSON(exp) + " !== " + ppJSON(act);
  } else  {
    for (const prop in exp) {
      const newPath = `${path}/${prop}`;

      if (newPath === "/errors") continue;
      if (exp[prop] === null && act[prop] === undefined) continue;
      if (prop === "optional" && exp[prop] === false && act[prop] === undefined) continue;
      if (prop === "each" && exp[prop] === false && act[prop] === undefined) continue;
      if (prop === "implements" && Array.isArray(exp[prop]) && exp[prop].length === 0 && act[prop] === undefined) continue;
      if (prop === "decorators" && Array.isArray(exp[prop]) && exp[prop].length === 0 && act[prop] === undefined) continue;
      if (prop === "range") continue;
      if (prop === "exportKind" && exp[prop] === "value" && act[prop] === undefined) continue;
      if (newPath.match(/loc\/source$/)) continue;

      const mis = misMatch(exp[prop], act[prop], newPath);
      if (mis) return addPath(mis, prop);
    }
  }
}
