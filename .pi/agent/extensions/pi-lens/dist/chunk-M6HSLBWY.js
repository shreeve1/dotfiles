import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  createReadGuardEditBatchSummary,
  getReadGuardCorrelationId,
  logReadGuardEvent,
  normalizeMessage,
  sanitizeCorrelationId,
  stableFindingId
} from "./chunk-IBGIOBEE.js";
import {
  mapWithConcurrency
} from "./chunk-XIMYZ3JA.js";
import {
  classifyCascadeWaitTier,
  classifyServerWaitTier,
  enforceLspRootCeiling,
  findLocalTyposConfig,
  getAstGrepRuleSources,
  getServerById,
  getServerInitOverride,
  getServersForFileWithConfig,
  getSessionRootsForTelemetry,
  getStrategy,
  hasProjectBoundaryMarker,
  isAuxiliary,
  isDirectLspCommandTemporarilyUnavailable,
  isOutsideAllSessionRoots,
  isSameOrWithin,
  refuseUntrustedLspExecution,
  resetClassicTsRepairGuard,
  resetLspLaunchAvailabilityGeneration,
  resolveAnalysisRoot,
  resolveAnalysisRootPath,
  resolveLspServerCwd,
  serverTraits,
  withLspProjectCodePermission
} from "./chunk-EU63SDCG.js";
import {
  findLocalOpengrepConfig
} from "./chunk-VWCXW2E7.js";
import {
  emitBounded
} from "./chunk-FCSOVF55.js";
import {
  loadProjectSnapshot,
  readJsonCache
} from "./chunk-ZXYDQ3TZ.js";
import {
  getSharedTreeSitterClient,
  loadWebTreeSitter,
  logTreeSitterDiagnostic,
  resolveTreeSitterLanguage,
  wasmQueryInput
} from "./chunk-QHJ6DQ2R.js";
import {
  EXTENSION_TO_GRAMMAR,
  EXTENSION_TO_LSP_ID,
  KIND_TO_GRAMMAR
} from "./chunk-724UL2TJ.js";
import {
  js_yaml_default
} from "./chunk-QOZXJ4NA.js";
import {
  buildModuleGraph
} from "./chunk-GBPP5P7X.js";
import {
  acquireWorkspaceSweepHold,
  configureLspServiceLifecycle,
  getOwnedLspService,
  peekOwnedLspService,
  resetOwnedLspService
} from "./chunk-MQLUAEOC.js";
import {
  HOOK_WALL_BUDGET_MS,
  bounded,
  withDeadline,
  withTimeout
} from "./chunk-52FUZI6K.js";
import {
  PathKeyedMap
} from "./chunk-Z3CCVDUB.js";
import {
  diagnosticsIpcPathForCwd,
  freshnessFromMtime,
  requestWarmCodeActions,
  requestWarmDiagnostics,
  toRunnerDisplayPath
} from "./chunk-L3BLXZG7.js";
import {
  findLocalZizmorConfig,
  logSessionStart
} from "./chunk-ACXEQZOU.js";
import {
  findLocalBinUpwards,
  isProjectLocalBinPath
} from "./chunk-AW7R2GWG.js";
import {
  getLspCapableKinds
} from "./chunk-QOBUHWHX.js";
import {
  createGenerationMap,
  createGenerationSource,
  getAmbientAbortSignal,
  getProjectDataDir,
  getProjectIgnoreMatcher,
  isEphemeralCheckoutRoot,
  isExcludedDirName,
  isOwnLiveChild,
  isSubagentSession,
  loadPiLensGlobalConfig,
  readInstanceRegistry,
  realIsPidAlive,
  recordLspChild,
  releaseOwnChildPid,
  removeLspChild,
  sampleProcessTreeCpuPercent,
  selectLivePeerInstances
} from "./chunk-C34ZXZ7O.js";
import {
  createSingleFlight
} from "./chunk-BW5KFIQC.js";
import {
  SPECIAL_FILENAMES,
  getLanguageId
} from "./chunk-PHDMFAKM.js";
import {
  detectFileRole
} from "./chunk-2BBLFX75.js";
import {
  findGoverningTsconfigDir,
  getDirectoryMarkers,
  registerWorkspaceTopologyReset
} from "./chunk-XVF2VVXP.js";
import {
  assertInstallAllowed,
  isLspSpawnAllowedByTrust,
  projectTrustDenialReason
} from "./chunk-ZANLILYD.js";
import {
  writeFileAtomic
} from "./chunk-2EECBNC5.js";
import {
  compareOrdinal,
  incrementDegradationCount,
  recordDegradation,
  recordDegradationOnce
} from "./chunk-JAU72XNY.js";
import {
  logExtension
} from "./chunk-XTMJ7XDT.js";
import {
  logLatency,
  phaseFinished,
  phaseStarted
} from "./chunk-QQNQ7SJW.js";
import {
  createNdjsonLogger,
  getGlobalPiLensLogDir,
  getMaxLogSizeMB,
  getProcessSingleton,
  isTestMode,
  nextModuleEvaluationOrdinal,
  toPositiveFinite
} from "./chunk-AOHZU2BM.js";
import {
  BoundedFifoMap,
  BoundedLruCache,
  BoundedSet
} from "./chunk-ABBOA7UD.js";
import {
  isAtOrAboveHomeDir,
  isUnderDir,
  isWindowsPath,
  minimatch,
  normalizeEphemeralMapKey,
  normalizeFilePath,
  normalizeMapKey,
  pathsEqual,
  realpathOrResolve,
  toPosix,
  toProjectRelativePath,
  uriToDiskPath,
  uriToPath
} from "./chunk-N2H3ZPZY.js";
import {
  __commonJS,
  __require,
  __toESM
} from "./chunk-NXL4FFQQ.js";

// node_modules/vscode-jsonrpc/lib/common/is.js
var require_is = __commonJS({
  "node_modules/vscode-jsonrpc/lib/common/is.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.boolean = boolean;
    exports.string = string;
    exports.number = number;
    exports.error = error;
    exports.func = func;
    exports.array = array;
    exports.stringArray = stringArray;
    function boolean(value) {
      return value === true || value === false;
    }
    function string(value) {
      return typeof value === "string" || value instanceof String;
    }
    function number(value) {
      return typeof value === "number" || value instanceof Number;
    }
    function error(value) {
      return value instanceof Error;
    }
    function func(value) {
      return typeof value === "function";
    }
    function array(value) {
      return Array.isArray(value);
    }
    function stringArray(value) {
      return array(value) && value.every((elem) => string(elem));
    }
  }
});

// node_modules/vscode-jsonrpc/lib/common/messages.js
var require_messages = __commonJS({
  "node_modules/vscode-jsonrpc/lib/common/messages.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Message = exports.NotificationType9 = exports.NotificationType8 = exports.NotificationType7 = exports.NotificationType6 = exports.NotificationType5 = exports.NotificationType4 = exports.NotificationType3 = exports.NotificationType2 = exports.NotificationType1 = exports.NotificationType0 = exports.NotificationType = exports.RequestType9 = exports.RequestType8 = exports.RequestType7 = exports.RequestType6 = exports.RequestType5 = exports.RequestType4 = exports.RequestType3 = exports.RequestType2 = exports.RequestType1 = exports.RequestType = exports.RequestType0 = exports.AbstractMessageSignature = exports.ParameterStructures = exports.ResponseError = exports.ErrorCodes = void 0;
    var is = __importStar(require_is());
    var ErrorCodes;
    (function(ErrorCodes2) {
      ErrorCodes2.ParseError = -32700;
      ErrorCodes2.InvalidRequest = -32600;
      ErrorCodes2.MethodNotFound = -32601;
      ErrorCodes2.InvalidParams = -32602;
      ErrorCodes2.InternalError = -32603;
      ErrorCodes2.jsonrpcReservedErrorRangeStart = -32099;
      ErrorCodes2.serverErrorStart = -32099;
      ErrorCodes2.MessageWriteError = -32099;
      ErrorCodes2.MessageReadError = -32098;
      ErrorCodes2.PendingResponseRejected = -32097;
      ErrorCodes2.ConnectionInactive = -32096;
      ErrorCodes2.ServerNotInitialized = -32002;
      ErrorCodes2.UnknownErrorCode = -32001;
      ErrorCodes2.jsonrpcReservedErrorRangeEnd = -32e3;
      ErrorCodes2.serverErrorEnd = -32e3;
    })(ErrorCodes || (exports.ErrorCodes = ErrorCodes = {}));
    var ResponseError = class _ResponseError extends Error {
      code;
      data;
      constructor(code, message, data) {
        super(message);
        this.code = is.number(code) ? code : ErrorCodes.UnknownErrorCode;
        this.data = data;
        Object.setPrototypeOf(this, _ResponseError.prototype);
      }
      toJson() {
        const result = {
          code: this.code,
          message: this.message
        };
        if (this.data !== void 0) {
          result.data = this.data;
        }
        return result;
      }
    };
    exports.ResponseError = ResponseError;
    var ParameterStructures = class _ParameterStructures {
      kind;
      /**
       * The parameter structure is automatically inferred on the number of parameters
       * and the parameter type in case of a single param.
       */
      static auto = new _ParameterStructures("auto");
      /**
       * Forces `byPosition` parameter structure. This is useful if you have a single
       * parameter which has a literal type.
       */
      static byPosition = new _ParameterStructures("byPosition");
      /**
       * Forces `byName` parameter structure. This is only useful when having a single
       * parameter. The library will report errors if used with a different number of
       * parameters.
       */
      static byName = new _ParameterStructures("byName");
      constructor(kind) {
        this.kind = kind;
      }
      static is(value) {
        return value === _ParameterStructures.auto || value === _ParameterStructures.byName || value === _ParameterStructures.byPosition;
      }
      toString() {
        return this.kind;
      }
    };
    exports.ParameterStructures = ParameterStructures;
    var AbstractMessageSignature = class {
      method;
      numberOfParams;
      constructor(method, numberOfParams) {
        this.method = method;
        this.numberOfParams = numberOfParams;
      }
      get parameterStructures() {
        return ParameterStructures.auto;
      }
    };
    exports.AbstractMessageSignature = AbstractMessageSignature;
    var RequestType0 = class extends AbstractMessageSignature {
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      _;
      constructor(method) {
        super(method, 0);
      }
    };
    exports.RequestType0 = RequestType0;
    var RequestType = class extends AbstractMessageSignature {
      _parameterStructures;
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      _;
      constructor(method, _parameterStructures = ParameterStructures.auto) {
        super(method, 1);
        this._parameterStructures = _parameterStructures;
      }
      get parameterStructures() {
        return this._parameterStructures;
      }
    };
    exports.RequestType = RequestType;
    var RequestType1 = class extends AbstractMessageSignature {
      _parameterStructures;
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      _;
      constructor(method, _parameterStructures = ParameterStructures.auto) {
        super(method, 1);
        this._parameterStructures = _parameterStructures;
      }
      get parameterStructures() {
        return this._parameterStructures;
      }
    };
    exports.RequestType1 = RequestType1;
    var RequestType2 = class extends AbstractMessageSignature {
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      _;
      constructor(method) {
        super(method, 2);
      }
    };
    exports.RequestType2 = RequestType2;
    var RequestType3 = class extends AbstractMessageSignature {
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      _;
      constructor(method) {
        super(method, 3);
      }
    };
    exports.RequestType3 = RequestType3;
    var RequestType4 = class extends AbstractMessageSignature {
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      _;
      constructor(method) {
        super(method, 4);
      }
    };
    exports.RequestType4 = RequestType4;
    var RequestType5 = class extends AbstractMessageSignature {
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      _;
      constructor(method) {
        super(method, 5);
      }
    };
    exports.RequestType5 = RequestType5;
    var RequestType6 = class extends AbstractMessageSignature {
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      _;
      constructor(method) {
        super(method, 6);
      }
    };
    exports.RequestType6 = RequestType6;
    var RequestType7 = class extends AbstractMessageSignature {
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      _;
      constructor(method) {
        super(method, 7);
      }
    };
    exports.RequestType7 = RequestType7;
    var RequestType8 = class extends AbstractMessageSignature {
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      _;
      constructor(method) {
        super(method, 8);
      }
    };
    exports.RequestType8 = RequestType8;
    var RequestType9 = class extends AbstractMessageSignature {
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      _;
      constructor(method) {
        super(method, 9);
      }
    };
    exports.RequestType9 = RequestType9;
    var NotificationType = class extends AbstractMessageSignature {
      _parameterStructures;
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      _;
      constructor(method, _parameterStructures = ParameterStructures.auto) {
        super(method, 1);
        this._parameterStructures = _parameterStructures;
      }
      get parameterStructures() {
        return this._parameterStructures;
      }
    };
    exports.NotificationType = NotificationType;
    var NotificationType0 = class extends AbstractMessageSignature {
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      _;
      constructor(method) {
        super(method, 0);
      }
    };
    exports.NotificationType0 = NotificationType0;
    var NotificationType1 = class extends AbstractMessageSignature {
      _parameterStructures;
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      _;
      constructor(method, _parameterStructures = ParameterStructures.auto) {
        super(method, 1);
        this._parameterStructures = _parameterStructures;
      }
      get parameterStructures() {
        return this._parameterStructures;
      }
    };
    exports.NotificationType1 = NotificationType1;
    var NotificationType2 = class extends AbstractMessageSignature {
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      _;
      constructor(method) {
        super(method, 2);
      }
    };
    exports.NotificationType2 = NotificationType2;
    var NotificationType3 = class extends AbstractMessageSignature {
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      _;
      constructor(method) {
        super(method, 3);
      }
    };
    exports.NotificationType3 = NotificationType3;
    var NotificationType4 = class extends AbstractMessageSignature {
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      _;
      constructor(method) {
        super(method, 4);
      }
    };
    exports.NotificationType4 = NotificationType4;
    var NotificationType5 = class extends AbstractMessageSignature {
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      _;
      constructor(method) {
        super(method, 5);
      }
    };
    exports.NotificationType5 = NotificationType5;
    var NotificationType6 = class extends AbstractMessageSignature {
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      _;
      constructor(method) {
        super(method, 6);
      }
    };
    exports.NotificationType6 = NotificationType6;
    var NotificationType7 = class extends AbstractMessageSignature {
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      _;
      constructor(method) {
        super(method, 7);
      }
    };
    exports.NotificationType7 = NotificationType7;
    var NotificationType8 = class extends AbstractMessageSignature {
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      _;
      constructor(method) {
        super(method, 8);
      }
    };
    exports.NotificationType8 = NotificationType8;
    var NotificationType9 = class extends AbstractMessageSignature {
      /**
       * Clients must not use this property. It is here to ensure correct typing.
       */
      _;
      constructor(method) {
        super(method, 9);
      }
    };
    exports.NotificationType9 = NotificationType9;
    var Message;
    (function(Message2) {
      function isRequest(message) {
        const candidate = message;
        return candidate && is.string(candidate.method) && (is.string(candidate.id) || is.number(candidate.id));
      }
      Message2.isRequest = isRequest;
      function isNotification(message) {
        const candidate = message;
        return candidate && is.string(candidate.method) && message.id === void 0;
      }
      Message2.isNotification = isNotification;
      function isResponse(message) {
        const candidate = message;
        return candidate && (candidate.result !== void 0 || !!candidate.error) && (is.string(candidate.id) || is.number(candidate.id) || candidate.id === null);
      }
      Message2.isResponse = isResponse;
    })(Message || (exports.Message = Message = {}));
  }
});

// node_modules/vscode-jsonrpc/lib/common/linkedMap.js
var require_linkedMap = __commonJS({
  "node_modules/vscode-jsonrpc/lib/common/linkedMap.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LRUCache = exports.LinkedMap = exports.Touch = void 0;
    var Touch;
    (function(Touch2) {
      Touch2.None = 0;
      Touch2.First = 1;
      Touch2.AsOld = Touch2.First;
      Touch2.Last = 2;
      Touch2.AsNew = Touch2.Last;
    })(Touch || (exports.Touch = Touch = {}));
    var LinkedMap = class {
      [Symbol.toStringTag] = "LinkedMap";
      _map;
      _head;
      _tail;
      _size;
      _state;
      constructor() {
        this._map = /* @__PURE__ */ new Map();
        this._head = void 0;
        this._tail = void 0;
        this._size = 0;
        this._state = 0;
      }
      clear() {
        this._map.clear();
        this._head = void 0;
        this._tail = void 0;
        this._size = 0;
        this._state++;
      }
      isEmpty() {
        return !this._head && !this._tail;
      }
      get size() {
        return this._size;
      }
      get first() {
        return this._head?.value;
      }
      get last() {
        return this._tail?.value;
      }
      before(key) {
        const item = this._map.get(key);
        return item ? item.previous?.value : void 0;
      }
      after(key) {
        const item = this._map.get(key);
        return item ? item.next?.value : void 0;
      }
      has(key) {
        return this._map.has(key);
      }
      get(key, touch = Touch.None) {
        const item = this._map.get(key);
        if (!item) {
          return void 0;
        }
        if (touch !== Touch.None) {
          this.touch(item, touch);
        }
        return item.value;
      }
      set(key, value, touch = Touch.None) {
        let item = this._map.get(key);
        if (item) {
          item.value = value;
          if (touch !== Touch.None) {
            this.touch(item, touch);
          }
        } else {
          item = { key, value, next: void 0, previous: void 0 };
          switch (touch) {
            case Touch.None:
              this.addItemLast(item);
              break;
            case Touch.First:
              this.addItemFirst(item);
              break;
            case Touch.Last:
              this.addItemLast(item);
              break;
            default:
              this.addItemLast(item);
              break;
          }
          this._map.set(key, item);
          this._size++;
        }
        return this;
      }
      delete(key) {
        return !!this.remove(key);
      }
      remove(key) {
        const item = this._map.get(key);
        if (!item) {
          return void 0;
        }
        this._map.delete(key);
        this.removeItem(item);
        this._size--;
        return item.value;
      }
      shift() {
        if (!this._head && !this._tail) {
          return void 0;
        }
        if (!this._head || !this._tail) {
          throw new Error("Invalid list");
        }
        const item = this._head;
        this._map.delete(item.key);
        this.removeItem(item);
        this._size--;
        return item.value;
      }
      forEach(callbackfn, thisArg) {
        const state4 = this._state;
        let current = this._head;
        while (current) {
          if (thisArg) {
            callbackfn.bind(thisArg)(current.value, current.key, this);
          } else {
            callbackfn(current.value, current.key, this);
          }
          if (this._state !== state4) {
            throw new Error(`LinkedMap got modified during iteration.`);
          }
          current = current.next;
        }
      }
      keys() {
        const state4 = this._state;
        let current = this._head;
        const iterator = {
          [Symbol.iterator]: () => {
            return iterator;
          },
          next: () => {
            if (this._state !== state4) {
              throw new Error(`LinkedMap got modified during iteration.`);
            }
            if (current) {
              const result = { value: current.key, done: false };
              current = current.next;
              return result;
            } else {
              return { value: void 0, done: true };
            }
          }
        };
        return iterator;
      }
      values() {
        const state4 = this._state;
        let current = this._head;
        const iterator = {
          [Symbol.iterator]: () => {
            return iterator;
          },
          next: () => {
            if (this._state !== state4) {
              throw new Error(`LinkedMap got modified during iteration.`);
            }
            if (current) {
              const result = { value: current.value, done: false };
              current = current.next;
              return result;
            } else {
              return { value: void 0, done: true };
            }
          }
        };
        return iterator;
      }
      entries() {
        const state4 = this._state;
        let current = this._head;
        const iterator = {
          [Symbol.iterator]: () => {
            return iterator;
          },
          next: () => {
            if (this._state !== state4) {
              throw new Error(`LinkedMap got modified during iteration.`);
            }
            if (current) {
              const result = { value: [current.key, current.value], done: false };
              current = current.next;
              return result;
            } else {
              return { value: void 0, done: true };
            }
          }
        };
        return iterator;
      }
      [Symbol.iterator]() {
        return this.entries();
      }
      trimOld(newSize) {
        if (newSize >= this.size) {
          return;
        }
        if (newSize === 0) {
          this.clear();
          return;
        }
        let current = this._head;
        let currentSize = this.size;
        while (current && currentSize > newSize) {
          this._map.delete(current.key);
          current = current.next;
          currentSize--;
        }
        this._head = current;
        this._size = currentSize;
        if (current) {
          current.previous = void 0;
        }
        this._state++;
      }
      addItemFirst(item) {
        if (!this._head && !this._tail) {
          this._tail = item;
        } else if (!this._head) {
          throw new Error("Invalid list");
        } else {
          item.next = this._head;
          this._head.previous = item;
        }
        this._head = item;
        this._state++;
      }
      addItemLast(item) {
        if (!this._head && !this._tail) {
          this._head = item;
        } else if (!this._tail) {
          throw new Error("Invalid list");
        } else {
          item.previous = this._tail;
          this._tail.next = item;
        }
        this._tail = item;
        this._state++;
      }
      removeItem(item) {
        if (item === this._head && item === this._tail) {
          this._head = void 0;
          this._tail = void 0;
        } else if (item === this._head) {
          if (!item.next) {
            throw new Error("Invalid list");
          }
          item.next.previous = void 0;
          this._head = item.next;
        } else if (item === this._tail) {
          if (!item.previous) {
            throw new Error("Invalid list");
          }
          item.previous.next = void 0;
          this._tail = item.previous;
        } else {
          const next = item.next;
          const previous = item.previous;
          if (!next || !previous) {
            throw new Error("Invalid list");
          }
          next.previous = previous;
          previous.next = next;
        }
        item.next = void 0;
        item.previous = void 0;
        this._state++;
      }
      touch(item, touch) {
        if (!this._head || !this._tail) {
          throw new Error("Invalid list");
        }
        if (touch !== Touch.First && touch !== Touch.Last) {
          return;
        }
        if (touch === Touch.First) {
          if (item === this._head) {
            return;
          }
          const next = item.next;
          const previous = item.previous;
          if (item === this._tail) {
            previous.next = void 0;
            this._tail = previous;
          } else {
            next.previous = previous;
            previous.next = next;
          }
          item.previous = void 0;
          item.next = this._head;
          this._head.previous = item;
          this._head = item;
          this._state++;
        } else if (touch === Touch.Last) {
          if (item === this._tail) {
            return;
          }
          const next = item.next;
          const previous = item.previous;
          if (item === this._head) {
            next.previous = void 0;
            this._head = next;
          } else {
            next.previous = previous;
            previous.next = next;
          }
          item.next = void 0;
          item.previous = this._tail;
          this._tail.next = item;
          this._tail = item;
          this._state++;
        }
      }
      toJSON() {
        const data = [];
        this.forEach((value, key) => {
          data.push([key, value]);
        });
        return data;
      }
      fromJSON(data) {
        this.clear();
        for (const [key, value] of data) {
          this.set(key, value);
        }
      }
    };
    exports.LinkedMap = LinkedMap;
    var LRUCache = class extends LinkedMap {
      _limit;
      _ratio;
      constructor(limit, ratio = 1) {
        super();
        this._limit = limit;
        this._ratio = Math.min(Math.max(0, ratio), 1);
      }
      get limit() {
        return this._limit;
      }
      set limit(limit) {
        this._limit = limit;
        this.checkTrim();
      }
      get ratio() {
        return this._ratio;
      }
      set ratio(ratio) {
        this._ratio = Math.min(Math.max(0, ratio), 1);
        this.checkTrim();
      }
      get(key, touch = Touch.AsNew) {
        return super.get(key, touch);
      }
      peek(key) {
        return super.get(key, Touch.None);
      }
      set(key, value) {
        super.set(key, value, Touch.Last);
        this.checkTrim();
        return this;
      }
      checkTrim() {
        if (this.size > this._limit) {
          this.trimOld(Math.round(this._limit * this._ratio));
        }
      }
    };
    exports.LRUCache = LRUCache;
  }
});

// node_modules/vscode-jsonrpc/lib/common/disposable.js
var require_disposable = __commonJS({
  "node_modules/vscode-jsonrpc/lib/common/disposable.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Disposable = void 0;
    var Disposable;
    (function(Disposable2) {
      function create(func) {
        return {
          dispose: func
        };
      }
      Disposable2.create = create;
    })(Disposable || (exports.Disposable = Disposable = {}));
  }
});

// node_modules/vscode-jsonrpc/lib/common/ral.js
var require_ral = __commonJS({
  "node_modules/vscode-jsonrpc/lib/common/ral.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var _ral;
    function RAL() {
      if (_ral === void 0) {
        throw new Error(`No runtime abstraction layer installed`);
      }
      return _ral;
    }
    (function(RAL2) {
      function install(ral) {
        if (ral === void 0) {
          throw new Error(`No runtime abstraction layer provided`);
        }
        _ral = ral;
      }
      RAL2.install = install;
    })(RAL || (RAL = {}));
    exports.default = RAL;
  }
});

// node_modules/vscode-jsonrpc/lib/common/events.js
var require_events = __commonJS({
  "node_modules/vscode-jsonrpc/lib/common/events.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Emitter = exports.Event = void 0;
    var ral_1 = __importDefault(require_ral());
    var Event;
    (function(Event2) {
      const _disposable = { dispose() {
      } };
      Event2.None = function() {
        return _disposable;
      };
    })(Event || (exports.Event = Event = {}));
    var CallbackList = class {
      _callbacks;
      _contexts;
      add(callback, context = null, bucket) {
        if (!this._callbacks) {
          this._callbacks = [];
          this._contexts = [];
        }
        this._callbacks.push(callback);
        this._contexts.push(context);
        if (Array.isArray(bucket)) {
          bucket.push({ dispose: () => this.remove(callback, context) });
        }
      }
      remove(callback, context = null) {
        if (!this._callbacks) {
          return;
        }
        let foundCallbackWithDifferentContext = false;
        for (let i = 0, len = this._callbacks.length; i < len; i++) {
          if (this._callbacks[i] === callback) {
            if (this._contexts[i] === context) {
              this._callbacks.splice(i, 1);
              this._contexts.splice(i, 1);
              return;
            } else {
              foundCallbackWithDifferentContext = true;
            }
          }
        }
        if (foundCallbackWithDifferentContext) {
          throw new Error("When adding a listener with a context, you should remove it with the same context");
        }
      }
      invoke(...args) {
        if (!this._callbacks) {
          return [];
        }
        const ret = [], callbacks = this._callbacks.slice(0), contexts = this._contexts.slice(0);
        for (let i = 0, len = callbacks.length; i < len; i++) {
          try {
            ret.push(callbacks[i].apply(contexts[i], args));
          } catch (e) {
            (0, ral_1.default)().console.error(e);
          }
        }
        return ret;
      }
      isEmpty() {
        return !this._callbacks || this._callbacks.length === 0;
      }
      dispose() {
        this._callbacks = void 0;
        this._contexts = void 0;
      }
    };
    var Emitter = class _Emitter {
      _options;
      static _noop = function() {
      };
      _event;
      _callbacks;
      constructor(_options) {
        this._options = _options;
      }
      /**
       * For the public to allow to subscribe
       * to events from this Emitter
       */
      get event() {
        if (!this._event) {
          this._event = (listener, thisArgs, disposables) => {
            if (!this._callbacks) {
              this._callbacks = new CallbackList();
            }
            if (this._options && this._options.onFirstListenerAdd && this._callbacks.isEmpty()) {
              this._options.onFirstListenerAdd(this);
            }
            this._callbacks.add(listener, thisArgs);
            const result = {
              dispose: () => {
                if (!this._callbacks) {
                  return;
                }
                this._callbacks.remove(listener, thisArgs);
                result.dispose = _Emitter._noop;
                if (this._options && this._options.onLastListenerRemove && this._callbacks.isEmpty()) {
                  this._options.onLastListenerRemove(this);
                }
              }
            };
            if (Array.isArray(disposables)) {
              disposables.push(result);
            }
            return result;
          };
        }
        return this._event;
      }
      /**
       * To be kept private to fire an event to
       * subscribers
       */
      fire(event) {
        if (this._callbacks) {
          this._callbacks.invoke.call(this._callbacks, event);
        }
      }
      dispose() {
        if (this._callbacks) {
          this._callbacks.dispose();
          this._callbacks = void 0;
        }
      }
    };
    exports.Emitter = Emitter;
  }
});

// node_modules/vscode-jsonrpc/lib/common/cancellation.js
var require_cancellation = __commonJS({
  "node_modules/vscode-jsonrpc/lib/common/cancellation.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CancellationTokenSource = exports.CancellationToken = void 0;
    var ral_1 = __importDefault(require_ral());
    var Is = __importStar(require_is());
    var events_1 = require_events();
    var CancellationToken;
    (function(CancellationToken2) {
      CancellationToken2.None = Object.freeze({
        isCancellationRequested: false,
        onCancellationRequested: events_1.Event.None
      });
      CancellationToken2.Cancelled = Object.freeze({
        isCancellationRequested: true,
        onCancellationRequested: events_1.Event.None
      });
      function is(value) {
        const candidate = value;
        return candidate && (candidate === CancellationToken2.None || candidate === CancellationToken2.Cancelled || Is.boolean(candidate.isCancellationRequested) && !!candidate.onCancellationRequested);
      }
      CancellationToken2.is = is;
    })(CancellationToken || (exports.CancellationToken = CancellationToken = {}));
    var shortcutEvent = Object.freeze(function(callback, context) {
      const handle = (0, ral_1.default)().timer.setTimeout(callback.bind(context), 0);
      return { dispose() {
        handle.dispose();
      } };
    });
    var MutableToken = class {
      _isCancelled = false;
      _emitter;
      cancel() {
        if (!this._isCancelled) {
          this._isCancelled = true;
          if (this._emitter) {
            this._emitter.fire(void 0);
            this.dispose();
          }
        }
      }
      get isCancellationRequested() {
        return this._isCancelled;
      }
      get onCancellationRequested() {
        if (this._isCancelled) {
          return shortcutEvent;
        }
        if (!this._emitter) {
          this._emitter = new events_1.Emitter();
        }
        return this._emitter.event;
      }
      dispose() {
        if (this._emitter) {
          this._emitter.dispose();
          this._emitter = void 0;
        }
      }
    };
    var CancellationTokenSource2 = class {
      _token;
      get token() {
        if (!this._token) {
          this._token = new MutableToken();
        }
        return this._token;
      }
      cancel() {
        if (!this._token) {
          this._token = CancellationToken.Cancelled;
        } else {
          this._token.cancel();
        }
      }
      dispose() {
        if (!this._token) {
          this._token = CancellationToken.None;
        } else if (this._token instanceof MutableToken) {
          this._token.dispose();
        }
      }
    };
    exports.CancellationTokenSource = CancellationTokenSource2;
  }
});

// node_modules/vscode-jsonrpc/lib/common/sharedArrayCancellation.js
var require_sharedArrayCancellation = __commonJS({
  "node_modules/vscode-jsonrpc/lib/common/sharedArrayCancellation.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SharedArrayReceiverStrategy = exports.SharedArraySenderStrategy = void 0;
    var cancellation_1 = require_cancellation();
    var CancellationState;
    (function(CancellationState2) {
      CancellationState2.Continue = 0;
      CancellationState2.Cancelled = 1;
    })(CancellationState || (CancellationState = {}));
    var SharedArraySenderStrategy = class {
      buffers;
      constructor() {
        this.buffers = /* @__PURE__ */ new Map();
      }
      enableCancellation(request) {
        if (request.id === null) {
          return;
        }
        const buffer = new SharedArrayBuffer(4);
        const data = new Int32Array(buffer, 0, 1);
        data[0] = CancellationState.Continue;
        this.buffers.set(request.id, buffer);
        request.$cancellationData = buffer;
      }
      async sendCancellation(_conn, id) {
        const buffer = this.buffers.get(id);
        if (buffer === void 0) {
          return;
        }
        const data = new Int32Array(buffer, 0, 1);
        Atomics.store(data, 0, CancellationState.Cancelled);
      }
      cleanup(id) {
        this.buffers.delete(id);
      }
      dispose() {
        this.buffers.clear();
      }
    };
    exports.SharedArraySenderStrategy = SharedArraySenderStrategy;
    var SharedArrayBufferCancellationToken = class {
      data;
      constructor(buffer) {
        this.data = new Int32Array(buffer, 0, 1);
      }
      get isCancellationRequested() {
        return Atomics.load(this.data, 0) === CancellationState.Cancelled;
      }
      get onCancellationRequested() {
        throw new Error(`Cancellation over SharedArrayBuffer doesn't support cancellation events`);
      }
    };
    var SharedArrayBufferCancellationTokenSource = class {
      token;
      constructor(buffer) {
        this.token = new SharedArrayBufferCancellationToken(buffer);
      }
      cancel() {
      }
      dispose() {
      }
    };
    var SharedArrayReceiverStrategy = class {
      kind = "request";
      createCancellationTokenSource(request) {
        const buffer = request.$cancellationData;
        if (buffer === void 0) {
          return new cancellation_1.CancellationTokenSource();
        }
        return new SharedArrayBufferCancellationTokenSource(buffer);
      }
    };
    exports.SharedArrayReceiverStrategy = SharedArrayReceiverStrategy;
  }
});

// node_modules/vscode-jsonrpc/lib/common/semaphore.js
var require_semaphore = __commonJS({
  "node_modules/vscode-jsonrpc/lib/common/semaphore.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Semaphore = void 0;
    var ral_1 = __importDefault(require_ral());
    var Semaphore = class {
      _capacity;
      _active;
      _waiting;
      constructor(capacity = 1) {
        if (capacity <= 0) {
          throw new Error("Capacity must be greater than 0");
        }
        this._capacity = capacity;
        this._active = 0;
        this._waiting = [];
      }
      lock(thunk) {
        return new Promise((resolve9, reject) => {
          this._waiting.push({ thunk, resolve: resolve9, reject });
          this.runNext();
        });
      }
      get active() {
        return this._active;
      }
      runNext() {
        if (this._waiting.length === 0 || this._active === this._capacity) {
          return;
        }
        (0, ral_1.default)().timer.setImmediate(() => this.doRunNext());
      }
      doRunNext() {
        if (this._waiting.length === 0 || this._active === this._capacity) {
          return;
        }
        const next = this._waiting.shift();
        this._active++;
        if (this._active > this._capacity) {
          throw new Error(`Too many thunks active`);
        }
        try {
          const result = next.thunk();
          if (result instanceof Promise) {
            result.then((value) => {
              this._active--;
              next.resolve(value);
              this.runNext();
            }, (err) => {
              this._active--;
              next.reject(err);
              this.runNext();
            });
          } else {
            this._active--;
            next.resolve(result);
            this.runNext();
          }
        } catch (err) {
          this._active--;
          next.reject(err);
          this.runNext();
        }
      }
    };
    exports.Semaphore = Semaphore;
  }
});

// node_modules/vscode-jsonrpc/lib/common/messageReader.js
var require_messageReader = __commonJS({
  "node_modules/vscode-jsonrpc/lib/common/messageReader.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReadableStreamMessageReader = exports.AbstractMessageReader = exports.MessageReader = void 0;
    var ral_1 = __importDefault(require_ral());
    var Is = __importStar(require_is());
    var events_1 = require_events();
    var semaphore_1 = require_semaphore();
    var MessageReader;
    (function(MessageReader2) {
      function is(value) {
        const candidate = value;
        return candidate && Is.func(candidate.listen) && Is.func(candidate.dispose) && Is.func(candidate.onError) && Is.func(candidate.onClose) && Is.func(candidate.onPartialMessage);
      }
      MessageReader2.is = is;
    })(MessageReader || (exports.MessageReader = MessageReader = {}));
    var AbstractMessageReader = class {
      errorEmitter;
      closeEmitter;
      partialMessageEmitter;
      constructor() {
        this.errorEmitter = new events_1.Emitter();
        this.closeEmitter = new events_1.Emitter();
        this.partialMessageEmitter = new events_1.Emitter();
      }
      dispose() {
        this.errorEmitter.dispose();
        this.closeEmitter.dispose();
        this.partialMessageEmitter.dispose();
      }
      get onError() {
        return this.errorEmitter.event;
      }
      fireError(error) {
        this.errorEmitter.fire(this.asError(error));
      }
      get onClose() {
        return this.closeEmitter.event;
      }
      fireClose() {
        this.closeEmitter.fire(void 0);
      }
      get onPartialMessage() {
        return this.partialMessageEmitter.event;
      }
      firePartialMessage(info) {
        this.partialMessageEmitter.fire(info);
      }
      asError(error) {
        if (error instanceof Error) {
          return error;
        } else {
          return new Error(`Reader received error. Reason: ${Is.string(error.message) ? error.message : "unknown"}`);
        }
      }
    };
    exports.AbstractMessageReader = AbstractMessageReader;
    var ResolvedMessageReaderOptions;
    (function(ResolvedMessageReaderOptions2) {
      function fromOptions(options) {
        let charset;
        let result;
        let contentDecoder;
        const contentDecoders = /* @__PURE__ */ new Map();
        let contentTypeDecoder;
        const contentTypeDecoders = /* @__PURE__ */ new Map();
        if (options === void 0 || typeof options === "string") {
          charset = options ?? "utf-8";
        } else {
          charset = options.charset ?? "utf-8";
          if (options.contentDecoder !== void 0) {
            contentDecoder = options.contentDecoder;
            contentDecoders.set(contentDecoder.name, contentDecoder);
          }
          if (options.contentDecoders !== void 0) {
            for (const decoder of options.contentDecoders) {
              contentDecoders.set(decoder.name, decoder);
            }
          }
          if (options.contentTypeDecoder !== void 0) {
            contentTypeDecoder = options.contentTypeDecoder;
            contentTypeDecoders.set(contentTypeDecoder.name, contentTypeDecoder);
          }
          if (options.contentTypeDecoders !== void 0) {
            for (const decoder of options.contentTypeDecoders) {
              contentTypeDecoders.set(decoder.name, decoder);
            }
          }
        }
        if (contentTypeDecoder === void 0) {
          contentTypeDecoder = (0, ral_1.default)().applicationJson.decoder;
          contentTypeDecoders.set(contentTypeDecoder.name, contentTypeDecoder);
        }
        return { charset, contentDecoder, contentDecoders, contentTypeDecoder, contentTypeDecoders };
      }
      ResolvedMessageReaderOptions2.fromOptions = fromOptions;
    })(ResolvedMessageReaderOptions || (ResolvedMessageReaderOptions = {}));
    var ReadableStreamMessageReader = class extends AbstractMessageReader {
      readable;
      options;
      callback;
      nextMessageLength;
      messageToken;
      buffer;
      partialMessageTimer;
      _partialMessageTimeout;
      readSemaphore;
      constructor(readable, options) {
        super();
        this.readable = readable;
        this.options = ResolvedMessageReaderOptions.fromOptions(options);
        this.buffer = (0, ral_1.default)().messageBuffer.create(this.options.charset);
        this._partialMessageTimeout = 1e4;
        this.nextMessageLength = -1;
        this.messageToken = 0;
        this.readSemaphore = new semaphore_1.Semaphore(1);
      }
      set partialMessageTimeout(timeout) {
        this._partialMessageTimeout = timeout;
      }
      get partialMessageTimeout() {
        return this._partialMessageTimeout;
      }
      listen(callback) {
        this.nextMessageLength = -1;
        this.messageToken = 0;
        this.partialMessageTimer = void 0;
        this.callback = callback;
        const result = this.readable.onData((data) => {
          this.onData(data);
        });
        this.readable.onError((error) => this.fireError(error));
        this.readable.onClose(() => this.fireClose());
        return result;
      }
      onData(data) {
        try {
          this.buffer.append(data);
          while (true) {
            if (this.nextMessageLength === -1) {
              const headers = this.buffer.tryReadHeaders(true);
              if (!headers) {
                return;
              }
              const contentLength = headers.get("content-length");
              if (!contentLength) {
                this.fireError(new Error(`Header must provide a Content-Length property.
${JSON.stringify(Object.fromEntries(headers))}`));
                return;
              }
              const length = parseInt(contentLength);
              if (isNaN(length)) {
                this.fireError(new Error(`Content-Length value must be a number. Got ${contentLength}`));
                return;
              }
              this.nextMessageLength = length;
            }
            const body = this.buffer.tryReadBody(this.nextMessageLength);
            if (body === void 0) {
              this.setPartialMessageTimer();
              return;
            }
            this.clearPartialMessageTimer();
            this.nextMessageLength = -1;
            this.readSemaphore.lock(async () => {
              const bytes = this.options.contentDecoder !== void 0 ? await this.options.contentDecoder.decode(body) : body;
              const message = await this.options.contentTypeDecoder.decode(bytes, this.options);
              this.callback(message);
            }).catch((error) => {
              this.fireError(error);
            });
          }
        } catch (error) {
          this.fireError(error);
        }
      }
      clearPartialMessageTimer() {
        if (this.partialMessageTimer) {
          this.partialMessageTimer.dispose();
          this.partialMessageTimer = void 0;
        }
      }
      setPartialMessageTimer() {
        this.clearPartialMessageTimer();
        if (this._partialMessageTimeout <= 0) {
          return;
        }
        this.partialMessageTimer = (0, ral_1.default)().timer.setTimeout((token, timeout) => {
          this.partialMessageTimer = void 0;
          if (token === this.messageToken) {
            this.firePartialMessage({ messageToken: token, waitingTime: timeout });
            this.setPartialMessageTimer();
          }
        }, this._partialMessageTimeout, this.messageToken, this._partialMessageTimeout);
      }
    };
    exports.ReadableStreamMessageReader = ReadableStreamMessageReader;
  }
});

// node_modules/vscode-jsonrpc/lib/common/messageWriter.js
var require_messageWriter = __commonJS({
  "node_modules/vscode-jsonrpc/lib/common/messageWriter.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WriteableStreamMessageWriter = exports.AbstractMessageWriter = exports.MessageWriter = void 0;
    var ral_1 = __importDefault(require_ral());
    var Is = __importStar(require_is());
    var semaphore_1 = require_semaphore();
    var events_1 = require_events();
    var ContentLength = "Content-Length: ";
    var CRLF = "\r\n";
    var MessageWriter;
    (function(MessageWriter2) {
      function is(value) {
        const candidate = value;
        return candidate && Is.func(candidate.dispose) && Is.func(candidate.onClose) && Is.func(candidate.onError) && Is.func(candidate.write);
      }
      MessageWriter2.is = is;
    })(MessageWriter || (exports.MessageWriter = MessageWriter = {}));
    var AbstractMessageWriter = class {
      errorEmitter;
      closeEmitter;
      constructor() {
        this.errorEmitter = new events_1.Emitter();
        this.closeEmitter = new events_1.Emitter();
      }
      dispose() {
        this.errorEmitter.dispose();
        this.closeEmitter.dispose();
      }
      get onError() {
        return this.errorEmitter.event;
      }
      fireError(error, message, count) {
        this.errorEmitter.fire([this.asError(error), message, count]);
      }
      get onClose() {
        return this.closeEmitter.event;
      }
      fireClose() {
        this.closeEmitter.fire(void 0);
      }
      asError(error) {
        if (error instanceof Error) {
          return error;
        } else {
          return new Error(`Writer received error. Reason: ${Is.string(error.message) ? error.message : "unknown"}`);
        }
      }
    };
    exports.AbstractMessageWriter = AbstractMessageWriter;
    var ResolvedMessageWriterOptions;
    (function(ResolvedMessageWriterOptions2) {
      function fromOptions(options) {
        if (options === void 0 || typeof options === "string") {
          return { charset: options ?? "utf-8", contentTypeEncoder: (0, ral_1.default)().applicationJson.encoder };
        } else {
          return { charset: options.charset ?? "utf-8", contentEncoder: options.contentEncoder, contentTypeEncoder: options.contentTypeEncoder ?? (0, ral_1.default)().applicationJson.encoder };
        }
      }
      ResolvedMessageWriterOptions2.fromOptions = fromOptions;
    })(ResolvedMessageWriterOptions || (ResolvedMessageWriterOptions = {}));
    var WriteableStreamMessageWriter = class extends AbstractMessageWriter {
      writable;
      options;
      errorCount;
      writeSemaphore;
      constructor(writable, options) {
        super();
        this.writable = writable;
        this.options = ResolvedMessageWriterOptions.fromOptions(options);
        this.errorCount = 0;
        this.writeSemaphore = new semaphore_1.Semaphore(1);
        this.writable.onError((error) => this.fireError(error));
        this.writable.onClose(() => this.fireClose());
      }
      async write(msg) {
        return this.writeSemaphore.lock(async () => {
          const payload = this.options.contentTypeEncoder.encode(msg, this.options).then((buffer) => {
            if (this.options.contentEncoder !== void 0) {
              return this.options.contentEncoder.encode(buffer);
            } else {
              return buffer;
            }
          });
          return payload.then((buffer) => {
            const headers = [];
            headers.push(ContentLength, buffer.byteLength.toString(), CRLF);
            headers.push(CRLF);
            return this.doWrite(msg, headers, buffer);
          }, (error) => {
            this.fireError(error);
            throw error;
          });
        });
      }
      async doWrite(msg, headers, data) {
        try {
          await this.writable.write(headers.join(""), "ascii");
          return this.writable.write(data);
        } catch (error) {
          this.handleError(error, msg);
          return Promise.reject(error);
        }
      }
      handleError(error, msg) {
        this.errorCount++;
        this.fireError(error, msg, this.errorCount);
      }
      end() {
        this.writable.end();
      }
    };
    exports.WriteableStreamMessageWriter = WriteableStreamMessageWriter;
  }
});

// node_modules/vscode-jsonrpc/lib/common/messageBuffer.js
var require_messageBuffer = __commonJS({
  "node_modules/vscode-jsonrpc/lib/common/messageBuffer.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractMessageBuffer = void 0;
    var CR = 13;
    var LF = 10;
    var CRLF = "\r\n";
    var AbstractMessageBuffer = class {
      _encoding;
      _chunks;
      _totalLength;
      constructor(encoding = "utf-8") {
        this._encoding = encoding;
        this._chunks = [];
        this._totalLength = 0;
      }
      get encoding() {
        return this._encoding;
      }
      append(chunk) {
        const toAppend = typeof chunk === "string" ? this.fromString(chunk, this._encoding) : chunk;
        this._chunks.push(toAppend);
        this._totalLength += toAppend.byteLength;
      }
      tryReadHeaders(lowerCaseKeys = false) {
        if (this._chunks.length === 0) {
          return void 0;
        }
        let state4 = 0;
        let chunkIndex = 0;
        let offset = 0;
        let chunkBytesRead = 0;
        row: while (chunkIndex < this._chunks.length) {
          const chunk = this._chunks[chunkIndex];
          offset = 0;
          while (offset < chunk.length) {
            const value = chunk[offset];
            switch (value) {
              case CR:
                switch (state4) {
                  case 0:
                    state4 = 1;
                    break;
                  case 2:
                    state4 = 3;
                    break;
                  default:
                    state4 = 0;
                }
                break;
              case LF:
                switch (state4) {
                  case 1:
                    state4 = 2;
                    break;
                  case 3:
                    state4 = 4;
                    offset++;
                    break row;
                  default:
                    state4 = 0;
                }
                break;
              default:
                state4 = 0;
            }
            offset++;
          }
          chunkBytesRead += chunk.byteLength;
          chunkIndex++;
        }
        if (state4 !== 4) {
          return void 0;
        }
        const buffer = this._read(chunkBytesRead + offset);
        const result = /* @__PURE__ */ new Map();
        const headers = this.toString(buffer, "ascii").split(CRLF);
        if (headers.length < 2) {
          return result;
        }
        for (let i = 0; i < headers.length - 2; i++) {
          const header = headers[i];
          const index = header.indexOf(":");
          if (index === -1) {
            throw new Error(`Message header must separate key and value using ':'
${header}`);
          }
          const key = header.substr(0, index);
          const value = header.substr(index + 1).trim();
          result.set(lowerCaseKeys ? key.toLowerCase() : key, value);
        }
        return result;
      }
      tryReadBody(length) {
        if (this._totalLength < length) {
          return void 0;
        }
        return this._read(length);
      }
      get numberOfBytes() {
        return this._totalLength;
      }
      _read(byteCount) {
        if (byteCount === 0) {
          return this.emptyBuffer();
        }
        if (byteCount > this._totalLength) {
          throw new Error(`Cannot read so many bytes!`);
        }
        if (this._chunks[0].byteLength === byteCount) {
          const chunk = this._chunks[0];
          this._chunks.shift();
          this._totalLength -= byteCount;
          return this.asNative(chunk);
        }
        if (this._chunks[0].byteLength > byteCount) {
          const chunk = this._chunks[0];
          const result2 = this.asNative(chunk, byteCount);
          this._chunks[0] = chunk.slice(byteCount);
          this._totalLength -= byteCount;
          return result2;
        }
        const result = this.allocNative(byteCount);
        let resultOffset = 0;
        const chunkIndex = 0;
        while (byteCount > 0) {
          const chunk = this._chunks[chunkIndex];
          if (chunk.byteLength > byteCount) {
            const chunkPart = chunk.slice(0, byteCount);
            result.set(chunkPart, resultOffset);
            resultOffset += byteCount;
            this._chunks[chunkIndex] = chunk.slice(byteCount);
            this._totalLength -= byteCount;
            byteCount -= byteCount;
          } else {
            result.set(chunk, resultOffset);
            resultOffset += chunk.byteLength;
            this._chunks.shift();
            this._totalLength -= chunk.byteLength;
            byteCount -= chunk.byteLength;
          }
        }
        return result;
      }
    };
    exports.AbstractMessageBuffer = AbstractMessageBuffer;
  }
});

// node_modules/vscode-jsonrpc/lib/common/connection.js
var require_connection = __commonJS({
  "node_modules/vscode-jsonrpc/lib/common/connection.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ConnectionOptions = exports.MessageStrategy = exports.CancellationStrategy = exports.CancellationSenderStrategy = exports.CancellationReceiverStrategy = exports.RequestCancellationReceiverStrategy = exports.IdCancellationReceiverStrategy = exports.ConnectionStrategy = exports.ConnectionError = exports.ConnectionErrors = exports.LogTraceNotification = exports.SetTraceNotification = exports.TraceFormat = exports.TraceValues = exports.TraceValue = exports.Trace = exports.NullLogger = exports.ProgressType = exports.ProgressToken = void 0;
    exports.createMessageConnection = createMessageConnection2;
    var ral_1 = __importDefault(require_ral());
    var Is = __importStar(require_is());
    var messages_1 = require_messages();
    var linkedMap_1 = require_linkedMap();
    var events_1 = require_events();
    var cancellation_1 = require_cancellation();
    var CancelNotification;
    (function(CancelNotification2) {
      CancelNotification2.type = new messages_1.NotificationType("$/cancelRequest");
    })(CancelNotification || (CancelNotification = {}));
    var ProgressToken;
    (function(ProgressToken2) {
      function is(value) {
        return typeof value === "string" || typeof value === "number";
      }
      ProgressToken2.is = is;
    })(ProgressToken || (exports.ProgressToken = ProgressToken = {}));
    var ProgressNotification;
    (function(ProgressNotification2) {
      ProgressNotification2.type = new messages_1.NotificationType("$/progress");
    })(ProgressNotification || (ProgressNotification = {}));
    var ProgressType = class {
      /**
       * Clients must not use these properties. They are here to ensure correct typing.
       * in TypeScript
       */
      __;
      _pr;
      constructor() {
      }
    };
    exports.ProgressType = ProgressType;
    var StarRequestHandler;
    (function(StarRequestHandler2) {
      function is(value) {
        return Is.func(value);
      }
      StarRequestHandler2.is = is;
    })(StarRequestHandler || (StarRequestHandler = {}));
    exports.NullLogger = Object.freeze({
      error: () => {
      },
      warn: () => {
      },
      info: () => {
      },
      log: () => {
      }
    });
    var Trace;
    (function(Trace2) {
      Trace2[Trace2["Off"] = 0] = "Off";
      Trace2[Trace2["Messages"] = 1] = "Messages";
      Trace2[Trace2["Compact"] = 2] = "Compact";
      Trace2[Trace2["Verbose"] = 3] = "Verbose";
    })(Trace || (exports.Trace = Trace = {}));
    var TraceValue;
    (function(TraceValue2) {
      TraceValue2.Off = "off";
      TraceValue2.Messages = "messages";
      TraceValue2.Compact = "compact";
      TraceValue2.Verbose = "verbose";
    })(TraceValue || (exports.TraceValue = TraceValue = {}));
    exports.TraceValues = TraceValue;
    (function(Trace2) {
      function fromString(value) {
        if (!Is.string(value)) {
          return Trace2.Off;
        }
        value = value.toLowerCase();
        switch (value) {
          case "off":
            return Trace2.Off;
          case "messages":
            return Trace2.Messages;
          case "compact":
            return Trace2.Compact;
          case "verbose":
            return Trace2.Verbose;
          default:
            return Trace2.Off;
        }
      }
      Trace2.fromString = fromString;
      function toString(value) {
        switch (value) {
          case Trace2.Off:
            return "off";
          case Trace2.Messages:
            return "messages";
          case Trace2.Compact:
            return "compact";
          case Trace2.Verbose:
            return "verbose";
          default:
            return "off";
        }
      }
      Trace2.toString = toString;
    })(Trace || (exports.Trace = Trace = {}));
    var TraceFormat;
    (function(TraceFormat2) {
      TraceFormat2["Text"] = "text";
      TraceFormat2["JSON"] = "json";
    })(TraceFormat || (exports.TraceFormat = TraceFormat = {}));
    (function(TraceFormat2) {
      function fromString(value) {
        if (!Is.string(value)) {
          return TraceFormat2.Text;
        }
        value = value.toLowerCase();
        if (value === "json") {
          return TraceFormat2.JSON;
        } else {
          return TraceFormat2.Text;
        }
      }
      TraceFormat2.fromString = fromString;
    })(TraceFormat || (exports.TraceFormat = TraceFormat = {}));
    var SetTraceNotification;
    (function(SetTraceNotification2) {
      SetTraceNotification2.type = new messages_1.NotificationType("$/setTrace");
    })(SetTraceNotification || (exports.SetTraceNotification = SetTraceNotification = {}));
    var LogTraceNotification;
    (function(LogTraceNotification2) {
      LogTraceNotification2.type = new messages_1.NotificationType("$/logTrace");
    })(LogTraceNotification || (exports.LogTraceNotification = LogTraceNotification = {}));
    var ConnectionErrors;
    (function(ConnectionErrors2) {
      ConnectionErrors2[ConnectionErrors2["Closed"] = 1] = "Closed";
      ConnectionErrors2[ConnectionErrors2["Disposed"] = 2] = "Disposed";
      ConnectionErrors2[ConnectionErrors2["AlreadyListening"] = 3] = "AlreadyListening";
    })(ConnectionErrors || (exports.ConnectionErrors = ConnectionErrors = {}));
    var ConnectionError = class _ConnectionError extends Error {
      code;
      constructor(code, message) {
        super(message);
        this.code = code;
        Object.setPrototypeOf(this, _ConnectionError.prototype);
      }
    };
    exports.ConnectionError = ConnectionError;
    var ConnectionStrategy;
    (function(ConnectionStrategy2) {
      function is(value) {
        const candidate = value;
        return candidate && Is.func(candidate.cancelUndispatched);
      }
      ConnectionStrategy2.is = is;
    })(ConnectionStrategy || (exports.ConnectionStrategy = ConnectionStrategy = {}));
    var IdCancellationReceiverStrategy;
    (function(IdCancellationReceiverStrategy2) {
      function is(value) {
        const candidate = value;
        return candidate && (candidate.kind === void 0 || candidate.kind === "id") && Is.func(candidate.createCancellationTokenSource) && (candidate.dispose === void 0 || Is.func(candidate.dispose));
      }
      IdCancellationReceiverStrategy2.is = is;
    })(IdCancellationReceiverStrategy || (exports.IdCancellationReceiverStrategy = IdCancellationReceiverStrategy = {}));
    var RequestCancellationReceiverStrategy;
    (function(RequestCancellationReceiverStrategy2) {
      function is(value) {
        const candidate = value;
        return candidate && candidate.kind === "request" && Is.func(candidate.createCancellationTokenSource) && (candidate.dispose === void 0 || Is.func(candidate.dispose));
      }
      RequestCancellationReceiverStrategy2.is = is;
    })(RequestCancellationReceiverStrategy || (exports.RequestCancellationReceiverStrategy = RequestCancellationReceiverStrategy = {}));
    var CancellationReceiverStrategy;
    (function(CancellationReceiverStrategy2) {
      CancellationReceiverStrategy2.Message = Object.freeze({
        createCancellationTokenSource(_) {
          return new cancellation_1.CancellationTokenSource();
        }
      });
      function is(value) {
        return IdCancellationReceiverStrategy.is(value) || RequestCancellationReceiverStrategy.is(value);
      }
      CancellationReceiverStrategy2.is = is;
    })(CancellationReceiverStrategy || (exports.CancellationReceiverStrategy = CancellationReceiverStrategy = {}));
    var CancellationSenderStrategy;
    (function(CancellationSenderStrategy2) {
      CancellationSenderStrategy2.Message = Object.freeze({
        sendCancellation(conn, id) {
          return conn.sendNotification(CancelNotification.type, { id });
        },
        cleanup(_) {
        }
      });
      function is(value) {
        const candidate = value;
        return candidate && Is.func(candidate.sendCancellation) && Is.func(candidate.cleanup);
      }
      CancellationSenderStrategy2.is = is;
    })(CancellationSenderStrategy || (exports.CancellationSenderStrategy = CancellationSenderStrategy = {}));
    var CancellationStrategy;
    (function(CancellationStrategy2) {
      CancellationStrategy2.Message = Object.freeze({
        receiver: CancellationReceiverStrategy.Message,
        sender: CancellationSenderStrategy.Message
      });
      function is(value) {
        const candidate = value;
        return candidate && CancellationReceiverStrategy.is(candidate.receiver) && CancellationSenderStrategy.is(candidate.sender);
      }
      CancellationStrategy2.is = is;
    })(CancellationStrategy || (exports.CancellationStrategy = CancellationStrategy = {}));
    var MessageStrategy;
    (function(MessageStrategy2) {
      function is(value) {
        const candidate = value;
        return candidate && Is.func(candidate.handleMessage);
      }
      MessageStrategy2.is = is;
    })(MessageStrategy || (exports.MessageStrategy = MessageStrategy = {}));
    var ConnectionOptions;
    (function(ConnectionOptions2) {
      function is(value) {
        const candidate = value;
        return candidate && (CancellationStrategy.is(candidate.cancellationStrategy) || ConnectionStrategy.is(candidate.connectionStrategy) || MessageStrategy.is(candidate.messageStrategy) || Is.number(candidate.maxParallelism));
      }
      ConnectionOptions2.is = is;
    })(ConnectionOptions || (exports.ConnectionOptions = ConnectionOptions = {}));
    var ConnectionState;
    (function(ConnectionState2) {
      ConnectionState2[ConnectionState2["New"] = 1] = "New";
      ConnectionState2[ConnectionState2["Listening"] = 2] = "Listening";
      ConnectionState2[ConnectionState2["Closed"] = 3] = "Closed";
      ConnectionState2[ConnectionState2["Disposed"] = 4] = "Disposed";
    })(ConnectionState || (ConnectionState = {}));
    function createMessageConnection2(messageReader, messageWriter, _logger, options) {
      const logger = _logger !== void 0 ? _logger : exports.NullLogger;
      let sequenceNumber = 0;
      let notificationSequenceNumber = 0;
      let unknownResponseSequenceNumber = 0;
      const version = "2.0";
      const maxParallelism = options?.maxParallelism ?? -1;
      let inFlight = 0;
      let starRequestHandler = void 0;
      const requestHandlers = /* @__PURE__ */ new Map();
      let starNotificationHandler = void 0;
      const notificationHandlers = /* @__PURE__ */ new Map();
      const progressHandlers = /* @__PURE__ */ new Map();
      let timer;
      let messageQueue = new linkedMap_1.LinkedMap();
      let responsePromises = /* @__PURE__ */ new Map();
      let knownCanceledRequests = /* @__PURE__ */ new Set();
      let requestTokens = /* @__PURE__ */ new Map();
      let trace = Trace.Off;
      let traceFormat = TraceFormat.Text;
      let tracer;
      let state4 = ConnectionState.New;
      const errorEmitter = new events_1.Emitter();
      const closeEmitter = new events_1.Emitter();
      const unhandledNotificationEmitter = new events_1.Emitter();
      const unhandledProgressEmitter = new events_1.Emitter();
      const disposeEmitter = new events_1.Emitter();
      const cancellationStrategy = options && options.cancellationStrategy ? options.cancellationStrategy : CancellationStrategy.Message;
      function cancelUndispatched(_message) {
        return void 0;
      }
      function isListening() {
        return state4 === ConnectionState.Listening;
      }
      function isClosed() {
        return state4 === ConnectionState.Closed;
      }
      function isDisposed() {
        return state4 === ConnectionState.Disposed;
      }
      function closeHandler() {
        if (state4 === ConnectionState.New || state4 === ConnectionState.Listening) {
          state4 = ConnectionState.Closed;
          closeEmitter.fire(void 0);
        }
      }
      function readErrorHandler(error) {
        errorEmitter.fire([error, void 0, void 0]);
      }
      function writeErrorHandler(data) {
        errorEmitter.fire(data);
      }
      messageReader.onClose(closeHandler);
      messageReader.onError(readErrorHandler);
      messageWriter.onClose(closeHandler);
      messageWriter.onError(writeErrorHandler);
      function createRequestQueueKey(id) {
        if (id === null) {
          throw new Error(`Can't send requests with id null since the response can't be correlated.`);
        }
        return "req-" + id.toString();
      }
      function createResponseQueueKey(id) {
        if (id === null) {
          return "res-unknown-" + (++unknownResponseSequenceNumber).toString();
        } else {
          return "res-" + id.toString();
        }
      }
      function createNotificationQueueKey() {
        return "not-" + (++notificationSequenceNumber).toString();
      }
      function addMessageToQueue(queue, message) {
        if (messages_1.Message.isRequest(message)) {
          queue.set(createRequestQueueKey(message.id), message);
        } else if (messages_1.Message.isResponse(message)) {
          if (maxParallelism === -1) {
            queue.set(createResponseQueueKey(message.id), message);
          } else {
            handleResponse(message);
          }
        } else {
          queue.set(createNotificationQueueKey(), message);
        }
      }
      function triggerMessageQueue() {
        if (timer || messageQueue.size === 0) {
          return;
        }
        if (maxParallelism !== -1 && inFlight >= maxParallelism) {
          return;
        }
        timer = (0, ral_1.default)().timer.setImmediate(async () => {
          timer = void 0;
          if (messageQueue.size === 0) {
            return;
          }
          if (maxParallelism !== -1 && inFlight >= maxParallelism) {
            return;
          }
          const message = messageQueue.shift();
          let result;
          try {
            inFlight++;
            const messageStrategy = options?.messageStrategy;
            if (MessageStrategy.is(messageStrategy)) {
              result = messageStrategy.handleMessage(message, handleMessage);
            } else {
              result = handleMessage(message);
            }
          } catch (error) {
            logger.error(`Processing message queue failed: ${error.toString()}`);
          } finally {
            if (result instanceof Promise) {
              result.then(() => {
                inFlight--;
                triggerMessageQueue();
              }).catch((error) => {
                logger.error(`Processing message queue failed: ${error.toString()}`);
              });
            } else {
              inFlight--;
            }
            triggerMessageQueue();
          }
        });
      }
      async function handleMessage(message) {
        if (messages_1.Message.isRequest(message)) {
          return handleRequest(message);
        } else if (messages_1.Message.isNotification(message)) {
          return handleNotification(message);
        } else if (messages_1.Message.isResponse(message)) {
          return handleResponse(message);
        } else {
          return handleInvalidMessage(message);
        }
      }
      const callback = (message) => {
        try {
          if (messages_1.Message.isNotification(message) && message.method === CancelNotification.type.method) {
            const cancelId = message.params.id;
            const key = createRequestQueueKey(cancelId);
            const toCancel = messageQueue.get(key);
            if (messages_1.Message.isRequest(toCancel)) {
              const strategy = options?.connectionStrategy;
              const response = strategy && strategy.cancelUndispatched ? strategy.cancelUndispatched(toCancel, cancelUndispatched) : cancelUndispatched(toCancel);
              if (response && (response.error !== void 0 || response.result !== void 0)) {
                messageQueue.delete(key);
                requestTokens.delete(cancelId);
                response.id = toCancel.id;
                traceSendingResponse(response, message.method, Date.now());
                messageWriter.write(response).catch(() => logger.error(`Sending response for canceled message failed.`));
                return;
              }
            }
            const cancellationToken = requestTokens.get(cancelId);
            if (cancellationToken !== void 0) {
              cancellationToken.cancel();
              traceReceivedNotification(message);
              return;
            } else {
              knownCanceledRequests.add(cancelId);
            }
          }
          addMessageToQueue(messageQueue, message);
        } finally {
          triggerMessageQueue();
        }
      };
      async function handleRequest(requestMessage) {
        if (isDisposed()) {
          return Promise.resolve();
        }
        function reply(resultOrError, method, startTime2) {
          const message = {
            jsonrpc: version,
            id: requestMessage.id
          };
          if (resultOrError instanceof messages_1.ResponseError) {
            message.error = resultOrError.toJson();
          } else {
            message.result = resultOrError === void 0 ? null : resultOrError;
          }
          traceSendingResponse(message, method, startTime2);
          return messageWriter.write(message);
        }
        function replyError(error, method, startTime2) {
          const message = {
            jsonrpc: version,
            id: requestMessage.id,
            error: error.toJson()
          };
          traceSendingResponse(message, method, startTime2);
          return messageWriter.write(message);
        }
        traceReceivedRequest(requestMessage);
        const element = requestHandlers.get(requestMessage.method);
        let type;
        let requestHandler;
        if (element) {
          type = element.type;
          requestHandler = element.handler;
        }
        const startTime = Date.now();
        if (requestHandler || starRequestHandler) {
          const tokenKey = requestMessage.id ?? String(Date.now());
          const cancellationSource = IdCancellationReceiverStrategy.is(cancellationStrategy.receiver) ? cancellationStrategy.receiver.createCancellationTokenSource(tokenKey) : cancellationStrategy.receiver.createCancellationTokenSource(requestMessage);
          if (requestMessage.id !== null && knownCanceledRequests.has(requestMessage.id)) {
            cancellationSource.cancel();
          }
          if (requestMessage.id !== null) {
            requestTokens.set(tokenKey, cancellationSource);
          }
          try {
            let handlerResult;
            if (requestHandler) {
              if (requestMessage.params === void 0) {
                if (type !== void 0 && type.numberOfParams !== 0) {
                  return replyError(new messages_1.ResponseError(messages_1.ErrorCodes.InvalidParams, `Request ${requestMessage.method} defines ${type.numberOfParams} params but received none.`), requestMessage.method, startTime);
                }
                handlerResult = requestHandler(cancellationSource.token);
              } else if (Array.isArray(requestMessage.params)) {
                if (type !== void 0 && type.parameterStructures === messages_1.ParameterStructures.byName) {
                  return replyError(new messages_1.ResponseError(messages_1.ErrorCodes.InvalidParams, `Request ${requestMessage.method} defines parameters by name but received parameters by position`), requestMessage.method, startTime);
                }
                handlerResult = requestHandler(...requestMessage.params, cancellationSource.token);
              } else {
                if (type !== void 0 && type.parameterStructures === messages_1.ParameterStructures.byPosition) {
                  return replyError(new messages_1.ResponseError(messages_1.ErrorCodes.InvalidParams, `Request ${requestMessage.method} defines parameters by position but received parameters by name`), requestMessage.method, startTime);
                }
                handlerResult = requestHandler(requestMessage.params, cancellationSource.token);
              }
            } else if (starRequestHandler) {
              handlerResult = starRequestHandler(requestMessage.method, requestMessage.params, cancellationSource.token);
            }
            const resultOrError = await handlerResult;
            await reply(resultOrError, requestMessage.method, startTime);
          } catch (error) {
            if (error instanceof messages_1.ResponseError) {
              await reply(error, requestMessage.method, startTime);
            } else if (error && Is.string(error.message)) {
              await replyError(new messages_1.ResponseError(messages_1.ErrorCodes.InternalError, `Request ${requestMessage.method} failed with message: ${error.message}`), requestMessage.method, startTime);
            } else {
              await replyError(new messages_1.ResponseError(messages_1.ErrorCodes.InternalError, `Request ${requestMessage.method} failed unexpectedly without providing any details.`), requestMessage.method, startTime);
            }
          } finally {
            requestTokens.delete(tokenKey);
          }
        } else {
          await replyError(new messages_1.ResponseError(messages_1.ErrorCodes.MethodNotFound, `Unhandled method ${requestMessage.method}`), requestMessage.method, startTime);
        }
      }
      function handleResponse(responseMessage) {
        if (isDisposed()) {
          return;
        }
        if (responseMessage.id === null) {
          if (responseMessage.error) {
            logger.error(`Received response message without id: Error is: 
${JSON.stringify(responseMessage.error, void 0, 4)}`);
          } else {
            logger.error(`Received response message without id. No further error information provided.`);
          }
        } else {
          const key = responseMessage.id;
          const responsePromise = responsePromises.get(key);
          traceReceivedResponse(responseMessage, responsePromise);
          if (responsePromise !== void 0) {
            responsePromises.delete(key);
            try {
              if (responseMessage.error) {
                const error = responseMessage.error;
                responsePromise.reject(new messages_1.ResponseError(error.code, error.message, error.data));
              } else if (responseMessage.result !== void 0) {
                responsePromise.resolve(responseMessage.result);
              } else {
                throw new Error("Should never happen.");
              }
            } catch (error) {
              if (error.message) {
                logger.error(`Response handler '${responsePromise.method}' failed with message: ${error.message}`);
              } else {
                logger.error(`Response handler '${responsePromise.method}' failed unexpectedly.`);
              }
            }
          }
        }
      }
      async function handleNotification(message) {
        if (isDisposed()) {
          return;
        }
        let type = void 0;
        let notificationHandler;
        if (message.method === CancelNotification.type.method) {
          const cancelId = message.params.id;
          knownCanceledRequests.delete(cancelId);
          traceReceivedNotification(message);
          return;
        } else {
          const element = notificationHandlers.get(message.method);
          if (element) {
            notificationHandler = element.handler;
            type = element.type;
          }
        }
        if (notificationHandler || starNotificationHandler) {
          try {
            traceReceivedNotification(message);
            if (notificationHandler) {
              if (message.params === void 0) {
                if (type !== void 0) {
                  if (type.numberOfParams !== 0 && type.parameterStructures !== messages_1.ParameterStructures.byName) {
                    logger.error(`Notification ${message.method} defines ${type.numberOfParams} params but received none.`);
                  }
                }
                await notificationHandler();
              } else if (Array.isArray(message.params)) {
                const params = message.params;
                if (message.method === ProgressNotification.type.method && params.length === 2 && ProgressToken.is(params[0])) {
                  await notificationHandler({ token: params[0], value: params[1] });
                } else {
                  if (type !== void 0) {
                    if (type.parameterStructures === messages_1.ParameterStructures.byName) {
                      logger.error(`Notification ${message.method} defines parameters by name but received parameters by position`);
                    }
                    if (type.numberOfParams !== message.params.length) {
                      logger.error(`Notification ${message.method} defines ${type.numberOfParams} params but received ${params.length} arguments`);
                    }
                  }
                  await notificationHandler(...params);
                }
              } else {
                if (type !== void 0 && type.parameterStructures === messages_1.ParameterStructures.byPosition) {
                  logger.error(`Notification ${message.method} defines parameters by position but received parameters by name`);
                }
                await notificationHandler(message.params);
              }
            } else if (starNotificationHandler) {
              await starNotificationHandler(message.method, message.params);
            }
          } catch (error) {
            if (error.message) {
              logger.error(`Notification handler '${message.method}' failed with message: ${error.message}`);
            } else {
              logger.error(`Notification handler '${message.method}' failed unexpectedly.`);
            }
          }
        } else {
          unhandledNotificationEmitter.fire(message);
        }
      }
      function handleInvalidMessage(message) {
        if (!message) {
          logger.error("Received empty message.");
          return;
        }
        logger.error(`Received message which is neither a response nor a notification message:
${JSON.stringify(message, null, 4)}`);
        const responseMessage = message;
        if (Is.string(responseMessage.id) || Is.number(responseMessage.id)) {
          const key = responseMessage.id;
          const responseHandler = responsePromises.get(key);
          if (responseHandler) {
            responseHandler.reject(new Error("The received response has neither a result nor an error property."));
          }
        }
      }
      function stringifyTrace(params) {
        if (params === void 0 || params === null) {
          return void 0;
        }
        switch (trace) {
          case Trace.Verbose:
            return JSON.stringify(params, null, 4);
          case Trace.Compact:
            return JSON.stringify(params);
          default:
            return void 0;
        }
      }
      function traceSendingRequest(message) {
        if (trace === Trace.Off || !tracer) {
          return;
        }
        if (traceFormat === TraceFormat.Text) {
          let data = void 0;
          if ((trace === Trace.Verbose || trace === Trace.Compact) && message.params) {
            data = `Params: ${stringifyTrace(message.params)}`;
          }
          tracer.log(`Sending request '${message.method} - (${message.id})'.`, data);
        } else {
          logLSPMessage("send-request", message);
        }
      }
      function traceSendingNotification(message) {
        if (trace === Trace.Off || !tracer) {
          return;
        }
        if (traceFormat === TraceFormat.Text) {
          let data = void 0;
          if (trace === Trace.Verbose || trace === Trace.Compact) {
            if (message.params) {
              data = `Params: ${stringifyTrace(message.params)}`;
            } else {
              data = "No parameters provided.";
            }
          }
          tracer.log(`Sending notification '${message.method}'.`, data);
        } else {
          logLSPMessage("send-notification", message);
        }
      }
      function traceSendingResponse(message, method, startTime) {
        if (trace === Trace.Off || !tracer) {
          return;
        }
        if (traceFormat === TraceFormat.Text) {
          let data = void 0;
          if (trace === Trace.Verbose || trace === Trace.Compact) {
            if (message.error && message.error.data) {
              data = `Error data: ${stringifyTrace(message.error.data)}`;
            } else {
              if (message.result) {
                data = `Result: ${stringifyTrace(message.result)}`;
              } else if (message.error === void 0) {
                data = "No result returned.";
              }
            }
          }
          const error = message.error ? ` Request failed: ${message.error.message} (${message.error.code}).` : "";
          tracer.log(`Sending response '${method} - (${message.id})'. Processing request took ${Date.now() - startTime}ms.${error}`, data);
        } else {
          logLSPMessage("send-response", message);
        }
      }
      function traceReceivedRequest(message) {
        if (trace === Trace.Off || !tracer) {
          return;
        }
        if (traceFormat === TraceFormat.Text) {
          let data = void 0;
          if ((trace === Trace.Verbose || trace === Trace.Compact) && message.params) {
            data = `Params: ${stringifyTrace(message.params)}`;
          }
          tracer.log(`Received request '${message.method} - (${message.id})'.`, data);
        } else {
          logLSPMessage("receive-request", message);
        }
      }
      function traceReceivedNotification(message) {
        if (trace === Trace.Off || !tracer || message.method === LogTraceNotification.type.method) {
          return;
        }
        if (traceFormat === TraceFormat.Text) {
          let data = void 0;
          if (trace === Trace.Verbose || trace === Trace.Compact) {
            if (message.params) {
              data = `Params: ${stringifyTrace(message.params)}`;
            } else {
              data = "No parameters provided.";
            }
          }
          tracer.log(`Received notification '${message.method}'.`, data);
        } else {
          logLSPMessage("receive-notification", message);
        }
      }
      function traceReceivedResponse(message, responsePromise) {
        if (trace === Trace.Off || !tracer) {
          return;
        }
        if (traceFormat === TraceFormat.Text) {
          let data = void 0;
          if (trace === Trace.Verbose || trace === Trace.Compact) {
            if (message.error && message.error.data) {
              data = `Error data: ${stringifyTrace(message.error.data)}`;
            } else {
              if (message.result) {
                data = `Result: ${stringifyTrace(message.result)}`;
              } else if (message.error === void 0) {
                data = "No result returned.";
              }
            }
          }
          if (responsePromise) {
            const error = message.error ? ` Request failed: ${message.error.message} (${message.error.code}).` : "";
            tracer.log(`Received response '${responsePromise.method} - (${message.id})' in ${Date.now() - responsePromise.timerStart}ms.${error}`, data);
          } else {
            tracer.log(`Received response ${message.id} without active response promise.`, data);
          }
        } else {
          logLSPMessage("receive-response", message);
        }
      }
      function logLSPMessage(type, message) {
        if (!tracer || trace === Trace.Off) {
          return;
        }
        const lspMessage = {
          isLSPMessage: true,
          type,
          message,
          timestamp: Date.now()
        };
        tracer.log(lspMessage);
      }
      function throwIfClosedOrDisposed() {
        if (isClosed()) {
          throw new ConnectionError(ConnectionErrors.Closed, "Connection is closed.");
        }
        if (isDisposed()) {
          throw new ConnectionError(ConnectionErrors.Disposed, "Connection is disposed.");
        }
      }
      function throwIfListening() {
        if (isListening()) {
          throw new ConnectionError(ConnectionErrors.AlreadyListening, "Connection is already listening");
        }
      }
      function throwIfNotListening() {
        if (!isListening()) {
          throw new Error("Call listen() first.");
        }
      }
      function undefinedToNull(param) {
        if (param === void 0) {
          return null;
        } else {
          return param;
        }
      }
      function nullToUndefined(param) {
        if (param === null) {
          return void 0;
        } else {
          return param;
        }
      }
      function isNamedParam(param) {
        return param !== void 0 && param !== null && !Array.isArray(param) && typeof param === "object";
      }
      function computeSingleParam(parameterStructures, param) {
        switch (parameterStructures) {
          case messages_1.ParameterStructures.auto:
            if (isNamedParam(param)) {
              return nullToUndefined(param);
            } else {
              return [undefinedToNull(param)];
            }
          case messages_1.ParameterStructures.byName:
            if (!isNamedParam(param)) {
              throw new Error(`Received parameters by name but param is not an object literal.`);
            }
            return nullToUndefined(param);
          case messages_1.ParameterStructures.byPosition:
            return [undefinedToNull(param)];
          default:
            throw new Error(`Unknown parameter structure ${parameterStructures.toString()}`);
        }
      }
      function computeMessageParams(type, params) {
        let result;
        const numberOfParams = type.numberOfParams;
        switch (numberOfParams) {
          case 0:
            result = void 0;
            break;
          case 1:
            result = computeSingleParam(type.parameterStructures, params[0]);
            break;
          default:
            result = [];
            for (let i = 0; i < params.length && i < numberOfParams; i++) {
              result.push(undefinedToNull(params[i]));
            }
            if (params.length < numberOfParams) {
              for (let i = params.length; i < numberOfParams; i++) {
                result.push(null);
              }
            }
            break;
        }
        return result;
      }
      const connection = {
        sendNotification: (type, ...args) => {
          throwIfClosedOrDisposed();
          let method;
          let messageParams;
          if (Is.string(type)) {
            method = type;
            const first = args[0];
            let paramStart = 0;
            let parameterStructures = messages_1.ParameterStructures.auto;
            if (messages_1.ParameterStructures.is(first)) {
              paramStart = 1;
              parameterStructures = first;
            }
            const paramEnd = args.length;
            const numberOfParams = paramEnd - paramStart;
            switch (numberOfParams) {
              case 0:
                messageParams = void 0;
                break;
              case 1:
                messageParams = computeSingleParam(parameterStructures, args[paramStart]);
                break;
              default:
                if (parameterStructures === messages_1.ParameterStructures.byName) {
                  throw new Error(`Received ${numberOfParams} parameters for 'by Name' notification parameter structure.`);
                }
                messageParams = args.slice(paramStart, paramEnd).map((value) => undefinedToNull(value));
                break;
            }
          } else {
            const params = args;
            method = type.method;
            messageParams = computeMessageParams(type, params);
          }
          const notificationMessage = {
            jsonrpc: version,
            method,
            params: messageParams
          };
          traceSendingNotification(notificationMessage);
          return messageWriter.write(notificationMessage).catch((error) => {
            logger.error(`Sending notification failed.`);
            throw error;
          });
        },
        onNotification: (type, handler) => {
          throwIfClosedOrDisposed();
          let method;
          if (Is.func(type)) {
            starNotificationHandler = type;
          } else if (handler) {
            if (Is.string(type)) {
              method = type;
              notificationHandlers.set(type, { type: void 0, handler });
            } else {
              method = type.method;
              notificationHandlers.set(type.method, { type, handler });
            }
          }
          return {
            dispose: () => {
              if (method !== void 0) {
                if (notificationHandlers.get(method)?.handler === handler) {
                  notificationHandlers.delete(method);
                }
              } else if (starNotificationHandler === type) {
                starNotificationHandler = void 0;
              }
            }
          };
        },
        onProgress: (_type, token, handler) => {
          if (progressHandlers.has(token)) {
            throw new Error(`Progress handler for token ${token} already registered`);
          }
          progressHandlers.set(token, handler);
          return {
            dispose: () => {
              if (progressHandlers.get(token) === handler) {
                progressHandlers.delete(token);
              }
            }
          };
        },
        sendProgress: (_type, token, value) => {
          return connection.sendNotification(ProgressNotification.type, { token, value });
        },
        onUnhandledProgress: unhandledProgressEmitter.event,
        sendRequest: (type, ...args) => {
          throwIfClosedOrDisposed();
          throwIfNotListening();
          function sendCancellation(connection2, id2) {
            const p = cancellationStrategy.sender.sendCancellation(connection2, id2);
            if (p === void 0) {
              logger.log(`Received no promise from cancellation strategy when cancelling id ${id2}`);
            } else {
              p.catch(() => {
                logger.log(`Sending cancellation messages for id ${id2} failed.`);
              });
            }
          }
          let method;
          let messageParams;
          let token = void 0;
          if (Is.string(type)) {
            method = type;
            const first = args[0];
            const last = args[args.length - 1];
            let paramStart = 0;
            let parameterStructures = messages_1.ParameterStructures.auto;
            if (messages_1.ParameterStructures.is(first)) {
              paramStart = 1;
              parameterStructures = first;
            }
            let paramEnd = args.length;
            if (cancellation_1.CancellationToken.is(last)) {
              paramEnd = paramEnd - 1;
              token = last;
            }
            const numberOfParams = paramEnd - paramStart;
            switch (numberOfParams) {
              case 0:
                messageParams = void 0;
                break;
              case 1:
                messageParams = computeSingleParam(parameterStructures, args[paramStart]);
                break;
              default:
                if (parameterStructures === messages_1.ParameterStructures.byName) {
                  throw new Error(`Received ${numberOfParams} parameters for 'by Name' request parameter structure.`);
                }
                messageParams = args.slice(paramStart, paramEnd).map((value) => undefinedToNull(value));
                break;
            }
          } else {
            const params = args;
            method = type.method;
            messageParams = computeMessageParams(type, params);
            const numberOfParams = type.numberOfParams;
            token = cancellation_1.CancellationToken.is(params[numberOfParams]) ? params[numberOfParams] : void 0;
          }
          const id = sequenceNumber++;
          let disposable;
          let tokenWasCancelled = false;
          if (token !== void 0) {
            if (token.isCancellationRequested) {
              tokenWasCancelled = true;
            } else {
              disposable = token.onCancellationRequested(() => {
                sendCancellation(connection, id);
              });
            }
          }
          const requestMessage = {
            jsonrpc: version,
            id,
            method,
            params: messageParams
          };
          traceSendingRequest(requestMessage);
          if (typeof cancellationStrategy.sender.enableCancellation === "function") {
            cancellationStrategy.sender.enableCancellation(requestMessage);
          }
          return new Promise(async (resolve9, reject) => {
            const resolveWithCleanup = (r) => {
              resolve9(r);
              cancellationStrategy.sender.cleanup(id);
              disposable?.dispose();
            };
            const rejectWithCleanup = (r) => {
              reject(r);
              cancellationStrategy.sender.cleanup(id);
              disposable?.dispose();
            };
            const responsePromise = { method, timerStart: Date.now(), resolve: resolveWithCleanup, reject: rejectWithCleanup };
            try {
              responsePromises.set(id, responsePromise);
              await messageWriter.write(requestMessage);
              if (tokenWasCancelled) {
                sendCancellation(connection, id);
              }
            } catch (error) {
              responsePromises.delete(id);
              responsePromise.reject(new messages_1.ResponseError(messages_1.ErrorCodes.MessageWriteError, error.message ? error.message : "Unknown reason"));
              logger.error(`Sending request failed.`);
            }
          });
        },
        onRequest: (type, handler) => {
          throwIfClosedOrDisposed();
          let method = null;
          if (StarRequestHandler.is(type)) {
            method = void 0;
            starRequestHandler = type;
          } else if (Is.string(type)) {
            method = null;
            if (handler !== void 0) {
              method = type;
              requestHandlers.set(type, { handler, type: void 0 });
            }
          } else {
            if (handler !== void 0) {
              method = type.method;
              requestHandlers.set(type.method, { type, handler });
            }
          }
          return {
            dispose: () => {
              if (method === null) {
                return;
              }
              if (method !== void 0) {
                if (requestHandlers.get(method)?.handler === handler) {
                  requestHandlers.delete(method);
                }
              } else if (starRequestHandler === type) {
                starRequestHandler = void 0;
              }
            }
          };
        },
        hasPendingResponse: () => {
          return responsePromises.size > 0;
        },
        trace: async (_value, _tracer, sendNotificationOrTraceOptions) => {
          let _sendNotification = false;
          let _traceFormat = TraceFormat.Text;
          if (sendNotificationOrTraceOptions !== void 0) {
            if (Is.boolean(sendNotificationOrTraceOptions)) {
              _sendNotification = sendNotificationOrTraceOptions;
            } else {
              _sendNotification = sendNotificationOrTraceOptions.sendNotification || false;
              _traceFormat = sendNotificationOrTraceOptions.traceFormat || TraceFormat.Text;
            }
          }
          trace = _value;
          traceFormat = _traceFormat;
          if (trace === Trace.Off) {
            tracer = void 0;
          } else {
            tracer = _tracer;
          }
          if (_sendNotification && !isClosed() && !isDisposed()) {
            await connection.sendNotification(SetTraceNotification.type, { value: Trace.toString(_value) });
          }
        },
        onError: errorEmitter.event,
        onClose: closeEmitter.event,
        onUnhandledNotification: unhandledNotificationEmitter.event,
        onDispose: disposeEmitter.event,
        end: () => {
          messageWriter.end();
        },
        dispose: () => {
          if (isDisposed()) {
            return;
          }
          state4 = ConnectionState.Disposed;
          disposeEmitter.fire(void 0);
          const error = new messages_1.ResponseError(messages_1.ErrorCodes.PendingResponseRejected, "Pending response rejected since connection got disposed");
          for (const promise of responsePromises.values()) {
            promise.reject(error);
          }
          responsePromises = /* @__PURE__ */ new Map();
          requestTokens = /* @__PURE__ */ new Map();
          knownCanceledRequests = /* @__PURE__ */ new Set();
          messageQueue = new linkedMap_1.LinkedMap();
          if (Is.func(messageWriter.dispose)) {
            messageWriter.dispose();
          }
          if (Is.func(messageReader.dispose)) {
            messageReader.dispose();
          }
        },
        listen: () => {
          throwIfClosedOrDisposed();
          throwIfListening();
          state4 = ConnectionState.Listening;
          messageReader.listen(callback);
        },
        inspect: () => {
          (0, ral_1.default)().console.log("inspect");
        }
      };
      connection.onNotification(LogTraceNotification.type, (params) => {
        if (trace === Trace.Off || !tracer) {
          return;
        }
        const verbose = trace === Trace.Verbose || trace === Trace.Compact;
        tracer.log(params.message, verbose ? params.verbose : void 0);
      });
      connection.onNotification(ProgressNotification.type, async (params) => {
        const handler = progressHandlers.get(params.token);
        if (handler) {
          await handler(params.value);
        } else {
          unhandledProgressEmitter.fire(params);
        }
      });
      return connection;
    }
  }
});

// node_modules/vscode-jsonrpc/lib/common/api.js
var require_api = __commonJS({
  "node_modules/vscode-jsonrpc/lib/common/api.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ProgressType = exports.ProgressToken = exports.createMessageConnection = exports.NullLogger = exports.ConnectionOptions = exports.ConnectionStrategy = exports.AbstractMessageBuffer = exports.WriteableStreamMessageWriter = exports.AbstractMessageWriter = exports.MessageWriter = exports.ReadableStreamMessageReader = exports.AbstractMessageReader = exports.MessageReader = exports.SharedArrayReceiverStrategy = exports.SharedArraySenderStrategy = exports.CancellationToken = exports.CancellationTokenSource = exports.Emitter = exports.Event = exports.Disposable = exports.LRUCache = exports.Touch = exports.LinkedMap = exports.ParameterStructures = exports.NotificationType9 = exports.NotificationType8 = exports.NotificationType7 = exports.NotificationType6 = exports.NotificationType5 = exports.NotificationType4 = exports.NotificationType3 = exports.NotificationType2 = exports.NotificationType1 = exports.NotificationType0 = exports.NotificationType = exports.ErrorCodes = exports.ResponseError = exports.RequestType9 = exports.RequestType8 = exports.RequestType7 = exports.RequestType6 = exports.RequestType5 = exports.RequestType4 = exports.RequestType3 = exports.RequestType2 = exports.RequestType1 = exports.RequestType0 = exports.RequestType = exports.Message = exports.RAL = void 0;
    exports.MessageStrategy = exports.CancellationStrategy = exports.CancellationSenderStrategy = exports.RequestCancellationReceiverStrategy = exports.IdCancellationReceiverStrategy = exports.CancellationReceiverStrategy = exports.ConnectionError = exports.ConnectionErrors = exports.LogTraceNotification = exports.SetTraceNotification = exports.TraceFormat = exports.TraceValues = exports.TraceValue = exports.Trace = void 0;
    var messages_1 = require_messages();
    Object.defineProperty(exports, "Message", { enumerable: true, get: function() {
      return messages_1.Message;
    } });
    Object.defineProperty(exports, "RequestType", { enumerable: true, get: function() {
      return messages_1.RequestType;
    } });
    Object.defineProperty(exports, "RequestType0", { enumerable: true, get: function() {
      return messages_1.RequestType0;
    } });
    Object.defineProperty(exports, "RequestType1", { enumerable: true, get: function() {
      return messages_1.RequestType1;
    } });
    Object.defineProperty(exports, "RequestType2", { enumerable: true, get: function() {
      return messages_1.RequestType2;
    } });
    Object.defineProperty(exports, "RequestType3", { enumerable: true, get: function() {
      return messages_1.RequestType3;
    } });
    Object.defineProperty(exports, "RequestType4", { enumerable: true, get: function() {
      return messages_1.RequestType4;
    } });
    Object.defineProperty(exports, "RequestType5", { enumerable: true, get: function() {
      return messages_1.RequestType5;
    } });
    Object.defineProperty(exports, "RequestType6", { enumerable: true, get: function() {
      return messages_1.RequestType6;
    } });
    Object.defineProperty(exports, "RequestType7", { enumerable: true, get: function() {
      return messages_1.RequestType7;
    } });
    Object.defineProperty(exports, "RequestType8", { enumerable: true, get: function() {
      return messages_1.RequestType8;
    } });
    Object.defineProperty(exports, "RequestType9", { enumerable: true, get: function() {
      return messages_1.RequestType9;
    } });
    Object.defineProperty(exports, "ResponseError", { enumerable: true, get: function() {
      return messages_1.ResponseError;
    } });
    Object.defineProperty(exports, "ErrorCodes", { enumerable: true, get: function() {
      return messages_1.ErrorCodes;
    } });
    Object.defineProperty(exports, "NotificationType", { enumerable: true, get: function() {
      return messages_1.NotificationType;
    } });
    Object.defineProperty(exports, "NotificationType0", { enumerable: true, get: function() {
      return messages_1.NotificationType0;
    } });
    Object.defineProperty(exports, "NotificationType1", { enumerable: true, get: function() {
      return messages_1.NotificationType1;
    } });
    Object.defineProperty(exports, "NotificationType2", { enumerable: true, get: function() {
      return messages_1.NotificationType2;
    } });
    Object.defineProperty(exports, "NotificationType3", { enumerable: true, get: function() {
      return messages_1.NotificationType3;
    } });
    Object.defineProperty(exports, "NotificationType4", { enumerable: true, get: function() {
      return messages_1.NotificationType4;
    } });
    Object.defineProperty(exports, "NotificationType5", { enumerable: true, get: function() {
      return messages_1.NotificationType5;
    } });
    Object.defineProperty(exports, "NotificationType6", { enumerable: true, get: function() {
      return messages_1.NotificationType6;
    } });
    Object.defineProperty(exports, "NotificationType7", { enumerable: true, get: function() {
      return messages_1.NotificationType7;
    } });
    Object.defineProperty(exports, "NotificationType8", { enumerable: true, get: function() {
      return messages_1.NotificationType8;
    } });
    Object.defineProperty(exports, "NotificationType9", { enumerable: true, get: function() {
      return messages_1.NotificationType9;
    } });
    Object.defineProperty(exports, "ParameterStructures", { enumerable: true, get: function() {
      return messages_1.ParameterStructures;
    } });
    var linkedMap_1 = require_linkedMap();
    Object.defineProperty(exports, "LinkedMap", { enumerable: true, get: function() {
      return linkedMap_1.LinkedMap;
    } });
    Object.defineProperty(exports, "LRUCache", { enumerable: true, get: function() {
      return linkedMap_1.LRUCache;
    } });
    Object.defineProperty(exports, "Touch", { enumerable: true, get: function() {
      return linkedMap_1.Touch;
    } });
    var disposable_1 = require_disposable();
    Object.defineProperty(exports, "Disposable", { enumerable: true, get: function() {
      return disposable_1.Disposable;
    } });
    var events_1 = require_events();
    Object.defineProperty(exports, "Event", { enumerable: true, get: function() {
      return events_1.Event;
    } });
    Object.defineProperty(exports, "Emitter", { enumerable: true, get: function() {
      return events_1.Emitter;
    } });
    var cancellation_1 = require_cancellation();
    Object.defineProperty(exports, "CancellationTokenSource", { enumerable: true, get: function() {
      return cancellation_1.CancellationTokenSource;
    } });
    Object.defineProperty(exports, "CancellationToken", { enumerable: true, get: function() {
      return cancellation_1.CancellationToken;
    } });
    var sharedArrayCancellation_1 = require_sharedArrayCancellation();
    Object.defineProperty(exports, "SharedArraySenderStrategy", { enumerable: true, get: function() {
      return sharedArrayCancellation_1.SharedArraySenderStrategy;
    } });
    Object.defineProperty(exports, "SharedArrayReceiverStrategy", { enumerable: true, get: function() {
      return sharedArrayCancellation_1.SharedArrayReceiverStrategy;
    } });
    var messageReader_1 = require_messageReader();
    Object.defineProperty(exports, "MessageReader", { enumerable: true, get: function() {
      return messageReader_1.MessageReader;
    } });
    Object.defineProperty(exports, "AbstractMessageReader", { enumerable: true, get: function() {
      return messageReader_1.AbstractMessageReader;
    } });
    Object.defineProperty(exports, "ReadableStreamMessageReader", { enumerable: true, get: function() {
      return messageReader_1.ReadableStreamMessageReader;
    } });
    var messageWriter_1 = require_messageWriter();
    Object.defineProperty(exports, "MessageWriter", { enumerable: true, get: function() {
      return messageWriter_1.MessageWriter;
    } });
    Object.defineProperty(exports, "AbstractMessageWriter", { enumerable: true, get: function() {
      return messageWriter_1.AbstractMessageWriter;
    } });
    Object.defineProperty(exports, "WriteableStreamMessageWriter", { enumerable: true, get: function() {
      return messageWriter_1.WriteableStreamMessageWriter;
    } });
    var messageBuffer_1 = require_messageBuffer();
    Object.defineProperty(exports, "AbstractMessageBuffer", { enumerable: true, get: function() {
      return messageBuffer_1.AbstractMessageBuffer;
    } });
    var connection_1 = require_connection();
    Object.defineProperty(exports, "ConnectionStrategy", { enumerable: true, get: function() {
      return connection_1.ConnectionStrategy;
    } });
    Object.defineProperty(exports, "ConnectionOptions", { enumerable: true, get: function() {
      return connection_1.ConnectionOptions;
    } });
    Object.defineProperty(exports, "NullLogger", { enumerable: true, get: function() {
      return connection_1.NullLogger;
    } });
    Object.defineProperty(exports, "createMessageConnection", { enumerable: true, get: function() {
      return connection_1.createMessageConnection;
    } });
    Object.defineProperty(exports, "ProgressToken", { enumerable: true, get: function() {
      return connection_1.ProgressToken;
    } });
    Object.defineProperty(exports, "ProgressType", { enumerable: true, get: function() {
      return connection_1.ProgressType;
    } });
    Object.defineProperty(exports, "Trace", { enumerable: true, get: function() {
      return connection_1.Trace;
    } });
    Object.defineProperty(exports, "TraceValue", { enumerable: true, get: function() {
      return connection_1.TraceValue;
    } });
    Object.defineProperty(exports, "TraceFormat", { enumerable: true, get: function() {
      return connection_1.TraceFormat;
    } });
    Object.defineProperty(exports, "SetTraceNotification", { enumerable: true, get: function() {
      return connection_1.SetTraceNotification;
    } });
    Object.defineProperty(exports, "LogTraceNotification", { enumerable: true, get: function() {
      return connection_1.LogTraceNotification;
    } });
    Object.defineProperty(exports, "ConnectionErrors", { enumerable: true, get: function() {
      return connection_1.ConnectionErrors;
    } });
    Object.defineProperty(exports, "ConnectionError", { enumerable: true, get: function() {
      return connection_1.ConnectionError;
    } });
    Object.defineProperty(exports, "CancellationReceiverStrategy", { enumerable: true, get: function() {
      return connection_1.CancellationReceiverStrategy;
    } });
    Object.defineProperty(exports, "IdCancellationReceiverStrategy", { enumerable: true, get: function() {
      return connection_1.IdCancellationReceiverStrategy;
    } });
    Object.defineProperty(exports, "RequestCancellationReceiverStrategy", { enumerable: true, get: function() {
      return connection_1.RequestCancellationReceiverStrategy;
    } });
    Object.defineProperty(exports, "CancellationSenderStrategy", { enumerable: true, get: function() {
      return connection_1.CancellationSenderStrategy;
    } });
    Object.defineProperty(exports, "CancellationStrategy", { enumerable: true, get: function() {
      return connection_1.CancellationStrategy;
    } });
    Object.defineProperty(exports, "MessageStrategy", { enumerable: true, get: function() {
      return connection_1.MessageStrategy;
    } });
    Object.defineProperty(exports, "TraceValues", { enumerable: true, get: function() {
      return connection_1.TraceValues;
    } });
    var ral_1 = __importDefault(require_ral());
    exports.RAL = ral_1.default;
  }
});

// node_modules/vscode-jsonrpc/lib/node/ril.js
var require_ril = __commonJS({
  "node_modules/vscode-jsonrpc/lib/node/ril.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var util_1 = __require("util");
    var api_1 = require_api();
    var MessageBuffer = class _MessageBuffer extends api_1.AbstractMessageBuffer {
      static emptyBuffer = Buffer.allocUnsafe(0);
      constructor(encoding = "utf-8") {
        super(encoding);
      }
      emptyBuffer() {
        return _MessageBuffer.emptyBuffer;
      }
      fromString(value, encoding) {
        return Buffer.from(value, encoding);
      }
      toString(value, encoding) {
        if (value instanceof Buffer) {
          return value.toString(encoding);
        } else {
          return new util_1.TextDecoder(encoding).decode(value);
        }
      }
      asNative(buffer, length) {
        if (length === void 0) {
          return buffer instanceof Buffer ? buffer : Buffer.from(buffer);
        } else {
          return buffer instanceof Buffer ? buffer.slice(0, length) : Buffer.from(buffer, 0, length);
        }
      }
      allocNative(length) {
        return Buffer.allocUnsafe(length);
      }
    };
    var ReadableStreamWrapper = class {
      stream;
      constructor(stream) {
        this.stream = stream;
      }
      onClose(listener) {
        this.stream.on("close", listener);
        return api_1.Disposable.create(() => this.stream.off("close", listener));
      }
      onError(listener) {
        this.stream.on("error", listener);
        return api_1.Disposable.create(() => this.stream.off("error", listener));
      }
      onEnd(listener) {
        this.stream.on("end", listener);
        return api_1.Disposable.create(() => this.stream.off("end", listener));
      }
      onData(listener) {
        this.stream.on("data", listener);
        return api_1.Disposable.create(() => this.stream.off("data", listener));
      }
    };
    var WritableStreamWrapper = class {
      stream;
      constructor(stream) {
        this.stream = stream;
      }
      onClose(listener) {
        this.stream.on("close", listener);
        return api_1.Disposable.create(() => this.stream.off("close", listener));
      }
      onError(listener) {
        this.stream.on("error", listener);
        return api_1.Disposable.create(() => this.stream.off("error", listener));
      }
      onEnd(listener) {
        this.stream.on("end", listener);
        return api_1.Disposable.create(() => this.stream.off("end", listener));
      }
      write(data, encoding) {
        return new Promise((resolve9, reject) => {
          const callback = (error) => {
            if (error === void 0 || error === null) {
              resolve9();
            } else {
              reject(error);
            }
          };
          if (typeof data === "string") {
            this.stream.write(data, encoding, callback);
          } else {
            this.stream.write(data, callback);
          }
        });
      }
      end() {
        this.stream.end();
      }
    };
    var _ril = Object.freeze({
      messageBuffer: Object.freeze({
        create: (encoding) => new MessageBuffer(encoding)
      }),
      applicationJson: Object.freeze({
        encoder: Object.freeze({
          name: "application/json",
          encode: (msg, options) => {
            try {
              return Promise.resolve(Buffer.from(JSON.stringify(msg, void 0, 0), options.charset));
            } catch (err) {
              return Promise.reject(err);
            }
          }
        }),
        decoder: Object.freeze({
          name: "application/json",
          decode: (buffer, options) => {
            try {
              if (buffer instanceof Buffer) {
                return Promise.resolve(JSON.parse(buffer.toString(options.charset)));
              } else {
                return Promise.resolve(JSON.parse(new util_1.TextDecoder(options.charset).decode(buffer)));
              }
            } catch (err) {
              return Promise.reject(err);
            }
          }
        })
      }),
      stream: Object.freeze({
        asReadableStream: (stream) => new ReadableStreamWrapper(stream),
        asWritableStream: (stream) => new WritableStreamWrapper(stream)
      }),
      console,
      timer: Object.freeze({
        setTimeout(callback, ms, ...args) {
          const handle = setTimeout(callback, ms, ...args);
          return { dispose: () => clearTimeout(handle) };
        },
        setImmediate(callback, ...args) {
          const handle = setImmediate(callback, ...args);
          return { dispose: () => clearImmediate(handle) };
        },
        setInterval(callback, ms, ...args) {
          const handle = setInterval(callback, ms, ...args);
          return { dispose: () => clearInterval(handle) };
        }
      })
    });
    function RIL() {
      return _ril;
    }
    (function(RIL2) {
      function install() {
        api_1.RAL.install(_ril);
      }
      RIL2.install = install;
    })(RIL || (RIL = {}));
    exports.default = RIL;
  }
});

// node_modules/vscode-jsonrpc/lib/node/main.js
var require_main = __commonJS({
  "node_modules/vscode-jsonrpc/lib/node/main.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StreamMessageWriter = exports.StreamMessageReader = exports.SocketMessageWriter = exports.SocketMessageReader = exports.PortMessageWriter = exports.PortMessageReader = exports.IPCMessageWriter = exports.IPCMessageReader = void 0;
    exports.generateRandomPipeName = generateRandomPipeName;
    exports.createClientPipeTransport = createClientPipeTransport;
    exports.createServerPipeTransport = createServerPipeTransport;
    exports.createClientSocketTransport = createClientSocketTransport;
    exports.createServerSocketTransport = createServerSocketTransport;
    exports.createMessageConnection = createMessageConnection2;
    var ril_1 = __importDefault(require_ril());
    ril_1.default.install();
    var path17 = __importStar(__require("path"));
    var os3 = __importStar(__require("os"));
    var fs14 = __importStar(__require("fs"));
    var crypto_1 = __require("crypto");
    var net_1 = __require("net");
    var api_1 = require_api();
    __exportStar(require_api(), exports);
    var IPCMessageReader = class extends api_1.AbstractMessageReader {
      process;
      constructor(process2) {
        super();
        this.process = process2;
        const eventEmitter = this.process;
        eventEmitter.on("error", (error) => this.fireError(error));
        eventEmitter.on("close", () => this.fireClose());
      }
      listen(callback) {
        this.process.on("message", callback);
        return api_1.Disposable.create(() => this.process.off("message", callback));
      }
    };
    exports.IPCMessageReader = IPCMessageReader;
    var IPCMessageWriter = class extends api_1.AbstractMessageWriter {
      process;
      errorCount;
      constructor(process2) {
        super();
        this.process = process2;
        this.errorCount = 0;
        const eventEmitter = this.process;
        eventEmitter.on("error", (error) => this.fireError(error));
        eventEmitter.on("close", () => this.fireClose);
      }
      write(msg) {
        try {
          if (typeof this.process.send === "function") {
            this.process.send(msg, void 0, void 0, (error) => {
              if (error) {
                this.errorCount++;
                this.handleError(error, msg);
              } else {
                this.errorCount = 0;
              }
            });
          }
          return Promise.resolve();
        } catch (error) {
          this.handleError(error, msg);
          return Promise.reject(error);
        }
      }
      handleError(error, msg) {
        this.errorCount++;
        this.fireError(error, msg, this.errorCount);
      }
      end() {
      }
    };
    exports.IPCMessageWriter = IPCMessageWriter;
    var PortMessageReader = class extends api_1.AbstractMessageReader {
      onData;
      constructor(port) {
        super();
        this.onData = new api_1.Emitter();
        port.on("close", () => this.fireClose);
        port.on("error", (error) => this.fireError(error));
        port.on("message", (message) => {
          this.onData.fire(message);
        });
      }
      listen(callback) {
        return this.onData.event(callback);
      }
    };
    exports.PortMessageReader = PortMessageReader;
    var PortMessageWriter = class extends api_1.AbstractMessageWriter {
      port;
      errorCount;
      constructor(port) {
        super();
        this.port = port;
        this.errorCount = 0;
        port.on("close", () => this.fireClose());
        port.on("error", (error) => this.fireError(error));
      }
      write(msg) {
        try {
          this.port.postMessage(msg);
          return Promise.resolve();
        } catch (error) {
          this.handleError(error, msg);
          return Promise.reject(error);
        }
      }
      handleError(error, msg) {
        this.errorCount++;
        this.fireError(error, msg, this.errorCount);
      }
      end() {
      }
    };
    exports.PortMessageWriter = PortMessageWriter;
    var SocketMessageReader = class extends api_1.ReadableStreamMessageReader {
      constructor(socket, encoding = "utf-8") {
        super((0, ril_1.default)().stream.asReadableStream(socket), encoding);
      }
    };
    exports.SocketMessageReader = SocketMessageReader;
    var SocketMessageWriter = class extends api_1.WriteableStreamMessageWriter {
      socket;
      constructor(socket, options) {
        super((0, ril_1.default)().stream.asWritableStream(socket), options);
        this.socket = socket;
      }
      dispose() {
        super.dispose();
        this.socket.destroy();
      }
    };
    exports.SocketMessageWriter = SocketMessageWriter;
    var StreamMessageReader2 = class extends api_1.ReadableStreamMessageReader {
      constructor(readable, encoding) {
        super((0, ril_1.default)().stream.asReadableStream(readable), encoding);
      }
    };
    exports.StreamMessageReader = StreamMessageReader2;
    var StreamMessageWriter2 = class extends api_1.WriteableStreamMessageWriter {
      constructor(writable, options) {
        super((0, ril_1.default)().stream.asWritableStream(writable), options);
      }
    };
    exports.StreamMessageWriter = StreamMessageWriter2;
    var XDG_RUNTIME_DIR = process.env["XDG_RUNTIME_DIR"];
    var safeIpcPathLengths = /* @__PURE__ */ new Map([
      ["linux", 107],
      ["darwin", 102]
    ]);
    function generateRandomPipeName() {
      if (process.platform === "win32") {
        return `\\\\.\\pipe\\lsp-${(0, crypto_1.randomBytes)(16).toString("hex")}-sock`;
      }
      let randomLength = 32;
      const fixedLength = "/lsp-.sock".length;
      const tmpDir = fs14.realpathSync(XDG_RUNTIME_DIR ?? os3.tmpdir());
      const limit = safeIpcPathLengths.get(process.platform);
      if (limit !== void 0) {
        randomLength = Math.min(limit - tmpDir.length - fixedLength, randomLength);
      }
      if (randomLength < 16) {
        throw new Error(`Unable to generate a random pipe name with ${randomLength} characters.`);
      }
      const randomSuffix = (0, crypto_1.randomBytes)(Math.floor(randomLength / 2)).toString("hex");
      return path17.join(tmpDir, `lsp-${randomSuffix}.sock`);
    }
    function createClientPipeTransport(pipeName, encoding = "utf-8") {
      let connectResolve;
      const connected = new Promise((resolve9, _reject) => {
        connectResolve = resolve9;
      });
      return new Promise((resolve9, reject) => {
        const server = (0, net_1.createServer)((socket) => {
          server.close();
          connectResolve([
            new SocketMessageReader(socket, encoding),
            new SocketMessageWriter(socket, encoding)
          ]);
        });
        server.on("error", reject);
        server.listen(pipeName, () => {
          server.removeListener("error", reject);
          resolve9({
            onConnected: () => {
              return connected;
            }
          });
        });
      });
    }
    function createServerPipeTransport(pipeName, encoding = "utf-8") {
      const socket = (0, net_1.createConnection)(pipeName);
      return [
        new SocketMessageReader(socket, encoding),
        new SocketMessageWriter(socket, encoding)
      ];
    }
    function createClientSocketTransport(port, encoding = "utf-8") {
      let connectResolve;
      const connected = new Promise((resolve9, _reject) => {
        connectResolve = resolve9;
      });
      return new Promise((resolve9, reject) => {
        const server = (0, net_1.createServer)((socket) => {
          server.close();
          connectResolve([
            new SocketMessageReader(socket, encoding),
            new SocketMessageWriter(socket, encoding)
          ]);
        });
        server.on("error", reject);
        server.listen(port, "127.0.0.1", () => {
          server.removeListener("error", reject);
          const address = server.address();
          if (address === null || typeof address === "string") {
            reject(new Error(`Unexpected server address: ${address}`));
            return;
          }
          const boundPort = address.port;
          resolve9({
            port: () => boundPort,
            onConnected: () => {
              return connected;
            }
          });
        });
      });
    }
    function createServerSocketTransport(port, encoding = "utf-8") {
      const socket = (0, net_1.createConnection)(port, "127.0.0.1");
      return [
        new SocketMessageReader(socket, encoding),
        new SocketMessageWriter(socket, encoding)
      ];
    }
    function isReadableStream(value) {
      const candidate = value;
      return candidate.read !== void 0 && candidate.addListener !== void 0;
    }
    function isWritableStream(value) {
      const candidate = value;
      return candidate.write !== void 0 && candidate.addListener !== void 0;
    }
    function createMessageConnection2(input, output, logger, options) {
      if (!logger) {
        logger = api_1.NullLogger;
      }
      const reader = isReadableStream(input) ? new StreamMessageReader2(input) : input;
      const writer3 = isWritableStream(output) ? new StreamMessageWriter2(output) : output;
      if (api_1.ConnectionStrategy.is(options)) {
        options = { connectionStrategy: options };
      }
      return (0, api_1.createMessageConnection)(reader, writer3, logger, options);
    }
  }
});

// dist/clients/cascade-types.js
var CASCADE_DIAGNOSTICS_TTL_MS = 24e4;

// dist/clients/lsp/index.js
import * as nodeFs2 from "node:fs";
import fs13 from "node:fs/promises";
import path16 from "node:path";
import { pathToFileURL as pathToFileURL3, URL as URL3 } from "node:url";

// dist/clients/widget-state.js
import { readFileSync as readFileSync7 } from "node:fs";
import { stat } from "node:fs/promises";
import { pathToFileURL } from "node:url";

// dist/clients/diagnostic-line-freshness.js
import * as fs from "node:fs";

// dist/clients/stale-marker.js
var STALE_LINE_MARKER = "[stale \u2014 re-run to confirm]";

// dist/clients/diagnostic-line-freshness.js
var PAST_EOF_STALE_MARKER = `${STALE_LINE_MARKER} \u2014 line past EOF`;
var MAX_LOGGED_PAST_EOF_LINES = 3;
var MAX_GATE_BYTES = 4 * 1024 * 1024;
var NEWLINE_SCAN_CHUNK_BYTES = 64 * 1024;
var NEWLINE_BYTE = 10;
var MAX_SHARED_CACHE_ENTRIES = 512;
var sharedLineCountCache = new BoundedFifoMap(MAX_SHARED_CACHE_ENTRIES);
function rememberInSharedCache(cache2, filePath, entry) {
  cache2.set(filePath, entry);
}
function countNewlinesChunked(filePath, sizeBytes) {
  const fd = fs.openSync(filePath, "r");
  try {
    const buffer = Buffer.allocUnsafe(Math.min(NEWLINE_SCAN_CHUNK_BYTES, sizeBytes) || 1);
    let newlineCount = 0;
    let position = 0;
    while (position < sizeBytes) {
      const bytesRead = fs.readSync(fd, buffer, 0, buffer.length, position);
      if (bytesRead <= 0)
        break;
      for (let i = 0; i < bytesRead; i++) {
        if (buffer[i] === NEWLINE_BYTE)
          newlineCount++;
      }
      position += bytesRead;
    }
    return newlineCount;
  } finally {
    fs.closeSync(fd);
  }
}
function getCachedLineCount(filePath, cache2 = sharedLineCountCache) {
  let stat2;
  try {
    stat2 = fs.statSync(filePath);
  } catch {
    return void 0;
  }
  if (stat2.size === 0)
    return void 0;
  const cached = cache2.get(filePath);
  if (cached && cached.mtimeMs === stat2.mtimeMs && cached.size === stat2.size) {
    return cached.lineCount;
  }
  if (stat2.size > MAX_GATE_BYTES)
    return void 0;
  let newlineCount;
  try {
    newlineCount = countNewlinesChunked(filePath, stat2.size);
  } catch {
    return void 0;
  }
  const lineCount = newlineCount + 1;
  rememberInSharedCache(cache2, filePath, {
    mtimeMs: stat2.mtimeMs,
    size: stat2.size,
    lineCount
  });
  return lineCount;
}
function demotePastEofDiagnostics(args) {
  const { diagnostics } = args;
  if (diagnostics.length === 0) {
    return { diagnostics: [], demotedCount: 0 };
  }
  const lineCount = getCachedLineCount(args.filePath, args.lineCountCache ?? sharedLineCountCache);
  if (lineCount === void 0) {
    return { diagnostics: [...diagnostics], demotedCount: 0 };
  }
  const risingEdgeLines = [];
  const out = diagnostics.map((d) => {
    if (d.stale && d.staleReason !== void 0 && d.staleReason !== "past-eof")
      return d;
    const isPastEof = typeof d.line === "number" && d.line > lineCount;
    if (isPastEof === !!d.stale)
      return d;
    if (isPastEof)
      risingEdgeLines.push(d.line);
    return {
      ...d,
      stale: isPastEof,
      staleReason: isPastEof ? "past-eof" : void 0
    };
  });
  if (risingEdgeLines.length === 0) {
    return { diagnostics: out, demotedCount: 0 };
  }
  let sizeBytes;
  try {
    sizeBytes = fs.statSync(args.filePath).size;
  } catch {
    sizeBytes = 0;
  }
  logLatency({
    type: "phase",
    phase: "diagnostic_past_eof",
    filePath: args.cwd,
    durationMs: 0,
    metadata: {
      store: args.store,
      file: toProjectRelativePath(args.filePath, args.cwd),
      sizeBytes,
      actualLineCount: lineCount,
      demotedCount: risingEdgeLines.length,
      sampleCitedLines: risingEdgeLines.slice(0, MAX_LOGGED_PAST_EOF_LINES)
    }
  });
  if (args.resync) {
    try {
      args.resync(args.filePath);
    } catch {
    }
  }
  return { diagnostics: out, demotedCount: risingEdgeLines.length };
}
function resyncDocumentOnPastEof(filePath) {
  void (async () => {
    try {
      const [{ getOwnedLspService: getOwnedLspService2 }, content] = await Promise.all([
        import("./chunk-3JNKMP3B.js"),
        fs.promises.readFile(filePath, "utf-8")
      ]);
      await getOwnedLspService2().openFile(filePath, content, { preserveDiagnostics: false });
    } catch {
    }
  })();
}

// dist/clients/deps/pi-tui.js
import { Text, truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";

// dist/clients/write-ordering-guard.js
function writeOrderToken(turnIndex, writeIndex) {
  return turnIndex === void 0 || writeIndex === void 0 ? void 0 : turnIndex * 2 ** 32 + writeIndex;
}
var WriteOrderingGuard = class {
  lastSeen = /* @__PURE__ */ new Map();
  /**
   * Returns `true` if a write with `token` for `key` should proceed, and
   * `false` if it's superseded (a write with a higher token for the same
   * key was already recorded) and should be dropped.
   *
   * On `true` with a defined `token`, records it as the new last-seen value
   * for `key` — including on a tie (a write whose token matches the last
   * recorded one is not superseded, and re-recording the same token is a
   * no-op either way). The very first write for a key always proceeds
   * (nothing to compare against yet).
   */
  shouldWrite(key, token) {
    if (token === void 0)
      return true;
    const last = this.lastSeen.get(key);
    if (last !== void 0 && token < last)
      return false;
    this.lastSeen.set(key, token);
    return true;
  }
  /** Allocate the next ordered position for a writer admitted without a token. */
  nextToken(key) {
    const last = this.lastSeen.get(key);
    const next = (last ?? 0) + 1;
    this.lastSeen.set(key, next);
    return next;
  }
  /** Drop tracked ordering state for `key` (e.g. on cache eviction). */
  delete(key) {
    this.lastSeen.delete(key);
  }
  /** Drop all tracked ordering state. */
  clear() {
    this.lastSeen.clear();
  }
};

// dist/clients/blocker-freshness.js
import { createHash } from "node:crypto";
import * as fs4 from "node:fs";

// dist/clients/review-graph/import-resolvers.js
import * as fs3 from "node:fs";
import * as path2 from "node:path";

// dist/clients/review-graph/tsconfig-paths.js
import * as fs2 from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
var cache = new BoundedLruCache(64);
var referencesCache = new BoundedLruCache(64);
registerWorkspaceTopologyReset(() => {
  cache.clear();
  referencesCache.clear();
});
function parseJsonc(content) {
  let output = "";
  let inString = false;
  let escaped = false;
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const next = content[i + 1];
    if (inString) {
      output += char;
      if (escaped)
        escaped = false;
      else if (char === "\\")
        escaped = true;
      else if (char === '"')
        inString = false;
      continue;
    }
    if (char === '"') {
      inString = true;
      output += char;
    } else if (char === "/" && next === "/") {
      while (i < content.length && content[i] !== "\n")
        i++;
      output += "\n";
    } else if (char === "/" && next === "*") {
      i += 2;
      while (i < content.length && !(content[i] === "*" && content[i + 1] === "/"))
        i++;
      i++;
    } else {
      output += char;
    }
  }
  return JSON.parse(output.replace(/,\s*([}\]])/g, "$1"));
}
function configSignature(configPath) {
  try {
    const stat2 = fs2.statSync(configPath);
    return `${stat2.mtimeMs}:${stat2.size}`;
  } catch {
    return "missing";
  }
}
function configDependencyPaths(configPath) {
  const paths = /* @__PURE__ */ new Set();
  const visit = (currentPath) => {
    const normalized = path.resolve(currentPath);
    if (paths.has(normalized))
      return;
    paths.add(normalized);
    let json;
    try {
      json = parseJsonc(fs2.readFileSync(normalized, "utf8"));
    } catch {
      return;
    }
    if (typeof json.extends === "string") {
      const parent = resolveExtends(normalized, json.extends);
      if (parent)
        visit(parent);
    }
    for (const reference of json.references ?? []) {
      if (typeof reference?.path !== "string")
        continue;
      const referenced = resolveReferenceConfig(normalized, reference.path);
      if (referenced)
        visit(referenced);
    }
  };
  visit(configPath);
  return [...paths].sort((a, b) => a.localeCompare(b));
}
function dependencySignature(configPath) {
  return configDependencyPaths(configPath).map((dependency) => `${dependency}:${configSignature(dependency)}`).join("|");
}
function resolveExtends(configPath, value) {
  if (!value.startsWith("."))
    return void 0;
  const resolved2 = path.resolve(path.dirname(configPath), value);
  return resolved2.toLowerCase().endsWith(".json") ? resolved2 : `${resolved2}.json`;
}
function readConfig(configPath, seen) {
  const normalized = path.resolve(configPath);
  if (seen.has(normalized))
    return void 0;
  seen.add(normalized);
  let json;
  try {
    json = parseJsonc(fs2.readFileSync(normalized, "utf8"));
  } catch {
    return void 0;
  }
  let inherited;
  if (typeof json.extends === "string") {
    const parentPath = resolveExtends(normalized, json.extends);
    if (parentPath)
      inherited = readConfig(parentPath, seen);
  }
  const options = json.compilerOptions;
  const baseUrl = typeof options?.baseUrl === "string" ? path.resolve(path.dirname(normalized), options.baseUrl) : inherited?.baseUrl ?? path.dirname(normalized);
  const paths = options?.paths && typeof options.paths === "object" ? Object.fromEntries(Object.entries(options.paths).map(([pattern, targets]) => [
    pattern,
    Array.isArray(targets) ? targets.map((target) => path.resolve(baseUrl, target)) : targets
  ])) : inherited?.paths;
  const rootDir = typeof options?.rootDir === "string" ? path.resolve(path.dirname(normalized), options.rootDir) : inherited?.rootDir;
  const include = Array.isArray(json.include) ? json.include.filter((value) => typeof value === "string") : inherited?.include;
  const references = Array.isArray(json.references) ? json.references.map((reference) => reference?.path).filter((value) => typeof value === "string" && value.startsWith(".")) : [];
  return { baseUrl, paths, rootDir, include, references };
}
function resolveReferenceConfig(configPath, value) {
  const target = path.resolve(path.dirname(configPath), value);
  try {
    if (fs2.statSync(target).isDirectory()) {
      return getDirectoryMarkers(target).tsconfigPath;
    }
    if (fs2.statSync(target).isFile())
      return target;
  } catch {
    return void 0;
  }
  return void 0;
}
function includeRoot(configDir, pattern) {
  const wildcard = pattern.search(/[*?]/);
  const prefix = wildcard === -1 ? pattern : pattern.slice(0, wildcard);
  const trimmed = prefix.replace(/[\\/]+$/, "");
  if (!trimmed)
    return void 0;
  const resolved2 = path.resolve(configDir, trimmed);
  return path.extname(resolved2) ? path.dirname(resolved2) : resolved2;
}
function firstSourceEntry(configPath, parsed) {
  const configDir = path.dirname(configPath);
  const roots = [
    ...parsed.rootDir ? [parsed.rootDir] : [],
    ...(parsed.include ?? []).map((pattern) => includeRoot(configDir, pattern)).filter((value) => value !== void 0)
  ];
  const candidates = [
    ...roots.flatMap((root) => [
      path.join(root, "index.ts"),
      path.join(root, "index.tsx")
    ]),
    path.join(configDir, "src", "index.ts"),
    path.join(configDir, "src", "index.tsx"),
    path.join(configDir, "index.ts"),
    path.join(configDir, "index.tsx")
  ];
  for (const candidate of candidates) {
    try {
      if (fs2.statSync(candidate).isFile())
        return candidate;
    } catch {
    }
  }
  return void 0;
}
function collectReferencedProjects(configPath, result, visited) {
  const normalized = path.resolve(configPath);
  if (visited.has(normalized))
    return;
  visited.add(normalized);
  const parsed = readConfig(normalized, /* @__PURE__ */ new Set());
  if (!parsed)
    return;
  for (const reference of parsed.references) {
    const referencedConfig = resolveReferenceConfig(normalized, reference);
    if (!referencedConfig)
      continue;
    const referenced = readConfig(referencedConfig, /* @__PURE__ */ new Set());
    if (referenced) {
      const packageJsonPath = getDirectoryMarkers(path.dirname(referencedConfig)).packageJsonPath;
      const entry = firstSourceEntry(referencedConfig, referenced);
      if (packageJsonPath && entry) {
        try {
          const pkg = JSON.parse(fs2.readFileSync(packageJsonPath, "utf8"));
          if (typeof pkg.name === "string" && !result.has(pkg.name)) {
            result.set(pkg.name, entry);
          }
        } catch {
        }
      }
    }
    collectReferencedProjects(referencedConfig, result, visited);
  }
}
function parseTsconfigPaths(cwd, homeDir = os.homedir()) {
  const normalizedCwd = path.resolve(cwd);
  const configDir = findGoverningTsconfigDir(normalizedCwd, homeDir);
  const configPath = configDir ? path.join(configDir, "tsconfig.json") : "";
  const signature = configPath ? dependencySignature(configPath) : "missing";
  const key = `${normalizedCwd}|${configPath}|${signature}`;
  const cached = cache.get(key);
  if (cached)
    return cached;
  if (!configDir) {
    cache.set(key, []);
    return [];
  }
  const parsed = readConfig(path.join(configDir, "tsconfig.json"), /* @__PURE__ */ new Set());
  const matchers = Object.entries(parsed?.paths ?? {}).filter((entry) => Array.isArray(entry[1]) && entry[1].every((target) => typeof target === "string")).map(([pattern, targets]) => {
    const star = pattern.indexOf("*");
    return {
      pattern,
      prefix: star === -1 ? pattern : pattern.slice(0, star),
      suffix: star === -1 ? "" : pattern.slice(star + 1),
      targets
    };
  }).sort((a, b) => b.prefix.length - a.prefix.length);
  cache.set(key, matchers);
  return matchers;
}
function aliasedImportTargets(specifier, importerDir) {
  for (const matcher of parseTsconfigPaths(importerDir)) {
    if (!specifier.startsWith(matcher.prefix) || !specifier.endsWith(matcher.suffix))
      continue;
    const wildcard = specifier.slice(matcher.prefix.length, specifier.length - matcher.suffix.length);
    if (!matcher.pattern.includes("*") && wildcard)
      continue;
    return matcher.targets.map((target) => target.replaceAll("*", wildcard));
  }
  return [];
}
function referencedProjectImportTarget(specifier, importerDir) {
  const normalizedImporterDir = path.resolve(importerDir);
  const governingDir = findGoverningTsconfigDir(normalizedImporterDir);
  const governingPath = governingDir ? path.join(governingDir, "tsconfig.json") : "";
  const key = `${normalizedImporterDir}|${governingPath}|${governingPath ? dependencySignature(governingPath) : "missing"}`;
  let projects = referencesCache.get(key);
  if (!projects) {
    projects = /* @__PURE__ */ new Map();
    const configDir = governingDir;
    if (configDir) {
      collectReferencedProjects(path.join(configDir, "tsconfig.json"), projects, /* @__PURE__ */ new Set());
    }
    referencesCache.set(key, projects);
  }
  return projects.get(specifier);
}

// dist/clients/review-graph/import-resolvers.js
function isWithin(cwd, p) {
  return isUnderDir(path2.resolve(p), path2.resolve(cwd));
}
function isFile(p) {
  try {
    return fs3.statSync(p).isFile();
  } catch {
    return false;
  }
}
function isDir(p) {
  try {
    return fs3.statSync(p).isDirectory();
  } catch {
    return false;
  }
}
function firstExistingFile(cwd, candidates) {
  for (const c of candidates) {
    if (isFile(c) && isWithin(cwd, c))
      return [normalizeMapKey(c)];
  }
  return [];
}
function sourceFilesIn(cwd, dir, ext) {
  if (!isDir(dir) || !isWithin(cwd, dir))
    return [];
  try {
    return fs3.readdirSync(dir).filter((n) => n.endsWith(ext)).map((n) => normalizeMapKey(path2.join(dir, n))).sort();
  } catch {
    return [];
  }
}
function resolveRelative(cwd, filePath, source, exts) {
  const base = path2.resolve(path2.dirname(filePath), source);
  return firstExistingFile(cwd, [base, ...exts.map((e) => base + e)]);
}
function resolveDart(cwd, filePath, source) {
  if (source.startsWith("package:") || source.startsWith("dart:"))
    return [];
  return resolveRelative(cwd, filePath, source, [".dart"]);
}
var JS_TS_EXT_RE = /\.(mjs|cjs|mts|cts|jsx?|tsx?)$/i;
function jsTsExtensionCandidates(base, strippedBase, ext) {
  const candidates = [];
  if (ext === ".mjs")
    candidates.push(`${strippedBase}.mts`);
  if (ext === ".cjs")
    candidates.push(`${strippedBase}.cts`);
  if (ext === ".mts")
    candidates.push(`${strippedBase}.mts`);
  if (ext === ".cts")
    candidates.push(`${strippedBase}.cts`);
  candidates.push(`${strippedBase}.ts`, `${strippedBase}.tsx`, `${strippedBase}.mts`, `${strippedBase}.cts`);
  candidates.push(base, `${strippedBase}.js`, `${strippedBase}.jsx`, `${strippedBase}.mjs`, `${strippedBase}.cjs`);
  for (const index of [
    "index.ts",
    "index.tsx",
    "index.mts",
    "index.cts",
    "index.js",
    "index.jsx",
    "index.mjs",
    "index.cjs"
  ]) {
    candidates.push(path2.join(base, index));
  }
  return [...new Set(candidates)];
}
function jsTsCandidatePaths(filePath, source) {
  const base = path2.resolve(path2.dirname(filePath), source);
  const strippedSource = source.replace(JS_TS_EXT_RE, "");
  const strippedBase = strippedSource === source ? base : path2.resolve(path2.dirname(filePath), strippedSource);
  const ext = path2.extname(source).toLowerCase();
  return jsTsExtensionCandidates(base, strippedBase, ext);
}
function findWorkspaceModuleForSpecifier(modules, source) {
  let best;
  for (const mod of modules) {
    let subpath;
    if (source === mod.name)
      subpath = "";
    else if (source.startsWith(`${mod.name}/`))
      subpath = source.slice(mod.name.length + 1);
    if (subpath === void 0)
      continue;
    if (!best || mod.name.length > best.mod.name.length)
      best = { mod, subpath };
  }
  return best;
}
function pickExportsMain(exportsField) {
  if (typeof exportsField === "string")
    return exportsField;
  if (!exportsField || typeof exportsField !== "object")
    return void 0;
  const obj = exportsField;
  const dot = obj["."] ?? obj;
  if (typeof dot === "string")
    return dot;
  if (dot && typeof dot === "object") {
    for (const key of ["import", "require", "default"]) {
      const v = dot[key];
      if (typeof v === "string")
        return v;
    }
  }
  return void 0;
}
function workspaceEntryCandidates(pkgRoot) {
  let main;
  try {
    const pkg = JSON.parse(fs3.readFileSync(path2.join(pkgRoot, "package.json"), "utf-8"));
    main = pickExportsMain(pkg.exports) ?? pkg.module ?? pkg.main;
  } catch {
  }
  const candidates = [];
  if (main) {
    const mainPath = path2.resolve(pkgRoot, main);
    const ext = path2.extname(mainPath).toLowerCase();
    const stripped = mainPath.replace(JS_TS_EXT_RE, "");
    candidates.push(...jsTsExtensionCandidates(mainPath, stripped, ext));
  }
  for (const base of [pkgRoot, path2.join(pkgRoot, "src")]) {
    candidates.push(path2.join(base, "index.ts"), path2.join(base, "index.tsx"), path2.join(base, "index.mts"), path2.join(base, "index.cts"), path2.join(base, "index.js"), path2.join(base, "index.jsx"), path2.join(base, "index.mjs"), path2.join(base, "index.cjs"));
  }
  return [...new Set(candidates)];
}
function workspaceSubpathCandidates(pkgRoot, subpath) {
  const base = path2.join(pkgRoot, subpath);
  const strippedSubpath = subpath.replace(JS_TS_EXT_RE, "");
  const strippedBase = strippedSubpath === subpath ? base : path2.join(pkgRoot, strippedSubpath);
  const ext = path2.extname(subpath).toLowerCase();
  return jsTsExtensionCandidates(base, strippedBase, ext);
}
function resolveAliasedImport(cwd, specifier, importerDir) {
  for (const target of aliasedImportTargets(specifier, importerDir)) {
    const ext = path2.extname(target).toLowerCase();
    const stripped = target.replace(JS_TS_EXT_RE, "");
    const found = firstExistingFile(cwd, jsTsExtensionCandidates(target, stripped, ext));
    if (found.length)
      return found;
  }
  return [];
}
function resolveProjectReferenceImport(cwd, specifier, importerDir) {
  const target = referencedProjectImportTarget(specifier, importerDir);
  return target ? firstExistingFile(cwd, [target]) : [];
}
function resolveWorkspacePackageImport(cwd, source) {
  if (source.startsWith("."))
    return [];
  const graph = buildModuleGraph(cwd);
  if (!graph)
    return [];
  const match = findWorkspaceModuleForSpecifier(graph.modules.values(), source);
  if (!match)
    return [];
  const candidates = match.subpath ? workspaceSubpathCandidates(match.mod.root, match.subpath) : workspaceEntryCandidates(match.mod.root);
  return firstExistingFile(cwd, candidates);
}
function resolveJsTs(cwd, filePath, source) {
  if (!source.startsWith(".")) {
    const aliased = resolveAliasedImport(cwd, source, path2.dirname(filePath));
    if (aliased.length)
      return aliased;
    const referenced = resolveProjectReferenceImport(cwd, source, path2.dirname(filePath));
    return referenced.length ? referenced : resolveWorkspacePackageImport(cwd, source);
  }
  return firstExistingFile(cwd, jsTsCandidatePaths(filePath, source));
}
function resolveCxx(cwd, filePath, source) {
  if (source.startsWith("<"))
    return [];
  const dir = path2.dirname(path2.resolve(filePath));
  return firstExistingFile(cwd, [
    path2.resolve(dir, source),
    path2.resolve(cwd, source),
    path2.resolve(cwd, "include", source),
    path2.resolve(cwd, "src", source)
  ]);
}
function pythonRoots(cwd, fileDir) {
  let p = fileDir;
  const root = path2.resolve(cwd);
  while (isFile(path2.join(p, "__init__.py")) && isWithin(cwd, p)) {
    const parent = path2.dirname(p);
    if (parent === p)
      break;
    p = parent;
  }
  const roots = /* @__PURE__ */ new Set([p, root, path2.join(root, "src")]);
  return [...roots].filter((r) => isDir(r));
}
function resolvePython(cwd, filePath, source) {
  const fileDir = path2.dirname(path2.resolve(filePath));
  if (source.startsWith(".")) {
    const m = source.match(/^(\.+)(.*)$/);
    if (!m)
      return [];
    const dots = m[1].length;
    let baseDir = fileDir;
    for (let i = 1; i < dots; i++)
      baseDir = path2.dirname(baseDir);
    const rest = m[2] ? m[2].split(".") : [];
    const target = path2.join(baseDir, ...rest);
    return firstExistingFile(cwd, [
      `${target}.py`,
      path2.join(target, "__init__.py")
    ]);
  }
  const parts = source.split(".");
  for (const root of pythonRoots(cwd, fileDir)) {
    const target = path2.join(root, ...parts);
    const found = firstExistingFile(cwd, [
      `${target}.py`,
      path2.join(target, "__init__.py")
    ]);
    if (found.length)
      return found;
  }
  return [];
}
function findGoModule(cwd, filePath) {
  let dir = path2.dirname(path2.resolve(filePath));
  const root = path2.resolve(cwd);
  while (true) {
    try {
      const content = fs3.readFileSync(path2.join(dir, "go.mod"), "utf-8");
      const m = content.match(/^[^\S\n\r\u2028\u2029]*module\s+(\S+)/m);
      if (m)
        return { moduleDir: dir, modulePath: m[1] };
    } catch {
    }
    if (dir === root)
      break;
    const parent = path2.dirname(dir);
    if (parent === dir || !isWithin(cwd, parent))
      break;
    dir = parent;
  }
  return null;
}
function resolveGo(cwd, filePath, source) {
  const mod = findGoModule(cwd, filePath);
  if (!mod)
    return [];
  if (source !== mod.modulePath && !source.startsWith(`${mod.modulePath}/`)) {
    return [];
  }
  const rel = source === mod.modulePath ? "" : source.slice(mod.modulePath.length + 1);
  return sourceFilesIn(cwd, path2.join(mod.moduleDir, rel), ".go");
}
function javaSourceRoots(cwd, filePath) {
  const root = path2.resolve(cwd);
  const roots = /* @__PURE__ */ new Set();
  for (const c of ["src/main/java", "src/test/java", "src", ""]) {
    roots.add(path2.join(root, c));
  }
  let p = path2.dirname(path2.resolve(filePath));
  while (true) {
    roots.add(p);
    if (p === root)
      break;
    const parent = path2.dirname(p);
    if (parent === p || !isWithin(cwd, parent))
      break;
    p = parent;
  }
  return [...roots].filter((r) => isDir(r));
}
function resolveJava(cwd, filePath, source) {
  const parts = source.split(".");
  for (const root of javaSourceRoots(cwd, filePath)) {
    const asFile = firstExistingFile(cwd, [
      `${path2.join(root, ...parts)}.java`
    ]);
    if (asFile.length)
      return asFile;
    const asPkg = sourceFilesIn(cwd, path2.join(root, ...parts), ".java");
    if (asPkg.length)
      return asPkg;
    if (parts.length > 1) {
      const dropLast = firstExistingFile(cwd, [
        `${path2.join(root, ...parts.slice(0, -1))}.java`
      ]);
      if (dropLast.length)
        return dropLast;
    }
  }
  return [];
}
function resolveImportToFiles(cwd, filePath, languageId, source) {
  switch (languageId) {
    case "typescript":
    case "tsx":
    case "javascript":
    case "jsts":
      return resolveJsTs(cwd, filePath, source);
    case "c":
    case "cpp":
      return resolveCxx(cwd, filePath, source);
    case "ruby":
      return resolveRelative(cwd, filePath, source, [".rb"]);
    case "zig":
      return resolveRelative(cwd, filePath, source, [".zig"]);
    case "bash":
      return resolveRelative(cwd, filePath, source, [".sh", ".bash"]);
    case "dart":
      return resolveDart(cwd, filePath, source);
    case "python":
      return resolvePython(cwd, filePath, source);
    case "go":
      return resolveGo(cwd, filePath, source);
    case "java":
      return resolveJava(cwd, filePath, source);
    default:
      return [];
  }
}

// dist/clients/tree-sitter-symbol-extractor.js
import * as path3 from "node:path";
var SYMBOL_QUERIES = {
  typescript: {
    defs: `
      ;; Function declarations: function foo(params) { }
      (function_declaration
        name: (identifier) @funcName
        parameters: (formal_parameters) @funcParams
        body: (statement_block) @funcBody) @funcDef
      
      ;; Arrow functions: const foo = (params) => { }
      (variable_declarator
        name: (identifier) @arrowName
        value: (arrow_function
          parameters: (formal_parameters) @arrowParams
          body: (_) @arrowBody)) @arrowDef
      
      ;; Class declarations: class Foo { }
      (class_declaration
        name: (type_identifier) @className) @classDef
      
      ;; Method definitions: class Foo { bar() { } }
      (method_definition
        name: (property_identifier) @methodName
        parameters: (formal_parameters) @methodParams) @methodDef
      
      ;; Interface declarations: interface Foo { }
      (interface_declaration
        name: (type_identifier) @interfaceName) @interfaceDef
      
      ;; Type alias: type Foo = ...
      (type_alias_declaration
        name: (type_identifier) @typeName) @typeDef
    `,
    refs: `
      ;; Function/method calls: foo() or obj.bar()
      (call_expression
        function: (identifier) @callIdent) @callRef
      
      (call_expression
        function: (member_expression
          object: (_)
          property: (property_identifier) @callMethod)) @callMethodRef
      
      ;; New expressions: new Foo()
      (new_expression
        constructor: (identifier) @newIdent) @newRef
      
      ;; Type references: type T = Foo
      (type_identifier) @typeIdent
    `
  },
  python: {
    defs: `
      ;; Function definitions: def foo(params):
      (function_definition
        name: (identifier) @funcName
        parameters: (parameters) @funcParams) @funcDef
      
      ;; Class definitions: class Foo:
      (class_definition
        name: (identifier) @className) @classDef
      
      ;; Method definitions (within class)
      (class_definition
        body: (block
          (function_definition
            name: (identifier) @methodName
            parameters: (parameters) @methodParams) @methodDef))
    `,
    refs: `
      ;; Function calls: foo() or obj.bar()
      (call
        function: (identifier) @callIdent) @callRef
      
      (call
        function: (attribute
          object: (_)
          attribute: (identifier) @callMethod)) @callMethodRef
    `
  },
  rust: {
    defs: `
      ;; Function definitions: fn foo(params) { }
      (function_item
        name: (identifier) @funcName
        parameters: (parameters) @funcParams) @funcDef
      
      ;; Struct definitions: struct Foo { }
      (struct_item
        name: (type_identifier) @structName) @structDef
      
      ;; Impl blocks: impl Foo { fn bar() { } }
      (impl_item
        type: (type_identifier) @implType
        body: (declaration_list
          (function_item
            name: (identifier) @implMethodName) @implMethodDef))
    `,
    refs: `
      ;; Function calls: foo() or obj.bar()
      (call_expression
        function: (identifier) @callIdent) @callRef
      
      (call_expression
        function: (field_expression
          value: (_)
          field: (field_identifier) @callField)) @callFieldRef
    `
  },
  go: {
    defs: `
      (function_declaration
        name: (identifier) @funcName
        parameters: (parameter_list) @funcParams) @funcDef

      (method_declaration
        name: (field_identifier) @methodName
        parameters: (parameter_list) @methodParams) @methodDef

      (type_spec
        name: (type_identifier) @typeName) @typeDef
    `,
    refs: `
      (call_expression
        function: (identifier) @callIdent) @callRef

      (call_expression
        function: (selector_expression
          field: (field_identifier) @callMethod)) @callMethodRef
    `
  },
  ruby: {
    defs: `
      (method
        name: (identifier) @methodName) @methodDef

      (singleton_method
        name: (identifier) @methodName) @methodDef

      (class
        name: (constant) @className) @classDef

      (module
        name: (constant) @moduleName) @moduleDef
    `,
    refs: `
      (call
        method: (identifier) @callIdent) @callRef

      (call
        method: (constant) @typeIdent) @typeRef
    `
  },
  c: {
    defs: `
      (function_definition
        declarator: (function_declarator
          declarator: (identifier) @funcName
          parameters: (parameter_list) @funcParams)) @funcDef

      (type_definition
        declarator: (type_identifier) @typeName) @typeDef

      (struct_specifier
        name: (type_identifier) @typeName) @typeDef

      (enum_specifier
        name: (type_identifier) @typeName) @typeDef
    `,
    refs: `
      (call_expression
        function: (identifier) @callIdent) @callRef

      (call_expression
        function: (field_expression
          field: (field_identifier) @callField)) @callFieldRef

      (type_identifier) @typeIdent
    `
  },
  cpp: {
    defs: `
      (function_definition
        declarator: (function_declarator
          declarator: (identifier) @funcName
          parameters: (parameter_list) @funcParams)) @funcDef

      (class_specifier
        name: (type_identifier) @className) @classDef

      (struct_specifier
        name: (type_identifier) @className) @classDef

      (type_definition
        declarator: (type_identifier) @typeName) @typeDef
    `,
    refs: `
      (call_expression
        function: (identifier) @callIdent) @callRef

      (call_expression
        function: (field_expression
          field: (field_identifier) @callField)) @callFieldRef

      (type_identifier) @typeIdent
    `
  },
  java: {
    defs: `
      (method_declaration
        name: (identifier) @methodName
        parameters: (formal_parameters) @methodParams) @methodDef

      (class_declaration
        name: (identifier) @className) @classDef

      (interface_declaration
        name: (identifier) @interfaceName) @interfaceDef

      (constructor_declaration
        name: (identifier) @funcName
        parameters: (formal_parameters) @funcParams) @funcDef

      (enum_declaration
        name: (identifier) @className) @classDef
    `,
    refs: `
      (method_invocation
        name: (identifier) @callMethod) @callRef

      (object_creation_expression
        type: (type_identifier) @newIdent) @newRef

      (type_identifier) @typeIdent
    `
  },
  kotlin: {
    // #251: class_declaration's name is type_identifier; the old extra
    // `(class_declaration (simple_identifier) @className)` was a bad pattern that
    // failed query compilation (taking the whole language down). Call refs use
    // no field name in the shipped grammar (the old `calleeExpression:` field
    // also failed to compile).
    defs: `
      (function_declaration
        (simple_identifier) @funcName) @funcDef

      (class_declaration
        (type_identifier) @className) @classDef

      (object_declaration
        (type_identifier) @className) @classDef
    `,
    refs: `
      (call_expression
        (simple_identifier) @callIdent) @callRef

      (user_type (type_identifier) @typeIdent)
    `
  },
  dart: {
    // #251: function_signature/class_definition take their name/params as direct
    // children in the shipped grammar — the old `name:`/`parameters:` fields did
    // not exist and failed query compilation. method bodies' inner
    // function_signature also matches @funcDef (methods surface as functions).
    defs: `
      (function_signature
        (identifier) @funcName
        (formal_parameter_list) @funcParams) @funcDef

      (class_definition
        (identifier) @className) @classDef
    `,
    refs: `
      (type_identifier) @typeIdent
    `
  },
  elixir: {
    defs: `
      (call
        target: (identifier) @_kw
        (arguments
          (call
            target: (identifier) @funcName
            (arguments) @funcParams) @funcDef)
        (#match? @_kw "^def[pm]?$"))

      (call
        target: (identifier) @_kw
        (arguments (alias) @moduleName) @moduleDef
        (#match? @_kw "^defmodule$"))
    `,
    refs: `
      (call
        target: (identifier) @callIdent) @callRef

      (alias) @typeIdent
    `
  },
  csharp: {
    defs: `
      (method_declaration
        name: (identifier) @methodName
        parameters: (parameter_list) @methodParams) @methodDef

      (class_declaration
        name: (identifier) @className) @classDef

      (struct_declaration
        name: (identifier) @className) @classDef

      (interface_declaration
        name: (identifier) @interfaceName) @interfaceDef

      (constructor_declaration
        name: (identifier) @funcName
        parameters: (parameter_list) @funcParams) @funcDef

      (enum_declaration
        name: (identifier) @className) @classDef
    `,
    refs: `
      (invocation_expression
        function: (identifier) @callIdent) @callRef

      (invocation_expression
        function: (member_access_expression
          name: (identifier) @callMethod)) @callMethodRef

      (object_creation_expression
        type: (identifier) @newIdent) @newRef
    `
  },
  php: {
    defs: `
      (function_definition
        name: (name) @funcName
        parameters: (formal_parameters) @funcParams) @funcDef

      (method_declaration
        name: (name) @methodName
        parameters: (formal_parameters) @methodParams) @methodDef

      (class_declaration
        name: (name) @className) @classDef

      (interface_declaration
        name: (name) @interfaceName) @interfaceDef

      (trait_declaration
        name: (name) @className) @classDef
    `,
    refs: `
      (function_call_expression
        function: (name) @callIdent) @callRef

      (member_call_expression
        name: (name) @callMethod) @callMethodRef

      (object_creation_expression
        (name) @newIdent) @newRef
    `
  },
  swift: {
    defs: `
      (function_declaration
        (simple_identifier) @funcName) @funcDef

      (class_declaration
        (type_identifier) @className) @classDef

      (protocol_declaration
        (type_identifier) @interfaceName) @interfaceDef
    `,
    refs: `
      (call_expression
        (simple_identifier) @callIdent) @callRef

      (navigation_expression
        (simple_identifier) @callMethod) @callMethodRef

      (type_identifier) @typeIdent
    `
  },
  lua: {
    // #255: pulled from @tree-sitter-grammars/tree-sitter-lua (the aggregator's
    // build corrupts once a 2nd grammar loads). That grammar names function defs
    // `function_declaration` — the name is either a direct (identifier) (global /
    // `local function`) or a (dot_index_expression) for `function M.run`. Calls
    // are `function_call` with an (identifier) or (dot_index_expression) callee.
    defs: `
      (function_declaration
        (identifier) @funcName) @funcDef

      (function_declaration
        (dot_index_expression) @funcName) @funcDef
    `,
    refs: `
      (function_call (identifier) @callIdent) @callRef

      (function_call (dot_index_expression) @callIdent) @callRef
    `
  },
  ocaml: {
    // #251: let_binding holds value_name as a direct child (no `pattern:` /
    // value_pattern wrapper), and module_binding's module_name is a direct child
    // (no `name:` field) — the old patterns failed query compilation.
    defs: `
      (value_definition
        (let_binding (value_name) @funcName)) @funcDef

      (module_definition
        (module_binding (module_name) @moduleName)) @moduleDef
    `,
    refs: `
      (application_expression
        (value_path (value_name) @callIdent)) @callRef

      (value_path (value_name) @callIdent) @callRef
    `
  },
  zig: {
    defs: `
      (function_declaration
        (identifier) @funcName) @funcDef
    `,
    // #251: the old `field_access` node name doesn't exist in this grammar and
    // failed to compile; call_expression refs are valid.
    refs: `
      (call_expression
        (identifier) @callIdent) @callRef
    `
  },
  bash: {
    defs: `
      (function_definition
        name: (word) @funcName) @funcDef
    `,
    refs: `
      (command
        name: (command_name (word) @callIdent)) @callRef
    `
  },
  // #1522: tree-sitter-cue (eonpatapon/tree-sitter-cue, vendored per #1520) has
  // no `label:`/`value:` field names on `field` — verified directly against the
  // committed wasm (`value:` fails query compilation with "Bad field name");
  // only `let_clause`'s `left:`/`right:` and `call_expression`'s `function:`
  // are real fields. A `#Definition` is not a distinct node kind: `#Service`
  // parses as a plain (identifier) whose text happens to start with "#", so
  // definitions are told apart from ordinary struct fields with a `#match?`/
  // `#not-match?` text predicate rather than a grammar-level distinction —
  // both predicates must sit INSIDE the pattern's own parens (this repo's
  // tree-sitter gotcha). `#Definition`s map to `type` (the closest existing
  // SymbolKind to a reusable CUE schema); plain fields map to `property`;
  // `let` bindings map to `variable`.
  //
  // Two known upstream grammar rough edges (#1522 review round 1, F4;
  // docs/language-coverage.md's CUE row has the same note, kept in sync):
  // (1) an aliased field label (`X=name: value`) exposes BOTH identifiers
  // as untagged siblings under one `label` node — `(label alias:
  // (identifier) (identifier))` — with no field/structural way to tell the
  // alias from the real name, so `fieldDef` spuriously captures the alias
  // too, alongside the correct symbol for `name`. (2) a multi-hash raw
  // string (`##"..."##`, 2+ `#` delimiters) mis-parses regardless of
  // content — the field's value becomes a bare `identifier` instead of a
  // `string`, which can surface as a spurious `#`-prefixed ref via the
  // `typeIdent` pattern below. Both are grammar bugs, not query bugs — no
  // query change here can distinguish what the parse tree doesn't.
  cue: {
    defs: `
      (field
        (label (identifier) @defName)
        (#match? @defName "^#")) @defDef

      (field
        (label (identifier) @fieldName)
        (value (_)) @fieldValue
        (#not-match? @fieldName "^#")) @fieldDef

      (let_clause
        left: (identifier) @letName
        right: (_) @letValue) @letDef
    `,
    // `#Service` used as a value (e.g. `#Other: #Service & {...}`) is the same
    // (identifier) node kind as its own definition label — there is no
    // separate reference/definition node kind in this grammar, so the
    // definition's own label also matches this pattern, mirroring the same
    // self-match already accepted for swift/java's broad `type_identifier`
    // ref patterns above.
    refs: `
      ((identifier) @typeIdent
        (#match? @typeIdent "^#"))

      (call_expression
        function: (identifier) @callIdent) @callRef

      (call_expression
        function: (selector_expression (identifier) (identifier) @callMethod)) @callMethodRef
    `
  }
};
SYMBOL_QUERIES.tsx = SYMBOL_QUERIES.typescript;
SYMBOL_QUERIES.javascript = {
  defs: `
      ;; Function declarations: function foo(params) { }
      (function_declaration
        name: (identifier) @funcName
        parameters: (formal_parameters) @funcParams
        body: (statement_block) @funcBody) @funcDef

      ;; Arrow functions: const foo = (params) => { }
      (variable_declarator
        name: (identifier) @arrowName
        value: (arrow_function
          parameters: (formal_parameters) @arrowParams
          body: (_) @arrowBody)) @arrowDef

      ;; Class declarations: class Foo { } \u2014 (identifier) name on this grammar.
      (class_declaration
        name: (identifier) @className) @classDef

      ;; Method definitions: class Foo { bar() { } }
      (method_definition
        name: (property_identifier) @methodName
        parameters: (formal_parameters) @methodParams) @methodDef
    `,
  refs: `
      ;; Function/method calls: foo() or obj.bar()
      (call_expression
        function: (identifier) @callIdent) @callRef

      (call_expression
        function: (member_expression
          object: (_)
          property: (property_identifier) @callMethod)) @callMethodRef

      ;; New expressions: new Foo()
      (new_expression
        constructor: (identifier) @newIdent) @newRef
    `
};
function symbolExtractionGrammar(kind, filePath) {
  if (!kind)
    return void 0;
  const kindGrammar = KIND_TO_GRAMMAR[kind];
  if (!kindGrammar)
    return void 0;
  const byExtension = filePath ? EXTENSION_TO_GRAMMAR[path3.extname(filePath).toLowerCase()] : void 0;
  const grammar = byExtension ?? kindGrammar;
  return grammar in SYMBOL_QUERIES ? grammar : void 0;
}
var IMPORT_QUERIES = {
  // ESM import + re-export source strings; `source:` is a (string) on both the
  // typescript and tsx grammars (validated). parseImportMatch strips the quotes.
  // CJS `require(...)` is intentionally out of scope — the cold path's dominant
  // case is ESM, and the warm graph already covers require via the TS compiler.
  typescript: `
      (import_statement source: (string) @importSource)
      (export_statement source: (string) @importSource)
    `,
  tsx: `
      (import_statement source: (string) @importSource)
      (export_statement source: (string) @importSource)
    `,
  // #include "foo.h" (string_literal) and #include <stdio.h> (system_lib_string)
  // on both the c and cpp grammars (validated). parseImportMatch strips the quotes
  // from the local form; the system form keeps its <> so the resolver/bucketer can
  // tell a system header from a local include.
  c: `
      (preproc_include path: (string_literal) @importSource)
      (preproc_include path: (system_lib_string) @importSource)
    `,
  cpp: `
      (preproc_include path: (string_literal) @importSource)
      (preproc_include path: (system_lib_string) @importSource)
    `,
  python: `
      (import_statement name: (dotted_name) @importSource)
      (import_statement name: (aliased_import name: (dotted_name) @importSource))
      (import_from_statement module_name: (dotted_name) @importSource)
      (import_from_statement module_name: (relative_import) @importSource)
    `,
  go: `(import_spec path: (interpreted_string_literal) @importSource)`,
  rust: `(use_declaration argument: (_) @importSource)`,
  java: `(import_declaration (scoped_identifier) @importSource)`,
  kotlin: `(import_header (identifier) @importSource)`,
  csharp: `
      (using_directive (identifier) @importSource)
      (using_directive (qualified_name) @importSource)
    `,
  swift: `(import_declaration (identifier) @importSource)`,
  php: `(namespace_use_clause (name) @importSource)`,
  ocaml: `(open_module (module_path) @importSource)`,
  dart: `(import_specification (configurable_uri (uri (string_literal) @importSource)))`,
  // local x = require("mod.a") — a plain function call, not a statement. The
  // pulled @tree-sitter-grammars grammar (#255) names it function_call.
  lua: `
      (function_call
        (identifier) @_m
        (arguments (string) @importSource)
        (#match? @_m "^require$"))
    `,
  // require "x" / require_relative "x" — covers both via the "^require" prefix.
  ruby: `
      (call
        method: (identifier) @_m
        (argument_list (string (string_content) @importSource))
        (#match? @_m "^require"))
    `,
  // @import("std") — a builtin call, not a statement.
  zig: `
      (builtin_function (builtin_identifier) @_m
        (arguments (string (string_content) @importSource))
        (#match? @_m "^@import$"))
    `,
  // import/alias/require/use Foo — macro calls; excludes defmodule and friends.
  elixir: `
      (call target: (identifier) @_m
        (arguments (alias) @importSource)
        (#match? @_m "^(import|alias|require|use)$"))
    `,
  // source ./x.sh and . ./x.sh — the two POSIX file-include builtins.
  bash: `
      (command (command_name (word) @_m)
        (word) @importSource
        (#match? @_m "^(source|\\.)$"))
    `,
  // import "strings" / import x "encoding/json" — `import_spec`'s `path:`
  // field is verified against the committed wasm. Block-form
  // (`import (\n\t"strings"\n)`) nests each `import_spec` one level deeper,
  // under `import_spec_list`, rather than as a direct child of
  // `import_declaration` — a second pattern is needed, not a reshaped first
  // one (#1522 review round 1, F2: the single-line-only pattern extracted
  // zero imports from the block form).
  cue: `
      (import_declaration (import_spec path: (string) @importSource))
      (import_declaration (import_spec_list (import_spec path: (string) @importSource)))
    `
};
IMPORT_QUERIES.javascript = IMPORT_QUERIES.typescript;
function parseImportMatch(match) {
  for (const capture of match.captures) {
    if (capture.name !== "importSource")
      continue;
    const raw = String(capture.node.text ?? "").trim();
    const source = raw.replace(/^["'`]+|["'`]+$/g, "");
    if (!source)
      continue;
    return { source, line: capture.node.startPosition.row + 1 };
  }
  return null;
}
var TreeSitterSymbolExtractor = class _TreeSitterSymbolExtractor {
  languageId;
  client;
  // biome-ignore lint/suspicious/noExplicitAny: Query type from web-tree-sitter
  defQuery = null;
  // biome-ignore lint/suspicious/noExplicitAny: Query type from web-tree-sitter
  refQuery = null;
  // biome-ignore lint/suspicious/noExplicitAny: Query type from web-tree-sitter
  importQuery = null;
  constructor(languageId, client) {
    this.languageId = languageId;
    this.client = client;
  }
  async init() {
    try {
      if (!await this.client.isLanguageSupported(this.languageId))
        return false;
      const language = this.client.getLanguage(this.languageId);
      if (!language)
        return false;
      const { Query } = await loadWebTreeSitter();
      const queries = SYMBOL_QUERIES[this.languageId];
      if (queries) {
        this.defQuery = this.compileQuery(Query, language, queries.defs, "defs");
        this.refQuery = this.compileQuery(Query, language, queries.refs, "refs");
      }
      const importQuerySrc = IMPORT_QUERIES[this.languageId];
      if (importQuerySrc) {
        this.importQuery = this.compileQuery(Query, language, importQuerySrc, "imports");
      }
      return Boolean(this.defQuery || this.importQuery);
    } catch (err) {
      this.client.reportWasmAbort(err);
      logTreeSitterDiagnostic({
        subsystem: "symbol-extractor",
        languageId: this.languageId,
        message: `Failed to init ${this.languageId}: ${err instanceof Error ? err.message : String(err)}`
      });
      return false;
    }
  }
  // biome-ignore lint/suspicious/noExplicitAny: web-tree-sitter Query/Language types
  compileQuery(Query, language, src, label) {
    const input = wasmQueryInput(`${this.languageId}:${label}:${src}`);
    try {
      return new Query(language, src);
    } catch (err) {
      if (this.client.reportWasmAbort(err, input))
        throw err;
      logTreeSitterDiagnostic({
        subsystem: "symbol-extractor",
        languageId: this.languageId,
        message: `${this.languageId} ${label} query failed: ${err.message}`,
        metadata: { query: label }
      });
      return null;
    }
  }
  /**
   * Extract symbols from a parsed tree-sitter tree
   */
  extract(tree, filePath, content) {
    const symbols = [];
    const refs = [];
    const relativePath = path3.relative(process.cwd(), filePath);
    if (this.defQuery) {
      for (const match of this.queryMatches(this.defQuery, tree.rootNode)) {
        const symbol = this.parseDefMatch(match, relativePath, content);
        if (symbol)
          symbols.push(symbol);
      }
    }
    if (this.refQuery) {
      for (const match of this.queryMatches(this.refQuery, tree.rootNode)) {
        const ref = this.parseRefMatch(match, relativePath);
        if (ref)
          refs.push(ref);
      }
    }
    const imports = [];
    if (this.importQuery) {
      for (const match of this.queryMatches(this.importQuery, tree.rootNode)) {
        const ref = parseImportMatch(match);
        if (ref)
          imports.push(ref);
      }
    }
    return {
      symbols,
      refs,
      imports,
      coverage: {
        definitions: this.defQuery ? "complete" : "unavailable",
        references: this.refQuery ? "complete" : "unavailable",
        imports: this.importQuery ? "complete" : "unavailable"
      }
    };
  }
  queryMatches(query, rootNode) {
    try {
      return query.matches(rootNode);
    } catch (error) {
      this.client.reportWasmAbort(error);
      throw error;
    }
  }
  // biome-ignore lint/suspicious/noExplicitAny: Match type
  parseDefMatch(match, filePath, content) {
    const captures = {};
    for (const capture of match.captures) {
      captures[capture.name] = {
        text: capture.node.text,
        // biome-ignore lint/suspicious/noExplicitAny: Node type
        node: capture.node
      };
    }
    let name;
    let kind;
    let params;
    let defNode;
    if (captures.funcName) {
      name = captures.funcName.text;
      kind = "function";
      params = captures.funcParams?.text;
      defNode = captures.funcDef?.node;
    } else if (captures.arrowName) {
      name = captures.arrowName.text;
      kind = "function";
      params = captures.arrowParams?.text;
      defNode = captures.arrowDef?.node;
    } else if (captures.className) {
      name = captures.className.text;
      kind = "class";
      defNode = captures.classDef?.node;
    } else if (captures.methodName) {
      name = captures.methodName.text;
      kind = "method";
      params = captures.methodParams?.text;
      defNode = captures.methodDef?.node;
    } else if (captures.interfaceName) {
      name = captures.interfaceName.text;
      kind = "interface";
      defNode = captures.interfaceDef?.node;
    } else if (captures.typeName) {
      name = captures.typeName.text;
      kind = "type";
      defNode = captures.typeDef?.node;
    } else if (captures.moduleName) {
      name = captures.moduleName.text;
      kind = "class";
      defNode = captures.moduleDef?.node;
    } else if (captures.defName) {
      name = captures.defName.text;
      kind = "type";
      defNode = captures.defDef?.node;
    } else if (captures.fieldName) {
      name = captures.fieldName.text;
      kind = "property";
      defNode = captures.fieldDef?.node;
    } else if (captures.letName) {
      name = captures.letName.text;
      kind = "variable";
      defNode = captures.letDef?.node;
    }
    if (!name || !kind || !defNode)
      return null;
    const isExported = this.isExported(defNode, content);
    const signature = params ? this.extractSignature(params, kind) : void 0;
    const local = this.isFunctionLocal(defNode);
    const visibility = kind === "method" ? this.detectVisibility(defNode, name) : void 0;
    const decorators = this.extractDecorators(defNode);
    const isAsync = (kind === "function" || kind === "method") && this.isAsyncDecl(defNode);
    const docInfo = this.extractDocCommentInfo(defNode);
    return {
      id: `${filePath}:${name}`,
      name,
      kind,
      filePath,
      line: defNode.startPosition.row + 1,
      endLine: defNode.endPosition.row + 1,
      column: defNode.startPosition.column + 1,
      signature,
      isExported,
      ...local ? { local: true } : {},
      ...visibility ? { visibility } : {},
      ...decorators.length > 0 ? { decorators } : {},
      ...isAsync ? { isAsync: true } : {},
      ...docInfo ? { doc: docInfo.text, docStartLine: docInfo.startLine } : {}
    };
  }
  // Comment node kinds across grammars that use tree-sitter's conventional
  // name. Line/block comments (`//`, `/* */`, `/** */`, `#`) all parse to a
  // single "comment" node type in every grammar checked (JS/TS, Python, Go,
  // Rust, Java, Kotlin, C#, C/C++, Ruby, PHP, Swift, Lua) — no per-grammar
  // query needed, unlike decorators/annotations which vary by node shape.
  static COMMENT_NODE_KIND = "comment";
  /**
   * First sentence/line of the doc comment immediately preceding a declaration,
   * whitespace-collapsed and capped ~120 chars — the highest-signal token for an
   * agent deciding which symbol to read (#512). Structural, not per-language:
   * walks contiguous preceding-sibling `comment` nodes (same traversal shape as
   * `extractDecorators`), stopping at the nearest non-comment/non-decorator named
   * sibling, and takes the LAST contiguous comment block (the one directly above
   * the declaration — an earlier unrelated comment separated by blank lines still
   * parses as a preceding sibling, but a real gap makes it not "attached").
   * JSDoc/TSDoc block comments strip the leading/trailing block markers and
   * per-line `*` gutters; plain `//`/`#` line comments strip the marker only.
   * Returns undefined when no comment is directly attached. Returns both the
   * summarized text (`doc`) and the 1-based start line of the attached comment
   * block (`docStartLine`, #523) — readSymbol extends its returned range to that
   * line so an agent reading a symbol sees its contract, not just its body.
   */
  // biome-ignore lint/suspicious/noExplicitAny: web-tree-sitter node
  extractDocCommentInfo(declNode) {
    const isComment = (n) => !!n && n.type === _TreeSitterSymbolExtractor.COMMENT_NODE_KIND;
    const isDeco = (n) => !!n && _TreeSitterSymbolExtractor.DECORATOR_NODE_KINDS.has(n.type);
    const samePos = (a, b) => a?.startPosition?.row === b?.startPosition?.row && a?.startPosition?.column === b?.startPosition?.column;
    const sameStartRow = (a, b) => a?.startPosition?.row === b?.startPosition?.row;
    let node = declNode;
    for (let hops = 0; hops < 4; hops++) {
      const parent = node.parent;
      if (!parent || !sameStartRow(parent, node))
        break;
      node = parent;
    }
    const siblings = node.parent?.children ?? [];
    const idx = siblings.findIndex((s) => samePos(s, node));
    if (idx <= 0)
      return void 0;
    let cursor = idx - 1;
    while (cursor >= 0 && isDeco(siblings[cursor]))
      cursor--;
    let boundaryRow = node.startPosition?.row;
    let end = -1;
    let start = -1;
    while (cursor >= 0 && isComment(siblings[cursor])) {
      const candidate = siblings[cursor];
      const gapRows = boundaryRow !== void 0 && typeof candidate.endPosition?.row === "number" ? boundaryRow - candidate.endPosition.row : 0;
      if (gapRows > 1)
        break;
      if (end < 0)
        end = cursor;
      start = cursor;
      boundaryRow = candidate.startPosition?.row;
      cursor--;
    }
    if (start < 0 || end < 0)
      return void 0;
    const raw = siblings.slice(start, end + 1).map((n) => String(n.text ?? "")).join("\n");
    const text = this.summarizeDocComment(raw);
    if (!text)
      return void 0;
    const startLine = (siblings[start].startPosition?.row ?? 0) + 1;
    return { text, startLine };
  }
  static DOC_MAX_CHARS = 120;
  /** Strip comment markers, take the first sentence (or first line if no
   * sentence terminator), collapse whitespace, cap at ~120 chars. */
  summarizeDocComment(raw) {
    const cleaned = raw.replace(/^\s*\/\*\*?/, "").replace(/\*\/\s*$/, "").split(/\r?\n/).map((line) => line.replace(/^\s*(\*|\/\/\/?|#)\s?/, "").trimEnd()).filter((line) => line.trim().length > 0).join(" ").trim();
    if (!cleaned)
      return void 0;
    const sentenceMatch = cleaned.match(/^.*?[.!?](?:\s|$)/);
    let first = (sentenceMatch ? sentenceMatch[0] : cleaned).trim();
    first = first.replace(/\s+/g, " ");
    if (first.length > _TreeSitterSymbolExtractor.DOC_MAX_CHARS) {
      first = `${first.slice(0, _TreeSitterSymbolExtractor.DOC_MAX_CHARS - 1).trimEnd()}\u2026`;
    }
    return first || void 0;
  }
  /**
   * Structural async/suspend detection: an `async` keyword node (Python/JS/TS
   * have it as a direct child of the declaration) or `async`/`suspend` inside a
   * `*modifiers*` container (Rust `function_modifiers`, Kotlin/Java/C#
   * `modifiers`). Conservative — a grammar that spells it differently just
   * yields false (no false positives).
   */
  // biome-ignore lint/suspicious/noExplicitAny: web-tree-sitter node
  isAsyncDecl(node) {
    const isAsyncTok = (n) => !!n && (n.type === "async" || n.type === "suspend" || /modifier/.test(String(n.type)) && /^(?:async|suspend)$/.test(String(n.text ?? "").trim()));
    for (const child of node.children ?? []) {
      if (isAsyncTok(child))
        return true;
      if (/modifiers/.test(String(child?.type))) {
        for (const gc of child.children ?? []) {
          if (isAsyncTok(gc))
            return true;
        }
      }
    }
    return false;
  }
  // Decorator/attribute/annotation node kinds across grammars. Python/TS/JS use
  // `decorator`; Rust `attribute_item`; Java/Kotlin/C# `marker_annotation` /
  // `annotation` (often nested inside a `modifiers` container).
  static DECORATOR_NODE_KINDS = /* @__PURE__ */ new Set([
    "decorator",
    "attribute_item",
    "marker_annotation",
    "annotation"
  ]);
  // Containers that hold annotations as children (Java/Kotlin `modifiers`).
  static MODIFIERS_CONTAINER_KINDS = /* @__PURE__ */ new Set(["modifiers"]);
  /**
   * Decorators/attributes/annotations attached to a declaration node, in source
   * order. Structural (tree-sitter), not text heuristics, so it handles the three
   * placement shapes seen across grammars:
   *   - preceding siblings: Python (`decorated_definition` children), Rust
   *     (`attribute_item`), TS methods (`decorator`);
   *   - own children: TS class decorators;
   *   - nested in a `modifiers` container: Java/Kotlin/C# annotations.
   * Languages without these node kinds simply yield none.
   */
  // biome-ignore lint/suspicious/noExplicitAny: web-tree-sitter node
  extractDecorators(node) {
    const isDeco = (n) => !!n && _TreeSitterSymbolExtractor.DECORATOR_NODE_KINDS.has(n.type);
    const text = (n) => {
      const first = String(n?.text ?? "").split(/\r?\n/, 1)[0]?.trim() ?? "";
      return first.length > 120 ? `${first.slice(0, 117)}\u2026` : first;
    };
    const out = [];
    for (const sib of node.parent?.children ?? []) {
      if (sib.startIndex >= node.startIndex)
        break;
      if (isDeco(sib))
        out.push(text(sib));
      else if (sib.isNamed)
        out.length = 0;
    }
    for (const child of node.children ?? []) {
      if (isDeco(child))
        out.push(text(child));
      else if (_TreeSitterSymbolExtractor.MODIFIERS_CONTAINER_KINDS.has(child?.type)) {
        for (const gc of child.children ?? []) {
          if (isDeco(gc))
            out.push(text(gc));
        }
      }
    }
    return [...new Set(out.filter(Boolean))].slice(0, 8);
  }
  // biome-ignore lint/suspicious/noExplicitAny: Match type
  parseRefMatch(match, filePath) {
    let name;
    let refNode;
    let referenceKind = "unknown";
    for (const capture of match.captures) {
      const captureName = String(capture.name);
      if (captureName.endsWith("Ident") || captureName.endsWith("Method") || captureName.endsWith("Field")) {
        name = capture.node.text;
        refNode = capture.node;
        if (captureName.startsWith("type"))
          referenceKind = "type";
        else if (captureName.startsWith("call") || captureName.startsWith("new")) {
          referenceKind = "call";
        }
      }
      if (captureName.endsWith("Ref") && !refNode) {
        refNode = capture.node;
        if (captureName.startsWith("type"))
          referenceKind = "type";
        else if (captureName.startsWith("call") || captureName.startsWith("new")) {
          referenceKind = "call";
        }
      }
    }
    if (!name || !refNode)
      return null;
    return {
      symbolId: `${filePath}:${name}`,
      // Will be resolved later
      symbolName: name,
      filePath,
      line: refNode.startPosition.row + 1,
      column: refNode.startPosition.column + 1,
      referenceKind
    };
  }
  // biome-ignore lint/suspicious/noExplicitAny: Node type
  isExported(node, content) {
    const lines = content.split("\n");
    const lineIdx = node.startPosition.row;
    const line = lines[lineIdx] || "";
    return /^\s*export\b/.test(line) || this.hasExportModifier(node, content);
  }
  // biome-ignore lint/suspicious/noExplicitAny: Node type
  hasExportModifier(node, _content) {
    let current = node.parent;
    while (current) {
      if (current.type === "statement_block")
        return false;
      if (current.type === "export_statement" || current.type === "export_declaration") {
        return true;
      }
      current = current.parent;
    }
    return false;
  }
  // biome-ignore lint/suspicious/noExplicitAny: Node type
  isFunctionLocal(node) {
    let current = node.parent;
    while (current) {
      if (current.type === "statement_block")
        return true;
      current = current.parent;
    }
    return false;
  }
  // biome-ignore lint/suspicious/noExplicitAny: Node type
  detectVisibility(node, nameText) {
    if (nameText.startsWith("#"))
      return "private";
    for (const child of node?.children ?? []) {
      if (child?.type === "accessibility_modifier") {
        if (child.text === "private")
          return "private";
        if (child.text === "protected")
          return "protected";
        return void 0;
      }
    }
    return void 0;
  }
  extractSignature(paramsText, kind) {
    if (kind === "function" || kind === "method") {
      return paramsText.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "").replace(/\s+/g, " ").trim();
    }
    return void 0;
  }
};

// dist/clients/blocker-freshness.js
var DEPENDENCY_DRIFT_MAX_DELIVERIES = 3;
var SELF_DRIFT_HASH_BUDGET_BYTES = 8 * 1024 * 1024;
var MAX_DRIFT_CHECK_IMPORTS = 128;
var extractorCache = /* @__PURE__ */ new Map();
function getExtractor(languageId) {
  let cached = extractorCache.get(languageId);
  if (!cached) {
    cached = (async () => {
      const client = getSharedTreeSitterClient();
      if (!client)
        return null;
      const extractor = new TreeSitterSymbolExtractor(languageId, client);
      const ok = await extractor.init();
      return ok ? extractor : null;
    })().catch(() => null);
    extractorCache.set(languageId, cached);
  }
  return cached;
}
var importResolutionMemo = /* @__PURE__ */ new Map();
var importResolutionMemoTurnIndex;
function noteImportResolutionMemoTurn(turnIndex) {
  if (turnIndex === void 0)
    return;
  if (importResolutionMemoTurnIndex !== turnIndex) {
    importResolutionMemo.clear();
    importResolutionMemoTurnIndex = turnIndex;
  }
}
async function resolveForwardImportsMemoized(cwd, filePath, resolveForwardImports) {
  const sig = await statSignature(filePath);
  if (sig === void 0) {
    try {
      return await resolveForwardImports(cwd, filePath);
    } catch {
      return [];
    }
  }
  const cached = importResolutionMemo.get(filePath);
  if (cached && cached.mtimeMs === sig.mtimeMs && cached.size === sig.size)
    return cached.imports;
  let imports;
  try {
    imports = await resolveForwardImports(cwd, filePath);
  } catch {
    imports = [];
  }
  importResolutionMemo.set(filePath, {
    mtimeMs: sig.mtimeMs,
    size: sig.size,
    imports
  });
  return imports;
}
async function extractForwardImportPaths(cwd, filePath) {
  const languageId = resolveTreeSitterLanguage(filePath);
  if (!languageId)
    return [];
  const client = getSharedTreeSitterClient();
  if (!client)
    return [];
  const extractor = await getExtractor(languageId);
  if (!extractor)
    return [];
  let content;
  try {
    content = fs4.readFileSync(filePath, "utf-8");
  } catch {
    return [];
  }
  const outcome = await client.withParsedTree(filePath, languageId, content, (tree) => extractor.extract(tree, filePath, content).imports, "blocker-freshness");
  if (!outcome.parsed)
    return [];
  const resolved2 = /* @__PURE__ */ new Set();
  for (const ref of outcome.value) {
    for (const target of resolveImportToFiles(cwd, filePath, languageId, ref.source)) {
      resolved2.add(target);
    }
  }
  return [...resolved2];
}
async function statSignature(filePath) {
  try {
    const stat2 = await fs4.promises.stat(filePath);
    return { mtimeMs: stat2.mtimeMs, size: stat2.size };
  } catch {
    return void 0;
  }
}
async function statMtimeMs(filePath) {
  try {
    const stat2 = await fs4.promises.stat(filePath);
    return stat2.mtimeMs;
  } catch {
    return void 0;
  }
}
async function detectSelfDrift(args) {
  const boundOptions = (label) => ({
    ms: HOOK_WALL_BUDGET_MS.turn_end,
    signal: args.signal,
    hook: "turn_end",
    label
  });
  const stat2 = await bounded(fs4.promises.stat(args.filePath), boundOptions("selfDriftStat"));
  if (stat2 === void 0)
    return { verdict: "unverifiable", unverifiableReason: "stat-unavailable" };
  if (args.recordedSize === void 0)
    return { verdict: "unverifiable", unverifiableReason: "missing-baseline" };
  if (stat2.size !== args.recordedSize)
    return { verdict: "drift" };
  if (args.recordedHash === void 0)
    return { verdict: "unverifiable", unverifiableReason: "missing-baseline" };
  if (stat2.size > args.budget.bytesLeft) {
    args.budget.exhausted = true;
    return {
      verdict: "unverifiable",
      unverifiableReason: "hash-budget-exhausted"
    };
  }
  const content = await bounded(fs4.promises.readFile(args.filePath), boundOptions("selfDriftHash"));
  if (content === void 0)
    return { verdict: "unverifiable", unverifiableReason: "hash-unavailable" };
  args.budget.bytesLeft -= content.byteLength;
  const hash = createHash("sha256").update(content).digest("hex");
  return { verdict: hash === args.recordedHash ? "unchanged" : "drift" };
}
async function collectForwardImportMtimes(cwd, filePath, resolveForwardImports = extractForwardImportPaths, turnIndex) {
  noteImportResolutionMemoTurn(turnIndex);
  let imports = [];
  try {
    imports = await resolveForwardImportsMemoized(cwd, filePath, resolveForwardImports);
  } catch {
    imports = [];
  }
  const truncated = imports.length > MAX_DRIFT_CHECK_IMPORTS;
  const out = [];
  for (const dep of imports.slice(0, MAX_DRIFT_CHECK_IMPORTS)) {
    const mtimeMs = await statMtimeMs(dep);
    if (mtimeMs !== void 0)
      out.push({ path: dep, mtimeMs });
  }
  return { mtimes: out, truncated };
}
async function detectDrift(cwd, filePath, recordedAtMs, resolveForwardImports, turnIndex, skipOwnFile = false) {
  const drifted = [];
  if (!skipOwnFile) {
    const ownFreshness = freshnessFromMtime({
      mtimeMs: await statMtimeMs(filePath),
      referenceMs: recordedAtMs
    });
    if (ownFreshness.verdict === "stale")
      drifted.push(filePath);
  }
  const { mtimes, truncated } = await collectForwardImportMtimes(cwd, filePath, resolveForwardImports, turnIndex);
  for (const { path: depPath, mtimeMs } of mtimes) {
    const verdict = freshnessFromMtime({
      mtimeMs,
      referenceMs: recordedAtMs
    });
    if (verdict.verdict === "stale")
      drifted.push(depPath);
  }
  return { drifted, truncated };
}
function isEligibleForDriftCheck(entry) {
  if (entry.stale)
    return false;
  if (entry.recordedAtMs === void 0)
    return false;
  return entry.sources !== void 0 && entry.sources.length > 0;
}
function isAllLspSourced(sources) {
  return sources !== void 0 && sources.length > 0 && sources.every((source) => source === "lsp");
}
function canSubsumeLspWidgetRow(entry) {
  return isEligibleForDriftCheck(entry) && isAllLspSourced(entry.sources);
}
async function sweepInlineBlockerFreshness(runtime, cwd, options) {
  const counts = {
    total: 0,
    kept: 0,
    revalidated: 0,
    alreadyStale: 0,
    truncatedImports: 0,
    selfHealed: 0,
    selfUnverifiable: 0,
    hashBudgetExhausted: 0
  };
  const resolveForwardImports = options?.resolveForwardImports ?? extractForwardImportPaths;
  let turnIndex;
  try {
    turnIndex = runtime.turnIndex;
  } catch {
    turnIndex = void 0;
  }
  let inlineEntries;
  try {
    inlineEntries = runtime.getInlineBlockersSnapshot();
  } catch {
    return counts;
  }
  const population = inlineEntries.map((entry) => ({
    filePath: entry.filePath,
    stale: entry.stale ?? false,
    recordedAtMs: entry.recordedAtMs,
    sources: entry.sources,
    staleReason: entry.staleReason,
    recordedSize: entry.recordedSize,
    recordedHash: entry.recordedHash,
    demote: () => runtime.markInlineBlockerStale(entry.filePath, "dependency-drift"),
    setSelfDrift: (isSelfDrift) => runtime.setInlineBlockerSelfDriftStale(entry.filePath, isSelfDrift)
  }));
  const inlineByKey = /* @__PURE__ */ new Map();
  for (const entry of population) {
    inlineByKey.set(normalizeEphemeralMapKey(entry.filePath), entry);
  }
  for (const extra of options?.additionalEntries ?? []) {
    const key = normalizeEphemeralMapKey(extra.filePath);
    const inlineEntry = inlineByKey.get(key);
    if (inlineEntry && canSubsumeLspWidgetRow(inlineEntry)) {
      const demoteInline = inlineEntry.demote;
      const demoteWidget = extra.demote;
      inlineEntry.demote = () => {
        const inlineChanged = demoteInline();
        const widgetChanged = demoteWidget();
        return inlineChanged || widgetChanged;
      };
      continue;
    }
    population.push({
      filePath: extra.filePath,
      stale: false,
      recordedAtMs: extra.recordedAtMs,
      sources: ["lsp"],
      demote: extra.demote,
      // A widget row is pure-LSP by construction, so it takes the import
      // axis and never reaches the self axis. No `setSelfDrift` (#2982):
      // the widget store has no re-arming self-drift setter, and an entry
      // without one is not eligible for that axis.
      staleReason: void 0,
      recordedSize: void 0,
      recordedHash: void 0
    });
  }
  counts.total = population.length;
  const hashBudget = {
    bytesLeft: SELF_DRIFT_HASH_BUDGET_BYTES,
    exhausted: false
  };
  for (const entry of population) {
    try {
      const selfDriftDemoted = entry.stale && entry.staleReason === "self-drift";
      if (entry.stale && !selfDriftDemoted) {
        counts.alreadyStale += 1;
        continue;
      }
      if (entry.recordedAtMs === void 0) {
        counts.kept += 1;
        continue;
      }
      const recordedSources = entry.sources !== void 0 && entry.sources.length > 0 ? entry.sources : void 0;
      if (recordedSources === void 0) {
        counts.kept += 1;
        continue;
      }
      const setSelfDrift = entry.setSelfDrift;
      const isLspSourced = isAllLspSourced(recordedSources);
      let ownVerdict;
      if (setSelfDrift) {
        const hashBudgetWasExhausted = hashBudget.exhausted;
        const selfDrift = await bounded(detectSelfDrift({
          filePath: entry.filePath,
          recordedSize: entry.recordedSize,
          recordedHash: entry.recordedHash,
          signal: options?.signal,
          budget: hashBudget
        }), {
          ms: HOOK_WALL_BUDGET_MS.turn_end,
          signal: options?.signal,
          hook: "turn_end",
          label: "detectSelfDrift"
        }) ?? {
          verdict: "unverifiable",
          unverifiableReason: "bound-expired"
        };
        ownVerdict = selfDrift.verdict;
        if (ownVerdict === "unverifiable") {
          counts.selfUnverifiable += 1;
          const reason = selfDrift.unverifiableReason ?? (hashBudgetWasExhausted || hashBudget.exhausted ? "hash-budget-exhausted" : "hash-unavailable");
          recordDegradationOnce({
            kind: "self-drift-unverifiable",
            subject: `inline-blocker:${toRunnerDisplayPath(cwd, entry.filePath)}#${reason}`,
            reason: `the self-drift check was unverifiable: ${reason}`
          });
          if (reason === "hash-budget-exhausted") {
            recordDegradationOnce({
              kind: "self-drift-hash-budget-exhausted",
              subject: `inline-blocker:${toRunnerDisplayPath(cwd, entry.filePath)}`,
              reason: "the aggregate self-drift hash budget was exhausted"
            });
          }
        }
      }
      if (!isLspSourced) {
        if (!setSelfDrift || ownVerdict === void 0) {
          counts.kept += 1;
          continue;
        }
        if (ownVerdict === "unverifiable") {
          if (selfDriftDemoted)
            counts.alreadyStale += 1;
          else
            counts.kept += 1;
          continue;
        }
        const shouldDemote = ownVerdict === "drift";
        const transitioned = setSelfDrift(shouldDemote);
        if (shouldDemote) {
          if (transitioned)
            counts.revalidated += 1;
          else
            counts.alreadyStale += 1;
        } else if (transitioned) {
          counts.selfHealed += 1;
        } else {
          counts.kept += 1;
        }
        continue;
      }
      let contentDecidedOwnFile = false;
      if (setSelfDrift !== void 0 && ownVerdict !== void 0 && entry.recordedSize !== void 0) {
        if (ownVerdict === "drift") {
          const transitioned = setSelfDrift(true);
          if (transitioned)
            counts.revalidated += 1;
          else
            counts.alreadyStale += 1;
          continue;
        }
        if (ownVerdict === "unchanged") {
          contentDecidedOwnFile = true;
          const transitioned = setSelfDrift(false);
          if (transitioned)
            counts.selfHealed += 1;
        } else {
          if (selfDriftDemoted) {
            counts.alreadyStale += 1;
            continue;
          }
        }
      }
      const skipOwnFile = contentDecidedOwnFile;
      const { drifted, truncated } = await detectDrift(cwd, entry.filePath, entry.recordedAtMs, resolveForwardImports, turnIndex, skipOwnFile);
      if (truncated)
        counts.truncatedImports += 1;
      if (drifted.length > 0) {
        entry.demote();
        counts.revalidated += 1;
      } else {
        counts.kept += 1;
      }
    } catch {
      counts.kept += 1;
    }
  }
  counts.hashBudgetExhausted = hashBudget.exhausted ? 1 : 0;
  return counts;
}

// dist/clients/diagnostic-dispositions.js
import * as fs8 from "node:fs";
import * as path7 from "node:path";

// dist/clients/disposition-logger.js
import * as path4 from "node:path";
var DISPOSITION_LOG_DIR = getGlobalPiLensLogDir();
var DISPOSITION_LOG_FILE = path4.join(DISPOSITION_LOG_DIR, "dispositions.log");
var DISPOSITION_LOG_BACKUP_FILE = path4.join(DISPOSITION_LOG_DIR, "dispositions.log.1");
var MAX_LOG_BYTES = Math.max(128 * 1024, Number.parseInt(process.env.PI_LENS_DISPOSITION_LOG_MAX_BYTES ?? "1048576", 10) || 1048576);
var writer = createNdjsonLogger({
  filePath: DISPOSITION_LOG_FILE,
  maxBytes: MAX_LOG_BYTES,
  backupPath: DISPOSITION_LOG_BACKUP_FILE
});

// dist/clients/bus-events-logger.js
import * as path5 from "node:path";
var BUS_EVENTS_LOG_FILE = path5.join(getGlobalPiLensLogDir(), "bus-events.log");
var writer2 = createNdjsonLogger({
  filePath: BUS_EVENTS_LOG_FILE,
  maxBytes: getMaxLogSizeMB() * 1024 * 1024
});
var eventRollupCounts = /* @__PURE__ */ new Map();
function bumpRollupCount(event, outcome) {
  const existing = eventRollupCounts.get(event) ?? {
    emitted: 0,
    skipped_stale_session: 0,
    emit_failed: 0
  };
  existing[outcome] += 1;
  eventRollupCounts.set(event, existing);
}
function logBusEvent(entry) {
  if (entry.outcome === "emitted" || entry.outcome === "skipped_stale_session" || entry.outcome === "emit_failed") {
    bumpRollupCount(entry.event, entry.outcome);
  }
  if (isTestMode()) {
    return;
  }
  writer2.log({ ts: (/* @__PURE__ */ new Date()).toISOString(), ...entry });
}

// dist/clients/recent-touches.js
var RECENT_TOUCHES_FRESHNESS_MS = 15 * 60 * 1e3;

// dist/clients/session-lifecycle.js
var SESSION_LIFECYCLE_FAMILY = "session-lifecycle.primary-registration";
var SESSION_LIFECYCLE_VERSION = 1;
function state() {
  return getProcessSingleton(SESSION_LIFECYCLE_FAMILY, SESSION_LIFECYCLE_VERSION, () => ({
    activeCtx: void 0,
    activeSessionId: void 0,
    activeRoot: void 0,
    secondarySessionCount: 0
  }));
}
var SUCCESSOR_HANDOFF_TTL_MS = 24 * 60 * 60 * 1e3;
function getActiveSessionId() {
  return state().activeSessionId;
}
function probeCtxActive(ctx) {
  try {
    const candidate = ctx;
    if (candidate === null || candidate === void 0 || typeof candidate.isIdle !== "function") {
      return void 0;
    }
    candidate.isIdle();
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("stale after session replacement")) {
      return false;
    }
    return void 0;
  }
}

// dist/clients/live-bus-emitter.js
var STALE_CTX_MESSAGE = "This extension ctx is stale after session replacement";
function recordStaleBusFailure(subject, error) {
  const reason = String(error);
  if (!reason.includes(STALE_CTX_MESSAGE))
    return;
  recordDegradation({ kind: "bus-stale", subject, reason });
}
function createLiveBusEmitter() {
  let emit;
  let getter;
  return {
    wire(next) {
      emit = next;
      getter = void 0;
    },
    wireGetter(next) {
      getter = next;
      emit = void 0;
    },
    resolve() {
      const target = getter?.() ?? emit;
      if (!target)
        return { outcome: "unwired", ctxSource: "unwired" };
      if (typeof target === "function") {
        return { outcome: "ready", emit: target, ctxSource: "global-fallback" };
      }
      const ctxSource = "own";
      if (probeCtxActive(target.ctx) === false) {
        return { outcome: "stale-session", ctxSource };
      }
      return { outcome: "ready", emit: target.emit, ctxSource };
    },
    reset() {
      emit = void 0;
      getter = void 0;
    }
  };
}
function resolveLiveBusEmitter(liveEmitter4, entry) {
  const resolution = liveEmitter4.resolve();
  if (resolution.outcome === "stale-session") {
    logBusEvent({
      ...entry(),
      outcome: "skipped_stale_session",
      level: "info",
      ctxSource: resolution.ctxSource
    });
  }
  return resolution;
}

// dist/clients/bus-publish.js
var liveEmitter = createLiveBusEmitter();

// dist/clients/disposition-publish.js
var liveEmitter2 = createLiveBusEmitter();

// dist/clients/read-guard.js
import { createHash as createHash3 } from "node:crypto";
import * as fs7 from "node:fs";

// dist/clients/file-time.js
import * as fs5 from "node:fs";
import * as path6 from "node:path";
var globalState = {
  reads: /* @__PURE__ */ new Map(),
  locks: /* @__PURE__ */ new Map()
};
var FileTime = class {
  sessionID;
  constructor(sessionID) {
    this.sessionID = sessionID;
  }
  /**
   * Record a file read with current stats
   * Call this after ANY file modification (including formatting)
   */
  read(filePath) {
    const absolutePath = path6.resolve(filePath);
    const stamp = createStamp(absolutePath);
    let sessionReads = globalState.reads.get(this.sessionID);
    if (!sessionReads) {
      sessionReads = /* @__PURE__ */ new Map();
      globalState.reads.set(this.sessionID, sessionReads);
    }
    sessionReads.set(absolutePath, stamp);
    return stamp;
  }
  /**
   * Get last recorded stamp for a file
   */
  get(filePath) {
    const absolutePath = path6.resolve(filePath);
    const sessionReads = globalState.reads.get(this.sessionID);
    return sessionReads?.get(absolutePath);
  }
  /**
   * Assert file hasn't changed since last read
   * Throws error if file modified externally - forces agent to re-read
   */
  assert(filePath) {
    const absolutePath = path6.resolve(filePath);
    const sessionReads = globalState.reads.get(this.sessionID);
    const recorded = sessionReads?.get(absolutePath);
    if (!recorded) {
      throw new FileTimeError(`You must read file ${absolutePath} before modifying it. Use the read tool first.`, absolutePath, "not-read");
    }
    const current = createStamp(absolutePath);
    const changed = current.mtime !== recorded.mtime || current.ctime !== recorded.ctime || current.size !== recorded.size;
    if (changed) {
      throw new FileTimeError(`File ${absolutePath} has been modified since it was last read.
Last modification: ${new Date(current.mtime ?? Date.now()).toISOString()}
Last read: ${recorded.readAt.toISOString()}

Please read the file again before modifying it.`, absolutePath, "modified");
    }
  }
  /**
   * Check if file has changed (non-throwing version of assert)
   */
  hasChanged(filePath) {
    const absolutePath = path6.resolve(filePath);
    const sessionReads = globalState.reads.get(this.sessionID);
    const recorded = sessionReads?.get(absolutePath);
    if (!recorded)
      return true;
    const current = createStamp(absolutePath);
    return current.mtime !== recorded.mtime || current.ctime !== recorded.ctime || current.size !== recorded.size;
  }
  /**
   * Acquire exclusive lock on file
   * Prevents concurrent modifications to same file
   */
  async withLock(filePath, fn) {
    const absolutePath = path6.resolve(filePath);
    while (globalState.locks.has(absolutePath)) {
      const existing = globalState.locks.get(absolutePath);
      if (existing)
        await existing;
    }
    const lockPromise = fn().finally(() => {
      globalState.locks.delete(absolutePath);
    });
    globalState.locks.set(absolutePath, lockPromise.then(() => {
    }, () => {
    }));
    return lockPromise;
  }
  /**
   * Clear all tracked files for this session
   */
  clear() {
    globalState.reads.delete(this.sessionID);
  }
  /**
   * Clear specific file tracking
   */
  clearFile(filePath) {
    const absolutePath = path6.resolve(filePath);
    const sessionReads = globalState.reads.get(this.sessionID);
    sessionReads?.delete(absolutePath);
  }
};
var FileTimeError = class extends Error {
  filePath;
  reason;
  constructor(message, filePath, reason) {
    super(message);
    this.name = "FileTimeError";
    this.filePath = filePath;
    this.reason = reason;
  }
};
function createStamp(filePath) {
  try {
    const stats = fs5.statSync(filePath);
    return {
      readAt: /* @__PURE__ */ new Date(),
      mtime: stats.mtime.getTime(),
      ctime: stats.ctime.getTime(),
      size: stats.size
    };
  } catch {
    return {
      readAt: /* @__PURE__ */ new Date(),
      mtime: void 0,
      ctime: void 0,
      size: void 0
    };
  }
}
function createFileTime(sessionID) {
  return new FileTime(sessionID);
}
function clearAllSessions() {
  globalState.reads.clear();
  globalState.locks.clear();
}

// dist/clients/lsp/diagnostic-binding.js
import { createHash as createHash2 } from "node:crypto";
import * as fs6 from "node:fs";
function resolveTouchVerdict(input) {
  const notifyIds = [...new Set(input.primaryNotifyWriteTimedOutServerIds)];
  const waitIds = input.diagnosticsTimedOut ? [...new Set(input.diagnosticsUnansweredServerIds)] : [];
  if (notifyIds.length === 0 && !input.diagnosticsTimedOut) {
    return { inconclusive: false };
  }
  const serverIds = [.../* @__PURE__ */ new Set([...notifyIds, ...waitIds])];
  const reason = notifyIds.length > 0 && input.diagnosticsTimedOut ? "mixed" : notifyIds.length > 0 ? "notify-write" : "diagnostics-wait";
  return {
    inconclusive: true,
    ...serverIds.length > 0 && { inconclusiveServerIds: serverIds },
    inconclusiveReason: reason
  };
}
function touchCoverageGap(result) {
  return result?.unconfirmedServerIds ?? [];
}
function touchCompletedConfirmationPolicy(result) {
  return result?.confirmation !== void 0;
}
function auxiliaryPublicationEvidence({ bindingMatchesContent, baseline, currentPathVersion, raced = true }) {
  return bindingMatchesContent || raced && Number.isFinite(baseline) && currentPathVersion !== void 0 && currentPathVersion > baseline;
}
function auxiliaryCoverageGap(evidence) {
  return evidence.filter((aux) => aux.outcome !== "answered" && aux.publishedThisContent !== true).map((aux) => aux.serverId);
}
function hashDiagnosticContent(content) {
  return createHash2("sha256").update(content).digest("hex");
}
function composeBoundToCurrentDisk(values) {
  if (values.some((v) => v === false))
    return false;
  if (values.every((v) => v === "unknown")) {
    return "unknown";
  }
  return true;
}
function bindingStateLabel(value) {
  if (value === true)
    return "bound";
  if (value === false)
    return "mismatch";
  return "unknown";
}
var DISK_BINDING_MEMO_MAX = 4096;
function createDiskBindingCache() {
  const diskHashByPath = new PathKeyedMap(normalizeEphemeralMapKey);
  return {
    boundToCurrentDisk(filePath, stored) {
      if (stored.contentHash === void 0)
        return "unknown";
      let stat2;
      try {
        stat2 = fs6.statSync(filePath);
      } catch {
        return "unknown";
      }
      let cached = diskHashByPath.get(filePath);
      if (!cached || cached.mtimeMs !== stat2.mtimeMs || cached.size !== stat2.size) {
        let diskHash;
        try {
          diskHash = hashDiagnosticContent(fs6.readFileSync(filePath, "utf-8"));
        } catch {
          return "unknown";
        }
        cached = { mtimeMs: stat2.mtimeMs, size: stat2.size, hash: diskHash };
        if (diskHashByPath.size >= DISK_BINDING_MEMO_MAX) {
          diskHashByPath.clear();
        }
        diskHashByPath.set(filePath, cached);
      }
      return cached.hash === stored.contentHash;
    }
  };
}

// dist/clients/eval-timestamp.js
import { performance as performance2 } from "node:perf_hooks";
var PI_LENS_EVAL_STARTED_MS = performance2.now();

// dist/clients/startup-timing.js
var PI_LENS_LOADED_FROM = import.meta.url.endsWith(".js") ? "dist" : "source";
var PI_LENS_EVALUATION_ORDINAL = nextModuleEvaluationOrdinal();
var PI_LENS_HOST_BOOT_MS = Math.round(PI_LENS_EVAL_STARTED_MS);

// dist/clients/session-scope.js
var REGISTRY_FAMILY = "session-scope.registry";
var REGISTRY_VERSION = 1;
function carriedCounter(cell, field) {
  const value = cell?.[field];
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : 0;
}
function registry() {
  let seed = { nextTicket: 0, orderTurn: 0 };
  return getProcessSingleton(REGISTRY_FAMILY, REGISTRY_VERSION, () => seed, (previous) => {
    seed = {
      nextTicket: carriedCounter(previous, "nextTicket"),
      orderTurn: carriedCounter(previous, "orderTurn")
    };
  });
}
var CAPTURED_SCOPE = /* @__PURE__ */ Symbol.for("pi-lens.session-scope.captured.v1");
var Scope = class {
  scopeId;
  role;
  parentScopeId;
  coordinatorId;
  retiredReason;
  /** The scope's store cells, by key (#3612); see {@link scopeCell}. */
  cells = /* @__PURE__ */ new Map();
  // The stale-write record keeps its `runtime-session:<subject>` subject.
  life = createGenerationSource("runtime-session");
  branch = createGenerationSource("session-branch");
  constructor(args) {
    this.scopeId = drawTicket();
    this.role = args.role;
    this.parentScopeId = args.parentScopeId;
    this.coordinatorId = args.coordinatorId;
  }
  branchEpoch() {
    return this.branch.current();
  }
  isLive() {
    return this.retiredReason === void 0;
  }
  retiredBy() {
    return this.retiredReason;
  }
  /** The first reason wins. */
  retire(reason) {
    if (this.retiredReason !== void 0)
      return;
    this.retiredReason = reason ?? "shutdown";
    this.life.bump();
  }
  moveBranch() {
    this.branch.bump();
  }
  capture() {
    const life = this.life.capture();
    const branch = this.branch.capture();
    return {
      generation: this.scopeId,
      scopeId: this.scopeId,
      branchEpoch: branch.generation,
      isCurrent: (level = "session") => life.isCurrent() && (level === "session" || branch.isCurrent()),
      guardedWrite: (subject, write) => life.guardedWrite(subject, write),
      [CAPTURED_SCOPE]: { scope: this, branch }
    };
  }
};
function drawTicket() {
  const state4 = registry();
  state4.nextTicket += 1;
  return state4.nextTicket;
}
function beginScope(args) {
  return new Scope(args);
}
function retireScope(scope, reason) {
  const wasLive = scope.isLive();
  scope.retire(reason);
  if (wasLive && reason === "superseded")
    logScopeTransition(scope, { transition: "end", reason });
}
function moveBranch(scope) {
  scope.moveBranch();
}
function nextOrderTurn() {
  const state4 = registry();
  state4.orderTurn += 1;
  return state4.orderTurn;
}
function logScopeTransition(scope, args) {
  logLatency({
    type: "phase",
    phase: "session_scope_transition",
    filePath: args.cwd ?? "<pi-lens>",
    durationMs: 0,
    metadata: {
      transition: args.transition,
      reason: args.reason,
      scopeId: scope.scopeId,
      parentScopeId: scope.parentScopeId,
      role: scope.role,
      branchEpoch: scope.branchEpoch(),
      sessionId: args.sessionId,
      evaluationOrdinal: PI_LENS_EVALUATION_ORDINAL,
      coordinatorId: scope.coordinatorId,
      handoffSource: args.handoffSource,
      ...args.detail
    }
  });
}
var sessionStores = /* @__PURE__ */ new Map();
function defineSessionStore(spec) {
  if (sessionStores.has(spec.name))
    throw new Error(`session store ${spec.name} is declared twice`);
  sessionStores.set(spec.name, spec);
  return spec;
}
function scopeCell(scope, key, init) {
  const cells = scope.cells;
  if (!cells.has(key) && init)
    cells.set(key, init());
  return cells.get(key);
}

// dist/clients/read-guard.js
var READ_GUARD_STATE_VERSION = 2;
var DEFAULT_CONFIG = {
  enabled: true,
  mode: "block",
  contextLines: 3,
  exemptions: [
    { pattern: "*.md", mode: "warn" },
    { pattern: "*.txt", mode: "allow" },
    { pattern: "*.log", mode: "allow" }
  ]
};
var READ_HASH_MAX_LINES = Math.max(0, Number.parseInt(process.env.PI_LENS_READ_GUARD_HASH_MAX_LINES ?? "3000", 10) || 3e3);
var READ_BINDING_MAX_BYTES = 4 * 1024 * 1024;
function hashFileBytes(filePath) {
  return createHash3("sha256").update(fs7.readFileSync(filePath)).digest("hex");
}
var ABSENT_SIZE = -1;
function observeAuthoredBytes(filePath, knownHash, authoredRanges) {
  try {
    const stat2 = fs7.statSync(filePath);
    const hash = knownHash !== void 0 ? knownHash : stat2.size <= READ_BINDING_MAX_BYTES ? hashFileBytes(filePath) : void 0;
    return {
      size: stat2.size,
      mtimeMs: stat2.mtimeMs,
      ctimeMs: stat2.ctimeMs,
      ...hash !== void 0 && { hash },
      ...authoredRanges !== void 0 && { authoredRanges },
      ...authoredRanges !== void 0 && {
        authoredLineCount: splitLines(fs7.readFileSync(filePath, "utf-8")).length
      }
    };
  } catch {
    return { size: ABSENT_SIZE, mtimeMs: 0, ctimeMs: 0 };
  }
}
function composeAuthoredRanges(previous, next, nextLineCount) {
  const ranges = previous.authoredLineCount !== void 0 && nextLineCount === previous.authoredLineCount ? [...previous.authoredRanges ?? [], ...next] : next;
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const [start, end] of sorted) {
    const last = merged.at(-1);
    if (last && start <= last[1] + 1)
      last[1] = Math.max(last[1], end);
    else
      merged.push([start, end]);
  }
  return merged;
}
function authoredRangeCovers(authored, touchedLines, editRanges) {
  if (authored.authoredRanges === void 0)
    return true;
  const requested = editRanges ?? (touchedLines ? [touchedLines] : void 0);
  return requested !== void 0 && requested.every(([start, end]) => authored.authoredRanges.some(([authoredStart, authoredEnd]) => start >= authoredStart && end <= authoredEnd));
}
function isValidAuthoredRanges(value) {
  return Array.isArray(value) && value.every((range) => Array.isArray(range) && range.length === 2 && Number.isFinite(range[0]) && Number.isFinite(range[1]));
}
function authoredBytesIntact(filePath, authored) {
  let stat2;
  try {
    stat2 = fs7.statSync(filePath);
  } catch {
    return authored.size === ABSENT_SIZE;
  }
  if (stat2.size === authored.size && stat2.mtimeMs === authored.mtimeMs && stat2.ctimeMs === authored.ctimeMs)
    return true;
  if (authored.hash === void 0 || stat2.size !== authored.size)
    return false;
  try {
    if (hashFileBytes(filePath) !== authored.hash)
      return false;
  } catch {
    return false;
  }
  authored.mtimeMs = stat2.mtimeMs;
  authored.ctimeMs = stat2.ctimeMs;
  return true;
}
var READ_GUARD_MAX_FILES = 256;
var READ_GUARD_MAX_RECORDS_PER_FILE = 128;
var NO_TRIM = {
  evictedCount: 0,
  evictedCreditCount: 0,
  evictedGenuineCount: 0
};
function enforceRecordCapForFile(records) {
  if (records.length <= READ_GUARD_MAX_RECORDS_PER_FILE)
    return NO_TRIM;
  const excess = records.length - READ_GUARD_MAX_RECORDS_PER_FILE;
  const evicted = /* @__PURE__ */ new Set();
  let evictedCreditCount = 0;
  for (let i = 0; i < records.length && evicted.size < excess; i++) {
    if (records[i].searchCredit !== void 0) {
      evicted.add(i);
      evictedCreditCount++;
    }
  }
  for (let i = 0; i < records.length && evicted.size < excess; i++) {
    evicted.add(i);
  }
  const kept = records.filter((_, i) => !evicted.has(i));
  records.length = 0;
  for (const record2 of kept)
    records.push(record2);
  return {
    evictedCount: excess,
    evictedCreditCount,
    evictedGenuineCount: excess - evictedCreditCount
  };
}
var READ_GUARD_MAX_EDITS_PER_FILE = 256;
var READ_GUARD_MAX_UNCONSUMED_FILES = 4096;
var READ_GUARD_MAX_AUTHORED_FILES = READ_GUARD_MAX_UNCONSUMED_FILES;
var READ_GUARD_MAX_CHECKED_CALLS = 16;
var READ_GUARD_MAX_CHECKED_PATHS_PER_CALL = 128;
var READ_GUARD_IDLE_EVICT_MS_DEFAULT = 30 * 6e4;
function _currentContentMatchesBindingForTests(filePath, binding) {
  try {
    const content = fs7.readFileSync(filePath, "utf-8");
    const boundContent = binding.fullFile ? content : splitLines(content).slice(binding.offset - 1, binding.offset - 1 + binding.limit).join("\n");
    return hashDiagnosticContent(boundContent) === binding.hash;
  } catch {
    return false;
  }
}
var currentContentMatchesBinding = _currentContentMatchesBindingForTests;
var RELOCATION_WINDOW_MIN = Math.max(1, Number.parseInt(process.env.PI_LENS_READ_GUARD_RELOCATION_WINDOW_MIN ?? "40", 10) || 40);
var RELOCATION_WINDOW_PER_EDIT = Math.max(0, Number.parseInt(process.env.PI_LENS_READ_GUARD_RELOCATION_WINDOW_PER_EDIT ?? "20", 10) || 20);
var RELOCATION_WINDOW_MAX = Math.max(RELOCATION_WINDOW_MIN, Number.parseInt(process.env.PI_LENS_READ_GUARD_RELOCATION_WINDOW_MAX ?? "400", 10) || 400);
function splitLines(text) {
  return text.split(/\r?\n/);
}
function lineContentHash(line) {
  const normalized = line.replace(/\s+/g, "");
  let hash = 2166136261;
  for (let i = 0; i < normalized.length; i++) {
    hash = Math.imul(hash ^ normalized.charCodeAt(i), 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
function readRangeCoversLine(read, lineNo) {
  return lineNo >= read.effectiveOffset && lineNo <= read.effectiveOffset + read.effectiveLimit - 1;
}
function newestViewOfLine(reads, lineNo) {
  for (let i = reads.length - 1; i >= 0; i -= 1) {
    if (reads[i].provisional !== true && readRangeCoversLine(reads[i], lineNo)) {
      return reads[i];
    }
  }
  return void 0;
}
function hashLines(lines, firstLine) {
  const hashes = {};
  lines.forEach((line, i) => {
    hashes[firstLine + i] = lineContentHash(line);
  });
  return lines.length > 0 ? hashes : void 0;
}
function captureLineHashes(filePath, offset, limit) {
  if (limit <= 0 || limit > READ_HASH_MAX_LINES)
    return void 0;
  try {
    const lines = splitLines(fs7.readFileSync(filePath, "utf-8"));
    const start = Math.max(1, offset);
    const end = Math.min(lines.length, offset + limit - 1);
    return hashLines(lines.slice(start - 1, end), start);
  } catch {
    return void 0;
  }
}
function deliveredLineEvidence(text, offset) {
  const lines = splitLines(text);
  return {
    lineCount: lines.length,
    lineHashes: lines.length <= READ_HASH_MAX_LINES ? hashLines(lines, offset) : void 0
  };
}
function currentLinesMatchReadSnapshot(filePath, read, [startLine, endLine]) {
  const hashes = read.lineHashes ?? {};
  const missingLines = [];
  const mismatchedLines = [];
  for (let lineNo = startLine; lineNo <= endLine; lineNo += 1) {
    if (!readRangeCoversLine(read, lineNo) || hashes[lineNo] === void 0) {
      missingLines.push(lineNo);
    }
  }
  if (missingLines.length > 0) {
    return { checked: false, matches: false, missingLines, mismatchedLines };
  }
  let lines;
  try {
    lines = splitLines(fs7.readFileSync(filePath, "utf-8"));
  } catch {
    return {
      checked: true,
      matches: false,
      missingLines,
      mismatchedLines: [...Array(endLine - startLine + 1)].map((_, index) => startLine + index)
    };
  }
  for (let lineNo = startLine; lineNo <= endLine; lineNo += 1) {
    if (lineNo < 1 || lineNo > lines.length) {
      mismatchedLines.push(lineNo);
      continue;
    }
    if (lineContentHash(lines[lineNo - 1] ?? "") !== hashes[lineNo]) {
      mismatchedLines.push(lineNo);
    }
  }
  return {
    checked: true,
    matches: mismatchedLines.length === 0,
    missingLines,
    mismatchedLines
  };
}
var ReadGuard = class {
  config;
  reads = /* @__PURE__ */ new Map();
  edits = /* @__PURE__ */ new Map();
  fileLastUsed = /* @__PURE__ */ new Map();
  fileIdleTimers = /* @__PURE__ */ new Map();
  /** Reads remain behavior-gating until the corresponding edit is published. */
  consumedReadFiles = /* @__PURE__ */ new Set();
  fileTime;
  exemptions = /* @__PURE__ */ new Set();
  // One-time exemptions via /lens-allow-edit
  pendingCreations = /* @__PURE__ */ new Map();
  // Files that recordWritten() has fired on this session: the only evidence
  // of session authorship, independent of filesystem mtime granularity or
  // clock skew (NFS, FAT32, etc.) and of other writers' mtimes (#3520).
  // Each holds the content identity of the bytes the conversation last
  // wrote; authorship ends (`retired`) when the disk's bytes differ (#4131).
  writtenThisSession = /* @__PURE__ */ new Map();
  // #4187 R4-1: the paths each in-flight call's own `tool_call` pre-write
  // check ran on, keyed by the call id (`noteCheckedPaths`). A write that
  // carries no bytes of its own may re-baseline an authorship ONLY for a path
  // in its own call's set, because the set a tool NAMES at `tool_call` can be
  // narrower than the set it WRITES: a rename's importers, an ast-grep folder
  // or its project default, a server-initiated `workspace/applyEdit` that has
  // no call at all. Bounded by READ_GUARD_MAX_CHECKED_CALLS; session state,
  // so it dies with the guard every session start replaces, and a branch move
  // clears it with the authorship it licenses.
  checkedPathsByCall = /* @__PURE__ */ new Map();
  // Files whose write record idle-expired (#3520): `evictFile` drops the
  // authorship with the rest of the file's state, and a later zero-read edit
  // must say so instead of "you have not read" (false for a file the agent
  // wrote). Insertion order is eviction order; a branch move clears it with
  // the authorship it describes. Session-scoped like the guard: `/new` and
  // `/fork` build a fresh one, and a `/reload` does not carry it.
  expiredWrites = new BoundedSet(READ_GUARD_MAX_FILES);
  // Existence-independent index for hasKnownPath/forgetPath (#1668 review
  // F1). `this.key()` (normalizeFilePath) branches on whether `filePath`
  // currently exists on disk, on EVERY platform since #3098 — an existing
  // file resolves to its on-disk casing (win32: `realpathSync.native`;
  // POSIX: the on-disk casing of the trailing segments), a missing one to a
  // lowercased tail on win32 and to the caller's own spelling on POSIX.
  // recordRead/recordWritten always key while the file is still on disk
  // (real casing); hasKnownPath/forgetPath are queried AFTER an external
  // delete already landed, when the path no longer exists — recomputing
  // `this.key()` at that point returns a DIFFERENT string for any
  // mixed-case basename (win32 `MyModule.ts` → `mymodule.ts`; POSIX
  // `Components/x.ts` held against an on-disk `components/`), so a lookup
  // against `reads`/`writtenThisSession` silently misses. This index maps
  // a purely syntactic key (`normalizeEphemeralMapKey` — slash-fold +
  // lowercase, no filesystem access, so it never depends on current disk
  // state) to the REAL key `reads`/`writtenThisSession` used at record
  // time, so a post-delete lookup finds the same entry regardless of what
  // happened to the file since. Pruned inside `evictFile` so it never
  // outlives the record it points at.
  //
  // ONLY hasKnownPath/forgetPath route through this index, because only they
  // need the real key BACK. `noteCreatedFile` (keys while the file is still
  // absent) and `recordWritten` (keys after it exists) straddle the same
  // state change, and used to do it through `this.key()` directly — a
  // spelling whose key moved orphaned the `pendingCreations` entry and the
  // creation read was never injected (#3163, pre-existing on win32 and
  // reachable on POSIX since #3098). They now key `pendingCreations` by the
  // same existence-independent `normalizeEphemeralMapKey` spelling this index
  // is keyed by; no index is needed there, since the real key is derived by
  // `recordWritten` itself at the moment it is used.
  knownPathIndex = /* @__PURE__ */ new Map();
  /** Running per-file record-cap trim totals for this session (#1913 F1). */
  trimAccumulators = /* @__PURE__ */ new Map();
  sessionId;
  /**
   * The scope whose branch epoch this guard reads (#3611). Every
   * `retainBranch` moves it (#3521). A deferred writer captures the epoch
   * before it awaits, and `recordWritten` refuses the write when a `/tree`
   * moved the conversation in between (catalog shape 22). A guard built
   * outside a coordinator owns a scope of its own.
   */
  scope;
  constructor(sessionId, config = {}, scope = beginScope({ role: "primary" })) {
    this.scope = scope;
    this.sessionId = sessionId;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.fileTime = createFileTime(sessionId);
  }
  /**
   * Canonical Map key for a file path. Read sources arrive with mixed
   * separators/casing — the Read tool gives OS-native backslashes on Windows,
   * while LSP-expanded and search-tool reads arrive slash-normalized from URIs.
   * Keying the reads/edits/exemptions maps on the raw path made a read recorded
   * under one form invisible to an edit checked under another, producing a false
   * `zero_read` block despite the file having been read. `normalizeFilePath`
   * folds separators and Windows casing to one key, so record and lookup always
   * agree. Every map access in this class MUST key through here.
   */
  key(filePath) {
    return normalizeFilePath(filePath);
  }
  /**
   * License keys compare paths independently resolved by the tool_call and
   * the writer. Unlike the general map key, this identity must collapse a
   * symlink spelling to the file it names; missing files retain an absolute
   * resolved fallback so the comparison still fails closed.
   */
  licenseKey(filePath) {
    return normalizeFilePath(realpathOrResolve(filePath));
  }
  idleEvictMs() {
    const value = Number.parseInt(process.env.PI_LENS_READ_GUARD_IDLE_EVICT_MS ?? "", 10);
    return Number.isSafeInteger(value) && value > 0 ? value : READ_GUARD_IDLE_EVICT_MS_DEFAULT;
  }
  clearFileTimer(filePath) {
    const timer = this.fileIdleTimers.get(filePath);
    if (timer)
      clearTimeout(timer);
    this.fileIdleTimers.delete(filePath);
  }
  /**
   * #1918: `enforceRecordCapForFile` (the per-file record cap) is the only
   * `read-guard.ts` eviction path #1913 gave a bounded record. This whole-file
   * evictor has four call sites — `enforceFileCap`'s consumed-file cap, its
   * unconsumed-file cap, `touchFile`'s idle timer, and `forgetPath`'s
   * external-delete cleanup — and none of them left any trace. A live
   * regression in any of the four (e.g. a cap set too low) dropped a file's
   * read/edit history with nothing in `~/.pi-lens/read-guard.log` to show it
   * happened.
   *
   * Follows #1913's aggregate-after-first pattern for the three PRESSURE
   * reasons (cap exhaustion, external delete): `incrementDegradationCount`
   * keeps the exact per-file eviction tally (and its own power-of-two
   * milestone rows in latency.log) while the read-guard.log line fires only
   * on the rising edge, so a file evicted repeatedly across a session can't
   * flood the log.
   *
   * `idle-timeout` is deliberately excluded from the ledger tally and, for a
   * file that carried no write record, from the log line (#1918 review F2):
   * idle eviction is designed housekeeping, not a fault signal — N is
   * unbounded (every distinct file path touched that session is its own
   * ledger subject). Recording it here would grow the ledger's tally map
   * without bound and spam `pilens_health` in every healthy session, unlike
   * the other three reasons, which are rare by construction (only real
   * pressure or an explicit delete reaches them). The one exception is a
   * dropped write record (#3520): it changes the next edit's verdict, so
   * {@link noteExpiredWrite} logs it once per file, outside the ledger.
   */
  evictFile(filePath, reason) {
    this.clearFileTimer(filePath);
    this.reads.delete(filePath);
    this.edits.delete(filePath);
    this.fileLastUsed.delete(filePath);
    this.consumedReadFiles.delete(filePath);
    const droppedAuthorship = this.writtenThisSession.delete(filePath);
    for (const [syntacticKey, stored] of this.knownPathIndex) {
      if (stored === filePath)
        this.knownPathIndex.delete(syntacticKey);
    }
    if (reason === "idle-timeout") {
      if (droppedAuthorship)
        this.noteExpiredWrite(filePath);
      return;
    }
    const isRisingEdge = incrementDegradationCount({
      kind: "read-guard-file-evicted",
      subject: filePath,
      reason: `evicted (${reason})`
    });
    if (isRisingEdge) {
      logReadGuardEvent({
        event: "read_file_evicted",
        sessionId: this.sessionId,
        filePath,
        metadata: { reason }
      });
    }
  }
  /**
   * #3520: remember that an idle eviction dropped this file's write record,
   * and log it once per file (the set is the once-only gate). The set holds
   * at most `READ_GUARD_MAX_FILES` files, oldest dropped first.
   */
  noteExpiredWrite(filePath, reason = "idle-timeout") {
    if (this.expiredWrites.has(filePath))
      return;
    this.expiredWrites.add(filePath);
    if (reason === "authorship-cap") {
      const isRisingEdge = incrementDegradationCount({
        kind: "read-guard-authorship-cap",
        subject: this.sessionId,
        reason: "authorship cap evicted a live write record"
      });
      if (isRisingEdge) {
        logReadGuardEvent({
          event: "read_file_evicted",
          sessionId: this.sessionId,
          filePath,
          metadata: { reason, authorshipDropped: true }
        });
      }
      return;
    }
    logReadGuardEvent({
      event: "read_file_evicted",
      sessionId: this.sessionId,
      filePath,
      metadata: { reason, authorshipDropped: true }
    });
  }
  /**
   * #4187 R2-6: hold `writtenThisSession` at READ_GUARD_MAX_AUTHORED_FILES.
   * A retired entry blocks like no entry, so it goes first; a live one is
   * dropped least recently credited first, as an expired write (#3520).
   */
  enforceAuthorshipCap() {
    let excess = this.writtenThisSession.size - READ_GUARD_MAX_AUTHORED_FILES;
    if (excess <= 0)
      return;
    for (const [filePath, authored] of this.writtenThisSession) {
      if (excess <= 0)
        return;
      if (!authored.retired)
        continue;
      this.writtenThisSession.delete(filePath);
      excess -= 1;
    }
    for (const filePath of this.writtenThisSession.keys()) {
      if (excess <= 0)
        return;
      this.writtenThisSession.delete(filePath);
      this.noteExpiredWrite(filePath, "authorship-cap");
      excess -= 1;
    }
  }
  touchFile(filePath) {
    const now = Date.now();
    this.fileLastUsed.set(filePath, now);
    this.clearFileTimer(filePath);
    if (this.reads.has(filePath) && !this.consumedReadFiles.has(filePath))
      return;
    const stamp = now;
    const timer = setTimeout(() => {
      if (this.fileLastUsed.get(filePath) !== stamp)
        return;
      if (this.reads.has(filePath) && !this.consumedReadFiles.has(filePath))
        return;
      this.evictFile(filePath, "idle-timeout");
    }, this.idleEvictMs());
    timer.unref?.();
    this.fileIdleTimers.set(filePath, timer);
  }
  enforceFileCap() {
    while (this.reads.size > READ_GUARD_MAX_FILES) {
      const victim = [...this.reads.keys()].filter((filePath) => this.consumedReadFiles.has(filePath)).sort((a, b) => (this.fileLastUsed.get(a) ?? 0) - (this.fileLastUsed.get(b) ?? 0))[0];
      if (!victim)
        break;
      this.evictFile(victim, "file-cap-consumed");
    }
    while (this.reads.size > READ_GUARD_MAX_UNCONSUMED_FILES) {
      const victim = [...this.reads.keys()].filter((filePath) => !this.consumedReadFiles.has(filePath)).sort((a, b) => (this.fileLastUsed.get(a) ?? 0) - (this.fileLastUsed.get(b) ?? 0))[0];
      if (!victim)
        break;
      this.evictFile(victim, "file-cap-unconsumed");
    }
  }
  // --- Public API ---
  /**
   * Drop every provisional native-read capture still held. The run boundary's
   * backstop (`handleAgentEnd`): a call's capture is released when the call
   * ends ({@link dropProvisionalReadByCall}), and only a run that dies
   * between a read's tool_call and its tool_execution_end leaves one here
   * (#4185 R2-3, round 4). Returns how many it dropped.
   */
  dropProvisionalReads() {
    let dropped = 0;
    for (const [filePath, records] of this.reads) {
      const kept = records.filter((record2) => {
        if (!record2.provisional)
          return true;
        dropped += 1;
        return false;
      });
      if (kept.length === 0)
        this.reads.delete(filePath);
      else if (kept.length !== records.length)
        this.reads.set(filePath, kept);
    }
    return dropped;
  }
  /**
   * Drop the tool_call capture of the read call `toolCallId` (the record
   * whose `source` is `native-read:<call>:provisional`), whatever path
   * spelling the call's result carries. The delivered record supersedes it
   * ({@link recordRead}); a call that ended in error, failed by the host or
   * blocked by a later extension, releases it at tool_execution_end
   * (`handleToolExecutionEnd`), because alone it satisfied the zero-read
   * check for an oldText edit of lines the agent never saw (#4185 rounds 2
   * to 4; `formal/read-guard` FailedReadLive, BlockedReadLive). Keyed by
   * the call's own identity: a nested call's is unique where its parent's,
   * the transcript identity a record carries, is shared by every read a
   * script makes. Returns whether a capture was found.
   */
  dropProvisionalReadByCall(toolCallId) {
    for (const [filePath, records] of this.reads) {
      const source = `native-read:${toolCallId}:provisional`;
      const index = records.findIndex((record2) => record2.source === source);
      if (index < 0)
        continue;
      records.splice(index, 1);
      if (records.length === 0)
        this.reads.delete(filePath);
      return true;
    }
    return false;
  }
  /**
   * Record that a file was read.
   * Call this from the tool_call handler after any LSP expansion.
   */
  recordRead(record2, opts) {
    const filePath = this.key(record2.filePath);
    if (opts?.supersedes)
      this.dropProvisionalReadByCall(opts.supersedes.toolCallId);
    this.knownPathIndex.set(normalizeEphemeralMapKey(record2.filePath), filePath);
    const storedRecord = {
      ...record2,
      filePath,
      lineHashes: record2.lineHashes ?? (opts?.captureLineHashes === false ? void 0 : captureLineHashes(filePath, record2.effectiveOffset, record2.effectiveLimit))
    };
    const arr = this.reads.get(storedRecord.filePath) ?? [];
    this.consumedReadFiles.delete(storedRecord.filePath);
    arr.push(storedRecord);
    this.reads.set(storedRecord.filePath, arr);
    const rawReadCountForFile = arr.length;
    const { evictedCount: evictedRecordCount, evictedCreditCount, evictedGenuineCount } = enforceRecordCapForFile(arr);
    this.touchFile(storedRecord.filePath);
    this.enforceFileCap();
    logReadGuardEvent({
      event: "read_recorded",
      sessionId: this.sessionId,
      filePath: storedRecord.filePath,
      requestedOffset: storedRecord.requestedOffset,
      requestedLimit: storedRecord.requestedLimit,
      effectiveOffset: storedRecord.effectiveOffset,
      effectiveLimit: storedRecord.effectiveLimit,
      symbol: storedRecord.enclosingSymbol?.name,
      symbolKind: storedRecord.enclosingSymbol?.kind,
      symbolStartLine: storedRecord.enclosingSymbol?.startLine,
      symbolEndLine: storedRecord.enclosingSymbol?.endLine,
      metadata: {
        expandedByLsp: storedRecord.expandedByLsp,
        turnIndex: storedRecord.turnIndex,
        writeIndex: storedRecord.writeIndex,
        readCountForFile: arr.length,
        hashLineCount: Object.keys(storedRecord.lineHashes ?? {}).length,
        ...storedRecord.source !== void 0 && {
          source: storedRecord.source
        },
        ...storedRecord.searchCredit !== void 0 && {
          searchCreditReason: storedRecord.searchCredit.reason,
          searchCreditMarginBefore: storedRecord.searchCredit.marginBefore,
          searchCreditMarginAfter: storedRecord.searchCredit.marginAfter
        },
        ...evictedRecordCount > 0 && {
          evictedRecordCount,
          rawReadCountForFile
        }
      }
    });
    if (evictedRecordCount > 0) {
      const key = storedRecord.filePath;
      const acc = this.trimAccumulators.get(key) ?? {
        totalEvicted: 0,
        evictedCreditCount: 0,
        evictedGenuineCount: 0,
        trimEventCount: 0
      };
      acc.totalEvicted += evictedRecordCount;
      acc.evictedCreditCount += evictedCreditCount;
      acc.evictedGenuineCount += evictedGenuineCount;
      acc.trimEventCount += 1;
      this.trimAccumulators.set(key, acc);
      const isRisingEdge = incrementDegradationCount({
        kind: "read-guard-record-cap-trim",
        subject: key,
        reason: `trim #${acc.trimEventCount}: evicted ${evictedRecordCount} (credit ${evictedCreditCount}, genuine ${evictedGenuineCount})`
      });
      if (isRisingEdge) {
        logReadGuardEvent({
          event: "read_cap_trimmed",
          sessionId: this.sessionId,
          filePath: storedRecord.filePath,
          metadata: {
            trimEventCount: acc.trimEventCount,
            evictedRecordCount: acc.totalEvicted,
            evictedCreditCount: acc.evictedCreditCount,
            evictedGenuineCount: acc.evictedGenuineCount,
            rawReadCountForFile
          }
        });
      }
    }
    if (opts?.stampFileTime !== false)
      this.fileTime.read(storedRecord.filePath);
  }
  /**
   * #4131: end the file's authorship when its bytes are no longer the ones the
   * conversation last wrote. Called by every guard decision that relies on
   * authorship: the zero-read edit check, and the start of a write that
   * carries no bytes of its own (a recognized bash write's tool_call, the
   * agent_end drain), which would otherwise re-baseline over the other
   * writer's bytes. Returns true when it ended the authorship here.
   */
  retireChangedAuthorship(rawFilePath) {
    return this.retireIfChanged(this.key(rawFilePath));
  }
  /**
   * #4187 R4-1: record the paths THIS call's `tool_call` pre-write check ran
   * on, so the call's own bytes-less write may advance exactly those and no
   * other path it changes. The `tool_call` handler calls it beside
   * {@link retireChangedAuthorship}: the licensed set IS the checked set.
   *
   * A call id both sides normalize with `sanitizeCorrelationId`, so a producer
   * passes the host's raw id. No id (a server-initiated `workspace/applyEdit`,
   * a drain) licenses nothing. Both caps fail closed: a path past
   * READ_GUARD_MAX_CHECKED_PATHS_PER_CALL, or one named by a call evicted
   * past READ_GUARD_MAX_CHECKED_CALLS, ends an authorship instead of
   * re-baselining it, which costs a read and never vouches for a byte the
   * conversation did not see.
   */
  noteCheckedPaths(rawToolCallId, rawPaths) {
    const toolCallId = sanitizeCorrelationId(rawToolCallId);
    if (toolCallId === void 0 || rawPaths.length === 0)
      return;
    let checked = this.checkedPathsByCall.get(toolCallId);
    if (!checked) {
      checked = /* @__PURE__ */ new Set();
      this.checkedPathsByCall.set(toolCallId, checked);
      while (this.checkedPathsByCall.size > READ_GUARD_MAX_CHECKED_CALLS) {
        const oldest = this.checkedPathsByCall.keys().next();
        if (oldest.done === true)
          break;
        this.checkedPathsByCall.delete(oldest.value);
      }
    }
    for (const rawPath of rawPaths) {
      if (checked.size >= READ_GUARD_MAX_CHECKED_PATHS_PER_CALL)
        return;
      checked.add(this.licenseKey(rawPath));
    }
  }
  /**
   * Consume whether `toolCallId`'s own `tool_call` licensed this path
   * ({@link noteCheckedPaths}). A `(call,path)` license is single-use: a
   * settled call id must not re-baseline a later writer's bytes.
   */
  consumeCheckedAtCall(toolCallId, filePath) {
    const callId = sanitizeCorrelationId(toolCallId);
    if (callId === void 0)
      return false;
    const checked = this.checkedPathsByCall.get(callId);
    const licensedPath = this.licenseKey(filePath);
    if (checked?.has(licensedPath) !== true)
      return false;
    checked.delete(licensedPath);
    if (checked.size === 0)
      this.checkedPathsByCall.delete(callId);
    return true;
  }
  /**
   * {@link retireChangedAuthorship} on a key. `writer` names a write that
   * ended it after the fact (a bridge write, which no pre-write check
   * guarded), so the record tells the two triggers apart.
   */
  retireIfChanged(filePath, writer3, force = false) {
    const authored = this.writtenThisSession.get(filePath);
    if (!authored || authored.retired || !force && authoredBytesIntact(filePath, authored))
      return false;
    authored.retired = true;
    const isRisingEdge = incrementDegradationCount({
      kind: "read-guard-authorship-retired",
      subject: filePath,
      reason: force ? "authored range was unknown; the next edit needs a read" : "another writer changed the bytes the conversation wrote; the next edit needs a read"
    });
    if (isRisingEdge)
      logReadGuardEvent({
        event: "authorship_retired",
        sessionId: this.sessionId,
        filePath,
        metadata: {
          authoredSize: authored.size,
          hashed: authored.hash !== void 0,
          ...writer3 !== void 0 && { writer: writer3 },
          ...authored.toolCallId !== void 0 && {
            toolCallId: authored.toolCallId
          }
        }
      });
    return true;
  }
  /**
   * #3525: whether the disk may hold bytes no read or own write accounts
   * for: FileTime moved since its stamp, or there is none. An edit that
   * passes `checkEdit` then did so on other evidence (line hashes, a
   * resolved oldText), and its own write must not re-stamp FileTime.
   */
  fileTimeMoved(filePath) {
    return this.fileTime.hasChanged(this.key(filePath));
  }
  /**
   * #3524: whether another write moved the file after its last FileTime
   * stamp (a native read's tool_call takes one). False when there is no
   * stamp at all: nothing says when the delivered bytes were read.
   */
  diskMovedSinceStamp(filePath) {
    const key = this.key(filePath);
    return this.fileTime.get(key) !== void 0 && this.fileTime.hasChanged(key);
  }
  /**
   * Record a structured symbol read (the `readSymbol` engine capability / its
   * MCP mirror) as a genuine read of that symbol's line range — the
   * read-substitute tie-in for #245. `readSymbol` returns the verbatim body, so
   * an edit within [startLine, endLine] is legitimately covered, exactly like a
   * TS/LSP-expanded read that delivered the whole enclosing symbol. Line hashes
   * for the range are captured by recordRead, so the edit is also
   * snapshot-verified (drift since the symbol read still blocks).
   *
   * Intentionally NOT offered for module *outlines*: an outline shows a symbol's
   * shape (name/signature/range), not its body, so granting edit coverage from
   * it would let the agent edit lines it never saw. Only a body-delivering read
   * (readSymbol / raw Read) records coverage.
   */
  recordSymbolRead(filePath, symbol, turnIndex, writeIndex, toolCallId) {
    const span = Math.max(1, symbol.endLine - symbol.startLine + 1);
    this.recordRead({
      filePath,
      requestedOffset: symbol.startLine,
      requestedLimit: span,
      effectiveOffset: symbol.startLine,
      effectiveLimit: span,
      expandedByLsp: false,
      enclosingSymbol: {
        name: symbol.name,
        kind: symbol.kind,
        startLine: symbol.startLine,
        endLine: symbol.endLine
      },
      turnIndex,
      writeIndex,
      timestamp: Date.now(),
      ...toolCallId !== void 0 && { toolCallId }
    });
  }
  /**
   * Check if an edit should be allowed.
   * Returns verdict with action and optional reason for blocking.
   */
  checkEdit(filePath, touchedLines, editRanges, options) {
    filePath = this.key(filePath);
    if (this.reads.has(filePath) || this.edits.has(filePath))
      this.touchFile(filePath);
    if (this.exemptions.has(filePath)) {
      this.exemptions.delete(filePath);
      const verdict2 = this.allow();
      this.recordVerdict(filePath, "edit", touchedLines, verdict2, {
        reasonKind: "manual_exemption"
      });
      return verdict2;
    }
    const exemptionMode = this.getExemptionMode(filePath);
    if (exemptionMode === "allow") {
      const verdict2 = this.allow();
      this.recordVerdict(filePath, "edit", touchedLines, verdict2, {
        reasonKind: "pattern_exemption",
        exemptionMode
      });
      return verdict2;
    }
    const effectiveMode = exemptionMode === "warn" ? "warn" : void 0;
    const fileReads = this.reads.get(filePath);
    if (!fileReads || fileReads.length === 0) {
      this.retireChangedAuthorship(filePath);
      if (this.writtenThisSession.get(filePath)?.retired) {
        const verdict3 = this.blockOrWarn("authorship-retired", `\u{1F504} RETRYABLE \u2014 File modified since your write: \`${filePath}\` no longer holds the bytes this conversation wrote. Read it first, then retry: \`read path="${filePath}"\`.`, void 0, effectiveMode);
        this.recordVerdict(filePath, "edit", touchedLines, verdict3, {
          reasonKind: "authorship_retired"
        });
        return verdict3;
      }
      const authored = this.writtenThisSession.get(filePath);
      if (authored && authoredRangeCovers(authored, touchedLines, editRanges)) {
        const verdict3 = this.allow();
        this.recordVerdict(filePath, "edit", touchedLines, verdict3, {
          reasonKind: "session_authored"
        });
        return verdict3;
      }
      if (authored) {
        const verdict3 = this.blockOrWarn("authorship-range", `\u{1F504} RETRYABLE \u2014 Edit without read: this write only covered part of \`${filePath}\`; read the requested lines first, then retry.`, void 0, effectiveMode);
        this.recordVerdict(filePath, "edit", touchedLines, verdict3, {
          reasonKind: "authorship_range"
        });
        return verdict3;
      }
      const writeRecordExpired = this.expiredWrites.has(filePath);
      const verdict2 = this.blockOrWarn("zero-read", writeRecordExpired ? `\u{1F504} RETRYABLE \u2014 Edit without read: the earlier write record for \`${filePath}\` expired, so it needs a read again. Read it first, then retry: \`read path="${filePath}"\`.` : `\u{1F504} RETRYABLE \u2014 Edit without read: you have not read \`${filePath}\` in this conversation. Read it first, then retry: \`read path="${filePath}"\`.`, void 0, effectiveMode);
      this.recordVerdict(filePath, "edit", touchedLines, verdict2, {
        reasonKind: "zero_read",
        ...writeRecordExpired ? { writeRecordExpired } : {}
      });
      return verdict2;
    }
    const lastBoundRead = [...fileReads].reverse().find((read) => read.contentBinding !== void 0);
    if (lastBoundRead?.contentBinding && !currentContentMatchesBinding(filePath, lastBoundRead.contentBinding) && !this.newerReadSupersedesBinding(filePath, fileReads, lastBoundRead, touchedLines, editRanges)) {
      const verdict2 = this.blockOrWarn("file-modified", `\u{1F504} RETRYABLE \u2014 File modified since read

You last read \`${filePath}\` at ${new Date(lastBoundRead.timestamp).toISOString()}.
The file content no longer matches the bridge-recorded read.

Your mental model is out of sync with the actual file content.
To proceed:
  1. Re-read the file: \`read path="${filePath}"\``, void 0, effectiveMode);
      this.recordVerdict(filePath, "edit", touchedLines, verdict2, {
        reasonKind: "file_modified",
        lastReadTimestamp: lastBoundRead.timestamp,
        contentBindingMismatch: true
      });
      return verdict2;
    }
    let ignoredHashStaleness = false;
    let ignoredOldTextResolvedStaleness = false;
    if (this.fileTime.hasChanged(filePath)) {
      const lastRead = fileReads[fileReads.length - 1];
      if (options?.oldTextResolved === true) {
        ignoredOldTextResolvedStaleness = true;
      } else if (this.canIgnoreStalenessByHashes(filePath, fileReads, touchedLines, editRanges)) {
        ignoredHashStaleness = true;
      } else {
        const verdict2 = this.blockOrWarn("file-modified", `\u{1F504} RETRYABLE \u2014 File modified since read

You last read \`${filePath}\` at ${new Date(lastRead.timestamp).toISOString()}.
The file has been modified on disk since then (auto-format, external tool, or previous edit).

Your mental model is out of sync with the actual file content.
To proceed:
  1. Re-read the file: \`read path="${filePath}"\``, void 0, effectiveMode);
        this.recordVerdict(filePath, "edit", touchedLines, verdict2, {
          reasonKind: "file_modified",
          lastReadTimestamp: lastRead.timestamp
        });
        return verdict2;
      }
    }
    if (!touchedLines) {
      const verdict2 = this.allow();
      this.recordVerdict(filePath, "edit", touchedLines, verdict2, {
        reasonKind: "no_line_info"
      });
      return verdict2;
    }
    const rangesToCheck = editRanges && editRanges.length > 1 ? editRanges : [touchedLines];
    let viaSymbol = false;
    for (const range of rangesToCheck) {
      const coverage = this.checkCoverage(filePath, range);
      if (!coverage.covered) {
        const lastRead = fileReads[fileReads.length - 1];
        const [editStart, editEnd] = range;
        const lastReadEnd = lastRead.effectiveOffset + lastRead.effectiveLimit - 1;
        const outOfRangeMode = options?.oldTextResolved ? "warn" : effectiveMode;
        const verdict2 = this.blockOrWarn("out-of-range", `\u{1F504} RETRYABLE \u2014 Edit outside read range

You read \`${filePath}\` lines ${lastRead.effectiveOffset}-${lastReadEnd}${lastRead.enclosingSymbol ? ` (${lastRead.enclosingSymbol.kind} \`${lastRead.enclosingSymbol.name}\`)` : ""}, but your edit touches lines ${editStart}-${editEnd}.

Read the relevant section first, then retry the edit:
  \`read path="${filePath}" offset=${Math.max(1, editStart - 5)} limit=${Math.min(30, editEnd - editStart + 10)}\``, {
          editRange: range,
          readRanges: fileReads.map((r) => ({
            start: r.effectiveOffset,
            end: r.effectiveOffset + r.effectiveLimit - 1
          })),
          symbolRanges: fileReads.filter((r) => r.enclosingSymbol).map((r) => ({
            name: r.enclosingSymbol.name,
            start: r.enclosingSymbol.startLine,
            end: r.enclosingSymbol.endLine
          }))
        }, outOfRangeMode);
        this.recordVerdict(filePath, "edit", touchedLines, verdict2, {
          reasonKind: "out_of_range",
          oldTextResolved: options?.oldTextResolved ?? false
        });
        return verdict2;
      }
      const snapshotValidation = this.validateRangeSnapshot(filePath, range, !!options?.skipSnapshotCheck);
      if (snapshotValidation.shouldBlock && !options?.skipSnapshotCheck) {
        const [editStart, editEnd] = range;
        const relocation = this.findRelocation(filePath, fileReads, range);
        const relocationNote = relocation ? `

\u{1F4CD} The content you read at lines ${relocation.from[0]}-${relocation.from[1]} now appears unchanged at lines ${relocation.to[0]}-${relocation.to[1]} \u2014 it shifted position. Re-target your edit to lines ${relocation.to[0]}-${relocation.to[1]}.` : "";
        const verdict2 = this.blockOrWarn("range-stale", `\u{1F504} RETRYABLE \u2014 Edit range changed since read

You are editing \`${filePath}\` lines ${editStart}-${editEnd}, but those lines no longer match the content you read earlier.${relocationNote}

Re-read the relevant section, then retry the edit using the current line range/content:
  \`read path="${filePath}" offset=${Math.max(1, editStart - 5)} limit=${Math.min(30, editEnd - editStart + 10)}\``, {
          editRange: range,
          readRanges: fileReads.map((r) => ({
            start: r.effectiveOffset,
            end: r.effectiveOffset + r.effectiveLimit - 1
          })),
          symbolRanges: fileReads.filter((r) => r.enclosingSymbol).map((r) => ({
            name: r.enclosingSymbol.name,
            start: r.enclosingSymbol.startLine,
            end: r.enclosingSymbol.endLine
          })),
          snapshot: {
            status: snapshotValidation.status,
            mismatchedLines: snapshotValidation.mismatchedLines,
            missingLines: snapshotValidation.missingLines
          },
          ...relocation ? { relocation } : {}
        }, effectiveMode);
        if (relocation && rangesToCheck.length === 1) {
          verdict2.relocation = relocation;
        }
        this.recordVerdict(filePath, "edit", touchedLines, verdict2, {
          reasonKind: "range_stale",
          range,
          mismatchedLines: snapshotValidation.mismatchedLines.slice(0, 20),
          relocatedTo: relocation?.to ?? null,
          relocationAutoApplyOffered: !!verdict2.relocation
        });
        return verdict2;
      }
      if (coverage.viaSymbol)
        viaSymbol = true;
    }
    const verdict = this.allow();
    this.recordVerdict(filePath, "edit", touchedLines, verdict, {
      reasonKind: ignoredOldTextResolvedStaleness ? "file_modified_oldtext_unique" : viaSymbol ? "symbol_coverage" : "range_coverage",
      viaSymbol,
      ignoredHashStaleness,
      oldTextResolved: ignoredOldTextResolvedStaleness
    });
    return verdict;
  }
  /**
   * Check if this is a new file (no existing file on disk).
   * New file writes are exempt from the guard.
   */
  isNewFile(filePath) {
    try {
      return !fs7.existsSync(filePath);
    } catch {
      return true;
    }
  }
  /**
   * Whether pi-lens has any record of this path from a read or write this
   * session (#1668). Gates external-delete detection: a path pi-lens never
   * read or wrote is one no LSP server's cache was ever told about through
   * us, so an `rm` naming it carries no signal worth checking disk for —
   * this is a lookup against state already being tracked, never a fresh
   * filesystem stat over an unbounded path set.
   *
   * MUST go through `knownPathIndex`, not `this.key(filePath)` directly
   * (#1668 review F1): this is called AFTER a bash delete has already
   * landed, when `filePath` no longer exists — `this.key()` at that point
   * returns a lowercased-tail key, not the real-casing key `recordRead`/
   * `recordWritten` stored while the file was still on disk. For a
   * mixed-case basename (`MyModule.ts`) the two keys differ and a direct
   * `this.key()` lookup always misses.
   */
  hasKnownPath(filePath) {
    const stored = this.knownPathIndex.get(normalizeEphemeralMapKey(filePath));
    return stored !== void 0 && (this.reads.has(stored) || this.writtenThisSession.has(stored));
  }
  /**
   * Every path this guard has a read or a write record for, as normalized keys
   * (#2430).
   *
   * This is the read-guard half of the observational net's TRACKED-FILE SET:
   * the files pi-lens has actually seen this session, which the `agent_settled`
   * sweep hash-checks instead of walking the workspace. It reads state already
   * held in memory and stats nothing; both backing containers are capped
   * (`READ_GUARD_MAX_UNCONSUMED_FILES`), so the result is bounded by
   * construction.
   *
   * `touchFile` is deliberately NOT called: enumerating is not using, and
   * refreshing every entry's idle clock on each sweep would make the idle
   * eviction unreachable.
   */
  getTrackedPaths() {
    const tracked = new Set(this.reads.keys());
    for (const written of this.writtenThisSession.keys())
      tracked.add(written);
    return [...tracked];
  }
  /**
   * Drop all record of a path pi-lens confirmed no longer exists on disk
   * (#1668, external delete). Without this a later write reusing the same
   * path would inherit a stale writtenThisSession/reads entry from before
   * the delete, and a repeat `rm` of the same already-gone path would keep
   * matching {@link hasKnownPath} and re-emitting a type-3 notification.
   *
   * MUST evict through `knownPathIndex`, not `this.key(filePath)` directly
   * (#1668 review F1) — same reasoning as {@link hasKnownPath}: `filePath`
   * is already gone from disk by the time this runs, so recomputing
   * `this.key()` targets the wrong (lowercased-tail) key for a mixed-case
   * basename and leaves the real entry behind un-evicted.
   */
  forgetPath(filePath) {
    const stored = this.knownPathIndex.get(normalizeEphemeralMapKey(filePath));
    this.evictFile(stored ?? this.key(filePath), "external-delete");
  }
  /**
   * Mark a file as pending creation (Write tool to a non-existing file).
   * Must be called from the tool_call handler before the write lands so
   * isNewFile() still returns true. recordWritten will inject a synthetic
   * read so immediate follow-up edits are not blocked by zero_read.
   *
   * Keyed by the existence-INDEPENDENT syntactic spelling
   * (`normalizeEphemeralMapKey`, the same key `knownPathIndex` uses), NOT by
   * `this.key()` (#3163). This entry is written while the file is still
   * ABSENT and read back by `recordWritten` once it EXISTS — the one state
   * change `normalizeFilePath` itself branches on — so a `this.key()` on each
   * side answered with two different strings for any spelling whose key moves
   * when the file appears (win32: a mixed-case basename, lower-cased in the
   * absent branch by `resolveNonExisting`; POSIX since #3098: a parent whose
   * canonical casing is adopted once `realpathSync.native` succeeds). The
   * entry was then orphaned — nothing prunes `pendingCreations` — and the
   * creation read never injected. The syntactic key never touches the
   * filesystem, so it cannot move; the REAL key the injected read needs is
   * derived by `recordWritten` itself and is not stored here.
   */
  noteCreatedFile(filePath, turnIndex, writeIndex, toolCallId) {
    this.pendingCreations.set(normalizeEphemeralMapKey(filePath), {
      turnIndex,
      writeIndex,
      ...toolCallId !== void 0 && { toolCallId }
    });
  }
  /**
   * Refresh the FileTime stamp after the model's own write lands on disk.
   * Call this from the tool_result handler so the next checkEdit on the same
   * file doesn't see "file_modified" caused by our own previous edit.
   * A deferred writer passes the `branchEpoch` it captured before awaiting;
   * a write from before a `/tree` is then not credited (#3521).
   */
  recordWritten(rawFilePath, opts) {
    if (opts?.branchEpoch !== void 0 && opts.branchEpoch !== this.currentBranchEpoch) {
      incrementDegradationCount({
        kind: "read-guard-write-after-branch-move",
        subject: "recordWritten",
        reason: `a write captured at branch epoch ${opts.branchEpoch} landed at ${this.currentBranchEpoch}; not credited to the new branch`
      });
      return;
    }
    const filePath = this.key(rawFilePath);
    this.knownPathIndex.set(normalizeEphemeralMapKey(rawFilePath), filePath);
    if (opts?.stampFileTime !== false)
      this.fileTime.read(filePath);
    this.creditAuthorship(filePath, opts);
    if (this.reads.has(filePath))
      this.consumedReadFiles.add(filePath);
    this.touchFile(filePath);
    this.enforceFileCap();
    const creationKey = normalizeEphemeralMapKey(rawFilePath);
    const creation = this.pendingCreations.get(creationKey);
    if (creation) {
      this.pendingCreations.delete(creationKey);
      this.injectCreationRead(filePath, creation.turnIndex, creation.writeIndex, creation.toolCallId, opts?.writtenContent);
    }
  }
  /**
   * Add a one-time exemption for a file.
   * Called via /lens-allow-edit command.
   */
  addExemption(filePath) {
    this.exemptions.add(this.key(filePath));
    logReadGuardEvent({
      event: "exemption_added",
      sessionId: this.sessionId,
      filePath,
      metadata: {
        source: "lens-allow-edit"
      }
    });
  }
  /**
   * Get summary statistics for /lens-health.
   */
  getSummary() {
    let totalEdits = 0;
    let totalBlocks = 0;
    let lspExpansionsHelped = 0;
    const byReason = {};
    const byFile = {};
    for (const [filePath, records] of this.edits) {
      for (const record2 of records) {
        totalEdits++;
        byFile[filePath] = byFile[filePath] ?? { edits: 0, blocks: 0 };
        byFile[filePath].edits++;
        if (record2.verdict === "blocked") {
          totalBlocks++;
          byFile[filePath].blocks++;
        }
        if (record2.reason) {
          byReason[record2.reason] = (byReason[record2.reason] ?? 0) + 1;
        }
        if (record2.precedingReads.some((r) => r.expandedByLsp) && record2.verdict === "allowed") {
          lspExpansionsHelped++;
        }
      }
    }
    return {
      totalEdits,
      totalBlocks,
      byReason,
      byFile,
      lspExpansionsHelped
    };
  }
  /**
   * Get all read records for a file (for debugging).
   */
  getReadHistory(filePath) {
    const key = this.key(filePath);
    if (this.reads.has(key))
      this.touchFile(key);
    return this.reads.get(key) ?? [];
  }
  /**
   * Whether the current bytes still match the newest full-content read binding.
   * Undefined means this file has no full-content binding to compare; callers
   * must preserve their existing uncertainty wording in that case.
   */
  contentMatchesLastRead(filePath) {
    const reads = this.getReadHistory(filePath);
    const binding = [...reads].reverse().find((read) => read.contentBinding?.fullFile)?.contentBinding;
    return binding === void 0 ? void 0 : currentContentMatchesBinding(filePath, binding);
  }
  /**
   * Session-lifetime record-cap trim totals for a file (#1913 review F1).
   * `recordRead` only writes ONE `read_cap_trimmed` read-guard.log line per
   * file per session (on the first trim), so this is the running-totals
   * surface for everything after that — the exact split this class already
   * computes on every trim, not re-derivable from `getReadHistory` alone
   * (which only shows the SURVIVING records, not what was evicted).
   */
  getTrimStats(filePath) {
    const stats = this.trimAccumulators.get(this.key(filePath));
    return stats ? { ...stats } : void 0;
  }
  /**
   * Snapshot the read-set for persistence across a session resume (#1041).
   * Mirrors widget-state's `exportWidgetState`: the Map is emitted as
   * `[key, records]` tuples, keys already in `normalizeFilePath` form. Only
   * `reads` is serialized — it is the payload `checkEdit`'s zero-read/coverage
   * checks consult. Safe to call even when the guard is disabled (an empty or
   * never-populated `reads` simply exports zero entries).
   */
  exportState() {
    return {
      version: READ_GUARD_STATE_VERSION,
      reads: [...this.reads.entries()].map(([key, records]) => [
        key,
        records.map((record2) => ({ ...record2 }))
      ])
    };
  }
  /**
   * The files this session authored (#3612, D5): `writtenThisSession`, which
   * the zero-read check reads, each with the content identity and transcript
   * id of its write (#4131, #3603).
   */
  exportAuthorship() {
    return {
      // A released reader treats every `written` path as authored, so a
      // retired one is carried in `entries` only.
      written: [...this.writtenThisSession].flatMap(([filePath, authored]) => authored.retired ? [] : [filePath]),
      entries: [...this.writtenThisSession].map(([filePath, authored]) => ({
        filePath,
        ...authored
      }))
    };
  }
  /**
   * Restore {@link exportAuthorship}'s output for the branch this session
   * starts on (#3603): the {@link importBranch} rule, an entry is imported
   * iff its write's `toolCallId` is in `onBranch`. Its content identity
   * comes with it, so bytes another writer changed meanwhile end it at the
   * next check. A released writer's row (#3612: `written` paths only, maybe a
   * `sessionStartMs`) names no write, so it imports nothing. Null-safe on a
   * malformed payload; never throws.
   */
  importAuthorship(state4, onBranch) {
    const result = { imported: 0, dropped: 0 };
    const authorship = state4;
    const entries = Array.isArray(authorship?.entries) ? authorship.entries : [];
    const withEntry = /* @__PURE__ */ new Set();
    for (const entry of entries) {
      const candidate = entry;
      if (typeof candidate?.filePath !== "string")
        continue;
      withEntry.add(candidate.filePath);
      if (typeof candidate.toolCallId !== "string" || !onBranch.has(candidate.toolCallId) || typeof candidate.size !== "number" || typeof candidate.mtimeMs !== "number" || typeof candidate.ctimeMs !== "number" || candidate.hash !== void 0 && typeof candidate.hash !== "string" || candidate.retired !== void 0 && candidate.retired !== true || candidate.authoredRanges !== void 0 && !isValidAuthoredRanges(candidate.authoredRanges) || candidate.authoredLineCount !== void 0 && typeof candidate.authoredLineCount !== "number") {
        result.dropped += 1;
        continue;
      }
      const filePath = this.key(candidate.filePath);
      this.knownPathIndex.set(normalizeEphemeralMapKey(candidate.filePath), filePath);
      this.writtenThisSession.set(filePath, {
        size: candidate.size,
        mtimeMs: candidate.mtimeMs,
        ctimeMs: candidate.ctimeMs,
        ...candidate.hash !== void 0 && { hash: candidate.hash },
        toolCallId: candidate.toolCallId,
        ...candidate.retired === true && { retired: true },
        ...candidate.authoredRanges !== void 0 && {
          authoredRanges: candidate.authoredRanges
        },
        ...candidate.authoredLineCount !== void 0 && {
          authoredLineCount: candidate.authoredLineCount
        }
      });
      result.imported += 1;
    }
    this.enforceAuthorshipCap();
    if (Array.isArray(authorship?.written)) {
      for (const filePath of authorship.written)
        if (typeof filePath === "string" && !withEntry.has(filePath))
          result.dropped += 1;
    }
    return result;
  }
  /**
   * Keep exactly the reads the conversation still shows the agent, after it
   * moved to another branch in this activation (`/tree`, #3521).
   *
   * A record stays, whole, when its `toolCallId` is in `onBranch` (the
   * `toolResult`s on the new branch); every other record is deleted. Nothing
   * is re-verified or re-stamped here: the FileTime stamps are cleared, so
   * each kept record must pass the per-line hash check against disk at the
   * next edit. A stamp taken on the abandoned branch would otherwise vouch
   * for bytes this branch never showed. Authorship follows the same rule
   * (#3603): it stays, retired or not, iff the write it came from is on the
   * branch, and its content identity still decides. Edits, idle-expiry
   * marks and pending creations came from the old branch, so they go.
   */
  retainBranch(onBranch) {
    const result = { kept: 0, dropped: 0 };
    for (const [filePath, records] of this.reads) {
      const kept = [];
      for (const read of records)
        if (read.toolCallId !== void 0 && onBranch.has(read.toolCallId))
          kept.push(read);
      result.kept += kept.length;
      result.dropped += records.length - kept.length;
      if (kept.length > 0) {
        this.reads.set(filePath, kept);
        continue;
      }
      this.reads.delete(filePath);
    }
    for (const [filePath, authored] of this.writtenThisSession)
      if (authored.toolCallId === void 0 || !onBranch.has(authored.toolCallId))
        this.writtenThisSession.delete(filePath);
    this.edits.clear();
    this.expiredWrites.clear();
    this.pendingCreations.clear();
    this.checkedPathsByCall.clear();
    this.fileTime.clear();
    moveBranch(this.scope);
    return result;
  }
  /** The epoch a deferred writer captures before it awaits (#3521). */
  get currentBranchEpoch() {
    return this.scope.branchEpoch();
  }
  /**
   * #3676: which guard lifetime {@link currentBranchEpoch} counts in. The epoch
   * restarts at 0 in every new guard (`/fork`, `/new`, a resume), so a stamp
   * that outlives its guard, in a cache file for instance, carries this beside
   * the epoch. The scope ticket is drawn from a per-process counter that starts
   * at 1 in every process, so the pid is part of the key.
   */
  get lineageKey() {
    return `${process.pid}:${this.scope.scopeId}`;
  }
  /**
   * Load a persisted read-set (#1041) for the branch this session starts on
   * (#3521): a resume, `pi --fork`, or the fork/clone hand-off. The same rule
   * as {@link retainBranch}: a record is imported, whole, only when its
   * `toolCallId` is in `onBranch`, and without a FileTime stamp, so the
   * per-line hash check decides each edit against the current disk. The
   * guard is fresh here (`resetForSession`), so there is no older
   * conversation state to clear. A
   * record for a file that no longer exists is dropped. Version-guarded and
   * null-safe: `undefined`, a version-1 sidecar (no ids), or a malformed
   * payload loads as no reads and never throws — a throw here would abort
   * the whole session_start rehydration.
   */
  importBranch(state4, onBranch) {
    const result = { imported: 0, dropped: 0 };
    if (!state4 || state4.version !== READ_GUARD_STATE_VERSION)
      return result;
    if (!Array.isArray(state4.reads))
      return result;
    for (const entry of state4.reads) {
      if (!Array.isArray(entry) || entry.length !== 2)
        continue;
      const [rawPath, records] = entry;
      if (typeof rawPath !== "string")
        continue;
      if (!Array.isArray(records) || records.length === 0)
        continue;
      const filePath = this.key(rawPath);
      const exists = fs7.existsSync(filePath);
      for (const read of records) {
        const id = read?.toolCallId;
        if (!exists || typeof id !== "string" || !onBranch.has(id)) {
          result.dropped += 1;
          continue;
        }
        this.recordRead({ ...read, filePath, lineHashes: read.lineHashes ?? {} }, { stampFileTime: false });
        result.imported += 1;
      }
    }
    return result;
  }
  /**
   * Get all edit records for a file (for debugging).
   */
  getEditHistory(filePath) {
    const key = this.key(filePath);
    if (this.edits.has(key))
      this.touchFile(key);
    return this.edits.get(key) ?? [];
  }
  // --- Private helpers ---
  /**
   * #4187 R4-1: whether a write may re-baseline an EXISTING authorship over
   * the bytes it just landed. One rule, three caller classes:
   *
   * - `advanceAuthorship` omitted — the caller checked this exact path
   *   immediately before writing (a native edit's preflight, a drain's
   *   `retireChangedAuthorshipBeforeDrain`), so the only unaccounted bytes
   *   are its own. Advance.
   * - `true` — a bytes-less in-process tool write (an LSP edit, an ast-grep
   *   apply, a diagnostic-mark suppress, an observed replay). Advance only a
   *   path its OWN `tool_call` checked ({@link noteCheckedPaths}): the set a
   *   tool names can be narrower than the set it writes, and a path outside
   *   it ends the authorship instead.
   * - `false` — a record with no pre-write check at all (a co-process
   *   producer, the settled sweep). Never advance.
   *
   * A path with no entry is a first credit only when the writer supplies
   * evidence for it. Partial bridge credits retain their reported range;
   * settled-sweep drift supplies no such evidence (#4210).
   */
  mayAdvanceAuthorship(filePath, opts) {
    if (opts?.advanceAuthorship === void 0)
      return true;
    if (opts.advanceAuthorship !== true)
      return false;
    return this.consumeCheckedAtCall(opts.toolCallId, filePath);
  }
  /**
   * #4131: record the content identity of the bytes `recordWritten` just
   * credited. A retired authorship is never resumed (see
   * `AuthoredBytes.retired`).
   */
  creditAuthorship(filePath, opts) {
    const existing = this.writtenThisSession.get(filePath);
    if (!existing && opts?.allowFirstAuthorship === false)
      return;
    if (existing?.retired)
      return;
    if (opts?.authorship === "unknown") {
      if (existing)
        this.retireIfChanged(filePath, "bridge", true);
      return;
    }
    if (existing && !this.mayAdvanceAuthorship(filePath, opts)) {
      this.retireIfChanged(filePath, "bridge");
      return;
    }
    const observed = observeAuthoredBytes(filePath, opts?.contentHash, opts?.authoredRanges);
    const { authoredRanges: _observedRanges, ...observedWithoutRanges } = observed;
    const composedRanges = existing?.authoredRanges === void 0 ? existing ? void 0 : observed.authoredRanges : opts?.authoredRanges === void 0 ? void 0 : composeAuthoredRanges(existing, opts.authoredRanges, observed.authoredLineCount);
    const toolCallId = opts?.toolCallId ?? existing?.toolCallId;
    this.writtenThisSession.delete(filePath);
    this.writtenThisSession.set(filePath, {
      ...observedWithoutRanges,
      ...composedRanges !== void 0 ? {
        authoredRanges: composedRanges,
        ...observed.authoredLineCount !== void 0 && {
          authoredLineCount: observed.authoredLineCount
        }
      } : {},
      ...toolCallId !== void 0 && { toolCallId }
    });
    this.enforceAuthorshipCap();
  }
  /**
   * `writtenContent`, when the write's bytes are known, is the agent's view
   * of the file: hashed from it, not from a disk another writer may have
   * moved before this handler ran (#3524). Without it (the `session_authored`
   * path, #3520) the disk is all there is.
   */
  injectCreationRead(filePath, turnIndex, writeIndex, toolCallId, writtenContent) {
    let evidence;
    try {
      evidence = writtenContent !== void 0 ? deliveredLineEvidence(writtenContent, 1) : {
        lineCount: splitLines(fs7.readFileSync(filePath, "utf-8")).length,
        lineHashes: void 0
      };
    } catch {
      return;
    }
    const { lineCount, lineHashes } = evidence;
    if (lineCount === 0)
      return;
    this.recordRead({
      filePath,
      requestedOffset: 1,
      requestedLimit: lineCount,
      effectiveOffset: 1,
      effectiveLimit: lineCount,
      expandedByLsp: false,
      ...lineHashes && { lineHashes },
      turnIndex,
      writeIndex,
      timestamp: Date.now(),
      ...toolCallId !== void 0 && { toolCallId }
    });
  }
  canIgnoreStalenessByHashes(filePath, reads, touchedLines, editRanges) {
    let lines;
    try {
      lines = splitLines(fs7.readFileSync(filePath, "utf-8"));
    } catch {
      return false;
    }
    const rangesToCheck = touchedLines ? editRanges && editRanges.length > 1 ? editRanges : [touchedLines] : void 0;
    if (!rangesToCheck) {
      const lastRead = reads.at(-1);
      return !!lastRead && this.readHashesStillMatch(lastRead, lines);
    }
    return rangesToCheck.every(([startLine, endLine]) => {
      for (let lineNo = startLine; lineNo <= endLine; lineNo += 1) {
        const view = newestViewOfLine(reads, lineNo);
        if (!view || !this.readRangeHashesStillMatch(view, lines, [lineNo, lineNo])) {
          return false;
        }
      }
      return true;
    });
  }
  validateRangeSnapshot(filePath, [startLine, endLine], snapshotCheckSkipped) {
    const reads = this.reads.get(filePath) ?? [];
    const runs = [];
    const missingLines = [];
    for (let lineNo = startLine; lineNo <= endLine; lineNo += 1) {
      const view = newestViewOfLine(reads, lineNo);
      if (!view || view.lineHashes?.[lineNo] === void 0) {
        missingLines.push(lineNo);
        continue;
      }
      const last = runs.at(-1);
      if (last?.read === view && last.range[1] === lineNo - 1) {
        last.range[1] = lineNo;
      } else {
        runs.push({ read: view, range: [lineNo, lineNo] });
      }
    }
    const mismatchedLines = [];
    let checkedLineCount = 0;
    for (const { read, range } of runs) {
      checkedLineCount += range[1] - range[0] + 1;
      mismatchedLines.push(...currentLinesMatchReadSnapshot(filePath, read, range).mismatchedLines);
    }
    const status = mismatchedLines.length > 0 ? "mismatch" : missingLines.length === 0 ? "match" : "unavailable";
    const shouldBlock = status === "mismatch";
    const outcome = shouldBlock ? snapshotCheckSkipped ? "bypassed-content-match" : "enforced-block" : status === "match" ? "enforced-pass" : "not-decidable";
    logReadGuardEvent({
      event: "range_snapshot_validation",
      sessionId: this.sessionId,
      filePath,
      metadata: {
        range: [startLine, endLine],
        status,
        viewRunCount: runs.length,
        checkedLineCount,
        missingLineCount: missingLines.length,
        mismatchedLineCount: mismatchedLines.length,
        missingLines: missingLines.slice(0, 20),
        mismatchedLines: mismatchedLines.slice(0, 20),
        enforced: shouldBlock || status === "match",
        outcome
      }
    });
    return { status, missingLines, mismatchedLines, shouldBlock };
  }
  readRangeHashesStillMatch(read, lines, [startLine, endLine]) {
    const hashes = read.lineHashes ?? {};
    for (let lineNo = startLine; lineNo <= endLine; lineNo += 1) {
      if (!readRangeCoversLine(read, lineNo) || hashes[lineNo] === void 0) {
        return false;
      }
      if (lineNo < 1 || lineNo > lines.length)
        return false;
      if (lineContentHash(lines[lineNo - 1] ?? "") !== hashes[lineNo]) {
        return false;
      }
    }
    return true;
  }
  /**
   * #3962: whether a read recorded AFTER `boundRead` is at least as strong
   * evidence for THIS edit as the bridge `contentBinding` it would otherwise be
   * judged against. A stale binding (its snapshot no longer matches disk) must
   * not keep blocking once a newer record has DELIVERED every edited line from
   * the current bytes: the block's own remedy ("Re-read the file") is exactly
   * what a native re-read cannot satisfy, because native records carry hashes,
   * never a binding. The rule lives here, in the evidence owner; consumers do
   * not re-derive it.
   *
   * Eligibility is deliberately narrow so the strong anchor is never dropped
   * for weak evidence: the candidate must be non-provisional (delivered), its
   * effective range must cover the line (never the context zone), it must
   * carry a read-time hash for the line, and that hash must equal the bytes on
   * disk now. A newer partial, unhashed, search-slack-only, or stale read is
   * not eligible, and `touchedLines === undefined` keeps the existing block
   * (there is no range to prove coverage over).
   */
  newerReadSupersedesBinding(filePath, fileReads, boundRead, touchedLines, editRanges) {
    if (!touchedLines)
      return false;
    const rangesToCheck = editRanges && editRanges.length > 1 ? editRanges : [touchedLines];
    const boundIndex = fileReads.lastIndexOf(boundRead);
    if (boundIndex < 0)
      return false;
    for (const candidate of fileReads.slice(boundIndex + 1).reverse()) {
      if (candidate.provisional === true)
        continue;
      const deliversEveryEditedLine = rangesToCheck.every((range) => {
        const evidence = currentLinesMatchReadSnapshot(filePath, candidate, range);
        return evidence.checked && evidence.matches;
      });
      if (deliversEveryEditedLine)
        return true;
    }
    return false;
  }
  /**
   * Content-verified relocation. When a range the agent read has drifted, find
   * where the read-time line-hash sequence for [startLine,endLine] now appears
   * in the current file. Returns the unique new location, or undefined when:
   * no recorded read captured hashes for the whole range; the sequence is too
   * short to be collision-resistant (<2 lines); or it now matches zero or
   * multiple spots. Powers a *hint* only — never a silent positional re-apply.
   */
  findRelocation(filePath, reads, [startLine, endLine]) {
    const span = endLine - startLine + 1;
    if (span < 2)
      return void 0;
    const source = newestViewOfLine(reads, startLine);
    if (!source?.lineHashes)
      return void 0;
    const wanted = [];
    for (let lineNo = startLine; lineNo <= endLine; lineNo += 1) {
      const hash = source.lineHashes[lineNo];
      if (hash === void 0 || newestViewOfLine(reads, lineNo) !== source) {
        return void 0;
      }
      wanted.push(hash);
    }
    let lines;
    try {
      lines = splitLines(fs7.readFileSync(filePath, "utf-8"));
    } catch {
      return void 0;
    }
    const currentHashes = lines.map((line) => lineContentHash(line));
    const lastStart = currentHashes.length - span;
    const matchStarts = [];
    for (let i = 0; i <= lastStart; i += 1) {
      let ok = true;
      for (let j = 0; j < span; j += 1) {
        if (currentHashes[i + j] !== wanted[j]) {
          ok = false;
          break;
        }
      }
      if (ok)
        matchStarts.push(i + 1);
    }
    let newStart;
    if (matchStarts.length === 1) {
      newStart = matchStarts[0];
    } else if (matchStarts.length > 1) {
      const appliedEdits = (this.edits.get(filePath) ?? []).filter((record2) => record2.verdict !== "blocked").length;
      const window = Math.min(RELOCATION_WINDOW_MAX, Math.max(RELOCATION_WINDOW_MIN, appliedEdits * RELOCATION_WINDOW_PER_EDIT));
      const lo = startLine - window;
      const hi = endLine + window;
      const local = matchStarts.filter((start) => start >= lo && start <= hi);
      if (local.length === 1)
        newStart = local[0];
    }
    if (newStart === void 0 || newStart === startLine)
      return void 0;
    return { from: [startLine, endLine], to: [newStart, newStart + span - 1] };
  }
  readHashesStillMatch(read, lines) {
    const entries = Object.entries(read.lineHashes ?? {});
    if (entries.length === 0)
      return false;
    for (const [lineText, expected] of entries) {
      const lineNo = Number(lineText);
      if (!Number.isInteger(lineNo) || lineNo < 1 || lineNo > lines.length) {
        return false;
      }
      if (lineContentHash(lines[lineNo - 1] ?? "") !== expected)
        return false;
    }
    return true;
  }
  checkCoverage(filePath, touchedLines) {
    const [editStart, editEnd] = touchedLines;
    const reads = this.reads.get(filePath) ?? [];
    for (const read of reads) {
      if (read.provisional === true)
        continue;
      const readStart = Math.max(1, read.effectiveOffset - this.config.contextLines);
      const readEnd = read.effectiveOffset + read.effectiveLimit - 1 + this.config.contextLines;
      if (editStart >= readStart && editEnd <= readEnd) {
        return { covered: true, viaSymbol: false };
      }
      if (read.enclosingSymbol) {
        const symStart = read.enclosingSymbol.startLine;
        const symEnd = read.enclosingSymbol.endLine;
        if (symStart <= editStart && symEnd >= editEnd) {
          return { covered: true, viaSymbol: true };
        }
      }
    }
    const intervals = reads.filter((read) => read.provisional !== true).map((read) => [
      Math.max(1, read.effectiveOffset - this.config.contextLines),
      read.effectiveOffset + read.effectiveLimit - 1 + this.config.contextLines
    ]);
    intervals.sort((a, b) => a[0] - b[0]);
    const merged = [];
    for (const [s, e] of intervals) {
      if (merged.length > 0 && s <= merged[merged.length - 1][1] + 1) {
        merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], e);
      } else {
        merged.push([s, e]);
      }
    }
    for (const [s, e] of merged) {
      if (editStart >= s && editEnd <= e) {
        return { covered: true, viaSymbol: false };
      }
    }
    return { covered: false, viaSymbol: false };
  }
  getExemptionMode(filePath) {
    for (const exemption of this.config.exemptions) {
      if (this.matchesPattern(filePath, exemption.pattern)) {
        return exemption.mode;
      }
    }
    return null;
  }
  matchesPattern(filePath, pattern) {
    if (pattern.startsWith("*")) {
      const suffix = pattern.slice(1);
      return filePath.endsWith(suffix);
    }
    if (pattern.includes("*")) {
      const collapsedPattern = pattern.replace(/\*+/g, "*");
      const regex = new RegExp(`^${collapsedPattern.replace(/\\/g, "\\\\").replace(/\./g, "\\.").replace(/\*/g, ".*")}$`);
      return regex.test(filePath);
    }
    return filePath === pattern;
  }
  blockOrWarn(_reason, message, details, overrideMode) {
    const mode = overrideMode ?? this.config.mode;
    if (mode === "warn") {
      return { action: "warn", reason: message, details };
    }
    return { action: "block", reason: message, details };
  }
  allow() {
    return { action: "allow" };
  }
  recordEdit(filePath, tool, touchedLines, verdict) {
    this.touchFile(filePath);
    const arr = this.edits.get(filePath) ?? [];
    arr.push({
      filePath,
      tool,
      touchedLines,
      precedingReads: this.reads.get(filePath) ?? [],
      verdict: mapVerdictAction(verdict.action),
      reason: verdict.reason,
      timestamp: Date.now()
    });
    if (arr.length > READ_GUARD_MAX_EDITS_PER_FILE) {
      const trimmedCount = arr.length - READ_GUARD_MAX_EDITS_PER_FILE;
      arr.splice(0, trimmedCount);
      const isRisingEdge = incrementDegradationCount({
        kind: "read-guard-edits-cap-trim",
        subject: filePath,
        reason: `trimmed ${trimmedCount} edit record(s) past cap`
      });
      if (isRisingEdge) {
        logReadGuardEvent({
          event: "edits_cap_trimmed",
          sessionId: this.sessionId,
          filePath,
          metadata: { trimmedCount, cappedLength: arr.length }
        });
      }
    }
    this.edits.set(filePath, arr);
  }
  recordVerdict(filePath, tool, touchedLines, verdict, metadata = {}) {
    const normalizedTouchedLines = touchedLines ?? [1, 1];
    this.recordEdit(filePath, tool, normalizedTouchedLines, verdict);
    const reads = this.reads.get(filePath) ?? [];
    logReadGuardEvent({
      event: verdict.action === "allow" ? "edit_allowed" : verdict.action === "warn" ? "edit_warned" : "edit_blocked",
      sessionId: this.sessionId,
      filePath,
      metadata: {
        tool,
        touchedLines: touchedLines ?? null,
        normalizedTouchedLines,
        readCount: reads.length,
        reads: reads.map((read) => ({
          requestedOffset: read.requestedOffset,
          requestedLimit: read.requestedLimit,
          effectiveOffset: read.effectiveOffset,
          effectiveLimit: read.effectiveLimit,
          expandedByLsp: read.expandedByLsp,
          enclosingSymbol: read.enclosingSymbol ?? null,
          timestamp: read.timestamp
        })),
        verdictAction: verdict.action,
        details: verdict.details,
        ...metadata
      }
    });
  }
};
function mapVerdictAction(action) {
  switch (action) {
    case "allow":
      return "allowed";
    case "block":
      return "blocked";
    case "warn":
      return "warned";
  }
}

// dist/clients/diagnostic-dispositions.js
var deferredThisSession = /* @__PURE__ */ new Set();
var widgetDispositionReconciler = null;
function registerWidgetDispositionReconciler(reconciler) {
  widgetDispositionReconciler = reconciler;
}
function deferredKey(cwd, anchor) {
  return `${normalizeMapKey(cwd)}::${anchor}`;
}
var normalizeMessage2 = normalizeMessage;
function strictAnchorSpan(content, line) {
  if (content === void 0 || line === void 0)
    return void 0;
  const lines = content.split(/\r?\n/);
  if (line < 1 || line > lines.length)
    return void 0;
  return lineContentHash(lines[line - 1] ?? "");
}
function strictAnchorSpansIn(content) {
  const spans = /* @__PURE__ */ new Set();
  for (const line of content.split(/\r?\n/))
    spans.add(lineContentHash(line));
  return spans;
}
function computeStrictAnchor(args) {
  return stableFindingId("dd:", {
    cwd: args.cwd,
    filePath: args.filePath,
    parts: [
      args.tool ?? "",
      args.rule ?? "",
      normalizeMessage2(args.message),
      // An absent/out-of-range line hashes the empty string, exactly as the
      // pre-#3183 `lines[args.line - 1] ?? ""` fallback did: stable, but less
      // resistant to a same-file/rule/message collision (see
      // `DispositionAnchorArgs.content`).
      strictAnchorSpan(args.content, args.line) ?? lineContentHash("")
    ]
  });
}
function computeWeakAnchor(args) {
  return stableFindingId("ddw:", {
    cwd: args.cwd,
    filePath: args.filePath,
    parts: [args.tool ?? "", args.rule ?? "", normalizeMessage2(args.message)]
  });
}
function anchorsForDiagnostic(cwd, filePath, diagnostic, content) {
  const args = {
    cwd,
    filePath,
    tool: diagnostic.tool,
    rule: diagnostic.rule,
    message: diagnostic.message,
    line: diagnostic.line,
    content
  };
  return { strict: computeStrictAnchor(args), weak: computeWeakAnchor(args) };
}
function statePath(cwd) {
  return path7.join(getProjectDataDir(cwd), "cache", "diagnostic-dispositions.json");
}
var stateCache = null;
var dispositionStatSync = fs8.statSync;
function hasAnyDispositionMarks(cwd) {
  return Boolean(readState(cwd).dispositions) || deferredThisSession.size > 0;
}
function hasStrictDispositionMarks(cwd) {
  const dispositions = readState(cwd).dispositions;
  if (!dispositions)
    return false;
  for (const key of Object.keys(dispositions)) {
    if (dispositions[key]?.disposition === "false-positive")
      return true;
  }
  return false;
}
var multiFileReadFileSync = fs8.readFileSync;
function readState(cwd) {
  const p = statePath(cwd);
  let stat2;
  try {
    stat2 = dispositionStatSync(p);
  } catch {
    if (stateCache && stateCache.path === p && stateCache.missing) {
      return stateCache.state;
    }
    const empty = {};
    stateCache = {
      path: p,
      missing: true,
      mtimeMs: -1,
      size: -1,
      state: empty
    };
    return empty;
  }
  if (stateCache && stateCache.path === p && !stateCache.missing && stateCache.mtimeMs === stat2.mtimeMs && stateCache.size === stat2.size) {
    return stateCache.state;
  }
  let state4;
  try {
    const parsed = JSON.parse(fs8.readFileSync(p, "utf-8"));
    state4 = parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    state4 = {};
  }
  stateCache = {
    path: p,
    missing: false,
    mtimeMs: stat2.mtimeMs,
    size: stat2.size,
    state: state4
  };
  return state4;
}
function getDisposition(cwd, anchor) {
  return readState(cwd).dispositions?.[anchor];
}
function applyDispositions(diagnostics, cwd, filePath, content) {
  if (!diagnostics.length)
    return diagnostics;
  const dispositions = readState(cwd).dispositions;
  if (!dispositions && deferredThisSession.size === 0)
    return diagnostics;
  return diagnostics.filter((d) => {
    const { strict, weak } = anchorsForDiagnostic(cwd, filePath, d, content);
    const isBlocking2 = d.semantic === "blocking";
    if (!isBlocking2 && deferredThisSession.has(deferredKey(cwd, weak))) {
      return false;
    }
    if (dispositions?.[strict]?.disposition === "false-positive")
      return false;
    if (!isBlocking2 && dispositions?.[weak]?.disposition === "suppress") {
      return false;
    }
    return true;
  });
}
function applyWeakDispositions(diagnostics, cwd, filePath) {
  if (!diagnostics.length)
    return diagnostics;
  const dispositions = readState(cwd).dispositions;
  if (!dispositions && deferredThisSession.size === 0)
    return diagnostics;
  return diagnostics.filter((d) => {
    if (d.semantic === "blocking")
      return true;
    const weak = computeWeakAnchor({
      cwd,
      filePath,
      tool: d.tool,
      rule: d.rule,
      message: d.message,
      line: d.line
    });
    if (deferredThisSession.has(deferredKey(cwd, weak)))
      return false;
    if (dispositions?.[weak]?.disposition === "suppress")
      return false;
    return true;
  });
}
function applyDispositionsMultiFile(diagnostics, cwd, filePathOf) {
  if (!diagnostics.length)
    return diagnostics;
  const dispositions = readState(cwd).dispositions;
  if (!dispositions && deferredThisSession.size === 0)
    return diagnostics;
  const groups = /* @__PURE__ */ new Map();
  for (const d of diagnostics) {
    const filePath = filePathOf(d);
    const group = groups.get(filePath);
    if (group)
      group.push(d);
    else
      groups.set(filePath, [d]);
  }
  const kept = /* @__PURE__ */ new Set();
  for (const [filePath, group] of groups) {
    let content = "";
    try {
      content = multiFileReadFileSync(filePath, "utf-8");
    } catch {
    }
    for (const d of applyDispositions(group, cwd, filePath, content)) {
      kept.add(d);
    }
  }
  return diagnostics.filter((d) => kept.has(d));
}

// dist/clients/session-state-store.js
import { promises as fs9 } from "node:fs";
async function dropStaleFiles(widget, savedAt) {
  const checked = await Promise.all(widget.files.map(async (file) => {
    try {
      const st = await fs9.stat(file.filePath);
      return st.mtimeMs <= savedAt + 1 ? file : void 0;
    } catch {
      return void 0;
    }
  }));
  return {
    ...widget,
    files: checked.filter((f) => f !== void 0)
  };
}

// dist/clients/widget-state.js
function fileMapKey(filePath) {
  return normalizeEphemeralMapKey(filePath);
}
function isBlocking(d) {
  if (d.disposition)
    return false;
  if (d.stale)
    return false;
  if (d.semantic === "blocking")
    return true;
  if (d.semantic == null && d.severity === "error")
    return true;
  return false;
}
var files = /* @__PURE__ */ new Map();
var sessionLanguages = [];
var requestRenderFn = null;
var diagnosticsWriteGuard = new WriteOrderingGuard();
var runnerWriteGuard = new WriteOrderingGuard();
var MAX_STORED_DIAGNOSTICS_PER_FILE = 12;
var MAX_RETAINED_SUPPRESSED_PER_FILE = 12;
var MAX_INACTIVE_FILE_RECORDS = 1024;
var ACTIVE_FILE_IDLE_MS = 30 * 6e4;
var MAX_LSP_SERVER_RECORDS = 128;
var lspServers = new BoundedFifoMap(MAX_LSP_SERVER_RECORDS);
var nextInactivePruneSize = MAX_INACTIVE_FILE_RECORDS + 1;
function pruneInactiveFileRecords(now = Date.now()) {
  if (files.size <= MAX_INACTIVE_FILE_RECORDS)
    return;
  const victims = [...files.entries()].filter(([, rec]) => now - rec.touchedAt > ACTIVE_FILE_IDLE_MS && !hasLiveDiagnostic(rec)).sort(([, a], [, b]) => a.touchedAt - b.touchedAt);
  for (const [key] of victims) {
    if (files.size <= MAX_INACTIVE_FILE_RECORDS)
      break;
    files.delete(key);
  }
}
function maybePruneInactiveFileRecords() {
  if (files.size < nextInactivePruneSize)
    return;
  pruneInactiveFileRecords();
  nextInactivePruneSize = Number.POSITIVE_INFINITY;
}
function reconcileWidgetDisposition(cwd, target, _disposition, content) {
  const current = getFileDiagnostics(target.filePath);
  if (!current) {
    recordDegradationOnce({
      kind: "widget-disposition-reconcile-fallback",
      subject: target.filePath,
      reason: "the marked finding's widget record is absent"
    });
    return;
  }
  let source = content ?? target.content;
  if (source === void 0) {
    try {
      source = readFileSync7(target.filePath, "utf8");
    } catch {
      recordDegradationOnce({
        kind: "widget-disposition-reconcile-fallback",
        subject: target.filePath,
        reason: "the disposition anchor content could not be read"
      });
      source = "";
    }
  }
  const active = new Set(applyDispositions(current, cwd, target.filePath, source));
  const normalized = current.flatMap((diagnostic) => {
    const { strict, weak } = anchorsForDiagnostic(cwd, target.filePath, diagnostic, source);
    const entry = getDisposition(cwd, strict) ?? getDisposition(cwd, weak);
    if (!active.has(diagnostic) && (entry?.disposition === "false-positive" || entry?.disposition === "suppress")) {
      const { anchorSpan: _previousSpan, ...base } = diagnostic;
      const span = entry.disposition === "false-positive" ? strictAnchorSpan(source, diagnostic.line) : void 0;
      return [
        {
          ...base,
          disposition: entry.disposition,
          flagged: false,
          ...span === void 0 ? {} : { anchorSpan: span }
        }
      ];
    }
    if (diagnostic.suppressedRetained)
      return [];
    const {
      disposition: _disposition2,
      flagged: _flagged,
      // #3183: a row that is no longer disposition-tagged has no mark to
      // anchor, so its span goes with the tag — leaving it would exempt a LIVE
      // row from the sweep's mtime gate.
      anchorSpan: _anchorSpan,
      ...baseDiagnostic
    } = diagnostic;
    return entry?.disposition === "flagged" ? [{ ...baseDiagnostic, flagged: true }] : [baseDiagnostic];
  });
  const rec = getOrCreate(target.filePath);
  const writeIndex = admitWidgetDiagnosticsWrite(target.filePath);
  if (!diagnosticsWriteGuard.shouldWrite(fileMapKey(target.filePath), writeIndex))
    return;
  commitDiagnostics(rec, target.filePath, normalized, Date.now(), fileMapKey(target.filePath), false);
}
function admitWidgetDiagnosticsWrite(filePath, writeIndex) {
  const key = fileMapKey(filePath);
  const token = writeIndex ?? diagnosticsWriteGuard.nextToken(key);
  diagnosticsWriteGuard.shouldWrite(key, token);
  runnerWriteGuard.shouldWrite(key, token);
  return token;
}
registerWidgetDispositionReconciler((cwd, target, disposition) => reconcileWidgetDisposition(cwd, target, disposition, target.content));
var renderedDependencyDriftFiles = /* @__PURE__ */ new Set();
function clearWidgetState() {
  files.clear();
  renderedDependencyDriftFiles.clear();
  lspServers.clear();
  sessionLanguages = [];
  requestRenderFn = null;
  diagnosticsWriteGuard.clear();
  runnerWriteGuard.clear();
  nextInactivePruneSize = MAX_INACTIVE_FILE_RECORDS + 1;
}
var WIDGET_STATE_VERSION = 3;
function exportWidgetState() {
  return {
    version: WIDGET_STATE_VERSION,
    sessionLanguages: [...sessionLanguages],
    files: [...files.values()].map((rec) => ({
      filePath: rec.filePath,
      runners: [...rec.runners.entries()],
      formatters: [...rec.formatters.entries()],
      diagnostics: rec.diagnostics,
      allDiagnostics: rec.allDiagnostics,
      diagnosticCounts: rec.diagnosticCounts,
      hasFinalDiagnosticsSnapshot: rec.hasFinalDiagnosticsSnapshot,
      touchedAt: rec.touchedAt
    }))
  };
}
function migrateEntryStamps(entries, recordTouchedAt) {
  return (entries ?? []).map((d) => {
    const { stale: _stale, staleDeliveryCount: _staleDeliveryCount, footerRetired: _footerRetired, staleReason: _staleReason, ...rest } = d;
    return rest.observedAt == null ? { ...rest, observedAt: recordTouchedAt } : rest;
  });
}
function importWidgetState(state4) {
  if (!state4 || typeof state4.version !== "number" || state4.version < 1 || state4.version > WIDGET_STATE_VERSION) {
    return false;
  }
  files.clear();
  diagnosticsWriteGuard.clear();
  runnerWriteGuard.clear();
  for (const f of state4.files ?? []) {
    const recordTouchedAt = f.touchedAt ?? Date.now();
    const migratedAllDiagnostics = migrateEntryStamps(f.allDiagnostics, recordTouchedAt);
    files.set(fileMapKey(f.filePath), {
      filePath: f.filePath,
      runners: new Map(f.runners ?? []),
      // Failure entries do NOT survive a session restore (#1348 review):
      // a fmt-failed marker is live advice about THIS session's last
      // attempt; rehydrating one from a snapshot shows a stale failure the
      // current session never observed (and same-mtime fixes would never
      // clear it). Successes rehydrate as before.
      formatters: new Map((f.formatters ?? []).filter(([, outcome]) => outcome?.success !== false)),
      diagnostics: migrateEntryStamps(f.diagnostics, recordTouchedAt),
      allDiagnostics: migratedAllDiagnostics,
      diagnosticCounts: countDiagnostics(migratedAllDiagnostics),
      hasFinalDiagnosticsSnapshot: f.hasFinalDiagnosticsSnapshot ?? false,
      touchedAt: recordTouchedAt
    });
  }
  pruneInactiveFileRecords();
  sessionLanguages = state4.sessionLanguages ?? [];
  requestRenderFn?.();
  return true;
}
var widgetStore = defineSessionStore({
  name: "widget",
  policy: {
    startup: "adopt",
    new: "reset",
    resume: "adopt",
    fork: "none",
    reload: "none"
  },
  snapshot: () => exportWidgetState(),
  restore: async (_scope, payload, ctx) => {
    clearWidgetState();
    const state4 = payload;
    if (!state4?.files)
      return { itemsIn: 0, itemsKept: 0 };
    const fresh = await dropStaleFiles(state4, ctx.savedAt);
    importWidgetState(fresh);
    return { itemsIn: state4.files.length, itemsKept: fresh.files.length };
  },
  reset: () => clearWidgetState(),
  reason: "the diagnostics a conversation's edits produced, which a resume and a relaunch show again"
});
function setSessionLanguages(langs) {
  sessionLanguages = langs;
  requestRender();
}
function recordRunner(filePath, runnerId, status, diagnosticCount, durationMs, writeIndex) {
  const key = fileMapKey(filePath);
  if (!runnerWriteGuard.shouldWrite(key, writeIndex))
    return;
  diagnosticsWriteGuard.shouldWrite(key, writeIndex);
  const rec = getOrCreate(filePath);
  rec.runners.set(runnerId, { status, count: diagnosticCount, durationMs });
  rec.hasFinalDiagnosticsSnapshot = false;
  rec.touchedAt = Date.now();
  files.set(fileMapKey(filePath), rec);
  requestRender();
}
function toSingleLineMessage(message) {
  return (message ?? "").replace(/\s+/g, " ").trim();
}
function widgetDiagnosticUri(filePath, line, column) {
  const base = pathToFileURL(filePath).href;
  return line != null ? `${base}#L${line}${column != null ? `:${column}` : ""}` : base;
}
function recordDiagnostics(filePath, diagnostics, writeIndex, observedAt) {
  const key = fileMapKey(filePath);
  if (!diagnosticsWriteGuard.shouldWrite(key, writeIndex))
    return false;
  runnerWriteGuard.shouldWrite(key, writeIndex);
  const observedTs = observedAt ?? Date.now();
  const rec = getOrCreate(filePath, key);
  commitDiagnostics(rec, filePath, normalizeDiagnostics(filePath, diagnostics, observedTs), observedTs, key);
  return true;
}
function normalizeDiagnostics(filePath, diagnostics, observedTs) {
  return diagnostics.map((d) => {
    const rule = d.rule ?? d.id;
    return {
      severity: d.severity ?? "info",
      semantic: d.semantic,
      message: toSingleLineMessage(d.message),
      line: d.line,
      col: d.column,
      rule,
      tool: d.tool,
      uri: widgetDiagnosticUri(filePath, d.line, d.column),
      observedAt: observedTs
    };
  });
}
function retentionIdentity(d) {
  return JSON.stringify([
    d.tool ?? "",
    d.rule ?? "",
    normalizeMessage(d.message)
  ]);
}
function readContentOrUndefined(filePath) {
  try {
    return readFileSync7(filePath, "utf8");
  } catch {
    recordDegradationOnce({
      kind: "widget-mark-anchor-unreadable",
      subject: filePath,
      reason: "the marked file could not be read, so its suppressed rows fall back to the file-mtime retirement gate and the footer chip may under-count it"
    });
    return void 0;
  }
}
function readAnchorSpans(filePath) {
  const content = readContentOrUndefined(filePath);
  return content === void 0 ? void 0 : strictAnchorSpansIn(content);
}
function retainSuppressedRows(previous, incoming, filePath) {
  const tagged = previous.filter((d) => d.disposition !== void 0);
  if (tagged.length === 0)
    return incoming;
  const reported = /* @__PURE__ */ new Map();
  for (const d of incoming) {
    const id = retentionIdentity(d);
    const bucket = reported.get(id);
    if (bucket)
      bucket.push(d);
    else
      reported.set(id, [d]);
  }
  const content = tagged.some((d) => d.anchorSpan !== void 0 && reported.has(retentionIdentity(d))) ? readContentOrUndefined(filePath) : void 0;
  const spans = content === void 0 ? void 0 : strictAnchorSpansIn(content);
  const retained = tagged.filter((d) => {
    const collisions = reported.get(retentionIdentity(d));
    if (collisions === void 0)
      return true;
    if (d.anchorSpan === void 0 || spans === void 0)
      return false;
    if (!spans.has(d.anchorSpan))
      return false;
    return !collisions.some((i) => strictAnchorSpan(content, i.line) === d.anchorSpan);
  });
  if (retained.length > MAX_RETAINED_SUPPRESSED_PER_FILE) {
    retained.sort((a, b) => (b.observedAt ?? 0) - (a.observedAt ?? 0));
    recordDegradationOnce({
      kind: "widget-suppressed-retention-capped",
      subject: filePath,
      reason: `${retained.length - MAX_RETAINED_SUPPRESSED_PER_FILE} suppressed row(s) beyond the ${MAX_RETAINED_SUPPRESSED_PER_FILE}-row per-file retention cap are no longer counted by the footer chip`
    });
    retained.length = MAX_RETAINED_SUPPRESSED_PER_FILE;
  }
  return [
    ...incoming,
    ...retained.map((d) => d.suppressedRetained ? d : { ...d, suppressedRetained: true })
  ];
}
function commitDiagnostics(rec, filePath, incoming, observedAt, key = fileMapKey(filePath), retainSuppressed = true) {
  const normalized = retainSuppressed ? retainSuppressedRows(rec.allDiagnostics, incoming, filePath) : incoming;
  rec.diagnosticCounts = countDiagnostics(normalized);
  rec.diagnostics = capStoredDiagnostics(normalized);
  rec.allDiagnostics = normalized;
  rec.hasFinalDiagnosticsSnapshot = true;
  rec.touchedAt = freshestObservation(normalized, observedAt ?? Date.now());
  files.set(key, rec);
  requestRender();
}
function classifyDiagnosticTier(d) {
  if (d.severity === "error")
    return "error";
  if (d.severity === "warning")
    return "warning";
  if (d.severity === "hint" || d.severity === "info")
    return "advisory";
  return void 0;
}
function countDiagnostics(diags) {
  let blocking = 0;
  let errors = 0;
  let warnings = 0;
  for (const diagnostic of diags) {
    if (diagnostic.disposition)
      continue;
    if (isBlocking(diagnostic))
      blocking++;
    if (diagnostic.stale && (diagnostic.staleReason ?? "past-eof") === "past-eof")
      continue;
    const tier = classifyDiagnosticTier(diagnostic);
    if (tier === "error")
      errors++;
    else if (tier === "warning")
      warnings++;
  }
  return { blocking, errors, warnings };
}
function countAdvisories(diags) {
  let advisories = 0;
  for (const diagnostic of diags) {
    if (diagnostic.stale && (diagnostic.staleReason ?? "past-eof") === "past-eof")
      continue;
    if (classifyDiagnosticTier(diagnostic) === "advisory")
      advisories++;
  }
  return advisories;
}
function applyPastEofGate(rec, lineCountCache) {
  if (rec.allDiagnostics.length === 0)
    return;
  const { diagnostics } = demotePastEofDiagnostics({
    store: "widget-state",
    cwd: process.cwd(),
    filePath: rec.filePath,
    diagnostics: rec.allDiagnostics,
    lineCountCache
  });
  rec.allDiagnostics = diagnostics;
  rec.diagnostics = capStoredDiagnostics(diagnostics);
  rec.diagnosticCounts = countDiagnostics(diagnostics);
}
function freshestObservation(diags, fallback) {
  let newest;
  for (const d of diags) {
    if (d.observedAt != null && (newest === void 0 || d.observedAt > newest)) {
      newest = d.observedAt;
    }
  }
  return newest ?? fallback;
}
function reconcileScanDiagnostics(filePath, diagnostics, confirmed, writeIndex, observedAt) {
  if (!confirmed)
    return false;
  return recordDiagnostics(filePath, diagnostics, writeIndex, observedAt);
}
function reconcileCorrelatedScanDiagnostics(filePath, diagnostics, writeIndex, observedAt) {
  const key = fileMapKey(filePath);
  if (!diagnosticsWriteGuard.shouldWrite(key, writeIndex))
    return;
  runnerWriteGuard.shouldWrite(key, writeIndex);
  const observedTs = observedAt ?? Date.now();
  const correlated = diagnostics.map((diagnostic) => ({
    ...diagnostic,
    observedAt: diagnostic.observedAt ?? observedTs
  }));
  commitDiagnostics(getOrCreate(filePath, key), filePath, correlated, observedTs, key);
}
async function reconcileStaleWidgetFiles() {
  const entries = [...files.entries()];
  const verdicts = await Promise.all(
    // `mapKey` is the normalized `files` key (used for deletion); stat the
    // record's real display path, not the lowercased key (#1020).
    entries.map(async ([mapKey, rec]) => {
      let mtimeMs;
      try {
        mtimeMs = (await stat(rec.filePath)).mtimeMs;
      } catch {
        return { mapKey, action: "drop" };
      }
      if (rec.allDiagnostics.length === 0) {
        return freshnessFromMtime({ mtimeMs, referenceMs: rec.touchedAt }).verdict === "stale" ? { mapKey, action: "drop" } : { mapKey, action: "keep" };
      }
      const mtimeStale = (d) => freshnessFromMtime({
        mtimeMs,
        referenceMs: d.observedAt ?? rec.touchedAt
      }).verdict === "stale";
      const spans = rec.allDiagnostics.some((d) => d.anchorSpan !== void 0 && mtimeStale(d)) ? readAnchorSpans(rec.filePath) : void 0;
      const survivors = rec.allDiagnostics.filter((d) => d.anchorSpan !== void 0 && spans !== void 0 ? spans.has(d.anchorSpan) : !mtimeStale(d));
      if (survivors.length === rec.allDiagnostics.length) {
        return { mapKey, action: "keep" };
      }
      if (survivors.length === 0) {
        return { mapKey, action: "drop" };
      }
      return { mapKey, action: "prune", survivors };
    })
  );
  let dropped = 0;
  for (const v of verdicts) {
    if (v.action === "keep")
      continue;
    if (v.action === "drop") {
      files.delete(v.mapKey);
      dropped += 1;
      continue;
    }
    const rec = files.get(v.mapKey);
    if (rec) {
      rec.allDiagnostics = v.survivors;
      rec.diagnostics = capStoredDiagnostics(v.survivors);
      rec.diagnosticCounts = countDiagnostics(v.survivors);
    }
    dropped += 1;
  }
  if (dropped > 0)
    requestRenderFn?.();
  return dropped;
}
async function reconcileStaleWidgetDependencyBlockers(cwd, turnIndex) {
  let demoted = 0;
  let truncatedImports = 0;
  for (const [, rec] of files.entries()) {
    if (!rec.allDiagnostics.some((d) => isBlocking(d) && d.tool === "lsp"))
      continue;
    let importMtimes = [];
    try {
      const result = await collectForwardImportMtimes(cwd, rec.filePath, void 0, turnIndex);
      importMtimes = result.mtimes;
      if (result.truncated)
        truncatedImports += 1;
    } catch {
      importMtimes = [];
    }
    if (importMtimes.length === 0)
      continue;
    let changed = false;
    for (const d of rec.allDiagnostics) {
      if (!isBlocking(d) || d.tool !== "lsp")
        continue;
      const baseline = d.observedAt ?? rec.touchedAt;
      if (importMtimes.some((im) => freshnessFromMtime({
        mtimeMs: im.mtimeMs,
        referenceMs: baseline
      }).verdict === "stale")) {
        d.stale = true;
        d.staleReason = "dependency-drift";
        changed = true;
        demoted += 1;
      }
    }
    if (changed) {
      rec.diagnosticCounts = countDiagnostics(rec.allDiagnostics);
      rec.diagnostics = capStoredDiagnostics(rec.allDiagnostics);
    }
  }
  if (demoted > 0)
    requestRenderFn?.();
  return { demoted, truncatedImports };
}
function getWidgetBlockingFilesForSweep() {
  const out = [];
  for (const rec of files.values()) {
    let earliest;
    for (const d of rec.allDiagnostics) {
      if (!isBlocking(d) || d.tool !== "lsp")
        continue;
      const observedAt = d.observedAt ?? rec.touchedAt;
      if (earliest === void 0 || observedAt < earliest)
        earliest = observedAt;
    }
    if (earliest !== void 0)
      out.push({ filePath: rec.filePath, recordedAtMs: earliest });
  }
  return out;
}
function markWidgetFileBlockersStale(filePath, reason) {
  const rec = files.get(fileMapKey(filePath));
  if (!rec)
    return false;
  let changed = false;
  for (const d of rec.allDiagnostics) {
    if (!isBlocking(d) || d.tool !== "lsp")
      continue;
    d.stale = true;
    d.staleReason = reason;
    changed = true;
  }
  if (changed) {
    rec.diagnosticCounts = countDiagnostics(rec.allDiagnostics);
    rec.diagnostics = capStoredDiagnostics(rec.allDiagnostics);
    requestRenderFn?.();
  }
  return changed;
}
function isDependencyDriftDemoted(d) {
  return d.stale === true && d.staleReason === "dependency-drift" && d.footerRetired !== true;
}
function drainRenderedDependencyDriftFilePaths() {
  const out = [...renderedDependencyDriftFiles];
  renderedDependencyDriftFiles.clear();
  return out;
}
function incrementWidgetDependencyDriftDelivery(filePath) {
  const rec = files.get(fileMapKey(filePath));
  if (!rec)
    return 0;
  let next = 0;
  for (const d of rec.allDiagnostics) {
    if (isDependencyDriftDemoted(d)) {
      next = (d.staleDeliveryCount ?? 0) + 1;
      d.staleDeliveryCount = next;
    }
  }
  return next;
}
function retireWidgetDependencyDriftBlockers(filePath) {
  const rec = files.get(fileMapKey(filePath));
  if (!rec)
    return false;
  let changed = false;
  for (const d of rec.allDiagnostics) {
    if (isDependencyDriftDemoted(d)) {
      d.footerRetired = true;
      changed = true;
    }
  }
  if (!changed)
    return false;
  renderedDependencyDriftFiles.delete(rec.filePath);
  requestRenderFn?.();
  return true;
}
function getFileDiagnosticSummaries() {
  return [...files.values()].map((rec) => {
    applyPastEofGate(rec);
    const live = rec.allDiagnostics.filter((d) => d.disposition === void 0);
    return {
      filePath: rec.filePath,
      blocking: rec.diagnosticCounts.blocking,
      errors: rec.diagnosticCounts.errors,
      warnings: rec.diagnosticCounts.warnings,
      advisories: countAdvisories(live),
      hasFinalSnapshot: rec.hasFinalDiagnosticsSnapshot,
      diagnostics: live.map((d) => ({ ...d }))
    };
  });
}
function countRetainedSuppressedRows(filePath) {
  const rec = files.get(fileMapKey(filePath));
  if (!rec)
    return 0;
  let n = 0;
  for (const d of rec.allDiagnostics)
    if (d.suppressedRetained)
      n += 1;
  return n;
}
function getFileDiagnostics(filePath) {
  const rec = files.get(fileMapKey(filePath));
  if (!rec)
    return void 0;
  applyPastEofGate(rec);
  return rec.allDiagnostics.map((d) => ({ ...d }));
}
function recordLsp(serverId, root, status, durationMs) {
  const normalizedRoot = normalizeMapKey(root);
  const key = `${serverId}@${normalizedRoot}`;
  const mapped = status === "spawn_start" ? "spawning" : status === "spawn_success" ? "ready" : "failed";
  lspServers.set(key, { serverId, root, status: mapped, durationMs });
  requestRender();
}
function getOrCreate(filePath, key = fileMapKey(filePath)) {
  maybePruneInactiveFileRecords();
  return files.get(key) ?? {
    filePath,
    runners: /* @__PURE__ */ new Map(),
    formatters: /* @__PURE__ */ new Map(),
    diagnostics: [],
    allDiagnostics: [],
    diagnosticCounts: { blocking: 0, errors: 0, warnings: 0 },
    hasFinalDiagnosticsSnapshot: false,
    touchedAt: Date.now()
  };
}
function hasLiveDiagnostic(rec) {
  return rec.hasFinalDiagnosticsSnapshot && rec.diagnostics.length > 0;
}
function capStoredDiagnostics(diagnostics) {
  if (diagnostics.length <= MAX_STORED_DIAGNOSTICS_PER_FILE)
    return diagnostics;
  const blockers = diagnostics.filter(isBlocking);
  if (blockers.length >= MAX_STORED_DIAGNOSTICS_PER_FILE) {
    return blockers.slice(0, MAX_STORED_DIAGNOSTICS_PER_FILE);
  }
  const rest = diagnostics.filter((d) => !isBlocking(d));
  return [
    ...blockers,
    ...rest.slice(0, MAX_STORED_DIAGNOSTICS_PER_FILE - blockers.length)
  ];
}
function requestRender() {
  requestRenderFn?.();
}

// dist/clients/lsp-budget.js
var DEFAULT_LSP_BUDGET_IDLE_TIMEOUT_MS = 6e4;
function getLspBudgetIdleTimeoutMs() {
  const raw = Number(process.env.PI_LENS_LSP_BUDGET_IDLE_TIMEOUT_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_LSP_BUDGET_IDLE_TIMEOUT_MS;
}
var cachedDecision;
function shouldDegradeAuxiliaryLsp() {
  return cachedDecision?.degradeAuxiliary ?? false;
}
function shouldShortenLspIdleTimeout() {
  return cachedDecision?.shortenIdleTimeout ?? false;
}
function shouldPreferPullOnlyDiagnostics() {
  return cachedDecision?.preferPullOnly ?? false;
}

// dist/clients/dispatch/diagnostic-taxonomy.js
var SILENT_ERROR_HINTS = [
  "empty-catch",
  "no-discarded-error",
  "unchecked-throwing-call",
  "bare-except",
  "empty-rescue",
  "swallow",
  "silent"
];
var INJECTION_HINTS = [
  "sql-injection",
  "command-injection",
  "template-injection",
  "xss",
  "eval",
  "exec",
  "inner-html",
  "javascript-url"
];
var SECRET_HINTS = [
  "secret",
  "token",
  "password",
  "api-key",
  "hardcoded-secrets"
];
var ASYNC_HINTS = [
  "await-in-loop",
  "promise",
  "concurrency",
  "async",
  "then-catch"
];
function hasAny(haystack, hints) {
  return hints.some((h) => haystack.includes(h));
}
function classifyDefect(rule, tool, message) {
  const text = `${rule ?? ""} ${tool ?? ""} ${message ?? ""}`.toLowerCase();
  if (hasAny(text, SILENT_ERROR_HINTS))
    return "silent-error";
  if (hasAny(text, INJECTION_HINTS))
    return "injection";
  if (hasAny(text, SECRET_HINTS))
    return "secrets";
  if (hasAny(text, ASYNC_HINTS))
    return "async-misuse";
  if (text.includes("no-") || text.includes("return") || text.includes("constructor")) {
    return "correctness";
  }
  if (text.includes("unsafe") || text.includes("security") || text.includes("ssrf") || text.includes("path-traversal") || text.includes("deserial") || text.includes("auth-bypass") || text.includes("crypto"))
    return "safety";
  if (text.includes("style") || text.includes("format"))
    return "style";
  return "unknown";
}
function classifyDiagnostic(d) {
  return classifyDefect(d.rule, d.tool, d.message);
}

// dist/clients/dispatch/rule-ignores.js
import * as path9 from "node:path";

// dist/clients/dispatch/runners/yaml-rule-parser.js
import { createHash as createHash4 } from "node:crypto";
import * as fs10 from "node:fs";
import * as path8 from "node:path";
var OVERLY_BROAD_PATTERNS = ["$NAME", "$FIELD", "$_", "$X", "$VAR", "$EXPR"];
var MAX_BLOCKING_RULE_COMPLEXITY = 8;
var RULES_CACHE_FRESHNESS_CADENCE_MS = 2e3;
var rulesCache = new BoundedLruCache(64);
var blockingRulesCache = new BoundedLruCache(64);
var contentRulesCache = new BoundedLruCache(64);
var contentBlockingRulesCache = new BoundedLruCache(64);
function loadYamlRules(ruleDir, severityFilter) {
  return getCachedRules(ruleDir, severityFilter);
}
function findYamlRuleFiles(ruleDir) {
  let entries;
  try {
    entries = fs10.readdirSync(ruleDir, { withFileTypes: true }).sort((a, b) => compareOrdinal(a.name, b.name));
  } catch {
    return [];
  }
  const files2 = [];
  for (const entry of entries) {
    const full = path8.join(ruleDir, entry.name);
    if (entry.isDirectory()) {
      files2.push(...findYamlRuleFiles(full));
    } else if (entry.isFile() && /\.ya?ml$/i.test(entry.name)) {
      files2.push(full);
    }
  }
  return files2;
}
function loadYamlRuleFiles(files2, severityFilter) {
  const rules = [];
  for (const file of files2) {
    let content;
    try {
      content = fs10.readFileSync(file, "utf-8");
    } catch {
      continue;
    }
    const documents = content.split(/^---\s*$/m).filter((doc) => doc.trim());
    for (const document of documents) {
      const rule = parseSimpleYaml(document.trim());
      if (!rule?.id) {
        recordDegradationOnce({
          kind: "ast-grep-rule-invalid",
          subject: file,
          reason: "ast-grep rule could not be parsed"
        });
        continue;
      }
      if (severityFilter && rule.severity !== severityFilter)
        continue;
      rules.push(rule);
    }
  }
  return rules;
}
function loadYamlRulesFresh(ruleDir, severityFilter) {
  const files2 = findYamlRuleFiles(ruleDir);
  const hash = createHash4("sha256");
  for (const file of files2) {
    hash.update(path8.relative(ruleDir, file));
    hash.update("\0");
    try {
      hash.update(fs10.readFileSync(file));
    } catch {
      hash.update("missing");
    }
    hash.update("\0");
  }
  const signature = hash.digest("hex");
  const cache2 = severityFilter === "error" ? contentBlockingRulesCache : contentRulesCache;
  const cached = cache2.get(ruleDir);
  if (cached?.signature === signature)
    return cached.rules;
  const rules = loadYamlRuleFiles(files2, severityFilter);
  cache2.set(ruleDir, { rules, signature });
  return rules;
}
function getCachedRules(ruleDir, severityFilter) {
  if (!fs10.existsSync(ruleDir)) {
    return [];
  }
  const cache2 = severityFilter === "error" ? blockingRulesCache : rulesCache;
  const cached = cache2.get(ruleDir);
  const now = Date.now();
  if (cached && now - cached.checkedAtMs < RULES_CACHE_FRESHNESS_CADENCE_MS) {
    return cached.rules;
  }
  const files2 = findYamlRuleFiles(ruleDir);
  const fileStamps = files2.flatMap((file) => {
    try {
      const stat2 = fs10.statSync(file);
      return [{ path: file, mtimeMs: stat2.mtimeMs, size: stat2.size }];
    } catch {
      return [];
    }
  });
  const metadataMatches = cached?.files.length === fileStamps.length && cached.files.every((file, index) => file.path === fileStamps[index].path && file.mtimeMs === fileStamps[index].mtimeMs && file.size === fileStamps[index].size);
  if (cached && metadataMatches) {
    cached.checkedAtMs = now;
    return cached.rules;
  }
  const rules = loadYamlRuleFiles(files2, severityFilter);
  cache2.set(ruleDir, { rules, files: fileStamps, checkedAtMs: now });
  return rules;
}
function isOverlyBroadPattern(pattern) {
  if (!pattern)
    return false;
  if (typeof pattern !== "string")
    return false;
  if (OVERLY_BROAD_PATTERNS.includes(pattern.trim()))
    return true;
  return /^\$[A-Z_]+$/i.test(pattern.trim());
}
function isStructuredRule(rule) {
  if (!rule.rule)
    return false;
  const hasRichPattern = typeof rule.rule.pattern === "object" && rule.rule.pattern !== null;
  return !!(hasRichPattern || rule.rule.has || rule.rule.any || rule.rule.all || rule.rule.not || rule.rule.regex);
}
function calculateRuleComplexity(condition) {
  if (!condition)
    return 0;
  let score = 0;
  if (condition.has)
    score += 3;
  if (condition.not)
    score += 2;
  if (condition.regex)
    score += 2;
  if (condition.any)
    score += condition.any.length * 2;
  if (condition.all)
    score += condition.all.length * 3;
  if (condition.has)
    score += calculateRuleComplexity(condition.has);
  if (condition.not)
    score += calculateRuleComplexity(condition.not);
  if (condition.any) {
    for (const sub of condition.any)
      score += calculateRuleComplexity(sub);
  }
  if (condition.all) {
    for (const sub of condition.all)
      score += calculateRuleComplexity(sub);
  }
  return score;
}
function parseSimpleYaml(content) {
  let parsed;
  try {
    parsed = js_yaml_default.load(content);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object")
    return null;
  const rule = parsed;
  return rule.id ? rule : null;
}

// dist/clients/dispatch/ast-grep-catalog.js
function buildEffectiveAstGrepCatalog(root) {
  const sources = [];
  const effectiveRules = /* @__PURE__ */ new Map();
  for (const source of getAstGrepRuleSources(root)) {
    const rules = source.origin === "project" ? loadYamlRulesFresh(source.dir) : loadYamlRules(source.dir);
    sources.push({ source, rules });
    for (const rule of rules) {
      if (effectiveRules.has(rule.id))
        continue;
      effectiveRules.set(rule.id, { rule, source });
    }
  }
  return { sources, effectiveRules };
}

// dist/clients/dispatch/rule-ignores.js
function isRuleIgnoredForPath(filePath, root, patterns) {
  if (!patterns || patterns.length === 0)
    return false;
  const pathApi = isWindowsPath(root) || isWindowsPath(filePath) ? path9.win32 : path9.posix;
  const relative4 = pathApi.relative(root, filePath);
  const outsideRoot = relative4 !== "" && (relative4 === ".." || relative4.startsWith(`..${pathApi.sep}`) || pathApi.isAbsolute(relative4));
  const displayPath = toPosix(outsideRoot ? filePath : relative4);
  return patterns.some((pattern) => (!outsideRoot || !pattern.replaceAll("\\", "/").endsWith("/**")) && minimatch(displayPath, pattern, { dot: true }));
}
function loadRuleIgnorePatterns(root) {
  const patterns = /* @__PURE__ */ new Map();
  for (const [id, { rule }] of buildEffectiveAstGrepCatalog(root).effectiveRules) {
    if (rule.ignores?.length)
      patterns.set(id, rule.ignores);
  }
  return patterns;
}

// dist/clients/dispatch/auxiliary-lsp.js
var NOSEMGREP_RE = /(?:#|\/\/)\s*nosemgrep(?::\s*(.+))?/i;
var NOSEMGREP_STANDALONE_RE = /^\s*(?:#|\/\/)\s*nosemgrep(?::\s*(.+))?\s*$/i;
function isNosemgrepSuppressed(d, content) {
  const startLine = d.range?.start?.line;
  if (startLine == null)
    return false;
  const lines = content.split("\n");
  const ruleId = String(d.code ?? "");
  const checkLine = (text, standaloneOnly) => {
    if (!text)
      return false;
    const m = (standaloneOnly ? NOSEMGREP_STANDALONE_RE : NOSEMGREP_RE).exec(text);
    if (!m)
      return false;
    if (m[1] === void 0)
      return true;
    return m[1].split(",").map((s) => s.trim()).filter(Boolean).includes(ruleId);
  };
  return checkLine(lines[startLine], false) || checkLine(lines[startLine - 1], true);
}
var ZIZMOR_IGNORE_RE = /#\s*zizmor:\s*ignore\[([^\]]+)\]/i;
function isZizmorIgnoreSuppressed(d, content) {
  const startLine = d.range?.start?.line;
  if (startLine == null)
    return false;
  const line = content.split("\n")[startLine];
  if (!line)
    return false;
  const match = ZIZMOR_IGNORE_RE.exec(line);
  if (!match)
    return false;
  const ruleId = String(d.code ?? "").toLowerCase();
  return match[1].split(",").map((s) => s.trim().toLowerCase()).includes(ruleId);
}
var blockOnErrorWhenAllowed = (d, { blockingAllowed }) => blockingAllowed && d.severity === 1 ? "blocking" : "warning";
var AUXILIARY_LSP_PROFILES = [
  {
    serverId: "opengrep",
    tool: "opengrep",
    // Opengrep is a Semgrep fork and tags LSP diagnostics `source: "Semgrep"`.
    sourceMatch: /opengrep|semgrep/i,
    killSwitchFlag: "no-opengrep",
    enabledByDefault: true,
    // The LSP diagnostic carries severity + rule id but NOT confidence (the
    // CLI's metadata.confidence is stripped). Opengrep's login-free `auto`
    // Community set is uniformly ERROR/LOW-confidence audit-tier, so blocking on
    // it would be a firehose. We honor ERROR→blocking ONLY when the repo
    // supplies its own curated rules (the author's deliberate severity); the
    // auto set is advisory. Either way, findings surface via lens_diagnostics.
    allowBlocking: (cwd) => Boolean(findLocalOpengrepConfig(cwd)),
    semantic: blockOnErrorWhenAllowed,
    defectClass: (d) => classifyDefect(String(d.code ?? ""), "opengrep", d.message ?? ""),
    // Honor the canonical Semgrep suppression the user already knows (#441).
    isSuppressed: isNosemgrepSuppressed
  },
  {
    serverId: "ast-grep",
    tool: "ast-grep",
    // ast-grep tags its LSP diagnostics `source: "ast-grep"`.
    sourceMatch: /ast[-_]?grep/i,
    killSwitchFlag: "no-ast-grep",
    enabledByDefault: true,
    // Matches the in-process ast-grep-napi runner's own `skipTestFiles: true`
    // (#687) — that flag stops applying the moment the ast-grep binary is
    // present, since the napi runner then skips entirely in favor of this
    // LSP surface, which had no test-file gating of its own.
    skipTestFiles: true,
    // The ast-grep LSP runs either the repo's own sgconfig (when present) or
    // pi-lens's shipped baseline sgconfig. In both cases the rule severity is
    // deliberate, so preserve ast-grep's severity semantics: ERROR can block,
    // WARNING/INFO stay advisory.
    allowBlocking: () => true,
    semantic: blockOnErrorWhenAllowed,
    defectClass: (d) => classifyDefect(String(d.code ?? ""), "ast-grep", d.message ?? "")
  },
  {
    serverId: "zizmor",
    tool: "zizmor",
    // zizmor tags its LSP diagnostics `source: "zizmor"`.
    sourceMatch: /zizmor/i,
    killSwitchFlag: "no-zizmor",
    enabledByDefault: true,
    // zizmor's default ("regular") persona is a curated, low-false-positive
    // audit set, but as an always-on advisory we only let it BLOCK when the repo
    // opts in with its own `zizmor.yml` (the author's deliberate severities /
    // ignores). Advisory otherwise — findings still surface via lens_diagnostics.
    // zizmor maps High→ERROR(1), Medium/Low→WARNING(2), Informational→INFO(3).
    allowBlocking: (cwd) => Boolean(findLocalZizmorConfig(cwd)),
    semantic: blockOnErrorWhenAllowed,
    defectClass: (d) => classifyDefect(String(d.code ?? ""), "zizmor", d.message ?? ""),
    // Honor zizmor's own native per-finding suppression (#971) — a documented
    // escape hatch for a workflow-context judgment call the audit itself has no
    // way to make (checkout-only vs. artifact-uploading job; a locally-built
    // tarball install vs. an arbitrary remote package).
    isSuppressed: isZizmorIgnoreSuppressed
  },
  {
    serverId: "typos",
    tool: "typos",
    // typos-lsp tags its LSP diagnostics `source: "typos"`.
    sourceMatch: /typos/i,
    killSwitchFlag: "no-typos",
    enabledByDefault: true,
    // typos is allow-list based (only KNOWN misspellings with a known
    // correction), but as an always-on advisory we only let it BLOCK when the
    // repo opts in with its own `typos.toml`/`_typos.toml`/`.typos.toml` (the
    // team's curated dictionary + chosen severity). Advisory otherwise —
    // findings still surface via lens_diagnostics. Note typos-lsp's default
    // severity is WARNING, so even with a config it stays advisory unless the
    // repo raises `diagnostic-severity` to Error.
    allowBlocking: (cwd) => Boolean(findLocalTyposConfig(cwd)),
    semantic: blockOnErrorWhenAllowed,
    // A misspelling is a documentation/quality defect — not security or
    // correctness. "style" is the closest taxonomy class.
    defectClass: () => "style"
  }
];
function enabledAuxiliaryLspServerIds(getFlag) {
  if (shouldDegradeAuxiliaryLsp() || isSubagentSession())
    return [];
  return AUXILIARY_LSP_PROFILES.flatMap((p) => p.enabledByDefault && !(p.killSwitchFlag && getFlag(p.killSwitchFlag) === true) ? [p.serverId] : []);
}
var profileForSourceCache = /* @__PURE__ */ new Map();
function findAuxiliaryProfileForSource(source) {
  if (!source)
    return void 0;
  const cached = profileForSourceCache.get(source);
  if (cached !== void 0 || profileForSourceCache.has(source))
    return cached;
  const found = AUXILIARY_LSP_PROFILES.find((p) => p.sourceMatch.test(source));
  profileForSourceCache.set(source, found);
  return found;
}
function isAuxiliaryDiagnosticSuppressed(d, content) {
  const profile = findAuxiliaryProfileForSource(d.source);
  return Boolean(profile?.isSuppressed?.(d, content));
}
function applyAuxiliarySuppressions(diagnostics, content, opts) {
  const { filePath, scanRoot } = opts ?? {};
  const ruleIgnores = filePath && scanRoot ? loadRuleIgnorePatterns(scanRoot) : void 0;
  return diagnostics.filter((d) => {
    if (isAuxiliaryDiagnosticSuppressed(d, content))
      return false;
    if (opts?.fileRole === "test") {
      const profile = findAuxiliaryProfileForSource(d.source);
      if (profile?.skipTestFiles)
        return false;
    }
    if (ruleIgnores !== void 0 && findAuxiliaryProfileForSource(d.source)?.tool === "ast-grep" && isRuleIgnoredForPath(filePath, scanRoot, ruleIgnores.get(String(d.code)))) {
      return false;
    }
    return true;
  });
}
function retagAuxiliaryDiagnostics(diagnostics, rawLspDiags, content, ctx) {
  const blockingAllowedByProfile = /* @__PURE__ */ new Map();
  const suppressedIndices = /* @__PURE__ */ new Set();
  for (let i = 0; i < diagnostics.length; i++) {
    const profile = findAuxiliaryProfileForSource(rawLspDiags[i]?.source);
    if (!profile)
      continue;
    if (profile.skipTestFiles && ctx.fileRole === "test") {
      suppressedIndices.add(i);
      continue;
    }
    if (isAuxiliaryDiagnosticSuppressed(rawLspDiags[i], content)) {
      suppressedIndices.add(i);
      continue;
    }
    let blockingAllowed = blockingAllowedByProfile.get(profile);
    if (blockingAllowed === void 0) {
      blockingAllowed = profile.allowBlocking?.(ctx.cwd) ?? false;
      blockingAllowedByProfile.set(profile, blockingAllowed);
    }
    const d = diagnostics[i];
    d.tool = profile.tool;
    d.semantic = profile.semantic(rawLspDiags[i], { blockingAllowed });
    if (d.semantic !== "blocking" && d.severity === "error") {
      d.severity = "warning";
    }
    const defectClass = profile.defectClass?.(rawLspDiags[i]);
    if (defectClass)
      d.defectClass = defectClass;
  }
  return suppressedIndices.size ? diagnostics.filter((_, i) => !suppressedIndices.has(i)) : diagnostics;
}

// dist/clients/deferred-lsp-work.js
var deferredController;
var deferredWork;
function abortDeferredLspWork(reason) {
  const controller = deferredController;
  deferredController = void 0;
  deferredWork = void 0;
  controller?.abort(new Error(reason));
}
function armDeferredLspWork() {
  if (isDeferredLspWorkArmed())
    return void 0;
  const controller = new AbortController();
  deferredController = controller;
  deferredWork = void 0;
  return controller.signal;
}
function registerDeferredLspWork(signal, work) {
  if (deferredController?.signal !== signal)
    return;
  deferredWork = work;
  void work.finally(() => {
    if (deferredController?.signal !== signal)
      return;
    deferredController = void 0;
    deferredWork = void 0;
  });
}
function isDeferredLspWorkArmed() {
  return deferredController?.signal.aborted === false;
}

// dist/clients/lsp/document-drift.js
import { createHash as createHash5 } from "node:crypto";
import nodeFs from "node:fs";
function fingerprintDocumentContent(content) {
  if (content.length <= 96)
    return `${content.length}:${content}`;
  return `${content.length}:${createHash5("sha256").update(content).digest("hex")}`;
}
var SKIPPED = {
  checked: 0,
  candidates: 0,
  resynced: 0,
  failed: 0,
  unchanged: 0,
  deferred: 0,
  vanished: 0,
  unheld: 0,
  tracked: 0,
  queued: /* @__PURE__ */ new Map()
};
var DRIFT_CHECK_BATCH = 64;
var DRIFT_RESYNC_BATCH = 4;
var DRIFT_TRACK_CAP = 512;
var DEFAULT_DRIFT_CHECK_INTERVAL_MS = 1e4;
var SWEEP_KEY = "open-document-drift";
function driftCheckIntervalMs() {
  const raw = Number(process.env.PI_LENS_LSP_DRIFT_CHECK_MS);
  if (!Number.isFinite(raw) || raw < 0)
    return DEFAULT_DRIFT_CHECK_INTERVAL_MS;
  return Math.floor(raw);
}
var DocumentDriftTracker = class {
  /** Insertion-ordered; the sweep cursor walks it round-robin. */
  synced = /* @__PURE__ */ new Map();
  /**
   * Git/external recovery targets waiting for the same paced resync budget,
   * each with whether its push is a save (#3828 r3). The save lives and dies
   * with the queue entry, so a deferred target keeps it and a sent one drops it.
   */
  pendingResync = /* @__PURE__ */ new Map();
  lastSweepAt = 0;
  cursor = 0;
  /**
   * At most one pass at a time (#1753's primitive). Callers fire `sweep`
   * without awaiting it from hot paths, so an overlapping call must JOIN the
   * running pass rather than double the stat load. One key: the pass is
   * workspace-wide, not per file. No `generation` hook — `clear()` is called
   * from the service reset, and a pass that settles afterwards writes into a
   * map the reset already emptied, so there is no successor for it to evict.
   */
  flight = createSingleFlight();
  get size() {
    return this.synced.size;
  }
  peek(filePath) {
    return this.synced.get(normalizeMapKey(filePath));
  }
  /**
   * Queue known-open targets for the next ordinary paced drift pass.
   * `saved` (#3828 r3): the caller wrote these bytes to disk, so the push is a
   * save (#3405). A later enqueue without it keeps a save still queued.
   */
  enqueueResync(filePaths, options = {}) {
    for (const filePath of filePaths) {
      const key = normalizeMapKey(filePath);
      this.pendingResync.set(key, this.pendingResync.get(key) === true || options.saved === true);
    }
  }
  get pendingResyncCount() {
    return this.pendingResync.size;
  }
  /**
   * Record content that landed on EVERY server holding this document.
   *
   * The caller owns that coverage judgement — see
   * `LSPService.recordFullyCoveredSync`. `now` is the moment the sync STARTED,
   * not the moment its write landed; see {@link SyncedDocumentRecord.syncedAt}.
   */
  recordSynced(filePath, content, now = Date.now(), fingerprint = fingerprintDocumentContent(content)) {
    const key = normalizeMapKey(filePath);
    this.synced.delete(key);
    this.synced.set(key, {
      size: Buffer.byteLength(content, "utf8"),
      fingerprint,
      syncedAt: now
    });
    while (this.synced.size > DRIFT_TRACK_CAP) {
      const oldest = this.synced.keys().next();
      if (oldest.done)
        break;
      this.synced.delete(oldest.value);
    }
  }
  forget(filePath) {
    this.synced.delete(normalizeMapKey(filePath));
  }
  /** Drop every record. Used on shutdown/session reset, where the server's view dies with it. */
  clear() {
    this.synced.clear();
    this.pendingResync.clear();
    this.cursor = 0;
    this.lastSweepAt = 0;
    this.flight.clear();
  }
  /**
   * Stat one batch of tracked documents and resync the ones whose disk state
   * no longer matches what the server holds.
   *
   * Rate-limited and single-flight: callers fire this from hot paths without
   * awaiting it, so an overlapping call must join the running pass rather than
   * double the stat load.
   */
  async sweep(deps, options = {}) {
    const now = deps.now ?? Date.now;
    if (!this.flight.has(SWEEP_KEY)) {
      const intervalMs = driftCheckIntervalMs();
      if (!options.force) {
        if (intervalMs === 0)
          return SKIPPED;
        if (now() - this.lastSweepAt < intervalMs)
          return SKIPPED;
      }
      if (this.synced.size === 0) {
        this.lastSweepAt = now();
        return SKIPPED;
      }
    }
    return this.flight.run(SWEEP_KEY, () => this.runSweep(deps, now));
  }
  async runSweep(deps, now) {
    this.lastSweepAt = now();
    const stat2 = deps.stat ?? defaultStat;
    const read = deps.read ?? defaultRead;
    const keys = [...this.synced.keys()];
    const tracked = keys.length;
    if (this.cursor >= tracked)
      this.cursor = 0;
    const window = [];
    for (let i = 0; i < Math.min(DRIFT_CHECK_BATCH, tracked); i++) {
      window.push(keys[(this.cursor + i) % tracked]);
    }
    this.cursor = (this.cursor + window.length) % tracked;
    let unheld = 0;
    const batch = [];
    for (const key of window) {
      const record2 = this.synced.get(key);
      if (!record2)
        continue;
      if (deps.holdsDocument && !deps.holdsDocument(key)) {
        this.synced.delete(key);
        unheld += 1;
        deps.onDrift?.({
          filePath: key,
          driftAgeMs: Math.max(0, now() - record2.syncedAt),
          disposition: "unheld",
          syncedSize: record2.size,
          diskSize: -1
        });
        continue;
      }
      batch.push(key);
    }
    const stats = await Promise.all(batch.map(async (key) => {
      try {
        return { key, stat: await stat2(key) };
      } catch {
        return { key, stat: void 0 };
      }
    }));
    let candidates = 0;
    let vanished = 0;
    const drifted = [];
    for (const entry of stats) {
      const record2 = this.synced.get(entry.key);
      if (!record2)
        continue;
      if (!entry.stat) {
        this.synced.delete(entry.key);
        vanished += 1;
        deps.onDrift?.({
          filePath: entry.key,
          driftAgeMs: Math.max(0, now() - record2.syncedAt),
          disposition: "vanished",
          syncedSize: record2.size,
          diskSize: -1
        });
        continue;
      }
      const sizeMoved = entry.stat.size !== record2.size;
      const mtimeMoved = Math.floor(entry.stat.mtimeMs) > record2.syncedAt;
      if (!sizeMoved && !mtimeMoved)
        continue;
      candidates += 1;
      drifted.push({
        key: entry.key,
        record: record2,
        mtimeMs: entry.stat.mtimeMs
      });
    }
    const queued = [...this.pendingResync.keys()];
    const queuedDispositions = /* @__PURE__ */ new Map();
    for (const key of queued) {
      if (deps.holdsDocument && !deps.holdsDocument(key)) {
        this.pendingResync.delete(key);
        unheld += 1;
        queuedDispositions.set(key, "unheld");
        continue;
      }
    }
    let resynced = 0;
    let failed = 0;
    let unchanged = 0;
    let deferred = 0;
    const resyncedKeys = /* @__PURE__ */ new Set();
    for (const key of queued) {
      if (!this.pendingResync.has(key))
        continue;
      if (resynced >= DRIFT_RESYNC_BATCH) {
        deferred += 1;
        queuedDispositions.set(key, "deferred");
        deps.onDrift?.({
          filePath: key,
          driftAgeMs: 0,
          disposition: "deferred",
          syncedSize: this.synced.get(key)?.size ?? 0,
          diskSize: -1
        });
        continue;
      }
      let content;
      const readStamp = performance.now();
      try {
        content = await read(key);
      } catch {
        this.pendingResync.delete(key);
        vanished += 1;
        queuedDispositions.set(key, "vanished");
        continue;
      }
      let landed = false;
      try {
        landed = await deps.resync(key, content, 0, readStamp, this.pendingResync.get(key));
      } catch {
        landed = false;
      }
      if (!landed) {
        failed += 1;
        queuedDispositions.set(key, "failed");
        deps.onDrift?.({
          filePath: key,
          driftAgeMs: 0,
          disposition: "failed",
          syncedSize: this.synced.get(key)?.size ?? 0,
          diskSize: Buffer.byteLength(content, "utf8")
        });
        continue;
      }
      this.pendingResync.delete(key);
      resynced += 1;
      resyncedKeys.add(key);
      queuedDispositions.set(key, "resynced");
      deps.onDrift?.({
        filePath: key,
        driftAgeMs: 0,
        disposition: "resynced",
        syncedSize: this.synced.get(key)?.size ?? 0,
        diskSize: Buffer.byteLength(content, "utf8")
      });
    }
    for (const { key, record: record2, mtimeMs } of drifted) {
      if (resyncedKeys.has(key))
        continue;
      const driftAgeMs = Math.max(0, now() - record2.syncedAt);
      if (resynced >= DRIFT_RESYNC_BATCH) {
        deferred += 1;
        deps.onDrift?.({
          filePath: key,
          driftAgeMs,
          disposition: "deferred",
          syncedSize: record2.size,
          diskSize: -1
        });
        continue;
      }
      let content;
      const readStamp = performance.now();
      try {
        content = await read(key);
      } catch {
        this.synced.delete(key);
        vanished += 1;
        continue;
      }
      if (fingerprintDocumentContent(content) === record2.fingerprint) {
        unchanged += 1;
        this.recordSynced(key, content, settledStamp(now(), mtimeMs));
        deps.onDrift?.({
          filePath: key,
          driftAgeMs,
          disposition: "unchanged",
          syncedSize: record2.size,
          diskSize: Buffer.byteLength(content, "utf8")
        });
        continue;
      }
      const diskSize = Buffer.byteLength(content, "utf8");
      let landed = false;
      try {
        landed = await deps.resync(key, content, driftAgeMs, readStamp);
      } catch {
        landed = false;
      }
      if (!landed) {
        failed += 1;
        deps.onDrift?.({
          filePath: key,
          driftAgeMs,
          disposition: "failed",
          syncedSize: record2.size,
          diskSize
        });
        continue;
      }
      resynced += 1;
      this.recordSynced(key, content, settledStamp(now(), mtimeMs));
      deps.onDrift?.({
        filePath: key,
        driftAgeMs,
        disposition: "resynced",
        syncedSize: record2.size,
        diskSize
      });
    }
    return {
      checked: batch.length,
      candidates,
      resynced,
      failed,
      unchanged,
      deferred,
      vanished,
      unheld,
      tracked,
      queued: queuedDispositions
    };
  }
};
function settledStamp(now, observedMtimeMs) {
  return Math.max(now, Math.ceil(observedMtimeMs));
}
async function defaultStat(filePath) {
  const st = await nodeFs.promises.stat(filePath);
  return { size: st.size, mtimeMs: st.mtimeMs };
}
async function defaultRead(filePath) {
  return nodeFs.promises.readFile(filePath, "utf-8");
}

// dist/clients/lsp/pending-aux-coverage.js
var MAX_PENDING_AUX_ENTRIES = 50;
var DEFAULT_LATE_AUX_REARM_TTL_MS = 5 * 6e4;
var MAX_LATE_AUX_REARMS = 8;
function readLateAuxRearmTtlMs() {
  const raw = process.env.PI_LENS_LATE_AUX_REARM_TTL_MS;
  if (raw === void 0)
    return DEFAULT_LATE_AUX_REARM_TTL_MS;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0)
    return DEFAULT_LATE_AUX_REARM_TTL_MS;
  return parsed;
}
function captureAuxPublicationBacklog(client, filePath) {
  const counts = client?.getPublicationCountsForPath?.(filePath);
  if (!client || !counts)
    return void 0;
  const notified = new WeakRef(client);
  return {
    unpublished: Math.max(0, counts.sent - counts.published),
    publishedAtMark: counts.published,
    readPublished: () => {
      const live = notified.deref();
      if (!live || live.isAlive?.() === false)
        return void 0;
      return live.getPublicationCountsForPath?.(filePath)?.published;
    }
  };
}
function isAuxBacklogPublished(pair) {
  const backlog = pair.backlog;
  if (!backlog)
    return true;
  const published = backlog.readPublished();
  if (published === void 0)
    return true;
  return published - backlog.publishedAtMark >= backlog.unpublished;
}
function isPendingAuxiliaryPastRearmTtl(pair, nowMs = Date.now()) {
  const anchor = pair.lastRearmedAtMs ?? pair.markedAtMs;
  return nowMs - anchor >= readLateAuxRearmTtlMs();
}
function canRearmPendingAuxiliary(pair, nowMs = Date.now()) {
  return !isPendingAuxiliaryPastRearmTtl(pair, nowMs) && (pair.rearmCount ?? 0) < MAX_LATE_AUX_REARMS;
}
var pending = new BoundedFifoMap(MAX_PENDING_AUX_ENTRIES);
var capEvictedCount = 0;
function pairKey(filePath, serverId) {
  return `${normalizeEphemeralMapKey(filePath)}\0${serverId}`;
}
function markPendingAuxiliaryCoverage(filePath, serverIds, markedAtMs = Date.now(), rearmedAtMs, rearmCount, backlog) {
  for (const serverId of serverIds) {
    const key = pairKey(filePath, serverId);
    const existing = pending.get(key);
    if (existing) {
      pending.delete(key);
      pending.set(key, rearmedAtMs === void 0 ? { filePath, serverId, markedAtMs, ...backlog && { backlog } } : {
        filePath,
        serverId,
        markedAtMs: existing.markedAtMs,
        lastRearmedAtMs: rearmedAtMs,
        rearmCount: rearmCount ?? (existing.rearmCount ?? 0) + 1,
        ...existing.backlog && { backlog: existing.backlog }
      });
      continue;
    }
    const evicted = pending.set(key, rearmedAtMs === void 0 ? { filePath, serverId, markedAtMs, ...backlog && { backlog } } : {
      filePath,
      serverId,
      markedAtMs,
      lastRearmedAtMs: rearmedAtMs,
      rearmCount: rearmCount ?? 1,
      ...backlog && { backlog }
    });
    capEvictedCount += evicted.length;
  }
}
function rearmPendingAuxiliaryCoverage(pair, rearmedAtMs = Date.now()) {
  const nextCount = (pair.rearmCount ?? 0) + 1;
  markPendingAuxiliaryCoverage(pair.filePath, [pair.serverId], pair.markedAtMs, rearmedAtMs, nextCount, pair.backlog);
}
function hasPendingAuxiliaryCoverage(filePath, serverId) {
  return pending.has(pairKey(filePath, serverId));
}
function clearPendingAuxiliaryCoverage(filePath, serverId) {
  pending.delete(pairKey(filePath, serverId));
}
function drainPendingAuxiliaryCoverage() {
  const drained = [...pending.values()];
  pending.clear();
  return drained;
}
function pendingAuxiliaryCoverageSize() {
  return pending.size;
}
function drainPendingAuxCapEvictedCount() {
  const count = capEvictedCount;
  capEvictedCount = 0;
  return count;
}
var MAX_NAPI_COVERAGE_ENTRIES = 50;
var napiFallbackCoverage = new BoundedFifoMap(MAX_NAPI_COVERAGE_ENTRIES);
function recordNapiFallbackCoverage(filePath, atMs = Date.now()) {
  const key = normalizeEphemeralMapKey(filePath);
  napiFallbackCoverage.delete(key);
  napiFallbackCoverage.set(key, atMs);
}
function napiFallbackCoveredSince(filePath, sinceMs) {
  const ts = napiFallbackCoverage.get(normalizeEphemeralMapKey(filePath));
  return ts !== void 0 && ts >= sinceMs;
}
function resetPendingAuxiliaryCoverage() {
  pending.clear();
  capEvictedCount = 0;
  napiFallbackCoverage.clear();
}

// dist/clients/lsp-mutation.js
import * as path11 from "node:path";

// dist/clients/file-mutation-queue.js
import { realpath } from "node:fs/promises";
import { resolve as resolve4 } from "node:path";
var loadHostSdk;
var hostQueue;
var hostSessionManager;
function unavailable(reason) {
  recordDegradationOnce({
    kind: "host-file-mutation-queue-unavailable",
    subject: "withFileMutationQueue",
    reason
  });
  return void 0;
}
function resolved(sdk) {
  if (typeof sdk.withFileMutationQueue !== "function")
    return unavailable("the host SDK exports no withFileMutationQueue");
  const hostCopy = hostSessionManager === void 0 || typeof sdk.SessionManager !== "function" ? void 0 : hostSessionManager instanceof sdk.SessionManager;
  if (hostCopy === false) {
    unavailable("the host SDK import loaded a second copy of the package (the host's session manager is not its SessionManager), so its queue does not order pi's own edits");
  } else {
    logExtension({
      subsystem: "file-mutation-queue",
      level: "debug",
      message: "resolved the host's withFileMutationQueue",
      metadata: { hostCopy: hostCopy ? "verified" : "unverified" }
    });
  }
  return sdk.withFileMutationQueue;
}
function resolveHostQueue(loader) {
  hostQueue ??= loader().then(resolved, (failure) => unavailable(failure instanceof Error ? failure.message : String(failure)));
  return hostQueue;
}
function withHostFileMutationQueue(filePath, fn) {
  const loader = loadHostSdk;
  if (!loader)
    return fn();
  return resolveHostQueue(loader).then((queue) => queue ? queue(resolve4(filePath), fn) : fn());
}
async function withHostFileMutationQueues(filePaths, fn) {
  const keys = await Promise.all(filePaths.map((filePath) => {
    const resolvedPath = resolve4(filePath);
    return realpath(resolvedPath).catch(() => resolvedPath);
  }));
  return [...new Set(keys)].sort(compareOrdinal).reduceRight((inner, key) => () => withHostFileMutationQueue(key, inner), fn)();
}

// dist/clients/fix-run-restore.js
var FIX_RUN_MAX_FILE_BYTES = 1024 * 1024;
var FIX_RUN_HASH_BYTE_BUDGET = 64 * 1024 * 1024;

// dist/clients/observed-mutation.js
import * as path10 from "node:path";

// dist/clients/opaque-mutation-scan.js
var OPAQUE_HASH_BUDGET_BYTES = 8 * 1024 * 1024;
var MAX_GIT_STATUS_OUTPUT_BYTES = 16 * 1024 * 1024;
var OPAQUE_BASELINE_PENDING_CAP = 64;
var OpaqueBaselineStore = class _OpaqueBaselineStore {
  pending = new BoundedFifoMap(OPAQUE_BASELINE_PENDING_CAP);
  static keyOf(slot, callId) {
    return callId === void 0 ? slot : `${slot}#${callId}`;
  }
  /**
   * Store `state` for a call. A baseline this displaces is lost: its
   * `tool_result` will find nothing and report `partial-recognition-no-baseline`,
   * withholding the blocker section of a write the agent authored. That loss is
   * counted in the degradation ledger, one entry per cause with a running count,
   * never one row per occurrence (#4137).
   *
   * First, an entry whose turn is over is retired: pi sends no `tool_result`
   * for a call a `tool_call` handler blocked or Escape aborted before it ran,
   * and on a non-git project the entry holds a whole-tree stat snapshot.
   */
  record(slot, callId, state4, turn) {
    for (const [staleKey, entry] of this.pending.entriesArray())
      if (entry.turn && !entry.turn.isLive(entry.turn.key)) {
        this.pending.delete(staleKey);
        recordBaselineLoss("unsettled");
      }
    const key = _OpaqueBaselineStore.keyOf(slot, callId);
    const overwrote = this.pending.delete(key);
    const evicted = this.pending.set(key, { state: state4, turn });
    if (overwrote)
      recordBaselineLoss("overwrite");
    if (evicted.length > 0)
      recordBaselineLoss("cap");
  }
  take(slot, callId) {
    const key = _OpaqueBaselineStore.keyOf(slot, callId);
    const entry = this.pending.get(key);
    this.pending.delete(key);
    return entry?.state;
  }
  /** Session-boundary clear - unconsumed baselines are unreachable after reset. */
  takeAllForTest() {
    this.pending.clear();
  }
};
var BASELINE_LOSS_REASONS = {
  overwrite: "a pending bash baseline was replaced before its tool_result took it; that call reports partial-recognition-no-baseline and withholds blockers (host without distinct tool-call ids, or a reused id)",
  cap: `more than ${OPAQUE_BASELINE_PENDING_CAP} bash baselines awaited a tool_result; the oldest was dropped`,
  unsettled: "a bash baseline outlived its turn with no tool_result (the call was blocked or aborted before it ran) and was retired; a result that still arrives reports partial-recognition-no-baseline"
};
function recordBaselineLoss(cause) {
  incrementDegradationCount({
    kind: "opaque-baseline-lost",
    subject: cause,
    reason: BASELINE_LOSS_REASONS[cause]
  });
}
var globalStoreSymbol = /* @__PURE__ */ Symbol.for("pi-lens:opaque-snapshot-store");
var globalSlot = globalThis;
function getOpaqueBaselineStore() {
  const existing = globalSlot[globalStoreSymbol]?.store;
  if (existing)
    return existing;
  const created = new OpaqueBaselineStore();
  globalSlot[globalStoreSymbol] = { store: created };
  return created;
}
var gitRepoMemo = /* @__PURE__ */ new Map();
function resetOpaqueMutationState() {
  getOpaqueBaselineStore().takeAllForTest();
  gitRepoMemo.clear();
  gitToplevelMemo.clear();
}
var gitToplevelMemo = /* @__PURE__ */ new Map();

// dist/clients/observed-mutation.js
var OBSERVED_HANDLED_MAX = 1e3;
var OBSERVED_HASH_BUDGET_BYTES = 2 * 1024 * 1024;
var OBSERVED_SWEEP_HASH_BUDGET_BYTES = 2 * 1024 * 1024;
var OBSERVED_SWEEP_RANGE_BUDGET_BYTES = 1024 * 1024;
var OBSERVED_LINE_HASH_MAX_BYTES = 512 * 1024;
var OBSERVED_PENDING_MAX = 32;
var OBSERVED_LEDGER_MAX = 1e3;
var OBSERVED_FAMILY = "observed-mutation-net";
var OBSERVED_VERSION = 4;
function state2() {
  return getProcessSingleton(OBSERVED_FAMILY, OBSERVED_VERSION, () => ({
    pending: new BoundedFifoMap(OBSERVED_PENDING_MAX),
    ledger: new BoundedFifoMap(OBSERVED_LEDGER_MAX),
    handled: new BoundedSet(OBSERVED_HANDLED_MAX),
    turnIndex: -1,
    turnSpentMs: 0,
    parkedSpendMs: /* @__PURE__ */ new Map(),
    sweepCursor: 0
  }));
}
function resetObservedMutationNet() {
  const current = state2();
  current.pending.clear();
  current.ledger.clear();
  current.handled.clear();
  current.turnIndex = -1;
  current.turnSpentMs = 0;
  current.parkedSpendMs.clear();
  current.sweepCursor = 0;
}
function noteMutationHandled(filePath) {
  try {
    const handled = state2().handled;
    const key = normalizeMapKey(path10.resolve(filePath));
    const evicted = handled.add(key);
    for (const oldest of evicted) {
      emitBounded(
        "observed_handled_evicted",
        // Identity is the DROPPED PATH, not a constant label: the ledger
        // entry is keyed by subject and survives the per-turn cap on the
        // detailed record, so it is what still names WHICH file lost its
        // mark after a turn that overflowed the set many times.
        oldest,
        {
          filePath: oldest,
          durationMs: 0,
          result: `cap:${OBSERVED_HANDLED_MAX}`
        },
        {
          ledgerKind: "observed-mutation-budget",
          reason: `the handled set is full at ${OBSERVED_HANDLED_MAX}; the oldest pi-lens-authored file lost its mark, so its next drift is reported as third-party`,
          capPerTurn: { limit: 2, turnIndex: state2().turnIndex }
        }
      );
    }
  } catch {
  }
}

// dist/clients/process-bridge.js
function getProcessBridge(key, version) {
  const bridge = globalThis[key];
  if (!bridge || typeof bridge !== "object")
    return void 0;
  const candidate = bridge;
  if (candidate.version !== version)
    return void 0;
  return candidate;
}

// dist/clients/format-events-publish.js
var liveEmitter3 = createLiveBusEmitter();

// dist/clients/mutation-bridge.js
var MUTATION_BRIDGE_KEY = /* @__PURE__ */ Symbol.for("pi-lens:mutation-bridge");
function getMutationBridge() {
  const candidate = getProcessBridge(MUTATION_BRIDGE_KEY, 1);
  return typeof candidate?.recordMutation === "function" ? candidate : void 0;
}

// dist/clients/lsp-mutation.js
var noBridgeDbgLogged = false;
function resetLspMutationNoBridgeDbgLatch() {
  noBridgeDbgLogged = false;
}
var MAX_SAMPLES = 100;
var MAX_SUMMARIES_PER_CONTEXT = 100;
function newLspMutationCorrelationId(toolCallId) {
  return getReadGuardCorrelationId(toolCallId ? { toolCallId } : {});
}
function allResults(options) {
  return options.results ?? [];
}
function combineResults(results) {
  const files2 = /* @__PURE__ */ new Set();
  const fileDetails = [];
  const appliedIndexes = [];
  const paths = [];
  let requestedTotal = 0;
  let appliedTotal = 0;
  let textEdits = 0;
  let create = 0;
  let rename = 0;
  let deleteCount = 0;
  for (const result of results) {
    requestedTotal += result.operationTotal;
    appliedTotal += result.appliedOperationTotal;
    textEdits += result.operationCounts.textEdits;
    create += result.operationCounts.create;
    rename += result.operationCounts.rename;
    deleteCount += result.operationCounts.delete;
    for (const index of result.appliedOperationIndexes)
      appliedIndexes.push(index);
    for (const file of result.files) {
      if (!files2.has(file)) {
        files2.add(file);
        paths.push(file);
      }
    }
    fileDetails.push(...result.fileDetails);
  }
  return {
    requestedTotal,
    appliedTotal,
    appliedIndexes,
    files: [...files2],
    fileDetails,
    textEdits,
    create,
    rename,
    delete: deleteCount,
    paths
  };
}
function uniqueDetails(files2, fileDetails) {
  const byPath = /* @__PURE__ */ new Map();
  const keyMemo = /* @__PURE__ */ new Map();
  const keyFor = (filePath) => {
    let key = keyMemo.get(filePath);
    if (key === void 0) {
      key = normalizeMapKey(path11.resolve(filePath));
      keyMemo.set(filePath, key);
    }
    return key;
  };
  for (const detail of fileDetails) {
    const key = keyFor(detail.filePath);
    const previous = byPath.get(key);
    if (!previous) {
      byPath.set(key, {
        ...detail,
        ranges: detail.ranges ?? (detail.range ? [detail.range] : void 0)
      });
      continue;
    }
    byPath.set(key, {
      filePath: previous.filePath,
      range: previous.range && detail.range ? {
        start: Math.min(previous.range.start, detail.range.start),
        end: Math.max(previous.range.end, detail.range.end)
      } : previous.range ?? detail.range,
      ranges: [
        ...previous.ranges ?? (previous.range ? [previous.range] : []),
        ...detail.ranges ?? (detail.range ? [detail.range] : [])
      ],
      authorshipUnknown: previous.authorshipUnknown === true || detail.authorshipUnknown === true,
      importsChanged: previous.importsChanged || detail.importsChanged
    });
  }
  return files2.map((filePath) => byPath.get(keyFor(filePath)) ?? {
    filePath,
    // Resource operations have no already-computed text range. A small
    // range is still enough to invalidate the touched-file turn state;
    // never synchronously re-read the whole file here.
    range: { start: 1, end: 1 },
    authorshipUnknown: true,
    importsChanged: true
  });
}
function bookkeepLspMutation(context, files2, fileDetails) {
  const details = uniqueDetails(files2, fileDetails);
  const useBridgeFallback = !context.runtime || !context.cacheManager;
  for (const detail of details) {
    const filePath = path11.resolve(detail.filePath);
    const sessionLive = !context.session || context.session.guardedWrite(filePath, () => true) !== void 0;
    if (context.isRecordable && !context.isRecordable(filePath)) {
      context.dbg?.(`lsp mutation not recordable, skipping ${filePath}`);
      continue;
    }
    if (sessionLive && context.readGuard) {
      try {
        context.readGuard.recordWritten(filePath, {
          stampFileTime: false,
          advanceAuthorship: true,
          ...detail.authorshipUnknown !== true && detail.ranges !== void 0 && {
            authorship: "partial",
            authoredRanges: detail.ranges.map(({ start, end }) => [start, end])
          },
          ...detail.authorshipUnknown === true && { authorship: "unknown" },
          ...context.toolCallId !== void 0 && {
            toolCallId: context.toolCallId
          }
        });
      } catch (err) {
        context.dbg?.(`lsp mutation read-guard stamp failed for ${filePath}: ${err}`);
      }
    }
    if (useBridgeFallback) {
      const bridge = getMutationBridge();
      if (!bridge) {
        recordDegradationOnce({
          kind: "lsp-mutation-bridge-unmounted",
          subject: "lsp-mutation:no-bridge",
          reason: "workspace/applyEdit bookkeeping fell back to the mutation bridge, but no bridge is mounted in this process (e.g. the MCP server, which never runs pi's extension activation) \u2014 the write is unrecorded (no read-guard stamp, no turn-state entry, no change-log receipt)."
        });
        if (!noBridgeDbgLogged) {
          noBridgeDbgLogged = true;
          context.dbg?.(`lsp mutation bridge unavailable, dropping bookkeeping for ${filePath}`);
        }
      } else {
        try {
          const editRanges = detail.ranges && detail.authorshipUnknown !== true ? detail.ranges.map(({ start, end }) => [start, end]) : detail.range && detail.authorshipUnknown !== true ? [[detail.range.start, detail.range.end]] : void 0;
          const recorded = bridge.recordMutation({
            filePath,
            kind: "edit",
            ...detail.range !== void 0 && {
              touchedLines: [detail.range.start, detail.range.end]
            },
            ...detail.authorshipUnknown === true && {
              authorshipUnknown: true
            },
            ...editRanges !== void 0 ? { editRanges } : {},
            ...context.sessionId !== void 0 && {
              sessionId: context.sessionId
            },
            consumer: context.tool,
            provenance: "observed",
            // Real value threaded through, not the bridge's own
            // historical `false` default (#2450 review round 2, F1) —
            // the tsserver organize-imports/add-import case is exactly
            // the import-changing one.
            importsChanged: detail.importsChanged ?? true,
            // Equivalence with the direct branch below, which never
            // enqueues a deferred autofix/format pass for an LSP-applied
            // edit (#2450 review round 2, F3).
            deferAutofix: false,
            ...context.session && { lineage: context.session },
            // #4187 R4-1: the same license the direct branch threads, so
            // the two branches stay equivalent for the same write.
            ...context.toolCallId !== void 0 && {
              toolCallId: context.toolCallId
            }
          });
          if (!recorded) {
            context.dbg?.(`lsp mutation bridge dropped ${filePath} (recordMutation() returned false \u2014 see the mutation_bridge debug output for the reason: malformed entry, out-of-scope path, or a bookkeeping error)`);
          }
        } catch (err) {
          context.dbg?.(`lsp mutation bridge fallback failed for ${filePath}: ${err}`);
        }
      }
    } else {
      const runtime = context.runtime;
      runtime?.recordProjectMutation?.({
        filePath,
        source: context.source,
        cwd: context.cwd,
        changedRange: detail.range,
        onAppendError: (err) => context.dbg?.(`lsp mutation project change append failed for ${filePath}: ${err}`)
      });
      if (sessionLive && context.cacheManager) {
        try {
          context.cacheManager.addModifiedRange(
            filePath,
            detail.range ?? { start: 1, end: 1 },
            detail.importsChanged ?? true,
            context.cwd,
            context.sessionId ?? runtime?.telemetrySessionId,
            void 0,
            // #2504 review round 2 (F1). #2504 added a containment
            // filter to `addModifiedRange` and gave it `cwd` as the
            // project root. On THIS path `cwd` is the calling
            // directory, which `tools/lsp-navigation.ts` scopes to a
            // sub-package while the LSP client's root spans the whole
            // monorepo — so a server-initiated edit on a sibling
            // package (#2450) and every edit whose context carries a
            // separate bookkeeping cwd (#2479) were silently dropped
            // from the worklist. Same root the `isRecordable` gate a
            // few frames up already uses: `runtime.projectRoot`,
            // falling back to `cwd` when no runtime is threaded.
            runtime?.projectRoot ?? context.cwd
          );
        } catch (err) {
          context.dbg?.(`lsp mutation modified-range tracking failed for ${filePath}: ${err}`);
        }
      }
      noteMutationHandled(filePath);
    }
    if (sessionLive && context.recordAutofix && context.source === "autofix") {
      const key = normalizeMapKey(filePath);
      const seen = context.autofixRecordedPaths ?? new BoundedSet(MAX_SAMPLES);
      context.autofixRecordedPaths = seen;
      if (!seen.has(key)) {
        seen.add(key);
        context.recordAutofix(filePath);
      }
    }
  }
  if (context.publishFilesTouched && files2.length > 0) {
    context.publishFilesTouched(files2);
  }
}
function telemetryFor(context, options) {
  const combined = combineResults(allResults(options));
  const requestedTotal = options.requestedTotal ?? combined.requestedTotal;
  const appliedTotal = combined.appliedTotal;
  const requestedIndexes = Array.from({ length: Math.min(requestedTotal, MAX_SAMPLES) }, (_, index) => index);
  const rejectedTotal = Math.max(0, requestedTotal - appliedTotal);
  const rejectedReasons = Array.from({ length: Math.min(rejectedTotal, MAX_SAMPLES) }, (_, index) => ({ index, code: "write_failed" }));
  const status = options.status ?? (appliedTotal > 0 ? "success" : "skipped");
  const editBatchSummary = createReadGuardEditBatchSummary({
    requestedIndexes,
    requestedTotal,
    resolvedIndexes: requestedIndexes,
    resolvedTotal: requestedTotal,
    rejectedReasons,
    rejectedTotal,
    appliedIndexes: combined.appliedIndexes,
    appliedTotal,
    participantIds: [context.correlationId],
    participantTotal: 1,
    commitStatus: status === "failed" ? "failed" : appliedTotal > 0 ? "committed" : "no_changes",
    terminalStatus: status
  });
  return {
    editBatchSummary,
    operationCounts: {
      requested: requestedTotal,
      applied: appliedTotal,
      textEdits: combined.textEdits,
      create: combined.create,
      rename: combined.rename,
      delete: combined.delete
    },
    sampledPaths: combined.paths.slice(0, MAX_SAMPLES),
    sampledPathsTotal: combined.paths.length,
    sampledPathsTruncated: combined.paths.length > MAX_SAMPLES,
    considered: options.considered,
    completed: options.completed,
    failedCount: options.failedCount
  };
}
function recordLspMutation(context, options = {}) {
  const results = allResults(options);
  const combined = combineResults(results);
  if (options.bookkeep !== false && combined.files.length > 0) {
    bookkeepLspMutation(context, combined.files, combined.fileDetails);
  }
  const telemetry = telemetryFor(context, options);
  if (context.emitSummary !== false) {
    const summaryCount = context.summaryCount ?? 0;
    context.summaryEmitted = true;
    if (summaryCount < MAX_SUMMARIES_PER_CONTEXT) {
      context.summaryCount = summaryCount + 1;
      logReadGuardEvent({
        event: "edit_batch_summary",
        correlationId: context.correlationId,
        filePath: combined.files[0] ?? context.cwd,
        metadata: {
          tool: context.tool,
          source: context.source,
          outcome: telemetry.editBatchSummary.terminalStatus,
          // The outer correlation identifies the soliciting tool call; the
          // bounded sequence distinguishes multiple applyEdit requests within it.
          summaryIndex: summaryCount,
          editBatchSummary: telemetry.editBatchSummary,
          operationCounts: telemetry.operationCounts,
          sampledPaths: telemetry.sampledPaths,
          sampledPathsTotal: telemetry.sampledPathsTotal,
          sampledPathsTruncated: telemetry.sampledPathsTruncated,
          considered: telemetry.considered,
          completed: telemetry.completed,
          failedCount: telemetry.failedCount
        }
      });
    } else if (!context.summaryOverflowed) {
      context.summaryOverflowed = true;
      logReadGuardEvent({
        event: "edit_batch_summary_overflow",
        correlationId: context.correlationId,
        filePath: combined.files[0] ?? context.cwd,
        metadata: {
          tool: context.tool,
          source: context.source,
          summaryLimit: MAX_SUMMARIES_PER_CONTEXT,
          suppressedSummaries: "one or more"
        }
      });
    }
  }
  return telemetry;
}
function recordLspMutationOutcome(context, status) {
  return recordLspMutation(context, { status, requestedTotal: 0 });
}

// dist/clients/lsp/client.js
import { spawn as nodeSpawn } from "node:child_process";
import { EventEmitter } from "node:events";
import { access, lstat, readFile } from "node:fs/promises";
import * as os2 from "node:os";
import { pathToFileURL as pathToFileURL2 } from "node:url";

// dist/clients/deps/vscode-jsonrpc.js
var import_node = __toESM(require_main(), 1);

// dist/clients/lsp/workspace-diagnostics-session.js
var _sessionStartedAt = Date.now();
function resetWorkspaceDiagnosticsCacheSession(startedAt = Date.now()) {
  _sessionStartedAt = startedAt;
}
function workspaceDiagnosticsCacheSessionStart() {
  return _sessionStartedAt;
}

// dist/clients/lsp/aggregation.js
async function raceToCompletion(promises4, shouldComplete, options = { timeoutMs: 1500 }) {
  const results = [];
  results.length = promises4.length;
  results.fill(void 0);
  let graceTimer;
  let auxGraceTimer;
  let completed = false;
  let remaining = promises4.length;
  const descriptors = options.descriptors ?? [];
  const hasAuxiliaries = descriptors.some((d) => isAuxiliary(d));
  const auxIndices = hasAuxiliaries ? new Set(descriptors.map((d, i) => isAuxiliary(d) ? i : -1).filter((i) => i >= 0)) : /* @__PURE__ */ new Set();
  const languageCount = promises4.length - auxIndices.size;
  let languageRemaining = languageCount;
  let auxGraceStarted = false;
  return new Promise((resolve9) => {
    const timeout = setTimeout(() => {
      completed = true;
      if (graceTimer)
        clearTimeout(graceTimer);
      if (auxGraceTimer)
        clearTimeout(auxGraceTimer);
      resolve9(results.filter((r) => r !== void 0));
    }, options.timeoutMs);
    const finalize = () => {
      if (completed)
        return;
      completed = true;
      clearTimeout(timeout);
      if (graceTimer)
        clearTimeout(graceTimer);
      if (auxGraceTimer)
        clearTimeout(auxGraceTimer);
      resolve9(results.filter((r) => r !== void 0));
    };
    const startAuxGrace = () => {
      if (auxGraceStarted || completed)
        return;
      auxGraceStarted = true;
      const ceilingMs = options.auxGraceMs ?? 500;
      const pendingAuxBudgets = [...auxIndices].filter((i) => results[i] === void 0).map((i) => descriptors[i]?.budgetMs).filter((b) => typeof b === "number" && b >= 0);
      const graceMs = pendingAuxBudgets.length > 0 ? Math.min(ceilingMs, Math.max(...pendingAuxBudgets)) : ceilingMs;
      if (graceMs <= 0) {
        finalize();
        return;
      }
      auxGraceTimer = setTimeout(() => finalize(), graceMs);
    };
    const check = () => {
      if (completed)
        return;
      if (remaining === 0) {
        finalize();
        return;
      }
      if (hasAuxiliaries && languageRemaining === 0 && !auxGraceStarted) {
        startAuxGrace();
      }
      const collected = results.filter((r) => r !== void 0);
      if (shouldComplete(collected)) {
        if (options.graceMs !== void 0 && options.graceMs > 0 && !graceTimer) {
          graceTimer = setTimeout(() => finalize(), options.graceMs);
        } else if (auxGraceStarted) {
        } else if (!hasAuxiliaries || languageRemaining === 0) {
          finalize();
        }
      }
    };
    for (let i = 0; i < promises4.length; i++) {
      const index = i;
      const isAux = auxIndices.has(index);
      promises4[i].then((result) => {
        if (!completed) {
          results[index] = result;
          remaining--;
          if (!isAux)
            languageRemaining--;
          check();
        }
      }).catch(() => {
        if (!completed) {
          remaining--;
          if (!isAux)
            languageRemaining--;
          check();
        }
      });
    }
  });
}

// dist/clients/lsp/edits.js
import fs11 from "node:fs/promises";
import path12 from "node:path";
import { URL as URL2 } from "node:url";

// dist/clients/lsp/position-encoding.js
var ADVERTISED_POSITION_ENCODINGS = [
  "utf-16",
  "utf-8"
];
function negotiatePositionEncoding(serverCapabilities) {
  const raw = serverCapabilities?.positionEncoding;
  if (raw === "utf-8" || raw === "utf-16" || raw === "utf-32")
    return raw;
  return "utf-16";
}
function convertCharacterOffset(encoding, lineText, utf16Character) {
  if (encoding === "utf-16")
    return utf16Character;
  if (utf16Character <= 0)
    return 0;
  const clamped = Math.min(utf16Character, lineText.length);
  const prefix = lineText.slice(0, clamped);
  if (encoding === "utf-8")
    return Buffer.byteLength(prefix, "utf8");
  return [...prefix].length;
}
function lineTextAt(content, line) {
  if (line < 0)
    return "";
  const lines = content.split("\n");
  return lines[line] ?? "";
}

// dist/clients/host-edit-normalize.js
var HOST_SMART_SINGLE_QUOTES = [8216, 8217, 8218, 8219];
var HOST_SMART_DOUBLE_QUOTES = [8220, 8221, 8222, 8223];
var HOST_UNICODE_DASHES = [
  8208,
  8209,
  8210,
  8211,
  8212,
  8213,
  8722
];
var HOST_SPECIAL_SPACES = [
  160,
  8194,
  8195,
  8196,
  8197,
  8198,
  8199,
  8200,
  8201,
  8202,
  8239,
  8287,
  12288
];
var HOST_BOM_CODE_POINT = 65279;
var charClass = (codePoints) => new RegExp(`[${String.fromCharCode(...codePoints)}]`, "g");
var SMART_SINGLE_QUOTES_RE = charClass(HOST_SMART_SINGLE_QUOTES);
var SMART_DOUBLE_QUOTES_RE = charClass(HOST_SMART_DOUBLE_QUOTES);
var UNICODE_DASHES_RE = charClass(HOST_UNICODE_DASHES);
var SPECIAL_SPACES_RE = charClass(HOST_SPECIAL_SPACES);
var BOM = String.fromCharCode(HOST_BOM_CODE_POINT);
function detectLineEnding(content) {
  const crlfIdx = content.indexOf("\r\n");
  const lfIdx = content.indexOf("\n");
  if (lfIdx === -1)
    return "\n";
  if (crlfIdx === -1)
    return "\n";
  return crlfIdx < lfIdx ? "\r\n" : "\n";
}
function normalizeToLF(text) {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}
function restoreLineEndings(text, ending) {
  return ending === "\r\n" ? text.replace(/\n/g, "\r\n") : text;
}

// dist/clients/lsp/edits.js
var StaleWorkspaceEditContentError = class extends Error {
};
function refuseStaleWorkspaceEdit(filePath, why) {
  incrementDegradationCount({
    kind: "lsp-edit-stale-content",
    subject: filePath,
    reason: `${why}; the edit was not applied`
  });
  throw new StaleWorkspaceEditContentError(`stale text document content for ${filePath}: ${why}`);
}
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isPosition(value) {
  return isRecord(value) && Number.isFinite(value.line) && Number.isInteger(value.line) && value.line >= 0 && Number.isFinite(value.character) && Number.isInteger(value.character) && value.character >= 0;
}
function comparePosition(a, b) {
  return a.line === b.line ? a.character - b.character : a.line - b.line;
}
function isRange(value) {
  if (!isRecord(value) || !isPosition(value.start) || !isPosition(value.end)) {
    return false;
  }
  return comparePosition(value.start, value.end) <= 0;
}
function isTextEdit(value) {
  return isRecord(value) && isRange(value.range) && typeof value.newText === "string";
}
function parseTextEdits(value, context) {
  if (!Array.isArray(value))
    throw new Error(`${context}.edits must be an array`);
  if (!value.every(isTextEdit))
    throw new Error(`malformed text edit in ${context}`);
  return value;
}
function parseVersion(value, context) {
  if (value === void 0 || value === null)
    return value;
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    throw new Error(`${context}.version must be a nonnegative integer or null`);
  }
  return value;
}
function parseResourceOptions(value, kind) {
  if (value === void 0)
    return void 0;
  if (!isRecord(value))
    throw new Error(`${kind}.options must be an object`);
  const allowed = new Set(kind === "delete" ? ["ignoreIfNotExists", "recursive"] : ["overwrite", "ignoreIfExists"]);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key) || typeof value[key] !== "boolean") {
      throw new Error(`invalid ${kind}.options.${key}`);
    }
  }
  if (value.overwrite === true && value.ignoreIfExists === true) {
    throw new Error(`${kind} cannot set both overwrite and ignoreIfExists`);
  }
  if (kind !== "delete" && value.ignoreIfNotExists !== void 0) {
    throw new Error(`${kind} does not support ignoreIfNotExists`);
  }
  if (kind === "delete" && value.overwrite !== void 0) {
    throw new Error(`delete does not support overwrite`);
  }
  return value;
}
function parseTextDocumentEdit(value, context) {
  if (!isRecord(value) || !isRecord(value.textDocument))
    return null;
  if (typeof value.textDocument.uri !== "string") {
    throw new Error(`${context}.textDocument.uri must be a string`);
  }
  const version = parseVersion(value.textDocument.version, `${context}.textDocument`);
  return {
    textDocument: { uri: value.textDocument.uri, version },
    edits: parseTextEdits(value.edits, context)
  };
}
function parseWorkspaceEdit(edit) {
  if (!isRecord(edit))
    throw new Error("workspace edit must be an object");
  if (edit.changes !== void 0) {
    if (!isRecord(edit.changes))
      throw new Error("workspace edit changes must be an object");
    for (const [uri, edits] of Object.entries(edit.changes)) {
      if (typeof uri !== "string")
        throw new Error("workspace edit URI must be a string");
      parseTextEdits(edits, `changes[${uri}]`);
    }
  }
  if (edit.documentChanges !== void 0 && !Array.isArray(edit.documentChanges)) {
    throw new Error("workspace edit documentChanges must be an array");
  }
  for (const [index, change] of (edit.documentChanges ?? []).entries()) {
    const text = parseTextDocumentEdit(change, `documentChanges[${index}]`);
    if (text)
      continue;
    if (!isRecord(change) || typeof change.kind !== "string") {
      throw new Error(`malformed documentChanges[${index}]`);
    }
    switch (change.kind) {
      case "create":
        if (typeof change.uri !== "string")
          throw new Error("create.uri must be a string");
        parseResourceOptions(change.options, "create");
        break;
      case "rename":
        if (typeof change.oldUri !== "string" || typeof change.newUri !== "string") {
          throw new Error("rename requires oldUri and newUri strings");
        }
        parseResourceOptions(change.options, "rename");
        break;
      case "delete":
        if (typeof change.uri !== "string")
          throw new Error("delete.uri must be a string");
        parseResourceOptions(change.options, "delete");
        break;
      default:
        throw new Error(`unsupported workspace resource operation: ${change.kind}`);
    }
  }
}
function formatRange(range) {
  return `${range.start.line + 1}:${range.start.character + 1}-${range.end.line + 1}:${range.end.character + 1}`;
}
function rangesOverlap(a, b) {
  return comparePosition(a.start, b.end) < 0 && comparePosition(b.start, a.end) < 0;
}
function positionsEqual(a, b) {
  return a.line === b.line && a.character === b.character;
}
function isEmptyRange(range) {
  return positionsEqual(range.start, range.end);
}
function sortEditsForApplication(edits) {
  return edits.map((edit, index) => ({ edit, index })).sort((a, b) => {
    const startDelta = comparePosition(b.edit.range.start, a.edit.range.start);
    if (startDelta !== 0)
      return startDelta;
    const endDelta = comparePosition(b.edit.range.end, a.edit.range.end);
    if (endDelta !== 0)
      return endDelta;
    return b.index - a.index;
  }).map(({ edit }) => edit);
}
function validateTextEdits(edits) {
  const unique = [];
  const seen = /* @__PURE__ */ new Set();
  for (const edit of edits) {
    if (!isEmptyRange(edit.range)) {
      const key = textEditKey("", edit);
      if (seen.has(key))
        continue;
      seen.add(key);
    }
    unique.push(edit);
  }
  const ordered = sortEditsForApplication(unique);
  for (let index = 0; index < ordered.length - 1; index++) {
    const later = ordered[index]?.range;
    const earlier = ordered[index + 1]?.range;
    if (later && earlier && comparePosition(earlier.end, later.start) > 0) {
      throw new Error(`overlapping LSP edits: ${formatRange(earlier)} conflicts with ${formatRange(later)}`);
    }
  }
  return unique;
}
function utf16Position(content, position, encoding) {
  const line = lineTextAt(content, position.line);
  const wireLength = convertCharacterOffset(encoding, line, line.length);
  const hasTrailingCR = line.endsWith("\r");
  const clampedLength = hasTrailingCR ? line.length - 1 : line.length;
  const clampedWireLength = hasTrailingCR ? wireLength - 1 : wireLength;
  if (position.character > clampedWireLength) {
    return { line: position.line, character: clampedLength };
  }
  if (encoding === "utf-16")
    return position;
  for (let offset = 0; offset <= line.length; offset++) {
    if (encoding === "utf-32" && offset > 0 && offset < line.length) {
      const previous = line.charCodeAt(offset - 1);
      const current = line.charCodeAt(offset);
      if (previous >= 55296 && previous <= 56319 && current >= 56320 && current <= 57343)
        continue;
    }
    if (convertCharacterOffset(encoding, line, offset) === position.character) {
      return { line: position.line, character: offset };
    }
  }
  throw new Error(`text edit character ${position.character} is not a ${encoding} boundary`);
}
function normalizeTextEditsForContent(content, edits, encoding) {
  const lines = content.split("\n");
  const lastLine = Math.max(0, lines.length - 1);
  const ending = detectLineEnding(content);
  const clamp = (position) => {
    if (position.line >= lines.length) {
      return { line: lastLine, character: (lines[lastLine] ?? "").length };
    }
    return utf16Position(content, position, encoding);
  };
  const converted = edits.map((edit) => {
    const start = clamp(edit.range.start);
    const end = clamp(edit.range.end);
    if (comparePosition(start, end) > 0)
      throw new Error("text edit range is out of order");
    return {
      ...edit,
      range: { start, end },
      newText: restoreLineEndings(normalizeToLF(edit.newText), ending)
    };
  });
  return validateTextEdits(converted);
}
function applyTextEditsToString(content, edits, positionEncoding = "utf-16") {
  const lines = content.split("\n");
  const normalized = sortEditsForApplication(normalizeTextEditsForContent(content, edits, positionEncoding));
  for (const edit of normalized) {
    const { start, end } = edit.range;
    if (start.line === end.line) {
      const line = lines[start.line] ?? "";
      lines[start.line] = line.slice(0, start.character) + edit.newText + line.slice(end.character);
      continue;
    }
    const startLine = lines[start.line] ?? "";
    const endLine = lines[end.line] ?? "";
    const replacement = startLine.slice(0, start.character) + edit.newText + endLine.slice(end.character);
    lines.splice(start.line, end.line - start.line + 1, ...replacement.split("\n"));
  }
  return lines.join("\n");
}
async function normalizeWorkspaceEditToUtf16(edit, positionEncoding, cwd) {
  parseWorkspaceEdit(edit);
  if (positionEncoding === "utf-16")
    return edit;
  const planned = planWorkspaceEdit(edit, true);
  const prepared = await preflightWorkspaceEdit(planned, cwd, {
    positionEncoding
  });
  const normalizedByOrigin = /* @__PURE__ */ new Map();
  for (const op of planned) {
    if (op.kind !== "text")
      continue;
    for (const origin of op.origins ?? []) {
      normalizedByOrigin.set(textEditOriginKey(origin), prepared.textByOrigin.get(textEditOriginKey(origin)) ?? []);
    }
  }
  const changes = {};
  for (const uri of Object.keys(edit.changes ?? {})) {
    changes[uri] = normalizedByOrigin.get(textEditOriginKey({ kind: "changes", uri, edits: [] })) ?? [];
  }
  const documentChanges = [];
  for (const [index, change] of (edit.documentChanges ?? []).entries()) {
    const text = parseTextDocumentEdit(change, `documentChanges[${index}]`);
    if (!text) {
      documentChanges.push(change);
      continue;
    }
    documentChanges.push({
      ...change,
      edits: normalizedByOrigin.get(textEditOriginKey({ kind: "documentChanges", index, edits: [] })) ?? []
    });
  }
  return {
    ...edit.changes !== void 0 ? { changes } : {},
    ...edit.documentChanges !== void 0 ? { documentChanges } : {}
  };
}
function flattenWorkspaceTextEdits(edit) {
  parseWorkspaceEdit(edit);
  const buckets = /* @__PURE__ */ new Map();
  const push = (uri, edits) => {
    const textEdits = parseTextEdits(edits, uri);
    if (textEdits.length === 0)
      return;
    const key = pathIndexKey(uri);
    const existing = buckets.get(key);
    if (existing)
      existing.edits.push(...textEdits);
    else
      buckets.set(key, { uri, edits: [...textEdits] });
  };
  for (const [uri, edits] of Object.entries(edit.changes ?? {}))
    push(uri, edits);
  for (const change of edit.documentChanges ?? []) {
    const text = parseTextDocumentEdit(change, "documentChanges");
    if (text)
      push(text.textDocument.uri, text.edits);
  }
  return new Map([...buckets.values()].map(({ uri, edits }) => [uri, edits]));
}
function textEditKey(uri, edit) {
  return [
    pathIndexKey(uri),
    edit.range.start.line,
    edit.range.start.character,
    edit.range.end.line,
    edit.range.end.character,
    edit.newText
  ].join(":");
}
function mergeWorkspaceTextEditsByPriority(entries) {
  const merged = /* @__PURE__ */ new Map();
  const seenExact = /* @__PURE__ */ new Set();
  let droppedConflicts = 0;
  let inputEditCount = 0;
  const serverIds = [];
  for (const entry of entries) {
    serverIds.push(entry.serverId);
    if (!entry.edit)
      continue;
    for (const [uri, edits] of flattenWorkspaceTextEdits(entry.edit)) {
      const key = pathIndexKey(uri);
      const bucket = merged.get(key) ?? { uri, edits: [] };
      const kept = bucket.edits;
      for (const edit of edits) {
        inputEditCount += 1;
        const exactKey = isEmptyRange(edit.range) ? void 0 : textEditKey(uri, edit);
        if (exactKey !== void 0 && seenExact.has(exactKey))
          continue;
        if (kept.some((existing) => rangesOverlap(existing.range, edit.range))) {
          droppedConflicts += 1;
          continue;
        }
        if (exactKey !== void 0)
          seenExact.add(exactKey);
        kept.push(edit);
      }
      if (kept.length > 0)
        merged.set(key, bucket);
    }
  }
  const changes = {};
  for (const { uri, edits } of merged.values())
    changes[uri] = edits;
  return { edit: { changes }, droppedConflicts, inputEditCount, serverIds };
}
function pathIndexKey(uri) {
  return normalizeEphemeralMapKey(uriToPath(uri));
}
function textEditOriginKey(origin) {
  return origin.kind === "changes" ? `changes:${origin.uri}` : `documentChanges:${origin.index}`;
}
function parseResource(change) {
  const kind = change.kind;
  if (kind === "create")
    return {
      kind,
      uri: change.uri,
      options: parseResourceOptions(change.options, kind)
    };
  if (kind === "rename")
    return {
      kind,
      oldUri: change.oldUri,
      newUri: change.newUri,
      options: parseResourceOptions(change.options, kind)
    };
  if (kind === "delete")
    return {
      kind,
      uri: change.uri,
      options: parseResourceOptions(change.options, kind)
    };
  throw new Error(`unsupported workspace resource operation: ${String(kind)}`);
}
function plannedDiskPaths(planned) {
  return planned.flatMap((op) => op.kind === "rename" ? [uriToDiskPath(op.oldUri), uriToDiskPath(op.newUri)] : [uriToDiskPath(op.uri)]);
}
function workspaceEditTextPaths(edit) {
  return planWorkspaceEdit(edit).flatMap((op) => op.kind === "text" ? [uriToDiskPath(op.uri)] : []);
}
function planWorkspaceEdit(edit, trackOrigins = false) {
  parseWorkspaceEdit(edit);
  const ops = [];
  const pending2 = /* @__PURE__ */ new Map();
  const descendants = /* @__PURE__ */ new Map();
  const indexedAncestors = /* @__PURE__ */ new Map();
  const seenResources = /* @__PURE__ */ new Set();
  const pathKeys = /* @__PURE__ */ new Map();
  const indexKey = (uri) => {
    const cached = pathKeys.get(uri);
    if (cached !== void 0)
      return cached;
    const key = pathIndexKey(uri);
    pathKeys.set(uri, key);
    return key;
  };
  const addIndex = (key) => {
    const ancestors = [];
    let current = key;
    while (true) {
      const set = descendants.get(current) ?? /* @__PURE__ */ new Set();
      set.add(key);
      descendants.set(current, set);
      ancestors.push(current);
      const parent = path12.dirname(current);
      if (parent === current)
        break;
      current = parent;
    }
    indexedAncestors.set(key, ancestors);
  };
  const removeIndex = (key) => {
    for (const ancestor of indexedAncestors.get(key) ?? [])
      descendants.get(ancestor)?.delete(key);
    indexedAncestors.delete(key);
  };
  const queue = (uri, edits, version, origin) => {
    const key = indexKey(uri);
    const existing = pending2.get(key);
    if (existing) {
      const existingNumeric = typeof existing.version === "number" ? existing.version : void 0;
      const incomingNumeric = typeof version === "number" ? version : void 0;
      if (existingNumeric !== void 0 && incomingNumeric !== void 0 && existingNumeric !== incomingNumeric) {
        throw new Error(`conflicting text document versions for ${uri}`);
      }
      existing.edits.push(...edits);
      if (origin)
        (existing.origins ??= []).push(origin);
      if (existingNumeric === void 0 && incomingNumeric !== void 0)
        existing.version = version;
      return;
    }
    if (origin) {
      pending2.set(key, { uri, edits: [...edits], version, origins: [origin] });
    } else {
      pending2.set(key, { uri, edits: [...edits], version });
    }
    addIndex(key);
  };
  const flushUri = (uri) => {
    const key = indexKey(uri);
    const item = pending2.get(key);
    if (!item)
      return;
    pending2.delete(key);
    removeIndex(key);
    if (item.origins) {
      ops.push({
        kind: "text",
        uri: item.uri,
        edits: item.edits,
        version: item.version,
        origins: item.origins
      });
    } else {
      ops.push({
        kind: "text",
        uri: item.uri,
        edits: item.edits,
        version: item.version
      });
    }
  };
  const flushSubtree = (uri) => {
    const key = indexKey(uri);
    for (const candidate of descendants.get(key) ?? []) {
      const item = pending2.get(candidate);
      if (item)
        flushUri(item.uri);
    }
  };
  for (const [uri, edits] of Object.entries(edit.changes ?? {})) {
    const parsed = parseTextEdits(edits, `changes[${uri}]`);
    queue(uri, parsed, void 0, trackOrigins ? { kind: "changes", uri, edits: parsed } : void 0);
  }
  for (const [index, change] of (edit.documentChanges ?? []).entries()) {
    const text = parseTextDocumentEdit(change, `documentChanges[${index}]`);
    if (text) {
      queue(text.textDocument.uri, text.edits, text.textDocument.version, trackOrigins ? {
        kind: "documentChanges",
        index,
        edits: text.edits
      } : void 0);
      continue;
    }
    const resource = parseResource(change);
    const resourceKey = resource.kind === "rename" ? `rename:${indexKey(resource.oldUri)}:${indexKey(resource.newUri)}` : `${resource.kind}:${indexKey(resource.uri)}`;
    if (seenResources.has(resourceKey))
      throw new Error(`duplicate workspace resource operation: ${resourceKey}`);
    seenResources.add(resourceKey);
    if (resource.kind === "create")
      flushUri(resource.uri);
    else if (resource.kind === "rename") {
      flushSubtree(resource.oldUri);
      flushSubtree(resource.newUri);
    } else
      flushSubtree(resource.uri);
    ops.push(resource);
  }
  for (const item of pending2.values())
    flushUri(item.uri);
  return ops;
}
function relativeToCwd(filePath, cwd) {
  const rel = path12.relative(cwd, filePath) || path12.basename(filePath);
  return rel.replace(/\\/g, "/");
}
var IMPORT_RELEVANT_LINE = /^\s*import\b|^\s*export\s[^;]*\bfrom\s|\bfrom\s+['"]/;
function importsSignature(text) {
  return text.split("\n").filter((line) => IMPORT_RELEVANT_LINE.test(line)).join("\n");
}
function summarizeWorkspaceEdit(edit, cwd) {
  const lines = [];
  for (const [uri, edits] of flattenWorkspaceTextEdits(edit))
    lines.push(`Apply ${edits.length} edit(s) to ${relativeToCwd(uriToPath(uri), cwd)}`);
  for (const change of edit.documentChanges ?? []) {
    if (!isRecord(change) || typeof change.kind !== "string")
      continue;
    if (change.kind === "create" && typeof change.uri === "string")
      lines.push(`Create ${relativeToCwd(uriToPath(change.uri), cwd)}`);
    else if (change.kind === "rename" && typeof change.oldUri === "string" && typeof change.newUri === "string")
      lines.push(`Rename ${relativeToCwd(uriToPath(change.oldUri), cwd)} \u2192 ${relativeToCwd(uriToPath(change.newUri), cwd)}`);
    else if (change.kind === "delete" && typeof change.uri === "string")
      lines.push(`Delete ${relativeToCwd(uriToPath(change.uri), cwd)}`);
  }
  return lines;
}
async function lstatOrMissing(filePath) {
  try {
    return await fs11.lstat(filePath);
  } catch (err) {
    if (err.code === "ENOENT")
      return void 0;
    throw err;
  }
}
function isSameFsIdentity(a, b) {
  return a.dev === b.dev && a.ino !== 0n && b.ino !== 0n && a.ino === b.ino;
}
async function bigintLstatOrMissing(filePath) {
  try {
    return await fs11.lstat(filePath, { bigint: true });
  } catch (err) {
    if (err.code === "ENOENT")
      return void 0;
    throw err;
  }
}
async function isSameFsEntry(a, b) {
  const [statA, statB] = await Promise.all([
    bigintLstatOrMissing(a),
    bigintLstatOrMissing(b)
  ]);
  return Boolean(statA && statB && isSameFsIdentity(statA, statB));
}
async function assertParentIsUsable(filePath, stateFor) {
  let current = path12.dirname(filePath);
  while (true) {
    const known = await stateFor(current);
    if (known.exists) {
      if (!known.directory)
        throw new Error(`resource parent is not a directory: ${current}`);
      return;
    }
    const parent = path12.dirname(current);
    if (parent === current)
      throw new Error(`resource parent does not exist: ${filePath}`);
    current = parent;
  }
}
async function resolveExistingAncestor(filePath) {
  let current = path12.resolve(filePath);
  const tail = [];
  while (true) {
    try {
      const resolved2 = await fs11.realpath(current);
      return path12.join(resolved2, ...tail.reverse());
    } catch (err) {
      const code = err.code;
      if (code !== "ENOENT" && code !== "ENOTDIR")
        throw err;
      const parent = path12.dirname(current);
      if (parent === current)
        throw err;
      tail.push(path12.basename(current));
      current = parent;
    }
  }
}
async function createWorkspaceUriConfiner(cwd) {
  const root = await resolveExistingAncestor(cwd);
  return async (uri) => {
    let filePath = "";
    try {
      const parsed = new URL2(uri);
      if (parsed.protocol !== "file:" || parsed.host !== "" && parsed.hostname !== "localhost")
        throw new Error("URI must be a local file URI");
      filePath = uriToPath(uri);
    } catch (err) {
      throw new Error(`invalid workspace edit URI ${uri}: ${err instanceof Error ? err.message : String(err)}`, { cause: err });
    }
    if (!path12.isAbsolute(filePath))
      throw new Error(`workspace edit path escapes workspace: ${uri}`);
    const resolved2 = await resolveExistingAncestor(filePath);
    if (!isUnderDir(resolved2, root))
      throw new Error(`workspace edit path escapes workspace: ${uri}`);
    return filePath;
  };
}
async function validateWorkspaceEdit(edit, cwd) {
  const planned = planWorkspaceEdit(edit);
  await preflightWorkspaceEdit(planned, cwd, {});
}
async function preflightWorkspaceEdit(planned, cwd, options) {
  const confine = await createWorkspaceUriConfiner(cwd);
  const virtual = /* @__PURE__ */ new Map();
  const virtualOverrides = /* @__PURE__ */ new Map();
  const virtualMoves = [];
  const virtualTombstones = [];
  const text = /* @__PURE__ */ new Map();
  const textByOrigin = /* @__PURE__ */ new Map();
  const ignored = /* @__PURE__ */ new Set();
  const resolveVirtualPath = (filePath) => {
    let resolved2 = filePath;
    for (let index = virtualMoves.length - 1; index >= 0; index--) {
      const move = virtualMoves[index];
      if (isUnderDir(resolved2, move.to) && (move.directory || pathsEqual(resolved2, move.to))) {
        const suffix = path12.relative(move.to, resolved2);
        resolved2 = suffix ? path12.join(move.from, suffix) : move.from;
        continue;
      }
      if (isUnderDir(resolved2, move.from) && (move.directory || pathsEqual(resolved2, move.from))) {
        return void 0;
      }
    }
    return resolved2;
  };
  const isTombstoned = (filePath) => virtualTombstones.some((tombstone) => pathsEqual(filePath, tombstone.path) || tombstone.directory && isUnderDir(filePath, tombstone.path));
  const clearTombstonesUnder = (filePath) => {
    for (let index = virtualTombstones.length - 1; index >= 0; index--) {
      const tombstone = virtualTombstones[index];
      if (pathsEqual(tombstone.path, filePath) || isUnderDir(tombstone.path, filePath)) {
        virtualTombstones.splice(index, 1);
      }
    }
  };
  const stateFor = async (filePath) => {
    if (isTombstoned(filePath))
      return { exists: false, directory: false };
    const physicalPath = resolveVirtualPath(filePath);
    if (!physicalPath) {
      return virtualOverrides.get(normalizeMapKey(filePath)) ?? {
        exists: false,
        directory: false
      };
    }
    const key = normalizeMapKey(physicalPath);
    const known = virtual.get(key);
    if (known)
      return known;
    const stat2 = await lstatOrMissing(physicalPath);
    const value = {
      exists: Boolean(stat2),
      directory: stat2?.isDirectory() ?? false
    };
    virtual.set(key, value);
    return value;
  };
  const contentFor = async (filePath, state4) => {
    if (!state4.exists || state4.directory)
      throw new Error(`text edit target is not a file: ${filePath}`);
    if (state4.content !== void 0)
      return state4.content;
    const physicalPath = resolveVirtualPath(filePath);
    if (!physicalPath)
      throw new Error(`text edit target does not exist: ${filePath}`);
    const content = await fs11.readFile(physicalPath, "utf-8");
    const expected = options.expectedContent?.get(await fs11.realpath(physicalPath));
    if (expected !== void 0 && expected !== content) {
      refuseStaleWorkspaceEdit(filePath, "the file changed after the edit was computed from it");
    }
    state4.content = content;
    return content;
  };
  for (const op of planned) {
    if (op.kind === "text") {
      const filePath2 = await confine(op.uri);
      const state5 = await stateFor(filePath2);
      if (op.version !== void 0 && op.version !== null) {
        const current = options.documentVersions?.get(normalizeMapKey(filePath2));
        if (current === void 0 || current !== op.version)
          throw new Error(`stale text document version for ${filePath2}: expected ${op.version}, current ${current ?? "unknown"}`);
      }
      const content = await contentFor(filePath2, state5);
      const encoding = options.positionEncoding ?? "utf-16";
      const normalized = normalizeTextEditsForContent(content, op.edits, encoding);
      text.set(op, normalized);
      for (const origin of op.origins ?? []) {
        textByOrigin.set(textEditOriginKey(origin), normalizeTextEditsForContent(content, origin.edits, encoding));
      }
      state5.content = applyTextEditsToString(content, normalized);
      continue;
    }
    if (op.kind === "create") {
      const filePath2 = await confine(op.uri);
      const state5 = await stateFor(filePath2);
      await assertParentIsUsable(filePath2, stateFor);
      if (state5.exists) {
        if (op.options?.ignoreIfExists) {
          ignored.add(op);
          continue;
        }
        if (!op.options?.overwrite || state5.directory)
          throw new Error(`create target already exists: ${filePath2}`);
        state5.content = "";
      } else {
        clearTombstonesUnder(filePath2);
        state5.exists = true;
        state5.directory = false;
        state5.content = "";
        const physicalPath = resolveVirtualPath(filePath2);
        if (physicalPath)
          virtual.set(normalizeMapKey(physicalPath), state5);
        else
          virtualOverrides.set(normalizeMapKey(filePath2), state5);
      }
      continue;
    }
    if (op.kind === "rename") {
      const oldPath = await confine(op.oldUri);
      const newPath = await confine(op.newUri);
      const oldDisk = uriToDiskPath(op.oldUri);
      const newDisk = uriToDiskPath(op.newUri);
      if (path12.resolve(oldDisk).replace(/\\/g, "/") === path12.resolve(newDisk).replace(/\\/g, "/")) {
        throw new Error("rename source and destination must differ");
      }
      const source = await stateFor(oldPath);
      if (!source.exists)
        throw new Error(`rename source does not exist: ${oldPath}`);
      const sourceFromOverride = resolveVirtualPath(oldPath) === void 0;
      await assertParentIsUsable(newPath, stateFor);
      const destination = await stateFor(newPath);
      if (destination.exists) {
        const aliasesSource = destination === source || await isSameFsEntry(oldDisk, newDisk);
        if (!aliasesSource) {
          if (op.options?.ignoreIfExists) {
            ignored.add(op);
            continue;
          }
          if (!op.options?.overwrite)
            throw new Error(`rename destination already exists: ${newPath}`);
        }
      }
      clearTombstonesUnder(newPath);
      if (!source.directory)
        await contentFor(oldPath, source);
      if (sourceFromOverride) {
        virtualOverrides.delete(normalizeMapKey(oldPath));
        const destinationPhysicalPath = resolveVirtualPath(newPath);
        if (destinationPhysicalPath)
          virtual.set(normalizeMapKey(destinationPhysicalPath), source);
        else
          virtualOverrides.set(normalizeMapKey(newPath), source);
      } else {
        virtualMoves.push({
          from: oldPath,
          to: newPath,
          directory: source.directory
        });
      }
      continue;
    }
    const filePath = await confine(op.uri);
    const state4 = await stateFor(filePath);
    if (!state4.exists) {
      if (op.options?.ignoreIfNotExists)
        ignored.add(op);
      else
        throw new Error(`delete target does not exist: ${filePath}`);
    } else {
      if (state4.directory && !op.options?.recursive)
        throw new Error(`delete directory requires recursive: ${filePath}`);
      state4.exists = false;
      state4.content = void 0;
      virtualTombstones.push({ path: filePath, directory: state4.directory });
    }
  }
  return { text, textByOrigin, ignored };
}
async function applyWorkspaceEdit(edit, cwd, options = {}) {
  const descriptions = [];
  const touchedFiles = /* @__PURE__ */ new Set();
  const fileDetails = [];
  const appliedOperationIndexes = [];
  let appliedOperationTotal = 0;
  let operationIndex = 0;
  const operationCounts = { textEdits: 0, create: 0, rename: 0, delete: 0 };
  const planned = planWorkspaceEdit(edit);
  let operationTotal = 0;
  let prepared;
  const operationSize = (op) => op.kind === "text" ? prepared.text.get(op)?.length ?? 0 : 1;
  const markApplied = (op) => {
    const count = operationSize(op);
    for (let index = 0; index < count; index++) {
      if (appliedOperationIndexes.length < 100) {
        appliedOperationIndexes.push(operationIndex + index);
      }
    }
    appliedOperationTotal += count;
    operationIndex += count;
  };
  const skipOperation = (op) => {
    operationIndex += operationSize(op);
  };
  const makeResult = () => ({
    descriptions,
    files: [...touchedFiles],
    operationTotal,
    appliedOperationTotal,
    appliedOperationIndexes,
    operationCounts,
    fileDetails
  });
  try {
    const queuePaths = plannedDiskPaths(planned);
    const queueStart = Date.now();
    await withHostFileMutationQueues(queuePaths, async () => {
      logLatency({
        type: "phase",
        filePath: cwd,
        phase: "lsp_edit_queue_wait",
        durationMs: Date.now() - queueStart,
        metadata: { paths: queuePaths.length }
      });
      prepared = await preflightWorkspaceEdit(planned, cwd, options);
      for (const op of planned) {
        const size = operationSize(op);
        if (op.kind === "text")
          operationCounts.textEdits += size;
        else
          operationCounts[op.kind]++;
        operationTotal += size;
      }
      for (const op of planned) {
        if (prepared.ignored.has(op)) {
          skipOperation(op);
          continue;
        }
        if (op.kind === "text") {
          const filePath = uriToPath(op.uri);
          const diskPath = uriToDiskPath(op.uri);
          const edits = prepared.text.get(op) ?? [];
          if (edits.length === 0) {
            skipOperation(op);
            continue;
          }
          const content = await fs11.readFile(diskPath, "utf-8");
          const updated = applyTextEditsToString(content, edits, "utf-16");
          const changesLineCount = edits.some((edit2) => {
            const removedLines = edit2.range.end.line - edit2.range.start.line;
            const insertedLines = (edit2.newText.match(/\r\n|\r|\n/g) ?? []).length;
            return removedLines !== insertedLines;
          });
          await fs11.writeFile(diskPath, updated, "utf-8");
          const start = Math.min(...edits.map((item) => item.range.start.line + 1));
          const end = Math.max(...edits.map((item) => item.range.end.line + (item.range.end.character === 0 && item.range.end.line > item.range.start.line ? 0 : 1)));
          touchedFiles.add(filePath);
          fileDetails.push({
            filePath,
            range: { start, end },
            ranges: edits.map((item) => ({
              start: item.range.start.line + 1,
              end: item.range.end.line + (item.range.end.character === 0 && item.range.end.line > item.range.start.line ? 0 : 1)
            })),
            authorshipUnknown: changesLineCount,
            importsChanged: importsSignature(content) !== importsSignature(updated)
          });
          markApplied(op);
          descriptions.push(`Applied ${edits.length} edit(s) to ${relativeToCwd(filePath, cwd)}`);
        } else if (op.kind === "create") {
          const filePath = uriToPath(op.uri);
          const diskPath = uriToDiskPath(op.uri);
          await fs11.mkdir(path12.dirname(diskPath), { recursive: true });
          if (op.options?.overwrite)
            await fs11.writeFile(diskPath, "", "utf-8");
          else
            await fs11.writeFile(diskPath, "", { flag: "wx" });
          touchedFiles.add(filePath);
          fileDetails.push({
            filePath,
            range: { start: 1, end: 1 },
            authorshipUnknown: true,
            importsChanged: false
          });
          markApplied(op);
          descriptions.push(`Created ${relativeToCwd(filePath, cwd)}`);
        } else if (op.kind === "rename") {
          const oldPath = uriToPath(op.oldUri);
          const newPath = uriToPath(op.newUri);
          const oldDisk = uriToDiskPath(op.oldUri);
          const newDisk = uriToDiskPath(op.newUri);
          await fs11.mkdir(path12.dirname(newDisk), { recursive: true });
          if (op.options?.overwrite)
            await fs11.rm(newDisk, { recursive: true, force: true });
          await fs11.rename(oldDisk, newDisk);
          touchedFiles.add(oldPath);
          touchedFiles.add(newPath);
          fileDetails.push({
            filePath: oldPath,
            range: { start: 1, end: 1 },
            authorshipUnknown: true,
            importsChanged: true
          }, {
            filePath: newPath,
            range: { start: 1, end: 1 },
            authorshipUnknown: true,
            importsChanged: true
          });
          markApplied(op);
          descriptions.push(`Renamed ${relativeToCwd(oldPath, cwd)} \u2192 ${relativeToCwd(newPath, cwd)}`);
        } else {
          const filePath = uriToPath(op.uri);
          const diskPath = uriToDiskPath(op.uri);
          await fs11.rm(diskPath, {
            recursive: op.options?.recursive === true,
            force: false
          });
          touchedFiles.add(filePath);
          fileDetails.push({
            filePath,
            range: { start: 1, end: 1 },
            authorshipUnknown: true,
            importsChanged: true
          });
          markApplied(op);
          descriptions.push(`Deleted ${relativeToCwd(filePath, cwd)}`);
        }
      }
    });
  } catch (err) {
    const partial = makeResult();
    if (options.mutationContext && options.observe !== false) {
      recordLspMutation(options.mutationContext, {
        results: [partial],
        status: "failed"
      });
    }
    const already = [...touchedFiles];
    if (already.length > 0) {
      const alreadyList = already.map((f) => `  \u2022 ${relativeToCwd(f, cwd)}`).join("\n");
      const failure = new Error(`Workspace edit failed mid-application \u2014 ${already.length} file(s) already written, no rollback performed:
${alreadyList}
Cause: ${err instanceof Error ? err.message : String(err)}`);
      failure.appliedWorkspaceEdit = partial;
      throw failure;
    }
    throw err;
  }
  const applied = makeResult();
  if (options.mutationContext && options.observe !== false) {
    recordLspMutation(options.mutationContext, {
      results: [applied],
      status: appliedOperationTotal > 0 ? "success" : "skipped"
    });
  }
  return applied;
}

// dist/clients/lsp/sync-kind.js
var TEXT_DOCUMENT_SYNC_KIND_FULL = 1;
var TEXT_DOCUMENT_SYNC_KIND_INCREMENTAL = 2;
function isSyncKind(value) {
  return value === 0 || value === 1 || value === 2;
}
function negotiateSyncKind(serverCapabilities) {
  const sync = serverCapabilities?.textDocumentSync;
  if (isSyncKind(sync))
    return sync;
  if (sync && typeof sync === "object") {
    const change = sync.change;
    if (isSyncKind(change))
      return change;
  }
  return TEXT_DOCUMENT_SYNC_KIND_FULL;
}
function negotiateSaveOptions(serverCapabilities) {
  const sync = serverCapabilities?.textDocumentSync;
  if (!sync || typeof sync !== "object")
    return void 0;
  const save = sync.save;
  if (save === true)
    return { includeText: false };
  if (save && typeof save === "object") {
    return {
      includeText: save.includeText === true
    };
  }
  return void 0;
}

// dist/clients/runtime-config.js
var _runnerTimeoutFloorCache;
function getRunnerTimeoutFloorMs() {
  if (_runnerTimeoutFloorCache !== void 0)
    return _runnerTimeoutFloorCache;
  const config = loadPiLensGlobalConfig();
  const configFloor = toPositiveFinite(config?.dispatch?.runnerTimeoutFloorMs);
  const envFloor = toPositiveFinite(process.env.PI_LENS_RUNNER_TIMEOUT_FLOOR_MS);
  _runnerTimeoutFloorCache = Math.max(configFloor, envFloor, 0);
  return _runnerTimeoutFloorCache;
}
var RUNTIME_CONFIG = {
  pipeline: {
    lspMaxFileBytes: 2 * 1024 * 1024,
    lspMaxFileLines: 5e3,
    cascadeMaxFiles: 5,
    cascadeMaxDiagnosticsPerFile: 20,
    // Hard cap on how long the pipeline will wait for an LSP client to spawn.
    // Keeps tool_result from blocking the TUI during cold LSP start (e.g.
    // pyright workspace indexing). The LSP server continues spawning in the
    // background; subsequent edits get full diagnostics once it is ready.
    lspSpawnBudgetMs: 5e3
  },
  dispatch: {
    runnerTimeoutMs: 3e4
  },
  crashNotice: {
    alwaysShowFirstN: 2,
    showEveryNth: 5
  },
  reviewGraph: {
    // Deprecated (#776): no longer read by `review-graph/builder.ts`, which
    // now derives its fallback from `project-scale.ts`'s `maxProjectFiles`
    // knob (reproducing this same 1,000 default at the default base). Left
    // in place only in case an external caller still reads the constant.
    maxFiles: 1e3,
    maxFileBytes: 1 * 1024 * 1024
  },
  turnEnd: {
    maxLines: 20,
    maxChars: 1e3
  }
};

// dist/clients/lsp/content-limits.js
var LSP_MAX_FILE_BYTES = RUNTIME_CONFIG.pipeline.lspMaxFileBytes;
var LSP_MAX_FILE_LINES = RUNTIME_CONFIG.pipeline.lspMaxFileLines;
function exceedsLspSyncLimits(content) {
  const sizeBytes = Buffer.byteLength(content, "utf-8");
  if (sizeBytes > LSP_MAX_FILE_BYTES) {
    return {
      tooLarge: true,
      reason: `${sizeBytes} bytes > ${LSP_MAX_FILE_BYTES} limit`
    };
  }
  const lineCount = content.split("\n").length;
  if (lineCount > LSP_MAX_FILE_LINES) {
    return {
      tooLarge: true,
      reason: `${lineCount} lines > ${LSP_MAX_FILE_LINES} limit`
    };
  }
  return { tooLarge: false, reason: "" };
}

// dist/clients/lsp/tsserver-sync.js
var TSSERVER_REQUEST_COMMAND = "typescript.tsserverRequest";
var INFERRED_PROJECT_SENTINEL = /^(?:[A-Za-z]:)?[/\\]dev[/\\]null[/\\]inferredProject\d*\*?$/i;
function classifyProjectInfo(body) {
  if (!body || typeof body !== "object") {
    return { projectKind: "unassociated", association: "unassociated" };
  }
  const info = body;
  const configFile = typeof info.configFileName === "string" && info.configFileName.length > 0 ? info.configFileName : void 0;
  const inferred = configFile ? INFERRED_PROJECT_SENTINEL.test(configFile) : false;
  const projectKind = configFile ? inferred ? "inferred" : /(?:^|[/\\])(?:tsconfig|jsconfig)\.json$/i.test(configFile) ? "configured" : "unassociated" : "unassociated";
  return {
    projectKind,
    ...configFile ? { configFile } : {},
    association: info.languageServiceDisabled === true ? "language-service-disabled" : projectKind === "unassociated" ? "unassociated" : "associated"
  };
}
async function probeTsserverProjectIdentity(options) {
  const normalizedFile = options.normalizedFile ?? normalizeMapKey(options.file);
  const startedAt = Date.now();
  const logOutcome = (outcome, metadata = {}) => logLatency({
    type: "phase",
    phase: "lsp_typescript_project_identity",
    filePath: normalizedFile,
    durationMs: Date.now() - startedAt,
    metadata: {
      serverId: options.serverId,
      launchVariant: options.launchVariant,
      clientRoot: options.clientRoot,
      outcome,
      ...metadata
    }
  });
  if (options.serverId !== "typescript" || options.launchVariant !== "classic" || typeof options.commandChannel.executeCommand !== "function") {
    return;
  }
  if (options.probedFiles.has(normalizedFile))
    return;
  options.probedFiles.add(normalizedFile);
  try {
    const outcome = await options.commandChannel.executeCommand(TSSERVER_REQUEST_COMMAND, ["projectInfo", { file: options.file, needFileNameList: false }]);
    if (!outcome.executed) {
      logOutcome("not-executed");
      return;
    }
    const response = outcome.result;
    if (!response) {
      logOutcome("no-response");
      return;
    }
    if (response.success !== true) {
      logOutcome("unsuccessful");
      return;
    }
    const identity = classifyProjectInfo(response.body);
    logLatency({
      type: "phase",
      phase: "lsp_typescript_project_identity",
      filePath: normalizedFile,
      durationMs: Date.now() - startedAt,
      metadata: {
        outcome: "ok",
        serverId: options.serverId,
        launchVariant: options.launchVariant,
        clientRoot: options.clientRoot,
        projectKind: identity.projectKind,
        configFile: identity.configFile,
        association: identity.association
      }
    });
  } catch {
    logOutcome("threw");
  }
}
async function fetchTsserverProjectIdentity(svc, file) {
  try {
    if (typeof svc.executeReadOnlyCommandOnLiveClient !== "function") {
      return void 0;
    }
    const outcome = await svc.executeReadOnlyCommandOnLiveClient(file, TSSERVER_REQUEST_COMMAND, ["projectInfo", { file, needFileNameList: false }]);
    if (!outcome.executed)
      return void 0;
    const response = outcome.result;
    if (!response || response.success !== true)
      return void 0;
    return classifyProjectInfo(response.body);
  } catch {
    return void 0;
  }
}
function isTsserverSyncRawDiagnostic(value) {
  if (!value || typeof value !== "object")
    return false;
  const v = value;
  return typeof v.message === "string" && typeof v.category === "string";
}
function tsserverSeverityFromCategory(category) {
  switch (category) {
    case "error":
      return 1;
    case "warning":
      return 2;
    case "suggestion":
      return 4;
    // Hint
    default:
      return 3;
  }
}
function tsserverSyncDiagnosticToLsp(d) {
  const startLine = Math.max(0, (d.startLocation?.line ?? 1) - 1);
  const startChar = Math.max(0, (d.startLocation?.offset ?? 1) - 1);
  const endLine = Math.max(0, (d.endLocation?.line ?? d.startLocation?.line ?? 1) - 1);
  const endChar = Math.max(0, (d.endLocation?.offset ?? d.startLocation?.offset ?? 1) - 1);
  return {
    severity: tsserverSeverityFromCategory(d.category),
    message: d.message,
    range: {
      start: { line: startLine, character: startChar },
      end: { line: endLine, character: endChar }
    },
    code: d.code,
    source: "typescript"
  };
}
async function runTsserverSyncCommand(svc, file, command) {
  if (typeof svc.executeCommand !== "function")
    return void 0;
  const outcome = await svc.executeCommand(file, TSSERVER_REQUEST_COMMAND, [
    command,
    { file, includeLinePosition: true }
  ]);
  if (!outcome.executed)
    return void 0;
  const result = outcome.result;
  if (!result || result.success !== true || !Array.isArray(result.body)) {
    return void 0;
  }
  return result.body.filter(isTsserverSyncRawDiagnostic);
}
async function attemptTsserverSyncDiagnostics(file, svc) {
  try {
    const advertised = await svc.getAdvertisedCommands(file);
    if (!advertised.includes(TSSERVER_REQUEST_COMMAND))
      return void 0;
    const [semantic, syntactic] = await Promise.all([
      runTsserverSyncCommand(svc, file, "semanticDiagnosticsSync"),
      runTsserverSyncCommand(svc, file, "syntacticDiagnosticsSync")
    ]);
    if (semantic === void 0 || syntactic === void 0)
      return void 0;
    return [...syntactic, ...semantic].map(tsserverSyncDiagnosticToLsp);
  } catch {
    return void 0;
  }
}

// dist/clients/lsp/watch-queue.js
var WATCH_DEBOUNCE_MS = 100;
var WatchedFilesQueue = class {
  flushFn;
  debounceMs;
  // uri → latest FileChangeType. A Map collapses repeated events for the same
  // URI (last-type-wins) while preserving first-seen insertion order.
  pending = /* @__PURE__ */ new Map();
  timer = null;
  constructor(flushFn, debounceMs = WATCH_DEBOUNCE_MS) {
    this.flushFn = flushFn;
    this.debounceMs = debounceMs;
  }
  /** Queue a change; arms the debounce timer if not already pending. */
  enqueue(uri, type) {
    this.pending.set(uri, type);
    if (this.timer)
      return;
    this.timer = setTimeout(() => this.flush(), this.debounceMs);
    this.timer.unref?.();
  }
  /** Emit all queued changes as one notification (no-op when empty). */
  flush() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.pending.size === 0)
      return;
    const changes = [...this.pending.entries()].map(([uri, type]) => ({ uri, type }));
    this.pending.clear();
    this.flushFn(changes);
  }
  /** Drop the timer + any queued changes without emitting (client teardown). */
  cancel() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.pending.clear();
  }
  /** Number of distinct URIs currently queued (for tests/introspection). */
  get size() {
    return this.pending.size;
  }
};

// dist/clients/lsp/workspace-diagnostics-cache.js
import * as fs12 from "node:fs";
import * as path14 from "node:path";

// dist/clients/reverse-deps.js
import * as path13 from "node:path";
function rankFilesByReverseDependencyCentrality(index) {
  const files2 = /* @__PURE__ */ new Set([
    ...Object.keys(index.imports),
    ...Object.keys(index.importedBy)
  ]);
  return [...files2].sort((a, b) => {
    const fanIn = (index.importedBy[b]?.length ?? 0) - (index.importedBy[a]?.length ?? 0);
    if (fanIn !== 0)
      return fanIn;
    const fanOut = (index.imports[b]?.length ?? 0) - (index.imports[a]?.length ?? 0);
    return fanOut || a.localeCompare(b);
  });
}
function sortedUnique(values) {
  return [...new Set([...values].map((value) => normalizeMapKey(value)))].sort((a, b) => a.localeCompare(b));
}
function addEdge(index, fromFile, toFile) {
  const from = normalizeMapKey(fromFile);
  const to = normalizeMapKey(toFile);
  if (from === to)
    return;
  (index.imports[from] ??= []).push(to);
  (index.importedBy[to] ??= []).push(from);
}
function normalizeIndex(index) {
  const importFileKeys = [...new Set(Object.keys(index.imports))].sort((a, b) => a.localeCompare(b));
  const allFileKeys = /* @__PURE__ */ new Set([
    ...importFileKeys,
    ...Object.keys(index.importedBy)
  ]);
  const imports = {};
  for (const file of importFileKeys) {
    imports[file] = sortedUnique(index.imports[file] ?? []);
  }
  const importedBy = {};
  for (const file of [...allFileKeys].sort((a, b) => a.localeCompare(b))) {
    importedBy[file] = sortedUnique(index.importedBy[file] ?? []);
  }
  return { ...index, imports, importedBy };
}
function filePathForNode(graph, nodeId) {
  const filePath = graph.nodes.get(nodeId)?.filePath;
  return filePath ? normalizeMapKey(filePath) : void 0;
}
function buildReverseDependencyIndexFromGraph(args) {
  const index = {
    projectRoot: normalizeMapKey(path13.resolve(args.cwd)),
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    seq: args.seq,
    imports: {},
    importedBy: {},
    source: "review-graph"
  };
  for (const filePath of args.graph.fileNodes.keys()) {
    const normalized = normalizeMapKey(filePath);
    index.imports[normalized] ??= [];
    index.importedBy[normalized] ??= [];
  }
  for (const edge of args.graph.edges) {
    if (edge.kind !== "imports")
      continue;
    const fromFile = filePathForNode(args.graph, edge.from);
    const toFile = filePathForNode(args.graph, edge.to);
    if (!fromFile || !toFile)
      continue;
    addEdge(index, fromFile, toFile);
  }
  return normalizeIndex(index);
}
function buildReverseDependencyIndexFromSnapshot(snapshot) {
  const reverseDeps = snapshot.reverseDeps ?? {};
  const hasReverseDeps = Object.keys(reverseDeps).length > 0;
  const fileEntries = Object.entries(snapshot.files ?? {});
  const hasFileImports = fileEntries.some(([, file]) => Array.isArray(file.imports));
  if (!hasReverseDeps && !hasFileImports)
    return null;
  const index = {
    projectRoot: normalizeMapKey(snapshot.projectRoot),
    generatedAt: snapshot.generatedAt,
    seq: snapshot.seq,
    imports: {},
    importedBy: {},
    source: "project-snapshot"
  };
  for (const [filePath, file] of fileEntries) {
    const normalized = normalizeMapKey(file.path || filePath);
    if (Array.isArray(file.imports)) {
      const imports = sortedUnique(file.imports);
      index.imports[normalized] = imports;
      for (const imported of imports) {
        index.importedBy[imported] ??= [];
        index.importedBy[imported].push(normalized);
      }
    }
    index.importedBy[normalized] ??= [];
  }
  for (const [filePath, importers] of Object.entries(reverseDeps)) {
    const normalized = normalizeMapKey(filePath);
    index.importedBy[normalized] = sortedUnique([
      ...index.importedBy[normalized] ?? [],
      ...importers
    ]);
    for (const importer of index.importedBy[normalized]) {
      if (index.imports[importer] === void 0)
        continue;
      if (!index.imports[importer].includes(normalized)) {
        index.imports[importer].push(normalized);
      }
    }
  }
  return normalizeIndex(index);
}
function loadReverseDependencyIndexFromSnapshot(args) {
  const snapshot = loadProjectSnapshot(args.cwd);
  if (!snapshot)
    return null;
  if (typeof args.currentProjectSeq === "number" && snapshot.seq !== args.currentProjectSeq) {
    return null;
  }
  return buildReverseDependencyIndexFromSnapshot(snapshot);
}
function getReverseDepsFromIndex(index, filePath) {
  return sortedUnique(index.importedBy[normalizeMapKey(path13.resolve(filePath))] ?? []);
}

// dist/clients/lsp/workspace-diagnostics-cache.js
var WORKSPACE_DIAGNOSTICS_CACHE_VERSION = 3;
var CACHE_FILE = "lsp-workspace-diagnostics.json";
function cachePath(cwd) {
  return path14.join(getProjectDataDir(cwd), "cache", CACHE_FILE);
}
var MAX_REGISTERED_CWDS = 64;
var _registeredCwds = /* @__PURE__ */ new Set();
function clearAllWorkspaceDiagnosticsCaches() {
  for (const cwd of _registeredCwds) {
    clearWorkspaceDiagnosticsCache(cwd);
  }
}
function clearWorkspaceDiagnosticsCacheAtAndAbove(cwd, ceiling = process.cwd()) {
  const root = path14.resolve(cwd);
  const workspaceRoot = path14.resolve(ceiling);
  clearWorkspaceDiagnosticsCache(root);
  const relative4 = path14.relative(workspaceRoot, root);
  if (relative4.startsWith(".." + path14.sep) || relative4 === ".." || path14.isAbsolute(relative4)) {
    return;
  }
  if (normalizeMapKey(root) === normalizeMapKey(workspaceRoot))
    return;
  let ancestor = path14.dirname(root);
  while (true) {
    clearWorkspaceDiagnosticsCache(ancestor);
    if (normalizeMapKey(ancestor) === normalizeMapKey(workspaceRoot))
      return;
    const parent = path14.dirname(ancestor);
    if (parent === ancestor)
      return;
    ancestor = parent;
  }
}
var _cacheEpochs = createGenerationMap("workspace-diagnostics-cache", {
  normalizeKey: normalizeMapKey
});
function loadWorkspaceDiagnosticsCache(cwd) {
  return readJsonCache(cachePath(cwd), (parsed) => {
    if (!parsed || typeof parsed !== "object")
      return void 0;
    const cache2 = parsed;
    if (cache2.version !== WORKSPACE_DIAGNOSTICS_CACHE_VERSION) {
      if (cache2.version === 1 || cache2.version === 2) {
        recordDegradationOnce({
          kind: "lsp-workspace-cache-migration",
          subject: path14.resolve(cwd),
          reason: `rejected v${cache2.version} cache with ${cache2.entries && typeof cache2.entries === "object" ? Object.keys(cache2.entries).length : 0} entries during provenance migration`
        });
      }
      return void 0;
    }
    if (!cache2.entries || typeof cache2.entries !== "object")
      return void 0;
    const validEntries = {};
    for (const [key, entry] of Object.entries(cache2.entries)) {
      if (!entry || typeof entry !== "object")
        continue;
      if (!Array.isArray(entry.diagnostics) || entry.diagnostics.some((diagnostic) => !diagnostic || typeof diagnostic !== "object" || typeof diagnostic.serverId !== "string" || diagnostic.serverId.length === 0)) {
        continue;
      }
      validEntries[key] = entry;
    }
    return { ...cache2, entries: validEntries };
  });
}
function saveWorkspaceDiagnosticsCache(cwd, cache2) {
  const filePath = cachePath(cwd);
  fs12.mkdirSync(path14.dirname(filePath), { recursive: true });
  writeFileAtomic(filePath, JSON.stringify(cache2, null, 2), {
    bestEffort: false
  });
}
function clearWorkspaceDiagnosticsCache(cwd) {
  const root = path14.resolve(cwd);
  _cacheEpochs.bump(root);
  try {
    saveWorkspaceDiagnosticsCache(root, {
      version: WORKSPACE_DIAGNOSTICS_CACHE_VERSION,
      entries: {}
    });
  } catch {
  }
}
var WORKSPACE_DIAGNOSTICS_FINDING_MAX_AGE_MS = 4 * 60 * 6e4;
function classifyWorkspaceDiagnosticsCacheExpiry(entry, now, sessionStartedAt) {
  const findings = Array.isArray(entry.diagnostics) ? entry.diagnostics.length : 0;
  if (findings === 0)
    return void 0;
  if (entry.scannedAt < sessionStartedAt)
    return "pre-session";
  if (now - entry.scannedAt > WORKSPACE_DIAGNOSTICS_FINDING_MAX_AGE_MS) {
    return "max-age";
  }
  return void 0;
}
function isEntryFresh(filePath, entry, getImports) {
  let ownStat;
  try {
    ownStat = fs12.statSync(filePath);
  } catch {
    return false;
  }
  if (ownStat.mtimeMs !== entry.mtimeMs)
    return false;
  if (entry.sizeBytes !== void 0 && ownStat.size !== entry.sizeBytes) {
    return false;
  }
  const imports = getImports(filePath);
  if (imports === void 0) {
    return entry.depIndexAtScan !== true;
  }
  for (const dep of imports) {
    let mtimeMs;
    try {
      mtimeMs = fs12.statSync(dep).mtimeMs;
    } catch {
      return false;
    }
    const verdict = freshnessFromMtime({
      mtimeMs,
      referenceMs: entry.scannedAt
    });
    if (verdict.verdict === "stale")
      return false;
  }
  return true;
}
function cacheKeyFor(filePath) {
  return normalizeMapKey(filePath);
}
function buildScopeKey(clientScope, excludeServerIds) {
  const excluded = excludeServerIds ? [...excludeServerIds].sort(compareOrdinal) : [];
  return `${clientScope}|${excluded.join(",")}`;
}
function createWorkspaceDiagnosticsCacheContext(cwd) {
  const root = path14.resolve(cwd);
  if (_registeredCwds.size < MAX_REGISTERED_CWDS || _registeredCwds.has(root)) {
    _registeredCwds.add(root);
  }
  const epoch = _cacheEpochs.capture(root);
  const existing = loadWorkspaceDiagnosticsCache(root);
  const entries = {
    ...existing?.entries
  };
  const reverseDepsIndex = loadReverseDependencyIndexFromSnapshot({
    cwd: root
  });
  const getImports = (filePath) => reverseDepsIndex?.imports[cacheKeyFor(filePath)];
  const hasDepKnowledge = (filePath) => getImports(filePath) !== void 0;
  const diskBindingCache = createDiskBindingCache();
  let dirty = false;
  let expiredCount = 0;
  let oldestExpiredAgeMs = 0;
  const expiredByReason = { "pre-session": 0, "max-age": 0 };
  let depIndexColdRefusalCount = 0;
  const flushExpiryTelemetry = () => {
    if (expiredCount === 0 && depIndexColdRefusalCount === 0)
      return;
    logLatency({
      type: "phase",
      phase: "lsp_workspace_diagnostics_cache_expiry",
      filePath: root,
      durationMs: 0,
      metadata: {
        expiredEntries: expiredCount,
        oldestExpiredAgeMs,
        preSession: expiredByReason["pre-session"],
        maxAge: expiredByReason["max-age"],
        depIndexColdRefusals: depIndexColdRefusalCount,
        sessionStartedAt: workspaceDiagnosticsCacheSessionStart(),
        maxAgeMs: WORKSPACE_DIAGNOSTICS_FINDING_MAX_AGE_MS
      }
    });
    expiredCount = 0;
    oldestExpiredAgeMs = 0;
    expiredByReason["pre-session"] = 0;
    expiredByReason["max-age"] = 0;
    depIndexColdRefusalCount = 0;
  };
  return {
    importsFor(filePath) {
      return getImports(filePath);
    },
    lookup(filePath, scopeKey) {
      if (!epoch.isCurrent())
        return void 0;
      const key = cacheKeyFor(filePath);
      const entry = entries[key];
      if (!entry || entry.scopeKey !== scopeKey)
        return void 0;
      const now = Date.now();
      const expiry = classifyWorkspaceDiagnosticsCacheExpiry(entry, now, workspaceDiagnosticsCacheSessionStart());
      if (expiry) {
        delete entries[key];
        dirty = true;
        expiredCount += 1;
        expiredByReason[expiry] += 1;
        oldestExpiredAgeMs = Math.max(oldestExpiredAgeMs, Math.max(0, now - entry.scannedAt));
        return void 0;
      }
      if (entry.depIndexAtScan === true && !hasDepKnowledge(filePath)) {
        delete entries[key];
        dirty = true;
        depIndexColdRefusalCount += 1;
        return void 0;
      }
      if (!isEntryFresh(filePath, entry, getImports))
        return void 0;
      return {
        diagnostics: entry.diagnostics,
        count: entry.count,
        binding: {
          contentHash: entry.contentHash,
          boundToCurrentDisk: diskBindingCache.boundToCurrentDisk(filePath, {
            contentHash: entry.contentHash
          })
        },
        scannedAt: entry.scannedAt
      };
    },
    record(filePath, scopeKey, diagnostics, mtimeMs, contentHash2, sizeBytes, scannedAt = Date.now()) {
      entries[cacheKeyFor(filePath)] = {
        diagnostics,
        count: diagnostics.length,
        mtimeMs,
        scannedAt,
        scopeKey,
        // #1793: stamp whether THIS FILE actually had dependency
        // knowledge this sweep (not just whether SOME index was
        // loaded — see `hasDepKnowledge`'s doc comment), so a later
        // cold session can refuse to revalidate this entry via the
        // weaker mtime-only path only when that refusal is warranted.
        depIndexAtScan: hasDepKnowledge(filePath),
        ...contentHash2 !== void 0 && { contentHash: contentHash2 },
        ...sizeBytes !== void 0 && { sizeBytes }
      };
      dirty = true;
    },
    forget(filePath) {
      delete entries[cacheKeyFor(filePath)];
      dirty = true;
    },
    persist() {
      flushExpiryTelemetry();
      if (!dirty)
        return;
      const published = epoch.guardedWrite(root, () => {
        try {
          saveWorkspaceDiagnosticsCache(root, {
            version: WORKSPACE_DIAGNOSTICS_CACHE_VERSION,
            entries
          });
          return true;
        } catch {
          return false;
        }
      });
      if (published !== false)
        dirty = false;
    }
  };
}

// dist/clients/lsp/client.js
var PUB_DEBUG = Boolean(process.env.PILENS_PUB_DEBUG);
function extractSpawnMarker(args) {
  if (!args)
    return void 0;
  const tmpDir = os2.tmpdir();
  for (let i = 0; i < args.length - 1; i++) {
    const flag = args[i];
    if (flag === "--config" || flag === "-c") {
      const value = args[i + 1];
      if (value?.startsWith(tmpDir))
        return value;
    }
  }
  return void 0;
}
var INITIALIZE_TIMEOUT_MS = positiveIntFromEnv("PI_LENS_LSP_INIT_TIMEOUT_MS", 15e3);
var CLIENT_CAPABILITIES = {
  general: { positionEncodings: ADVERTISED_POSITION_ENCODINGS },
  // #974: workDoneProgress is intentionally NOT advertised. pi-lens never
  // consumes `$/progress` notifications (grepped: zero listeners anywhere in
  // clients/), so declaring the capability only invites servers to open
  // progress tokens pi-lens will silently ignore — and opengrep's
  // `--experimental` LSP mode crash-loops when it can't parse our
  // spec-correct `{"result": null}` reply to its
  // `window/workDoneProgress/create` request. "Only advertise what you
  // implement" — the `window/workDoneProgress/create` handler below stays as
  // a defensive no-op in case a server ignores capabilities and asks anyway.
  window: {},
  workspace: {
    workspaceFolders: true,
    configuration: true,
    didChangeWatchedFiles: { dynamicRegistration: true },
    fileOperations: {
      dynamicRegistration: false,
      willRename: true,
      didRename: true
    }
  },
  textDocument: {
    synchronization: {
      dynamicRegistration: false,
      willSave: false,
      willSaveWaitUntil: false,
      didSave: true
    },
    completion: {
      dynamicRegistration: false,
      completionItem: { snippetSupport: false }
    },
    hover: { dynamicRegistration: false },
    signatureHelp: { dynamicRegistration: false },
    definition: { dynamicRegistration: false },
    typeDefinition: { dynamicRegistration: false },
    implementation: { dynamicRegistration: false },
    references: { dynamicRegistration: false },
    documentSymbol: { dynamicRegistration: false },
    codeAction: {
      dynamicRegistration: false,
      dataSupport: true,
      resolveSupport: { properties: ["edit", "command"] },
      // #1971 review: without literal support, LSP 3.17 constrains
      // textDocument/codeAction responses to Command[] — resolve of an edit
      // would then be protocol-invalid. We parse CodeAction objects.
      codeActionLiteralSupport: {
        codeActionKind: {
          valueSet: [
            "quickfix",
            "refactor",
            "refactor.extract",
            "refactor.inline",
            "refactor.rewrite",
            "source",
            "source.organizeImports"
          ]
        }
      }
    },
    rename: { dynamicRegistration: false },
    publishDiagnostics: {
      relatedInformation: true,
      versionSupport: true
    }
  }
};
var NAV_REQUEST_TIMEOUT_MS = positiveIntFromEnv("PI_LENS_LSP_NAV_REQUEST_TIMEOUT_MS", 1e4);
var DIAGNOSTICS_WAIT_TIMEOUT_MS = positiveIntFromEnv("PI_LENS_LSP_DIAGNOSTICS_WAIT_MS", 1e4);
var PULL_DIAGNOSTICS_RETRY_INTERVAL_MS = positiveIntFromEnv("PI_LENS_LSP_PULL_RETRY_INTERVAL_MS", 250);
var PULL_REQUEST_TIMEOUT_MS = positiveIntFromEnv("PI_LENS_LSP_PULL_REQUEST_TIMEOUT_MS", 1e4);
var PULL_MIN_USABLE_BUDGET_MS = 5;
var SHUTDOWN_REQUEST_TIMEOUT_MS = positiveIntFromEnv("PI_LENS_LSP_SHUTDOWN_TIMEOUT_MS", 1e3);
var EXIT_NOTIFY_TIMEOUT_MS = positiveIntFromEnv("PI_LENS_LSP_EXIT_NOTIFY_TIMEOUT_MS", 1e3);
var LIVENESS_PING_TIMEOUT_MS = positiveIntFromEnv("PI_LENS_LSP_LIVENESS_PING_TIMEOUT_MS", 300);
var LIVENESS_PING_QUERY = "__pi_lens_liveness_ping__";
var WORKSPACE_PULL_RESULT_CACHE_MAX = 4096;
var WORKSPACE_PULL_SCOPE = "*workspace*";
var REFRESH_REPULL_CONCURRENCY = 4;
var EXECUTE_COMMAND_TIMEOUT_MS = positiveIntFromEnv("PI_LENS_LSP_EXECUTE_COMMAND_TIMEOUT_MS", 3e4);
var PROBE_COMMAND_TIMEOUT_MS = positiveIntFromEnv("PI_LENS_LSP_PROJECT_IDENTITY_PROBE_TIMEOUT_MS", 2500);
var LSP_CRASH_CODES = /* @__PURE__ */ new Set([
  "ERR_STREAM_DESTROYED",
  "ERR_STREAM_WRITE_AFTER_END",
  "EPIPE",
  "ECONNRESET"
]);
var crashGuardInstalled = false;
function isIgnorableLspRuntimeCrash(err) {
  if (!(err instanceof Error))
    return false;
  const code = err.code;
  if (code && LSP_CRASH_CODES.has(code))
    return true;
  const msg = err.message.toLowerCase();
  const stack = (err.stack ?? "").toLowerCase();
  return msg.includes("stream") || msg.includes("write after end") || stack.includes("vscode-jsonrpc/lib/node/ril.js");
}
function installCrashGuard() {
  if (crashGuardInstalled)
    return;
  crashGuardInstalled = true;
  process.on("uncaughtException", (err) => {
    if (isIgnorableLspRuntimeCrash(err)) {
      return;
    }
    throw err;
  });
  process.on("unhandledRejection", (reason) => {
    if (isIgnorableLspRuntimeCrash(reason)) {
      return;
    }
    throw reason instanceof Error ? reason : new Error(String(reason));
  });
}
var MAX_INCREMENTAL_TEXT_RETAINED_ENTRIES = 128;
var MAX_INCREMENTAL_TEXT_RETAINED_BYTES = 64 * 1024 * 1024;
var ACTIVE_CLIENTS_FAMILY = "lsp-client.active-clients";
var ACTIVE_CLIENTS_VERSION = 1;
function activeLspClientSet() {
  return getProcessSingleton(ACTIVE_CLIENTS_FAMILY, ACTIVE_CLIENTS_VERSION, () => /* @__PURE__ */ new Set());
}
function isClientAlive(state4) {
  return state4.isConnected && !state4.isDestroyed && !state4.lspProcess.process.killed;
}
function disposeClientConnection(state4) {
  if (state4.connectionDisposed)
    return;
  state4.connectionDisposed = true;
  activeLspClientSet().delete(state4);
  try {
    state4.connection.dispose();
  } catch {
  }
}
async function killProcessTree(proc, pid, options = {}) {
  if ((proc.exitCode != null || proc.signalCode != null) && !options.processExiting) {
    releaseOwnChildPid(pid);
    proc.unref?.();
    return;
  }
  if (process.platform === "win32" && pid > 0) {
    if (options.processExiting) {
      try {
        proc.kill();
      } catch {
      }
      proc.unref?.();
      return;
    }
    try {
      const taskkill = `${process.env.SystemRoot ?? "C:\\Windows"}\\System32\\taskkill.exe`;
      const killer = nodeSpawn(taskkill, ["/F", "/T", "/PID", String(pid)], {
        shell: false,
        windowsHide: true,
        stdio: "ignore",
        detached: !!options.fast
      });
      if (options.fast) {
        killer.unref();
        proc.unref?.();
        return;
      }
      await new Promise((resolve9) => {
        killer.once("close", () => resolve9());
        killer.once("error", (err) => {
          logLatency({
            type: "phase",
            phase: "lsp_kill_escalation",
            filePath: "",
            durationMs: 0,
            metadata: { pid, platform: "win32", taskkillError: String(err) }
          });
          resolve9();
        });
      });
    } catch (err) {
      logLatency({
        type: "phase",
        phase: "lsp_kill_escalation",
        filePath: "",
        durationMs: 0,
        metadata: { pid, platform: "win32", taskkillSpawnError: String(err) }
      });
    }
    return;
  }
  const killPosixProcessGroup = (signal) => {
    if (!isOwnLiveChild(pid, "lsp-stop-posix-group"))
      return false;
    try {
      process.kill(-pid, signal);
      return true;
    } catch {
      return false;
    }
  };
  const killDirectChild = (signal) => {
    try {
      proc.kill(signal);
    } catch {
    }
  };
  try {
    let exited = proc.exitCode != null || proc.signalCode != null;
    proc.once?.("exit", () => {
      exited = true;
    });
    if (!killPosixProcessGroup("SIGTERM")) {
      killDirectChild("SIGTERM");
    }
    if (options.fast) {
      const timer = setTimeout(() => {
        if (!exited) {
          logLatency({
            type: "phase",
            phase: "lsp_kill_escalation",
            filePath: "",
            durationMs: 1500,
            metadata: { pid, platform: "posix", method: "SIGKILL", fast: true }
          });
          if (!killPosixProcessGroup("SIGKILL")) {
            killDirectChild("SIGKILL");
          }
        }
        releaseOwnChildPid(pid);
      }, 1500);
      timer.unref?.();
      proc.unref?.();
      return;
    }
    const exitedInTime = await new Promise((resolve9) => {
      if (proc.exitCode != null || proc.signalCode != null) {
        resolve9(true);
        return;
      }
      const onExit = () => {
        clearTimeout(timer);
        resolve9(true);
      };
      const timer = setTimeout(() => {
        proc.off?.("exit", onExit);
        resolve9(false);
      }, 1500);
      proc.once?.("exit", onExit);
    });
    if (!exitedInTime && !exited) {
      logLatency({
        type: "phase",
        phase: "lsp_kill_escalation",
        filePath: "",
        durationMs: 1500,
        metadata: { pid, platform: "posix", method: "SIGKILL", fast: false }
      });
      if (!killPosixProcessGroup("SIGKILL")) {
        killDirectChild("SIGKILL");
      }
    }
    releaseOwnChildPid(pid);
  } catch {
  }
}
function stripDiagnosticNoiseLines(message) {
  const cleaned = message.split(/\r?\n/).filter((line) => {
    const trimmed = line.trim();
    if (/^for further information visit\b/i.test(trimmed))
      return false;
    if (/^https?:\/\/\S+$/i.test(trimmed))
      return false;
    return true;
  }).join("\n").trim();
  return cleaned || message.trim() || message;
}
function normalizeLspDiagnostic(diagnostic) {
  const message = stripDiagnosticNoiseLines(diagnostic.message);
  return message === diagnostic.message ? diagnostic : { ...diagnostic, message };
}
function normalizeLspDiagnostics(diagnostics) {
  return diagnostics.map(normalizeLspDiagnostic);
}
function mergeDiagnosticLists(...lists) {
  const merged = [];
  const seen = /* @__PURE__ */ new Set();
  for (const diagnostic of lists.flatMap((list) => list ?? [])) {
    const key = [
      diagnostic.range.start.line,
      diagnostic.range.start.character,
      diagnostic.range.end.line,
      diagnostic.range.end.character,
      diagnostic.code ?? "",
      diagnostic.source ?? "",
      diagnostic.message
    ].join(":");
    if (seen.has(key))
      continue;
    seen.add(key);
    merged.push(diagnostic);
  }
  return merged;
}
function getMergedDiagnosticsForPath(state4, normalizedPath) {
  const legacy = state4;
  return mergeDiagnosticLists(state4.pushDiagnostics?.get(normalizedPath) ?? legacy.diagnostics?.get(normalizedPath), state4.documentPullDiagnostics?.get(normalizedPath));
}
var PULL_SOURCE_KEY_SEPARATOR = "\0";
var BARE_PULL_SOURCE = "";
function pullSourceKey(normalizedPath, identifier) {
  return identifier === void 0 ? normalizedPath : `${normalizedPath}${PULL_SOURCE_KEY_SEPARATOR}${identifier}`;
}
function pullSourceKeysForPath(state4, normalizedPath) {
  const prefix = `${normalizedPath}${PULL_SOURCE_KEY_SEPARATOR}`;
  return [
    normalizedPath,
    ...[...state4.pullResultIds?.keys() ?? []].filter((key) => key.startsWith(prefix))
  ];
}
function pullSourcesFor(state4, normalizedPath) {
  if (!state4.documentPullDiagnosticsBySource) {
    state4.documentPullDiagnosticsBySource = /* @__PURE__ */ new Map();
  }
  let sources = state4.documentPullDiagnosticsBySource.get(normalizedPath);
  if (!sources) {
    sources = /* @__PURE__ */ new Map();
    state4.documentPullDiagnosticsBySource.set(normalizedPath, sources);
  }
  return sources;
}
function pullSourceDiagnostics(state4, normalizedPath, identifier) {
  const sources = state4.documentPullDiagnosticsBySource?.get(normalizedPath);
  const stored = sources?.get(identifier ?? BARE_PULL_SOURCE);
  if (stored)
    return stored;
  return sources && sources.size > 0 ? [] : state4.documentPullDiagnostics.get(normalizedPath) ?? [];
}
function storePullSourceDiagnostics(state4, normalizedPath, identifier, diagnostics) {
  const sources = pullSourcesFor(state4, normalizedPath);
  sources.set(identifier ?? BARE_PULL_SOURCE, diagnostics);
  state4.documentPullDiagnostics.set(normalizedPath, mergeDiagnosticLists(...sources.values()));
}
function pullGenerationFor(state4, normalizedPath) {
  return state4.pullGenerations?.get(normalizedPath) ?? 0;
}
function bumpPullGeneration(state4, normalizedPath) {
  if (!state4.pullGenerations)
    state4.pullGenerations = /* @__PURE__ */ new Map();
  state4.pullGenerations.set(normalizedPath, (state4.pullGenerations.get(normalizedPath) ?? 0) + 1);
}
function claimPullRequestSequence(state4, sourceKey) {
  if (!state4.pullRequestSequences)
    state4.pullRequestSequences = /* @__PURE__ */ new Map();
  const next = (state4.pullRequestSequences.get(sourceKey) ?? 0) + 1;
  state4.pullRequestSequences.set(sourceKey, next);
  return next;
}
function isNewestPullRequest(state4, sourceKey, sequence) {
  return (state4.pullRequestSequences?.get(sourceKey) ?? 0) === sequence;
}
function retirePullSource(state4, identifier) {
  const suffix = `${PULL_SOURCE_KEY_SEPARATOR}${identifier}`;
  for (const source of [state4.pullResultIds, state4.pullRequestSequences]) {
    if (!source)
      continue;
    for (const key of source.keys()) {
      if (key.endsWith(suffix))
        source.delete(key);
    }
  }
  for (const [normalizedPath, sources] of state4.documentPullDiagnosticsBySource ?? []) {
    if (!sources.delete(identifier))
      continue;
    state4.documentPullDiagnostics.set(normalizedPath, mergeDiagnosticLists(...sources.values()));
    bumpDiagnosticsVersion(state4, normalizedPath);
    state4.diagnosticEmitter.emit("diagnostics", normalizedPath);
  }
}
function pullDiagnosticSources(state4) {
  const identifiers = /* @__PURE__ */ new Set();
  for (const registration of state4.dynamicRegistrations?.values() ?? []) {
    if (registration.method !== "textDocument/diagnostic")
      continue;
    if (registration.identifier)
      identifiers.add(registration.identifier);
  }
  return [void 0, ...[...identifiers].sort((a, b) => a.localeCompare(b))];
}
function bumpDiagnosticsVersion(state4, normalizedPath) {
  state4.diagnosticsVersion += 1;
  state4.diagnosticsVersionsByPath?.set(normalizedPath, state4.diagnosticsVersion);
  countPublication(state4, normalizedPath);
}
function countPublication(state4, normalizedPath) {
  const counts = state4.publicationStoreCountsByPath;
  if (!counts)
    return;
  const { sent } = publicationCountsForPath(state4, normalizedPath);
  if (sent === 0)
    return;
  counts.set(normalizedPath, Math.min((counts.get(normalizedPath) ?? 0) + 1, sent));
}
function rebaselineForRulesRefresh(state4) {
  const counts = state4.publicationStoreCountsByPath;
  for (const [normalizedPath, published] of counts) {
    counts.set(normalizedPath, published - 1);
  }
  for (const normalizedPath of state4.pendingDiagnostics.keys()) {
    if (counts.has(normalizedPath) || publicationCountsForPath(state4, normalizedPath).sent === 0)
      continue;
    counts.set(normalizedPath, -1);
  }
  logLatency({
    type: "phase",
    phase: "lsp_rules_refreshed",
    filePath: state4.root,
    durationMs: 0,
    metadata: { serverId: state4.serverId, rebaselinedPaths: counts.size }
  });
}
function publicationCountsForPath(state4, normalizedPath) {
  const lastSent = state4.documentVersions.get(normalizedPath);
  return {
    sent: (lastSent === void 0 ? 0 : lastSent + 1) + (state4.expectedPublicationsBeyondSends?.get(normalizedPath) ?? 0),
    published: state4.publicationStoreCountsByPath?.get(normalizedPath) ?? 0
  };
}
function diagnosticsVersionForPath(state4, normalizedPath) {
  return state4.diagnosticsVersionsByPath?.get(normalizedPath) ?? 0;
}
function clearDiagnosticsForPath(state4, normalizedPath) {
  const legacy = state4;
  state4.pushDiagnostics?.delete(normalizedPath);
  const pending2 = state4.pendingDiagnostics?.get(normalizedPath);
  if (pending2) {
    clearTimeout(pending2);
    countPublication(state4, normalizedPath);
  }
  state4.pendingDiagnostics?.delete(normalizedPath);
  state4.pushDiagnosticTimestamps?.delete(normalizedPath);
  state4.documentPullDiagnostics?.delete(normalizedPath);
  state4.documentPullDiagnosticTimestamps?.delete(normalizedPath);
  state4.diagnosticDocVersions?.delete(normalizedPath);
  state4.diagnosticBindings?.delete(normalizedPath);
  state4.diagnosticsVersionsByPath?.delete(normalizedPath);
  for (const key of pullSourceKeysForPath(state4, normalizedPath)) {
    state4.pullResultIds?.delete(key);
  }
  state4.documentPullDiagnosticsBySource?.delete(normalizedPath);
  bumpPullGeneration(state4, normalizedPath);
  state4.workspacePullResultCache?.delete(normalizedPath);
  legacy.diagnostics?.delete(normalizedPath);
  legacy.diagnosticTimestamps?.delete(normalizedPath);
}
function logTypeScriptPullSettle(state4, normalizedPath, durationMs, pullSettleSource) {
  if (state4.serverId !== "typescript")
    return;
  const diagnostics = state4.documentPullDiagnostics.get(normalizedPath) ?? [];
  const elapsedSinceDidOpenMs = Math.max(0, Date.now() - (state4.documentOpenedAt.get(normalizedPath) ?? Date.now()));
  const diagnosticCodes = [
    ...new Set(diagnostics.map((diagnostic) => diagnostic.code).filter((code) => code !== void 0).map(String))
  ].slice(0, 8);
  const trackedVersion = state4.diagnosticsVersionsByPath?.get(normalizedPath);
  logLatency({
    type: "phase",
    phase: "lsp_typescript_diagnostic_sequence",
    filePath: normalizedPath,
    durationMs,
    metadata: {
      serverId: state4.serverId,
      outcome: "settled",
      launchVariant: state4.launchVariant ?? "unknown",
      publicationIndex: state4.diagnosticPublicationCounts.get(normalizedPath) ?? 0,
      version: trackedVersion ?? "pull-unversioned",
      diagnosticCount: diagnostics.length,
      diagnosticCodes,
      elapsedSinceDidOpenMs,
      settledReturn: true,
      settleSource: pullSettleSource
    }
  });
}
function scanSentContent(content) {
  let lfNewlineCount = 0;
  let index = 0;
  let start = 0;
  for (let i = 0; i < content.length; i++) {
    const code = content.charCodeAt(i);
    if (code !== 10 && code !== 13)
      continue;
    if (code === 10) {
      lfNewlineCount++;
    } else if (content.charCodeAt(i + 1) === 10) {
      lfNewlineCount++;
      i++;
    }
    index++;
    start = i + 1;
  }
  return { lfNewlineCount, lastLine: { index, start } };
}
function recordSentContent(state4, normalizedPath, version, content, coalescedCount = 0) {
  const scan = scanSentContent(content);
  const previous = state4.documentContentHashes.get(normalizedPath);
  if (previous && previous.version > version) {
    incrementDegradationCount({
      kind: "lsp-document-send-order",
      subject: `${state4.serverId}:${normalizedPath}`,
      reason: `recorded version ${version} after newer version ${previous.version}`
    });
    return;
  }
  if (previous?.text !== void 0) {
    state4.incrementalTextRetainedEntries = Math.max(0, (state4.incrementalTextRetainedEntries ?? 1) - 1);
    state4.incrementalTextRetainedBytes = Math.max(0, (state4.incrementalTextRetainedBytes ?? previous.text.length * 2) - previous.text.length * 2);
    state4.incrementalTextBearingPaths?.delete(normalizedPath);
  }
  state4.documentContentHashes.delete(normalizedPath);
  const hash = hashDiagnosticContent(content);
  state4.documentContentHashes.set(normalizedPath, {
    version,
    hash,
    changedAtMs: previous?.hash === hash ? previous.changedAtMs : Date.now(),
    openedAtMs: previous?.openedAtMs ?? Date.now(),
    openedHash: previous === void 0 ? hash : previous.openedHash,
    // #1669: retain the full text only for Incremental — the sole reader
    // (`buildContentChanges`) needs it to compute the NEXT change against
    // what the server last saw; Full/None never read this field.
    // #2066: `lastLine` is that reader's answer, already computed by the
    // scan above — it rides along with the text it describes.
    ...state4.syncKind === TEXT_DOCUMENT_SYNC_KIND_INCREMENTAL && {
      text: content,
      lastLine: scan.lastLine
    }
  });
  if (state4.syncKind === TEXT_DOCUMENT_SYNC_KIND_INCREMENTAL) {
    state4.incrementalTextRetainedEntries = (state4.incrementalTextRetainedEntries ?? 0) + 1;
    state4.incrementalTextRetainedBytes = (state4.incrementalTextRetainedBytes ?? 0) + content.length * 2;
    if (!state4.incrementalTextBearingPaths) {
      state4.incrementalTextBearingPaths = /* @__PURE__ */ new Set();
    }
    state4.incrementalTextBearingPaths.add(normalizedPath);
    while ((state4.incrementalTextRetainedEntries ?? 0) > MAX_INCREMENTAL_TEXT_RETAINED_ENTRIES || (state4.incrementalTextRetainedBytes ?? 0) > MAX_INCREMENTAL_TEXT_RETAINED_BYTES) {
      const oldestPath = state4.incrementalTextBearingPaths?.values().next().value;
      if (oldestPath === void 0)
        break;
      const binding = state4.documentContentHashes.get(oldestPath);
      state4.incrementalTextBearingPaths.delete(oldestPath);
      if (!binding || binding.text === void 0)
        continue;
      state4.documentContentHashes.set(oldestPath, {
        version: binding.version,
        hash: binding.hash,
        changedAtMs: binding.changedAtMs,
        openedAtMs: binding.openedAtMs,
        openedHash: binding.openedHash
      });
      state4.incrementalTextRetainedEntries = Math.max(0, (state4.incrementalTextRetainedEntries ?? 1) - 1);
      state4.incrementalTextRetainedBytes = Math.max(0, (state4.incrementalTextRetainedBytes ?? 0) - binding.text.length * 2);
    }
  }
  logLatency({
    type: "phase",
    phase: "lsp_document_send",
    filePath: normalizedPath,
    durationMs: 0,
    metadata: {
      version,
      contentLength: content.length,
      contentLineCount: scan.lfNewlineCount + 1,
      ...coalescedCount > 0 && { coalescedCount }
    }
  });
}
function buildContentChanges(state4, normalizedPath, content) {
  if (state4.syncKind !== TEXT_DOCUMENT_SYNC_KIND_INCREMENTAL) {
    return [{ text: content }];
  }
  const previous = state4.documentContentHashes.get(normalizedPath);
  if (previous?.text === void 0) {
    return [{ text: content }];
  }
  const previousText = previous.text;
  const lastLine = previous.lastLine ?? scanSentContent(previousText).lastLine;
  const lastLineText = previousText.slice(lastLine.start);
  return [
    {
      range: {
        start: { line: 0, character: 0 },
        end: {
          line: lastLine.index,
          character: convertCharacterOffset(state4.positionEncoding, lastLineText, lastLineText.length)
        }
      },
      text: content
    }
  ];
}
var DYNAMIC_OPERATION_METHOD_MAP = {
  "textDocument/definition": "definition",
  "textDocument/typeDefinition": "typeDefinition",
  "textDocument/declaration": "declaration",
  "textDocument/references": "references",
  "textDocument/hover": "hover",
  "textDocument/signatureHelp": "signatureHelp",
  "textDocument/documentSymbol": "documentSymbol",
  "workspace/symbol": "workspaceSymbol",
  "textDocument/codeAction": "codeAction",
  "textDocument/rename": "rename",
  "textDocument/implementation": "implementation",
  "textDocument/prepareCallHierarchy": "callHierarchy"
};
function applyDynamicCapabilities(state4) {
  const registrations = [...state4.dynamicRegistrations.values()];
  const registeredMethods = new Set(registrations.map((r) => r.method));
  const hasDynamicPull = registeredMethods.has("textDocument/diagnostic") || registeredMethods.has("workspace/diagnostic");
  if (hasDynamicPull) {
    state4.workspaceDiagnosticsSupport = {
      advertised: true,
      mode: "pull",
      // #1667: workspace-pull support is what the REGISTRATION declares. The
      // spec registers workspace pull as `registerOptions.workspaceDiagnostics`
      // on a `textDocument/diagnostic` registration - `workspace/diagnostic` is
      // not itself a registrable method - so reading the method name alone
      // missed every conforming server and this client never issued a
      // workspace pull for one. The method-name check stays as a fallback for
      // servers that register it as a method anyway.
      workspaceDiagnostics: registrations.some((r) => r.workspaceDiagnostics === true) || registeredMethods.has("workspace/diagnostic"),
      diagnosticProviderKind: "dynamic"
    };
  } else if (state4.staticDiagnosticsMode === "push-only" && state4.workspaceDiagnosticsSupport.diagnosticProviderKind === "dynamic") {
    state4.workspaceDiagnosticsSupport = {
      advertised: false,
      mode: "push-only",
      workspaceDiagnostics: false,
      diagnosticProviderKind: "none"
    };
  }
  for (const [method, key] of Object.entries(DYNAMIC_OPERATION_METHOD_MAP)) {
    if (registeredMethods.has(method)) {
      state4.operationSupport[key] = true;
    }
  }
}
function resolveConfigurationSection(initialization, section) {
  if (!initialization)
    return {};
  if (!section)
    return initialization;
  let cur = initialization;
  for (const part of section.split(".")) {
    if (typeof cur !== "object" || cur === null || !Object.hasOwn(cur, part)) {
      return {};
    }
    cur = cur[part];
  }
  return cur;
}
function setupIncomingHandlers(state4, initialization, onDiagnosticsPublished) {
  state4.connection.onNotification("textDocument/publishDiagnostics", (params) => {
    const publishReceivedAt = Date.now();
    const filePath = uriToPath(params.uri);
    const normalizedPath = normalizeMapKey(filePath);
    const docVersion = params.version;
    if (docVersion === void 0 && getStrategy(state4.serverId, state4.launchVariant).publishesOnClose) {
      return;
    }
    if (state4.closedDocuments?.has(normalizedPath)) {
      countPublication(state4, normalizedPath);
      return;
    }
    onDiagnosticsPublished?.(state4.serverId);
    const newDiags = normalizeLspDiagnostics(params.diagnostics || []);
    const fence = state4.diagnosticFences.get(normalizedPath);
    if (docVersion === void 0 && fence) {
      fence.dropped += 1;
      countPublication(state4, normalizedPath);
      if (getStrategy(state4.serverId, state4.launchVariant).emptyFirstPublish === "indexing" && !state4.emptyFirstPublishHoldSpent && newDiags.length === 0 && !state4.pushDiagnostics.has(normalizedPath) && !state4.pendingDiagnostics.has(normalizedPath)) {
        state4.emptyFirstPublishHoldSpent = true;
        logLatency({
          type: "phase",
          phase: "lsp_empty_first_publish_held",
          filePath: normalizedPath,
          durationMs: Math.max(0, publishReceivedAt - (state4.documentOpenedAt.get(normalizedPath) ?? publishReceivedAt)),
          metadata: {
            serverId: state4.serverId,
            emptyFirstPublish: "indexing",
            via: "fence-drop",
            pubVersion: "push-unversioned"
          }
        });
      }
      return;
    }
    if (PUB_DEBUG) {
      logExtension({
        subsystem: "lsp-pub",
        level: "debug",
        message: `server=${state4.serverId} pubVersion=${docVersion} docVersion=${state4.documentVersions?.get(normalizedPath)} diags=${newDiags.length}`
      });
    }
    const strategy = getStrategy(state4.serverId, state4.launchVariant);
    const isTypeScriptTelemetry = state4.serverId === "typescript";
    const publicationIndex = isTypeScriptTelemetry ? (state4.diagnosticPublicationCounts.get(normalizedPath) ?? 0) + 1 : 0;
    if (isTypeScriptTelemetry) {
      state4.diagnosticPublicationCounts.set(normalizedPath, publicationIndex);
    }
    const diagnosticCodes = isTypeScriptTelemetry ? [
      ...new Set(newDiags.map((diagnostic) => diagnostic.code).filter((code) => code !== void 0).map(String))
    ].slice(0, 8) : [];
    const logSequence = (settledReturn, settleSource, durationMs) => {
      if (state4.serverId !== "typescript")
        return;
      const elapsedSinceDidOpenMs = Math.max(0, Date.now() - (state4.documentOpenedAt.get(normalizedPath) ?? Date.now()));
      logLatency({
        type: "phase",
        phase: "lsp_typescript_diagnostic_sequence",
        filePath: normalizedPath,
        durationMs,
        metadata: {
          serverId: state4.serverId,
          outcome: settledReturn ? "settled" : "published",
          launchVariant: state4.launchVariant ?? "unknown",
          publicationIndex,
          version: docVersion ?? "push-unversioned",
          diagnosticCount: newDiags.length,
          diagnosticCodes,
          elapsedSinceDidOpenMs,
          settledReturn,
          settleSource
        }
      });
    };
    const recordDocVersion = () => {
      if (docVersion !== void 0) {
        state4.diagnosticDocVersions.set(normalizedPath, docVersion);
      }
      recordBinding();
    };
    const recordBinding = () => {
      if (docVersion === void 0) {
        state4.diagnosticBindings.delete(normalizedPath);
        return;
      }
      const sent = state4.documentContentHashes.get(normalizedPath);
      state4.diagnosticBindings.set(normalizedPath, {
        version: docVersion,
        contentHash: sent && sent.version === docVersion ? sent.hash : void 0
      });
    };
    const isSupersededPush = () => {
      if (docVersion === void 0)
        return false;
      const currentVersion = state4.documentVersions.get(normalizedPath);
      return currentVersion !== void 0 && docVersion < currentVersion;
    };
    if (strategy.emptyFirstPublish === "indexing" && !state4.emptyFirstPublishHoldSpent && newDiags.length === 0 && !state4.pushDiagnostics.has(normalizedPath) && !state4.pendingDiagnostics.has(normalizedPath)) {
      state4.emptyFirstPublishHoldSpent = true;
      logLatency({
        type: "phase",
        phase: "lsp_empty_first_publish_held",
        filePath: normalizedPath,
        durationMs: Math.max(0, publishReceivedAt - (state4.documentOpenedAt.get(normalizedPath) ?? publishReceivedAt)),
        metadata: {
          serverId: state4.serverId,
          emptyFirstPublish: strategy.emptyFirstPublish,
          // `pubVersion`, the `[lsp-pub]` trace's own field name for the
          // publish's LSP document version — not a lifecycle identity, and
          // not the retired glossary spelling (AGENTS.md "generation").
          pubVersion: docVersion ?? "push-unversioned"
        }
      });
      return;
    }
    if (strategy.seedFirstPush && !state4.pushDiagnostics.has(normalizedPath)) {
      if (isSupersededPush()) {
        countPublication(state4, normalizedPath);
        return;
      }
      state4.pushDiagnostics.set(normalizedPath, newDiags);
      state4.pushDiagnosticTimestamps.set(normalizedPath, Date.now());
      recordDocVersion();
      bumpDiagnosticsVersion(state4, normalizedPath);
      state4.diagnosticEmitter.emit("diagnostics", normalizedPath);
      logSequence(true, "first-push", 0);
      return;
    }
    logSequence(false, "publication", 0);
    const existingTimer = state4.pendingDiagnostics.get(normalizedPath);
    if (existingTimer) {
      clearTimeout(existingTimer);
      countPublication(state4, normalizedPath);
    }
    const timer = setTimeout(() => {
      state4.pendingDiagnostics.delete(normalizedPath);
      if (isSupersededPush()) {
        countPublication(state4, normalizedPath);
        return;
      }
      state4.pushDiagnostics.set(normalizedPath, newDiags);
      state4.pushDiagnosticTimestamps.set(normalizedPath, Date.now());
      recordDocVersion();
      bumpDiagnosticsVersion(state4, normalizedPath);
      state4.diagnosticEmitter.emit("diagnostics", normalizedPath);
      logSequence(true, "quiet-window", Date.now() - publishReceivedAt);
    }, strategy.debounceMs);
    state4.pendingDiagnostics.set(normalizedPath, timer);
  });
  state4.connection.onRequest("workspace/workspaceFolders", () => [
    { name: "workspace", uri: pathToFileURL2(state4.root).href }
  ]);
  state4.connection.onRequest("client/registerCapability", async (params) => {
    for (const reg of params?.registrations ?? []) {
      const options = reg.registerOptions;
      const commands = Array.isArray(options?.commands) ? options.commands.filter((cmd) => typeof cmd === "string") : void 0;
      if (reg.id && reg.method) {
        state4.dynamicRegistrations.set(reg.id, {
          method: reg.method,
          ...typeof options?.identifier === "string" && options.identifier ? { identifier: options.identifier } : {},
          ...typeof options?.workspaceDiagnostics === "boolean" ? { workspaceDiagnostics: options.workspaceDiagnostics } : {},
          ...commands ? { commands } : {}
        });
      }
      if (reg.method === "workspace/executeCommand" && commands) {
        for (const cmd of commands)
          state4.advertisedCommands.add(cmd);
      }
    }
    applyDynamicCapabilities(state4);
  });
  state4.connection.onRequest("client/unregisterCapability", async (params) => {
    const retiredIdentifiers = /* @__PURE__ */ new Set();
    for (const unreg of params?.unregisterations ?? []) {
      if (!unreg.id)
        continue;
      const registration = state4.dynamicRegistrations.get(unreg.id);
      state4.dynamicRegistrations.delete(unreg.id);
      if (registration?.method === "textDocument/diagnostic" && registration.identifier) {
        retiredIdentifiers.add(registration.identifier);
      }
    }
    const stillRegistered = new Set([...state4.dynamicRegistrations.values()].filter((r) => r.method === "textDocument/diagnostic").map((r) => r.identifier));
    for (const identifier of retiredIdentifiers) {
      if (!stillRegistered.has(identifier)) {
        retirePullSource(state4, identifier);
      }
    }
    applyDynamicCapabilities(state4);
  });
  state4.connection.onRequest("workspace/applyEdit", async (params) => {
    if (state4.serverEditsAllowed <= 0 || !params?.edit) {
      return { applied: false, failureReason: "edit not solicited" };
    }
    const context = state4.activeMutationContext;
    const telemetryContext = context ?? {
      cwd: state4.root,
      correlationId: newLspMutationCorrelationId(),
      tool: "lsp-workspace-applyEdit",
      source: "lsp-execute-command"
    };
    try {
      await applyWorkspaceEdit(params.edit, state4.root, {
        positionEncoding: state4.positionEncoding,
        documentVersions: state4.documentVersions,
        mutationContext: telemetryContext
      });
      return { applied: true };
    } catch (err) {
      return {
        applied: false,
        failureReason: err instanceof Error ? err.message : String(err)
      };
    }
  });
  state4.connection.onRequest("workspace/configuration", async (params) => {
    const items = params?.items ?? [];
    return items.map((item) => resolveConfigurationSection(initialization, item?.section));
  });
  state4.connection.onRequest("window/workDoneProgress/create", async () => {
  });
  state4.connection.onNotification("semgrep/rulesRefreshed", () => rebaselineForRulesRefresh(state4));
  let refreshRepullRunning = false;
  let refreshRepullRerunRequested = false;
  const runRefreshRepullPool = async () => {
    do {
      refreshRepullRerunRequested = false;
      const toRepull = state4.workspaceDiagnosticsSupport.mode === "pull" ? [...state4.openDocuments] : [];
      if (toRepull.length > 0) {
        try {
          await mapWithConcurrency(toRepull, REFRESH_REPULL_CONCURRENCY, async (normalizedPath) => {
            const uri = state4.openDocumentUris?.get(normalizedPath);
            const filePath = uri ? uriToPath(uri) : normalizedPath;
            await clientRequestPullDiagnostics(state4, filePath);
          });
        } catch (err) {
          incrementDegradationCount({
            kind: "lsp-pull-unconfirmed",
            subject: state4.serverId,
            reason: `refresh re-pull threw: ${err instanceof Error ? err.message : String(err)}`
          });
        }
      }
    } while (refreshRepullRerunRequested);
    refreshRepullRunning = false;
  };
  state4.connection.onRequest("workspace/diagnostic/refresh", async () => {
    state4.workspacePullResultCache.clear();
    clearAllWorkspaceDiagnosticsCaches();
    clearWorkspaceDiagnosticsCacheAtAndAbove(state4.root);
    for (const normalizedPath of state4.openDocuments) {
      clearDiagnosticsForPath(state4, normalizedPath);
    }
    if (state4.workspaceDiagnosticsSupport.mode === "pull" && state4.openDocuments.size > 0) {
      if (refreshRepullRunning) {
        refreshRepullRerunRequested = true;
      } else {
        refreshRepullRunning = true;
        setImmediate(() => {
          void runRefreshRepullPool();
        });
      }
    }
    return null;
  });
}
function markExitedIfUnset(state4) {
  if (state4.exitedAt === void 0) {
    state4.exitedAt = Date.now();
  }
}
function setupConnectionLifecycle(state4, recentStderr) {
  state4.connection.onError(([error]) => {
    state4.lastError = error instanceof Error ? error : new Error(String(error));
    state4.isConnected = false;
    state4.isDestroyed = true;
    markExitedIfUnset(state4);
    disposeClientConnection(state4);
  });
  state4.connection.onClose(() => {
    state4.isConnected = false;
    state4.isDestroyed = true;
    markExitedIfUnset(state4);
    disposeClientConnection(state4);
  });
  state4.lspProcess.process.on("exit", (code, signal) => {
    const wasIntentional = state4.shutdownRequested;
    state4.isConnected = false;
    state4.isDestroyed = true;
    markExitedIfUnset(state4);
    disposeClientConnection(state4);
    if (!wasIntentional) {
      logLatency({
        type: "phase",
        phase: "lsp_server_unexpected_exit",
        filePath: state4.root,
        durationMs: 0,
        metadata: {
          serverId: state4.serverId,
          pid: state4.lspProcess.pid,
          exitCode: code ?? null,
          exitSignal: signal ?? null,
          stderrTail: recentStderr(20)
        }
      });
    }
  });
  state4.lspProcess.process.on("close", (code, signal) => {
    if (state4.shutdownRequested)
      return;
    try {
      const stderrTail = recentStderr(20);
      incrementDegradationCount({
        kind: "lsp-server-unexpected-close",
        subject: state4.serverId,
        reason: `closed unprompted: code=${code ?? "none"} signal=${signal ?? "none"} stderr=${stderrTail.length > 0 ? `present(${stderrTail.length}b)` : "empty"} root=${state4.root}`
      });
    } catch {
    }
  });
}
var PULL_RACE_BACKSTOP_MARGIN_MS = 25;
async function clientRequestPullDiagnostics(state4, filePath, budgetMs = PULL_REQUEST_TIMEOUT_MS) {
  if (!isClientAlive(state4))
    return { status: "unavailable" };
  const sources = pullDiagnosticSources(state4);
  if (sources.length === 1) {
    return aggregatePullOutcomes(state4, filePath, [
      await pullDiagnosticSource(state4, filePath, budgetMs, void 0)
    ]);
  }
  const attempts = sources.map((identifier) => pullDiagnosticSource(state4, filePath, budgetMs, identifier));
  const settled = await raceToCompletion(attempts, (results) => results.some((r) => r.status === "found" && r.primaryCount > 0), {
    // No graceMs: finalize the instant a source answers for this file.
    // The per-request `withTimeout` inside each attempt is the real bound;
    // this deadline is only a backstop, so it sits just past it.
    timeoutMs: Math.max(1, Math.min(PULL_REQUEST_TIMEOUT_MS, budgetMs)) + PULL_RACE_BACKSTOP_MARGIN_MS
  });
  return aggregatePullOutcomes(state4, filePath, settled);
}
function aggregatePullOutcomes(state4, filePath, outcomes) {
  const found = outcomes.filter((o) => o.status === "found");
  if (found.length > 0) {
    const normalizedPath = normalizeMapKey(filePath);
    const unionCount = state4.documentPullDiagnostics.get(normalizedPath)?.length ?? 0;
    return {
      status: "found",
      count: Math.max(unionCount, ...found.map((o) => o.count))
    };
  }
  if (outcomes.some((o) => o.status === "unavailable")) {
    return { status: "unavailable" };
  }
  return outcomes.some((o) => o.status === "clean") ? { status: "clean" } : { status: "unavailable" };
}
async function pullDiagnosticSource(state4, filePath, budgetMs, identifier) {
  if (!isClientAlive(state4))
    return { status: "unavailable" };
  const normalizedPath = normalizeMapKey(filePath);
  if (budgetMs < PULL_MIN_USABLE_BUDGET_MS) {
    emitBounded("lsp_pull_skipped_budget_exhausted", `${state4.serverId}::${pullSourceKey(normalizedPath, identifier)}`, {
      type: "phase",
      filePath: normalizedPath,
      durationMs: 0,
      metadata: {
        identifier: identifier ?? "bare",
        remainingBudgetMs: budgetMs,
        server: state4.serverId
      }
    }, {
      ledgerKind: "lsp-pull-skipped-budget-exhausted",
      reason: `pull skipped on ${state4.serverId}: budget already exhausted (${budgetMs}ms remaining)`
    });
    return { status: "unavailable" };
  }
  const uri = pathToFileURL2(filePath).href;
  const sourceKey = pullSourceKey(normalizedPath, identifier);
  if (state4.abandonedPullRequests?.has(sourceKey)) {
    return { status: "unavailable" };
  }
  const previousResultId = state4.pullResultIds.get(sourceKey);
  const generation = pullGenerationFor(state4, normalizedPath);
  const requestSequence = claimPullRequestSequence(state4, sourceKey);
  const requestStartedAt = Date.now();
  const effectiveTimeoutMs = Math.max(1, Math.min(PULL_REQUEST_TIMEOUT_MS, budgetMs));
  const pullAbort = new AbortController();
  const pullSettlement = { cancelled: false };
  const requestPromise = safeSendRequest(state4.connection, "textDocument/diagnostic", {
    textDocument: { uri },
    // #1667: name the source this request is for, so the server answers
    // from that source instead of its default one.
    ...identifier !== void 0 && { identifier },
    ...previousResultId !== void 0 && { previousResultId }
  }, pullAbort.signal, pullSettlement);
  try {
    const report = await withTimeout(requestPromise, effectiveTimeoutMs);
    if (!report) {
      recordPullFailure(state4, "textDocument/diagnostic", new Error("empty response"));
      return { status: "unavailable" };
    }
    const now = Date.now();
    const sentHash = state4.documentContentHashes.get(normalizedPath)?.hash;
    if (pullGenerationFor(state4, normalizedPath) !== generation || !isNewestPullRequest(state4, sourceKey, requestSequence)) {
      return { status: "unavailable" };
    }
    let primaryCount;
    if (report.kind === "unchanged") {
      primaryCount = pullSourceDiagnostics(state4, normalizedPath, identifier).length;
      state4.documentPullDiagnosticTimestamps.set(normalizedPath, now);
    } else {
      const primaryItems = normalizeLspDiagnostics(report.items ?? []);
      storePullSourceDiagnostics(state4, normalizedPath, identifier, primaryItems);
      state4.documentPullDiagnosticTimestamps.set(normalizedPath, now);
      bumpDiagnosticsVersion(state4, normalizedPath);
      state4.diagnosticBindings.set(normalizedPath, { contentHash: sentHash });
      primaryCount = primaryItems.length;
    }
    let totalCount = primaryCount;
    if (report.resultId !== void 0) {
      state4.pullResultIds.set(sourceKey, report.resultId);
    } else {
      state4.pullResultIds.delete(sourceKey);
    }
    if (report.relatedDocuments) {
      for (const [relatedUri, related] of Object.entries(report.relatedDocuments)) {
        const relatedPath = uriToPath(relatedUri);
        const relatedNormalized = normalizeMapKey(relatedPath);
        if (related?.kind === "unchanged") {
          totalCount += pullSourceDiagnostics(state4, relatedNormalized, identifier).length;
          state4.documentPullDiagnosticTimestamps.set(relatedNormalized, now);
        } else {
          const relatedItems = normalizeLspDiagnostics(related?.items ?? []);
          storePullSourceDiagnostics(state4, relatedNormalized, identifier, relatedItems);
          state4.documentPullDiagnosticTimestamps.set(relatedNormalized, now);
          state4.diagnosticBindings.delete(relatedNormalized);
          totalCount += relatedItems.length;
        }
        if (related?.resultId !== void 0) {
          state4.pullResultIds.set(pullSourceKey(relatedNormalized, identifier), related.resultId);
        }
      }
    }
    state4.diagnosticEmitter.emit("diagnostics", normalizedPath);
    return totalCount > 0 ? { status: "found", count: totalCount, primaryCount } : { status: "clean" };
  } catch (err) {
    if (isPullTimeoutError(err, effectiveTimeoutMs)) {
      trackAbandonedPullRequest(state4, sourceKey, requestPromise);
      pullAbort.abort();
      recordPullTimeoutTelemetry({
        scope: normalizedPath,
        identifier,
        effectiveBudgetMs: effectiveTimeoutMs,
        hadPreviousResultId: previousResultId !== void 0,
        elapsedMs: Date.now() - requestStartedAt,
        server: state4.serverId
      });
      armLateAnswerTelemetry({
        requestPromise,
        scope: normalizedPath,
        identifier,
        subject: sourceKey,
        requestStartedAt,
        server: state4.serverId,
        settlement: pullSettlement
      });
    }
    recordPullFailure(state4, "textDocument/diagnostic", err);
    return { status: "unavailable" };
  }
}
function trackAbandonedPullRequest(state4, sourceKey, requestPromise) {
  if (!state4.abandonedPullRequests)
    state4.abandonedPullRequests = /* @__PURE__ */ new Map();
  state4.abandonedPullRequests.set(sourceKey, requestPromise);
  const release = () => {
    if (state4.abandonedPullRequests?.get(sourceKey) === requestPromise) {
      state4.abandonedPullRequests.delete(sourceKey);
    }
  };
  requestPromise.then(release, release);
}
function isPullTimeoutError(err, timeoutMs) {
  return err instanceof Error && err.message === `Timeout after ${timeoutMs}ms`;
}
function recordPullTimeoutTelemetry(args) {
  emitBounded("lsp_pull_diagnostic_timeout", `${args.server}::${args.scope}::${args.identifier ?? "bare"}`, {
    type: "phase",
    filePath: args.scope,
    durationMs: args.elapsedMs,
    metadata: {
      identifier: args.identifier ?? "bare",
      effectiveBudgetMs: args.effectiveBudgetMs,
      hadPreviousResultId: args.hadPreviousResultId,
      server: args.server
    }
  }, {
    ledgerKind: "lsp-pull-diagnostic-timeout",
    reason: `pull timeout on ${args.server} after ${args.elapsedMs}ms (budget ${args.effectiveBudgetMs}ms)`
  });
}
function armLateAnswerTelemetry(args) {
  args.requestPromise.then(() => {
    if (args.settlement.cancelled)
      return;
    try {
      const elapsedMs = Date.now() - args.requestStartedAt;
      emitBounded("lsp_pull_late_answer_discarded", args.subject, {
        type: "phase",
        filePath: args.scope,
        durationMs: elapsedMs,
        metadata: { identifier: args.identifier ?? "bare" }
      }, {
        ledgerKind: "lsp-pull-late-answer",
        reason: `late pull answer discarded after ${elapsedMs}ms`
      });
    } catch {
    }
  }, (err) => {
    try {
      const elapsedMs = Date.now() - args.requestStartedAt;
      const candidate = err;
      const code = typeof candidate?.code === "number" || typeof candidate?.code === "string" ? candidate.code : void 0;
      emitBounded(
        "lsp_pull_late_rejection",
        // #1774 review: prefix the server, same reason the timeout kind
        // does (#1771). The workspace call site's `subject` is the bare
        // `WORKSPACE_PULL_SCOPE` constant — without the server prefix,
        // two servers' abandoned-workspace-pull rejections would collapse
        // into one ledger subject and hide which server is storming.
        `${args.server}::${args.subject}`,
        {
          type: "phase",
          filePath: args.scope,
          durationMs: elapsedMs,
          metadata: {
            identifier: args.identifier ?? "bare",
            server: args.server,
            ...code !== void 0 && { code }
          }
        },
        {
          ledgerKind: "lsp-pull-late-rejection",
          reason: `late pull rejection ${elapsedMs}ms after timeout${code !== void 0 ? ` (code ${code})` : ""}`
        }
      );
    } catch {
    }
  });
}
var PULL_FAILURE_HISTORY_LIMIT = 10;
function recordPullFailure(state4, method, error) {
  const candidate = error;
  const message = typeof candidate.message === "string" ? candidate.message : "";
  const unsupportedMessage = /^(?:method not found|unknown method|unsupported method)(?::|$)/i;
  if (candidate.code === -32601 || candidate.code === "-32601" || unsupportedMessage.test(message.trim()))
    return;
  state4.pullFailureHistory.push({
    timestamp: Date.now(),
    method,
    ...typeof candidate.code === "number" || typeof candidate.code === "string" ? { code: candidate.code } : {},
    message: typeof candidate.message === "string" ? candidate.message : String(error)
  });
  if (state4.pullFailureHistory.length > PULL_FAILURE_HISTORY_LIMIT) {
    state4.pullFailureHistory.splice(0, state4.pullFailureHistory.length - PULL_FAILURE_HISTORY_LIMIT);
  }
}
async function clientRequestWorkspaceDiagnostics(state4, budgetMs) {
  if (!isClientAlive(state4))
    return void 0;
  if (!state4.workspaceDiagnosticsSupport.workspaceDiagnostics)
    return void 0;
  if (state4.abandonedPullRequests?.has(WORKSPACE_PULL_SCOPE))
    return void 0;
  const previousResultIds = Array.from(state4.workspacePullResultCache.values()).map((entry) => ({ uri: entry.uri, value: entry.resultId }));
  if (budgetMs < PULL_MIN_USABLE_BUDGET_MS) {
    emitBounded("lsp_pull_skipped_budget_exhausted", `${state4.serverId}::${WORKSPACE_PULL_SCOPE}`, {
      type: "phase",
      filePath: WORKSPACE_PULL_SCOPE,
      durationMs: 0,
      metadata: {
        identifier: "bare",
        remainingBudgetMs: budgetMs,
        server: state4.serverId
      }
    }, {
      ledgerKind: "lsp-pull-skipped-budget-exhausted",
      reason: `workspace pull skipped on ${state4.serverId}: budget already exhausted (${budgetMs}ms remaining)`
    });
    return void 0;
  }
  const workspacePullStartedAt = Date.now();
  const workspacePullTimeoutMs = Math.max(1, budgetMs);
  const workspacePullAbort = new AbortController();
  const workspacePullSettlement = { cancelled: false };
  const workspaceRequestPromise = safeSendRequest(state4.connection, "workspace/diagnostic", { previousResultIds }, workspacePullAbort.signal, workspacePullSettlement);
  try {
    const report = await withTimeout(workspaceRequestPromise, workspacePullTimeoutMs);
    if (!report || !Array.isArray(report.items))
      return void 0;
    const out = [];
    const fallbackPullDeadline = Date.now() + Math.max(1, budgetMs);
    for (const item of report.items) {
      if (!item?.uri)
        continue;
      const filePath = uriToPath(item.uri);
      const normalizedPath = normalizeMapKey(filePath);
      if (item.kind === "unchanged") {
        const prior = state4.workspacePullResultCache.get(normalizedPath);
        if (!prior) {
          const remainingMs = fallbackPullDeadline - Date.now();
          if (remainingMs <= 0) {
            incrementDegradationCount({
              kind: "lsp-pull-unconfirmed",
              subject: state4.serverId,
              reason: "unchanged report with no workspacePullResultCache basis; the shared fallback-pull deadline was already exhausted by earlier files this sweep"
            });
            continue;
          }
          const outcome = await clientRequestPullDiagnostics(state4, filePath, remainingMs);
          if (outcome.status === "found") {
            out.push({
              filePath,
              diagnostics: state4.documentPullDiagnostics.get(normalizedPath) ?? [],
              contentHash: state4.diagnosticBindings.get(normalizedPath)?.contentHash
            });
          } else if (outcome.status === "unavailable") {
            incrementDegradationCount({
              kind: "lsp-pull-unconfirmed",
              subject: state4.serverId,
              reason: "unchanged report with no workspacePullResultCache basis, and the per-file fallback pull was unavailable"
            });
          }
          continue;
        }
        if (item.resultId !== void 0) {
          state4.workspacePullResultCache.set(normalizedPath, {
            ...prior,
            resultId: item.resultId
          });
        }
        out.push({
          filePath,
          diagnostics: prior.diagnostics,
          contentHash: prior.contentHash
        });
        continue;
      }
      const diagnostics = normalizeLspDiagnostics(item.items ?? []);
      const sent = state4.openDocuments.has(normalizedPath) ? state4.documentContentHashes.get(normalizedPath) : void 0;
      const contentHash2 = sent !== void 0 && sent.version === item.version ? sent.hash : void 0;
      if (item.resultId !== void 0) {
        if (state4.workspacePullResultCache.size >= WORKSPACE_PULL_RESULT_CACHE_MAX) {
          state4.workspacePullResultCache.clear();
        }
        state4.workspacePullResultCache.set(normalizedPath, {
          uri: item.uri,
          resultId: item.resultId,
          diagnostics,
          contentHash: contentHash2
        });
      } else {
        state4.workspacePullResultCache.delete(normalizedPath);
      }
      out.push({ filePath, diagnostics, contentHash: contentHash2 });
    }
    return out;
  } catch (err) {
    if (isPullTimeoutError(err, workspacePullTimeoutMs)) {
      trackAbandonedPullRequest(state4, WORKSPACE_PULL_SCOPE, workspaceRequestPromise);
      workspacePullAbort.abort();
      recordPullTimeoutTelemetry({
        scope: WORKSPACE_PULL_SCOPE,
        identifier: void 0,
        effectiveBudgetMs: workspacePullTimeoutMs,
        hadPreviousResultId: previousResultIds.length > 0,
        elapsedMs: Date.now() - workspacePullStartedAt,
        server: state4.serverId
      });
      armLateAnswerTelemetry({
        requestPromise: workspaceRequestPromise,
        scope: WORKSPACE_PULL_SCOPE,
        identifier: void 0,
        subject: WORKSPACE_PULL_SCOPE,
        requestStartedAt: workspacePullStartedAt,
        server: state4.serverId,
        settlement: workspacePullSettlement
      });
    }
    recordPullFailure(state4, "workspace/diagnostic", err);
    return void 0;
  }
}
async function clientWaitForDiagnostics(state4, filePath, timeoutMs, options = {}) {
  const normalizedPath = normalizeMapKey(filePath);
  const minVersion = options.minVersion;
  const pullSettleSource = options.pullSettleSource ?? "pull";
  const hasFreshDiagnostics = () => minVersion === void 0 || diagnosticsVersionForPath(state4, normalizedPath) > minVersion;
  const isVersionStale = () => {
    const cachedVersion = state4.diagnosticDocVersions?.get(normalizedPath);
    if (cachedVersion === void 0)
      return false;
    const currentVersion = state4.documentVersions?.get(normalizedPath);
    return currentVersion !== void 0 && cachedVersion < currentVersion;
  };
  if (state4.workspaceDiagnosticsSupport.mode === "pull") {
    const pullSettleStartedAt = Date.now();
    let outcome = await clientRequestPullDiagnostics(state4, filePath, timeoutMs);
    if (outcome.status === "found") {
      logTypeScriptPullSettle(state4, normalizedPath, Date.now() - pullSettleStartedAt, pullSettleSource);
      return;
    }
    let sawClean = outcome.status === "clean";
    const strategy = getStrategy(state4.serverId, state4.launchVariant);
    const retryBudgetMs = strategy.pullRetryBudgetMs > 0 ? Math.min(timeoutMs, strategy.pullRetryBudgetMs) : 0;
    const startedAt = Date.now();
    while (outcome.status !== "found" && Date.now() - startedAt < retryBudgetMs) {
      await new Promise((resolve9) => setTimeout(resolve9, PULL_DIAGNOSTICS_RETRY_INTERVAL_MS));
      outcome = await clientRequestPullDiagnostics(state4, filePath, Math.max(0, retryBudgetMs - (Date.now() - startedAt)));
      if (outcome.status === "clean")
        sawClean = true;
    }
    if (options.pullOnly) {
      if (outcome.status === "found" || sawClean) {
        logTypeScriptPullSettle(state4, normalizedPath, Date.now() - pullSettleStartedAt, pullSettleSource);
      }
      return;
    }
    if (outcome.status === "found" || sawClean) {
      logTypeScriptPullSettle(state4, normalizedPath, Date.now() - pullSettleStartedAt, pullSettleSource);
      return;
    }
  }
  if (hasFreshDiagnostics() && !isVersionStale() && getMergedDiagnosticsForPath(state4, normalizedPath).length > 0) {
    return;
  }
  return new Promise((resolve9) => {
    let debounceTimer;
    const onDiagnostics = (fp) => {
      if (normalizeMapKey(fp) !== normalizedPath)
        return;
      if (!hasFreshDiagnostics() || isVersionStale())
        return;
      if (debounceTimer)
        clearTimeout(debounceTimer);
      const strategy = getStrategy(state4.serverId, state4.launchVariant);
      const hit = state4.pushDiagnosticTimestamps.get(normalizedPath);
      const timeSincePush = hit ? Date.now() - hit : Infinity;
      const remaining = Math.max(0, strategy.debounceMs - timeSincePush);
      debounceTimer = setTimeout(() => {
        state4.diagnosticEmitter.off("diagnostics", onDiagnostics);
        clearTimeout(timeout);
        resolve9();
      }, remaining);
    };
    state4.diagnosticEmitter.on("diagnostics", onDiagnostics);
    const timeout = setTimeout(() => {
      if (debounceTimer)
        clearTimeout(debounceTimer);
      state4.diagnosticEmitter.off("diagnostics", onDiagnostics);
      resolve9();
    }, timeoutMs);
  });
}
function handleNotifyExternalChange(state4, filePath, type) {
  if (!isClientAlive(state4))
    return;
  const normalizedPath = normalizeMapKey(filePath);
  const uri = state4.openDocumentUris?.get(normalizedPath) ?? pathToFileURL2(filePath).href;
  state4.watchQueue.enqueue(uri, type);
}
function expectSaveRescan(state4, normalizedPath) {
  if (!getStrategy(state4.serverId, state4.launchVariant).rescansOnSave)
    return;
  const beyond = state4.expectedPublicationsBeyondSends;
  beyond?.set(normalizedPath, (beyond.get(normalizedPath) ?? 0) + 1);
}
async function sendDidSave(state4, normalizedPath, uri, content) {
  const save = state4.saveOptions;
  if (!save)
    return;
  if (!isClientAlive(state4))
    return;
  expectSaveRescan(state4, normalizedPath);
  const limit = save.includeText ? exceedsLspSyncLimits(content) : { tooLarge: false, reason: "" };
  if (limit.tooLarge) {
    recordDegradationOnce({
      kind: "lsp-did-save-text-omitted",
      subject: state4.serverId,
      reason: limit.reason
    });
  }
  await safeSendNotification(state4.connection, "textDocument/didSave", {
    textDocument: { uri },
    ...save.includeText && !limit.tooLarge ? { text: content } : {}
  });
}
async function sendDidSaveForHeldDocument(state4, normalizedPath) {
  if (!state4.saveOptions || !isClientAlive(state4))
    return;
  if (!state4.openDocuments.has(normalizedPath))
    return;
  const uri = state4.openDocumentUris?.get(normalizedPath);
  if (uri === void 0)
    return;
  expectSaveRescan(state4, normalizedPath);
  try {
    await safeSendNotification(state4.connection, "textDocument/didSave", {
      textDocument: { uri }
    });
  } catch {
  }
}
async function handleNotifyOpenOnce(state4, filePath, content, languageId, preserveDiagnostics = false, silent = false, coalescedCount = 0, saved = false) {
  if (!isClientAlive(state4))
    return false;
  const normalizedPath = normalizeMapKey(filePath);
  const uri = state4.openDocumentUris?.get(normalizedPath) ?? pathToFileURL2(filePath).href;
  if (state4.openDocuments.has(normalizedPath) || state4.pendingOpens.has(normalizedPath)) {
    const version = (state4.documentVersions.get(normalizedPath) ?? 0) + 1;
    state4.documentVersions.set(normalizedPath, version);
    if (!preserveDiagnostics) {
      clearDiagnosticsForPath(state4, normalizedPath);
    }
    if (getStrategy(state4.serverId, state4.launchVariant).reopenOnResync) {
      await safeSendNotification(state4.connection, "textDocument/didClose", {
        textDocument: { uri }
      });
      state4.openDocuments.delete(normalizedPath);
      state4.openDocumentUris?.delete(normalizedPath);
      state4.documentVersions.set(normalizedPath, version);
      state4.documentOpenedAt.set(normalizedPath, Date.now());
      state4.diagnosticPublicationCounts.set(normalizedPath, 0);
      if (!isClientAlive(state4))
        return false;
      const reopenSent = await safeSendNotification(state4.connection, "textDocument/didOpen", { textDocument: { uri, languageId, version, text: content } });
      if (reopenSent)
        recordSentContent(state4, normalizedPath, version, content, coalescedCount);
      state4.openDocuments.add(normalizedPath);
      state4.openDocumentUris?.set(normalizedPath, uri);
      if (saved && reopenSent)
        await sendDidSave(state4, normalizedPath, uri, content);
      return reopenSent;
    }
    const changeSent = await sendFenced(state4, normalizedPath, uri, "textDocument/didChange", {
      textDocument: { uri, version },
      contentChanges: buildContentChanges(state4, normalizedPath, content)
    });
    if (changeSent)
      recordSentContent(state4, normalizedPath, version, content, coalescedCount);
    if (saved && changeSent)
      await sendDidSave(state4, normalizedPath, uri, content);
    return changeSent;
  }
  if (await closedAndGone(state4, filePath, normalizedPath))
    return false;
  state4.pendingOpens.add(normalizedPath);
  state4.documentVersions.set(normalizedPath, 0);
  state4.documentOpenedAt.set(normalizedPath, Date.now());
  state4.diagnosticPublicationCounts.set(normalizedPath, 0);
  clearDiagnosticsForPath(state4, normalizedPath);
  if (!state4.expectedPublicationsBeyondSends?.has(normalizedPath))
    state4.publicationStoreCountsByPath?.delete(normalizedPath);
  if (!silent) {
    let fileExists = true;
    try {
      await access(filePath);
    } catch {
      fileExists = false;
    }
    state4.watchQueue.enqueue(uri, fileExists ? 2 : 1);
  }
  if (!isClientAlive(state4))
    return false;
  const openSent = await sendFenced(state4, normalizedPath, uri, "textDocument/didOpen", { textDocument: { uri, languageId, version: 0, text: content } });
  if (openSent)
    recordSentContent(state4, normalizedPath, 0, content, coalescedCount);
  state4.pendingOpens.delete(normalizedPath);
  state4.openDocuments.add(normalizedPath);
  state4.closedDocuments?.delete(normalizedPath);
  state4.openDocumentUris?.set(normalizedPath, uri);
  if (saved && openSent)
    await sendDidSave(state4, normalizedPath, uri, content);
  void probeTsserverProjectIdentity({
    serverId: state4.serverId,
    launchVariant: state4.launchVariant,
    clientRoot: state4.root,
    file: filePath,
    normalizedFile: normalizedPath,
    probedFiles: state4.projectIdentityProbedFiles ?? (state4.projectIdentityProbedFiles = /* @__PURE__ */ new Set()),
    commandChannel: {
      executeCommand: (command, args) => runReadOnlyServerCommand(state4, command, args)
    }
  });
  return openSent;
}
function enqueueDocumentNotify(state4, normalizedPath, run, saved = false, readStamp, close = false) {
  let queue = state4.notifyChangeQueues.get(normalizedPath);
  if (!queue) {
    queue = { running: false };
    state4.notifyChangeQueues.set(normalizedPath, queue);
  }
  return new Promise((resolve9, reject) => {
    if (queue.closing && !close) {
      resolve9(false);
      return;
    }
    const previous = queue?.pending;
    const waiters = previous?.waiters ?? [];
    if (close) {
      for (const waiter of waiters)
        waiter.stale = true;
      queue.closing = true;
    }
    const lastSent = state4.sentReadStamps.get(normalizedPath);
    const before = (a, b) => a !== void 0 && b !== void 0 && a < b;
    const stale = previous !== void 0 && (before(readStamp, previous.readStamp) || before(readStamp, lastSent));
    const heldStamp = before(previous?.readStamp, lastSent) ? void 0 : previous?.readStamp;
    waiters.push({ resolve: resolve9, reject, stale });
    queue.pending = {
      run: stale ? previous.run : run,
      waiters,
      coalescedCount: (previous?.coalescedCount ?? 0) + (previous ? 1 : 0),
      saved: saved || previous?.saved === true,
      // An unstamped replacement cannot say how old its bytes are; keeping the
      // pending stamp keeps an older read arriving next out (#3481 round 1).
      // A close carries no content, so it never inherits a stamp: the
      // runner's stale-read drop must not drop the didClose (#3477).
      readStamp: close ? void 0 : stale ? previous.readStamp : readStamp ?? heldStamp
    };
    if (queue.running)
      return;
    queue.running = true;
    void Promise.resolve().then(async () => {
      try {
        for (; ; ) {
          const next = queue.pending;
          if (!next)
            break;
          queue.pending = void 0;
          const lastSent2 = state4.sentReadStamps.get(normalizedPath);
          if (next.readStamp !== void 0 && lastSent2 !== void 0 && next.readStamp < lastSent2) {
            if (next.saved)
              await sendDidSaveForHeldDocument(state4, normalizedPath);
            for (const waiter of next.waiters)
              waiter.resolve(false);
            continue;
          }
          if (next.readStamp !== void 0)
            state4.sentReadStamps.set(normalizedPath, next.readStamp);
          try {
            const sent = await next.run(next.coalescedCount, next.saved);
            for (const waiter of next.waiters)
              waiter.resolve(sent !== false && !waiter.stale);
          } catch (error) {
            for (const waiter of next.waiters)
              waiter.reject(error);
          }
        }
      } finally {
        queue.running = false;
        if (!queue.pending && state4.notifyChangeQueues.get(normalizedPath) === queue) {
          state4.notifyChangeQueues.delete(normalizedPath);
        }
      }
    });
  });
}
function cancelDocumentNotifyQueues(state4) {
  for (const queue of state4.notifyChangeQueues.values()) {
    for (const waiter of queue.pending?.waiters ?? [])
      waiter.resolve(false);
    queue.pending = void 0;
  }
  state4.notifyChangeQueues.clear();
}
function handleNotifyOpen(state4, filePath, content, languageId, preserveDiagnostics = false, silent = false, saved = false, readStamp) {
  const normalizedPath = normalizeMapKey(filePath);
  return enqueueDocumentNotify(state4, normalizedPath, (coalescedCount, queuedSaved) => handleNotifyOpenOnce(state4, filePath, content, languageId, preserveDiagnostics, silent, coalescedCount, queuedSaved), saved, readStamp);
}
async function handleNotifyChangeOnce(state4, filePath, content, normalizedPath, coalescedCount = 0, saved = false) {
  if (!isClientAlive(state4))
    return false;
  const uri = state4.openDocumentUris?.get(normalizedPath) ?? pathToFileURL2(filePath).href;
  if (!state4.openDocuments.has(normalizedPath)) {
    if (await closedAndGone(state4, filePath, normalizedPath))
      return false;
    const fallbackOpenSent = await sendFenced(state4, normalizedPath, uri, "textDocument/didOpen", {
      textDocument: {
        uri,
        languageId: "plaintext",
        version: 0,
        text: content
      }
    });
    state4.documentVersions.set(normalizedPath, 0);
    state4.documentOpenedAt.set(normalizedPath, Date.now());
    state4.diagnosticPublicationCounts.set(normalizedPath, 0);
    if (fallbackOpenSent)
      recordSentContent(state4, normalizedPath, 0, content, coalescedCount);
    state4.openDocuments.add(normalizedPath);
    state4.closedDocuments?.delete(normalizedPath);
    state4.openDocumentUris?.set(normalizedPath, uri);
    if (saved && fallbackOpenSent)
      await sendDidSave(state4, normalizedPath, uri, content);
    return fallbackOpenSent;
  }
  const version = (state4.documentVersions.get(normalizedPath) ?? 0) + 1;
  state4.documentVersions.set(normalizedPath, version);
  clearDiagnosticsForPath(state4, normalizedPath);
  const changeSent = await sendFenced(state4, normalizedPath, uri, "textDocument/didChange", {
    textDocument: { uri, version },
    contentChanges: buildContentChanges(state4, normalizedPath, content)
  });
  if (changeSent)
    recordSentContent(state4, normalizedPath, version, content, coalescedCount);
  if (saved && changeSent)
    await sendDidSave(state4, normalizedPath, uri, content);
  return changeSent;
}
function handleNotifyChange(state4, filePath, content) {
  const normalizedPath = normalizeMapKey(filePath);
  return enqueueDocumentNotify(state4, normalizedPath, (coalescedCount, queuedSaved) => handleNotifyChangeOnce(state4, filePath, content, normalizedPath, coalescedCount, queuedSaved));
}
async function closedAndGone(state4, filePath, normalizedPath) {
  if (!state4.closedDocuments?.has(normalizedPath))
    return false;
  try {
    await access(filePath);
    return false;
  } catch {
    return true;
  }
}
async function closeDocument(state4, filePath) {
  if (!isClientAlive(state4))
    return;
  const normalizedPath = normalizeMapKey(filePath);
  await enqueueDocumentNotify(state4, normalizedPath, () => closeDocumentOnce(state4, filePath, normalizedPath), false, void 0, true);
}
async function closeDocumentOnce(state4, filePath, normalizedPath) {
  if (!isClientAlive(state4))
    return;
  if (!state4.openDocuments.has(normalizedPath)) {
    state4.closedDocuments?.add(normalizedPath);
    return;
  }
  await safeSendNotification(state4.connection, "textDocument/didClose", {
    textDocument: {
      uri: state4.openDocumentUris?.get(normalizedPath) ?? pathToFileURL2(filePath).href
    }
  });
  state4.openDocuments.delete(normalizedPath);
  state4.closedDocuments?.add(normalizedPath);
  state4.openDocumentUris?.delete(normalizedPath);
  state4.expectedPublicationsBeyondSends?.set(normalizedPath, publicationCountsForPath(state4, normalizedPath).sent);
  state4.documentVersions.delete(normalizedPath);
  state4.sentReadStamps.delete(normalizedPath);
  state4.documentOpenedAt.delete(normalizedPath);
  state4.diagnosticPublicationCounts.delete(normalizedPath);
  state4.projectIdentityProbedFiles?.delete(normalizedPath);
  const retained = state4.documentContentHashes.get(normalizedPath);
  if (retained?.text !== void 0) {
    state4.incrementalTextRetainedEntries = Math.max(0, (state4.incrementalTextRetainedEntries ?? 1) - 1);
    state4.incrementalTextRetainedBytes = Math.max(0, (state4.incrementalTextRetainedBytes ?? retained.text.length * 2) - retained.text.length * 2);
    state4.incrementalTextBearingPaths?.delete(normalizedPath);
  }
  state4.documentContentHashes.delete(normalizedPath);
  clearDiagnosticsForPath(state4, normalizedPath);
}
function isAtLeastAsAggressiveShutdown(existing, requested) {
  return !!existing.fast >= !!requested.fast && !!existing.processExiting >= !!requested.processExiting;
}
function clientShutdown(state4, options = {}) {
  if (state4.shutdownPromise && state4.shutdownOptions && isAtLeastAsAggressiveShutdown(state4.shutdownOptions, options)) {
    return state4.shutdownPromise;
  }
  state4.shutdownOptions = options;
  const attempt = clientShutdownOnce(state4, options);
  state4.shutdownPromise = attempt;
  attempt.catch(() => {
    if (state4.shutdownPromise === attempt) {
      state4.shutdownPromise = void 0;
      state4.shutdownOptions = void 0;
    }
  });
  return attempt;
}
async function clientShutdownOnce(state4, options) {
  const shutdownStart = Date.now();
  state4.shutdownRequested = true;
  state4.isConnected = false;
  state4.isDestroyed = true;
  for (const timer of state4.pendingDiagnostics.values()) {
    clearTimeout(timer);
  }
  state4.pendingDiagnostics.clear();
  state4.pendingOpens.clear();
  state4.openDocuments.clear();
  state4.openDocumentUris?.clear();
  cancelDocumentNotifyQueues(state4);
  state4.projectIdentityProbedFiles?.clear();
  state4.watchQueue?.cancel();
  state4.diagnosticEmitter.removeAllListeners();
  let shutdownRequestTimedOut = false;
  let exitNotifyTimedOut = false;
  let shutdownRequestUndelivered = false;
  let exitNotifyUndelivered = false;
  try {
    if (!options.fast) {
      try {
        const shutdownAck = await withTimeout(safeSendRequest(state4.connection, "shutdown", {}), SHUTDOWN_REQUEST_TIMEOUT_MS);
        if (shutdownAck === void 0)
          shutdownRequestUndelivered = true;
      } catch (err) {
        if (isShutdownTimeoutError(err, SHUTDOWN_REQUEST_TIMEOUT_MS)) {
          shutdownRequestTimedOut = true;
        } else {
          shutdownRequestUndelivered = true;
        }
      }
      try {
        const exitSent = await withTimeout(safeSendNotification(state4.connection, "exit", {}), EXIT_NOTIFY_TIMEOUT_MS);
        if (exitSent === false)
          exitNotifyUndelivered = true;
      } catch (err) {
        if (isShutdownTimeoutError(err, EXIT_NOTIFY_TIMEOUT_MS)) {
          exitNotifyTimedOut = true;
        } else {
          exitNotifyUndelivered = true;
        }
      }
    }
  } finally {
    disposeClientConnection(state4);
    const pid = state4.lspProcess.pid;
    logLatency({
      type: "phase",
      phase: "lsp_client_shutdown",
      filePath: state4.root,
      durationMs: Date.now() - shutdownStart,
      metadata: {
        serverId: state4.serverId,
        pid,
        fast: !!options.fast,
        processExiting: !!options.processExiting,
        shutdownRequestTimedOut,
        // #1620: `shutdownRequestTimedOut` covered only the request half, so
        // a hung exit notify was indistinguishable from a clean exit — and
        // pre-fix no record was emitted at all. Report both halves plus one
        // rolled-up verdict, so a forced teardown is countable from the log.
        exitNotifyTimedOut,
        // #1620 residual 1 / residual-review F2: the *Undelivered pair covers
        // the failure the *TimedOut pair used to also claim — a rejection
        // that is NOT the timer winning, OR (the F2 gap) a swallowed stream
        // error that `safeSendRequest`/`safeSendNotification` resolved
        // instead of rejecting, so no exception ever reached the catches
        // above. Both still roll into shutdownOutcome "forced" below — an
        // undelivered write is never reported as "graceful".
        shutdownRequestUndelivered,
        exitNotifyUndelivered,
        shutdownOutcome: options.fast ? "fast" : shutdownRequestTimedOut || exitNotifyTimedOut || shutdownRequestUndelivered || exitNotifyUndelivered ? "forced" : "graceful"
      }
    });
    void removeLspChild(pid, extractSpawnMarker(state4.lspProcess.args)).catch((err) => {
      logLatency({
        type: "phase",
        phase: "lsp_registry_write_failed",
        filePath: "",
        durationMs: 0,
        metadata: { op: "remove", pid, error: String(err) }
      });
    });
    await killProcessTree(state4.lspProcess.process, pid, options);
  }
}
async function toWirePosition(state4, filePath, line, character) {
  if (state4.positionEncoding === "utf-16")
    return { line, character };
  try {
    const content = await readFile(filePath, "utf8");
    return {
      line,
      character: convertCharacterOffset(state4.positionEncoding, lineTextAt(content, line), character)
    };
  } catch {
    return { line, character };
  }
}
function navStaleDropEnabled() {
  return process.env.PI_LENS_LSP_NAV_STALE_DROP !== "0";
}
async function navRequest(state4, method, params, staleCheckPath, timeoutMs = NAV_REQUEST_TIMEOUT_MS, signal = getAmbientAbortSignal()) {
  if (!isClientAlive(state4))
    return null;
  const normalizedPath = staleCheckPath !== void 0 ? normalizeMapKey(staleCheckPath) : void 0;
  const requestVersion = normalizedPath !== void 0 ? state4.documentVersions.get(normalizedPath) : void 0;
  const requestStartedAt = Date.now();
  const requestPromise = safeSendRequest(state4.connection, method, params, signal);
  const result = await withTimeout(requestPromise, timeoutMs).catch((err) => {
    if (isNavTimeoutError(err, timeoutMs)) {
      recordNavTimeoutTelemetry({
        method,
        scope: normalizedPath,
        budgetMs: timeoutMs,
        elapsedMs: Date.now() - requestStartedAt
      });
      armNavLateAnswerTelemetry({
        requestPromise,
        method,
        scope: normalizedPath,
        requestStartedAt
      });
      return void 0;
    }
    if (err instanceof Error && err.message.startsWith("Timeout after")) {
      return void 0;
    }
    throw err;
  });
  if (normalizedPath !== void 0 && requestVersion !== void 0 && navStaleDropEnabled()) {
    const currentVersion = state4.documentVersions.get(normalizedPath);
    if (currentVersion !== void 0 && currentVersion > requestVersion) {
      return void 0;
    }
  }
  return result;
}
function isNavTimeoutError(err, timeoutMs) {
  return err instanceof Error && err.message === `Timeout after ${timeoutMs}ms`;
}
function isShutdownTimeoutError(err, timeoutMs) {
  return err instanceof Error && err.message === `Timeout after ${timeoutMs}ms`;
}
var NAV_REQUEST_NO_PATH_SCOPE = "*no-path*";
function recordNavTimeoutTelemetry(args) {
  emitBounded("lsp_nav_request_timeout", `${args.method}:${args.scope ?? NAV_REQUEST_NO_PATH_SCOPE}`, {
    type: "phase",
    filePath: args.scope ?? NAV_REQUEST_NO_PATH_SCOPE,
    durationMs: args.elapsedMs,
    metadata: { method: args.method, effectiveBudgetMs: args.budgetMs }
  }, {
    ledgerKind: "lsp-nav-request-timeout",
    risingEdgePer: "identity",
    reason: `timeout budget=${args.budgetMs}ms elapsed=${args.elapsedMs}ms`
  });
}
function armNavLateAnswerTelemetry(args) {
  args.requestPromise.then(() => {
    try {
      const elapsedMs = Date.now() - args.requestStartedAt;
      emitBounded("lsp_nav_late_answer_discarded", `${args.method}:${args.scope ?? NAV_REQUEST_NO_PATH_SCOPE}`, {
        type: "phase",
        filePath: args.scope ?? NAV_REQUEST_NO_PATH_SCOPE,
        durationMs: elapsedMs,
        metadata: { method: args.method }
      }, {
        ledgerKind: "lsp-nav-late-answer",
        risingEdgePer: "identity",
        reason: `late nav answer discarded after ${elapsedMs}ms`
      });
    } catch {
    }
  }, () => {
  });
}
function chooseLivenessProbe(state4) {
  if (state4.operationSupport?.workspaceSymbol === true) {
    return {
      method: "workspace/symbol",
      params: { query: LIVENESS_PING_QUERY }
    };
  }
  const openUri = firstOpenDocumentUri(state4);
  if (openUri === void 0)
    return void 0;
  if (state4.operationSupport?.documentSymbol === true) {
    return {
      method: "textDocument/documentSymbol",
      params: { textDocument: { uri: openUri } }
    };
  }
  if (state4.operationSupport?.hover === true) {
    return {
      method: "textDocument/hover",
      params: {
        textDocument: { uri: openUri },
        position: { line: 0, character: 0 }
      }
    };
  }
  return void 0;
}
function firstOpenDocumentUri(state4) {
  for (const normalizedPath of state4.openDocuments) {
    const uri = state4.openDocumentUris?.get(normalizedPath);
    if (uri !== void 0)
      return uri;
  }
  return void 0;
}
async function clientPingLiveness(state4, timeoutMs = LIVENESS_PING_TIMEOUT_MS) {
  if (!isClientAlive(state4))
    return false;
  const probe = chooseLivenessProbe(state4);
  if (probe === void 0) {
    try {
      incrementDegradationCount({
        kind: "lsp-liveness-probe-unsupported",
        subject: state4.serverId,
        reason: "no advertised request method to probe with (no workspaceSymbolProvider, and no open document with documentSymbolProvider or hoverProvider); liveness from process and connection state only"
      });
    } catch {
    }
    return isClientAlive(state4);
  }
  try {
    await withTimeout(safeSendRequest(state4.connection, probe.method, probe.params), timeoutMs);
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Timeout after")) {
      return false;
    }
  }
  return isClientAlive(state4);
}
function syncMutationContextSlot(state4) {
  state4.activeMutationContext = state4.activeMutationDepth === 1 ? state4.mutationContextOwner : void 0;
}
async function runServerCommand(state4, command, args, timeoutMs = EXECUTE_COMMAND_TIMEOUT_MS, mutationContext) {
  if (!isClientAlive(state4)) {
    return { executed: false, reason: "lsp client not alive" };
  }
  if (!state4.advertisedCommands.has(command)) {
    return {
      executed: false,
      reason: `command "${command}" is not advertised by the ${state4.serverId} server`
    };
  }
  state4.serverEditsAllowed += 1;
  state4.activeMutationDepth = (state4.activeMutationDepth ?? 0) + 1;
  const isMutationContextOwner = state4.activeMutationDepth === 1;
  if (isMutationContextOwner) {
    state4.mutationContextOwner = mutationContext;
  }
  syncMutationContextSlot(state4);
  try {
    let result;
    try {
      result = await withTimeout(safeSendRequest(state4.connection, "workspace/executeCommand", {
        command,
        arguments: args ?? []
      }), timeoutMs);
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("Timeout after")) {
        return {
          executed: false,
          reason: `workspace/executeCommand timed out after ${timeoutMs}ms \u2014 the command may still be applying server-side`
        };
      }
      throw err;
    }
    return { executed: true, result };
  } finally {
    state4.serverEditsAllowed -= 1;
    state4.activeMutationDepth = Math.max(0, (state4.activeMutationDepth ?? 0) - 1);
    if (isMutationContextOwner) {
      state4.mutationContextOwner = void 0;
    }
    syncMutationContextSlot(state4);
  }
}
async function runReadOnlyServerCommand(state4, command, args, timeoutMs = PROBE_COMMAND_TIMEOUT_MS) {
  if (!isClientAlive(state4)) {
    return { executed: false, reason: "lsp client not alive" };
  }
  if (!state4.advertisedCommands.has(command)) {
    return {
      executed: false,
      reason: `command "${command}" is not advertised by the ${state4.serverId} server`
    };
  }
  try {
    const result = await withTimeout(safeSendRequest(state4.connection, "workspace/executeCommand", {
      command,
      arguments: args ?? []
    }), timeoutMs);
    return { executed: true, result };
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Timeout after")) {
      return {
        executed: false,
        reason: `workspace/executeCommand timed out after ${timeoutMs}ms`
      };
    }
    throw err;
  }
}
function validateWorkspaceEditVersions(state4, edit) {
  for (const change of edit.documentChanges ?? []) {
    if (typeof change !== "object" || change === null || !("textDocument" in change))
      continue;
    const textDocument = change.textDocument;
    if (!textDocument || typeof textDocument.uri !== "string" || textDocument.version == null)
      continue;
    const current = state4.documentVersions.get(normalizeMapKey(uriToPath(textDocument.uri)));
    if (current === void 0 || current !== textDocument.version) {
      throw new Error(`stale workspace edit document version for ${textDocument.uri}`);
    }
  }
}
function stripDocumentVersions(edit) {
  if (!Array.isArray(edit.documentChanges))
    return edit;
  const documentChanges = edit.documentChanges.map((change) => {
    if (typeof change === "object" && change !== null && "textDocument" in change && "edits" in change) {
      const textDocument = change.textDocument;
      if (textDocument && typeof textDocument.version === "number") {
        return {
          ...change,
          textDocument: { ...textDocument, version: null }
        };
      }
    }
    return change;
  });
  return { ...edit, documentChanges };
}
async function normalizeClientWorkspaceEdit(state4, edit) {
  validateWorkspaceEditVersions(state4, edit);
  const normalized = await normalizeWorkspaceEditToUtf16(edit, state4.positionEncoding, state4.root);
  return stripDocumentVersions(normalized);
}
async function resolveCodeActionBestEffort(state4, action) {
  if (!isClientAlive(state4))
    return action;
  if (action.edit) {
    return {
      ...action,
      edit: await normalizeClientWorkspaceEdit(state4, action.edit)
    };
  }
  if (!state4.operationSupport.codeActionResolve) {
    recordDegradationOnce({
      kind: "lsp-capability-skip",
      subject: `${state4.serverId}:codeAction/resolve`,
      reason: "server did not advertise codeActionProvider.resolveProvider"
    });
    return action;
  }
  let resolved2;
  try {
    resolved2 = await withTimeout(safeSendRequest(state4.connection, "codeAction/resolve", action), NAV_REQUEST_TIMEOUT_MS);
  } catch {
    return action;
  }
  if (!resolved2 || typeof resolved2 !== "object")
    return action;
  const merged = { ...action, ...resolved2 };
  return merged.edit ? {
    ...merged,
    edit: await normalizeClientWorkspaceEdit(state4, merged.edit)
  } : merged;
}
async function createLSPClient(options) {
  installCrashGuard();
  const { serverId, process: lspProcess, root, sessionCwd, initialization, initializeTimeoutMs = INITIALIZE_TIMEOUT_MS, launchVariant, onDiagnosticsPublished } = options;
  void recordLspChild({
    pid: lspProcess.pid,
    serverId,
    command: lspProcess.command,
    marker: extractSpawnMarker(lspProcess.args),
    sessionIdentity: {
      projectRoot: sessionCwd ?? process.cwd(),
      rootSource: sessionCwd ? "service-cwd" : "lsp-fallback",
      startedAt: new Date(workspaceDiagnosticsCacheSessionStart()).toISOString()
    }
  }).catch((err) => {
    logLatency({
      type: "phase",
      phase: "lsp_registry_write_failed",
      filePath: "",
      durationMs: 0,
      metadata: { op: "record", pid: lspProcess.pid, error: String(err) }
    });
  });
  const startupState = {
    exitCode: null,
    exitSignal: null,
    closeCode: null,
    closeSignal: null,
    stderr: ""
  };
  const stderrRing = [];
  const MAX_STDERR_LINES = 100;
  const onStderr = (chunk) => {
    stderrRing.push(chunk.toString());
    if (stderrRing.length > MAX_STDERR_LINES)
      stderrRing.shift();
    if (startupState.stderr.length < 4096) {
      startupState.stderr += chunk.toString();
    }
  };
  const recentStderr = (lines = 10) => stderrRing.slice(-lines).join("").trim();
  const checkProcessAlive = () => {
    const exited = lspProcess.process.exitCode;
    if (exited !== null) {
      const tail = recentStderr(20);
      return `LSP server ${serverId} exited with code ${exited}${tail ? `. stderr: ${tail}` : ""}`;
    }
    if (lspProcess.process.killed) {
      return `LSP server ${serverId} was killed`;
    }
    return void 0;
  };
  const onProcessExit = (code, signal) => {
    startupState.exitCode = code;
    startupState.exitSignal = signal;
  };
  const onProcessClose = (code, signal) => {
    startupState.closeCode = code;
    startupState.closeSignal = signal;
  };
  lspProcess.stderr.on("data", onStderr);
  lspProcess.process.on("exit", onProcessExit);
  lspProcess.process.on("close", onProcessClose);
  const streamErrorHandler = (_label) => (err) => {
    if (err.code === "ERR_STREAM_DESTROYED" || err.code === "ERR_STREAM_WRITE_AFTER_END" || err.code === "EPIPE" || err.code === "ECONNRESET")
      return;
  };
  lspProcess.stdin.on("error", streamErrorHandler("stdin"));
  lspProcess.stdout.on("error", streamErrorHandler("stdout"));
  lspProcess.stderr.on("error", streamErrorHandler("stderr"));
  const connection = (0, import_node.createMessageConnection)(new import_node.StreamMessageReader(lspProcess.stdout), new import_node.StreamMessageWriter(lspProcess.stdin));
  const diagnosticEmitter = new EventEmitter();
  diagnosticEmitter.setMaxListeners(50);
  const state4 = {
    isConnected: true,
    isDestroyed: false,
    startedAtMs: Date.now(),
    shutdownRequested: false,
    shutdownPromise: void 0,
    shutdownOptions: void 0,
    exitedAt: void 0,
    connectionDisposed: false,
    lastError: void 0,
    connection,
    pushDiagnostics: /* @__PURE__ */ new Map(),
    pushDiagnosticTimestamps: /* @__PURE__ */ new Map(),
    documentPullDiagnostics: /* @__PURE__ */ new Map(),
    documentPullDiagnosticTimestamps: /* @__PURE__ */ new Map(),
    pullFailureHistory: [],
    pendingDiagnostics: /* @__PURE__ */ new Map(),
    diagnosticPublicationCounts: /* @__PURE__ */ new Map(),
    documentOpenedAt: /* @__PURE__ */ new Map(),
    diagnosticEmitter,
    diagnosticsVersion: 0,
    diagnosticsVersionsByPath: /* @__PURE__ */ new Map(),
    publicationStoreCountsByPath: /* @__PURE__ */ new Map(),
    expectedPublicationsBeyondSends: /* @__PURE__ */ new Map(),
    documentVersions: /* @__PURE__ */ new Map(),
    notifyChangeQueues: /* @__PURE__ */ new Map(),
    sentReadStamps: /* @__PURE__ */ new Map(),
    diagnosticDocVersions: /* @__PURE__ */ new Map(),
    documentContentHashes: /* @__PURE__ */ new Map(),
    incrementalTextRetainedEntries: 0,
    incrementalTextBearingPaths: /* @__PURE__ */ new Set(),
    incrementalTextRetainedBytes: 0,
    diagnosticBindings: /* @__PURE__ */ new Map(),
    pullResultIds: /* @__PURE__ */ new Map(),
    documentPullDiagnosticsBySource: /* @__PURE__ */ new Map(),
    pullGenerations: /* @__PURE__ */ new Map(),
    pullRequestSequences: /* @__PURE__ */ new Map(),
    workspacePullResultCache: /* @__PURE__ */ new Map(),
    openDocuments: /* @__PURE__ */ new Set(),
    // #3310: one-shot, per client session.
    emptyFirstPublishHoldSpent: false,
    diagnosticFences: /* @__PURE__ */ new Map(),
    closedDocuments: /* @__PURE__ */ new Set(),
    openDocumentUris: /* @__PURE__ */ new Map(),
    pendingOpens: /* @__PURE__ */ new Set(),
    projectIdentityProbedFiles: /* @__PURE__ */ new Set(),
    // these are filled in after initialize — cast to avoid two-phase init
    workspaceDiagnosticsSupport: (
      // SAFETY: initialize fills this capability before any workspace diagnostic request.
      void 0
    ),
    // SAFETY: initialize fills this capability before operation dispatch.
    operationSupport: void 0,
    staticDiagnosticsMode: "push-only",
    positionEncoding: "utf-16",
    syncKind: TEXT_DOCUMENT_SYNC_KIND_FULL,
    dynamicRegistrations: /* @__PURE__ */ new Map(),
    advertisedCommands: /* @__PURE__ */ new Set(),
    serverEditsAllowed: 0,
    activeMutationDepth: 0,
    serverId,
    launchVariant,
    root,
    lspProcess,
    // two-phase: the flush closure needs `state` (below)
    // SAFETY: state construction completes before the flush closure can run.
    watchQueue: void 0
  };
  activeLspClientSet().add(state4);
  state4.watchQueue = new WatchedFilesQueue((changes) => {
    if (!isClientAlive(state4))
      return;
    void safeSendNotification(state4.connection, "workspace/didChangeWatchedFiles", { changes });
  });
  setupIncomingHandlers(state4, initialization, onDiagnosticsPublished);
  connection.listen();
  setupConnectionLifecycle(state4, recentStderr);
  let initResult;
  try {
    initResult = await withTimeout(safeSendRequest(connection, "initialize", {
      processId: process.pid,
      rootUri: pathToFileURL2(root).href,
      workspaceFolders: [
        { name: "workspace", uri: pathToFileURL2(root).href }
      ],
      capabilities: CLIENT_CAPABILITIES,
      initializationOptions: initialization
    }), initializeTimeoutMs);
  } catch (err) {
    state4.shutdownRequested = true;
    const pid = lspProcess.pid;
    void killProcessTree(lspProcess.process, pid);
    void removeLspChild(pid, extractSpawnMarker(lspProcess.args)).catch((err2) => {
      logLatency({
        type: "phase",
        phase: "lsp_registry_write_failed",
        filePath: "",
        durationMs: 0,
        metadata: { op: "remove", pid, error: String(err2) }
      });
    });
    setTimeout(() => {
      if (lspProcess.process.exitCode === null && lspProcess.process.signalCode === null && process.platform !== "win32") {
        lspProcess.process.kill("SIGKILL");
      }
    }, 2e3);
    throw err;
  } finally {
    lspProcess.stderr.off("data", onStderr);
  }
  if (initResult === void 0) {
    const compactStderr = startupState.stderr.replace(/\s+/g, " ").trim().slice(0, 320);
    const reinstallHint = serverId === "cpp" ? "Install clangd (LLVM/clang-tools) and ensure clangd.exe is on PATH." : `Try reinstalling: npm install -g ${serverId}-language-server.`;
    const telemetry = [
      `pid=${lspProcess.pid}`,
      `exitCode=${startupState.exitCode ?? "none"}`,
      `exitSignal=${startupState.exitSignal ?? "none"}`,
      `closeCode=${startupState.closeCode ?? "none"}`,
      `closeSignal=${startupState.closeSignal ?? "none"}`,
      `root=${root}`,
      compactStderr ? `stderr=${compactStderr}` : "stderr=<empty>"
    ].join(" ");
    throw new Error(`[lsp] ${serverId} failed to initialize - stream may have been destroyed. The server binary may be missing or crashed immediately. ${reinstallHint} telemetry: ${telemetry}`);
  }
  state4.workspaceDiagnosticsSupport = detectWorkspaceDiagnosticsSupport(initResult);
  state4.operationSupport = detectOperationSupport(initResult);
  const capabilities = initResult?.capabilities ?? {};
  const workspace = isCapabilityRecord(capabilities.workspace) ? capabilities.workspace : void 0;
  const fileOperations = isCapabilityRecord(workspace) ? workspace.fileOperations : void 0;
  const malformedFileOperationRegistrations = /* @__PURE__ */ new Set();
  if (isCapabilityRecord(fileOperations)) {
    for (const operation of ["willRename", "didRename"]) {
      if (fileOperations[operation] !== void 0 && parseFileOperationFilters(fileOperations[operation]) === void 0) {
        malformedFileOperationRegistrations.add(operation);
      }
    }
  }
  state4.fileOperationMalformedRegistrations = malformedFileOperationRegistrations;
  if (isCapabilityRecord(fileOperations)) {
    state4.fileOperationFilters = {
      willRename: parseFileOperationFilters(fileOperations.willRename),
      didRename: parseFileOperationFilters(fileOperations.didRename)
    };
  }
  state4.positionEncoding = negotiatePositionEncoding(initResult?.capabilities);
  state4.syncKind = negotiateSyncKind(initResult?.capabilities);
  state4.saveOptions = negotiateSaveOptions(initResult?.capabilities);
  state4.rawCapabilityKeys = Object.keys(initResult?.capabilities ?? {}).sort((a, b) => a.localeCompare(b));
  for (const cmd of detectExecuteCommands(initResult)) {
    state4.advertisedCommands.add(cmd);
  }
  state4.staticDiagnosticsMode = state4.workspaceDiagnosticsSupport.mode;
  await safeSendNotification(connection, "initialized", {});
  if (initialization) {
    await safeSendNotification(connection, "workspace/didChangeConfiguration", {
      settings: initialization
    });
  }
  return {
    serverId,
    root,
    connection,
    isAlive: () => isClientAlive(state4),
    /** True if the server process has exited or been killed. */
    processExited: () => lspProcess.process.exitCode !== null || lspProcess.process.killed === true,
    /** #1127: mirrors `state.shutdownRequested` — see interface doc. */
    wasShutdownIntentional: () => state4.shutdownRequested,
    /** #1127: mirrors `state.exitedAt` — see interface doc. */
    getExitedAt: () => state4.exitedAt,
    /** Last N lines of server stderr for diagnostics. */
    recentStderr: (lines) => recentStderr(lines),
    getPullFailureHistory: () => state4.pullFailureHistory.map((entry) => ({
      ...entry,
      message: entry.message.slice(0, 200)
    })),
    /** Pre-request health check — returns error string if dead. */
    checkAlive: () => checkProcessAlive(),
    /** #1277: cheap request round-trip proving the server still responds. */
    pingLiveness: (timeoutMs) => clientPingLiveness(state4, timeoutMs),
    /** #2358: the OS pid of the live server process (see interface doc). */
    getProcessPid: () => lspProcess.pid,
    notify: {
      async open(filePath, content, languageId, preserveDiagnostics, silent, saved, readStamp) {
        return handleNotifyOpen(state4, filePath, content, languageId, preserveDiagnostics, silent, saved, readStamp);
      },
      async change(filePath, content) {
        return handleNotifyChange(state4, filePath, content);
      },
      watchedFileChange(filePath, type) {
        handleNotifyExternalChange(state4, filePath, type);
      }
    },
    getDiagnostics(filePath) {
      return getMergedDiagnosticsForPath(state4, normalizeMapKey(filePath));
    },
    getDiagnosticBinding(filePath) {
      return state4.diagnosticBindings.get(normalizeMapKey(filePath));
    },
    getDiagnosticsVersionForPath(filePath) {
      return diagnosticsVersionForPath(state4, normalizeMapKey(filePath));
    },
    getPublicationCountsForPath(filePath) {
      return publicationCountsForPath(state4, normalizeMapKey(filePath));
    },
    getAllDiagnostics() {
      const result = /* @__PURE__ */ new Map();
      const keys = /* @__PURE__ */ new Set([
        ...state4.pushDiagnostics.keys(),
        ...state4.documentPullDiagnostics.keys()
      ]);
      for (const key of keys) {
        result.set(key, {
          diags: getMergedDiagnosticsForPath(state4, key),
          ts: Math.max(state4.pushDiagnosticTimestamps.get(key) ?? 0, state4.documentPullDiagnosticTimestamps.get(key) ?? 0),
          binding: state4.diagnosticBindings.get(key)
        });
      }
      return result;
    },
    getTrackedDiagnosticPaths() {
      return [
        .../* @__PURE__ */ new Set([
          ...state4.pushDiagnostics.keys(),
          ...state4.documentPullDiagnostics.keys()
        ])
      ].map((filePath) => process.platform === "win32" ? filePath.replace(/\//g, "\\") : filePath);
    },
    pruneDiagnostics(predicate) {
      let removed = 0;
      const keys = /* @__PURE__ */ new Set([
        ...state4.pushDiagnostics.keys(),
        ...state4.documentPullDiagnostics.keys()
      ]);
      for (const key of keys) {
        const diags = getMergedDiagnosticsForPath(state4, key);
        const ts = Math.max(state4.pushDiagnosticTimestamps.get(key) ?? 0, state4.documentPullDiagnosticTimestamps.get(key) ?? 0);
        if (!predicate(key, ts, diags))
          continue;
        clearDiagnosticsForPath(state4, key);
        removed++;
      }
      return removed;
    },
    getWorkspaceDiagnosticsSupport() {
      return state4.workspaceDiagnosticsSupport;
    },
    requestWorkspaceDiagnostics(budgetMs) {
      return clientRequestWorkspaceDiagnostics(state4, budgetMs);
    },
    getOperationSupport() {
      return state4.operationSupport;
    },
    getMalformedFileOperationRegistrations() {
      return state4.fileOperationMalformedRegistrations ?? /* @__PURE__ */ new Set();
    },
    getAdvertisedCommands() {
      return [...state4.advertisedCommands];
    },
    getRawCapabilityKeys() {
      return state4.rawCapabilityKeys ?? [];
    },
    getSaveOptions() {
      return state4.saveOptions ? { ...state4.saveOptions } : void 0;
    },
    getLaunchVariant() {
      return state4.launchVariant;
    },
    async executeCommand(command, args, mutationContext) {
      return runServerCommand(state4, command, args, EXECUTE_COMMAND_TIMEOUT_MS, mutationContext);
    },
    async executeReadOnlyCommand(command, args) {
      return runReadOnlyServerCommand(state4, command, args);
    },
    get diagnosticsVersion() {
      return state4.diagnosticsVersion;
    },
    async waitForDiagnostics(filePath, timeoutMs = DIAGNOSTICS_WAIT_TIMEOUT_MS, options2) {
      return clientWaitForDiagnostics(state4, filePath, timeoutMs, options2);
    },
    async definition(filePath, line, character) {
      const result = await navRequest(state4, "textDocument/definition", {
        textDocument: { uri: pathToFileURL2(filePath).href },
        position: await toWirePosition(state4, filePath, line, character)
      }, filePath);
      if (!result)
        return [];
      return Array.isArray(result) ? result : [result];
    },
    async typeDefinition(filePath, line, character) {
      const result = await navRequest(state4, "textDocument/typeDefinition", {
        textDocument: { uri: pathToFileURL2(filePath).href },
        position: await toWirePosition(state4, filePath, line, character)
      }, filePath);
      if (!result)
        return [];
      return Array.isArray(result) ? result : [result];
    },
    async declaration(filePath, line, character) {
      const result = await navRequest(state4, "textDocument/declaration", {
        textDocument: { uri: pathToFileURL2(filePath).href },
        position: await toWirePosition(state4, filePath, line, character)
      }, filePath);
      if (!result)
        return [];
      return Array.isArray(result) ? result : [result];
    },
    async references(filePath, line, character, includeDeclaration = true) {
      const result = await navRequest(state4, "textDocument/references", {
        textDocument: { uri: pathToFileURL2(filePath).href },
        position: await toWirePosition(state4, filePath, line, character),
        context: { includeDeclaration }
      }, filePath);
      return result ?? [];
    },
    async hover(filePath, line, character) {
      const result = await navRequest(state4, "textDocument/hover", {
        textDocument: { uri: pathToFileURL2(filePath).href },
        position: await toWirePosition(state4, filePath, line, character)
      }, filePath);
      return result ?? null;
    },
    async signatureHelp(filePath, line, character) {
      const result = await navRequest(state4, "textDocument/signatureHelp", {
        textDocument: { uri: pathToFileURL2(filePath).href },
        position: await toWirePosition(state4, filePath, line, character)
      }, filePath);
      return result ?? null;
    },
    async documentSymbol(filePath) {
      const result = await navRequest(state4, "textDocument/documentSymbol", { textDocument: { uri: pathToFileURL2(filePath).href } }, filePath);
      return result ?? [];
    },
    isDocumentOpen(filePath) {
      return state4.openDocuments.has(normalizeMapKey(filePath));
    },
    openDocumentPaths() {
      return [...state4.openDocuments];
    },
    getSentContent(filePath) {
      const sent = state4.documentContentHashes.get(normalizeMapKey(filePath));
      return sent && {
        hash: sent.hash,
        changedAtMs: sent.changedAtMs,
        openedAtMs: sent.openedAtMs,
        openedHash: sent.openedHash,
        clientStartedAtMs: state4.startedAtMs
      };
    },
    isBusy() {
      return isConnectionBusy(connection);
    },
    getDocumentUri(filePath) {
      return state4.openDocumentUris?.get(normalizeMapKey(filePath));
    },
    async workspaceSymbol(query) {
      if (!isClientAlive(state4))
        return [];
      const result = await navRequest(state4, "workspace/symbol", {
        query
      });
      return result ?? [];
    },
    async codeAction(filePath, line, character, endLine, endCharacter) {
      if (!isClientAlive(state4))
        return [];
      const uri = pathToFileURL2(filePath).href;
      const result = await navRequest(state4, "textDocument/codeAction", {
        textDocument: { uri },
        range: {
          start: await toWirePosition(state4, filePath, line, character),
          end: await toWirePosition(state4, filePath, endLine, endCharacter)
        },
        context: {
          diagnostics: getMergedDiagnosticsForPath(state4, normalizeMapKey(filePath))
        }
      }, filePath);
      if (!result || !Array.isArray(result))
        return [];
      const actions = result.filter((item) => typeof item === "object" && item !== null && "title" in item);
      return Promise.all(actions.map((action) => resolveCodeActionBestEffort(state4, action)));
    },
    async rename(filePath, line, character, newName) {
      const result = await navRequest(state4, "textDocument/rename", {
        textDocument: { uri: pathToFileURL2(filePath).href },
        position: await toWirePosition(state4, filePath, line, character),
        newName
      }, filePath);
      return result ? await normalizeClientWorkspaceEdit(state4, result) : null;
    },
    closeDocument: (filePath) => closeDocument(state4, filePath),
    async willRenameFiles(oldFilePath, newFilePath) {
      if (!isClientAlive(state4))
        return null;
      const oldUri = pathToFileURL2(oldFilePath).href;
      const newUri = pathToFileURL2(newFilePath).href;
      if (!await fileOperationFiltersMatch(state4.fileOperationFilters?.willRename, oldUri, newUri, oldFilePath, newFilePath)) {
        recordDegradationOnce({
          kind: "lsp-capability-skip",
          subject: `${state4.serverId}:workspace/willRenameFiles:filter`,
          reason: "filter-mismatch"
        });
        return null;
      }
      const result = await navRequest(state4, "workspace/willRenameFiles", {
        files: [
          {
            oldUri,
            newUri
          }
        ]
      });
      return result ? await normalizeClientWorkspaceEdit(state4, result) : null;
    },
    async didRenameFiles(oldFilePath, newFilePath, oldUri, newUri) {
      if (!isClientAlive(state4))
        return;
      const wireOldUri = oldUri ?? pathToFileURL2(oldFilePath).href;
      const wireNewUri = newUri ?? pathToFileURL2(newFilePath).href;
      if (!await fileOperationFiltersMatch(state4.fileOperationFilters?.didRename, wireOldUri, wireNewUri, oldFilePath, newFilePath)) {
        recordDegradationOnce({
          kind: "lsp-capability-skip",
          subject: `${state4.serverId}:workspace/didRenameFiles:filter`,
          reason: "filter-mismatch"
        });
        return;
      }
      await safeSendNotification(state4.connection, "workspace/didRenameFiles", {
        files: [
          {
            oldUri: wireOldUri,
            newUri: wireNewUri
          }
        ]
      });
    },
    async implementation(filePath, line, character) {
      const result = await navRequest(state4, "textDocument/implementation", {
        textDocument: { uri: pathToFileURL2(filePath).href },
        position: await toWirePosition(state4, filePath, line, character)
      }, filePath);
      if (!result)
        return [];
      return Array.isArray(result) ? result : [result];
    },
    async prepareCallHierarchy(filePath, line, character) {
      const result = await navRequest(state4, "textDocument/prepareCallHierarchy", {
        textDocument: { uri: pathToFileURL2(filePath).href },
        position: await toWirePosition(state4, filePath, line, character)
      }, filePath);
      if (!result)
        return [];
      return Array.isArray(result) ? result : [result];
    },
    async incomingCalls(item) {
      const result = await navRequest(state4, "callHierarchy/incomingCalls", { item });
      return result ?? [];
    },
    async outgoingCalls(item) {
      const result = await navRequest(state4, "callHierarchy/outgoingCalls", { item });
      return result ?? [];
    },
    async shutdown(options2) {
      return clientShutdown(state4, options2);
    }
  };
}
function sendFenced(state4, normalizedPath, uri, method, params) {
  const sent = safeSendNotification(state4.connection, method, params);
  armDiagnosticsFence(state4, normalizedPath, uri);
  return sent;
}
function armDiagnosticsFence(state4, normalizedPath, uri) {
  if (getStrategy(state4.serverId, state4.launchVariant).diagnosticsFence !== "reply-first") {
    return;
  }
  if (state4.operationSupport?.documentSymbol !== true) {
    if (!state4.fenceSkipRecorded) {
      state4.fenceSkipRecorded = true;
      logLatency({
        type: "phase",
        phase: "lsp_diagnostics_fence",
        filePath: normalizedPath,
        durationMs: 0,
        metadata: { serverId: state4.serverId, outcome: "no-request" }
      });
    }
    return;
  }
  const armedAt = Date.now();
  const cancellation = new import_node.CancellationTokenSource();
  const end = (outcome) => {
    if (ended)
      return;
    ended = true;
    clearTimeout(bound);
    state4.diagnosticFences.delete(normalizedPath);
    cancellation.cancel();
    cancellation.dispose();
    if (outcome === "timeout" || fence.dropped > 0) {
      logLatency({
        type: "phase",
        phase: "lsp_diagnostics_fence",
        filePath: normalizedPath,
        durationMs: Date.now() - armedAt,
        metadata: {
          serverId: state4.serverId,
          outcome,
          droppedPublishes: fence.dropped
        }
      });
    }
  };
  let ended = false;
  const fence = {
    dropped: 0,
    supersede: () => end("superseded")
  };
  state4.diagnosticFences.get(normalizedPath)?.supersede();
  state4.diagnosticFences.set(normalizedPath, fence);
  const bound = setTimeout(() => end("timeout"), DIAGNOSTICS_WAIT_TIMEOUT_MS);
  bound.unref?.();
  let reply;
  try {
    reply = Promise.resolve(state4.connection.sendRequest("textDocument/documentSymbol", { textDocument: { uri } }, cancellation.token));
  } catch (thrown) {
    reply = Promise.reject(thrown);
  }
  reply.then(() => end("reply"), () => end("reply"));
}
async function safeSendNotification(connection, method, params) {
  try {
    await connection.sendNotification(method, params);
    return true;
  } catch (err) {
    if (isStreamError(err)) {
      return false;
    }
    throw err;
  }
}
var activeRequestsByConnection = /* @__PURE__ */ new WeakMap();
function isConnectionBusy(connection) {
  return (activeRequestsByConnection.get(connection) ?? 0) > 0;
}
async function safeSendRequest(connection, method, params, signal, settlement) {
  if (signal?.aborted)
    return void 0;
  let tokenSource;
  let onAbort;
  if (signal) {
    tokenSource = new import_node.CancellationTokenSource();
    onAbort = () => tokenSource?.cancel();
    signal.addEventListener("abort", onAbort, { once: true });
  }
  const send = () => tokenSource ? connection.sendRequest(method, params, tokenSource.token) : connection.sendRequest(method, params);
  activeRequestsByConnection.set(connection, (activeRequestsByConnection.get(connection) ?? 0) + 1);
  try {
    const MAX_ATTEMPTS = 2;
    for (let attempt = 1; ; attempt++) {
      try {
        return await send();
      } catch (err) {
        if (isCancellationError(err)) {
          if (settlement)
            settlement.cancelled = true;
          return void 0;
        }
        if (isStreamError(err)) {
          return void 0;
        }
        if (isContentModifiedError(err)) {
          if (attempt < MAX_ATTEMPTS && !signal?.aborted)
            continue;
          return void 0;
        }
        throw err;
      }
    }
  } finally {
    const remaining = (activeRequestsByConnection.get(connection) ?? 1) - 1;
    if (remaining > 0)
      activeRequestsByConnection.set(connection, remaining);
    else
      activeRequestsByConnection.delete(connection);
    if (signal && onAbort)
      signal.removeEventListener("abort", onAbort);
    tokenSource?.dispose();
  }
}
function isCancellationError(err) {
  const code = err?.code;
  return code === -32800 || code === -32802;
}
function isContentModifiedError(err) {
  return err?.code === -32801;
}
function isStreamError(err) {
  if (!(err instanceof Error))
    return false;
  const msg = err.message.toLowerCase();
  return msg.includes("stream") || msg.includes("destroyed") || msg.includes("closed") || msg.includes("disposed") || msg.includes("cancelled") || err.code === "ERR_STREAM_DESTROYED" || err.code === "ERR_STREAM_WRITE_AFTER_END" || err.code === "EPIPE";
}
function positiveIntFromEnv(name, fallback) {
  const raw = process.env[name];
  if (!raw)
    return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0)
    return fallback;
  return parsed;
}
function detectWorkspaceDiagnosticsSupport(initResult) {
  const capabilities = typeof initResult === "object" && initResult !== null ? initResult.capabilities : void 0;
  const diagnosticProvider = capabilities?.diagnosticProvider;
  if (!diagnosticProvider) {
    return {
      advertised: false,
      mode: "push-only",
      workspaceDiagnostics: false,
      diagnosticProviderKind: "none"
    };
  }
  if (typeof diagnosticProvider === "boolean") {
    return {
      advertised: diagnosticProvider,
      mode: diagnosticProvider ? "pull" : "push-only",
      // The boolean form of diagnosticProvider only signals document pull.
      workspaceDiagnostics: false,
      diagnosticProviderKind: "boolean"
    };
  }
  if (typeof diagnosticProvider === "object") {
    return {
      advertised: true,
      mode: "pull",
      workspaceDiagnostics: diagnosticProvider.workspaceDiagnostics === true,
      diagnosticProviderKind: "object"
    };
  }
  return {
    advertised: false,
    mode: "push-only",
    workspaceDiagnostics: false,
    diagnosticProviderKind: typeof diagnosticProvider
  };
}
function detectExecuteCommands(initResult) {
  const capabilities = typeof initResult === "object" && initResult !== null ? initResult.capabilities : void 0;
  const provider = capabilities?.executeCommandProvider;
  if (typeof provider !== "object" || provider === null)
    return [];
  const commands = provider.commands;
  if (!Array.isArray(commands))
    return [];
  return commands.filter((cmd) => typeof cmd === "string");
}
function detectOperationSupport(initResult) {
  const capabilities = typeof initResult === "object" && initResult !== null ? initResult.capabilities : void 0;
  const hasProvider = (key) => {
    const value = capabilities?.[key];
    if (value === void 0 || value === null)
      return false;
    if (typeof value === "boolean")
      return value;
    return isCapabilityRecord(value);
  };
  const codeActionProvider = capabilities?.codeActionProvider;
  const workspace = capabilities?.workspace;
  const fileOperations = isCapabilityRecord(workspace) ? workspace.fileOperations : void 0;
  return {
    definition: hasProvider("definitionProvider"),
    typeDefinition: hasProvider("typeDefinitionProvider"),
    declaration: hasProvider("declarationProvider"),
    references: hasProvider("referencesProvider"),
    hover: hasProvider("hoverProvider"),
    signatureHelp: hasProvider("signatureHelpProvider"),
    documentSymbol: hasProvider("documentSymbolProvider"),
    workspaceSymbol: hasProvider("workspaceSymbolProvider"),
    codeAction: hasProvider("codeActionProvider"),
    codeActionResolve: isCapabilityRecord(codeActionProvider) && codeActionProvider.resolveProvider === true,
    rename: hasProvider("renameProvider"),
    willRenameFiles: isCapabilityRecord(fileOperations) && isFileOperationRegistrationOptions(fileOperations.willRename),
    didRenameFiles: isCapabilityRecord(fileOperations) && isFileOperationRegistrationOptions(fileOperations.didRename),
    implementation: hasProvider("implementationProvider"),
    callHierarchy: hasProvider("callHierarchyProvider")
  };
}
function isCapabilityRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isFileOperationRegistrationOptions(value) {
  return parseFileOperationFilters(value) !== void 0;
}
function parseFileOperationFilters(value) {
  if (!isCapabilityRecord(value) || !Array.isArray(value.filters)) {
    return void 0;
  }
  const filters = [];
  for (const entry of value.filters) {
    if (!isCapabilityRecord(entry))
      return void 0;
    const pattern = entry.pattern;
    if (!isCapabilityRecord(pattern) || typeof pattern.glob !== "string" || pattern.glob.trim() === "") {
      return void 0;
    }
    if (entry.scheme !== void 0 && (typeof entry.scheme !== "string" || entry.scheme.trim() === "" || !/^[A-Za-z][A-Za-z0-9+.-]*$/.test(entry.scheme))) {
      return void 0;
    }
    const matches = pattern.matches;
    if (matches !== void 0 && matches !== "file" && matches !== "folder") {
      return void 0;
    }
    if (pattern.options !== void 0 && !isCapabilityRecord(pattern.options)) {
      return void 0;
    }
    const options = isCapabilityRecord(pattern.options) ? pattern.options : void 0;
    if (options?.ignoreCase !== void 0 && typeof options.ignoreCase !== "boolean") {
      return void 0;
    }
    filters.push({
      scheme: entry.scheme?.toLowerCase(),
      glob: pattern.glob,
      matches: matches === "file" || matches === "folder" ? matches : void 0,
      ignoreCase: options?.ignoreCase === true
    });
  }
  return filters;
}
async function fileOperationFiltersMatch(filters, oldUri, newUri, oldFilePath, newFilePath) {
  if (!filters || filters.length === 0)
    return false;
  const candidates = [oldUri, newUri].flatMap(fileOperationUriCandidates);
  const entityKind = filters.some((filter) => filter.matches !== void 0) ? await probeRenameEntityKind(oldFilePath, newFilePath) : void 0;
  for (const filter of filters) {
    if (filter.scheme !== void 0 && filter.scheme !== "file")
      continue;
    if (filter.matches !== void 0 && filter.matches !== entityKind)
      continue;
    for (const candidate of candidates) {
      try {
        if (minimatch(candidate, filter.glob, {
          nocase: filter.ignoreCase,
          dot: true
        })) {
          return true;
        }
      } catch {
      }
    }
  }
  return false;
}
function fileOperationUriCandidates(uri) {
  let parsed;
  try {
    parsed = new URL(uri);
  } catch {
    return [];
  }
  if (parsed.protocol.toLowerCase() !== "file:")
    return [];
  let uriPath;
  try {
    uriPath = decodeURIComponent(parsed.pathname).replace(/\\/g, "/");
  } catch {
    return [];
  }
  return [uriPath];
}
async function probeRenameEntityKind(oldFilePath, newFilePath) {
  for (const filePath of [oldFilePath, newFilePath]) {
    try {
      const info = await lstat(filePath);
      return info.isDirectory() ? "folder" : "file";
    } catch {
    }
  }
  return void 0;
}

// dist/clients/lsp/grouping.js
function groupFilesByPrimaryServer(files2) {
  const byServer = /* @__PURE__ */ new Map();
  for (const filePath of files2) {
    const servers = getServersForFileWithConfig(filePath);
    const primary = servers[0]?.id ?? "none";
    const group = byServer.get(primary);
    const fallbackFamilyHeads = /* @__PURE__ */ new Map();
    const familyHeads = servers.map((server) => {
      const head = server.fallbackFor ? fallbackFamilyHeads.get(server.fallbackFor) ?? server.fallbackFor : server.id;
      fallbackFamilyHeads.set(server.id, head);
      return head;
    });
    const multiServer = new Set(familyHeads).size > 1;
    if (group) {
      group.files.push(filePath);
      if (multiServer)
        group.multiServer = true;
    } else {
      byServer.set(primary, { files: [filePath], multiServer });
    }
  }
  return [...byServer.values()];
}
async function runPerServerGroups(groups, concurrency, processGroup, signal) {
  let nextGroup = 0;
  const workers = Math.min(Math.max(1, concurrency), groups.length);
  await Promise.all(Array.from({ length: workers }, async () => {
    while (!signal?.aborted) {
      const gi = nextGroup;
      nextGroup += 1;
      if (gi >= groups.length)
        break;
      await processGroup(groups[gi]);
    }
    return true;
  }));
}

// dist/clients/lsp/language.js
import path15 from "node:path";
var LANGUAGE_EXTENSIONS = EXTENSION_TO_LSP_ID;
var BASENAME_LANGUAGE_PATTERNS = (() => {
  const lspCapableKinds = new Set(getLspCapableKinds());
  return SPECIAL_FILENAMES.filter(({ kind }) => lspCapableKinds.has(kind)).map(({ pattern, kind }) => ({
    pattern,
    languageId: getLanguageId(kind)
  }));
})();
function getBasenameLanguageId(base) {
  return BASENAME_LANGUAGE_PATTERNS.find(({ pattern }) => pattern.test(base))?.languageId;
}
function getLanguageId2(filePath) {
  const ext = path15.extname(filePath).toLowerCase();
  if (ext && LANGUAGE_EXTENSIONS[ext]) {
    return LANGUAGE_EXTENSIONS[ext];
  }
  const base = path15.basename(filePath);
  return LANGUAGE_EXTENSIONS[base] ?? LANGUAGE_EXTENSIONS[base.toLowerCase()] ?? getBasenameLanguageId(base);
}

// dist/clients/lsp/spawn-history.js
var MAX_SERVER_HISTORIES = 64;
var successfulSpawnDurationMs = new BoundedFifoMap(MAX_SERVER_HISTORIES);
function recordSuccessfulLspSpawn(serverId, durationMs) {
  if (!Number.isFinite(durationMs) || durationMs < 0)
    return;
  successfulSpawnDurationMs.delete(serverId);
  successfulSpawnDurationMs.set(serverId, durationMs);
}
function getSuccessfulLspSpawnDurationMs(serverId) {
  return successfulSpawnDurationMs.get(serverId);
}

// dist/clients/lsp/auxiliary-lifecycle.js
function readEnvAuxGraceMs() {
  const raw = process.env.PI_LENS_AUX_GRACE_MS;
  if (raw === void 0)
    return void 0;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0)
    return void 0;
  return parsed;
}
var DEFAULT_AUX_GRACE_CEILING_MS = 2e3;
var MAX_ADAPTIVE_AUX_GRACE_CEILING_MS = 8e3;
var ADAPTIVE_AUX_GRACE_MARGIN_MS = 500;
function auxWaitBudgetMs(serverId, isCold, configuredCeilingMs, declaredWaitMs) {
  if (configuredCeilingMs !== void 0 || !isCold) {
    return Math.min(declaredWaitMs, configuredCeilingMs ?? DEFAULT_AUX_GRACE_CEILING_MS);
  }
  const observedSpawnMs = getSuccessfulLspSpawnDurationMs(serverId);
  if (observedSpawnMs === void 0 || observedSpawnMs <= 0) {
    return Math.min(declaredWaitMs, DEFAULT_AUX_GRACE_CEILING_MS);
  }
  return Math.min(MAX_ADAPTIVE_AUX_GRACE_CEILING_MS, Math.max(declaredWaitMs, observedSpawnMs + ADAPTIVE_AUX_GRACE_MARGIN_MS));
}

// dist/clients/lazy-import.js
function createLazyImport(load) {
  let cached;
  return {
    get() {
      return cached ??= Promise.resolve().then(() => load()).catch((err) => {
        cached = void 0;
        throw err;
      });
    },
    resetForTests() {
      cached = void 0;
    }
  };
}

// dist/clients/lsp-lazy.js
var lazyLsp = createLazyImport(() => import("./chunk-KSX3TXSZ.js"));
function warmLspService() {
  return lazyLsp.get();
}
function loadLspService() {
  return warmLspService();
}

// dist/clients/warm-attach.js
var state3 = { local: true, servedDiagnosticHashes: /* @__PURE__ */ new Map() };
function record(event, cwd, reason, pid, source) {
  logLatency({
    type: "phase",
    phase: "lsp_warm_attach",
    filePath: cwd,
    durationMs: 0,
    metadata: { event, reason, incumbentPid: pid, source }
  });
}
function selectWarmAttachIncumbent(entries, cwd, now = Date.now(), isPidAlive = realIsPidAlive) {
  return selectLivePeerInstances(entries, cwd, now, isPidAlive)[0];
}
async function tryWarmAttachedDiagnostics(file, content, timeoutMs, source = "per-edit") {
  if (state3.local || !state3.cwd || !state3.incumbentPid)
    return void 0;
  const entries = await readInstanceRegistry();
  const incumbent = selectWarmAttachIncumbent(entries, state3.cwd);
  if (incumbent?.pid !== state3.incumbentPid) {
    promoteToLocal("incumbent-stale-or-exited");
    return void 0;
  }
  const result = await requestWarmDiagnostics(state3.cwd, state3.incumbentPid, file, content, timeoutMs);
  if (!result.available) {
    if (result.reason === "no-listener") {
      recordDegradationOnce({
        kind: "warm-ipc-endpoint-missing",
        subject: diagnosticsIpcPathForCwd(state3.cwd, state3.incumbentPid),
        reason: "the registry confirms this incumbent is alive but nothing is listening on its derived endpoint \u2014 if pi-lens was upgraded while it was running, restart it"
      });
    }
    promoteToLocal(result.reason);
  } else {
    record("diagnostics-served", file, void 0, state3.incumbentPid, source);
  }
  return result;
}
async function tryWarmAttachedCodeActions(file, expectedContentHash, ranges, timeoutMs) {
  if (state3.local || !state3.cwd || !state3.incumbentPid)
    return void 0;
  const result = await requestWarmCodeActions(state3.cwd, state3.incumbentPid, file, expectedContentHash, ranges, timeoutMs);
  if (result.available) {
    record("code-actions-served", file, void 0, state3.incumbentPid);
  } else {
    record("code-actions-skipped", file, result.reason, state3.incumbentPid);
  }
  return result;
}
function isWarmAttached() {
  return !state3.local && state3.incumbentPid !== void 0;
}
function promoteToLocal(reason) {
  if (state3.local)
    return;
  const pid = state3.incumbentPid;
  state3.local = true;
  state3.incumbentPid = void 0;
  record("takeover", state3.cwd ?? process.cwd(), reason, pid);
}

// dist/clients/lsp/index.js
function textDocumentSaveOf(client) {
  if (typeof client.getSaveOptions !== "function")
    return void 0;
  const save = client.getSaveOptions();
  if (!save)
    return "none";
  return save.includeText ? "save+text" : "save";
}
var WORKSPACE_ATTRIBUTION_CLIENT_CAP = 16;
var AUX_WAIT_DEMOTION_THRESHOLD = 5;
var AUX_WAIT_DEMOTION_RATIO = 0.9;
var AUX_WAIT_REPROMOTION_THRESHOLD = 5;
var AUX_WAIT_REPROMOTION_RATIO = 0.5;
var ADOPTED_ROOT_CAP = 2;
var ADOPTED_ROOT_IDLE_EVICT_MS = 6e4;
function destinationUriPreservingSpelling(oldUri, oldFilePath, newFilePath) {
  const canonical = pathToFileURL3(newFilePath);
  try {
    const original = new URL3(oldUri);
    const authority = /^file:\/\/([^/]*)/i.exec(oldUri)?.[1] ?? "";
    if (original.protocol !== "file:" || original.host !== "" && original.hostname !== "localhost") {
      return canonical.href;
    }
    const canonicalDestination = () => `${original.protocol}//${authority}${canonical.pathname}`;
    const oldParent = path16.resolve(path16.dirname(oldFilePath));
    const newParent = path16.resolve(path16.dirname(newFilePath));
    if (normalizeMapKey(oldParent) !== normalizeMapKey(newParent)) {
      return canonicalDestination();
    }
    const slash = original.pathname.lastIndexOf("/");
    if (slash < 0)
      return canonicalDestination();
    let rawName = canonical.pathname.slice(canonical.pathname.lastIndexOf("/") + 1);
    const oldRawName = original.pathname.slice(slash + 1);
    const oldName = decodeURIComponent(oldRawName);
    const expectedOldName = path16.basename(oldFilePath);
    if (oldName.toLowerCase() !== expectedOldName.toLowerCase()) {
      return canonicalDestination();
    }
    for (const match of oldRawName.matchAll(/%([0-9a-f]{2})/gi)) {
      const encoded = match[0];
      const decoded = String.fromCharCode(Number.parseInt(match[1], 16));
      rawName = rawName.split(decoded).join(encoded);
    }
    return `${original.protocol}//${authority}${original.pathname.slice(0, slash + 1)}${rawName}`;
  } catch {
    return canonical.href;
  }
}
function deepMergeObjects(base, override) {
  const result = { ...base };
  for (const [key, val] of Object.entries(override)) {
    if (val !== null && typeof val === "object" && !Array.isArray(val) && result[key] !== null && typeof result[key] === "object" && !Array.isArray(result[key])) {
      result[key] = deepMergeObjects(result[key], val);
    } else {
      result[key] = val;
    }
  }
  return result;
}
function mergeInitializationOptions(base, override) {
  if (!override)
    return base;
  if (!base)
    return override;
  return deepMergeObjects(base, override);
}
var BROKEN_BASE_COOLDOWN_MS = 15e3;
var BROKEN_MAX_COOLDOWN_MS = 5 * 6e4;
var BROKEN_PERMANENT_AFTER = 5;
var RUNTIME_EXIT_UPTIME_THRESHOLD_MS = 6e4;
var RUNTIME_EXIT_WINDOW_MS = 15 * 6e4;
var RUNTIME_EXIT_WINDOW_TRIP_COUNT = BROKEN_PERMANENT_AFTER;
var RUNTIME_EXIT_WINDOW_UPTIME_CEILING_MS = 10 * 6e4;
var NOTIFY_BACKPRESSURE_BROKEN_AFTER = 3;
var OPTIONAL_LSP_RETRY_COOLDOWN_MS = 5 * 6e4;
var OPTIONAL_LSP_SERVER_IDS = /* @__PURE__ */ new Set();
var NAV_CLIENT_WAIT_TIMEOUT_MS = Math.max(0, Number.parseInt(process.env.PI_LENS_LSP_NAV_CLIENT_WAIT_MS ?? "1500", 10) || 1500);
var TOUCH_DEBOUNCE_MS = Math.max(0, Number.parseInt(process.env.PI_LENS_LSP_TOUCH_DEBOUNCE_MS ?? "1500", 10) || 1500);
var SCOPED_DEPENDENCY_TOUCH_MAX = 32;
var RENAME_NOTIFY_TIMEOUT_MS = Math.max(50, Number.parseInt(process.env.PI_LENS_LSP_RENAME_NOTIFY_TIMEOUT_MS ?? "1500", 10) || 1500);
async function runRenameNotify(send, timeoutMs) {
  try {
    await withTimeout(send(), timeoutMs);
    return { ok: true };
  } catch (err) {
    const timedOut = err instanceof Error && err.message.startsWith("Timeout after");
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      disposition: timedOut ? "timedOut" : "rejected"
    };
  }
}
var DEFAULT_LSP_CLIENT_CEILING = 24;
var DEFAULT_IDLE_EVICT_MS = 20 * 6e4;
var DEFAULT_EPHEMERAL_IDLE_EVICT_MS = 6e4;
function getLspIdleEvictMs() {
  for (const name of [
    "PI_LENS_LSP_IDLE_EVICT_MS",
    "PI_LENS_TS_IDLE_EVICT_MS"
  ]) {
    const parsed = Number.parseInt(process.env[name] ?? "", 10);
    if (Number.isSafeInteger(parsed) && parsed > 0)
      return parsed;
  }
  return DEFAULT_IDLE_EVICT_MS;
}
function getEphemeralLspIdleEvictMs() {
  const parsed = Number.parseInt(process.env.PI_LENS_EPHEMERAL_LSP_IDLE_EVICT_MS ?? "", 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : DEFAULT_EPHEMERAL_IDLE_EVICT_MS;
}
function getLspIdleEvictMsForRoot(root) {
  return isEphemeralCheckoutRoot(root) ? getEphemeralLspIdleEvictMs() : getLspIdleEvictMs();
}
function getLspClientCeiling() {
  const parsed = Number.parseInt(process.env.PI_LENS_LSP_CLIENT_CEILING ?? "", 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : DEFAULT_LSP_CLIENT_CEILING;
}
function documentIsOpenOn(client, filePath) {
  const probe = client.isDocumentOpen;
  if (typeof probe !== "function")
    return false;
  try {
    return probe.call(client, filePath) === true;
  } catch {
    return false;
  }
}
function tsserverSyncChannel(client) {
  return {
    getAdvertisedCommands: async () => client.getAdvertisedCommands(),
    executeCommand: (_filePath, command, args) => client.executeCommand(command, args)
  };
}
function warmupTimeoutMs() {
  const raw = Number.parseInt(process.env.PI_LENS_LSP_WARMUP_TIMEOUT_MS ?? "", 10);
  return Number.isFinite(raw) && raw > 0 ? raw : 2e4;
}
function warmupRetryBackoffMs() {
  const raw = Number.parseInt(process.env.PI_LENS_LSP_WARMUP_RETRY_BACKOFF_MS ?? "", 10);
  return Number.isFinite(raw) && raw >= 0 ? raw : 500;
}
function readEnvDiagnosticsWaitMs() {
  const raw = process.env.PI_LENS_LSP_DIAGNOSTICS_MAX_WAIT_MS;
  if (raw === void 0)
    return void 0;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0)
    return void 0;
  return parsed;
}
function readTsserverSyncGraceMs() {
  const raw = process.env.PI_LENS_TSSERVER_SYNC_GRACE_MS;
  if (raw === void 0)
    return 300;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0)
    return 300;
  return parsed;
}
var MAX_TOUCH_CANDIDATES = 8;
var DIAGNOSTICS_SEMANTIC_SETTLE_THRESHOLD_MS = Math.max(0, Number.parseInt(process.env.PI_LENS_LSP_DIAGNOSTICS_SEMANTIC_THRESHOLD_MS ?? "250", 10) || 250);
var DIAGNOSTICS_SEMANTIC_SETTLE_WAIT_MS = Math.max(0, Number.parseInt(process.env.PI_LENS_LSP_DIAGNOSTICS_SEMANTIC_SETTLE_MS ?? "400", 10) || 400);
var EARLY_UNBLOCK_GRACE_MS = Math.max(0, Number.parseInt(process.env.PI_LENS_LSP_EARLY_UNBLOCK_GRACE_MS ?? "400", 10) || 400);
function mergeLspDiagnostics(diagnostics) {
  const merged = [];
  const seen = /* @__PURE__ */ new Set();
  for (const diagnostic of diagnostics) {
    const key = [
      diagnostic.range.start.line,
      diagnostic.range.start.character,
      diagnostic.message
    ].join(":");
    if (seen.has(key))
      continue;
    seen.add(key);
    merged.push(diagnostic);
  }
  return merged;
}
function attributeDiagnostics(serverId, diagnostics) {
  return diagnostics.map((diagnostic) => ({ ...diagnostic, serverId }));
}
function createSweepIndexGate() {
  const seen = /* @__PURE__ */ new Set();
  return {
    consumeFirstTouch(serverId) {
      if (seen.has(serverId))
        return false;
      seen.add(serverId);
      return true;
    }
  };
}
var WORKSPACE_DIAGNOSTICS_CONCURRENCY = 8;
var WORKSPACE_SWEEP_PREOPEN_CHUNK_SIZE = (() => {
  const raw = Number(process.env.PI_LENS_LSP_WORKSPACE_PREOPEN_CHUNK);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 8;
})();
var WORKSPACE_SWEEP_EXCLUDED_SERVER_IDS = /* @__PURE__ */ new Set([
  "opengrep"
]);
function notifyWriteBudgetMs() {
  const raw = Number(process.env.PI_LENS_LSP_NOTIFY_BUDGET_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : 2e3;
}
function primaryServerWaitFloorMs(filePath, maxWaitMs) {
  const serverWaitOverrideMs = getServersForFileWithConfig(filePath).filter((s) => !isAuxiliary(s)).reduce((max, server) => Math.max(max, server.clientWaitTimeoutMs ?? 0), 0);
  return Math.max(maxWaitMs ?? 0, serverWaitOverrideMs);
}
var NOTIFY_WEDGED_BUDGET_MULTIPLIER = 5;
function notifyWedgedMs() {
  return notifyWriteBudgetMs() * NOTIFY_WEDGED_BUDGET_MULTIPLIER;
}
var NOTIFY_WEDGED_EWMA_MULTIPLIER = 2;
var NOTIFY_WEDGED_CAP_MS = 6e4;
function notifyWedgedCapMs() {
  const raw = Number(process.env.PI_LENS_LSP_NOTIFY_WEDGED_CAP_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : NOTIFY_WEDGED_CAP_MS;
}
function notifyStallCpuSampleMs() {
  const raw = Number(process.env.PI_LENS_LSP_NOTIFY_STALL_CPU_SAMPLE_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : 1200;
}
var NOTIFY_STALL_CPU_BUSY_FLOOR_PERCENT = 10;
function workspacePullBudgetMs() {
  const raw = Number(process.env.PI_LENS_LSP_WORKSPACE_PULL_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : 3e4;
}
var DEFAULT_MAX_WORKSPACE_DIAGNOSTIC_FILES = 5e3;
function getMaxWorkspaceDiagnosticFiles() {
  const override = Number.parseInt(process.env.PI_LENS_LSP_WORKSPACE_MAX_FILES ?? "", 10);
  return Number.isFinite(override) && override > 0 ? override : DEFAULT_MAX_WORKSPACE_DIAGNOSTIC_FILES;
}
async function collectWorkspaceDiagnosticFiles(root, maxFiles = getMaxWorkspaceDiagnosticFiles(), signal, homeDir) {
  const files2 = [];
  if (isAtOrAboveHomeDir(root, homeDir))
    return files2;
  const ignoreMatcher = getProjectIgnoreMatcher(root);
  await ignoreMatcher.ensureTrackedIndex();
  async function walk(current) {
    if (signal?.aborted || files2.length >= maxFiles)
      return;
    let entries;
    try {
      entries = await nodeFs2.promises.readdir(current, {
        withFileTypes: true
      });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (signal?.aborted || files2.length >= maxFiles)
        return;
      if (entry.isSymbolicLink())
        continue;
      const full = path16.join(current, entry.name);
      if (entry.isDirectory()) {
        if (isExcludedDirName(entry.name))
          continue;
        if (ignoreMatcher.isIgnored(full, true))
          continue;
        await walk(full);
      } else if (
        // #1974: the getServersForFileWithConfig lookup (an in-memory
        // extension/pathFilter match against the registered LSP servers) is
        // cheap relative to isIgnored's per-call minimatch pattern compile,
        // so it gates first — the same order-independent shape as the four
        // walkers fixed for #1974.
        entry.isFile() && getServersForFileWithConfig(full).length > 0 && !ignoreMatcher.isIgnored(full, false)
      ) {
        files2.push(full);
      }
    }
  }
  await walk(root);
  return files2;
}
var LSPService = class _LSPService {
  static MAX_SIBLING_ANNOUNCEMENTS = 1024;
  sessionCwd;
  state;
  /** Content hashes already announced to a sibling root in this service. */
  siblingAnnouncementHashes = new BoundedFifoMap(_LSPService.MAX_SIBLING_ANNOUNCEMENTS);
  workspaceProbeLogged = /* @__PURE__ */ new Set();
  /** Per-service immutable root-boundary verdicts; root detectors cache hits too. */
  projectBoundaryCache = /* @__PURE__ */ new Map();
  /** Foreign roots are recorded once per normalized root for this service/session. */
  warmStartLogged = /* @__PURE__ */ new Set();
  optionalFailureLogged = /* @__PURE__ */ new Set();
  /** Server/root pairs that already emitted unavailable for the current occurrence. */
  unavailableLogged = /* @__PURE__ */ new Set();
  optionalDisabled = /* @__PURE__ */ new Set();
  /**
   * One first-contact diagnostic wait per custom server in this service
   * generation. Concurrent touches share the probe; a hook cutoff never arms
   * the navigation-only latch, so the next touch can try again.
   */
  firstContactWaits = /* @__PURE__ */ new Map();
  /** Session-scoped adaptive demotion for budget-hitting auxiliaries. */
  auxWaitPressureStreak = /* @__PURE__ */ new Map();
  auxWaitFastAnswerStreak = /* @__PURE__ */ new Map();
  demotedAuxiliaryServerIds = /* @__PURE__ */ new Set();
  demotedAuxiliaryBudgets = /* @__PURE__ */ new Map();
  /**
   * #1934 review F1: what the last COMPLETED `spawnClient` call for a
   * (server, root) key decided, written by that call at every point it
   * returns without a client. This is a direct signal, deliberately NOT an
   * inference from breaker state: the "binary unavailable while installs are
   * disabled" branch sets a cooldown yet is a POLICY decline by its own
   * comment, so reading the cooldown mislabels it as a server failure.
   *
   * Not a latch, and nothing re-arms it at `session_start`. Every read sits
   * in the same microtask as the `await` of the spawn promise that just
   * wrote it, so a stale entry is unreachable: a read is always preceded by
   * its own attempt's write. Cardinality matches `state.clients` — one entry
   * per (server, root) — and a successful spawn deletes its entry.
   */
  lastSpawnVerdict = /* @__PURE__ */ new Map();
  /** Consecutive failure counts for exponential backoff circuit breaker */
  failureCounts = /* @__PURE__ */ new Map();
  /**
   * #1127: consecutive EARLY post-init runtime exits — a client that closed
   * unexpectedly (not via our own `shutdown()`) with an uptime under
   * {@link RUNTIME_EXIT_UPTIME_THRESHOLD_MS}. Tracked separately from
   * {@link failureCounts} because a successful spawn/initialize clears that
   * map (correct for the spawn/init failure class it was built for — see
   * `spawnClient`'s success path) but is exactly the event a crash-loop
   * server keeps producing right before it dies again; reusing the same map
   * would make every respawn erase the streak the moment it re-spawned,
   * which is the #1127 bug. This counter shares the SAME cooldown formula,
   * the SAME `state.broken`/`permanentlyBroken` maps, and the SAME
   * give-up-after-N-failures threshold as the spawn/init breaker — it is a
   * parallel counter feeding one circuit, not a second mechanism.
   */
  runtimeExitCounts = /* @__PURE__ */ new Map();
  /**
   * #1142: rolling window of recent non-intentional death timestamps
   * (`exitedAt`) per "serverId:root" key (the SAME identity as
   * {@link runtimeExitCounts} and {@link LSPState.broken} — defect shape 1) —
   * the SECOND, independent breaker trip condition that COMPOSES with the
   * {@link runtimeExitCounts} fast path. That counter only sees CONSECUTIVE
   * exits under the 60s threshold; a server that dies just PAST it every spawn
   * resets that streak forever (#1142). This window trips when
   * {@link RUNTIME_EXIT_WINDOW_TRIP_COUNT} deaths fall within
   * {@link RUNTIME_EXIT_WINDOW_MS}, regardless of each death's lifetime.
   *
   * Bounded on BOTH axes (defect shape 9): entries older than the window are
   * pruned on every record, AND the array is hard-capped at the trip count
   * (drop-oldest) — a rate trip needs only the count within the window, never
   * an unbounded history of timestamps. No timer backs it (defect shape 4): it
   * ages purely by prune-on-check, so there is nothing to `unref()` or
   * print-mode-gate. Like {@link runtimeExitCounts} it is a per-instance field,
   * so a fresh `LSPService` (via `resetLSPService`) starts empty.
   */
  runtimeExitWindow = /* @__PURE__ */ new Map();
  /** Server/root keys disabled for the rest of this session after repeated failures. */
  permanentlyBroken = /* @__PURE__ */ new Set();
  /**
   * Last non-empty diagnostic result per normalized file path.
   * Returned as a fallback when no live LSP clients are available so the
   * widget keeps showing the last known issues rather than going blank.
   */
  lastKnownDiagnostics = /* @__PURE__ */ new Map();
  /**
   * SHA-256 of the file content that produced the matching {@link
   * lastKnownDiagnostics} entry, when that content is known (set by
   * {@link touchFile}). Lets a hot-path consumer verify a cached entry is for
   * the *current* bytes before trusting it as fresh — see
   * {@link getLastKnownDiagnostics}. Absent for entries written without content
   * (the service-level {@link getDiagnostics} merge), so a hash-guarded read of
   * those falls through to a fresh check rather than serving a stale result.
   */
  lastKnownContentHash = /* @__PURE__ */ new Map();
  /**
   * #1783: what content actually landed on a language server, per document.
   * The drift sweep compares disk (size, mtime) against these records and
   * resynchronizes anything an untracked edit moved behind the server's back.
   * See `document-drift.ts` for the key design and the pacing rules.
   */
  documentDrift = new DocumentDriftTracker();
  /**
   * #1095: lazily verifies a stored {@link DiagnosticBinding} against current
   * disk bytes, memoizing the disk fingerprint per (file, mtime) so repeated
   * binding reads across `touchFile`/`getAllDiagnostics` within a session don't
   * re-hash unchanged files. Owned by the service so the memo is shared.
   */
  diskBindingCache = createDiskBindingCache();
  lastDiagnosticsHealth = /* @__PURE__ */ new Map();
  /**
   * Touch-debounce record of "this server already has this content", keyed
   * "normalizedFilePath:clientScope:serverId".
   *
   * #743/#1253: the serverId component is load-bearing. #1253 requires that a
   * server whose notify write never landed does NOT get an entry (otherwise the
   * next touch debounces the re-push and the silent-clean gates read its silence
   * as a confirmed clean). #743 requires that one wedged server must not degrade
   * its healthy siblings. A file-level key can only satisfy one of those at a
   * time — per-server, both hold: the stalled server simply has no entry and is
   * re-pushed, while every sibling whose write landed keeps its own debounce.
   *
   * #3501: an entry speaks only for the client instance whose write marked it.
   * A client that crashes or is evicted inside the window leaves an entry its
   * respawned replacement must not inherit: the replacement was never sent the
   * content. (A client already dead at the write resolves `false` since #3543,
   * so it marks no entry.)
   * Weak, so an entry never pins a retired client's state.
   */
  recentTouches = /* @__PURE__ */ new Map();
  /**
   * #743: consecutive per-server notify-write timeout count, keyed by
   * "serverId:normalizedRoot" — the SAME identity as {@link LSPState.broken}
   * and {@link demonstratedReadyKeyFor}. A server that backpressures its stdin
   * write {@link NOTIFY_BACKPRESSURE_BROKEN_AFTER} times in a row is demoted
   * into the broken cooldown (see {@link recordNotifyWriteBackpressure}); any
   * successful write clears its entry.
   */
  notifyWriteBackpressureStreak = /* @__PURE__ */ new Map();
  /**
   * #2358: EWMA of one auxiliary's per-document drain latency
   * (ms per unacknowledged write), keyed by "serverId:normalizedRoot".
   *
   * Updated from DRAINED notify barriers only: the round-trip proves the
   * server processed its `outstanding` backlog, and
   * duration / outstanding is the per-write service time a single-threaded
   * scanner actually achieves under load. The breaker grants a wedged write
   * `k x ewma x unacked` of patience from it, so a slow-but-alive scanner is
   * not killed at the fixed window by construction (#2358).
   *
   * Cleared by the service teardown (via `session_start`) like the rest of
   * the breaker state; a stale throughput estimate from a previous session's
   * client must not price the next one.
   */
  auxNotifyDrainLatencyEwma = /* @__PURE__ */ new Map();
  /**
   * #1714: unacknowledged auxiliary document notifies per server key
   * ("serverId:normalizedRoot" — the same identity as every other gate here).
   *
   * `unacked` counts notifies ISSUED to this client that the server has not yet
   * been proven to have PROCESSED. It rises with each write the sweep hands over
   * and falls only when a drain barrier round-trips (see {@link paceAuxNotify}).
   * `drain` holds the one in-flight barrier so a burst shares a single
   * round-trip instead of each touch sending its own.
   *
   * `gateOpen` is the fail-open latch. A scanner that will not answer the
   * barrier inside the caller's budget has stopped being a pacing problem and
   * become a stall, which #743's write deadline, streak and wedge timer already
   * own — and they own it by DEMOTING and respawning, which pacing can never do.
   * Once latched, this gate steps aside for the rest of the client's life and
   * every notify takes the pre-#1714 path. It re-arms on the only event that
   * means the stall is over: a new client generation, which gets a new record.
   *
   * Cleared wholesale by the service teardown (`session_start` runs through it),
   * by {@link demoteForNotifyStall}, and per key whenever the client identity
   * changes, so no count can outlive the client it describes.
   */
  auxNotifyInflight = /* @__PURE__ */ new Map();
  /**
   * #1459: the ONE outstanding auxiliary notify write per server key
   * ("serverId:normalizedRoot"). A `reopenOnResync` scanner re-parses the whole
   * file on every `didOpen`, so a `clientScope: "all"` sweep that fans out
   * across a neighbour set pushes N full re-scans at it inside a few
   * milliseconds; its stdin stops draining and the #743 write deadline expires
   * for each one, which walked the breaker open in three touches. The gate keeps
   * a sweep to one in-flight resync per auxiliary: while one is outstanding the
   * next touch DEFERS its write and reports the server as uncovered instead of
   * adding to the flood. `startedAt` dates the outstanding write so a write that
   * never lands is still demoted (see {@link demoteForNotifyStall}).
   */
  outstandingAuxNotifyWrites = /* @__PURE__ */ new Map();
  /**
   * #2356: auxiliary clients removed by the notify-stall breaker are a
   * temporary absence, not a missing scanner. Keep the demotion identity after
   * deleting the client so the turn-end late-coverage probe can re-arm the
   * pending pair until a replacement is published (or its existing bounded
   * re-arm ceiling is reached). A successful replacement removes the marker.
   */
  static MAX_NOTIFY_STALL_DEMOTIONS = 50;
  notifyStallDemotions = new BoundedFifoMap(_LSPService.MAX_NOTIFY_STALL_DEMOTIONS);
  /** LRU clock for capacity eviction, keyed by the canonical server/root key. */
  clientLastUsedAt = /* @__PURE__ */ new Map();
  /** LRU of foreign project roots; kept apart from the session-root registry. */
  adoptedRootLastUsedAt = /* @__PURE__ */ new Map();
  adoptedClientKeys = /* @__PURE__ */ new Set();
  /**
   * Manager-owned use leases close the acquisition/use gap that `isBusy()`
   * cannot see: a caller may hold a selected client before its first request has
   * entered the client. Eviction skips any key with an outstanding lease.
   */
  clientLeases = /* @__PURE__ */ new Map();
  /**
   * Per-root idle eviction for servers whose registry policy is `transparent`.
   * Timers are unref'd so an idle language service cannot keep a one-shot host
   * alive, and are removed before shutdown so a concurrent request rebuilds
   * instead of receiving the retiring client.
   */
  idleEvictionTimers = /* @__PURE__ */ new Map();
  /** Serializes capacity decisions with publication into `state.inFlight`. */
  clientSpawnGate = Promise.resolve();
  /** True after shutdown() has been called; blocks new operations */
  isDestroyed = false;
  /** Aborts bounded in-flight service work when this generation is retired. */
  shutdownController = new AbortController();
  /**
   * #850: teardown completion for every singleton generation retired before
   * this service was published. Only replacement services receive one; direct
   * `new LSPService()` callers and the first singleton generation stay hot-path
   * identical. Cleared after the first completed wait so warm reuse never pays
   * a permanent promise/microtask tax.
   */
  generationHandoff;
  constructor(generationHandoff, sessionCwd) {
    this.generationHandoff = generationHandoff;
    this.sessionCwd = sessionCwd;
    this.state = {
      clients: /* @__PURE__ */ new Map(),
      servers: /* @__PURE__ */ new Map(),
      broken: /* @__PURE__ */ new Map(),
      inFlight: /* @__PURE__ */ new Map(),
      clientSpawnedAt: /* @__PURE__ */ new Map(),
      demonstratedReady: /* @__PURE__ */ new Set(),
      demonstratedCold: /* @__PURE__ */ new Set(),
      diagnosticsPublished: /* @__PURE__ */ new Set(),
      diagnosticsUnsupported: /* @__PURE__ */ new Set()
    };
  }
  isAuxiliaryWaitDemoted(serverId, root) {
    return this.demotedAuxiliaryServerIds.has(`${serverId}:${normalizeMapKey(root ?? "")}`);
  }
  noteAuxiliaryWait(key, budgetMs, elapsedMs) {
    if (this.demotedAuxiliaryServerIds.has(key))
      return;
    if (elapsedMs < AUX_WAIT_DEMOTION_RATIO * budgetMs) {
      this.auxWaitPressureStreak.delete(key);
      return;
    }
    const streak = (this.auxWaitPressureStreak.get(key) ?? 0) + 1;
    if (streak >= AUX_WAIT_DEMOTION_THRESHOLD) {
      this.demotedAuxiliaryServerIds.add(key);
      this.demotedAuxiliaryBudgets.set(key, budgetMs);
      this.auxWaitPressureStreak.delete(key);
      this.auxWaitFastAnswerStreak.delete(key);
      recordDegradationOnce({
        kind: "aux_wait_demoted",
        subject: key,
        reason: "auxiliary reached at least 90% of its declared wait budget for five consecutive dispatches"
      });
      return;
    }
    this.auxWaitPressureStreak.set(key, streak);
  }
  noteAuxiliaryLateAnswer(key, elapsedMs) {
    if (!this.demotedAuxiliaryServerIds.has(key))
      return;
    const budgetMs = this.demotedAuxiliaryBudgets.get(key);
    if (budgetMs === void 0 || elapsedMs >= AUX_WAIT_REPROMOTION_RATIO * budgetMs) {
      this.auxWaitFastAnswerStreak.delete(key);
      return;
    }
    const streak = (this.auxWaitFastAnswerStreak.get(key) ?? 0) + 1;
    if (streak < AUX_WAIT_REPROMOTION_THRESHOLD) {
      this.auxWaitFastAnswerStreak.set(key, streak);
      return;
    }
    this.demotedAuxiliaryServerIds.delete(key);
    this.demotedAuxiliaryBudgets.delete(key);
    this.auxWaitFastAnswerStreak.delete(key);
    recordDegradationOnce({
      kind: "aux_wait_repromoted",
      subject: key,
      reason: "auxiliary produced five consecutive late answers below half its declared wait budget"
    });
  }
  analysisRootModeForFile(filePath) {
    const roots = getSessionRootsForTelemetry(128);
    if (this.sessionCwd)
      roots.push(this.sessionCwd);
    let adopted = false;
    for (const root of new Set(roots)) {
      const mode = resolveAnalysisRoot(filePath, root);
      if (mode === "session" || mode === "linked-worktree")
        return mode;
      adopted ||= mode === "adopted";
    }
    return adopted ? "adopted" : "none";
  }
  fileIsOutsideRegisteredRoots(filePath) {
    const roots = getSessionRootsForTelemetry(128);
    if (roots.length === 0)
      return isOutsideAllSessionRoots(filePath);
    return !roots.some((root) => isSameOrWithin(root, filePath));
  }
  admitAdoptedRoot(root, filePath) {
    if (this.analysisRootModeForFile(filePath) !== "adopted")
      return false;
    const normalized = normalizeMapKey(root);
    const liveRoots = /* @__PURE__ */ new Set();
    for (const key of this.state.clients.keys()) {
      if (this.adoptedClientKeys.has(key))
        liveRoots.add(key.slice(key.indexOf(":") + 1));
    }
    for (const root2 of this.adoptedRootLastUsedAt.keys()) {
      if (!liveRoots.has(root2))
        this.adoptedRootLastUsedAt.delete(root2);
    }
    if (liveRoots.has(normalized)) {
      this.adoptedRootLastUsedAt.set(normalized, Date.now());
      return true;
    }
    if (this.adoptedRootLastUsedAt.size < ADOPTED_ROOT_CAP) {
      this.adoptedRootLastUsedAt.set(normalized, Date.now());
      return true;
    }
    this.adoptedRootLastUsedAt.set(normalized, Date.now());
    const victim = [...this.adoptedRootLastUsedAt.keys()].sort((a, b) => (this.adoptedRootLastUsedAt.get(a) ?? 0) - (this.adoptedRootLastUsedAt.get(b) ?? 0)).find((candidate) => candidate !== normalized);
    if (!victim)
      return true;
    this.adoptedRootLastUsedAt.delete(victim);
    for (const [key, client] of this.state.clients) {
      if (!this.adoptedClientKeys.has(key) || !key.endsWith(`:${victim}`))
        continue;
      if ((this.clientLeases.get(key) ?? 0) > 0)
        continue;
      this.retireClient(key);
      void client.shutdown({ reason: "adopted-root-lru" }).catch(() => {
      });
    }
    incrementDegradationCount({
      kind: "lsp-adopted-root-evicted",
      subject: victim,
      reason: `adopted root cap ${ADOPTED_ROOT_CAP} evicted ${victim}`
    });
    return true;
  }
  /**
   * Resolve one server's client identity root. Root selection is hard-bounded
   * by the session cwd, then config-only nested roots reuse an already-hosted
   * same-server ancestor. Real nested projects retain independent clients.
   */
  async resolveServerRoot(server, filePath, onRootFailure) {
    const candidate = await resolveLspServerCwd(server, filePath, this.sessionCwd ?? process.cwd(), onRootFailure);
    if (!candidate)
      return void 0;
    const mode = this.analysisRootModeForFile(filePath);
    if (mode === "adopted") {
      const classifierRoot = resolveAnalysisRootPath(filePath, this.sessionCwd ?? process.cwd());
      if (!classifierRoot || normalizeMapKey(classifierRoot) !== normalizeMapKey(candidate))
        return void 0;
    }
    if (this.fileIsOutsideRegisteredRoots(filePath) && this.analysisRootModeForFile(filePath) !== "adopted")
      return void 0;
    const root = enforceLspRootCeiling(candidate, process.cwd(), filePath);
    if (normalizeMapKey(root) === normalizeMapKey(process.cwd()))
      return root;
    const rootKey = normalizeMapKey(root);
    const prefix = `${server.id}:`;
    let nearestAncestor;
    for (const key of /* @__PURE__ */ new Set([
      ...this.state.clients.keys(),
      ...this.state.inFlight.keys()
    ])) {
      if (!key.startsWith(prefix))
        continue;
      const ancestorKey = key.slice(prefix.length);
      const pathApi = isWindowsPath(ancestorKey) || isWindowsPath(rootKey) ? path16.win32 : path16;
      const relative4 = pathApi.relative(ancestorKey, rootKey);
      if (relative4 === "" || relative4.startsWith("..") || pathApi.isAbsolute(relative4)) {
        continue;
      }
      if (!nearestAncestor || ancestorKey.length > nearestAncestor.length) {
        nearestAncestor = ancestorKey;
      }
    }
    if (!nearestAncestor)
      return root;
    let boundary = this.projectBoundaryCache.get(rootKey);
    if (!boundary) {
      boundary = hasProjectBoundaryMarker(root);
      this.projectBoundaryCache.set(rootKey, boundary);
    }
    if (await boundary)
      return root;
    return this.state.clients.get(`${server.id}:${nearestAncestor}`)?.root ?? nearestAncestor;
  }
  /** Guard: return true if service is shutting down or shut down. Public so a
   *  caller holding this generation can tell a reset from "no client" (#3483). */
  checkDestroyed() {
    return this.isDestroyed;
  }
  /**
   * Keep live same-server clients in sibling package roots current. A
   * didOpen/didChange only updates the client that owns the touched root, but
   * TypeScript importers in another package can retain the old module graph.
   * The notification uses each client's existing #271 watch queue.
   */
  announceToSiblings(filePath, content, contentHash2 = this.hashContent(content)) {
    const normalizedPath = normalizeMapKey(filePath);
    if (this.siblingAnnouncementHashes.get(normalizedPath) === contentHash2) {
      return Promise.resolve();
    }
    return Promise.all(getServersForFileWithConfig(filePath).map((server) => this.resolveServerRoot(server, filePath).then((root) => {
      if (!root)
        return false;
      const ownKey = `${server.id}:${normalizeMapKey(root)}`;
      return this.notifyLiveClientsForServer(server.id, filePath, 2, ownKey, false);
    }))).then(() => {
      this.siblingAnnouncementHashes.set(normalizedPath, contentHash2);
    });
  }
  notifyLiveClientsForServer(serverId, filePath, type, ownKey, includeOwn) {
    let notified = false;
    const prefix = `${serverId}:`;
    for (const [key, client] of this.state.clients) {
      if (!key.startsWith(prefix) || !includeOwn && key === ownKey || !client.isAlive()) {
        continue;
      }
      client.notify.watchedFileChange(filePath, type);
      notified = true;
    }
    return notified;
  }
  async withClientSpawnGate(operation) {
    const previous = this.clientSpawnGate;
    let release;
    this.clientSpawnGate = new Promise((resolve9) => {
      release = resolve9;
    });
    await previous;
    try {
      return await operation();
    } finally {
      release();
    }
  }
  async clientKeyFor(entry, filePath) {
    const root = await this.resolveServerRoot(entry.info, filePath);
    return root ? `${entry.info.id}:${normalizeMapKey(root)}` : void 0;
  }
  async acquireClientLease(entry, filePath) {
    const key = await this.clientKeyFor(entry, filePath);
    if (!key)
      return void 0;
    return this.withClientSpawnGate(async () => {
      if (this.isDestroyed || this.state.clients.get(key) !== entry.client) {
        return void 0;
      }
      this.clientLeases.set(key, (this.clientLeases.get(key) ?? 0) + 1);
      return key;
    });
  }
  async acquireClientLeases(entries, filePath) {
    const keys = await Promise.all(entries.map((entry) => this.clientKeyFor(entry, filePath)));
    if (keys.some((key) => key === void 0))
      return void 0;
    const keyed = entries.map((entry, index) => [keys[index], entry]);
    return this.withClientSpawnGate(async () => {
      if (this.isDestroyed || keyed.some(([key, entry]) => this.state.clients.get(key) !== entry.client)) {
        return void 0;
      }
      for (const [key] of keyed) {
        this.clientLeases.set(key, (this.clientLeases.get(key) ?? 0) + 1);
      }
      return keyed.map(([key, entry]) => ({ key, server: entry.info }));
    });
  }
  releaseClientLease(key, server) {
    const remaining = (this.clientLeases.get(key) ?? 1) - 1;
    if (remaining > 0) {
      this.clientLeases.set(key, remaining);
      return;
    }
    this.clientLeases.delete(key);
    if (this.state.clients.has(key)) {
      this.clientLastUsedAt.set(key, Date.now());
      this.scheduleIdleEviction(key, server);
    }
  }
  async withClientForFileUse(filePath, maxWaitMs, hardCapMs, use) {
    while (!this.isDestroyed) {
      const entry = await this.getClientForFile(filePath, maxWaitMs, hardCapMs);
      if (!entry)
        return void 0;
      const leaseKey = await this.acquireClientLease(entry, filePath);
      if (!leaseKey)
        continue;
      try {
        return await use(entry);
      } finally {
        this.releaseClientLease(leaseKey, entry.info);
      }
    }
    return void 0;
  }
  async makeCapacityForClient(key) {
    const occupiedKeys = new Set(this.state.inFlight.keys());
    for (const [clientKey, client] of this.state.clients) {
      if (client.isAlive())
        occupiedKeys.add(clientKey);
    }
    const occupied = occupiedKeys.size;
    if (occupied < getLspClientCeiling())
      return true;
    const idle = [...this.state.clients.entries()].filter(([candidateKey, client]) => candidateKey !== key && client.isAlive() && client.isBusy?.() !== true && (this.clientLeases.get(candidateKey) ?? 0) === 0).sort(([a], [b]) => (this.clientLastUsedAt.get(a) ?? this.state.clientSpawnedAt.get(a) ?? 0) - (this.clientLastUsedAt.get(b) ?? this.state.clientSpawnedAt.get(b) ?? 0));
    const victim = idle[0];
    if (!victim) {
      logSessionStart(`lsp client ceiling ${getLspClientCeiling()}: spawn declined; all clients are in use`);
      return false;
    }
    const [victimKey, victimClient] = victim;
    this.releaseOutstandingAuxNotifyWrite(victimKey);
    await victimClient.shutdown({ reason: "client_ceiling_lru" });
    this.retireClient(victimKey);
    logSessionStart(`lsp client ceiling ${getLspClientCeiling()}: evicted idle LRU ${victimKey}`);
    return true;
  }
  clearIdleEvictionTimer(key) {
    const timer = this.idleEvictionTimers.get(key);
    if (timer)
      clearTimeout(timer);
    this.idleEvictionTimers.delete(key);
  }
  /**
   * #3585: the ONE retirement of a client generation, used by capacity
   * eviction, idle eviction, notify-stall demotion and the
   * dead-client respawn. Everything keyed to the retired client's lifetime is
   * dropped here, so a replacement starts cold: a path that forgot one entry
   * was the defect shape behind #3502 (readiness) and #3537 (timeout streak).
   * Synchronous on purpose: idle eviction publishes the cold state before it
   * awaits teardown. Callers keep only what differs per path (the shutdown
   * call and its ordering, breaker cooldowns, demotion stamps).
   */
  retireClient(key) {
    this.releaseOutstandingAuxNotifyWrite(key);
    this.state.clients.delete(key);
    this.state.clientSpawnedAt.delete(key);
    this.forgetReadiness(key);
    this.clientLastUsedAt.delete(key);
    if (this.adoptedClientKeys.delete(key)) {
      const root = key.slice(key.indexOf(":") + 1);
      if (![...this.adoptedClientKeys].some((candidate) => candidate.endsWith(`:${root}`)))
        this.adoptedRootLastUsedAt.delete(root);
    }
    this.clearIdleEvictionTimer(key);
    this.auxNotifyInflight.delete(key);
    this.auxNotifyDrainLatencyEwma.delete(key);
  }
  /** Release a notify token and its timer when its client generation retires. */
  releaseOutstandingAuxNotifyWrite(key, token) {
    const current = this.outstandingAuxNotifyWrites.get(key);
    if (!current || token !== void 0 && current !== token)
      return;
    clearTimeout(current.wedgeTimer);
    this.outstandingAuxNotifyWrites.delete(key);
    current.resolveSettled();
  }
  scheduleIdleEviction(key, server) {
    if (server.idleEviction !== "transparent" && !this.adoptedClientKeys.has(key))
      return;
    this.clearIdleEvictionTimer(key);
    const lastUsedAt = this.clientLastUsedAt.get(key) ?? Date.now();
    const root = key.slice(key.indexOf(":") + 1);
    const idleMs = this.adoptedClientKeys.has(key) ? ADOPTED_ROOT_IDLE_EVICT_MS : getLspIdleEvictMsForRoot(root);
    const timer = setTimeout(() => {
      this.idleEvictionTimers.delete(key);
      void this.withClientSpawnGate(async () => {
        if (this.isDestroyed)
          return;
        const client = this.state.clients.get(key);
        if (!client?.isAlive())
          return;
        if (client.isBusy?.() === true || (this.clientLeases.get(key) ?? 0) > 0 || (this.clientLastUsedAt.get(key) ?? 0) !== lastUsedAt) {
          this.scheduleIdleEviction(key, server);
          return;
        }
        this.retireClient(key);
        try {
          await client.shutdown({ reason: "idle_eviction" });
        } catch {
        }
        logSessionStart(`lsp idle eviction: released ${key}`);
        recordDegradation({
          kind: "lsp-idle-eviction",
          subject: key,
          reason: "idle LSP client released to bound memory"
        });
      }).catch(() => {
      });
    }, idleMs);
    timer.unref?.();
    this.idleEvictionTimers.set(key, timer);
  }
  /**
   * Should the whole touchFile call short-circuit? Only when the caller does
   * NOT need diagnostics — those callers still need to wait for the LSP to
   * publish, even if the notify itself is a no-op.
   */
  shouldSkipTouch(filePath, contentFingerprint, clientScope, waitForDiagnostics, spawned) {
    if (waitForDiagnostics)
      return false;
    if (spawned.length === 0)
      return false;
    return spawned.every((entry) => this.shouldSkipNotify(filePath, contentFingerprint, clientScope, entry.info.id, entry.client));
  }
  /**
   * Should the didOpen/didChange notify be skipped while keeping the
   * waitForDiagnostics step? True when the same content was already pushed
   * recently. Skipping the notify avoids the diagnostic-cache clear that
   * notify.open does, so the LSP doesn't restart computation it already
   * finished for the first push.
   *
   * Concretely: the post-write tool_result fires touchFile with
   * diagnosticsMode="none" first; the dispatch-lsp-runner fires it again
   * with diagnosticsMode="document" moments later. Without this check the
   * second call's notify clears in-progress diagnostics and the LSP has to
   * start over — observed as multi-second waits on slow TS projects.
   *
   * Decided PER SERVER (#743): a sibling's stalled write must not cost this
   * server its debounce. See {@link recentTouches}.
   */
  shouldSkipNotify(filePath, contentFingerprint, clientScope, serverId, client) {
    if (TOUCH_DEBOUNCE_MS <= 0)
      return false;
    const previous = this.recentTouches.get(this.recentTouchKey(filePath, clientScope, serverId));
    if (!previous)
      return false;
    const now = Date.now();
    if (now - previous.touchedAt > TOUCH_DEBOUNCE_MS)
      return false;
    if (previous.client.deref() !== client)
      return false;
    return previous.fingerprint === contentFingerprint();
  }
  recentTouchKey(filePath, clientScope, serverId) {
    return `${normalizeMapKey(filePath)}:${clientScope}:${serverId}`;
  }
  markTouched(filePath, contentFingerprint, clientScope, serverId, client) {
    const key = this.recentTouchKey(filePath, clientScope, serverId);
    const now = Date.now();
    this.recentTouches.set(key, {
      fingerprint: contentFingerprint,
      touchedAt: now,
      clientScope,
      client: new WeakRef(client)
    });
    if (this.recentTouches.size > 800) {
      for (const [k, v] of this.recentTouches) {
        if (now - v.touchedAt > TOUCH_DEBOUNCE_MS) {
          this.recentTouches.delete(k);
        }
      }
    }
  }
  /**
   * Key `demonstratedReady`/`clientSpawnedAt`/`state.clients` all share:
   * "serverId:normalizedRoot" — the same identity `ensureClientForServer`
   * uses to store/look up a client. Deliberately resolved from the
   * `LSPServerInfo.root()` config resolver (NOT `LSPClientInfo.root`):
   * `touchFile`'s spawned entries carry both `{ client, info }`, and
   * resolving from `info.root()` guarantees this lines up with
   * `ensureWarmForSweep`'s own key derivation (also via `server.root()`)
   * even for a not-fully-real client (test fixture, or any future client
   * implementation that doesn't independently stamp `.root`).
   */
  async demonstratedReadyKeyFor(server, filePath) {
    const root = await this.resolveServerRoot(server, filePath);
    if (!root)
      return void 0;
    return `${server.id}:${normalizeMapKey(root)}`;
  }
  /**
   * #3502: a retired client's readiness verdicts (ready, or cached cold) do
   * not describe its replacement. Every retirement path (capacity eviction,
   * idle eviction, notify-stall demotion, the dead-client respawn) forgets
   * both, so the next client earns its own.
   */
  forgetReadiness(key) {
    this.state.demonstratedReady.delete(key);
    this.state.demonstratedCold.delete(key);
    this.notifyWriteBackpressureStreak.delete(key);
  }
  markDemonstratedReadyKey(key) {
    this.state.demonstratedReady.add(key);
    this.state.demonstratedCold.delete(key);
  }
  recordBreaker(key, reason) {
    recordDegradationOnce({ kind: "lsp-breaker", subject: key, reason });
  }
  /**
   * #743: record one notify-write timeout for a server and, once it has stalled
   * {@link NOTIFY_BACKPRESSURE_BROKEN_AFTER} times in a row, demote it through
   * the EXISTING broken-cooldown map so subsequent sweeps stop re-paying its
   * notify budget on every file. The wedged client is also evicted: an alive
   * client is reused before the broken check in {@link ensureClientForServer},
   * so the cooldown only bites once the stale client is gone. `key` is
   * "serverId:normalizedRoot" (the broken-map identity); undefined when the
   * server's root could not be resolved, in which case there is nothing to key.
   */
  recordNotifyWriteBackpressure(key, entry, filePath) {
    if (!key)
      return;
    if (this.state.clients.get(key) !== entry.client)
      return;
    const streak = (this.notifyWriteBackpressureStreak.get(key) ?? 0) + 1;
    if (streak < NOTIFY_BACKPRESSURE_BROKEN_AFTER) {
      this.notifyWriteBackpressureStreak.set(key, streak);
      return;
    }
    this.notifyWriteBackpressureStreak.delete(key);
    void this.demoteNotifyStallCpuGuarded(key, entry, filePath, {
      consecutiveTimeouts: NOTIFY_BACKPRESSURE_BROKEN_AFTER
    });
  }
  /**
   * #2358: liveness-guarded teardown for the STREAK ladder.
   *
   * The wedged-write path ({@link decideNotifyStallTeardown}) keeps its own
   * re-arm loop so a busy server's outstanding write stays un-torn-down; the
   * streak ladder has no write to hold — it simply does not demote, and the
   * next three timeouts re-attempt. Generation-guarded after the await so a
   * client replaced mid-sample is never demoted for a verdict about its
   * predecessor.
   */
  async demoteNotifyStallCpuGuarded(key, entry, filePath, reason) {
    if (this.state.clients.get(key) !== entry.client)
      return;
    this.clearIdleEvictionTimer(key);
    const verdict = await this.notifyStallCpuVerdict(entry);
    if (verdict.cpuVerdict === "busy") {
      if (this.state.clients.get(key) === entry.client) {
        this.scheduleIdleEviction(key, entry.info);
      }
      this.logNotifyStallCpuBusy(key, entry, filePath, 0, verdict);
      return;
    }
    if (this.state.clients.get(key) !== entry.client)
      return;
    this.demoteForNotifyStall(key, entry, filePath, {
      ...reason,
      discriminator: "consecutive-timeouts",
      cpuVerdict: verdict.cpuVerdict
    });
  }
  /**
   * #2358: classify a stalled server's live process CPU.
   *
   * A client with no process handle (a test/mock double, a legacy client)
   * reports "unmeasured" — the caller keeps the pre-#2358 demote-at-budget
   * behavior, because there is no liveness evidence to override it. A sampled
   * process that burns a core is BUSY; anything else is FLAT, including a
   * query that failed to resolve the pid — a server we cannot measure is not
   * proven busy, and the replacement self-heal is cheap.
   */
  async notifyStallCpuVerdict(entry) {
    const pid = entry.client.getProcessPid?.();
    if (pid === void 0 || !(Number.isFinite(pid) && pid > 0)) {
      return { cpuVerdict: "unmeasured", cpuPercent: null };
    }
    const sample = await sampleProcessTreeCpuPercent(pid, notifyStallCpuSampleMs(), NOTIFY_STALL_CPU_BUSY_FLOOR_PERCENT);
    if (!sample.measured) {
      return { cpuVerdict: "unmeasured", cpuPercent: null };
    }
    if (sample.busy) {
      return { cpuVerdict: "busy", cpuPercent: sample.cpuPercent };
    }
    return { cpuVerdict: "flat", cpuPercent: sample.cpuPercent };
  }
  /**
   * #2358: one bounded row per busy defer. Not a failure record — the
   * discrimination succeeded — so it is a plain latency phase; its volume is
   * bounded by the re-arm cadence of one outstanding write (at most the wedge
   * cap divided by the budget, ~6 fires at defaults).
   */
  logNotifyStallCpuBusy(key, entry, filePath, outstandingMs, verdict, extra = {}) {
    emitBounded("lsp_notify_stall_cpu_busy", `${key}:${normalizeMapKey(filePath)}`, {
      type: "phase",
      durationMs: outstandingMs,
      metadata: {
        serverId: entry.info.id,
        clientKey: key,
        outstandingMs,
        cpuPercent: verdict.cpuPercent ?? null,
        ...extra
      }
    }, {
      ledgerKind: "lsp-notify-stall-cpu-busy",
      risingEdgePer: "identity"
    });
  }
  /**
   * #2358: the patience window a wedged auxiliary write earns.
   *
   * max(fixed floor, k x EWMA per-write latency x unacked depth), capped so a
   * busy-but-never-draining server still respawns within the cap. The EWMA
   * comes from DRAINED notify barriers (see {@link noteAuxNotifyDrainLatency});
   * with no history the fixed floor (the pre-#2358 window) stands.
   */
  auxNotifyWedgeBudgetMs(key) {
    let budgetMs = notifyWedgedMs();
    const ewma = this.auxNotifyDrainLatencyEwma.get(key);
    if (ewma !== void 0 && ewma > 0) {
      const unacked = this.auxNotifyInflight.get(key)?.unacked ?? 0;
      budgetMs = Math.max(budgetMs, NOTIFY_WEDGED_EWMA_MULTIPLIER * ewma * unacked);
    }
    return Math.min(budgetMs, notifyWedgedCapMs());
  }
  /**
   * The demotion itself, shared by the #743 consecutive-timeout streak and the
   * #1459 wedged-write rule. Both mean the same thing — this client's input path
   * is not moving — and both need the same teardown.
   */
  demoteForNotifyStall(key, entry, filePath, reason) {
    if (this.state.clients.get(key) !== entry.client)
      return;
    this.state.broken.set(key, Date.now() + BROKEN_BASE_COOLDOWN_MS);
    this.notifyStallDemotions.set(key, Date.now());
    void entry.client.shutdown().catch(() => {
    });
    this.retireClient(key);
    logLatency({
      type: "phase",
      phase: "lsp_notify_backpressure_broken",
      filePath: normalizeMapKey(filePath),
      durationMs: 0,
      metadata: {
        serverId: entry.info.id,
        cooldownMs: BROKEN_BASE_COOLDOWN_MS,
        ...reason
      }
    });
  }
  /**
   * #1459: the caller's write deadline is a LATENCY bound, not a health verdict.
   * A scanner whose `didOpen` lands a second after we stopped waiting is slow,
   * not broken, so its late success retracts the timeout it was charged for.
   * Without this, three slow-but-healthy scans in a row opened the breaker and
   * blacked out the security lane for 15 s.
   */
  retractNotifyWriteBackpressure(key, serverId, filePath, outstandingMs, client) {
    if (this.state.clients.get(key) !== client)
      return;
    const streak = this.notifyWriteBackpressureStreak.get(key);
    if (!streak)
      return;
    const streakAfter = streak - 1;
    if (streakAfter <= 0)
      this.notifyWriteBackpressureStreak.delete(key);
    else
      this.notifyWriteBackpressureStreak.set(key, streakAfter);
    logLatency({
      type: "phase",
      phase: "lsp_notify_write_late_landed",
      filePath: normalizeMapKey(filePath),
      durationMs: outstandingMs,
      metadata: { serverId, outstandingMs, streakAfter }
    });
  }
  /**
   * #1714: record that one more document notify went to this auxiliary.
   *
   * Counted at ISSUE time, not on the write's settle: the backlog the sweep
   * builds is what the server still has to read, and a write that has not landed
   * yet is part of it. A client-identity change resets the count, because a
   * respawned server carries none of its predecessor's backlog.
   */
  noteAuxNotifyIssued(key, client) {
    const record2 = this.auxNotifyInflight.get(key);
    if (record2 && record2.client === client) {
      record2.unacked += 1;
      return;
    }
    this.auxNotifyInflight.set(key, { client, unacked: 1 });
  }
  /**
   * #2358: fold one DRAINED notify barrier's per-write latency into the
   * per-key EWMA. A drained round-trip proves the server processed its
   * `outstanding` backlog after the ping; duration / outstanding is the
   * per-document service time the single-threaded scanner actually achieves
   * under load, which is exactly what a busy-server patience window must be
   * priced from (#2358's evidence: an 855 ms per-answer server with an
   * 8-write backlog, able to drain in 10-20 s while healthy).
   */
  noteAuxNotifyDrainLatency(key, durationMs, outstanding, record2) {
    if (!(outstanding > 0 && durationMs > 0))
      return;
    if (record2 && this.auxNotifyInflight.get(key) !== record2)
      return;
    const perWriteMs = durationMs / outstanding;
    const prev = this.auxNotifyDrainLatencyEwma.get(key);
    this.auxNotifyDrainLatencyEwma.set(key, prev === void 0 ? perWriteMs : 0.5 * perWriteMs + 0.5 * prev);
  }
  /**
   * #2358: decide whether a wedged notify write's teardown really fires.
   *
   * Before #2358 the breaker killed a server whose write stayed outstanding
   * past a FIXED window, conflating a dead input path with a busy scanner
   * draining a burst — the live opengrep kill at #2358's head. The decision
   * now has two guards, and the record names which one fired:
   *
   * - the window is ADAPTIVE — max(fixed floor, k x EWMA per-write latency x
   *   unacked depth), capped at {@link notifyWedgedCapMs} — so a server that
   *   historically answers in 855 ms with 8 writes queued earns 13.7 s (k=2),
   *   not 10 s;
   * - past the window, the server's process CPU is sampled twice; a BUSY
   *   server is left alone (the write stays outstanding and the caller re-arms
   *   this timer), a FLAT or unmeasured one is torn down.
   *
   * The hard cap still kills: a busy server that cannot drain inside it is
   * damaged, and the replacement is the self-heal the breaker exists to
   * provide.
   */
  async decideNotifyStallTeardown(key, entry, filePath, token) {
    if (this.state.clients.get(key) !== entry.client || this.outstandingAuxNotifyWrites.get(key) !== token) {
      throw new Error("stale notify generation");
    }
    const outstandingMs = Date.now() - token.startedAt;
    const armedBudgetMs = token.armedBudgetMs;
    if (outstandingMs >= notifyWedgedCapMs()) {
      return {
        action: "demote",
        reason: {
          outstandingMs,
          discriminator: "cap-exceeded",
          budgetMs: armedBudgetMs
        }
      };
    }
    const verdict = await this.notifyStallCpuVerdict(entry);
    if (this.state.clients.get(key) !== entry.client || this.outstandingAuxNotifyWrites.get(key) !== token) {
      throw new Error("stale notify generation");
    }
    if (verdict.cpuVerdict === "busy") {
      this.logNotifyStallCpuBusy(key, entry, filePath, outstandingMs, verdict, {
        budgetMs: armedBudgetMs
      });
      return { action: "rearm", budgetMs: this.auxNotifyWedgeBudgetMs(key) };
    }
    return {
      action: "demote",
      reason: {
        outstandingMs,
        discriminator: verdict.cpuVerdict === "unmeasured" ? "budget-exceeded" : "budget-exceeded-cpu-flat",
        budgetMs: armedBudgetMs,
        ewmaInputMs: this.auxNotifyDrainLatencyEwma.get(key),
        unackedDepth: this.auxNotifyInflight.get(key)?.unacked ?? 0,
        cpuVerdict: verdict.cpuVerdict,
        cpuPercent: verdict.cpuPercent ?? null
      }
    };
  }
  /**
   * #1714: is this auxiliary already holding as many documents as it may?
   *
   * Read by the sweep's PRE-OPEN pass, which writes `didOpen` directly instead
   * of going through `touchFile` and so meets neither the #1459 slot gate nor
   * the drain barrier. Pre-opening is explicitly best-effort — the file's own
   * `touchFile` opens it a moment later, through the barrier — so a backlogged
   * scanner is simply left out of the warm-up burst rather than handed a second
   * copy of every file in the chunk.
   */
  auxNotifyBacklogAtCeiling(key, entry) {
    const record2 = this.auxNotifyInflight.get(key);
    if (!record2 || record2.client !== entry.client)
      return false;
    if (record2.gateOpen)
      return false;
    return record2.unacked >= serverTraits(entry.info).notifyInflightLimit;
  }
  /**
   * #1714: hold the next notify until this auxiliary has proven it PROCESSED the
   * ones already sent. Returns when the caller may write — it never refuses.
   *
   * Under the limit there is nothing to prove, so the common case returns without
   * awaiting anything and the sweep runs at full speed. At the limit the gate
   * sends ONE request round-trip (`pingLiveness`, #1277,
   * clients/lsp/client.ts:2577).
   *
   * WHY A REPLY PROVES PROCESSING, measured rather than assumed, and declared
   * as the `replyOrdering: "single-task-ordered"` trait on the row that was
   * measured (#1722, #1756 stage 1). ast-grep-lsp is tower-lsp-server and
   * drains its message stream in order on one task, so a request written after
   * N `didOpen`s is answered after those N are scanned. Live probe against the
   * real binary, 30 real repository files:
   *
   *   idle `workspace/symbol` reply        0 ms
   *   after 30 didOpens                 2263 ms, 29 of 30 publishes already in
   *   all 30 processed                  2330 ms
   *
   *   idle `textDocument/hover` reply      1 ms
   *   after 30 didOpens                 2086 ms, 29 of 30 publishes already in
   *
   * Idle-zero to loaded-seconds, landing within one document of the whole
   * backlog, is the ordering property this gate needs; one document of slack is
   * immaterial against a ceiling of 4 to 8.
   *
   * A server that answered requests off a SEPARATE task would not give this
   * proof, and one that declares `replyOrdering: "threaded"` is therefore
   * stepped over below rather than round-tripped. What kept such a server safe
   * BEFORE the trait existed is NOT the fail-open latch: the latch never arms
   * for it. It answered the barrier instantly, `unacked` reset, and the gate
   * stayed inert for the whole sweep. Safety comes from the outcome that
   * inertness produces — the notify sequence is exactly the pre-#1714 one, and
   * #743's write deadline, backpressure streak and wedge timer own the stall
   * the same way they did before this change. The throttle buys such a server
   * nothing; it also costs it nothing. Declaring the trait reaches that same
   * end state without spending the round-trip, and `unmeasured` — the default,
   * and every server that has not been probed — keeps the barrier armed
   * exactly as before, so an unmeasured server is never granted a pacing
   * change by omission.
   *
   * The wait is bounded by the CALLER's remaining budget, never by a schedule of
   * its own: every waiter gives the shared round-trip only `waitMs`, so a caller
   * that asked for a 1 s touch still gets one.
   *
   * A waiter whose budget runs out does NOT defer the file. It latches the gate
   * open and falls through to the write. Pacing exists to stop a healthy-but-slow
   * scanner drowning; a scanner that will not answer at all is a stall, and #743's
   * write deadline, backpressure streak and wedge timer already own that case —
   * they demote and respawn it, which is the self-heal that recovered the live
   * session. Deferring instead withheld the write, accrued no strike, and left
   * the sweep with no exit.
   *
   * Fails OPEN for a client with no liveness round-trip: unmeasurable is not the
   * same as backlogged, and the codebase already reads this capability as
   * `pingLiveness?.() ?? true` (clients/lsp/client.ts:281). Every real client
   * provides it.
   */
  async paceAuxNotify(key, entry, filePath, waitMs, context) {
    const record2 = this.auxNotifyInflight.get(key);
    if (!record2)
      return;
    if (record2.client !== entry.client) {
      this.auxNotifyInflight.delete(key);
      return;
    }
    if (record2.gateOpen)
      return;
    const traits = serverTraits(entry.info);
    const limit = traits.notifyInflightLimit;
    if (record2.unacked < limit)
      return;
    const ping = traits.replyOrdering === "threaded" ? void 0 : entry.client.pingLiveness;
    if (!ping) {
      record2.unacked = 0;
      return;
    }
    if (waitMs <= 0) {
      this.openAuxNotifyGate(key, entry, filePath, context, {
        unacked: record2.unacked,
        limit,
        waitMs,
        durationMs: 0
      });
      return;
    }
    if (!record2.drain) {
      const startedAt = Date.now();
      const outstanding = record2.unacked;
      const client = entry.client;
      const barrier = (async () => {
        let drained2 = false;
        try {
          drained2 = await ping.call(client, waitMs);
        } catch {
          drained2 = false;
        }
        const current = this.auxNotifyInflight.get(key);
        if (current === record2 && current.client === client) {
          current.drain = void 0;
          if (drained2)
            current.unacked = Math.max(0, current.unacked - outstanding);
        }
        const durationMs = Date.now() - startedAt;
        if (drained2)
          this.noteAuxNotifyDrainLatency(key, durationMs, outstanding, record2);
        this.noteDrainBarrierOutcome(key, entry, filePath, context, {
          unacked: outstanding,
          limit,
          waitMs,
          durationMs,
          outcome: drained2 ? "drained" : "stalled"
        });
        return drained2;
      })();
      barrier.catch(() => {
      });
      record2.drain = barrier;
      record2.stallLogged = false;
    }
    const waitStartedAt = Date.now();
    const drained = await withDeadline(record2.drain, {
      ms: waitMs,
      onTimeout: "undefined",
      onReject: "undefined"
    });
    if (drained !== true) {
      this.openAuxNotifyGate(key, entry, filePath, context, {
        unacked: record2.unacked,
        limit,
        waitMs,
        durationMs: Date.now() - waitStartedAt
      });
    }
  }
  /**
   * #1714: stop pacing this client and hand it to the breaker.
   *
   * Latched, not cooled down — a timer here would be a schedule of this gate's
   * own, and it would race the caller's cadence. The latch clears only when the
   * record does: a demotion ({@link demoteForNotifyStall}), a client-identity
   * change, or the service teardown. Every one of those means a new server
   * process, which is the only event that makes the old backlog meaningless.
   */
  openAuxNotifyGate(key, entry, filePath, context, detail) {
    const record2 = this.auxNotifyInflight.get(key);
    if (record2 && record2.client === entry.client) {
      record2.gateOpen = true;
    }
    this.noteDrainBarrierOutcome(key, entry, filePath, context, {
      ...detail,
      outcome: "stalled"
    });
  }
  /**
   * #1714: emit at most ONE record per barrier. A stalled barrier can be
   * abandoned by every file left in the sweep, and one row per file would turn a
   * single stuck scanner into hundreds of identical records.
   */
  noteDrainBarrierOutcome(key, entry, filePath, context, detail) {
    const record2 = this.auxNotifyInflight.get(key);
    if (detail.outcome === "stalled" && record2) {
      if (record2.stallLogged)
        return;
      record2.stallLogged = true;
    }
    this.logDrainBarrier(key, entry, filePath, context, detail);
  }
  /**
   * #1714: one row per barrier, not per waiter — a burst of N notifies produces
   * at most one round-trip and one record, so the volume is bounded by the sweep
   * divided by the limit. Names the server and the file that hit the ceiling, so
   * "which scanner is falling behind" survives aggregation.
   */
  logDrainBarrier(key, entry, filePath, context, detail) {
    if (detail.outcome === "stalled") {
      incrementDegradationCount({
        kind: "lsp-notify-inflight-stall",
        subject: `${entry.info.id}:${normalizeMapKey(filePath)}`,
        reason: `notify barrier stalled with ${detail.unacked} unacknowledged writes`
      });
    }
    logLatency({
      type: "phase",
      phase: "lsp_notify_inflight_barrier",
      filePath: normalizeMapKey(filePath),
      durationMs: detail.durationMs,
      metadata: {
        serverId: entry.info.id,
        clientKey: key,
        source: context.source,
        clientScope: context.clientScope,
        ...detail
      }
    });
  }
  /**
   * #1459: take this auxiliary's resync slot, waiting up to `budgetMs` for it.
   *
   * The gate is a QUEUE, not a drop: a healthy scanner accepts a `didOpen` in
   * milliseconds, so a sweep's neighbours take their turns one after another and
   * every file still gets scanned — what the gate prevents is N simultaneous
   * full re-scans flooding one stdin. Only a scanner that cannot accept a write
   * inside the budget makes a waiter give up, and giving up is reported as a
   * coverage gap rather than pushed anyway.
   *
   * The slot is CLAIMED SYNCHRONOUSLY: the check and the insert sit in one
   * uninterrupted run of statements, and the returned handle owns the entry. A
   * version that returned "the slot looks free, go write" and let the caller
   * insert its own record after an `await` was not a gate at all — when the
   * holder's write landed, every waiter woke in the same microtask batch, each
   * read an empty map, and all of them wrote at once (measured: one write at t=0,
   * then a five-wide flood at t=50 for six touches). That is #1459's own root
   * cause rebuilt inside the fix for it.
   *
   * Returns a handle with `release()` (call on the write's settle, idempotent), or
   * a verdict naming how long the blocking write has been outstanding.
   */
  async claimAuxNotifySlot(clientKey, entry, filePath, budgetMs) {
    const deadline = Date.now() + budgetMs;
    for (; ; ) {
      const outstanding = this.outstandingAuxNotifyWrites.get(clientKey);
      if (outstanding && outstanding.client !== entry.client) {
        this.releaseOutstandingAuxNotifyWrite(clientKey, outstanding);
      } else if (outstanding) {
        const outstandingMs = Date.now() - outstanding.startedAt;
        const remainingMs = deadline - Date.now();
        if (remainingMs <= 0)
          return { outstandingMs };
        await withDeadline(outstanding.settled, {
          ms: remainingMs,
          onTimeout: "undefined",
          onReject: "undefined"
        });
        continue;
      }
      const current = this.state.clients.get(clientKey);
      if (current !== entry.client) {
        return { outstandingMs: 0 };
      }
      let resolveSettled;
      const settled = new Promise((resolve9) => {
        resolveSettled = resolve9;
      });
      const token = {
        startedAt: Date.now(),
        client: entry.client,
        settled,
        armedBudgetMs: 0,
        // SAFETY: the handle is a torn-initialized placeholder. It is armed
        // a beat later in this same atomic claim (no await in between) and
        // thereafter only ever written by this token's own fire/release
        // closures, so the placeholder value is never read by anyone.
        wedgeTimer: void 0,
        resolveSettled: () => resolveSettled?.()
      };
      const fireWedge = async () => {
        if (this.outstandingAuxNotifyWrites.get(clientKey) !== token || this.state.clients.get(clientKey) !== entry.client) {
          this.releaseOutstandingAuxNotifyWrite(clientKey, token);
          return;
        }
        let decision;
        try {
          decision = await this.decideNotifyStallTeardown(clientKey, entry, filePath, token);
        } catch {
          decision = {
            action: "demote",
            reason: {
              outstandingMs: Date.now() - token.startedAt,
              discriminator: "budget-exceeded",
              budgetMs: token.armedBudgetMs
            }
          };
        }
        if (this.outstandingAuxNotifyWrites.get(clientKey) !== token || this.state.clients.get(clientKey) !== entry.client) {
          this.releaseOutstandingAuxNotifyWrite(clientKey, token);
          return;
        }
        if (decision.action === "demote") {
          this.demoteForNotifyStall(clientKey, entry, filePath, decision.reason);
          resolveSettled?.();
          return;
        }
        token.wedgeTimer = setTimeout(() => void fireWedge(), decision.budgetMs);
        token.wedgeTimer.unref?.();
      };
      token.armedBudgetMs = this.auxNotifyWedgeBudgetMs(clientKey);
      token.wedgeTimer = setTimeout(() => void fireWedge(), token.armedBudgetMs);
      token.wedgeTimer.unref?.();
      this.outstandingAuxNotifyWrites.set(clientKey, token);
      return {
        release: () => {
          this.releaseOutstandingAuxNotifyWrite(clientKey, token);
        }
      };
    }
  }
  /**
   * #1459: the auxiliary scanners that WOULD have attached to this touch but got
   * no client because their circuit breaker is open (cooldown or permanent).
   *
   * A skipped scanner said nothing about the file. Until now it also left no
   * trace on the result: it simply dropped out of `spawned`, and the touch
   * resolved `confirmation: "confirmed"` on the strength of whoever was left —
   * so a 15 s opengrep cooldown read as "scanned, clean" for every file swept
   * inside it. Naming the scanners here narrows the touch to `"partial"` instead,
   * which every coverage consumer already fails closed on (#1470).
   *
   * Deliberately AUXILIARY-only. A broken primary is already visible through the
   * `no_clients` failure kind and the demonstrated-cold path; the false-clean
   * hazard this addresses is the scanner lane, where an empty result is the
   * normal, expected answer.
   *
   * SCOPE, stated so the next reader does not assume the room is closed: this
   * covers the BREAKER doors only (cooldown + permanent). `ensureClientForServer`
   * also drops a scanner for a temporarily-unavailable command (the #1496 latch),
   * `optionalDisabled`, a spawn failure, or capacity eviction. Those are the same
   * defect class in the same lane, but they are persistent-absence states rather
   * than a transient blackout, so flagging every touch partial for them is a
   * broader behavior change than #1459 is scoped to make. Tracked separately.
   */
  async brokenSkippedAuxiliaryServerIds(filePath, clientScope, options, spawned) {
    if (clientScope === "primary")
      return [];
    const enabledAuxiliaries = clientScope === "with-auxiliary" ? new Set(options.auxiliaryServerIds ?? []) : void 0;
    const attached = new Set(spawned.map((entry) => entry.info.id));
    const skipped = [];
    for (const server of getServersForFileWithConfig(filePath)) {
      if (!isAuxiliary(server))
        continue;
      if (attached.has(server.id))
        continue;
      if (options.excludeServerIds?.has(server.id))
        continue;
      if (enabledAuxiliaries && !enabledAuxiliaries.has(server.id))
        continue;
      const key = await this.demonstratedReadyKeyFor(server, filePath);
      if (!key)
        continue;
      const brokenUntil = this.state.broken.get(key);
      if (this.permanentlyBroken.has(key) || typeof brokenUntil === "number" && brokenUntil > Date.now()) {
        skipped.push(server.id);
      }
    }
    return skipped;
  }
  activeClientsForCwd(cwd, priorityServerIds = []) {
    const normalizedCwd = normalizeMapKey(cwd);
    const priority = new Map(priorityServerIds.map((serverId, index) => [serverId, index]));
    const entries = [];
    for (const [key, client] of this.state.clients) {
      if (!client.isAlive())
        continue;
      const separator = key.indexOf(":");
      const serverId = separator >= 0 ? key.slice(0, separator) : key;
      const root = normalizeMapKey(client.root);
      const sameOrNested = root === normalizedCwd || root.startsWith(`${normalizedCwd}/`) || normalizedCwd.startsWith(`${root}/`);
      if (!sameOrNested)
        continue;
      entries.push({ serverId, client });
    }
    return entries.sort((a, b) => (priority.get(a.serverId) ?? Number.MAX_SAFE_INTEGER) - (priority.get(b.serverId) ?? Number.MAX_SAFE_INTEGER));
  }
  /**
   * Documents currently open on any live client rooted at or under `cwd`
   * (#2430), as normalized path keys.
   *
   * The third contributor to the observational mutation net's tracked-file
   * set, alongside the read-guard's read/write set and the widget's diagnostic
   * files. It is pure in-memory enumeration — no spawn, no open, no stat —
   * and it is deliberately capped by the caller rather than here, because the
   * cap belongs to the sweep's budget, not to the pool's bookkeeping.
   */
  getOpenDocumentPaths(cwd) {
    const paths = /* @__PURE__ */ new Set();
    for (const { client } of this.activeClientsForCwd(cwd)) {
      try {
        for (const filePath of client.openDocumentPaths?.() ?? [])
          paths.add(filePath);
      } catch {
      }
    }
    return [...paths];
  }
  /**
   * #3601: the fingerprint of the content the first live client (the file's
   * own servers first) last sent for `filePath`, and when a send last changed
   * it, or `undefined` when no live client under `cwd` tracks the document.
   * In-memory only: it spawns, opens and stats nothing.
   */
  getTrackedContent(filePath, cwd) {
    const priorityServerIds = getServersForFileWithConfig(filePath).map((server) => server.id);
    for (const { client } of this.activeClientsForCwd(cwd, priorityServerIds)) {
      const sent = client.getSentContent?.(filePath);
      if (sent !== void 0)
        return sent;
    }
    return void 0;
  }
  /**
   * Get or create LSP client for a file
   * Prevents duplicate client creation via in-flight promise tracking
   */
  async getClientForFile(filePath, maxWaitMs, hardCapMs, resolvedRoots, waitSkipReasons) {
    if (this.checkDestroyed())
      return void 0;
    const servers = getServersForFileWithConfig(filePath).filter((s) => !isAuxiliary(s));
    const rootMemo = /* @__PURE__ */ new Map();
    const partitionCandidates = async () => {
      const resolved2 = await Promise.all(servers.map(async (server) => {
        let rootFailureReason;
        try {
          return {
            server,
            root: await this.resolveServerRootOnce(server, filePath, rootMemo, (reason) => {
              rootFailureReason = reason;
            }),
            reason: rootFailureReason
          };
        } catch (error) {
          return {
            server,
            root: void 0,
            reason: error instanceof Error ? error.message : String(error)
          };
        }
      }));
      const unrootedReasons = {};
      for (const entry of resolved2) {
        if (entry.root === void 0 && entry.reason !== void 0) {
          unrootedReasons[entry.server.id] = entry.reason;
        }
      }
      return {
        rooted: resolved2.filter((entry) => entry.root !== void 0).map(({ server, root }) => ({ server, root })),
        unrootedIds: resolved2.filter((entry) => entry.root === void 0).map((entry) => entry.server.id),
        unrootedReasons
      };
    };
    const serverBaseMs = primaryServerWaitFloorMs(filePath, maxWaitMs);
    const effectiveMaxWaitMs = hardCapMs !== void 0 ? serverBaseMs > 0 ? Math.min(serverBaseMs, hardCapMs) : hardCapMs : serverBaseMs;
    let knownSlowResolve;
    const knownSlowSentinel = /* @__PURE__ */ Symbol("lsp-client-wait-known-slow");
    const knownSlow = new Promise((resolve9) => {
      knownSlowResolve = () => resolve9(knownSlowSentinel);
    });
    const noteSpawnInFlight = (serverId) => {
      const knownDurationMs = getSuccessfulLspSpawnDurationMs(serverId);
      if (knownDurationMs !== void 0 && knownDurationMs > effectiveMaxWaitMs * 2) {
        queueMicrotask(() => knownSlowResolve?.());
      }
    };
    const withBudget = async () => {
      if (servers.length === 0)
        return void 0;
      let erroredServerId;
      let erroredOutcome;
      for (const server of servers) {
        const acquisition = {
          outcome: "declined"
        };
        const spawned = await this.ensureClientForServer(filePath, server, resolvedRoots, noteSpawnInFlight, (reported) => {
          acquisition.outcome = reported;
        }, rootMemo);
        if (spawned) {
          logLatency({
            type: "phase",
            phase: "lsp_client_selected",
            filePath,
            durationMs: 0,
            metadata: {
              serverId: server.id,
              candidateCount: servers.length,
              // Emitted RAW, never coerced to a "safe" value: a served
              // client always reports `warm-reuse` or `cold-spawn`, so a
              // `declined` here would be a real reporting bug and must be
              // visible in the log rather than laundered into a lie.
              outcome: acquisition.outcome
            }
          });
          return spawned;
        }
        if (acquisition.outcome === "spawn-failure" || acquisition.outcome === "spawn-failure-joined") {
          if (erroredServerId === void 0) {
            erroredServerId = server.id;
            erroredOutcome = acquisition.outcome;
          }
        }
      }
      if (erroredServerId !== void 0) {
        logLatency({
          type: "phase",
          phase: "lsp_client_selected",
          filePath,
          durationMs: 0,
          metadata: {
            serverId: erroredServerId,
            candidateCount: servers.length,
            outcome: erroredOutcome ?? "spawn-failure"
          }
        });
      }
      const unavailable2 = (await Promise.all(servers.map(async (server) => {
        const root = await this.resolveServerRootOnce(server, filePath, rootMemo);
        return {
          server,
          key: `${server.id}:${root ? normalizeMapKey(root) : "<unresolved>"}`
        };
      }))).filter(({ key }) => !this.unavailableLogged.has(key));
      for (const { key } of unavailable2)
        this.unavailableLogged.add(key);
      if (unavailable2.length === 0)
        return void 0;
      logLatency({
        type: "phase",
        phase: "lsp_client_unavailable",
        filePath,
        durationMs: 0,
        metadata: {
          candidateCount: unavailable2.length,
          servers: unavailable2.map(({ server }) => server.id)
        }
      });
      return void 0;
    };
    if (!effectiveMaxWaitMs || effectiveMaxWaitMs <= 0) {
      return withBudget();
    }
    const timeoutSentinel = /* @__PURE__ */ Symbol("lsp-client-wait-timeout");
    let waitTimer;
    let waitResult;
    try {
      waitResult = await Promise.race([
        withBudget(),
        knownSlow,
        new Promise((resolve9) => {
          waitTimer = setTimeout(() => resolve9(timeoutSentinel), effectiveMaxWaitMs);
        })
      ]);
    } finally {
      if (waitTimer)
        clearTimeout(waitTimer);
    }
    if (waitResult === knownSlowSentinel) {
      const { rooted, unrootedIds, unrootedReasons } = await partitionCandidates();
      for (const { server, root } of rooted) {
        const client = this.state.clients.get(`${server.id}:${normalizeMapKey(root)}`);
        if (client?.isAlive())
          return { client, info: server };
      }
      waitSkipReasons?.add("budget_skipped_known_slow");
      logLatency({
        type: "phase",
        phase: "lsp_client_wait_skipped",
        filePath,
        durationMs: 0,
        metadata: {
          maxWaitMs: effectiveMaxWaitMs,
          serverIds: rooted.map(({ server }) => server.id),
          unrootedCandidates: {
            count: unrootedIds.length,
            ids: unrootedIds,
            ...Object.keys(unrootedReasons).length > 0 ? { reasons: unrootedReasons } : {}
          },
          reason: "budget_skipped_known_slow"
        }
      });
      return void 0;
    }
    if (waitResult === timeoutSentinel) {
      const partitionBudgetMs = hardCapMs !== void 0 ? Math.min(250, hardCapMs / 4) : 250;
      const partitioned = await withDeadline(partitionCandidates(), {
        ms: partitionBudgetMs,
        onTimeout: "undefined"
      });
      const { rooted, unrootedIds, unrootedReasons } = partitioned ?? {
        rooted: [],
        unrootedIds: [],
        unrootedReasons: {}
      };
      const knownHealth = [...this.state.clients.entries()].filter(([k]) => rooted.some(({ server }) => k.startsWith(`${server.id}:`))).map(([k, c]) => ({
        serverId: k.split(":")[0],
        alive: c.isAlive(),
        spawnedAt: this.state.clientSpawnedAt.get(k) ?? null
      }));
      logLatency({
        type: "phase",
        phase: "lsp_client_wait_timeout",
        filePath,
        durationMs: effectiveMaxWaitMs,
        metadata: {
          maxWaitMs: effectiveMaxWaitMs,
          // `serverIds` names the ROOTED pool the timeout record reports
          // against, not "servers this call actually waited on" — the
          // sequential trial loop can time out having reached only the
          // first of several rooted candidates (case 2 in the regression
          // test pins both `["typescript","deno"]` even though the loop
          // never got past `typescript`).
          serverIds: rooted.map(({ server }) => server.id),
          unrootedCandidates: {
            count: unrootedIds.length,
            ids: unrootedIds,
            ...Object.keys(unrootedReasons).length > 0 ? { reasons: unrootedReasons } : {}
          },
          // servers absent from knownHealth were never spawned or are still spawning
          knownClientHealth: knownHealth,
          ...partitioned === void 0 ? { partition: "timed-out" } : {}
        }
      });
      return void 0;
    }
    return waitResult;
  }
  /**
   * Get or create all complementary LSP clients that can serve a file. Alternate
   * language servers marked with `fallbackFor` remain sequential fallbacks: an
   * aggregate diagnostics pass must not launch them beside a working preferred
   * server merely because it requested `clientScope: "all"`.
   */
  async getClientsForFile(filePath, excludeServerIds, resolvedRoots, auxiliaryRoots) {
    const allServers = getServersForFileWithConfig(filePath);
    const servers = excludeServerIds && excludeServerIds.size > 0 ? allServers.filter((s) => !excludeServerIds.has(s.id)) : allServers;
    if (servers.length === 0)
      return { clients: [], serverCountAttempted: 0 };
    const rootedServers = (await Promise.all(servers.map(async (server) => ({
      server,
      root: await this.resolveServerRoot(server, filePath)
    })))).filter((entry) => entry.root !== void 0);
    for (const { server, root } of rootedServers)
      if (isAuxiliary(server))
        auxiliaryRoots?.set(server.id, normalizeMapKey(root));
    let serverCountAttempted = 0;
    const acquisitions = /* @__PURE__ */ new Map();
    const acquire = (server) => {
      serverCountAttempted += 1;
      return this.ensureClientForServer(filePath, server, resolvedRoots);
    };
    for (const { server } of rootedServers) {
      const preferred = server.fallbackFor ? acquisitions.get(server.fallbackFor) : void 0;
      const acquisition = preferred ? preferred.then((entry) => entry === void 0 ? acquire(server) : void 0) : acquire(server);
      acquisitions.set(server.id, acquisition);
    }
    const results = await Promise.all(acquisitions.values());
    const clients = results.filter((entry) => entry !== void 0);
    return { clients, serverCountAttempted };
  }
  /**
   * Spawn/get the AUXILIARY clients for a file (role:"auxiliary") restricted to
   * the enabled set. These attach alongside the primary on the with-auxiliary
   * diagnostics path (cross-cutting scanners like opengrep).
   */
  async getAuxiliaryClientsForFile(filePath, enabledIds, onOutcome, maxWaitMs, signal, hook) {
    if (this.checkDestroyed() || enabledIds.size === 0)
      return [];
    const servers = getServersForFileWithConfig(filePath).filter((s) => isAuxiliary(s) && enabledIds.has(s.id));
    if (servers.length === 0)
      return [];
    const rootMemo = /* @__PURE__ */ new Map();
    const effectiveSignal = signal ?? getAmbientAbortSignal();
    const effectiveHook = hook ?? "tool_result_edit";
    const spawned = await Promise.all(servers.map(async (server) => {
      const acquisition = this.ensureClientForServer(filePath, server, void 0, void 0, (reported) => onOutcome?.(server.id, reported), rootMemo);
      if (!maxWaitMs || maxWaitMs <= 0) {
        return acquisition;
      }
      return bounded(acquisition, {
        ms: maxWaitMs,
        signal: effectiveSignal,
        hook: effectiveHook,
        label: `auxiliary-spawn:${server.id}`
      });
    }));
    return spawned.filter((entry) => Boolean(entry));
  }
  /**
   * Get a warm LSP client for a file without spawning.
   * Returns undefined if no matching client is already connected and alive.
   */
  async getWarmClientForFile(filePath) {
    if (this.checkDestroyed())
      return void 0;
    const servers = getServersForFileWithConfig(filePath);
    const missed = [];
    for (const server of servers) {
      const root = await this.resolveServerRoot(server, filePath);
      if (!root)
        continue;
      const key = `${server.id}:${normalizeMapKey(root)}`;
      const existing = this.state.clients.get(key);
      if (existing?.isAlive()) {
        return { client: existing, info: server };
      }
      missed.push(key);
    }
    if (missed.length > 0) {
      emitBounded("lsp_warm_client_missing", missed.join(","), {
        filePath,
        durationMs: 0,
        metadata: {
          serverIds: missed.map((key) => key.slice(0, key.indexOf(":"))),
          roots: missed.map((key) => key.slice(key.indexOf(":") + 1))
        }
      }, {
        ledgerKind: "lsp-warm-client-missing",
        risingEdgePer: "identity",
        reason: `no warm client for ${missed.join(",")}`
      });
    }
    return void 0;
  }
  /**
   * Read-only Gate-B readiness check for one auxiliary server/root. A connected
   * process is not yet a diagnostic producer: only its first publication proves
   * that this root's client can supersede an in-process fallback runner.
   */
  async hasServerPublishedForFileRoot(serverId, filePath) {
    if (this.checkDestroyed())
      return false;
    for (const server of getServersForFileWithConfig(filePath)) {
      if (server.id !== serverId)
        continue;
      const root = await this.resolveServerRoot(server, filePath);
      if (!root)
        continue;
      const key = `${server.id}:${normalizeMapKey(root)}`;
      const client = this.state.clients.get(key);
      if (client?.isAlive() && client.getDiagnosticsVersionForPath(filePath) > 0) {
        return true;
      }
    }
    return false;
  }
  /**
   * #2001/#2002 collect-later: read-only cached-diagnostics probe for the
   * turn-end late-auxiliary delivery (`clients/runtime-turn.ts`). Like
   * the Gate-B readiness check, this NEVER creates or warms a client — it only
   * resolves each requested server's root and reads the already-connected
   * client's cached diagnostics for `filePath`. Servers with no live client
   * are absent unless notify-stall teardown marked that generation as
   * replaceable; that status carries the demotion timestamp so turn-end late
   * coverage can correlate each pair to the removed generation. A live
   * client is present even when its per-file cache entry is empty; its
   * timestamp distinguishes a published clean result from no publication.
   */
  async readCachedDiagnosticsForServers(filePath, serverIds) {
    const out = /* @__PURE__ */ new Map();
    if (this.checkDestroyed() || serverIds.size === 0)
      return out;
    for (const server of getServersForFileWithConfig(filePath)) {
      if (!serverIds.has(server.id) || out.has(server.id))
        continue;
      const root = await this.resolveServerRoot(server, filePath);
      if (!root)
        continue;
      const key = `${server.id}:${normalizeMapKey(root)}`;
      const client = this.state.clients.get(key);
      if (!client?.isAlive()) {
        const demotedAt = this.notifyStallDemotions.get(key);
        if (demotedAt !== void 0) {
          out.set(server.id, {
            diags: [],
            notifyStallDemoted: true,
            demotedAt
          });
        }
        continue;
      }
      this.notifyStallDemotions.delete(key);
      const entry = client.getAllDiagnostics().get(normalizeMapKey(filePath));
      out.set(server.id, {
        diags: entry?.diags ?? [],
        publishedAt: entry?.ts
      });
    }
    return out;
  }
  /** Record a fast answer observed by the turn-end late-results path. */
  async observeLateAuxiliaryAnswer(filePath, serverId, elapsedMs) {
    for (const server of getServersForFileWithConfig(filePath)) {
      if (server.id !== serverId)
        continue;
      const root = await this.resolveServerRoot(server, filePath);
      if (root === void 0)
        return;
      this.noteAuxiliaryLateAnswer(`${serverId}:${normalizeMapKey(root)}`, elapsedMs);
      return;
    }
  }
  /**
   * #1668: deliver a `workspace/didChangeWatchedFiles` event for a disk
   * change the client did not author through open-document sync — a bash
   * write/delete, or any other external change. `type` is the LSP
   * `FileChangeType` (1 Created, 2 Changed, 3 Deleted).
   *
   * Only reaches ALREADY-ACTIVE clients for this file's servers — a server
   * that hasn't been spawned yet has no stale cache to correct, so this
   * never spawns one just to deliver the notification. Each affected
   * client enqueues into its own #271 debounced queue, so a burst of
   * external changes still coalesces into one notification per server.
   */
  async notifyExternalFileChange(filePath, type) {
    if (this.checkDestroyed())
      return;
    for (const server of getServersForFileWithConfig(filePath)) {
      const root = await this.resolveServerRoot(server, filePath);
      if (!root)
        continue;
      this.notifyLiveClientsForServer(server.id, filePath, type, `${server.id}:${normalizeMapKey(root)}`, true);
    }
  }
  /**
   * Re-sync the open views affected by one recovered Git tree change. The
   * recovery seam already owns the changed-path set, so this deliberately
   * reads only the cached reverse-import index and never runs another diff.
   *
   * #3828 r3: `saved` makes the push of each changed path a save (the caller
   * wrote it); the importers added here are never saves. The answer names
   * what this pass did to each changed path, keyed as given: `unheld` when no
   * live client holds it, `deferred` when the pass did not reach it (it stays
   * queued, with its save), else the pass's own disposition.
   */
  async resyncGitChangedFiles(changedPaths, options = {}) {
    const dispositions = /* @__PURE__ */ new Map();
    if (this.checkDestroyed() || changedPaths.length === 0) {
      return dispositions;
    }
    const targets = /* @__PURE__ */ new Set();
    const changed = /* @__PURE__ */ new Map();
    for (const changedPath of changedPaths) {
      const resolved2 = path16.resolve(changedPath);
      for (const server of getServersForFileWithConfig(resolved2)) {
        const root = await this.resolveServerRoot(server, resolved2);
        if (!root)
          continue;
        const index = loadReverseDependencyIndexFromSnapshot({ cwd: root });
        for (const importer of index ? getReverseDepsFromIndex(index, resolved2) : []) {
          targets.add(importer);
        }
      }
      targets.add(resolved2);
      changed.set(changedPath, resolved2);
    }
    const openTargets = [...targets].filter((filePath) => this.hasLiveClientHoldingDocument(filePath));
    const written = new Set(changed.values());
    this.documentDrift.enqueueResync(openTargets.filter((filePath) => !written.has(filePath)));
    this.documentDrift.enqueueResync(openTargets.filter((filePath) => written.has(filePath)), { saved: options.saved === true });
    const pass = await this.sweepDocumentDrift({ force: true });
    logLatency({
      type: "phase",
      phase: "lsp_external_change_resync",
      filePath: changedPaths[0] ?? "",
      durationMs: 0,
      metadata: {
        changedCount: changedPaths.length,
        enqueued: openTargets.length,
        deferred: pass?.deferred ?? this.documentDrift.pendingResyncCount
      }
    });
    for (const [changedPath, resolved2] of changed) {
      dispositions.set(changedPath, openTargets.includes(resolved2) ? pass?.queued.get(normalizeMapKey(resolved2)) ?? "deferred" : "unheld");
    }
    return dispositions;
  }
  /**
   * #1783: disk-drift backstop. Stat one batch of the documents a language
   * server currently holds, and re-push any whose bytes on disk no longer
   * match what the server was last given.
   *
   * Why this exists: an edit made outside the tracked write/edit path (a
   * bash-tool bulk edit) sends no `didChange`, so the server keeps publishing
   * pre-edit diagnostics with nothing to correct it. The resync-on-read path
   * only fires for a file the session reads again; a file that is edited and
   * never re-read stayed stale for the life of the server.
   *
   * Hot-path contract: callers fire this WITHOUT awaiting it. It is
   * rate-limited to one pass per drift-check interval (10s default),
   * stats at most 64 documents per pass, reads only the ones whose stat
   * already diverged, and issues at most 4 resyncs per pass serially. So the
   * steady-state cost on the touch path is zero, and the worst-case cost of a
   * pass is 64 stats plus up to 4 reads, off the caller's critical path.
   *
   * Never spawns: a document with no live client already holding it open has
   * no stale view to correct, so its record is dropped instead of resynced.
   */
  async sweepDocumentDrift(options = {}) {
    if (this.checkDestroyed())
      return void 0;
    return this.documentDrift.sweep({
      resync: async (filePath, content, _driftAgeMs, readStamp, saved) => {
        await this.touchFile(filePath, content, {
          diagnostics: "none",
          source: "drift_resync",
          clientScope: "all",
          excludeServerIds: await this.serverIdsNotHoldingDocument(filePath),
          readStamp,
          // #3828 r3: only a target its caller queued as a save.
          saved: saved === true
        });
        return this.documentDrift.peek(filePath)?.fingerprint === fingerprintDocumentContent(content);
      },
      holdsDocument: (filePath) => this.hasLiveClientHoldingDocument(filePath),
      onDrift: (event) => {
        if (event.disposition === "unchanged" || event.disposition === "vanished" || event.disposition === "unheld") {
          return;
        }
        incrementDegradationCount({
          kind: "lsp-document-drift",
          subject: event.filePath,
          reason: event.disposition === "deferred" ? `disk drift deferred by resync pacing after ${event.driftAgeMs}ms` : event.disposition === "failed" ? `resync FAILED after ${event.driftAgeMs}ms of untracked disk drift; view still stale (${event.syncedSize}->${event.diskSize} bytes)` : `resynced after ${event.driftAgeMs}ms of untracked disk drift (${event.syncedSize}->${event.diskSize} bytes)`
        });
        logLatency({
          type: "phase",
          phase: "lsp_document_drift",
          filePath: event.filePath,
          durationMs: event.driftAgeMs,
          metadata: {
            disposition: event.disposition,
            driftAgeMs: event.driftAgeMs,
            syncedSize: event.syncedSize,
            diskSize: event.diskSize
          }
        });
      }
    }, options);
  }
  /** #1783: tracked drift-record count. Test seam for the reset conformance. */
  _driftTrackedCountForTests() {
    return this.documentDrift.size;
  }
  /**
   * #1783: does any LIVE client already hold this document open? A record for
   * a document no server holds is dropped rather than resynced, so the drift
   * backstop can never spawn a server just to correct a view nobody has.
   */
  hasLiveClientHoldingDocument(filePath) {
    for (const client of this.state.clients.values()) {
      if (!client.isAlive())
        continue;
      if (documentIsOpenOn(client, filePath))
        return true;
    }
    return false;
  }
  /**
   * #1783: server ids for this file whose client is NOT currently holding the
   * document open — the exclusion set the drift resync passes to
   * `clientScope:"all"`.
   *
   * This is what keeps "resync every server that holds it" and "never spawn"
   * compatible. `getClientsForFile` filters by this set BEFORE
   * `ensureClientForServer`, so an excluded server is never reached, and every
   * remaining server already has a live client that returns from the cache.
   * Without it, `clientScope:"all"` would spawn the file's other servers, and
   * `clientScope:"primary"` would leave an auxiliary's view stale while the
   * record claimed the file was back in sync.
   */
  async serverIdsNotHoldingDocument(filePath) {
    const exclude = /* @__PURE__ */ new Set();
    for (const server of getServersForFileWithConfig(filePath)) {
      const root = await this.resolveServerRoot(server, filePath);
      const existing = root ? this.state.clients.get(`${server.id}:${normalizeMapKey(root)}`) : void 0;
      if (existing?.isAlive() && documentIsOpenOn(existing, filePath))
        continue;
      exclude.add(server.id);
    }
    return exclude;
  }
  /**
   * #1783: stamp the drift record only when this touch reached EVERY server
   * that currently holds the document, and every one of those writes landed.
   *
   * `at` is the touch's START time, not the moment the write landed. The write
   * can take up to the notify budget, and an untracked edit inside that window
   * would otherwise be stamped as already-synchronized and become invisible
   * (the mtime half of the key compares against this timestamp). Starting the
   * clock at the touch — within a millisecond or two of the caller's read —
   * narrows that blind window to the caller's own read-to-touch gap.
   */
  recordFullyCoveredSync(filePath, content, targeted, allWritesLanded, at, contentFingerprint) {
    if (!allWritesLanded || targeted.length === 0)
      return;
    const targetedClients = new Set(targeted.map((entry) => entry.client));
    for (const client of this.state.clients.values()) {
      if (targetedClients.has(client))
        continue;
      if (!client.isAlive())
        continue;
      if (documentIsOpenOn(client, filePath))
        return;
    }
    this.documentDrift.recordSynced(filePath, content, at, contentFingerprint?.() ?? fingerprintDocumentContent(content));
  }
  /**
   * #1934 review F1: record what a `spawnClient` call decided, at the point
   * it decides it. Called on EVERY path that returns without a client, so
   * "no verdict" cannot silently mean "failed".
   *
   * `"failed"` is a server failure: the spawn or the initialize handshake
   * went wrong. `"declined"` is policy or lifecycle: host trust refused the
   * binary, the service shut down mid-spawn, or the binary is absent while
   * installs are disabled. That last one sets a breaker cooldown but is NOT
   * a failure, which is exactly why the outcome cannot be inferred from
   * breaker state.
   */
  noteSpawnVerdict(key, verdict) {
    this.lastSpawnVerdict.set(key, verdict);
  }
  /**
   * {@link resolveServerRoot}, memoized against a caller-owned map so one
   * acquisition asks a given server for its root at most once (#2525).
   *
   * Resolution is cheap exactly when it SUCCEEDS: `NearestRoot` caches hits,
   * but deliberately never caches negatives (so a marker scaffolded
   * mid-session is picked up without a restart). An unrooted candidate
   * therefore re-walks to the filesystem root on every call, which is why the
   * acquisition path and the records it emits must share one resolution
   * instead of each taking their own. Without a `memo` this is a plain
   * passthrough, for callers that have no acquisition to share with.
   */
  resolveServerRootOnce(server, filePath, memo, onRootFailure) {
    if (!memo)
      return this.resolveServerRoot(server, filePath, onRootFailure);
    const pending2 = memo.get(server.id);
    if (pending2 !== void 0)
      return pending2;
    const started = this.resolveServerRoot(server, filePath, onRootFailure);
    memo.set(server.id, started);
    return started;
  }
  async ensureClientForServer(filePath, server, resolvedRoots, onSpawnInFlight, onOutcome, rootMemo) {
    const handoff = this.generationHandoff;
    if (handoff) {
      await handoff;
      if (this.generationHandoff === handoff) {
        this.generationHandoff = void 0;
      }
      if (this.checkDestroyed())
        return void 0;
    }
    const root = await this.resolveServerRootOnce(server, filePath, rootMemo);
    if (!root || this.checkDestroyed())
      return void 0;
    if (!isAuxiliary(server)) {
      resolvedRoots?.set(server.id, normalizeMapKey(root));
    }
    const allowInstall = this.shouldAllowInstall(server.id);
    const normalizedRoot = normalizeMapKey(root);
    const key = `${server.id}:${normalizedRoot}`;
    const adopted = this.analysisRootModeForFile(filePath) === "adopted";
    if (adopted) {
      const localCommand = server.command ?? server.projectLocalCommand ?? server.availabilityKey;
      const localBinary = localCommand ? path16.isAbsolute(localCommand) ? isProjectLocalBinPath(localCommand, root) ? localCommand : void 0 : findLocalBinUpwards(localCommand, root) : void 0;
      if (localBinary) {
        recordDegradationOnce({
          kind: "lsp-registry-decision",
          subject: `${server.id}:${normalizeMapKey(root)}`,
          reason: "project-local LSP binary refused for adopted root"
        });
        return void 0;
      }
      this.adoptedClientKeys.add(key);
      if (!this.admitAdoptedRoot(root, filePath))
        return void 0;
    }
    const isOptionalServer = OPTIONAL_LSP_SERVER_IDS.has(server.id);
    if (server.availabilityKey && isDirectLspCommandTemporarilyUnavailable(server.availabilityKey)) {
      emitBounded("lsp_client_skipped_unavailable_command", `${server.availabilityKey}:${normalizeMapKey(filePath)}`, {
        filePath,
        durationMs: 0,
        metadata: {
          serverId: server.id,
          command: server.availabilityKey
        }
      }, {
        ledgerKind: "lsp-client-skipped-unavailable-command",
        risingEdgePer: "identity",
        reason: `command ${server.availabilityKey} temporarily unavailable`
      });
      return void 0;
    }
    if (isOptionalServer && this.optionalDisabled.has(key)) {
      return void 0;
    }
    if (this.permanentlyBroken.has(key)) {
      emitBounded("lsp_client_skipped_broken", `${server.id}:${normalizeMapKey(filePath)}`, {
        filePath,
        durationMs: 0,
        metadata: {
          serverId: server.id,
          permanent: true
        }
      }, {
        ledgerKind: "lsp-client-skipped-broken",
        risingEdgePer: "identity",
        reason: `${server.id} latched permanently broken`
      });
      return void 0;
    }
    const existing = this.state.clients.get(key);
    if (existing) {
      if (existing.isAlive()) {
        this.unavailableLogged.delete(key);
        this.clientLastUsedAt.set(key, Date.now());
        this.scheduleIdleEviction(key, server);
        if (!this.warmStartLogged.has(key)) {
          logSessionStart(`lsp warm-start ${server.id}: reused root=${root} file=${filePath}`);
          this.warmStartLogged.add(key);
        }
        onOutcome?.("warm-reuse");
        return { client: existing, info: server };
      }
      const spawnedAt = this.state.clientSpawnedAt.get(key);
      const wasIntentional = existing.wasShutdownIntentional();
      const exitedAt = existing.getExitedAt();
      const uptimeMs = exitedAt != null && spawnedAt != null ? exitedAt - spawnedAt : spawnedAt != null ? Date.now() - spawnedAt : null;
      logLatency({
        type: "phase",
        phase: "lsp_server_respawn",
        filePath,
        durationMs: 0,
        metadata: {
          serverId: server.id,
          root,
          uptimeMs,
          intentional: wasIntentional
        }
      });
      this.releaseOutstandingAuxNotifyWrite(key);
      try {
        await existing.shutdown();
      } catch {
      }
      this.retireClient(key);
      this.state.broken.delete(key);
      if (wasIntentional) {
      } else {
        if (this.recordRuntimeExitWindow(key, exitedAt, uptimeMs)) {
          const rate = `${RUNTIME_EXIT_WINDOW_TRIP_COUNT} deaths within ${Math.round(RUNTIME_EXIT_WINDOW_MS / 6e4)}m`;
          this.state.broken.set(key, Math.max(this.state.broken.get(key) ?? 0, Date.now() + (isOptionalServer ? OPTIONAL_LSP_RETRY_COOLDOWN_MS : BROKEN_MAX_COOLDOWN_MS)));
          if (isOptionalServer) {
            this.optionalDisabled.add(key);
            this.runtimeExitWindow.delete(key);
            logSessionStart(`lsp respawn ${server.id}: optional server cooled down (windowed-rate trip: ${rate})`);
          } else {
            this.permanentlyBroken.add(key);
            this.recordBreaker(key, `windowed runtime-exit trip: ${rate}`);
            logSessionStart(`lsp respawn ${server.id}: permanently disabled (windowed-rate trip: ${rate}, uptimeMs=${uptimeMs})`);
          }
        }
        if (uptimeMs != null && uptimeMs < RUNTIME_EXIT_UPTIME_THRESHOLD_MS) {
          const rCount = (this.runtimeExitCounts.get(key) ?? 0) + 1;
          this.runtimeExitCounts.set(key, rCount);
          const rCooldown = Math.min(BROKEN_BASE_COOLDOWN_MS * 2 ** (rCount - 1), BROKEN_MAX_COOLDOWN_MS);
          this.state.broken.set(key, Date.now() + rCooldown);
          if (!isOptionalServer && rCount >= BROKEN_PERMANENT_AFTER) {
            this.permanentlyBroken.add(key);
            this.recordBreaker(key, `permanently disabled after ${rCount} early post-init exits`);
            logSessionStart(`lsp respawn ${server.id}: permanently disabled after ${rCount} early post-init exits (uptimeMs=${uptimeMs})`);
          } else {
            logSessionStart(`lsp respawn ${server.id}: early post-init exit ${rCount}/${BROKEN_PERMANENT_AFTER} (uptimeMs=${uptimeMs}), cooldown=${rCooldown}ms`);
          }
        } else {
          this.runtimeExitCounts.delete(key);
          const windowDeaths = this.runtimeExitWindow.get(key);
          if (windowDeaths) {
            const windowNow = exitedAt ?? Date.now();
            if (!windowDeaths.some((t) => t >= windowNow - RUNTIME_EXIT_WINDOW_MS)) {
              this.runtimeExitWindow.delete(key);
            }
          }
        }
      }
    }
    const brokenUntil = this.state.broken.get(key);
    if (typeof brokenUntil === "number" && brokenUntil > Date.now()) {
      emitBounded("lsp_client_skipped_broken", `${server.id}:${normalizeMapKey(filePath)}`, {
        filePath,
        durationMs: 0,
        metadata: {
          serverId: server.id,
          retryInMs: Math.max(0, brokenUntil - Date.now())
        }
      }, {
        ledgerKind: "lsp-client-skipped-broken",
        risingEdgePer: "identity",
        reason: `${server.id} in breaker cooldown`
      });
      return void 0;
    }
    if (typeof brokenUntil === "number" && brokenUntil <= Date.now()) {
      this.state.broken.delete(key);
      if (isOptionalServer)
        this.optionalDisabled.delete(key);
    }
    let startedSpawn = false;
    let spawnPromise = this.state.inFlight.get(key);
    if (!spawnPromise) {
      const started = await this.withClientSpawnGate(async () => {
        const raced = this.state.inFlight.get(key);
        if (raced)
          return { promise: raced, startedSpawn: false };
        if (this.checkDestroyed())
          return void 0;
        if (!await this.makeCapacityForClient(key))
          return void 0;
        const promise = this.spawnClient(server, root, key, filePath, allowInstall);
        this.state.inFlight.set(key, promise);
        return { promise, startedSpawn: true };
      });
      if (!started)
        return void 0;
      spawnPromise = started.promise;
      startedSpawn = started.startedSpawn;
    }
    onSpawnInFlight?.(server.id);
    try {
      const spawned = await spawnPromise;
      onOutcome?.(spawned ? startedSpawn ? "cold-spawn" : "cold-spawn-joined" : this.lastSpawnVerdict.get(key) === "failed" ? startedSpawn ? "spawn-failure" : "spawn-failure-joined" : "declined");
      return spawned;
    } catch (err) {
      onOutcome?.("spawn-failure");
      throw err;
    } finally {
      if (this.state.inFlight.get(key) === spawnPromise) {
        this.state.inFlight.delete(key);
      }
    }
  }
  shouldAllowInstall(serverId) {
    if (!assertInstallAllowed(`lsp install: ${serverId}`))
      return false;
    return process.env.PI_LENS_DISABLE_LSP_INSTALL !== "1";
  }
  /**
   * Internal: spawn a client for a server/root combination
   */
  async spawnClient(server, root, key, filePath, allowInstall) {
    try {
      if (server.executesProjectCode === true) {
        refuseUntrustedLspExecution({
          kind: "project-code-server",
          serverId: server.id,
          root
        });
      }
    } catch (error) {
      logSessionStart(`lsp spawn ${server.id}: refused \u2014 ${error instanceof Error ? error.message : String(error)}`);
      this.noteSpawnVerdict(key, "failed");
      return void 0;
    }
    if (server.trustAllowed !== true && !isLspSpawnAllowedByTrust()) {
      logSessionStart(`lsp spawn ${server.id}: refused \u2014 ${projectTrustDenialReason()}`);
      this.noteSpawnVerdict(key, "declined");
      return void 0;
    }
    const isOptionalServer = OPTIONAL_LSP_SERVER_IDS.has(server.id);
    const startedAt = Date.now();
    logSessionStart(`lsp spawn ${server.id}: start root=${root} install=${allowInstall ? "enabled" : "disabled"} file=${filePath}`);
    recordLsp(server.id, root, "spawn_start");
    try {
      const projectCodeAllowed = this.analysisRootModeForFile(filePath) !== "adopted";
      const spawned = await withLspProjectCodePermission(projectCodeAllowed, () => server.spawn(root, {
        allowInstall,
        projectCodeAllowed,
        sessionRoot: this.sessionCwd ?? process.cwd()
      }));
      if (this.isDestroyed) {
        try {
          spawned?.process?.process?.kill();
        } catch {
        }
        logSessionStart(`lsp spawn ${server.id}: aborted (service shut down mid-spawn)`);
        this.noteSpawnVerdict(key, "declined");
        return void 0;
      }
      if (!spawned) {
        logSessionStart(`lsp spawn ${server.id}: unavailable (${Date.now() - startedAt}ms)`);
        recordLsp(server.id, root, "spawn_failed", Date.now() - startedAt);
        if (!allowInstall) {
          logSessionStart(`lsp spawn ${server.id}: unavailable with install disabled; temporary cooldown only`);
          this.state.broken.set(key, Date.now() + BROKEN_BASE_COOLDOWN_MS);
          this.noteSpawnVerdict(key, "declined");
          return void 0;
        }
        const uCount = (this.failureCounts.get(key) ?? 0) + 1;
        this.failureCounts.set(key, uCount);
        const uCooldown = Math.min(BROKEN_BASE_COOLDOWN_MS * 2 ** (uCount - 1), BROKEN_MAX_COOLDOWN_MS);
        this.state.broken.set(key, Date.now() + uCooldown);
        if (uCount >= BROKEN_PERMANENT_AFTER) {
          this.permanentlyBroken.add(key);
          this.recordBreaker(key, `permanently disabled after ${uCount} unavailable spawns`);
          logSessionStart(`lsp spawn ${server.id}: permanently disabled after ${uCount} failures`);
        }
        this.noteSpawnVerdict(key, "failed");
        return void 0;
      }
      const override = getServerInitOverride(server.id, filePath);
      const mergedInit = spawned.launchVariant === "classic" ? mergeInitializationOptions(override?.initializationOptions, spawned.initialization) : mergeInitializationOptions(spawned.initialization, override?.initializationOptions);
      this.state.diagnosticsPublished.delete(server.id);
      this.state.diagnosticsUnsupported.delete(server.id);
      this.firstContactWaits.delete(server.id);
      const client = await createLSPClient({
        serverId: server.id,
        process: spawned.process,
        root,
        sessionCwd: this.sessionCwd,
        initialization: mergedInit,
        initializeTimeoutMs: server.initializeTimeoutMs,
        launchVariant: spawned.launchVariant,
        onDiagnosticsPublished: (serverId) => {
          this.state.diagnosticsPublished.add(serverId);
        }
      });
      if (this.isDestroyed) {
        client.shutdown({ fast: true }).catch(() => {
        });
        logSessionStart(`lsp spawn ${server.id}: aborted (service shut down mid-initialize)`);
        this.noteSpawnVerdict(key, "declined");
        return void 0;
      }
      const wsDiag = typeof client.getWorkspaceDiagnosticsSupport === "function" ? client.getWorkspaceDiagnosticsSupport() : {
        advertised: false,
        mode: "push-only",
        diagnosticProviderKind: "unavailable"
      };
      this.state.clients.set(key, client);
      this.forgetReadiness(key);
      this.notifyStallDemotions.delete(key);
      this.unavailableLogged.delete(key);
      this.lastSpawnVerdict.delete(key);
      this.state.clientSpawnedAt.set(key, Date.now());
      this.clientLastUsedAt.set(key, Date.now());
      this.scheduleIdleEviction(key, server);
      this.failureCounts.delete(key);
      if (isOptionalServer) {
        this.optionalDisabled.delete(key);
        this.optionalFailureLogged.delete(key);
      }
      logSessionStart(`lsp spawn ${server.id}: success source=${spawned.source ?? "unknown"} (${Date.now() - startedAt}ms)`);
      const spawnDurationMs = Date.now() - startedAt;
      recordLsp(server.id, root, "spawn_success", spawnDurationMs);
      recordSuccessfulLspSpawn(server.id, spawnDurationMs);
      logLatency({
        type: "phase",
        phase: "lsp_server_spawned",
        filePath: root,
        durationMs: spawnDurationMs,
        metadata: {
          serverId: server.id,
          source: spawned.source ?? "unknown",
          launchVariant: spawned.launchVariant ?? "default",
          triggerFilePath: filePath
        }
      });
      if (!this.workspaceProbeLogged.has(key)) {
        logSessionStart(`lsp workspace-diag probe ${server.id}: advertised=${wsDiag.advertised} mode=${wsDiag.mode} provider=${wsDiag.diagnosticProviderKind}`);
        this.workspaceProbeLogged.add(key);
      }
      return { client, info: server };
    } catch (err) {
      recordLsp(server.id, root, "spawn_failed", Date.now() - startedAt);
      if (!isOptionalServer || !this.optionalFailureLogged.has(key)) {
        logSessionStart(`lsp spawn ${server.id}: failed (${Date.now() - startedAt}ms) error=${err instanceof Error ? err.message : String(err)}`);
        if (isOptionalServer) {
          this.optionalFailureLogged.add(key);
        }
      }
      const eCount = (this.failureCounts.get(key) ?? 0) + 1;
      this.failureCounts.set(key, eCount);
      const eCooldown = isOptionalServer ? OPTIONAL_LSP_RETRY_COOLDOWN_MS : Math.min(BROKEN_BASE_COOLDOWN_MS * 2 ** (eCount - 1), BROKEN_MAX_COOLDOWN_MS);
      this.state.broken.set(key, Date.now() + eCooldown);
      if (!isOptionalServer && eCount >= BROKEN_PERMANENT_AFTER) {
        this.permanentlyBroken.add(key);
        this.recordBreaker(key, `permanently disabled after ${eCount} spawn/initialize failures`);
        logSessionStart(`lsp spawn ${server.id}: permanently disabled after ${eCount} failures`);
      }
      if (isOptionalServer) {
        this.optionalDisabled.add(key);
      }
      this.noteSpawnVerdict(key, "failed");
      return void 0;
    }
  }
  /**
   * Open a file in LSP (sends textDocument/didOpen)
   */
  async openFile(filePath, content, options) {
    if (this.checkDestroyed())
      return;
    const startedAt = Date.now();
    await this.withClientForFileUse(filePath, void 0, options?.spawnBudgetMs, async (spawned) => {
      const languageId = getLanguageId2(filePath) ?? "plaintext";
      const sent = await spawned.client.notify.open(filePath, content, languageId, options?.preserveDiagnostics);
      this.recordFullyCoveredSync(filePath, content, [spawned], sent !== false, startedAt);
    });
  }
  /**
   * Update file content (sends textDocument/didChange)
   */
  async updateFile(filePath, content) {
    if (this.checkDestroyed())
      return;
    await this.withClientForFileUse(filePath, void 0, void 0, (spawned) => spawned.client.notify.change(filePath, content));
  }
  /**
   * Touch a file like OpenCode's LSP flow: ensure document is open/synced,
   * and optionally collect diagnostics with explicit scope.
   */
  async touchFile(filePath, content, options = {}) {
    if (this.checkDestroyed()) {
      const destroyedDiagnosticsMode = options.collectDiagnostics ? options.diagnostics ?? "document" : options.diagnostics ?? "none";
      logLatency({
        type: "phase",
        phase: "lsp_touch_file",
        filePath: normalizeMapKey(filePath),
        durationMs: 0,
        metadata: {
          serverCountAttempted: 0,
          serverCountReady: 0,
          clientScope: options.clientScope ?? (destroyedDiagnosticsMode === "full" ? "all" : "primary"),
          diagnosticsMode: destroyedDiagnosticsMode,
          source: options.source ?? "unknown",
          failureKind: "destroyed"
        }
      });
      return;
    }
    const contentHash2 = this.hashContent(content);
    if (typeof content === "string") {
      void this.announceToSiblings(filePath, content, contentHash2).catch((cause) => {
        incrementDegradationCount({
          kind: "lsp-sibling-announcement",
          subject: normalizeMapKey(filePath),
          reason: `sibling notification failed: ${String(cause)}`
        });
      });
    }
    const startedAt = Date.now();
    let fingerprintMemo;
    const contentFingerprint = () => fingerprintMemo ??= fingerprintDocumentContent(content);
    const hookDeadlineAt = options.hook !== void 0 && Object.hasOwn(HOOK_WALL_BUDGET_MS, options.hook) ? startedAt + HOOK_WALL_BUDGET_MS[options.hook] : void 0;
    const normalizedPath = normalizeMapKey(filePath);
    const outsideRoot = await this.findOutsideProjectRoot(filePath);
    if (outsideRoot) {
      this.recordOutsideRootDecline(filePath, outsideRoot, "touchFile");
      return { diags: [], skipReason: "outside-project-root" };
    }
    void this.sweepDocumentDrift().catch(() => {
    });
    const diagnosticsMode = options.collectDiagnostics ? options.diagnostics ?? "document" : options.diagnostics ?? "none";
    const source = options.source ?? "unknown";
    const clientScope = options.clientScope ?? (diagnosticsMode === "full" ? "all" : "primary");
    const useAllClients = clientScope === "all";
    const resolvedPrimaryRoots = /* @__PURE__ */ new Map();
    const attemptedAuxiliaryRoots = /* @__PURE__ */ new Map();
    const waitSkipReasons = /* @__PURE__ */ new Set();
    const coldAuxiliaryServerIds = /* @__PURE__ */ new Set();
    const noteColdAuxiliary = (serverId, outcome) => {
      if (outcome === "cold-spawn" || outcome === "cold-spawn-joined") {
        coldAuxiliaryServerIds.add(serverId);
      }
    };
    let spawned;
    let serverCountAttempted;
    if (useAllClients) {
      const result = await this.getClientsForFile(filePath, options.excludeServerIds, resolvedPrimaryRoots, attemptedAuxiliaryRoots);
      spawned = result.clients;
      serverCountAttempted = result.serverCountAttempted;
    } else if (clientScope === "with-auxiliary") {
      const auxStartedAt = Date.now();
      const [entry, aux] = await Promise.all([
        this.getClientForFile(filePath, options.maxClientWaitMs, void 0, resolvedPrimaryRoots, waitSkipReasons),
        this.getAuxiliaryClientsForFile(filePath, new Set(options.auxiliaryServerIds ?? []), noteColdAuxiliary, options.maxClientWaitMs, void 0, options.hook)
      ]);
      const auxDurationMs = Date.now() - auxStartedAt;
      if (options.auxiliaryServerIds && options.auxiliaryServerIds.length > 0) {
        logLatency({
          type: "phase",
          phase: "auxiliary_readiness",
          filePath: normalizedPath,
          durationMs: auxDurationMs,
          metadata: {
            serverIds: aux.map((s) => s.info.id),
            attemptedCount: options.auxiliaryServerIds.length,
            readyCount: aux.length,
            coldServerIds: [...coldAuxiliaryServerIds],
            source
          }
        });
      }
      spawned = entry ? [entry, ...aux] : aux;
      serverCountAttempted = spawned.length;
    } else {
      const entry = await this.getClientForFile(filePath, options.maxClientWaitMs, void 0, resolvedPrimaryRoots, waitSkipReasons);
      spawned = entry ? [entry] : [];
      serverCountAttempted = spawned.length > 0 ? 1 : getServersForFileWithConfig(filePath).length > 0 ? 1 : 0;
    }
    if (spawned.length === 0) {
      const failureKind = this.isSpawnInFlight(filePath, resolvedPrimaryRoots) ? "spawn_in_flight_budget_elapsed" : "no_clients_none_spawning";
      logLatency({
        type: "phase",
        phase: "lsp_touch_file",
        filePath: normalizedPath,
        durationMs: Date.now() - startedAt,
        metadata: {
          serverCountAttempted,
          serverCountReady: 0,
          clientScope,
          diagnosticsMode,
          source,
          maxClientWaitMs: options.maxClientWaitMs,
          failureKind,
          ...waitSkipReasons.size > 0 ? { reason: [...waitSkipReasons][0] } : {},
          // #3873 O9: part of the touch's one row, so no extra record per touch.
          candidates: this.describeTouchCandidates(filePath, resolvedPrimaryRoots, attemptedAuxiliaryRoots)
        }
      });
      return;
    }
    const leaseKeys = await this.acquireClientLeases(spawned, filePath);
    if (!leaseKeys) {
      if (this.checkDestroyed()) {
        const primaryServerIds = spawned.filter((entry) => !isAuxiliary(entry.info)).map((entry) => entry.info.id);
        return {
          diags: [],
          inconclusive: true,
          ...primaryServerIds.length > 0 && {
            inconclusiveServerIds: primaryServerIds
          },
          inconclusiveReason: "diagnostics-wait"
        };
      }
      return this.touchFile(filePath, content, options);
    }
    try {
      if (this.shouldSkipTouch(filePath, contentFingerprint, clientScope, diagnosticsMode !== "none", spawned)) {
        logLatency({
          type: "phase",
          phase: "lsp_touch_file",
          filePath: normalizedPath,
          durationMs: Date.now() - startedAt,
          metadata: {
            serverCountReady: spawned.length,
            clientScope,
            diagnosticsMode,
            source,
            failureKind: "success",
            skipped: true,
            reason: "debounced_unchanged_content"
          }
        });
        return { diags: [] };
      }
      const languageId = getLanguageId2(filePath) ?? "plaintext";
      const silent = options.silent ?? false;
      const notifySkippedServerIds = new Set(spawned.filter((entry) => this.shouldSkipNotify(filePath, contentFingerprint, clientScope, entry.info.id, entry.client)).map((entry) => entry.info.id));
      const notifySkipped = spawned.length > 0 && notifySkippedServerIds.size === spawned.length;
      const readPathVersion = (client) => client.getDiagnosticsVersionForPath?.(filePath);
      const diagnosticBaselines = new Map(spawned.map((entry) => [entry.client, readPathVersion(entry.client)]));
      const markedAtMs = Date.now();
      const touchContentHash = contentHash2;
      const bindingMatchesTouchContent = (binding2) => binding2?.contentHash === touchContentHash;
      const carriedAuxiliary = options.collectDiagnostics ? spawned.flatMap((entry) => {
        if (!isAuxiliary(entry.info))
          return [];
        const binding2 = entry.client.getDiagnosticBinding?.(filePath);
        if (!bindingMatchesTouchContent(binding2))
          return [];
        const diags = entry.client.getDiagnostics(filePath);
        return diags.length > 0 ? [{ serverId: entry.info.id, diags, binding: binding2 }] : [];
      }) : [];
      const auxPublishedThisContent = new Set(spawned.flatMap((entry) => isAuxiliary(entry.info) && bindingMatchesTouchContent(entry.client.getDiagnosticBinding?.(filePath)) ? [entry.info.id] : []));
      const spawnedByServerId = new Map(spawned.map((entry) => [entry.info.id, entry]));
      const auxCoversThisContent = (serverId) => {
        const entry = spawnedByServerId.get(serverId);
        if (!entry || !isAuxiliary(entry.info))
          return false;
        return auxPublishedThisContent.has(serverId) || bindingMatchesTouchContent(entry.client.getDiagnosticBinding?.(filePath));
      };
      const notifyWriteTimedOutServerIds = [];
      const notifyDeferredServerIds = [];
      const supersededServerIds = [];
      if (!notifySkipped) {
        const budget = notifyWriteBudgetMs();
        const queueWaitMs = options.maxClientWaitMs !== void 0 ? Math.min(budget, Math.max(0, primaryServerWaitFloorMs(filePath, options.maxClientWaitMs) - (Date.now() - startedAt))) : budget;
        await Promise.all(spawned.map(async (entry) => {
          if (notifySkippedServerIds.has(entry.info.id))
            return;
          const clientKey = await this.demonstratedReadyKeyFor(entry.info, filePath);
          const gated = isAuxiliary(entry.info) && clientKey !== void 0;
          let slot;
          if (gated && clientKey) {
            const barrierStartedAt = Date.now();
            await this.paceAuxNotify(clientKey, entry, filePath, queueWaitMs, {
              source,
              clientScope
            });
            const slotWaitMs = Math.max(0, queueWaitMs - (Date.now() - barrierStartedAt));
            const claim = await this.claimAuxNotifySlot(clientKey, entry, filePath, slotWaitMs);
            if ("outstandingMs" in claim) {
              notifyDeferredServerIds.push(entry.info.id);
              logLatency({
                type: "phase",
                phase: "lsp_notify_resync_deferred",
                filePath: normalizedPath,
                durationMs: claim.outstandingMs,
                metadata: {
                  serverId: entry.info.id,
                  source,
                  clientScope,
                  reason: "outstanding_write",
                  outstandingMs: claim.outstandingMs,
                  queueWaitMs
                }
              });
              return;
            }
            slot = claim;
          }
          let wrote;
          let rejected = false;
          try {
            const writeStartedAt = Date.now();
            const writePromise = entry.client.notify.open(filePath, content, languageId, void 0, silent, options.saved === true, options.readStamp).then((sent) => sent !== false);
            if (gated && clientKey) {
              this.noteAuxNotifyIssued(clientKey, entry.client);
            }
            if (slot && clientKey) {
              const client = entry.client;
              const release = slot.release;
              void writePromise.then(() => {
                release();
                const outstandingMs = Date.now() - writeStartedAt;
                if (outstandingMs > budget && outstandingMs <= this.auxNotifyWedgeBudgetMs(clientKey)) {
                  this.retractNotifyWriteBackpressure(clientKey, entry.info.id, filePath, outstandingMs, client);
                }
              }, release);
            }
            wrote = await withDeadline(writePromise, {
              ms: budget,
              onTimeout: "undefined",
              onReject: "propagate"
            });
          } catch {
            rejected = true;
            slot?.release();
          }
          if (wrote === true) {
            if (clientKey)
              this.notifyWriteBackpressureStreak.delete(clientKey);
            this.markTouched(filePath, contentFingerprint(), clientScope, entry.info.id, entry.client);
          } else if (wrote === false) {
            supersededServerIds.push(entry.info.id);
          } else {
            notifyWriteTimedOutServerIds.push(entry.info.id);
            if (!rejected) {
              this.recordNotifyWriteBackpressure(clientKey, entry, filePath);
            }
          }
        }));
        this.recordFullyCoveredSync(filePath, content, spawned, notifyWriteTimedOutServerIds.length === 0 && notifyDeferredServerIds.length === 0 && supersededServerIds.length === 0, startedAt, contentFingerprint);
        if (notifyWriteTimedOutServerIds.length > 0) {
          logLatency({
            type: "phase",
            phase: "lsp_notify_timeout",
            filePath: normalizedPath,
            durationMs: Date.now() - startedAt,
            metadata: {
              source,
              clientScope,
              serverCount: spawned.length,
              timedOutServerIds: notifyWriteTimedOutServerIds
            }
          });
        }
      }
      const notifyWriteTimedOut = notifyWriteTimedOutServerIds.length > 0;
      const primaryEntries = spawned.filter((entry) => !isAuxiliary(entry.info));
      const primaryServerIds = new Set(primaryEntries.map((e) => e.info.id));
      const primaryNotifyWriteTimedOutServerIds = notifyWriteTimedOutServerIds.filter((id) => primaryServerIds.has(id));
      const primaryNotifyWriteTimedOut = primaryNotifyWriteTimedOutServerIds.length > 0;
      const deferredResyncServerIds = new Set(notifyDeferredServerIds);
      let diagnosticsTimedOut = false;
      let diagnosticsUnansweredServerIds = [];
      let diagnosticsUnansweredPrimaryServerIds = [];
      const retractPrimaryTimeoutAttribution = () => {
        diagnosticsUnansweredPrimaryServerIds = [];
        diagnosticsUnansweredServerIds = diagnosticsUnansweredServerIds.filter((id) => !primaryServerIds.has(id));
      };
      let auxCutOffServerIds;
      let auxUnconfirmedServerIds;
      let lateDeliveryServerIds;
      let tsserverSyncEligible = false;
      const isWarmupTouch = source === "lsp_sweep_warmup";
      let tsserverSyncConfirmed;
      let diagnosticsUnsupportedServerIds = [];
      if (diagnosticsMode !== "none") {
        const envWait = readEnvDiagnosticsWaitMs();
        const callerCap = options.maxDiagnosticsWaitMs ?? options.maxClientWaitMs;
        const modeFloor = diagnosticsMode === "full" ? 3e3 : 1200;
        const sweepFirstTouch = /* @__PURE__ */ new Map();
        if (options.sweepIndexGate) {
          for (const entry of spawned) {
            const strategy = getStrategy(entry.client.serverId, entry.client.getLaunchVariant?.());
            if (strategy.workspaceIndexing) {
              sweepFirstTouch.set(entry.client.serverId, options.sweepIndexGate.consumeFirstTouch(entry.client.serverId));
            }
          }
        }
        const silentCleanWarmupServers = /* @__PURE__ */ new Set();
        if (options.warmupOverride && (options.warmupAttempt ?? 1) <= 1) {
          for (const entry of spawned) {
            const strategy = getStrategy(entry.client.serverId, entry.client.getLaunchVariant?.());
            if (strategy.workspaceIndexing !== true)
              continue;
            try {
              const snapshot = {
                serverId: entry.client.serverId,
                root: entry.client.root,
                operationSupport: entry.client.getOperationSupport(),
                workspaceDiagnosticsSupport: entry.client.getWorkspaceDiagnosticsSupport(),
                customServer: entry.info.custom,
                diagnosticsPublished: this.state.diagnosticsPublished.has(entry.info.id),
                diagnosticsUnsupported: this.state.diagnosticsUnsupported.has(entry.info.id),
                advertisedCommands: entry.client.getAdvertisedCommands(),
                rawCapabilityKeys: entry.client.getRawCapabilityKeys?.() ?? [],
                launchVariant: entry.client.getLaunchVariant?.()
              };
              if (classifyServerWaitTier(entry.client.serverId, snapshot) === "tier3-silent") {
                silentCleanWarmupServers.add(entry.client.serverId);
              }
            } catch {
            }
          }
        }
        const perServerTimeout = (serverId) => {
          const launchVariant = spawned.find((entry) => entry.client.serverId === serverId)?.client.getLaunchVariant?.();
          const strategy = getStrategy(serverId, launchVariant);
          let strategyWait = strategy.aggregateWaitMs;
          const isFirstTouch = sweepFirstTouch.get(serverId);
          if (isFirstTouch === false && strategy.workspaceIndexing) {
            strategyWait = strategy.workspaceIndexingWarmWaitMs ?? Math.min(300, strategyWait);
          }
          if (callerCap !== void 0) {
            if (options.warmupOverride) {
              if (silentCleanWarmupServers.has(serverId)) {
                return Math.min(callerCap, strategyWait > 0 ? strategyWait : callerCap);
              }
              if ((options.warmupAttempt ?? 1) > 1) {
                return Math.min(callerCap, strategyWait > 0 ? strategyWait : callerCap);
              }
              return Math.max(callerCap, strategyWait > 0 ? strategyWait : 0);
            }
            return Math.min(callerCap, strategyWait > 0 ? strategyWait : callerCap);
          }
          return strategyWait > 0 ? strategyWait : modeFloor;
        };
        let timeoutFor;
        if (envWait !== void 0) {
          timeoutFor = () => envWait;
        } else if (!useAllClients && spawned.length === 1 || clientScope === "with-auxiliary" || clientScope === "all") {
          timeoutFor = perServerTimeout;
        } else {
          timeoutFor = () => callerCap ?? modeFloor;
        }
        const timeoutMs = Math.max(0, ...spawned.filter((e) => !deferredResyncServerIds.has(e.info.id)).map((e) => timeoutFor(e.client.serverId)));
        if (!notifyWriteTimedOut && (options.collectDiagnostics === true || isWarmupTouch) && clientScope === "primary" && spawned.length === 1 && spawned[0].client.serverId === "typescript" && getStrategy(spawned[0].client.serverId, spawned[0].client.getLaunchVariant?.()).silentOnClean === true) {
          try {
            const snapshots = await this.getCapabilitySnapshots(filePath);
            tsserverSyncEligible = classifyCascadeWaitTier(this, filePath, snapshots) === "tier3-silent";
          } catch {
          }
        }
        const waitStartedAt = Date.now();
        const hasTouchAuxiliaries = clientScope === "with-auxiliary" && options.collectDiagnostics === true && spawned.some((e) => isAuxiliary(e.info));
        if (spawned.some((entry) => entry.info.custom === true)) {
          try {
            const snapshotHook = options.hook ?? "tool_result_edit";
            const snapshotBudget = hookDeadlineAt === void 0 ? HOOK_WALL_BUDGET_MS.tool_result_edit : Math.max(0, hookDeadlineAt - Date.now());
            const snapshots = await bounded(this.getCapabilitySnapshots(filePath), {
              ms: snapshotBudget,
              signal: getAmbientAbortSignal(),
              shutdownSignal: this.shutdownController.signal,
              hook: snapshotHook,
              label: `getCapabilitySnapshots:${filePath}`
            });
            if (snapshots !== void 0) {
              diagnosticsUnsupportedServerIds = spawned.filter((entry) => classifyServerWaitTier(entry.info.id, snapshots.find((s) => s.serverId === entry.info.id)) === "diagnostics-unsupported").map((entry) => entry.info.id);
            }
          } catch {
          }
        }
        let pressureSnapshots = [];
        if (shouldPreferPullOnlyDiagnostics()) {
          try {
            pressureSnapshots = await this.getCapabilitySnapshots(filePath);
          } catch {
          }
        }
        const configuredAuxCeilingMs = readEnvAuxGraceMs();
        const perServerDeclaredTimeouts = spawned.map((entry) => timeoutFor(entry.client.serverId));
        const perServerWaitTimeouts = spawned.map((entry, entryIndex) => {
          const declaredServerTimeout = perServerDeclaredTimeouts[entryIndex];
          const observedSpawnMs = getSuccessfulLspSpawnDurationMs(entry.client.serverId);
          return hasTouchAuxiliaries && isAuxiliary(entry.info) && coldAuxiliaryServerIds.has(entry.client.serverId) && (configuredAuxCeilingMs !== void 0 || observedSpawnMs !== void 0 && observedSpawnMs > 0) ? auxWaitBudgetMs(entry.client.serverId, true, configuredAuxCeilingMs, declaredServerTimeout) : perServerDeclaredTimeouts[entryIndex];
        });
        const firstContactCutOffServerIds = /* @__PURE__ */ new Set();
        const firstContactErroredServerIds = /* @__PURE__ */ new Set();
        const answeredForThisTouch = (entry) => {
          const baseline = diagnosticBaselines.get(entry.client);
          const currentPathVersion = readPathVersion(entry.client);
          if (auxiliaryPublicationEvidence({
            bindingMatchesContent: false,
            baseline,
            currentPathVersion
          })) {
            return true;
          }
          try {
            return entry.client.getAllDiagnostics?.().has(normalizedPath) === true;
          } catch {
            return false;
          }
        };
        const perServerRaceBudgets = spawned.map((entry, entryIndex) => {
          return hasTouchAuxiliaries && isAuxiliary(entry.info) ? auxWaitBudgetMs(entry.client.serverId, coldAuxiliaryServerIds.has(entry.client.serverId), configuredAuxCeilingMs, perServerDeclaredTimeouts[entryIndex]) : perServerDeclaredTimeouts[entryIndex];
        });
        const perServerWaits = spawned.map((entry, entryIndex) => {
          if (hasTouchAuxiliaries && isAuxiliary(entry.info) && this.isAuxiliaryWaitDemoted(entry.info.id, entry.client.root ?? filePath)) {
            return Promise.resolve(void 0);
          }
          if (this.state.diagnosticsUnsupported.has(entry.info.id) || diagnosticsUnsupportedServerIds.includes(entry.info.id)) {
            return Promise.resolve(void 0);
          }
          if (deferredResyncServerIds.has(entry.info.id)) {
            return Promise.resolve(void 0);
          }
          const serverTimeout = perServerWaitTimeouts[entryIndex];
          const baseline = diagnosticBaselines.get(entry.client);
          const pullOnly = classifyServerWaitTier(entry.client.serverId, pressureSnapshots.find((snapshot) => snapshot.serverId === entry.client.serverId)) === "pull-capable";
          const waitForDiagnostics = () => !notifySkippedServerIds.has(entry.info.id) && Number.isFinite(baseline) ? entry.client.waitForDiagnostics(filePath, serverTimeout, {
            minVersion: baseline,
            ...pullOnly && { pullOnly: true },
            ...isWarmupTouch && { pullSettleSource: "pull-warmup" }
          }) : pullOnly ? entry.client.waitForDiagnostics(filePath, serverTimeout, {
            pullOnly: true,
            ...isWarmupTouch && { pullSettleSource: "pull-warmup" }
          }) : isWarmupTouch ? entry.client.waitForDiagnostics(filePath, serverTimeout, {
            pullSettleSource: "pull-warmup"
          }) : entry.client.waitForDiagnostics(filePath, serverTimeout);
          const firstContact = entry.info.custom === true && !this.state.diagnosticsPublished.has(entry.info.id) && !this.state.diagnosticsUnsupported.has(entry.info.id) && entry.client.getWorkspaceDiagnosticsSupport().mode !== "pull";
          if (!firstContact)
            return waitForDiagnostics().catch(() => void 0);
          let shared = this.firstContactWaits.get(entry.info.id);
          if (!shared) {
            let removeShutdownListener;
            const shutdown = new Promise((resolve9) => {
              const onShutdown = () => resolve9("shutdown");
              if (this.shutdownController.signal.aborted) {
                onShutdown();
                return;
              }
              this.shutdownController.signal.addEventListener("abort", onShutdown, {
                once: true
              });
              removeShutdownListener = () => this.shutdownController.signal.removeEventListener("abort", onShutdown);
            });
            const probe = Promise.race([
              waitForDiagnostics().then(() => "completed", () => "errored"),
              shutdown
            ]);
            const completed = withDeadline(probe, {
              ms: serverTimeout,
              onTimeout: "undefined"
            });
            shared = completed.then((outcome) => {
              if (outcome === "errored" || outcome === "shutdown") {
                return "errored";
              }
              if (answeredForThisTouch(entry))
                return "answered";
              this.state.diagnosticsUnsupported.add(entry.info.id);
              recordDegradationOnce({
                kind: "lsp-diagnostics-unsupported",
                subject: entry.info.id,
                reason: "custom server has no pull provider and no publish evidence after first contact wait"
              });
              return "silent";
            }).catch(() => "errored").finally(() => {
              removeShutdownListener?.();
              if (this.firstContactWaits.get(entry.info.id) === shared) {
                this.firstContactWaits.delete(entry.info.id);
              }
            });
            this.firstContactWaits.set(entry.info.id, shared);
          }
          const callerWait = hookDeadlineAt === void 0 ? shared : withDeadline(shared, {
            ms: Math.max(0, hookDeadlineAt - Date.now()),
            onTimeout: "undefined"
          });
          return callerWait.then((outcome) => {
            if (outcome === void 0) {
              firstContactCutOffServerIds.add(entry.info.id);
            } else if (outcome === "errored") {
              firstContactErroredServerIds.add(entry.info.id);
            }
            return void 0;
          });
        });
        let pushWaitSettled = false;
        const pushWait = hasTouchAuxiliaries ? (() => {
          const primaryWaits = perServerWaits.filter((_, i) => !isAuxiliary(spawned[i].info));
          const auxWaits = perServerWaits.map((p, i) => isAuxiliary(spawned[i].info) ? {
            promise: p,
            serverId: spawned[i].info.id,
            client: spawned[i].client,
            baseline: diagnosticBaselines.get(spawned[i].client),
            budgetMs: perServerRaceBudgets[i],
            demoted: this.isAuxiliaryWaitDemoted(spawned[i].info.id, spawned[i].client.root ?? filePath),
            root: spawned[i].client.root ?? filePath
          } : null).filter((x) => x !== null);
          return Promise.all(primaryWaits).then(async () => {
            if (auxWaits.length === 0)
              return;
            const auxWaitStartedAt = Date.now();
            const outcomes = await Promise.all(auxWaits.map(async (aux) => {
              const { budgetMs } = aux;
              if (aux.demoted) {
                return {
                  serverId: aux.serverId,
                  outcome: deferredResyncServerIds.has(aux.serverId) ? "deferred" : "demoted",
                  publishedThisContent: auxiliaryPublicationEvidence({
                    bindingMatchesContent: auxCoversThisContent(aux.serverId),
                    baseline: aux.baseline,
                    currentPathVersion: readPathVersion(aux.client)
                  }),
                  budgetMs,
                  elapsedMs: 0,
                  elapsedSinceNotifyMs: 0
                };
              }
              let timer;
              const timeout = new Promise((resolve9) => {
                timer = setTimeout(() => resolve9(false), budgetMs);
                if (typeof timer === "object" && "unref" in timer) {
                  timer.unref?.();
                }
              });
              const raced = await Promise.race([
                aux.promise.then(() => true),
                timeout
              ]);
              if (timer)
                clearTimeout(timer);
              const currentPathVersion = readPathVersion(aux.client);
              const publishedEvidence = auxiliaryPublicationEvidence({
                bindingMatchesContent: false,
                baseline: aux.baseline,
                currentPathVersion,
                raced
              });
              const outcome = deferredResyncServerIds.has(aux.serverId) ? "deferred" : !raced ? "cut_off" : publishedEvidence ? "answered" : "silent";
              const elapsedMs = Date.now() - auxWaitStartedAt;
              if (outcome !== "deferred") {
                this.noteAuxiliaryWait(`${aux.serverId}:${normalizeMapKey(aux.root)}`, budgetMs, elapsedMs);
              }
              return {
                serverId: aux.serverId,
                outcome,
                // #1493: carried into the coverage-gap policy so a silent
                // auxiliary that already published for these exact bytes is
                // not demoted. Logged too — it is the reason a `silent` row
                // did not narrow the touch.
                // #1586: through the one predicate, so this row and the merge
                // below cannot disagree about the same scanner.
                // #2914: binding-only by construction — the direct call
                // below is master's line; the stamp axis already decided
                // the outcome above and must not re-admit the row here.
                publishedThisContent: auxCoversThisContent(aux.serverId),
                budgetMs,
                elapsedMs,
                // #1458 S3: elapsed measured from BEFORE the primary wait
                // (waitStartedAt), not just from auxWaitStartedAt — this is
                // what lets a latency row validate the ~1.3s warm-scanner
                // figure the 2000ms ceiling was set from; `elapsedMs` alone
                // only covers the POST-primary aux phase.
                elapsedSinceNotifyMs: Date.now() - waitStartedAt
              };
            }));
            const unfinished = outcomes.filter((outcome) => outcome.outcome === "cut_off").map((outcome) => outcome.serverId);
            if (unfinished.length > 0)
              auxCutOffServerIds = unfinished;
            const uncovered = auxiliaryCoverageGap(outcomes);
            if (uncovered.length > 0)
              auxUnconfirmedServerIds = uncovered;
            const collectLaterServerIds = outcomes.filter((o) => !o.publishedThisContent && (o.outcome === "cut_off" || o.outcome === "silent" || o.outcome === "demoted") && // #2324 R2-A/R3-A: ast-grep's napi fallback is a
            // SECOND producer of coverage for this exact pair,
            // dispatched CONCURRENTLY with this whole touch
            // (dispatcher.ts's Promise.all groups) — not just
            // concurrently with this wait. On a COLD touch,
            // getClientsForFile's spawn+handshake (above, before
            // waitStartedAt is ever captured) can itself take
            // long enough that napi's near-instant Gate-B check
            // records coverage BEFORE waitStartedAt — the
            // issue's own 68ms race shape. Baseline on startedAt
            // instead: stamped at touchFile's own entry, before
            // ANY spawn work, so it is the earliest instant this
            // touch's own napi run could possibly predate. Still
            // excludes a stale record from an EARLIER touch,
            // which is all the staleness guard needs.
            !(o.serverId === "ast-grep" && napiFallbackCoveredSince(filePath, startedAt))).map((o) => o.serverId);
            if (collectLaterServerIds.length > 0) {
              lateDeliveryServerIds = collectLaterServerIds;
              for (const serverId of collectLaterServerIds) {
                markPendingAuxiliaryCoverage(filePath, [serverId], startedAt, void 0, void 0, captureAuxPublicationBacklog(auxWaits.find((aux) => aux.serverId === serverId)?.client, filePath));
              }
            }
            logLatency({
              type: "phase",
              phase: "lsp_aux_wait_outcome",
              filePath: normalizedPath,
              durationMs: Date.now() - auxWaitStartedAt,
              // #1533: `waitShape` names the producer, because the aggregate
              // path emits the same row with the same outcome vocabulary
              // minus `cut_off`. A field query that sees only `silent` rows
              // must be able to tell "our ceiling was in play" from "the
              // auxiliary's own full budget lapsed".
              metadata: { clientScope, waitShape: "aux_grace", outcomes }
            });
          });
        })() : Promise.all(perServerWaits).then(() => {
        });
        const markPushWaitSettled = () => {
          pushWaitSettled = true;
        };
        void pushWait.then(markPushWaitSettled, markPushWaitSettled);
        if (tsserverSyncEligible) {
          const graceMs = readTsserverSyncGraceMs();
          const primaryClient = spawned[0].client;
          const syncRacer = (async () => {
            await new Promise((resolve9) => {
              const timer = setTimeout(resolve9, graceMs);
              timer.unref?.();
            });
            const publishedAt = primaryClient.getAllDiagnostics?.().get(normalizedPath)?.ts;
            if (pushWaitSettled || publishedAt !== void 0 && publishedAt > markedAtMs) {
              return new Promise(() => {
              });
            }
            try {
              const result2 = await attemptTsserverSyncDiagnostics(filePath, tsserverSyncChannel(primaryClient));
              if (result2 === void 0 || pushWaitSettled) {
                return new Promise(() => {
                });
              }
              return result2;
            } catch {
              return new Promise(() => {
              });
            }
          })();
          const raceOutcome = await Promise.race([
            pushWait.then(() => void 0),
            syncRacer
          ]);
          if (raceOutcome !== void 0) {
            tsserverSyncConfirmed = raceOutcome;
          }
        } else {
          await pushWait;
        }
        const waitedMs = Date.now() - waitStartedAt;
        const firstContactCustomServerIds = spawned.filter((entry) => entry.info.custom === true && !this.state.diagnosticsPublished.has(entry.info.id) && !this.state.diagnosticsUnsupported.has(entry.info.id) && !firstContactCutOffServerIds.has(entry.info.id) && !firstContactErroredServerIds.has(entry.info.id) && entry.client.getWorkspaceDiagnosticsSupport().mode !== "pull").map((entry) => entry.info.id);
        for (const serverId of firstContactCustomServerIds) {
          const entry = spawned.find((candidate) => candidate.info.id === serverId);
          if (!entry || answeredForThisTouch(entry))
            continue;
          this.state.diagnosticsUnsupported.add(serverId);
          diagnosticsUnsupportedServerIds.push(serverId);
          recordDegradationOnce({
            kind: "lsp-diagnostics-unsupported",
            subject: serverId,
            reason: "custom server has no pull provider and no publish evidence after first contact wait"
          });
        }
        for (const entry of spawned) {
          if (entry.info.custom === true && this.state.diagnosticsUnsupported.has(entry.info.id)) {
            diagnosticsUnsupportedServerIds.push(entry.info.id);
          }
        }
        diagnosticsUnsupportedServerIds = [
          ...new Set(diagnosticsUnsupportedServerIds)
        ];
        if (!hasTouchAuxiliaries && options.collectDiagnostics === true) {
          const auxEntries = spawned.filter((entry) => isAuxiliary(entry.info));
          if (auxEntries.length > 0) {
            const outcomes = auxEntries.map((entry) => {
              const baseline = diagnosticBaselines.get(entry.client);
              const currentPathVersion = readPathVersion(entry.client);
              const publishedEvidence = auxiliaryPublicationEvidence({
                bindingMatchesContent: false,
                baseline,
                currentPathVersion
              });
              return {
                serverId: entry.info.id,
                outcome: deferredResyncServerIds.has(entry.info.id) ? "deferred" : publishedEvidence ? "answered" : "silent",
                // #2914: binding-only by construction — the direct call
                // below is master's line; the stamp axis already decided
                // the outcome above and must not re-admit the row here.
                publishedThisContent: auxCoversThisContent(entry.info.id),
                budgetMs: timeoutFor(entry.client.serverId),
                elapsedMs: waitedMs,
                elapsedSinceNotifyMs: waitedMs
              };
            });
            const uncovered = auxiliaryCoverageGap(outcomes);
            if (uncovered.length > 0)
              auxUnconfirmedServerIds = uncovered;
            logLatency({
              type: "phase",
              phase: "lsp_aux_wait_outcome",
              filePath: normalizedPath,
              durationMs: waitedMs,
              metadata: { clientScope, waitShape: "aggregate", outcomes }
            });
          }
        }
        if (tsserverSyncConfirmed !== void 0) {
          logLatency({
            type: "phase",
            phase: "lsp_tsserver_sync_confirm",
            filePath: normalizedPath,
            durationMs: waitedMs,
            metadata: {
              source,
              serverId: spawned[0]?.client.serverId,
              clientScope,
              diagnosticsMode,
              mode: "race",
              confirmedDiagnosticCount: tsserverSyncConfirmed.length,
              budgetMs: timeoutMs,
              savedVsBudgetMs: Math.max(0, timeoutMs - waitedMs)
            }
          });
        } else if (waitedMs + 20 >= timeoutMs || firstContactErroredServerIds.size > 0) {
          const waited = spawned.filter((entry) => !deferredResyncServerIds.has(entry.info.id) && !diagnosticsUnsupportedServerIds.includes(entry.info.id));
          const unanswered = waited.filter((entry) => !answeredForThisTouch(entry));
          diagnosticsUnansweredServerIds = unanswered.map((e) => e.info.id);
          diagnosticsUnansweredPrimaryServerIds = unanswered.filter((entry) => !isAuxiliary(entry.info)).map((e) => e.info.id);
          const hasWaitedPrimary = waited.some((entry) => !isAuxiliary(entry.info));
          const hasUnsupportedPrimary = diagnosticsUnsupportedServerIds.some((serverId) => spawned.some((entry) => entry.info.id === serverId && !isAuxiliary(entry.info)));
          diagnosticsTimedOut = !hasWaitedPrimary && !hasUnsupportedPrimary || diagnosticsUnansweredPrimaryServerIds.length > 0;
          for (const entry of unanswered) {
            incrementDegradationCount({
              kind: "lsp-diagnostics-timeout",
              // `info.id` is the authoritative server identity carried by
              // every spawned entry. The client test doubles (and some
              // lightweight clients) need not expose a serverId property;
              // ledger recording must never abort the touch or alter #570's
              // timeout-preserves-last-known-diagnostics semantics.
              subject: entry.info.id,
              reason: "diagnostics wait timed out"
            });
          }
          logLatency({
            type: "phase",
            phase: "lsp_diagnostics_timeout",
            filePath: normalizedPath,
            durationMs: waitedMs,
            metadata: {
              source,
              // #1444: WHICH server(s) burned the budget — without this the
              // ~221/day timeout rows can't be attributed to a server at all.
              // `info.id` (not `client.serverId`) for the same reason the
              // degradation ledger above uses it: test doubles and lightweight
              // clients need not expose `serverId`.
              serverIds: spawned.map((e) => e.info.id),
              clientScope,
              diagnosticsMode,
              timeoutMs,
              // #1549: which of those servers actually produced no evidence, and
              // whether the lapse is attributable to a primary (the touch is
              // inconclusive) or only to auxiliaries (a named coverage gap, with
              // the primary's findings intact). Without these two fields a
              // forensic sweep cannot tell the two apart at all.
              unansweredServerIds: diagnosticsUnansweredServerIds,
              attributedToPrimary: diagnosticsTimedOut
            }
          });
        }
        if (diagnosticsTimedOut && !primaryNotifyWriteTimedOut && clientScope === "all") {
          try {
            const outstanding = primaryEntries.filter((entry) => !notifyWriteTimedOutServerIds.includes(entry.info.id) && !entry.client.getAllDiagnostics().has(normalizedPath));
            if (outstanding.length > 0) {
              const snapshots = await this.getCapabilitySnapshots(filePath);
              const allSilent = outstanding.every((entry) => classifyServerWaitTier(entry.client.serverId, snapshots.find((s) => s.serverId === entry.client.serverId)) === "tier3-silent");
              if (allSilent) {
                const liveness = await Promise.all(outstanding.map((entry) => (entry.client.pingLiveness?.() ?? Promise.resolve(true)).catch(() => false)));
                if (liveness.every(Boolean)) {
                  diagnosticsTimedOut = false;
                  retractPrimaryTimeoutAttribution();
                  logLatency({
                    type: "phase",
                    phase: "lsp_silent_clean_confirm",
                    filePath: normalizedPath,
                    durationMs: Date.now() - startedAt,
                    metadata: {
                      source,
                      clientScope,
                      diagnosticsMode,
                      aggregate: true,
                      serverIds: outstanding.map((entry) => entry.client.serverId)
                    }
                  });
                }
              }
            }
          } catch {
          }
        }
      }
      const auxCoveredAtMerge = new Set(spawned.filter((entry) => auxCoversThisContent(entry.info.id)).map((entry) => entry.info.id));
      const uncoveredDeferredServerIds = notifyDeferredServerIds.filter((serverId) => !auxCoveredAtMerge.has(serverId));
      const staleWriteAuxiliaryServerIds = spawned.filter((entry) => isAuxiliary(entry.info) && notifyWriteTimedOutServerIds.includes(entry.info.id) && !auxCoveredAtMerge.has(entry.info.id)).map((entry) => entry.info.id);
      const droppedAuxiliaryServerIds = /* @__PURE__ */ new Set([
        ...uncoveredDeferredServerIds,
        ...staleWriteAuxiliaryServerIds
      ]);
      let collected = options.collectDiagnostics ? tsserverSyncConfirmed !== void 0 ? mergeLspDiagnostics(attributeDiagnostics(spawned[0]?.info.id ?? "unknown", tsserverSyncConfirmed)) : mergeLspDiagnostics([
        // #1459: a DEFERRED server's cache still holds the PREVIOUS
        // content's findings — the resync that would have cleared it never
        // ran. Merging them would report another revision's findings (and
        // its line numbers) as this touch's answer, the one hazard the
        // gate itself creates. Drop them; the gap is reported instead.
        // #1586: unless the scanner has since published for exactly these
        // bytes — `droppedAuxiliaryServerIds` is the one frozen answer the
        // coverage naming and the merged binding read too.
        ...spawned.flatMap((entry) => droppedAuxiliaryServerIds.has(entry.info.id) ? [] : attributeDiagnostics(entry.info.id, entry.client.getDiagnostics(filePath))),
        ...carriedAuxiliary.flatMap((entry) => attributeDiagnostics(entry.serverId, entry.diags))
      ]) : void 0;
      let syncConfirmed = tsserverSyncConfirmed !== void 0;
      const syncClient = spawned[0]?.client;
      if (diagnosticsTimedOut && tsserverSyncEligible && syncClient !== void 0 && collected !== void 0 && collected.length === 0) {
        try {
          const syncResult = await attemptTsserverSyncDiagnostics(filePath, tsserverSyncChannel(syncClient));
          if (syncResult !== void 0) {
            diagnosticsTimedOut = false;
            retractPrimaryTimeoutAttribution();
            syncConfirmed = true;
            collected = syncResult.length > 0 ? mergeLspDiagnostics(attributeDiagnostics(spawned[0]?.info.id ?? "unknown", syncResult)) : [];
            logLatency({
              type: "phase",
              phase: "lsp_tsserver_sync_confirm",
              filePath: normalizedPath,
              durationMs: Date.now() - startedAt,
              metadata: {
                source,
                clientScope,
                diagnosticsMode,
                mode: "end-of-wait",
                confirmedDiagnosticCount: collected.length
              }
            });
          }
        } catch {
        }
      }
      if (diagnosticsTimedOut && // #1549: primary-scoped, like the aggregate gate. `spawned.length === 1`
      // below means the one server IS the primary, so this is the same condition
      // written in the vocabulary the rest of the merge now uses.
      !primaryNotifyWriteTimedOut && // #3187: the warm-up is sync-ELIGIBLE now, and eligibility alone must
      // not cost it this fallback. For a collecting touch the exclusion is
      // #707's contract (the end-of-wait retry above is typescript's second
      // chance, and failing it stays inconclusive); the warm-up collects
      // nothing, so that retry's `collected !== undefined` precondition can
      // never hold for it and the exclusion would leave a server whose
      // `typescript.tsserverRequest` is unavailable stranded inconclusive —
      // a #744 warm-up failure, its retry, and a SKIPPED sweep group, where
      // today it is certified clean. Reaching here at all means the race
      // produced no answer, so this decides nothing the sync already decided.
      (!tsserverSyncEligible || isWarmupTouch) && clientScope === "primary" && spawned.length === 1 && getStrategy(spawned[0].client.serverId, spawned[0].client.getLaunchVariant?.()).silentOnClean === true) {
        try {
          const snapshots = await this.getCapabilitySnapshots(filePath);
          if (classifyCascadeWaitTier(this, filePath, snapshots) === "tier3-silent") {
            const alive = await (spawned[0].client.pingLiveness?.() ?? Promise.resolve(true)).catch(() => false);
            if (alive) {
              diagnosticsTimedOut = false;
              retractPrimaryTimeoutAttribution();
              if (collected !== void 0)
                collected = mergeLspDiagnostics([]);
              logLatency({
                type: "phase",
                phase: "lsp_silent_clean_confirm",
                filePath: normalizedPath,
                durationMs: Date.now() - startedAt,
                metadata: {
                  source,
                  clientScope,
                  diagnosticsMode,
                  serverId: spawned[0].client.serverId
                }
              });
            }
          }
        } catch {
        }
      }
      const verdict = resolveTouchVerdict({
        primaryNotifyWriteTimedOutServerIds,
        diagnosticsTimedOut,
        diagnosticsUnansweredServerIds: diagnosticsUnansweredPrimaryServerIds
      });
      const inconclusive = verdict.inconclusive;
      const brokenSkippedServerIds = collected !== void 0 ? await this.brokenSkippedAuxiliaryServerIds(filePath, clientScope, options, spawned) : [];
      const auxNoAnswerServerIds = spawned.filter((entry) => isAuxiliary(entry.info) && (diagnosticsUnansweredServerIds.includes(entry.info.id) || notifyWriteTimedOutServerIds.includes(entry.info.id)) && !auxCoveredAtMerge.has(entry.info.id)).map((entry) => entry.info.id);
      const unconfirmedServerIds = [
        .../* @__PURE__ */ new Set([
          ...auxUnconfirmedServerIds ?? [],
          ...auxNoAnswerServerIds,
          ...uncoveredDeferredServerIds,
          ...brokenSkippedServerIds
        ])
      ].filter((serverId) => !auxCoveredAtMerge.has(serverId));
      const coverageGap = unconfirmedServerIds.length > 0;
      if (brokenSkippedServerIds.length > 0 || uncoveredDeferredServerIds.length > 0 || // #1549: the auxiliary deadline misses that used to surface as a blanket
      // `inconclusive` need their own row now that the touch reports usable
      // findings — otherwise the fix would remove the only record of the blackout.
      auxNoAnswerServerIds.length > 0) {
        for (const serverId of unconfirmedServerIds) {
          const reasons = [
            brokenSkippedServerIds.includes(serverId) && "breaker skip",
            uncoveredDeferredServerIds.includes(serverId) && "deferred resync",
            auxNoAnswerServerIds.includes(serverId) && "no diagnostics answer"
          ].filter(Boolean);
          incrementDegradationCount({
            kind: "lsp-scanner-coverage-gap",
            subject: `${serverId}:${normalizedPath}`,
            reason: reasons.join(", ") || "scanner coverage gap"
          });
        }
        emitBounded("lsp_scanner_coverage_gap", `${source}:${normalizedPath}`, {
          filePath: normalizedPath,
          durationMs: Date.now() - startedAt,
          metadata: {
            source,
            clientScope,
            ...brokenSkippedServerIds.length > 0 && {
              brokenSkippedServerIds
            },
            // #1586: the deferrals this touch is actually uncovered for. The
            // gate action keeps its own record in `lsp_notify_resync_deferred`;
            // this row exists to prove a blackout, and a scanner already bound
            // to these bytes is not one.
            ...uncoveredDeferredServerIds.length > 0 && {
              deferredResyncServerIds: uncoveredDeferredServerIds
            },
            ...auxNoAnswerServerIds.length > 0 && { auxNoAnswerServerIds }
          }
        });
      }
      const notifyTimedOutServerIds = new Set(notifyWriteTimedOutServerIds);
      const uncoveredServerIds = new Set(unconfirmedServerIds);
      if (diagnosticsMode !== "none" && !diagnosticsTimedOut) {
        for (const entry of spawned) {
          if (notifyTimedOutServerIds.has(entry.info.id))
            continue;
          if (uncoveredServerIds.has(entry.info.id))
            continue;
          const key = await this.demonstratedReadyKeyFor(entry.info, filePath);
          if (key && this.state.clients.get(key) === entry.client)
            this.markDemonstratedReadyKey(key);
        }
      }
      if (collected !== void 0 && !inconclusive && !coverageGap) {
        const normalizedKey = normalizeMapKey(filePath);
        if (collected.length > 0) {
          this.lastKnownDiagnostics.set(normalizedKey, collected);
          this.lastKnownContentHash.set(normalizedKey, this.hashContent(content));
        } else {
          this.lastKnownDiagnostics.delete(normalizedKey);
          this.lastKnownContentHash.delete(normalizedKey);
        }
      }
      const result = { diags: collected ?? [] };
      const primaryDiagnosticsUnsupported = diagnosticsUnsupportedServerIds.some((serverId) => spawned.some((entry) => entry.info.id === serverId && !isAuxiliary(entry.info)));
      if (diagnosticsUnsupportedServerIds.length > 0) {
        result.diagnosticsUnsupportedServerIds = diagnosticsUnsupportedServerIds;
      }
      if (collected !== void 0 && inconclusive) {
        result.inconclusive = true;
        if (verdict.inconclusiveServerIds) {
          result.inconclusiveServerIds = verdict.inconclusiveServerIds;
        }
        result.inconclusiveReason = verdict.inconclusiveReason;
      } else if (collected !== void 0 && primaryDiagnosticsUnsupported) {
        if (unconfirmedServerIds.length > 0) {
          result.unconfirmedServerIds = [...unconfirmedServerIds];
        }
      } else if (collected !== void 0 && coverageGap) {
        result.confirmation = "partial";
        result.unconfirmedServerIds = [...unconfirmedServerIds];
      } else if (collected !== void 0 && !primaryDiagnosticsUnsupported) {
        result.confirmation = "confirmed";
      }
      let binding;
      if (collected !== void 0) {
        binding = syncConfirmed ? (
          // #1095 (P3-b): a tsserver sync-confirmed result is authoritative for
          // the current buffer but not tied to the publish-path fingerprint —
          // surface "unknown" so a stale publish binding can't demote it.
          { boundToCurrentDisk: "unknown" }
        ) : this.mergeBinding(
          filePath,
          // Optional-chain so a client without the getter (test doubles, a
          // partially-mocked client) yields "unknown" rather than throwing —
          // unknown preserves pre-#1095 behavior for that contributor.
          [
            // #1459/#1549: a contributor whose findings the merge DROPPED must
            // not decide the merged verdict either — its binding describes
            // bytes this result no longer contains.
            // #1586: read off the same frozen set the drop used. Filtering the
            // raw deferral set instead excluded the fingerprint of a
            // deferred-but-COVERED scanner whose findings the merge had just
            // kept, which diverges whenever the primary is version-less and
            // that scanner is the only contributor with a fingerprint.
            ...spawned.filter((entry) => !droppedAuxiliaryServerIds.has(entry.info.id)).map((entry) => entry.client.getDiagnosticBinding?.(filePath)),
            ...carriedAuxiliary.map((entry) => entry.binding)
          ]
        );
        result.binding = binding;
      }
      const lateDeliveryPending = unconfirmedServerIds.filter((serverId) => (lateDeliveryServerIds ?? []).includes(serverId));
      if (lateDeliveryPending.length > 0) {
        result.deferredServerIds = lateDeliveryPending;
      }
      if (supersededServerIds.length > 0) {
        result.supersededServerIds = supersededServerIds;
      }
      logLatency({
        type: "phase",
        phase: "lsp_touch_file",
        filePath: normalizedPath,
        durationMs: Date.now() - startedAt,
        metadata: {
          serverCountReady: spawned.length,
          clientScope,
          diagnosticsMode,
          source,
          failureKind: "success",
          collectedDiagnostics: collected?.length,
          // #1095: observability so an unbinding server is diagnosable —
          // "bound" (matches disk) / "mismatch" (diverged) / "unknown"
          // (version-less server or disk unreadable). Absent for non-collecting
          // touches (no merged result to bind).
          ...binding !== void 0 && {
            bindingState: bindingStateLabel(binding.boundToCurrentDisk)
          },
          notifySkipped,
          notifyWriteTimedOut,
          // #743: per-server detail — which servers' writes actually timed out.
          // Absent when none did. `notifyWriteTimedOut` is the file-level "at
          // least one" summary.
          ...notifyWriteTimedOutServerIds.length > 0 && {
            notifyWriteTimedOutServerIds
          },
          // #3481: servers that did not send this touch's content (a later
          // read won, the path was closing or renamed away, or the client
          // was dead, #3543). Absent when none.
          ...supersededServerIds.length > 0 && { supersededServerIds },
          diagnosticsTimedOut,
          inconclusive,
          // #1549: the attribution the issue's observability contract asks for —
          // WHICH primary made the touch inconclusive and which deadline it missed
          // (`notify-write` vs `diagnostics-wait`, or `mixed`). Absent on a
          // conclusive touch, which blames nobody.
          ...verdict.inconclusiveServerIds && {
            inconclusiveServerIds: verdict.inconclusiveServerIds
          },
          ...verdict.inconclusiveReason && {
            inconclusiveReason: verdict.inconclusiveReason
          },
          // #1470: the touch's own honesty verdict, so a `cut_off` row in
          // `lsp_aux_wait_outcome` can be joined to the touch that produced it and
          // shown NOT to have claimed confirmation for that server's coverage.
          // Absent for a non-collecting touch, which claims nothing either way.
          ...result.confirmation !== void 0 && {
            confirmation: result.confirmation
          },
          // R8 (#714): server ids of auxiliaries whose push wait was cut off by
          // the aux grace window (primary settled clean + aux timed out in grace).
          // Absent when no aux was cut off. These servers' diagnostics are
          // advisory-only and will surface on the next edit from their cache.
          ...auxCutOffServerIds !== void 0 && { auxCutOffServerIds },
          // #1493: the full set the confirmation was narrowed on — the cut-off
          // ids plus every auxiliary that stayed silent with nothing published
          // for this content. Absent when the touch speaks for every server.
          // This is the join key for the issue's observability contract: a
          // `silent` row in `lsp_aux_wait_outcome` must appear here, on a touch
          // whose `confirmation` is `"partial"`.
          ...auxUnconfirmedServerIds !== void 0 && {
            auxUnconfirmedServerIds
          },
          // #1459: scanners this touch does not speak for because their breaker
          // was open, or because the resync gate deferred their write. Separate
          // fields because these two doors open BEFORE any wait, so neither can
          // appear in an `lsp_aux_wait_outcome` row on the sweep path. Absent
          // when every configured scanner got this content — #1586 included: a
          // deferred scanner already bound to these bytes is covered, so it is not
          // named here either. The gate's own action is recorded regardless, in
          // `lsp_notify_resync_deferred`.
          ...brokenSkippedServerIds.length > 0 && { brokenSkippedServerIds },
          ...uncoveredDeferredServerIds.length > 0 && {
            deferredResyncServerIds: uncoveredDeferredServerIds
          },
          // #2810: the scanners this touch promised late delivery for, so a
          // field query can join the promise to the pending pair that has to
          // honour it — and tell it apart from `deferredResyncServerIds`
          // above, which is the door that opened BEFORE any wait and has no
          // delivery path at all.
          ...lateDeliveryPending.length > 0 && {
            lateDeliveryServerIds: lateDeliveryPending
          },
          // #1549: auxiliaries whose own deadline lapsed — the wait produced no
          // publication, or the notify write never landed. Distinct from the fields
          // above (a different door) and from `auxUnconfirmedServerIds` (derived
          // from aux wait-outcome rows, which a non-collecting touch never emits).
          ...auxNoAnswerServerIds.length > 0 && { auxNoAnswerServerIds }
        }
      });
      return result;
    } finally {
      for (const lease of leaseKeys)
        this.releaseClientLease(lease.key, lease.server);
    }
  }
  /**
   * #2052: the file's nearest marker root, but ONLY when the file is outside
   * every initialized session cwd. Returns undefined (no decline) otherwise.
   *
   * The cheap registry test runs FIRST so an in-session file — the hot path —
   * pays one bounded map walk and never the `server.root()` filesystem walks.
   */
  async findOutsideProjectRoot(filePath) {
    if (!this.fileIsOutsideRegisteredRoots(filePath))
      return void 0;
    if (this.analysisRootModeForFile(filePath) === "adopted")
      return void 0;
    const candidates = await Promise.all(getServersForFileWithConfig(filePath).map((server) => server.root(filePath)));
    return candidates.find((candidate) => Boolean(candidate));
  }
  /**
   * #2052: one bounded record per normalized foreign root per session.
   *
   * `operation` is a PARAMETER, not a constant: `touchFile` and
   * `getDiagnostics` both decline here, and a record that always claimed
   * "touchFile" would erase which call site actually refused — the
   * discriminating identity a bounded record has to preserve. The ledger's
   * rising edge is keyed on the root, so many files under one foreign root
   * still collapse to a single detailed row.
   */
  recordOutsideRootDecline(filePath, nearestRoot, operation) {
    const root = normalizeMapKey(nearestRoot);
    const sessionRoots = getSessionRootsForTelemetry().map((sessionRoot) => normalizeMapKey(sessionRoot)).join(", ");
    emitBounded("lsp_capability_skip", root, {
      filePath: normalizeMapKey(filePath),
      durationMs: 0,
      metadata: {
        operation,
        nearestMarkerRoot: root,
        sessionRoots,
        identity: root
      }
    }, {
      ledgerKind: "lsp-capability-skip",
      risingEdgePer: "identity",
      reason: `declined LSP root outside session cwd: ${root}`
    });
  }
  /**
   * Get diagnostics for a file
   */
  getDiagnosticsHealth(filePath) {
    return this.lastDiagnosticsHealth.get(normalizeMapKey(filePath));
  }
  /**
   * Return whatever LSP diagnostics were last cached for this file without
   * triggering a fresh open / wait / merge. Returns `undefined` when nothing
   * was ever cached; callers should treat that as distinct from "cached but
   * empty" (`[]`), which means LSP confirmed no diagnostics last time.
   *
   * Intended for hot-path consumers (e.g. actionable-warnings at turn_end)
   * that already paid for a `touchFile` during dispatch and just want to
   * read the result without a second LSP round trip.
   *
   * Pass `expectedContentHash` (sha256 of the current file bytes) to guard
   * against staleness: the entry is returned only when it was primed by a
   * `touchFile` for the *same* content. On mismatch — or for an entry written
   * without content (the service-level merge) — this returns `undefined` so the
   * caller does a fresh check instead of serving a previous turn's diagnostics.
   * Omit it for display consumers (the widget) that accept last-known.
   */
  getLastKnownDiagnostics(filePath, expectedContentHash) {
    const normalizedKey = normalizeMapKey(filePath);
    if (expectedContentHash !== void 0) {
      const knownHash = this.lastKnownContentHash.get(normalizedKey);
      if (knownHash === void 0 || knownHash !== expectedContentHash) {
        return void 0;
      }
    }
    return this.lastKnownDiagnostics.get(normalizedKey);
  }
  async getDiagnostics(filePath, diagnosticsMode = "full") {
    const normalizedPath = normalizeMapKey(filePath);
    const outsideRoot = await this.findOutsideProjectRoot(filePath);
    if (outsideRoot) {
      this.recordOutsideRootDecline(filePath, outsideRoot, "getDiagnostics");
      return [];
    }
    if (this.checkDestroyed()) {
      this.lastDiagnosticsHealth.set(normalizedPath, {
        health: "destroyed",
        failureKind: "destroyed",
        serverCountAttempted: 0,
        serverCountReady: 0,
        candidateServerIds: getServersForFileWithConfig(filePath).map((s) => s.id),
        mergedCount: 0,
        dedupDroppedCount: 0,
        checkedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      return [];
    }
    const startedAt = Date.now();
    const candidateServerIds = getServersForFileWithConfig(filePath).map((s) => s.id);
    const { clients: spawned, serverCountAttempted } = await this.getClientsForFile(filePath);
    if (spawned.length === 0) {
      const stale = this.lastKnownDiagnostics.get(normalizedPath);
      const failureKind2 = stale?.length ? "no_clients_stale" : "no_clients";
      this.lastDiagnosticsHealth.set(normalizedPath, {
        health: failureKind2,
        failureKind: failureKind2,
        serverCountAttempted,
        serverCountReady: 0,
        candidateServerIds,
        mergedCount: stale?.length ?? 0,
        dedupDroppedCount: 0,
        checkedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      logLatency({
        type: "phase",
        phase: "lsp_diagnostics_aggregate",
        filePath: normalizedPath,
        durationMs: Date.now() - startedAt,
        metadata: {
          serverCountAttempted,
          serverCountReady: 0,
          mergedCount: stale?.length ?? 0,
          dedupDroppedCount: 0,
          failureKind: failureKind2,
          health: failureKind2,
          servers: []
        }
      });
      return stale ?? [];
    }
    const clientWaits = spawned.map(async (entry) => {
      const waitStart = Date.now();
      const launchVariant = entry.client.getLaunchVariant?.();
      const strategy = getStrategy(entry.info.id, launchVariant);
      await entry.client.waitForDiagnostics(filePath, strategy.aggregateWaitMs);
      let diagnostics = entry.client.getDiagnostics(filePath);
      const firstWaitMs = Date.now() - waitStart;
      if (strategy.expectSemanticSecondPush && diagnostics.length === 0 && firstWaitMs < DIAGNOSTICS_SEMANTIC_SETTLE_THRESHOLD_MS) {
        await entry.client.waitForDiagnostics(filePath, DIAGNOSTICS_SEMANTIC_SETTLE_WAIT_MS);
        diagnostics = entry.client.getDiagnostics(filePath);
      }
      return {
        serverId: entry.info.id,
        launchVariant,
        waitMs: Date.now() - waitStart,
        diagnosticCount: diagnostics.length,
        diagnostics
      };
    });
    const graceMs = diagnosticsMode === "document" ? 0 : EARLY_UNBLOCK_GRACE_MS;
    const diagDescriptors = spawned.map((entry) => {
      if (!isAuxiliary(entry.info))
        return { role: entry.info.role };
      const strategy = getStrategy(entry.info.id, entry.client.getLaunchVariant?.());
      return { role: entry.info.role, budgetMs: strategy.aggregateWaitMs };
    });
    const perServer = await raceToCompletion(clientWaits, (results) => results.some((r) => r.diagnosticCount > 0 || getStrategy(r.serverId, r.launchVariant).seedFirstPush), {
      timeoutMs: Math.max(...spawned.map((entry) => getStrategy(entry.info.id, entry.client.getLaunchVariant?.()).aggregateWaitMs)),
      graceMs,
      descriptors: diagDescriptors,
      // #1458 S2: ceiling, not a flat wait — each auxiliary's own
      // budgetMs (above) determines the actual per-touch grace up to
      // this cap. Matches touchFile's ceiling, and names the shared
      // constant instead of repeating its value (#1488).
      auxGraceMs: readEnvAuxGraceMs() ?? DEFAULT_AUX_GRACE_CEILING_MS
    });
    const earlyUnblockedCount = spawned.length - perServer.length;
    const perServerFull = spawned.map((entry) => {
      const found = perServer.find((r) => r.serverId === entry.info.id);
      return found ?? {
        serverId: entry.info.id,
        launchVariant: entry.client.getLaunchVariant?.(),
        waitMs: getStrategy(entry.info.id, entry.client.getLaunchVariant?.()).aggregateWaitMs,
        diagnosticCount: 0,
        diagnostics: []
      };
    });
    const merged = [];
    const seen = /* @__PURE__ */ new Set();
    for (const entry of perServerFull) {
      for (const diagnostic of entry.diagnostics) {
        const key = [
          diagnostic.range.start.line,
          diagnostic.range.start.character,
          diagnostic.message
        ].join(":");
        if (seen.has(key))
          continue;
        seen.add(key);
        merged.push({ ...diagnostic, serverId: entry.serverId });
      }
    }
    const rawCount = perServerFull.reduce((sum, entry) => sum + entry.diagnosticCount, 0);
    const serversWithDiagnostics = perServerFull.filter((entry) => entry.diagnosticCount > 0).length;
    const failureKind = merged.length === 0 ? "ok_empty" : "success";
    this.lastDiagnosticsHealth.set(normalizedPath, {
      health: failureKind === "success" ? "ok" : "ok_empty",
      failureKind,
      serverCountAttempted,
      serverCountReady: perServerFull.length,
      candidateServerIds,
      mergedCount: merged.length,
      dedupDroppedCount: rawCount - merged.length,
      checkedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    logLatency({
      type: "phase",
      phase: "lsp_diagnostics_aggregate",
      filePath: normalizedPath,
      durationMs: Date.now() - startedAt,
      metadata: {
        serverCountAttempted,
        serverCountReady: perServerFull.length,
        serverCountWithDiagnostics: serversWithDiagnostics,
        mergedCount: merged.length,
        dedupDroppedCount: rawCount - merged.length,
        earlyUnblockedCount,
        diagnosticsMode,
        failureKind,
        health: failureKind === "success" ? "ok" : "ok_empty",
        servers: perServerFull.map((entry) => ({
          id: entry.serverId,
          waitMs: entry.waitMs,
          diagnosticCount: entry.diagnosticCount
        }))
      }
    });
    if (merged.length > 0) {
      this.lastKnownDiagnostics.set(normalizedPath, merged);
    } else {
      this.lastKnownDiagnostics.delete(normalizedPath);
    }
    this.lastKnownContentHash.delete(normalizedPath);
    return merged;
  }
  /**
   * Delegates to {@link hashDiagnosticContent} rather than re-hashing here. Every
   * comparison this hash takes part in (`publishedThisContent`, the carried-aux
   * check, the last-known content guard) is against a hash the client produced
   * with that function, so the two implementations must agree byte for byte —
   * a duplicate is a silent divergence waiting for one of them to be tuned.
   */
  hashContent(content) {
    return hashDiagnosticContent(content);
  }
  /**
   * #1095: compose the content `binding` for a merged diagnostics result across
   * the clients that contributed to it (primary + any auxiliaries). Verifies
   * each contributor's stored binding against current disk lazily (memoized per
   * file+mtime by {@link diskBindingCache}) and composes per
   * {@link composeBoundToCurrentDisk}: ANY contributor mismatches disk → false;
   * else all "unknown" (or no contributors) → "unknown"; else true. The
   * surfaced version/contentHash come from the first contributor that carries
   * them — informational only; the load-bearing field is `boundToCurrentDisk`.
   * #1104: `version` and `contentHash` are tracked INDEPENDENTLY (not gated on
   * the same contributor carrying both) — a pull-sourced binding deliberately
   * has no `version` (the pull protocol has no version-echo concept) but does
   * carry a real `contentHash`; gating the latter on the former would silently
   * drop it here even though `boundToCurrentDisk` above already used it.
   */
  mergeBinding(filePath, stored) {
    const verdicts = [];
    let version;
    let contentHash2;
    for (const entry of stored) {
      verdicts.push(this.diskBindingCache.boundToCurrentDisk(filePath, entry ?? {}));
      if (version === void 0 && entry?.version !== void 0) {
        version = entry.version;
      }
      if (contentHash2 === void 0 && entry?.contentHash !== void 0) {
        contentHash2 = entry.contentHash;
      }
    }
    return {
      version,
      contentHash: contentHash2,
      boundToCurrentDisk: composeBoundToCurrentDisk(verdicts)
    };
  }
  /**
   * Navigation: go to definition
   */
  async definition(filePath, line, character) {
    const spawned = await this.getClientForFile(filePath, NAV_CLIENT_WAIT_TIMEOUT_MS);
    if (!spawned)
      return [];
    if (!spawned.client.getOperationSupport().definition) {
      throw new Error("__UNSUPPORTED__ Active LSP server does not advertise support for definition");
    }
    return spawned.client.definition(filePath, line, character);
  }
  /**
   * Navigation: go to the type definition of the symbol at a position
   */
  async typeDefinition(filePath, line, character) {
    const spawned = await this.getClientForFile(filePath, NAV_CLIENT_WAIT_TIMEOUT_MS);
    if (!spawned)
      return [];
    if (!spawned.client.getOperationSupport().typeDefinition) {
      throw new Error("__UNSUPPORTED__ Active LSP server does not advertise support for typeDefinition");
    }
    return spawned.client.typeDefinition(filePath, line, character);
  }
  /**
   * Navigation: go to the declaration of the symbol at a position
   */
  async declaration(filePath, line, character) {
    const spawned = await this.getClientForFile(filePath, NAV_CLIENT_WAIT_TIMEOUT_MS);
    if (!spawned)
      return [];
    if (!spawned.client.getOperationSupport().declaration) {
      throw new Error("__UNSUPPORTED__ Active LSP server does not advertise support for declaration");
    }
    return spawned.client.declaration(filePath, line, character);
  }
  /**
   * Navigation: find all references
   */
  async references(filePath, line, character, includeDeclaration = true) {
    const spawned = await this.getClientForFile(filePath, NAV_CLIENT_WAIT_TIMEOUT_MS);
    if (!spawned)
      return [];
    if (!spawned.client.getOperationSupport().references) {
      throw new Error("__UNSUPPORTED__ Active LSP server does not advertise support for references");
    }
    return spawned.client.references(filePath, line, character, includeDeclaration);
  }
  /**
   * Navigation: hover info
   */
  async hover(filePath, line, character) {
    const spawned = await this.getClientForFile(filePath, NAV_CLIENT_WAIT_TIMEOUT_MS);
    if (!spawned)
      return null;
    if (!spawned.client.getOperationSupport().hover) {
      throw new Error("__UNSUPPORTED__ Active LSP server does not advertise support for hover");
    }
    return spawned.client.hover(filePath, line, character);
  }
  /**
   * Navigation: signature help at cursor position
   */
  async signatureHelp(filePath, line, character) {
    const spawned = await this.getClientForFile(filePath, NAV_CLIENT_WAIT_TIMEOUT_MS);
    if (!spawned)
      return null;
    if (!spawned.client.getOperationSupport().signatureHelp) {
      throw new Error("__UNSUPPORTED__ Active LSP server does not advertise support for signatureHelp");
    }
    return spawned.client.signatureHelp(filePath, line, character);
  }
  /**
   * Navigation: symbols in document
   */
  async documentSymbol(filePath) {
    const spawned = await this.getClientForFile(filePath, NAV_CLIENT_WAIT_TIMEOUT_MS);
    if (!spawned)
      return [];
    if (!spawned.client.getOperationSupport().documentSymbol) {
      throw new Error("__UNSUPPORTED__ Active LSP server does not advertise support for documentSymbol");
    }
    return spawned.client.documentSymbol(filePath);
  }
  /**
   * Resolves "the target client" for a workspace-scope query that has no
   * filePath to route through `getClientForFile`. `state.clients` is keyed
   * `${serverId}:${root}` in spawn order, not role order, so an auxiliary
   * scanner (ast-grep, opengrep, zizmor, ...) that happens to spawn first in
   * a polyglot workspace used to win every no-filePath query outright (#1812
   * — a supporting primary server spawned later never got a look-in). Scans
   * for the first LIVE client matching `predicate` (when given), preferring
   * any primary (non-auxiliary) match over an auxiliary one — the same
   * primary-over-auxiliary preference `getClientForFile` encodes via its
   * `!isAuxiliary` filter (this file, `getClientForFile`) and
   * `getAliveServerIds` groups by. `isAlive()` is required for BOTH the
   * preferred and fallback candidate — mirrors `getCapabilitySnapshots`'s
   * own no-filePath branch (this file, ~line 5868), whose liveness filter
   * this helper otherwise duplicates; without it a dead primary would win
   * over a live, answering auxiliary. Role is read from the map key's
   * `serverId` prefix through `getServerById` against `LSP_SERVERS`, the
   * same single source of truth `getCapabilitySnapshots` already parses that
   * key from — never a second, hand-rolled role table. A `serverId` prefix
   * absent from `LSP_SERVERS` (should not happen in practice — every spawned
   * client's key is built from a known server's `id`) resolves to no server,
   * which `isAuxiliary` reads as `DEFAULT_LSP_SERVER_ROLE` and so falls
   * through to the primary branch: unknown treated as primary, never
   * silently dropped. Returns undefined only when NO live client
   * (primary or auxiliary) matches.
   */
  selectWorkspaceScopeClient(predicate) {
    let auxFallback;
    for (const [key, client] of this.state.clients) {
      if (!client.isAlive())
        continue;
      if (predicate && !predicate(client))
        continue;
      const separator = key.indexOf(":");
      const serverId = separator >= 0 ? key.slice(0, separator) : key;
      if (isAuxiliary(getServerById(serverId))) {
        if (!auxFallback)
          auxFallback = { client, serverId };
        continue;
      }
      return { client, serverId };
    }
    return auxFallback;
  }
  /**
   * Navigation: workspace-wide symbol search
   *
   * #1789: gated on the target server's advertised `workspaceSymbolProvider`
   * (the same `getOperationSupport().workspaceSymbol` single source of truth
   * `lsp-document-symbols.ts`'s documentSymbol gate reads — see clients/
   * lsp-document-symbols.ts:50).
   *
   * #1812: without a path, the no-filePath branch used to stop at
   * `state.clients`' first entry by insertion order regardless of whether it
   * supported `workspace/symbol` — an auxiliary spawned first silently ate
   * every query with `[]` and zero requests, even when a supporting primary
   * server was already spawned too. `selectWorkspaceScopeClient` now scans
   * for the first client that DOES support it, preferring a primary over an
   * auxiliary; only when none of the spawned clients support it does this
   * fall back to `[]`.
   */
  async workspaceSymbol(query, filePath, attribution) {
    if (filePath) {
      const spawned = await this.getClientForFile(filePath, NAV_CLIENT_WAIT_TIMEOUT_MS);
      if (!spawned)
        return [];
      if (!spawned.client.getOperationSupport().workspaceSymbol)
        return [];
      return spawned.client.workspaceSymbol(query);
    }
    const target = this.selectWorkspaceScopeClient((client) => client.getOperationSupport().workspaceSymbol);
    if (!target)
      return [];
    if (attribution)
      attribution.workspaceSymbol = target.serverId;
    return target.client.workspaceSymbol(query);
  }
  /**
   * Commands advertised for workspace/executeCommand. If filePath is given,
   * the server for that file; otherwise the first active client, preferring
   * a primary over an auxiliary scanner spawned first (#1812 sweep — see
   * `selectWorkspaceScopeClient`).
   */
  async getAdvertisedCommands(filePath, attribution) {
    if (filePath) {
      const spawned = await this.getClientForFile(filePath, NAV_CLIENT_WAIT_TIMEOUT_MS);
      if (!spawned)
        return [];
      return spawned.client.getAdvertisedCommands();
    }
    const first = this.selectWorkspaceScopeClient();
    if (!first)
      return [];
    if (attribution)
      attribution.getAdvertisedCommands = first.serverId;
    return first.client.getAdvertisedCommands();
  }
  /**
   * Run a server command via workspace/executeCommand (hardened: allowlisted by
   * advertisement in the client). If filePath is given, target that file's
   * server; otherwise the first active client, preferring a primary over an
   * auxiliary scanner spawned first (#1812 sweep — see
   * `selectWorkspaceScopeClient`).
   */
  async executeCommand(filePath, command, args, mutationContext, attribution) {
    if (filePath) {
      const spawned = await this.getClientForFile(filePath, NAV_CLIENT_WAIT_TIMEOUT_MS);
      if (!spawned) {
        return { executed: false, reason: "no LSP server for file" };
      }
      return spawned.client.executeCommand(command, args, mutationContext);
    }
    const first = this.selectWorkspaceScopeClient();
    if (!first)
      return { executed: false, reason: "no active LSP server" };
    if (attribution)
      attribution.executeCommand = first.serverId;
    return first.client.executeCommand(command, args, mutationContext);
  }
  /**
   * #1640: run a read-only probe command against a server that is ALREADY
   * running for this file. Two hard guarantees the mutation-channel
   * `executeCommand` above cannot give a render-path probe:
   *
   * - **Never spawns.** It resolves the already-connected client map the way
   *   other read-only client-map lookups do, instead of routing through
   *   `getClientForFile` → `ensureClientForServer`. A probe that spawns a
   *   language-server fleet to answer a question about how to RENDER a
   *   diagnostic is a cost the caller never asked for — and under warm attach
   *   the freshly spawned server's answer would not even be the warm session's
   *   answer.
   * - **Never opens the mutation window.** `executeReadOnlyCommand` leaves
   *   `serverEditsAllowed` and `activeMutationContext` alone, so an in-flight
   *   real command's mutation context survives a concurrent probe.
   *
   * Returns `{executed:false}` — never a thrown error and never a spawn — when
   * no live client owns the file. Callers must read that as UNKNOWN.
   */
  async executeReadOnlyCommandOnLiveClient(filePath, command, args) {
    if (this.checkDestroyed()) {
      return { executed: false, reason: "lsp service destroyed" };
    }
    for (const server of getServersForFileWithConfig(filePath)) {
      const root = await this.resolveServerRoot(server, filePath);
      if (!root)
        continue;
      const entry = this.state.clients.get(`${server.id}:${normalizeMapKey(root)}`);
      if (!entry?.isAlive())
        continue;
      const run = entry.executeReadOnlyCommand;
      if (typeof run !== "function")
        continue;
      return run.call(entry, command, args);
    }
    return { executed: false, reason: "no live LSP server for file" };
  }
  /**
   * Capability snapshot for LSP operations.
   * If filePath is provided, probes that server. Without a filePath the
   * snapshot describes the whole workspace, so each capability is ORed
   * across every client `selectWorkspaceScopeClient` would consider.
   *
   * #1846: the no-filePath branch used to report ONE client's capabilities,
   * whichever `selectWorkspaceScopeClient()` returned with no predicate. In
   * a multi-primary workspace (say `json` spawned before `typescript`), a
   * first client that does not advertise `workspaceSymbolProvider` reported
   * the operation unsupported even though a later client advertises it. The
   * tool layer then refused the call before `workspaceSymbol()` — which
   * #1812 taught to find the supporting client — was ever reached
   * (tools/lsp-navigation.ts, the `runWorkspaceSymbolOperation` gate).
   *
   * Each capability resolves through `selectWorkspaceScopeClient` with a
   * per-capability predicate, so this answer is built from the SAME liveness
   * and primary-over-auxiliary rules that route the operation itself (see
   * `selectWorkspaceScopeClient`, this file). A dead client therefore cannot
   * contribute a capability nobody can execute. Capabilities the base client
   * already reports true are skipped, so the extra scans only run for the
   * capabilities it lacks.
   */
  async getOperationSupport(filePath, attribution) {
    if (filePath) {
      const spawned = await this.getClientForFile(filePath);
      if (!spawned)
        return null;
      const getter = spawned.client.getOperationSupport;
      if (typeof getter !== "function")
        return null;
      return getter();
    }
    const readable = (client) => typeof client.getOperationSupport === "function";
    const first = this.selectWorkspaceScopeClient(readable);
    if (!first)
      return null;
    const aggregate = { ...first.client.getOperationSupport() };
    const contributors = {};
    for (const capability of Object.keys(aggregate)) {
      if (aggregate[capability]) {
        contributors[capability] = first.serverId;
        continue;
      }
      const supporter = this.selectWorkspaceScopeClient((client) => readable(client) && Boolean(client.getOperationSupport()[capability]));
      if (supporter) {
        aggregate[capability] = true;
        contributors[capability] = supporter.serverId;
      }
    }
    if (attribution) {
      attribution.getOperationSupport = {
        baseClientId: first.serverId,
        contributors
      };
    }
    return aggregate;
  }
  /**
   * Capability snapshot for workspace diagnostics support.
   * If filePath is provided, probes that server; otherwise uses first active client.
   */
  async getCapabilitySnapshots(filePath, attribution) {
    if (this.checkDestroyed())
      return [];
    const snapshots = [];
    if (filePath) {
      const servers = getServersForFileWithConfig(filePath);
      for (const server of servers) {
        const root = await this.resolveServerRoot(server, filePath);
        if (!root)
          continue;
        const client = this.state.clients.get(`${server.id}:${normalizeMapKey(root)}`);
        if (!client?.isAlive())
          continue;
        snapshots.push({
          serverId: server.id,
          root,
          operationSupport: client.getOperationSupport(),
          workspaceDiagnosticsSupport: client.getWorkspaceDiagnosticsSupport(),
          customServer: server.custom,
          diagnosticsPublished: this.state.diagnosticsPublished.has(server.id),
          diagnosticsUnsupported: this.state.diagnosticsUnsupported.has(server.id),
          advertisedCommands: client.getAdvertisedCommands(),
          rawCapabilityKeys: client.getRawCapabilityKeys?.() ?? [],
          textDocumentSave: textDocumentSaveOf(client),
          launchVariant: client.getLaunchVariant?.()
        });
      }
      return snapshots;
    }
    for (const [key, client] of this.state.clients) {
      if (!client.isAlive())
        continue;
      const separator = key.indexOf(":");
      const serverId = separator >= 0 ? key.slice(0, separator) : key;
      snapshots.push({
        serverId,
        root: client.root,
        operationSupport: client.getOperationSupport(),
        workspaceDiagnosticsSupport: client.getWorkspaceDiagnosticsSupport(),
        customServer: this.state.servers.get(serverId)?.custom,
        diagnosticsPublished: this.state.diagnosticsPublished.has(serverId),
        diagnosticsUnsupported: this.state.diagnosticsUnsupported.has(serverId),
        advertisedCommands: client.getAdvertisedCommands(),
        rawCapabilityKeys: client.getRawCapabilityKeys?.() ?? [],
        textDocumentSave: textDocumentSaveOf(client),
        launchVariant: client.getLaunchVariant?.()
      });
    }
    if (attribution) {
      attribution.getCapabilitySnapshots = {
        clientIds: snapshots.slice(0, WORKSPACE_ATTRIBUTION_CLIENT_CAP).map((snapshot) => snapshot.serverId),
        clientCount: snapshots.length
      };
    }
    return snapshots;
  }
  async getWorkspaceDiagnosticsSupport(filePath, attribution) {
    if (filePath) {
      const spawned = await this.getClientForFile(filePath);
      if (!spawned)
        return null;
      const getter2 = spawned.client.getWorkspaceDiagnosticsSupport;
      if (typeof getter2 !== "function")
        return null;
      return getter2();
    }
    const first = this.selectWorkspaceScopeClient();
    if (!first)
      return null;
    const getter = first.client.getWorkspaceDiagnosticsSupport;
    if (typeof getter !== "function")
      return null;
    if (attribution)
      attribution.getWorkspaceDiagnosticsSupport = first.serverId;
    return getter.call(first.client);
  }
  /**
   * Navigation: available code actions at position/range
   */
  async codeAction(filePath, line, character, endLine, endCharacter) {
    const spawned = await this.getClientForFile(filePath, NAV_CLIENT_WAIT_TIMEOUT_MS);
    if (!spawned)
      return [];
    if (!spawned.client.getOperationSupport().codeAction) {
      throw new Error("__UNSUPPORTED__ Active LSP server does not advertise support for codeAction");
    }
    return spawned.client.codeAction(filePath, line, character, endLine, endCharacter);
  }
  /**
   * Navigation: rename symbol at position
   */
  async rename(filePath, line, character, newName) {
    const spawned = await this.getClientForFile(filePath, NAV_CLIENT_WAIT_TIMEOUT_MS);
    if (!spawned)
      return null;
    if (!spawned.client.getOperationSupport().rename) {
      throw new Error("__UNSUPPORTED__ Active LSP server does not advertise support for rename");
    }
    return spawned.client.rename(filePath, line, character, newName);
  }
  async renameFile(oldFilePath, newFilePath, options) {
    const cwd = options.cwd;
    const apply = options.apply ?? false;
    await validateWorkspaceEdit({
      documentChanges: [
        {
          kind: "rename",
          oldUri: pathToFileURL3(oldFilePath).href,
          newUri: pathToFileURL3(newFilePath).href
        }
      ]
    }, cwd);
    const priorityServerIds = getServersForFileWithConfig(oldFilePath).map((server) => server.id);
    const activeClients = this.activeClientsForCwd(cwd, priorityServerIds);
    const willRenameFailures = [];
    const didRenameFailures = [];
    const willRenameClients = activeClients.filter(({ serverId, client }) => {
      if (client.getOperationSupport().willRenameFiles === true)
        return true;
      recordDegradationOnce({
        kind: "lsp-capability-skip",
        subject: `${serverId}:workspace/willRenameFiles`,
        reason: client.getMalformedFileOperationRegistrations().has("willRename") ? "malformed-registration" : "no-registration"
      });
      return false;
    });
    const willResults = await Promise.all(willRenameClients.map(async ({ serverId, client }) => {
      try {
        return {
          serverId,
          edit: await client.willRenameFiles(oldFilePath, newFilePath)
        };
      } catch (err) {
        willRenameFailures.push({
          serverId,
          error: err instanceof Error ? err.message : String(err)
        });
        return { serverId, edit: null };
      }
    }));
    const successfulWillResults = willResults.filter((result) => !willRenameFailures.some((failure) => failure.serverId === result.serverId));
    if (willRenameClients.length > 0 && successfulWillResults.length === 0) {
      throw new Error(`workspace/willRenameFiles failed for all active LSP servers: ${willRenameFailures.map((failure) => `${failure.serverId}: ${failure.error}`).join("; ")}`);
    }
    const merged = mergeWorkspaceTextEditsByPriority(successfulWillResults);
    const summary = summarizeWorkspaceEdit(merged.edit, cwd);
    if (!apply) {
      return {
        applied: false,
        serverIds: activeClients.map((entry) => entry.serverId),
        willRenameFailures,
        didRenameFailures,
        droppedConflicts: merged.droppedConflicts,
        inputEditCount: merged.inputEditCount,
        summary
      };
    }
    let applied;
    try {
      applied = await applyWorkspaceEdit(merged.edit, cwd, {
        mutationContext: options.mutationContext,
        observe: false
      });
    } catch (err) {
      if (options.mutationContext) {
        const partial = err.appliedWorkspaceEdit;
        if (partial) {
          recordLspMutation(options.mutationContext, {
            results: [partial],
            status: "failed"
          });
        }
      }
      throw err;
    }
    const openDocuments = activeClients.filter(({ client }) => client.isDocumentOpen(oldFilePath)).map(({ serverId, client }) => ({
      serverId,
      client,
      oldUri: client.getDocumentUri(oldFilePath)
    }));
    const closeFailures = [];
    await Promise.all(activeClients.map(async ({ serverId, client }) => {
      const result = await runRenameNotify(() => client.closeDocument(oldFilePath), RENAME_NOTIFY_TIMEOUT_MS);
      if (!result.ok) {
        closeFailures.push({
          serverId,
          error: result.error,
          disposition: result.disposition
        });
      }
    }));
    if (closeFailures.length > 0) {
      if (options.mutationContext) {
        recordLspMutation(options.mutationContext, {
          results: [applied],
          status: "failed"
        });
      }
      const content = await fs13.readFile(oldFilePath, "utf-8");
      const languageId = getLanguageId2(oldFilePath) ?? "plaintext";
      const resyncFailures = [];
      await Promise.all(openDocuments.map(async ({ serverId, client }) => {
        const resyncResult = await runRenameNotify(() => client.notify.open(oldFilePath, content, languageId, true, true).then((sent) => {
          if (sent === false) {
            throw new Error(client.isAlive() ? "re-open not sent: the close is still queued" : "re-open not sent: the client is dead");
          }
        }), RENAME_NOTIFY_TIMEOUT_MS);
        if (!resyncResult.ok) {
          resyncFailures.push({
            serverId,
            error: resyncResult.error,
            disposition: resyncResult.disposition
          });
        }
      }));
      if (resyncFailures.length > 0) {
        logLatency({
          type: "phase",
          phase: "lsp_rename_resync_failed",
          filePath: oldFilePath,
          durationMs: 0,
          metadata: {
            failures: resyncFailures.map((failure) => ({
              serverId: failure.serverId,
              disposition: failure.disposition,
              error: failure.error
            }))
          }
        });
      }
      const closeFailureSummary = closeFailures.map((failure) => `${failure.serverId} (${failure.disposition}): ${failure.error}`).join("; ");
      const resyncFailureSummary = resyncFailures.length > 0 ? ` (resync also failed: ${resyncFailures.map((failure) => `${failure.serverId} (${failure.disposition}): ${failure.error}`).join("; ")})` : "";
      throw new Error(`workspace/didClose failed; rename aborted: ${closeFailureSummary}${resyncFailureSummary}`);
    }
    let renameApplied;
    try {
      renameApplied = await applyWorkspaceEdit({
        documentChanges: [
          {
            kind: "rename",
            oldUri: pathToFileURL3(oldFilePath).href,
            newUri: pathToFileURL3(newFilePath).href
          }
        ]
      }, cwd, { observe: false });
    } catch (err) {
      if (options.mutationContext) {
        recordLspMutation(options.mutationContext, {
          results: [applied],
          status: "failed"
        });
      }
      throw err;
    }
    const relOld = path16.relative(cwd, oldFilePath).replace(/\\/g, "/") || path16.basename(oldFilePath);
    const relNew = path16.relative(cwd, newFilePath).replace(/\\/g, "/") || path16.basename(newFilePath);
    const renameDescription = `Renamed ${relOld} \u2192 ${relNew}`;
    await Promise.all(activeClients.map(async ({ serverId, client }) => {
      if (client.getOperationSupport().didRenameFiles !== true) {
        recordDegradationOnce({
          kind: "lsp-capability-skip",
          subject: `${serverId}:workspace/didRenameFiles`,
          reason: client.getMalformedFileOperationRegistrations().has("didRename") ? "malformed-registration" : "no-registration"
        });
        return;
      }
      const opened = openDocuments.find((entry) => entry.serverId === serverId);
      const result = await runRenameNotify(() => opened?.oldUri ? client.didRenameFiles(oldFilePath, newFilePath, opened.oldUri, destinationUriPreservingSpelling(opened.oldUri, oldFilePath, newFilePath)) : client.didRenameFiles(oldFilePath, newFilePath), RENAME_NOTIFY_TIMEOUT_MS);
      if (!result.ok) {
        didRenameFailures.push({
          serverId,
          error: result.error,
          disposition: result.disposition
        });
      }
    }));
    const files2 = [.../* @__PURE__ */ new Set([...applied.files, oldFilePath, newFilePath])];
    if (options.mutationContext) {
      recordLspMutation(options.mutationContext, {
        results: [
          {
            ...applied,
            files: files2,
            operationTotal: applied.operationTotal + renameApplied.operationTotal,
            appliedOperationTotal: applied.appliedOperationTotal + renameApplied.appliedOperationTotal,
            appliedOperationIndexes: [
              ...applied.appliedOperationIndexes,
              ...renameApplied.appliedOperationIndexes.map((index) => applied.operationTotal + index)
            ],
            operationCounts: {
              textEdits: applied.operationCounts.textEdits + renameApplied.operationCounts.textEdits,
              create: applied.operationCounts.create + renameApplied.operationCounts.create,
              rename: applied.operationCounts.rename + renameApplied.operationCounts.rename,
              delete: applied.operationCounts.delete + renameApplied.operationCounts.delete
            },
            fileDetails: [...applied.fileDetails, ...renameApplied.fileDetails]
          }
        ],
        status: "success"
      });
    }
    return {
      applied: true,
      serverIds: activeClients.map((entry) => entry.serverId),
      willRenameFailures,
      didRenameFailures,
      droppedConflicts: merged.droppedConflicts,
      inputEditCount: merged.inputEditCount,
      summary,
      descriptions: [...applied.descriptions, renameDescription],
      files: files2
    };
  }
  /**
   * Navigation: go to implementation
   */
  async implementation(filePath, line, character) {
    const spawned = await this.getClientForFile(filePath, NAV_CLIENT_WAIT_TIMEOUT_MS);
    if (!spawned)
      return [];
    if (!spawned.client.getOperationSupport().implementation) {
      throw new Error("__UNSUPPORTED__ Active LSP server does not advertise support for implementation");
    }
    return spawned.client.implementation(filePath, line, character);
  }
  /**
   * Navigation: prepare call hierarchy at position
   */
  async prepareCallHierarchy(filePath, line, character) {
    const spawned = await this.getClientForFile(filePath, NAV_CLIENT_WAIT_TIMEOUT_MS);
    if (!spawned)
      return [];
    if (!spawned.client.getOperationSupport().callHierarchy) {
      throw new Error("__UNSUPPORTED__ Active LSP server does not advertise support for prepareCallHierarchy");
    }
    return spawned.client.prepareCallHierarchy(filePath, line, character);
  }
  /**
   * Navigation: find incoming calls (callers)
   *
   * #1803: gated on the target server's advertised `callHierarchyProvider`
   * (the same `getOperationSupport().callHierarchy` single source of truth
   * populated by `detectOperationSupport` in clients/lsp/client.ts — see
   * client.ts:5253). Mirrors the #1789 gate on `workspaceSymbol` above.
   */
  async incomingCalls(item) {
    const spawned = await this.getClientForFile(uriToPath(item.uri), NAV_CLIENT_WAIT_TIMEOUT_MS);
    if (!spawned)
      return [];
    if (!spawned.client.getOperationSupport().callHierarchy)
      return [];
    return spawned.client.incomingCalls(item);
  }
  /**
   * Navigation: find outgoing calls (callees)
   *
   * #1803: same gate as `incomingCalls` above.
   */
  async outgoingCalls(item) {
    const spawned = await this.getClientForFile(uriToPath(item.uri), NAV_CLIENT_WAIT_TIMEOUT_MS);
    if (!spawned)
      return [];
    if (!spawned.client.getOperationSupport().callHierarchy)
      return [];
    return spawned.client.outgoingCalls(item);
  }
  /**
   * #667: shared warm-check/ensure-warm step for BOTH `lsp_diagnostics`
   * (`tools/lsp-diagnostics.ts`'s batch/directory sweep) and
   * `lens_diagnostics mode=full` (`runWorkspaceDiagnostics` below) — one
   * implementation instead of two hand-copied ones, since both already
   * share `groupFilesByPrimaryServer`/`runPerServerGroups` (#631).
   *
   * Root cause this closes (#667): `serverCountReady:1` only proves the
   * server process spawned and passed the LSP `initialize` handshake — it
   * does NOT prove the server can usefully answer a diagnostics request
   * yet. tsserver-style servers can still be loading/indexing the project
   * internally for seconds after `initialize` resolves, and without this
   * check whichever file(s) land first in a sweep pay that cost as
   * individual per-file timeouts (observed: the first 5 files of a
   * 100-file sweep all hit the exact per-file ceiling with
   * `serverCountReady:1`, file 6 onward clean and fast).
   *
   * `representativeFile` should be one file from the group/batch about to
   * be swept — used only to resolve which server(s) serve it and, if
   * needed, to perform the warm-up touch itself.
   *
   * Cheap/no-op when every non-auxiliary server for `representativeFile`
   * has already answered a confirmed diagnostics touch earlier in THIS
   * session (`isDemonstratedReady` — set by `touchFile` above): resolves
   * the server list and root(s) (no spawn, no I/O beyond that) and
   * returns immediately. Only when at least one candidate server hasn't
   * demonstrated readiness does this perform one deliberate warm-up
   * `touchFile` round trip against `representativeFile`, bounded by its
   * OWN generous budget (`warmupTimeoutMs`/`PI_LENS_LSP_WARMUP_TIMEOUT_MS`
   * — distinct from the per-file sweep budget), and waits for it to
   * settle (success, timeout, or abort) before returning. This does NOT
   * change the per-file wait budgets or confirmed/unconfirmed contract
   * (#242/#611/#634) the sweep itself uses — it only runs once, before
   * the sweep's own loop starts.
   *
   * Returns `performedWarmup: true` only when the round trip actually ran
   * (false = already warm, no-op) — tests assert on this to guard against
   * the warm-up becoming a mandatory extra round trip on every sweep.
   *
   * #744: a warm-up that TIMES OUT is no longer left as a silent dead end.
   * The old one-shot behavior left a wedged server (observed live: marksman,
   * a `workspaceIndexing` server, burned the full 20s and stayed cold) with
   * no re-warm and no skip — so every subsequent per-file touch in the sweep
   * re-paid a full per-file budget against it and timed out again, dragging
   * the whole sweep. Now: on a failed warm-up this retries exactly once (after
   * a short `warmupRetryBackoffMs` breather — the state where warm-up fails is
   * usually a server mid-relaunch/index that just needs a moment), and if the
   * retry ALSO leaves the server cold it is reported in `failedServerIds`. The
   * caller (the sweep loop) skips that server's files up front and marks them
   * unconfirmed, so per-file touches stop paying its timeout. This is a
   * sweep-scoped skip (the caller discards `failedServerIds` when the sweep
   * ends), deliberately NOT the global `broken` cooldown map: a server that is
   * merely still indexing is not broken and must not be cooldown-banned across
   * the whole session — it just wasn't ready for THIS sweep.
   *
   * "Failed warm-up" is measured per non-auxiliary server via the SAME
   * `demonstratedReady` signal `touchFile` marks on a confirmed round trip: a
   * server whose key is still absent from `demonstratedReady` after both
   * attempts never proved it can answer diagnostics, unless another rooted
   * member of its `fallbackFor` family did (#3939: a never-spawned alternate or
   * a preferred that lost to its working alternate is not a failure). Warm-up stays
   * `clientScope:"primary"` (not the sweep's `"all"`) on purpose: `"all"`
   * would additionally spawn the sweep-EXCLUDED auxiliaries
   * (`WORKSPACE_SWEEP_EXCLUDED_SERVER_IDS`), which is work this warm-up does not
   * need. (Before #1549 it was also unsafe: `touchFile`'s `inconclusive` flag was
   * touch-wide, so one slow advisory auxiliary suppressed the `demonstratedReady`
   * marking for a perfectly healthy primary — falsely condemning it. The verdict is
   * per-server now, and the marking loop skips only the servers that did not answer
   * for themselves, so the scope choice is a cost argument rather than a
   * correctness one.) Recording per-primary-server outcomes and skipping
   * on those is the correct, non-regressing way to cover the servers the sweep
   * actually gates on (the sweep groups by primary server, so the group this
   * warms IS the one whose per-file touches would drag).
   */
  async ensureWarmForSweep(representativeFile, options = {}) {
    if (this.checkDestroyed() || options.signal?.aborted) {
      return { performedWarmup: false, failedServerIds: [] };
    }
    const servers = getServersForFileWithConfig(representativeFile).filter((s) => !isAuxiliary(s));
    if (servers.length === 0) {
      return { performedWarmup: false, failedServerIds: [] };
    }
    const keys = await Promise.all(servers.map((server) => this.demonstratedReadyKeyFor(server, representativeFile)));
    const headOf = /* @__PURE__ */ new Map();
    const familyHead = servers.map((server) => {
      const preferredHead = server.fallbackFor === void 0 ? void 0 : headOf.get(server.fallbackFor);
      const head = preferredHead ?? server.id;
      headOf.set(server.id, head);
      return head;
    });
    const isColdAt = (i) => {
      const key = keys[i];
      if (key === void 0 || this.state.demonstratedReady.has(key)) {
        return false;
      }
      return !servers.some((_, j) => {
        const peerKey = keys[j];
        return peerKey !== void 0 && familyHead[j] === familyHead[i] && this.state.demonstratedReady.has(peerKey);
      });
    };
    const alreadyWarm = servers.every((_, i) => !isColdAt(i));
    if (alreadyWarm)
      return { performedWarmup: false, failedServerIds: [] };
    const cachedColdServerIds = [];
    let allNonWarmCached = true;
    for (let i = 0; i < servers.length; i++) {
      const key = keys[i];
      if (key === void 0 || !isColdAt(i))
        continue;
      if (this.state.demonstratedCold.has(key)) {
        cachedColdServerIds.push(servers[i].id);
      } else {
        allNonWarmCached = false;
      }
    }
    if (allNonWarmCached && cachedColdServerIds.length > 0) {
      logLatency({
        type: "phase",
        phase: "lsp_sweep_warmup_cached_cold",
        filePath: representativeFile,
        durationMs: 0,
        metadata: { serverIds: cachedColdServerIds }
      });
      return {
        performedWarmup: false,
        failedServerIds: cachedColdServerIds,
        skippedFromCache: true
      };
    }
    let content;
    try {
      content = await nodeFs2.promises.readFile(representativeFile, "utf-8");
    } catch {
      return { performedWarmup: false, failedServerIds: [] };
    }
    if (options.signal?.aborted) {
      return { performedWarmup: false, failedServerIds: [] };
    }
    const timeoutMs = options.timeoutMs ?? warmupTimeoutMs();
    const rootedServerIds = [];
    const unrootedServerIds = [];
    for (let i = 0; i < servers.length; i++) {
      if (keys[i] !== void 0)
        rootedServerIds.push(servers[i].id);
      else
        unrootedServerIds.push(servers[i].id);
    }
    const unrootedCandidates = {
      count: unrootedServerIds.length,
      ids: unrootedServerIds
    };
    const stillColdServerIds = () => {
      const cold = [];
      for (let i = 0; i < servers.length; i++) {
        if (isColdAt(i))
          cold.push(servers[i].id);
      }
      return cold;
    };
    const runWarmupTouch = async (attempt) => {
      if (options.signal?.aborted)
        return;
      const startedAt = Date.now();
      logLatency({
        type: "phase",
        phase: "lsp_sweep_warmup_start",
        filePath: representativeFile,
        durationMs: 0,
        metadata: {
          serverIds: rootedServerIds,
          unrootedCandidates,
          timeoutMs,
          attempt
        }
      });
      const warmupAttempt = this.touchFile(representativeFile, content, {
        diagnostics: "document",
        // #3187: stays FALSE. This touch wants a verdict, not findings: its
        // `clientScope: "primary"` evidence does not speak for the auxiliaries
        // the sweep's own `clientScope: "all"` touch waits on, so collecting
        // here would prime this file's `lastKnownDiagnostics` from a narrower
        // scope than the result that follows (and an empty confirm would delete
        // a previously confirmed record). `touchFile`'s sync-confirm gates key
        // off `source` instead, so the verdict still arrives at ~grace+RTT.
        collectDiagnostics: false,
        clientScope: "primary",
        source: "lsp_sweep_warmup",
        maxClientWaitMs: timeoutMs,
        maxDiagnosticsWaitMs: timeoutMs,
        // #669: the caller's cap here is the warm-up budget for a genuinely
        // COLD server — it must act as a floor, not the usual ceiling, or
        // `perServerTimeout` silently shrinks it to the strategy's normal
        // warm-state `aggregateWaitMs` (e.g. 1000ms for typescript) instead
        // of the requested 20000ms.
        warmupOverride: true,
        // #799: only attempt 1 gets the cold-start floor — see the
        // `warmupAttempt` doc on `LSPTouchFileOptions`.
        warmupAttempt: attempt
      });
      await (options.signal ? Promise.race([
        withDeadline(warmupAttempt, {
          ms: timeoutMs,
          onTimeout: "undefined"
        }),
        new Promise((resolve9) => {
          if (options.signal.aborted) {
            resolve9();
            return;
          }
          options.signal.addEventListener("abort", () => resolve9(), {
            once: true
          });
        })
      ]) : withDeadline(warmupAttempt, {
        ms: timeoutMs,
        onTimeout: "undefined"
      }));
      const coldServerIds = stillColdServerIds();
      logLatency({
        type: "phase",
        phase: options.signal?.aborted ? "lsp_sweep_warmup_aborted" : coldServerIds.length > 0 ? "lsp_sweep_warmup_failed" : "lsp_sweep_warmup_done",
        filePath: representativeFile,
        durationMs: Date.now() - startedAt,
        metadata: {
          serverIds: rootedServerIds,
          unrootedCandidates,
          timeoutMs,
          attempt,
          coldServerIds
        }
      });
    };
    await runWarmupTouch(1);
    let failedServerIds = stillColdServerIds();
    const warmedClients = keys.map((key) => key === void 0 ? void 0 : this.state.clients.get(key));
    if (failedServerIds.length > 0 && !options.signal?.aborted) {
      const backoffMs = warmupRetryBackoffMs();
      if (backoffMs > 0) {
        await new Promise((resolve9) => {
          const timer = setTimeout(resolve9, backoffMs);
          timer.unref?.();
          options.signal?.addEventListener("abort", () => resolve9(), {
            once: true
          });
        });
      }
      if (!options.signal?.aborted) {
        await runWarmupTouch(2);
        failedServerIds = stillColdServerIds();
      }
    }
    if (failedServerIds.length > 0) {
      for (let i = 0; i < servers.length; i++) {
        const key = keys[i];
        if (key !== void 0 && failedServerIds.includes(servers[i].id) && this.state.clients.get(key) === warmedClients[i]) {
          this.state.demonstratedCold.add(key);
        }
      }
    }
    return { performedWarmup: true, failedServerIds };
  }
  /**
   * Actively scan every LSP-supported source file under a project root.
   * This is intentionally expensive and used only by explicit project-wide tools.
   */
  async runWorkspaceDiagnostics(cwd, options = {}) {
    const releaseSweepHold = acquireWorkspaceSweepHold();
    try {
      return await this.runWorkspaceDiagnosticsSwept(cwd, options);
    } finally {
      releaseSweepHold();
    }
  }
  async runWorkspaceDiagnosticsSwept(cwd, options = {}) {
    const startedAt = Date.now();
    const root = path16.resolve(cwd);
    const { signal } = options;
    void this.sweepDocumentDrift().catch(() => {
    });
    const maxFiles = typeof options.maxFiles === "number" && Number.isFinite(options.maxFiles) && options.maxFiles > 0 ? Math.floor(options.maxFiles) : getMaxWorkspaceDiagnosticFiles();
    const files2 = options.files ? options.files.slice(0, maxFiles) : await collectWorkspaceDiagnosticFiles(root, maxFiles, signal);
    const perFileMs = (() => {
      const raw = Number(process.env.PI_LENS_LSP_WORKSPACE_PER_FILE_MS);
      return Number.isFinite(raw) && raw > 0 ? raw : 15e3;
    })();
    const results = [];
    let completed = 0;
    let timedOutFiles = 0;
    let lastHeartbeat = Date.now();
    const workspaceDiagnosticsCacheCtx = createWorkspaceDiagnosticsCacheContext(root);
    const workspaceSweepScopeKey = buildScopeKey("all", [
      ...WORKSPACE_SWEEP_EXCLUDED_SERVER_IDS
    ]);
    const touchScopedOpenDependencies = async (filePath) => {
      if (options.files === void 0)
        return true;
      const imports = workspaceDiagnosticsCacheCtx.importsFor(filePath);
      if (!imports)
        return false;
      const openImports = imports.filter((dependency) => this.hasLiveClientHoldingDocument(dependency));
      const capped = openImports.length > SCOPED_DEPENDENCY_TOUCH_MAX;
      if (capped) {
        recordDegradationOnce({
          kind: "lsp_dependency_touch_capped",
          subject: filePath,
          reason: `scoped full scan limited open import touches to ${SCOPED_DEPENDENCY_TOUCH_MAX}`
        });
      }
      await Promise.all(openImports.slice(0, SCOPED_DEPENDENCY_TOUCH_MAX).map(async (dependency) => {
        let content;
        try {
          content = await fs13.readFile(dependency, "utf8");
        } catch {
          return;
        }
        await this.touchFile(dependency, content, {
          diagnostics: "none",
          source: "lens_diagnostics_full_dependency",
          clientScope: "all",
          excludeServerIds: await this.serverIdsNotHoldingDocument(dependency)
        });
      }));
      return !capped;
    };
    const cachedResults = [];
    const filesToTouch = [];
    const writeIndexByPath = /* @__PURE__ */ new Map();
    for (const filePath of files2) {
      writeIndexByPath.set(normalizeMapKey(filePath), options.nextWriteIndex?.());
      const cached = workspaceDiagnosticsCacheCtx.lookup(filePath, workspaceSweepScopeKey);
      if (cached && cached.binding.boundToCurrentDisk !== false) {
        const dependenciesConfirmed = await touchScopedOpenDependencies(filePath);
        if (dependenciesConfirmed)
          cachedResults.push({
            filePath,
            diagnostics: cached.diagnostics,
            count: cached.count,
            // #1093: a cache hit replays an older observation — carry its
            // scan time so mode=full's footer reconcile stamps `touchedAt`
            // with when the truth was seen, not now().
            observedAt: cached.scannedAt,
            contentHash: cached.binding.contentHash,
            boundToCurrentDisk: cached.binding.boundToCurrentDisk,
            writeIndex: writeIndexByPath.get(normalizeMapKey(filePath))
          });
        else
          filesToTouch.push(filePath);
      } else {
        filesToTouch.push(filePath);
      }
    }
    completed = cachedResults.length;
    if (cachedResults.length > 0) {
      options.onProgress?.(completed, files2.length);
    }
    const cacheServedKeys = new Set(cachedResults.map((result) => normalizeMapKey(result.filePath)));
    const supersededCacheKeys = /* @__PURE__ */ new Set();
    const pullAnsweredFiles = /* @__PURE__ */ new Set();
    const scannedMtimeByFile = /* @__PURE__ */ new Map();
    const scannedSizeByFile = /* @__PURE__ */ new Map();
    const scannedAtByFile = /* @__PURE__ */ new Map();
    const noteScanStat = (filePath) => {
      scannedAtByFile.set(filePath, Date.now());
      try {
        const scanStat = nodeFs2.statSync(filePath);
        scannedMtimeByFile.set(filePath, scanStat.mtimeMs);
        scannedSizeByFile.set(filePath, scanStat.size);
      } catch {
      }
    };
    const groups = groupFilesByPrimaryServer(filesToTouch);
    const sweepIndexGate = createSweepIndexGate();
    const workspacePullEnabled = process.env.PI_LENS_LSP_WORKSPACE_PULL === "1";
    logLatency({
      type: "phase",
      phase: "lsp_workspace_diagnostics_start",
      filePath: root,
      durationMs: 0,
      metadata: {
        fileCount: files2.length,
        cacheHits: cachedResults.length,
        filesToTouch: filesToTouch.length,
        maxFiles,
        perFileMs,
        serverGroups: groups.length
      }
    });
    const contentCache = /* @__PURE__ */ new Map();
    const preOpenGroupFiles = async (groupFiles) => {
      if (isWarmAttached())
        return;
      for (const filePath of groupFiles) {
        if (signal?.aborted)
          return;
        let content;
        noteScanStat(filePath);
        try {
          content = await nodeFs2.promises.readFile(filePath, "utf-8");
        } catch {
          continue;
        }
        contentCache.set(filePath, content);
        const languageId = getLanguageId2(filePath) ?? "plaintext";
        const preOpenAttempt = withDeadline((async () => {
          const { clients } = await this.getClientsForFile(filePath, WORKSPACE_SWEEP_EXCLUDED_SERVER_IDS);
          for (const entry of clients) {
            let auxKey;
            if (isAuxiliary(entry.info)) {
              auxKey = await this.demonstratedReadyKeyFor(entry.info, filePath);
              if (auxKey && this.auxNotifyBacklogAtCeiling(auxKey, entry)) {
                continue;
              }
            }
            try {
              const sent = await entry.client.notify.open(filePath, content, languageId);
              if (auxKey && sent !== false) {
                this.noteAuxNotifyIssued(auxKey, entry.client);
              }
            } catch {
            }
          }
        })(), { ms: perFileMs, onTimeout: "undefined" });
        await (signal ? Promise.race([
          preOpenAttempt,
          new Promise((resolve9) => {
            if (signal.aborted) {
              resolve9();
              return;
            }
            signal.addEventListener("abort", () => resolve9(), {
              once: true
            });
          })
        ]) : preOpenAttempt);
      }
    };
    const markServiceDestroyed = (remainingFiles) => {
      for (const filePath of remainingFiles) {
        results.push({
          filePath,
          diagnostics: [],
          count: 0,
          timedOut: true,
          unconfirmedReason: "service_destroyed",
          writeIndex: writeIndexByPath.get(normalizeMapKey(filePath))
        });
        timedOutFiles += 1;
        completed += 1;
      }
      options.onProgress?.(completed, files2.length);
    };
    const processFile = async (filePath) => {
      try {
        let content = contentCache.get(filePath);
        if (content === void 0) {
          noteScanStat(filePath);
          content = await nodeFs2.promises.readFile(filePath, "utf-8");
        }
        const attached = isWarmAttached() ? await tryWarmAttachedDiagnostics(filePath, content, perFileMs, "sweep") : void 0;
        if (attached && !attached.available) {
          await this.ensureWarmForSweep(filePath, { signal });
        }
        const touchResult = attached?.available ? {
          diags: attached.response.diagnostics,
          // #1470: the incumbent's coverage gap crosses the socket as an
          // explicit DTO field, so carry it onto the wrapper the sweep
          // reads. Dropping it here would let a partially covered
          // incumbent answer be persisted as a confirmed sweep result —
          // the same false clean this change closes on the local route.
          ...attached.response.unconfirmedServerIds !== void 0 && {
            unconfirmedServerIds: attached.response.unconfirmedServerIds
          }
        } : await withDeadline(this.touchFile(filePath, content, {
          diagnostics: "document",
          collectDiagnostics: true,
          clientScope: "all",
          source: "lens_diagnostics_full",
          // #584: opengrep's findings for a full sweep come from the
          // `opengrep-client.ts` CLI extractor (one project-wide scan,
          // cached, read via extractors.ts) instead — see the
          // `excludeServerIds` doc on `LSPTouchFileOptions`.
          excludeServerIds: WORKSPACE_SWEEP_EXCLUDED_SERVER_IDS,
          // #645: lets a workspaceIndexing server (marksman) pay its
          // full wait budget only once across this whole sweep.
          sweepIndexGate
        }), { ms: perFileMs, onTimeout: "undefined" });
        const diagnostics = touchResult?.diags;
        const inconclusive = touchResult?.inconclusive === true;
        const unconfirmedServerIds2 = touchCoverageGap(touchResult);
        const coverageGap = unconfirmedServerIds2.length > 0;
        const declinedOutsideRoot = touchResult?.skipReason === "outside-project-root";
        const timedOut = touchResult === void 0 || inconclusive || declinedOutsideRoot;
        if (timedOut)
          timedOutFiles += 1;
        const unconfirmedReason = touchResult === void 0 ? "budget" : declinedOutsideRoot ? "outside_project_root" : inconclusive ? "inconclusive" : void 0;
        const rawBinding = touchResult?.binding;
        const filteredDiagnostics = diagnostics ? applyAuxiliarySuppressions(diagnostics, content, {
          fileRole: detectFileRole(filePath, content),
          filePath,
          scanRoot: root
        }) : diagnostics;
        results.push({
          filePath,
          diagnostics: filteredDiagnostics ?? [],
          count: filteredDiagnostics?.length ?? 0,
          ...timedOut && { timedOut: true, unconfirmedReason },
          ...coverageGap && {
            unconfirmedServerIds: [...unconfirmedServerIds2]
          },
          contentHash: rawBinding?.contentHash,
          boundToCurrentDisk: rawBinding?.boundToCurrentDisk,
          writeIndex: writeIndexByPath.get(normalizeMapKey(filePath))
        });
      } catch (err) {
        results.push({
          filePath,
          diagnostics: [],
          count: 0,
          error: err instanceof Error ? err.message : String(err),
          // An errored check is exactly as inconclusive as a timed-out one —
          // no confirmed result was obtained, so reconciliation (#571) must
          // skip it the same way. #1618: distinct from every OTHER
          // `timedOut: true` reason — an `error` must never render as "didn't
          // complete within budget" (the old dead-subtraction bug in
          // tools/lens-diagnostics.ts's `unconfirmedErrored` computation).
          timedOut: true,
          unconfirmedReason: "error",
          writeIndex: writeIndexByPath.get(normalizeMapKey(filePath))
        });
      }
      completed += 1;
      options.onProgress?.(completed, files2.length);
      if (Date.now() - lastHeartbeat >= 1e4) {
        lastHeartbeat = Date.now();
        logLatency({
          type: "phase",
          phase: "lsp_workspace_diagnostics_progress",
          filePath: root,
          durationMs: Date.now() - startedAt,
          metadata: {
            completed,
            total: files2.length,
            timedOutFiles,
            aborted: signal?.aborted ?? false
          }
        });
      }
    };
    const groupWorkers = Math.min(WORKSPACE_DIAGNOSTICS_CONCURRENCY, groups.length);
    const sweepPhase = phaseStarted("lsp_workspace_diagnostics_touch");
    try {
      await runPerServerGroups(groups, groupWorkers, async (group) => {
        if (signal?.aborted)
          return;
        if (this.checkDestroyed()) {
          markServiceDestroyed(group.files);
          return;
        }
        if (!isWarmAttached() && workspacePullEnabled && !group.multiServer) {
          const pullStartedAt = Date.now();
          const pulled = await this.tryWorkspacePull(group.files, perFileMs, cacheServedKeys);
          if (pulled) {
            for (const clean of pulled.extraClean) {
              supersededCacheKeys.add(normalizeMapKey(clean.filePath));
            }
            for (const result of [...pulled.results, ...pulled.extraClean]) {
              results.push({
                ...result,
                writeIndex: writeIndexByPath.get(normalizeMapKey(result.filePath))
              });
              pullAnsweredFiles.add(result.filePath);
              try {
                const pullStat = nodeFs2.statSync(result.filePath);
                scannedMtimeByFile.set(result.filePath, pullStat.mtimeMs);
                scannedSizeByFile.set(result.filePath, pullStat.size);
                scannedAtByFile.set(result.filePath, pullStartedAt);
              } catch {
              }
            }
            completed += group.files.length;
            options.onProgress?.(completed, files2.length);
            return;
          }
        }
        const first = group.files[0];
        if (first && !isWarmAttached()) {
          const warmup = await this.ensureWarmForSweep(first, { signal });
          if (signal?.aborted)
            return;
          if (warmup.failedServerIds.length > 0) {
            logLatency({
              type: "phase",
              phase: "lsp_sweep_group_skipped_warmup",
              filePath: first,
              durationMs: 0,
              metadata: {
                failedServerIds: warmup.failedServerIds,
                // #799: distinguishes a fresh warm-up failure from a
                // negative-cache hit (this sweep never re-attempted warm-up
                // at all — it was already known cold from earlier this
                // session).
                skippedFromCache: warmup.skippedFromCache ?? false,
                skippedFiles: group.files.length
              }
            });
            for (const filePath of group.files) {
              results.push({
                filePath,
                diagnostics: [],
                count: 0,
                timedOut: true,
                unconfirmedReason: "inconclusive",
                skippedWarmupFailure: true
              });
              timedOutFiles += 1;
              completed += 1;
            }
            options.onProgress?.(completed, files2.length);
            return;
          }
          if (warmup.performedWarmup)
            options.onServerReady?.();
        }
        for (let chunkStart = 0; chunkStart < group.files.length; chunkStart += WORKSPACE_SWEEP_PREOPEN_CHUNK_SIZE) {
          if (signal?.aborted)
            return;
          if (this.checkDestroyed()) {
            markServiceDestroyed(group.files.slice(chunkStart));
            return;
          }
          const chunk = group.files.slice(chunkStart, chunkStart + WORKSPACE_SWEEP_PREOPEN_CHUNK_SIZE);
          await preOpenGroupFiles(chunk);
          for (const filePath of chunk) {
            if (signal?.aborted)
              return;
            if (this.checkDestroyed()) {
              markServiceDestroyed(group.files.slice(group.files.indexOf(filePath)));
              return;
            }
            await processFile(filePath);
          }
        }
      }, signal);
    } finally {
      phaseFinished(sweepPhase);
    }
    const unconfirmedByReason = {};
    for (const result of results) {
      if (!result.timedOut)
        continue;
      const reason = result.unconfirmedReason ?? "budget";
      unconfirmedByReason[reason] = (unconfirmedByReason[reason] ?? 0) + 1;
    }
    const partiallyCoveredFiles = results.filter((result) => (result.unconfirmedServerIds?.length ?? 0) > 0).length;
    const unconfirmedServerIds = [
      ...new Set(results.flatMap((result) => result.unconfirmedServerIds ?? []))
    ].sort((a, b) => Number(a > b) - Number(a < b));
    let pullUnbound = 0;
    for (const result of results) {
      if (pullAnsweredFiles.has(result.filePath) && result.contentHash === void 0)
        pullUnbound += 1;
    }
    logLatency({
      type: "phase",
      phase: "lsp_workspace_diagnostics",
      filePath: root,
      durationMs: Date.now() - startedAt,
      metadata: {
        filesChecked: files2.length,
        cacheHits: cachedResults.length,
        diagnosticCount: results.reduce((sum, result) => sum + (result?.count ?? 0), 0),
        serverGroups: groups.length,
        concurrency: groupWorkers,
        maxFiles,
        timedOutFiles,
        unconfirmedByReason,
        partiallyCoveredFiles,
        pullUnbound,
        ...unconfirmedServerIds.length > 0 && { unconfirmedServerIds },
        aborted: signal?.aborted ?? false
      }
    });
    for (const result of results) {
      const scannedAt = scannedMtimeByFile.get(result.filePath);
      if (result.error || result.timedOut || (result.unconfirmedServerIds?.length ?? 0) > 0 || scannedAt === void 0) {
        continue;
      }
      if (pullAnsweredFiles.has(result.filePath) && result.contentHash === void 0) {
        workspaceDiagnosticsCacheCtx.forget(result.filePath);
        continue;
      }
      workspaceDiagnosticsCacheCtx.record(result.filePath, workspaceSweepScopeKey, result.diagnostics, scannedAt, result.contentHash, scannedSizeByFile.get(result.filePath), scannedAtByFile.get(result.filePath));
    }
    workspaceDiagnosticsCacheCtx.persist();
    const servedCacheResults = supersededCacheKeys.size === 0 ? cachedResults : cachedResults.filter((result) => !supersededCacheKeys.has(normalizeMapKey(result.filePath)));
    const freshResults = results.map((result) => ({
      ...result,
      observedAt: scannedAtByFile.get(result.filePath)
    }));
    return [...servedCacheResults, ...freshResults].filter(Boolean);
  }
  /**
   * #387 Item 2: one `workspace/diagnostic` pull covering a whole server group,
   * instead of N per-file opens. Returns per-file results (files absent from the
   * report are reported clean), or `undefined` when the server doesn't advertise
   * workspace pull / the pull fails — the caller then falls back to per-file.
   *
   * #1782: the report is project-wide, so it routinely names files this group
   * never asked about — including files this sweep already served from the
   * cache. Those answers used to be dropped on the floor: the mapping below
   * only ever looked up `groupFiles`. That is how a server can explicitly
   * re-answer a file with ZERO diagnostics while the cache and the widget keep
   * rendering its stale blockers, which is what the 2026-08-20 dogfood recorded
   * at 23:07. `reanswerFor` opts a caller into those extra answers: pass the
   * normalized keys of files served from cache, and any of them the report
   * explicitly names with zero diagnostics comes back in `extraClean` as a
   * confirmed clean result.
   *
   * Only an EXPLICIT zero-diagnostic entry qualifies. Absence from the report
   * reads as clean for `groupFiles`, which this sweep did ask about, but it is
   * genuinely UNKNOWN for a file nobody asked about — a server may report only
   * what it re-checked.
   */
  async tryWorkspacePull(groupFiles, perFileMs, reanswerFor) {
    try {
      const first = groupFiles[0];
      if (!first)
        return void 0;
      const spawned = await this.getClientForFile(first, perFileMs);
      if (!spawned)
        return void 0;
      if (!spawned.client.getWorkspaceDiagnosticsSupport().workspaceDiagnostics) {
        return void 0;
      }
      const report = await spawned.client.requestWorkspaceDiagnostics(Math.max(perFileMs, workspacePullBudgetMs()));
      if (!report)
        return void 0;
      const byPath = /* @__PURE__ */ new Map();
      for (const entry of report) {
        byPath.set(normalizeMapKey(entry.filePath), entry);
      }
      const results = groupFiles.map((filePath) => {
        const entry = byPath.get(normalizeMapKey(filePath));
        const diagnostics = entry?.diagnostics ?? [];
        return {
          filePath,
          diagnostics,
          count: diagnostics.length,
          timedOut: false,
          contentHash: entry?.contentHash
        };
      });
      const extraClean = [];
      if (reanswerFor && reanswerFor.size > 0) {
        const asked = new Set(groupFiles.map((f) => normalizeMapKey(f)));
        const withFindings = /* @__PURE__ */ new Set();
        for (const entry of report) {
          if (entry.diagnostics.length > 0) {
            withFindings.add(normalizeMapKey(entry.filePath));
          }
        }
        for (const [key, entry] of byPath) {
          if (asked.has(key) || !reanswerFor.has(key))
            continue;
          if (entry.diagnostics.length > 0 || withFindings.has(key))
            continue;
          extraClean.push({
            filePath: entry.filePath,
            diagnostics: [],
            count: 0,
            timedOut: false,
            contentHash: entry.contentHash
          });
        }
      }
      return { results, extraClean };
    } catch {
      return void 0;
    }
  }
  /**
   * Get all diagnostics across all tracked files (for cascade checking)
   */
  async getAllDiagnostics() {
    const all = /* @__PURE__ */ new Map();
    const bindingsByPath = /* @__PURE__ */ new Map();
    const now = Date.now();
    for (const [_key, client] of this.state.clients) {
      const trackedPaths = client.getTrackedDiagnosticPaths();
      const existingPaths = /* @__PURE__ */ new Set();
      await Promise.all(trackedPaths.map(async (filePath) => {
        try {
          await nodeFs2.promises.access(filePath);
          existingPaths.add(filePath);
        } catch {
        }
        return true;
      }));
      client.pruneDiagnostics((filePath, ts) => !existingPaths.has(filePath) || now - ts > CASCADE_DIAGNOSTICS_TTL_MS);
      const clientDiags = client.getAllDiagnostics();
      for (const [filePath, entry] of clientDiags) {
        const attributed = attributeDiagnostics(client.serverId, entry.diags);
        const existing = all.get(filePath);
        if (existing) {
          existing.diags = mergeLspDiagnostics([
            ...existing.diags,
            ...attributed
          ]);
          existing.ts = Math.max(existing.ts, entry.ts);
        } else {
          all.set(filePath, { diags: attributed, ts: entry.ts });
        }
        const list = bindingsByPath.get(filePath) ?? [];
        list.push(entry.binding);
        bindingsByPath.set(filePath, list);
      }
    }
    for (const [filePath, entry] of all) {
      const stored = bindingsByPath.get(filePath) ?? [];
      let memo;
      Object.defineProperty(entry, "binding", {
        enumerable: false,
        configurable: true,
        get: () => memo ??= this.mergeBinding(filePath, stored)
      });
    }
    return all;
  }
  /**
   * Check whether a file type/root has any configured LSP support.
   * Pure capability check — does not spawn or wait for clients.
   */
  supportsLSP(filePath) {
    return getServersForFileWithConfig(filePath).length > 0;
  }
  /**
   * Check whether the PRIMARY server for this file is currently mid-spawn
   * (`state.inFlight`, keyed `${server.id}:${normalizeMapKey(root)}` — see
   * :2413). Lets a caller whose own wait budget expires distinguish "the
   * server hasn't finished its first spawn yet" from "the server is running
   * but slow/wedged" (#1766) — a cold spawn still in flight is not a verdict
   * on a server that doesn't exist yet.
   *
   * Mirrors the `!isAuxiliary` filter getClientForFile applies at
   * :2146-2148 (kept coupled to that line intentionally): auxiliary servers
   * (opengrep, typos, …) spawn routinely and concurrently with an ALREADY
   * ALIVE primary (dispatch/runners/lsp.ts's with-auxiliary path fires one
   * per edit for most files via TYPOS_EXTENSIONS). Without this filter, an
   * unrelated auxiliary spawn would downgrade a genuinely wedged primary to
   * a benign "spawn-in-flight" verdict — the worse misreport direction.
   *
   * The touch path supplies roots resolved before acquisition. Matching the full
   * server/root key prevents another workspace's spawn from relabeling this one.
   * Root resolution is already complete, and this check stays synchronous.
   * The failure mode is limited to the matching workspace key.
   * Pure lookup — does not spawn or wait for a client.
   */
  isSpawnInFlight(_filePath, resolvedRoots = /* @__PURE__ */ new Map()) {
    for (const [serverId, root] of resolvedRoots) {
      if (this.state.inFlight.has(`${serverId}:${root}`))
        return true;
    }
    return false;
  }
  /**
   * #3873 O9: what a touch that found no client had to choose from. One entry
   * per PRIMARY language server configured for the file: whether a root
   * resolved for it (`rooted`), what this service held for that server and
   * root (`clientFound`: `alive`, `dead` or `none`), and that client's spawn
   * time (`generation`, epoch ms; a replaced client has a new one). Pure
   * lookup over the roots the touch already resolved, so `rooted: false` means
   * this touch resolved no root for it (none found, its wait timed out first,
   * or it was an alternate never tried), and an `alive` client next to a
   * no-client verdict is the contradiction worth reading.
   *
   * An auxiliary server (opengrep, ast-grep, typos, ...) is listed only when
   * this touch attempted it and so has a root in `auxiliaryRoots`, which only
   * `clientScope: "all"` fills (`getClientsForFile`). In the primary and
   * with-auxiliary scopes it is skipped: no root is resolved for it here, so
   * its entry would read `rooted: false` beside a live client. The
   * with-auxiliary outcome is the `auxiliary_readiness` row's (written only in
   * that branch). Bounded at {@link MAX_TOUCH_CANDIDATES}.
   */
  describeTouchCandidates(filePath, resolvedRoots, auxiliaryRoots = /* @__PURE__ */ new Map()) {
    const candidates = [];
    for (const server of getServersForFileWithConfig(filePath)) {
      const auxiliary = isAuxiliary(server);
      if (auxiliary && !auxiliaryRoots.has(server.id))
        continue;
      if (candidates.length >= MAX_TOUCH_CANDIDATES)
        break;
      const root = (auxiliary ? auxiliaryRoots : resolvedRoots).get(server.id);
      const key = root === void 0 ? void 0 : `${server.id}:${root}`;
      const client = key === void 0 ? void 0 : this.state.clients.get(key);
      candidates.push({
        serverId: server.id,
        rooted: root !== void 0,
        clientFound: client ? client.isAlive() ? "alive" : "dead" : "none",
        generation: key === void 0 ? void 0 : this.state.clientSpawnedAt.get(key)
      });
    }
    return candidates;
  }
  /**
   * Check whether an LSP client is already alive for a file.
   * Lightweight — does not spawn or wait for a client.
   */
  async hasWarmLSP(filePath) {
    const spawned = await this.getWarmClientForFile(filePath);
    return Boolean(spawned);
  }
  /**
   * Check if LSP is available for a file.
   * May spawn a client; prefer supportsLSP()/hasWarmLSP() when you only need
   * a capability or warm-state check.
   */
  async hasLSP(filePath) {
    const spawned = await this.getClientForFile(filePath);
    return Boolean(spawned);
  }
  /**
   * Shutdown all LSP clients
   */
  async shutdown(options = {}) {
    const resetStartedAt = Date.now();
    if (this.checkDestroyed())
      return;
    this.isDestroyed = true;
    this.shutdownController.abort();
    for (const [key, token] of this.outstandingAuxNotifyWrites) {
      this.releaseOutstandingAuxNotifyWrite(key, token);
    }
    for (const key of this.idleEvictionTimers.keys()) {
      this.clearIdleEvictionTimer(key);
    }
    if (!options.processExiting && this.state.inFlight.size > 0) {
      const pending2 = Array.from(this.state.inFlight.values());
      this.state.inFlight.clear();
      const settled = await Promise.allSettled(pending2);
      for (const result of settled) {
        if (result.status === "fulfilled" && result.value?.client) {
          result.value.client.shutdown({ fast: true }).catch(() => {
          });
        }
      }
    } else {
      this.state.inFlight.clear();
    }
    const aliveClients = this.getAliveClientCount();
    await Promise.allSettled(Array.from(this.state.clients.values(), (client) => Promise.resolve().then(() => client.shutdown(options))));
    logLatency({
      type: "phase",
      phase: "lsp_service_reset",
      filePath: "",
      startedAt: new Date(resetStartedAt).toISOString(),
      durationMs: Date.now() - resetStartedAt,
      metadata: {
        reason: options.reason ?? null,
        aliveClients,
        fast: !!options.fast,
        processExiting: !!options.processExiting
      }
    });
    this.state.clients.clear();
    this.state.broken.clear();
    this.firstContactWaits.clear();
    this.lastSpawnVerdict.clear();
    for (const [key, token] of this.outstandingAuxNotifyWrites) {
      this.releaseOutstandingAuxNotifyWrite(key, token);
    }
    this.notifyStallDemotions.clear();
    this.auxNotifyDrainLatencyEwma.clear();
    this.auxNotifyInflight.clear();
    this.documentDrift.clear();
    this.workspaceProbeLogged.clear();
    this.warmStartLogged.clear();
  }
  /**
   * Get status of all active clients
   */
  getStatus() {
    return Array.from(this.state.clients.entries()).map(([key, client]) => {
      const [serverId, root] = key.split(":");
      return {
        serverId,
        root,
        connected: client.isAlive(),
        pullFailureHistory: (client.getPullFailureHistory?.() ?? []).map((entry) => ({
          ...entry,
          message: entry.message.slice(0, 200)
        }))
      };
    });
  }
  /**
   * #1142 windowed-rate breaker (composes with the {@link runtimeExitCounts}
   * fast path — see that field and {@link RUNTIME_EXIT_WINDOW_MS}).
   *
   * Records one non-intentional death and returns true iff this death pushes
   * the rolling window to {@link RUNTIME_EXIT_WINDOW_TRIP_COUNT} deaths, i.e.
   * the breaker should give up now. The caller has ALREADY excluded intentional
   * teardowns (shutdown()-driven restarts, #743 eviction, session resets,
   * generation handoffs) — only genuine crash-respawns reach here.
   *
   * Sleep-gap / long-healthy-run guard: a death whose measured lifetime exceeds
   * {@link RUNTIME_EXIT_WINDOW_UPTIME_CEILING_MS} (or is unknown) is NOT
   * recorded — a lifetime spanning a Modern-Standby suspend, or a genuinely
   * long run that crashed once, is not churn. See that constant for the
   * per-KEY structural defense this backs up.
   *
   * Bounded on both axes (defect shape 9): prune entries outside the window,
   * then hard-cap the retained array at the trip count (drop-oldest — a rate
   * trip needs only the in-window count, so earliest-evidence order is
   * irrelevant here).
   */
  recordRuntimeExitWindow(key, exitedAt, uptimeMs) {
    if (exitedAt == null || uptimeMs == null || uptimeMs > RUNTIME_EXIT_WINDOW_UPTIME_CEILING_MS) {
      return false;
    }
    const deaths = this.runtimeExitWindow.get(key) ?? [];
    deaths.push(exitedAt);
    const windowRef = Math.max(...deaths);
    const windowStart = windowRef - RUNTIME_EXIT_WINDOW_MS;
    let pruned = deaths.filter((t) => t >= windowStart);
    if (pruned.length > RUNTIME_EXIT_WINDOW_TRIP_COUNT) {
      pruned = pruned.slice(pruned.length - RUNTIME_EXIT_WINDOW_TRIP_COUNT);
    }
    this.runtimeExitWindow.set(key, pruned);
    return pruned.length >= RUNTIME_EXIT_WINDOW_TRIP_COUNT;
  }
  /**
   * Read-only circuit-breaker status, including server/root pairs that have no
   * live client and would therefore be absent from getStatus().
   *
   * #1127: `failureCounts` (spawn/init failures) and `runtimeExitCounts`
   * (early post-init runtime exits) are two INDEPENDENT streams feeding one
   * circuit — either can trip its own cooldown/permanent-disable on its own
   * threshold, without the other. `failures` below is their SUM, purely for
   * display: it is the total churn behind whatever cooldown/permanent state
   * is showing, not a claim that both streams are at that count.
   */
  getBrokenStatus() {
    const keys = /* @__PURE__ */ new Set([
      ...this.state.broken.keys(),
      ...this.permanentlyBroken
    ]);
    return [...keys].map((key) => {
      const separator = key.indexOf(":");
      return {
        serverId: separator >= 0 ? key.slice(0, separator) : key,
        root: separator >= 0 ? key.slice(separator + 1) : "",
        // #1127/#1142: spawn/init failures, consecutive early post-init
        // exits, and the windowed-rate stream all feed the same breaker
        // (see `runtimeExitCounts`/`runtimeExitWindow` docs). Sum spawn/init
        // failures with the LARGER of the two runtime-exit streams — a
        // single <60s death feeds BOTH runtimeExitCounts and the window, so
        // `max` avoids double-counting them, while still surfacing a
        // windowed-only trip (whose runtimeExitCounts may be 0) instead of
        // misreporting `failures: 0` behind a permanent-disable.
        failures: (this.failureCounts.get(key) ?? 0) + Math.max(this.runtimeExitCounts.get(key) ?? 0, this.runtimeExitWindow.get(key)?.length ?? 0),
        permanentlyBroken: this.permanentlyBroken.has(key),
        cooldownUntil: this.state.broken.get(key) ?? 0
      };
    });
  }
  /**
   * Count clients that are currently alive (connected and initialized).
   * Lightweight — does not spawn or wait for anything.
   */
  getAliveClientCount() {
    let count = 0;
    for (const client of this.state.clients.values()) {
      if (client.isAlive())
        count++;
    }
    return count;
  }
  /**
   * Distinct serverIds of currently-alive clients, ordered primary-first then
   * auxiliary (cross-cutting scanners like opengrep/ast-grep), stable within
   * each group. Deduped across roots — one warm server serving two roots
   * collapses to a single id. Lightweight: does not spawn or wait. (#267)
   */
  getAliveServerIds() {
    const primary = [];
    const aux = [];
    const seen = /* @__PURE__ */ new Set();
    for (const client of this.state.clients.values()) {
      if (!client.isAlive())
        continue;
      const id = client.serverId;
      if (seen.has(id))
        continue;
      seen.add(id);
      (isAuxiliary(getServerById(id)) ? aux : primary).push(id);
    }
    return [...primary, ...aux];
  }
};
configureLspServiceLifecycle({
  create: (generationHandoff) => new LSPService(generationHandoff, process.cwd()),
  beforeReset: (options) => {
    abortDeferredLspWork(`lsp service reset: ${options.reason ?? "unspecified"}`);
    resetLspLaunchAvailabilityGeneration();
    if (options.reason === "session_start") {
      resetClassicTsRepairGuard();
    }
  },
  destroy: (service, options) => service.shutdown(options)
});

// dist/clients/lsp/capabilities.js
var adaptedServices = /* @__PURE__ */ new WeakMap();
function bindGroup(service, keys) {
  return new Proxy({}, {
    get(_target, key) {
      if (!keys.includes(key))
        return void 0;
      const value = service[key];
      return typeof value === "function" ? value.bind(service) : value;
    }
  });
}
function adaptLspService(service) {
  const existing = adaptedServices.get(service);
  if (existing)
    return existing;
  const groups = {
    clients: bindGroup(service, [
      "checkDestroyed",
      "getAliveClientCount",
      "getAliveServerIds",
      "getBrokenStatus",
      "getStatus",
      "isSpawnInFlight",
      "shutdown"
    ]),
    documents: bindGroup(service, [
      "getOpenDocumentPaths",
      "openFile",
      "touchFile"
    ]),
    diagnostics: bindGroup(service, [
      "getAllDiagnostics",
      "getDiagnostics",
      "getDiagnosticsHealth",
      "getLastKnownDiagnostics",
      "readCachedDiagnosticsForServers",
      "runWorkspaceDiagnostics"
    ]),
    navigation: bindGroup(service, [
      "codeAction",
      "documentSymbol",
      "definition",
      "hover",
      "implementation",
      "incomingCalls",
      "outgoingCalls",
      "prepareCallHierarchy",
      "references",
      "rename",
      "typeDefinition"
    ]),
    workspace: bindGroup(service, [
      "getAdvertisedCommands",
      "getCapabilitySnapshots",
      "getClientForFile",
      "getOperationSupport",
      "getWarmClientForFile",
      "hasServerPublishedForFileRoot",
      "supportsLSP"
    ])
  };
  const adapted = new Proxy(service, {
    get(target, key, receiver) {
      if (key in groups)
        return groups[key];
      const value = Reflect.get(target, key, receiver);
      return typeof value === "function" ? value.bind(target) : value;
    }
  });
  adaptedServices.set(service, adapted);
  return adapted;
}
function getLSPService() {
  return adaptLspService(getOwnedLspService());
}
function peekLSPService() {
  const service = peekOwnedLspService();
  return service ? adaptLspService(service) : void 0;
}
var resetLSPService = (options = {}) => resetOwnedLspService(options);
async function notifyExternalFileChange(filePath, type) {
  return getLSPService().notifyExternalFileChange(filePath, type);
}
async function resyncGitChangedFiles(changedPaths) {
  return getLSPService().resyncGitChangedFiles(changedPaths);
}
async function hasAuxiliaryLspPublishedForRoot(serverId, filePath) {
  return getLSPService().hasServerPublishedForFileRoot(serverId, filePath);
}

export {
  STALE_LINE_MARKER,
  PAST_EOF_STALE_MARKER,
  demotePastEofDiagnostics,
  resyncDocumentOnPastEof,
  Text,
  writeOrderToken,
  WriteOrderingGuard,
  jsTsCandidatePaths,
  resolveAliasedImport,
  resolveProjectReferenceImport,
  resolveWorkspacePackageImport,
  resolveImportToFiles,
  symbolExtractionGrammar,
  TreeSitterSymbolExtractor,
  DEPENDENCY_DRIFT_MAX_DELIVERIES,
  sweepInlineBlockerFreshness,
  logBusEvent,
  getActiveSessionId,
  recordStaleBusFailure,
  createLiveBusEmitter,
  resolveLiveBusEmitter,
  createFileTime,
  clearAllSessions,
  touchCoverageGap,
  touchCompletedConfirmationPolicy,
  hashDiagnosticContent,
  beginScope,
  retireScope,
  nextOrderTurn,
  scopeCell,
  ReadGuard,
  anchorsForDiagnostic,
  hasAnyDispositionMarks,
  hasStrictDispositionMarks,
  getDisposition,
  applyDispositions,
  applyWeakDispositions,
  applyDispositionsMultiFile,
  isBlocking,
  setSessionLanguages,
  recordRunner,
  widgetDiagnosticUri,
  recordDiagnostics,
  classifyDiagnosticTier,
  reconcileScanDiagnostics,
  reconcileCorrelatedScanDiagnostics,
  reconcileStaleWidgetFiles,
  reconcileStaleWidgetDependencyBlockers,
  getWidgetBlockingFilesForSweep,
  markWidgetFileBlockersStale,
  drainRenderedDependencyDriftFilePaths,
  incrementWidgetDependencyDriftDelivery,
  retireWidgetDependencyDriftBlockers,
  getFileDiagnosticSummaries,
  countRetainedSuppressedRows,
  getLspBudgetIdleTimeoutMs,
  shouldShortenLspIdleTimeout,
  classifyDefect,
  classifyDiagnostic,
  MAX_BLOCKING_RULE_COMPLEXITY,
  isOverlyBroadPattern,
  isStructuredRule,
  calculateRuleComplexity,
  buildEffectiveAstGrepCatalog,
  isRuleIgnoredForPath,
  enabledAuxiliaryLspServerIds,
  findAuxiliaryProfileForSource,
  applyAuxiliarySuppressions,
  retagAuxiliaryDiagnostics,
  armDeferredLspWork,
  registerDeferredLspWork,
  MAX_LATE_AUX_REARMS,
  isAuxBacklogPublished,
  isPendingAuxiliaryPastRearmTtl,
  canRearmPendingAuxiliary,
  rearmPendingAuxiliaryCoverage,
  hasPendingAuxiliaryCoverage,
  clearPendingAuxiliaryCoverage,
  drainPendingAuxiliaryCoverage,
  pendingAuxiliaryCoverageSize,
  drainPendingAuxCapEvictedCount,
  recordNapiFallbackCoverage,
  resetPendingAuxiliaryCoverage,
  resetOpaqueMutationState,
  resetObservedMutationNet,
  getMutationBridge,
  resetLspMutationNoBridgeDbgLatch,
  newLspMutationCorrelationId,
  recordLspMutationOutcome,
  resetWorkspaceDiagnosticsCacheSession,
  refuseStaleWorkspaceEdit,
  workspaceEditTextPaths,
  summarizeWorkspaceEdit,
  applyWorkspaceEdit,
  getRunnerTimeoutFloorMs,
  RUNTIME_CONFIG,
  exceedsLspSyncLimits,
  fetchTsserverProjectIdentity,
  attemptTsserverSyncDiagnostics,
  rankFilesByReverseDependencyCentrality,
  buildReverseDependencyIndexFromGraph,
  buildScopeKey,
  createWorkspaceDiagnosticsCacheContext,
  groupFilesByPrimaryServer,
  runPerServerGroups,
  createLazyImport,
  loadLspService,
  tryWarmAttachedDiagnostics,
  tryWarmAttachedCodeActions,
  isWarmAttached,
  adaptLspService,
  getLSPService,
  peekLSPService,
  resetLSPService,
  notifyExternalFileChange,
  resyncGitChangedFiles,
  hasAuxiliaryLspPublishedForRoot
};
