import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  detectFileRole
} from "./chunk-2BBLFX75.js";

// dist/clients/collateral-test-role.js
function isTestRoleCollateral(filePath) {
  try {
    return detectFileRole(filePath) === "test";
  } catch {
    return false;
  }
}

export {
  isTestRoleCollateral
};
