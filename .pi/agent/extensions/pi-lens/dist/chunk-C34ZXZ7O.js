import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  detectFileRole,
  findNestedProjectMutationValue,
  findPiLensConfigInDir,
  findPiLensProjectConfig,
  ignoredRecordCollector,
  loadPiLensConfigInDir,
  loadPiLensProjectConfig,
  readConfigDocument,
  reportConfigReadFailure,
  reportPiLensConfigRecords,
  resolveOnePiLensConfigDocument,
  warnIgnoredConfigOnce
} from "./chunk-2BBLFX75.js";
import {
  CANONICAL_GLOBAL_CONFIG_FILE,
  FRESHNESS_CADENCE_MS,
  GLOBAL_CONFIG_LOCATIONS,
  LEGACY_ROOT_LSP_KEYS,
  canonicalPathIdentity,
  errorClassName,
  getPiLensGlobalConfigPath,
  getProductionGlobalConfigResolution
} from "./chunk-XVF2VVXP.js";
import {
  DEFAULT_MAX_OUTPUT_BYTES,
  createBoundedOutputSink,
  truncatedByOutputCap,
  writeFileAtomicAsync
} from "./chunk-2EECBNC5.js";
import {
  GLOBAL_NON_FLAG_CONFIG_SECTIONS,
  LENS_FLAGS,
  assignFlagConfigSection,
  compareOrdinal,
  flagConfigSectionKeys,
  flagValueFromConfig,
  getLensFlagSpec,
  incrementDegradationCount,
  readFlagConfigValue,
  readToolConfig,
  recordDegradation,
  recordDegradationOnce
} from "./chunk-JAU72XNY.js";
import {
  logExtension
} from "./chunk-XTMJ7XDT.js";
import {
  logLatency
} from "./chunk-QQNQ7SJW.js";
import {
  getProcessSingleton
} from "./chunk-AOHZU2BM.js";
import {
  sweepOwnStagingFiles
} from "./chunk-LJDODBBZ.js";
import {
  BoundedFifoMap,
  BoundedSet
} from "./chunk-ABBOA7UD.js";
import {
  Minimatch,
  homeRelativePath,
  isExternalOrVendorFile,
  isFullyQualifiedWin32,
  isRealGitMarker,
  isUnderDir,
  normalizeEphemeralMapKey,
  normalizeFilePath,
  normalizeLoggedPath,
  normalizeMapKey,
  toProjectRelativePath
} from "./chunk-N2H3ZPZY.js";
import {
  __commonJS,
  __require,
  __toESM
} from "./chunk-NXL4FFQQ.js";

// node_modules/pidusage/lib/bin.js
var require_bin = __commonJS({
  "node_modules/pidusage/lib/bin.js"(exports, module) {
    "use strict";
    var spawn2 = __require("child_process").spawn;
    function run(cmd, args, options, done) {
      if (typeof options === "function") {
        done = options;
        options = void 0;
      }
      let executed = false;
      const ch = spawn2(cmd, args, options);
      let stdout = "";
      let stderr = "";
      ch.stdout.on("data", function(d) {
        stdout += d.toString();
      });
      ch.stderr.on("data", function(d) {
        stderr += d.toString();
      });
      ch.on("error", function(err) {
        if (executed) return;
        executed = true;
        done(new Error(err));
      });
      ch.on("close", function(code, signal) {
        if (executed) return;
        executed = true;
        if (stderr) {
          return done(new Error(stderr));
        }
        done(null, stdout, code);
      });
    }
    module.exports = run;
  }
});

// node_modules/pidusage/lib/history.js
var require_history = __commonJS({
  "node_modules/pidusage/lib/history.js"(exports, module) {
    "use strict";
    var DEFAULT_MAXAGE = 6e4;
    var expiration = {};
    var history = {};
    var expireListeners = {};
    var size = 0;
    var interval = null;
    function get(pid, maxage) {
      if (maxage <= 0) {
        return;
      }
      if (history[pid] !== void 0) {
        expiration[pid] = Date.now() + (maxage || DEFAULT_MAXAGE);
      }
      return history[pid];
    }
    function set(pid, object, maxage, onExpire) {
      if (object === void 0 || maxage <= 0) return;
      expiration[pid] = Date.now() + (maxage || DEFAULT_MAXAGE);
      if (history[pid] === void 0) {
        size++;
        sheduleInvalidator(maxage);
      }
      history[pid] = object;
      if (onExpire) {
        expireListeners[pid] = onExpire;
      }
    }
    function sheduleInvalidator(maxage) {
      if (size > 0) {
        if (interval === null) {
          interval = setInterval(runInvalidator, (maxage || DEFAULT_MAXAGE) / 2);
          if (typeof interval.unref === "function") {
            interval.unref();
          }
        }
        return;
      }
      if (interval !== null) {
        clearInterval(interval);
        interval = null;
      }
    }
    function runInvalidator() {
      const now = Date.now();
      const pids = Object.keys(expiration);
      for (let i = 0; i < pids.length; i++) {
        const pid = pids[i];
        if (expiration[pid] < now) {
          size--;
          if (expireListeners[pid]) {
            expireListeners[pid](history[pid]);
          }
          delete history[pid];
          delete expiration[pid];
          delete expireListeners[pid];
        }
      }
      sheduleInvalidator();
    }
    function deleteLoop(obj) {
      for (const i in obj) {
        delete obj[i];
      }
    }
    function clear() {
      if (interval !== null) {
        clearInterval(interval);
        interval = null;
      }
      deleteLoop(history);
      deleteLoop(expiration);
      deleteLoop(expireListeners);
    }
    module.exports = {
      get,
      set,
      clear
    };
  }
});

// node_modules/pidusage/lib/ps.js
var require_ps = __commonJS({
  "node_modules/pidusage/lib/ps.js"(exports, module) {
    "use strict";
    var os3 = __require("os");
    var bin = require_bin();
    var history = require_history();
    var PLATFORM = os3.platform();
    function parseTime(timestr, centisec) {
      let time = 0;
      const tpart = timestr.split(/-|:|\./);
      let i = tpart.length - 1;
      if (i >= 0 && centisec && PLATFORM === "darwin") {
        time += parseInt(tpart[i--], 10) * 10;
      }
      if (i >= 0) {
        time += parseInt(tpart[i--], 10) * 1e3;
      }
      if (i >= 0) {
        time += parseInt(tpart[i--], 10) * 6e4;
      }
      if (i >= 0) {
        time += parseInt(tpart[i--], 10) * 36e5;
      }
      if (i >= 0) {
        time += parseInt(tpart[i--], 10) * 864e5;
      }
      return time;
    }
    function ps(pids, options, done) {
      const pArg = pids.join(",");
      let args = ["-o", "etime,pid,ppid,pcpu,rss,time", "-p", pArg];
      if (PLATFORM === "aix" || PLATFORM === "os400") {
        args = ["-o", "etime,pid,ppid,pcpu,rssize,time", "-p", pArg];
      }
      bin("ps", args, function(err, stdout, code) {
        if (err) {
          if (PLATFORM === "os390" && /no matching processes found/.test(err)) {
            err = new Error("No matching pid found");
            err.code = "ENOENT";
          }
          return done(err);
        }
        if (code === 1) {
          const error = new Error("No matching pid found");
          error.code = "ENOENT";
          return done(error);
        }
        if (code !== 0) {
          return done(new Error("pidusage ps command exited with code " + code));
        }
        const date = Date.now();
        stdout = stdout.split(os3.EOL);
        const statistics = {};
        for (let i = 1; i < stdout.length; i++) {
          const line = stdout[i].trim().split(/\s+/);
          if (!line || line.length !== 6) {
            continue;
          }
          const pid = parseInt(line[1], 10);
          let hst = history.get(pid, options.maxage);
          if (hst === void 0) hst = {};
          const ppid = parseInt(line[2], 10);
          const memory = parseInt(line[4], 10) * 1024;
          const etime = parseTime(line[0]);
          const ctime = parseTime(line[5], true);
          const total = ctime - (hst.ctime || 0);
          const seconds = Math.abs(hst.elapsed !== void 0 ? etime - hst.elapsed : etime);
          const cpu = seconds > 0 ? total / seconds * 100 : 0;
          statistics[pid] = {
            cpu,
            memory,
            ppid,
            pid,
            ctime,
            elapsed: etime,
            timestamp: date
          };
          history.set(pid, statistics[pid], options.maxage);
        }
        done(null, statistics);
      });
    }
    module.exports = ps;
  }
});

// node_modules/pidusage/lib/helpers/parallel.js
var require_parallel = __commonJS({
  "node_modules/pidusage/lib/helpers/parallel.js"(exports, module) {
    function parallel(fns, options, done) {
      if (typeof options === "function") {
        done = options;
        options = {};
      }
      let keys;
      if (!Array.isArray(fns)) {
        keys = Object.keys(fns);
      }
      const length = keys ? keys.length : fns.length;
      let pending = length;
      const results = keys ? {} : [];
      function each(i, err, result) {
        results[i] = result;
        if (--pending === 0 || err && !options.graceful) {
          if (options.graceful && err && length > 1) {
            err = null;
          }
          done && done(err, results);
          done = null;
        }
      }
      if (keys) {
        keys.forEach(function(key) {
          fns[key](function(err, res) {
            each(key, err, res);
          });
        });
      } else {
        fns.forEach(function(fn, i) {
          fn(function(err, res) {
            each(i, err, res);
          });
        });
      }
    }
    module.exports = parallel;
  }
});

// node_modules/pidusage/lib/helpers/cpu.js
var require_cpu = __commonJS({
  "node_modules/pidusage/lib/helpers/cpu.js"(exports, module) {
    var os3 = __require("os");
    var fs9 = __require("fs");
    var exec = __require("child_process").exec;
    var parallel = require_parallel();
    function updateCpu(cpu, next) {
      if (cpu !== null) {
        getRealUptime(function(err, uptime) {
          if (err) return next(err);
          cpu.uptime = uptime;
          next(null, cpu);
        });
        return;
      }
      parallel([
        getClockAndPageSize,
        getRealUptime
      ], function(err, data) {
        if (err) return next(err);
        cpu = {
          clockTick: data[0].clockTick,
          pageSize: data[0].pageSize,
          uptime: data[1]
        };
        next(null, cpu);
      });
    }
    module.exports = updateCpu;
    function getRealUptime(next) {
      fs9.readFile("/proc/uptime", "utf8", function(err, uptime) {
        if (err || uptime === void 0) {
          if (!process.env.PIDUSAGE_SILENT) {
            console.warn("[pidusage] We couldn't find uptime from /proc/uptime, using os.uptime() value");
          }
          return next(null, os3.uptime() || /* @__PURE__ */ new Date() / 1e3);
        }
        return next(null, parseFloat(uptime.split(" ")[0]));
      });
    }
    function getClockAndPageSize(next) {
      parallel([
        function getClockTick(cb) {
          getconf("CLK_TCK", { default: 100 }, cb);
        },
        function getPageSize(cb) {
          getconf("PAGESIZE", { default: 4096 }, cb);
        }
      ], function(err, data) {
        if (err) return next(err);
        next(null, { clockTick: data[0], pageSize: data[1] });
      });
    }
    function getconf(keyword, options, next) {
      if (typeof options === "function") {
        next = options;
        options = { default: "" };
      }
      exec("getconf " + keyword, function(error, stdout, stderr) {
        if (error !== null) {
          if (!process.env.PIDUSAGE_SILENT) {
            console.error('Error while calling "getconf ' + keyword + '"', error);
          }
          return next(null, options.default);
        }
        stdout = parseInt(stdout);
        if (!isNaN(stdout)) {
          return next(null, stdout);
        }
        return next(null, options.default);
      });
    }
  }
});

// node_modules/safe-buffer/index.js
var require_safe_buffer = __commonJS({
  "node_modules/safe-buffer/index.js"(exports, module) {
    var buffer = __require("buffer");
    var Buffer2 = buffer.Buffer;
    function copyProps(src, dst) {
      for (var key in src) {
        dst[key] = src[key];
      }
    }
    if (Buffer2.from && Buffer2.alloc && Buffer2.allocUnsafe && Buffer2.allocUnsafeSlow) {
      module.exports = buffer;
    } else {
      copyProps(buffer, exports);
      exports.Buffer = SafeBuffer;
    }
    function SafeBuffer(arg, encodingOrOffset, length) {
      return Buffer2(arg, encodingOrOffset, length);
    }
    SafeBuffer.prototype = Object.create(Buffer2.prototype);
    copyProps(Buffer2, SafeBuffer);
    SafeBuffer.from = function(arg, encodingOrOffset, length) {
      if (typeof arg === "number") {
        throw new TypeError("Argument must not be a number");
      }
      return Buffer2(arg, encodingOrOffset, length);
    };
    SafeBuffer.alloc = function(size, fill, encoding) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      var buf = Buffer2(size);
      if (fill !== void 0) {
        if (typeof encoding === "string") {
          buf.fill(fill, encoding);
        } else {
          buf.fill(fill);
        }
      } else {
        buf.fill(0);
      }
      return buf;
    };
    SafeBuffer.allocUnsafe = function(size) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      return Buffer2(size);
    };
    SafeBuffer.allocUnsafeSlow = function(size) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      return buffer.SlowBuffer(size);
    };
  }
});

// node_modules/pidusage/lib/procfile.js
var require_procfile = __commonJS({
  "node_modules/pidusage/lib/procfile.js"(exports, module) {
    var fs9 = __require("fs");
    var path12 = __require("path");
    var updateCpu = require_cpu();
    var parallel = require_parallel();
    var history = require_history();
    var cpuInfo = null;
    var Buffer2 = require_safe_buffer().Buffer;
    var SIZE = 1024;
    function noop() {
    }
    function open(path13, history2, cb) {
      if (history2.fd) {
        return cb(null, history2.fd);
      }
      fs9.open(path13, "r", cb);
    }
    function close(history2) {
      if (history2.fd) {
        fs9.close(history2.fd, noop);
      }
    }
    function readUntilEnd(fd, buf, cb) {
      let firstRead = false;
      if (typeof buf === "function") {
        cb = buf;
        buf = Buffer2.alloc(SIZE);
        firstRead = true;
      }
      fs9.read(fd, buf, 0, SIZE, 0, function(err, bytesRead, buffer) {
        if (err) {
          cb(err);
          return;
        }
        const data = Buffer2.concat([buf, buffer], firstRead ? bytesRead : buf.length + bytesRead);
        if (bytesRead === SIZE) {
          readUntilEnd(fd, data, cb);
          return;
        }
        cb(null, buf);
      });
    }
    function readProcFile(pid, options, done) {
      let hst = history.get(pid, options.maxage);
      let again = false;
      if (hst === void 0) {
        again = true;
        hst = {};
      }
      open(path12.join("/proc", "" + pid, "stat"), hst, function(err, fd) {
        if (err) {
          if (err.code === "ENOENT") {
            err.message = "No matching pid found";
          }
          return done(err, null);
        }
        if (err) {
          return done(err);
        }
        readUntilEnd(fd, function(err2, buffer) {
          if (err2) {
            return done(err2);
          }
          let infos = buffer.toString("utf8");
          const date = Date.now();
          const index = infos.lastIndexOf(")");
          infos = infos.substr(index + 2).split(" ");
          const stat = {
            ppid: parseInt(infos[1]),
            utime: parseFloat(infos[11]) * 1e3 / cpuInfo.clockTick,
            stime: parseFloat(infos[12]) * 1e3 / cpuInfo.clockTick,
            cutime: parseFloat(infos[13]) * 1e3 / cpuInfo.clockTick,
            cstime: parseFloat(infos[14]) * 1e3 / cpuInfo.clockTick,
            start: parseFloat(infos[19]) * 1e3 / cpuInfo.clockTick,
            rss: parseFloat(infos[21]),
            uptime: cpuInfo.uptime * 1e3,
            fd
          };
          const memory = stat.rss * cpuInfo.pageSize;
          const childrens = options.childrens ? stat.cutime + stat.cstime : 0;
          const total = stat.stime - (hst.stime || 0) + stat.utime - (hst.utime || 0) + childrens;
          const seconds = Math.abs(hst.uptime !== void 0 ? stat.uptime - hst.uptime : stat.start - stat.uptime);
          const cpu = seconds > 0 ? total / seconds * 100 : 0;
          history.set(pid, stat, options.maxage, close);
          if (again) {
            return readProcFile(pid, options, done);
          }
          return done(null, {
            cpu,
            memory,
            ctime: stat.utime + stat.stime,
            elapsed: stat.uptime - stat.start,
            timestamp: date,
            pid,
            ppid: stat.ppid
          });
        });
      });
    }
    function procfile(pids, options, done) {
      updateCpu(cpuInfo, function(err, result) {
        if (err) return done(err);
        cpuInfo = result;
        const fns = {};
        pids.forEach(function(pid, i) {
          fns[pid] = function(cb) {
            readProcFile(pid, options, cb);
          };
        });
        parallel(fns, { graceful: true }, done);
      });
    }
    module.exports = procfile;
  }
});

// node_modules/pidusage/lib/wmic.js
var require_wmic = __commonJS({
  "node_modules/pidusage/lib/wmic.js"(exports, module) {
    "use strict";
    var os3 = __require("os");
    var bin = require_bin();
    var history = require_history();
    function parseDate(datestr) {
      const year = datestr.substring(0, 4);
      const month = datestr.substring(4, 6);
      const day = datestr.substring(6, 8);
      const hour = datestr.substring(8, 10);
      const minutes = datestr.substring(10, 12);
      const seconds = datestr.substring(12, 14);
      const useconds = datestr.substring(15, 21);
      const sign = datestr.substring(21, 22);
      const tmz = parseInt(datestr.substring(22, 25), 10);
      const tmzh = Math.floor(tmz / 60);
      const tmzm = tmz % 60;
      return /* @__PURE__ */ new Date(
        year + "-" + month + "-" + day + "T" + hour + ":" + minutes + ":" + seconds + "." + useconds + sign + (tmzh > 9 ? tmzh : "0" + tmzh) + (tmzm > 9 ? tmzm : "0" + tmzm)
      );
    }
    function wmic(pids, options, done) {
      let whereClause = "ProcessId=" + pids[0];
      for (let i = 1; i < pids.length; i++) {
        whereClause += " or ProcessId=" + pids[i];
      }
      const args = [
        "PROCESS",
        "where",
        '"' + whereClause + '"',
        "get",
        "CreationDate,KernelModeTime,ParentProcessId,ProcessId,UserModeTime,WorkingSetSize"
      ];
      bin("wmic", args, { windowsHide: true, windowsVerbatimArguments: true }, function(err, stdout, code) {
        if (err) {
          if (err.message.indexOf("No Instance(s) Available.") !== -1) {
            const error = new Error("No matching pid found");
            error.code = "ENOENT";
            return done(error);
          }
          return done(err);
        }
        if (code !== 0) {
          return done(new Error("pidusage wmic command exited with code " + code));
        }
        const date = Date.now();
        const uptime = Math.floor(os3.uptime() || date / 1e3);
        stdout = stdout.split(os3.EOL);
        let again = false;
        const statistics = {};
        for (let i = 1; i < stdout.length; i++) {
          const line = stdout[i].trim().split(/\s+/);
          if (!line || line.length !== 6) {
            continue;
          }
          const creation = parseDate(line[0]);
          const ppid = parseInt(line[2], 10);
          const pid = parseInt(line[3], 10);
          const kerneltime = Math.round(parseInt(line[1], 10) / 1e4);
          const usertime = Math.round(parseInt(line[4], 10) / 1e4);
          const memory = parseInt(line[5], 10);
          let hst = history.get(pid, options.maxage);
          if (hst === void 0) {
            again = true;
            hst = { ctime: kerneltime + usertime, uptime };
          }
          const total = (kerneltime + usertime - hst.ctime) / 1e3;
          const seconds = uptime - hst.uptime;
          const cpu = seconds > 0 ? total / seconds * 100 : 0;
          history.set(pid, { ctime: usertime + kerneltime, uptime }, options.maxage);
          statistics[pid] = {
            cpu,
            memory,
            ppid,
            pid,
            ctime: usertime + kerneltime,
            elapsed: date - creation.getTime(),
            timestamp: date
          };
        }
        if (again) {
          return wmic(pids, options, function(err2, stats) {
            if (err2) return done(err2);
            done(null, Object.assign(statistics, stats));
          });
        }
        done(null, statistics);
      });
    }
    module.exports = wmic;
  }
});

// node_modules/pidusage/lib/gwmi.js
var require_gwmi = __commonJS({
  "node_modules/pidusage/lib/gwmi.js"(exports, module) {
    "use strict";
    var os3 = __require("os");
    var bin = require_bin();
    var history = require_history();
    function parseDate(datestr) {
      const year = datestr.substring(0, 4);
      const month = datestr.substring(4, 6);
      const day = datestr.substring(6, 8);
      const hour = datestr.substring(8, 10);
      const minutes = datestr.substring(10, 12);
      const seconds = datestr.substring(12, 14);
      const useconds = datestr.substring(15, 21);
      const sign = datestr.substring(21, 22);
      const tmz = parseInt(datestr.substring(22, 25), 10);
      const tmzh = Math.floor(tmz / 60);
      const tmzm = tmz % 60;
      return /* @__PURE__ */ new Date(
        year + "-" + month + "-" + day + "T" + hour + ":" + minutes + ":" + seconds + "." + useconds + sign + (tmzh > 9 ? tmzh : "0" + tmzh) + (tmzm > 9 ? tmzm : "0" + tmzm)
      );
    }
    function gwmi(pids, options, done) {
      let whereClause = "ProcessId=" + pids[0];
      for (let i = 1; i < pids.length; i++) {
        whereClause += " or ProcessId=" + pids[i];
      }
      const property = "CreationDate,KernelModeTime,ParentProcessId,ProcessId,UserModeTime,WorkingSetSize";
      const args = ["win32_process", "-Filter", "'" + whereClause + "'", "| select " + property, "| format-table"];
      bin("gwmi", args, { windowsHide: true, windowsVerbatimArguments: true, shell: "powershell.exe" }, function(err, stdout, code) {
        if (err) {
          if (err.message.indexOf("No Instance(s) Available.") !== -1) {
            const error = new Error("No matching pid found");
            error.code = "ENOENT";
            return done(error);
          }
          return done(err);
        }
        if (code !== 0) {
          return done(new Error("pidusage gwmi command exited with code " + code));
        }
        const date = Date.now();
        const uptime = Math.floor(os3.uptime() || date / 1e3);
        stdout = stdout.split(os3.EOL).slice(1);
        const index = stdout.findIndex((v) => !!v);
        stdout = stdout.slice(index + 2);
        if (!stdout.length) {
          const error = new Error("No matching pid found");
          error.code = "ENOENT";
          return done(error);
        }
        let again = false;
        const statistics = {};
        for (let i = 0; i < stdout.length; i++) {
          const line = stdout[i].trim().split(/\s+/);
          if (!line || line.length === 1) {
            continue;
          }
          const creation = parseDate(line[0]);
          const ppid = parseInt(line[2], 10);
          const pid = parseInt(line[3], 10);
          const kerneltime = Math.round(parseInt(line[1], 10) / 1e4);
          const usertime = Math.round(parseInt(line[4], 10) / 1e4);
          const memory = parseInt(line[5], 10);
          let hst = history.get(pid, options.maxage);
          if (hst === void 0) {
            again = true;
            hst = { ctime: kerneltime + usertime, uptime };
          }
          const total = (kerneltime + usertime - hst.ctime) / 1e3;
          const seconds = uptime - hst.uptime;
          const cpu = seconds > 0 ? total / seconds * 100 : 0;
          history.set(pid, { ctime: usertime + kerneltime, uptime }, options.maxage);
          statistics[pid] = {
            cpu,
            memory,
            ppid,
            pid,
            ctime: usertime + kerneltime,
            elapsed: date - creation.getTime(),
            timestamp: date
          };
        }
        if (again) {
          return gwmi(pids, options, function(err2, stats) {
            if (err2) return done(err2);
            done(null, Object.assign(statistics, stats));
          });
        }
        done(null, statistics);
      });
    }
    module.exports = gwmi;
  }
});

// node_modules/pidusage/lib/stats.js
var require_stats = __commonJS({
  "node_modules/pidusage/lib/stats.js"(exports, module) {
    "use strict";
    var fs9 = __require("fs");
    var os3 = __require("os");
    var spawn2 = __require("child_process").spawn;
    var requireMap = {
      ps: () => require_ps(),
      procfile: () => require_procfile(),
      wmic: () => require_wmic(),
      gwmi: () => require_gwmi()
    };
    var platformToMethod = {
      aix: "ps",
      os400: "ps",
      android: "procfile",
      alpine: "procfile",
      darwin: "ps",
      freebsd: "ps",
      os390: "ps",
      linux: "procfile",
      netbsd: "procfile",
      openbsd: "ps",
      sunos: "ps",
      win: "wmic"
    };
    var platform = os3.platform();
    if (fs9.existsSync("/etc/alpine-release")) {
      platform = "alpine";
    }
    if (platform.match(/^win/)) {
      platform = "win";
    }
    var stat;
    try {
      stat = requireMap[platformToMethod[platform]]();
    } catch (err) {
    }
    function get(pids, options, callback) {
      let fn = stat;
      if (platform !== "win" && options.usePs === true) {
        fn = requireMap.ps();
      }
      if (platform === "win") {
        let child;
        try {
          child = spawn2("wmic", function(err) {
            if (err) throw new Error(err);
          });
        } catch (err) {
          fn = requireMap.gwmi();
        } finally {
          if (child) {
            child.kill();
          }
        }
      }
      if (fn === void 0) {
        return callback(new Error(os3.platform() + " is not supported yet, please open an issue (https://github.com/soyuka/pidusage)"));
      }
      let single = false;
      if (!Array.isArray(pids)) {
        single = true;
        pids = [pids];
      }
      if (pids.length === 0) {
        return callback(new TypeError("You must provide at least one pid"));
      }
      for (let i = 0; i < pids.length; i++) {
        pids[i] = parseInt(pids[i], 10);
        if (isNaN(pids[i]) || pids[i] < 0) {
          return callback(new TypeError("One of the pids provided is invalid"));
        }
      }
      fn(pids, options, function(err, stats) {
        if (err) {
          return callback(err);
        }
        if (single) {
          callback(null, stats[pids[0]]);
        } else {
          callback(null, stats);
        }
      });
    }
    module.exports = get;
  }
});

// node_modules/pidusage/index.js
var require_pidusage = __commonJS({
  "node_modules/pidusage/index.js"(exports, module) {
    "use strict";
    var stats = require_stats();
    function pidusage2(pids, options, callback) {
      if (typeof options === "function") {
        callback = options;
        options = {};
      }
      if (options === void 0) {
        options = {};
      }
      options = Object.assign({
        usePs: /^true$/i.test(process.env.PIDUSAGE_USE_PS),
        maxage: process.env.PIDUSAGE_MAXAGE
      }, options);
      if (typeof callback === "function") {
        stats(pids, options, callback);
        return;
      }
      return new Promise(function(resolve6, reject) {
        stats(pids, options, function(err, data) {
          if (err) return reject(err);
          resolve6(data);
        });
      });
    }
    module.exports = pidusage2;
    module.exports.clear = require_history().clear;
  }
});

// dist/clients/safe-spawn.js
import { spawn, spawnSync } from "node:child_process";
import * as fs8 from "node:fs";
import * as path11 from "node:path";

// dist/clients/resource-sampler.js
var import_pidusage = __toESM(require_pidusage(), 1);

// dist/clients/instance-reaper.js
import { spawn as nodeSpawn2 } from "node:child_process";

// dist/clients/bounded-pid-file-lock.js
import { randomUUID } from "node:crypto";
import * as fs2 from "node:fs";
import fsp from "node:fs/promises";
import path2 from "node:path";

// dist/clients/generation-lock.js
import { randomInt } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
var GENERATION = /^lock\.(\d+)(\.released)?$/;
function pidFileOwner(file) {
  try {
    const pid = Number(fs.readFileSync(file, "utf8").trim().split(/\s+/)[0]);
    return Number.isInteger(pid) && pid > 0 ? pid : void 0;
  } catch {
    return void 0;
  }
}
function isPidAlive(pid) {
  if (pid === void 0)
    return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code !== "ESRCH";
  }
}
function pidFileIsStale(file, staleMs) {
  try {
    const stat = fs.statSync(file);
    if (Date.now() - stat.mtimeMs > staleMs)
      return true;
    const pid = pidFileOwner(file);
    return pid !== void 0 && !isPidAlive(pid);
  } catch {
    return false;
  }
}
function isLockContention(error) {
  const code = error?.code;
  return code === "EEXIST" || code === "EPERM" || code === "EBUSY";
}
function generationPath(dir, generation) {
  return path.join(dir, `lock.${generation}`);
}
function releasedName(generation) {
  return `lock.${generation}.released`;
}
function topGeneration(entries) {
  let top = 0;
  for (const name of entries) {
    const match = GENERATION.exec(name);
    if (match && !match[2])
      top = Math.max(top, Number(match[1]));
  }
  return top;
}
function removeBelowPredecessor(dir, entries, generation) {
  for (const name of entries) {
    const match = GENERATION.exec(name);
    if (!match || Number(match[1]) + 1 >= generation)
      continue;
    try {
      fs.unlinkSync(path.join(dir, name));
    } catch {
    }
  }
}
function recordGenerationTakeover(hold) {
  incrementDegradationCount({
    kind: "generation-lock-stale-takeover",
    subject: path.resolve(hold.dir),
    reason: `took over lock generation ${hold.generation - 1} from a dead or aged-out holder`
  });
}
function recordLegacyLockHeld(legacyPath) {
  incrementDegradationCount({
    kind: "generation-lock-legacy-held",
    subject: path.resolve(legacyPath),
    reason: `backed off: ${path.basename(legacyPath)} is held by another writer (one from before #3476, or a holder past the generation lease)`
  });
}
function releaseGeneration(hold) {
  try {
    fs.writeFileSync(path.join(hold.dir, releasedName(hold.generation)), "");
  } catch {
  }
}
function heartbeatIntervalMs(leaseMs) {
  return Math.max(1e3, Math.floor(leaseMs / 4));
}
function startGenerationHeartbeat(hold, intervalMs) {
  const file = generationPath(hold.dir, hold.generation);
  const timer = setInterval(() => {
    try {
      const now = /* @__PURE__ */ new Date();
      fs.utimesSync(file, now, now);
    } catch {
    }
  }, intervalMs);
  timer.unref();
  return { stop: () => clearInterval(timer) };
}
function ownsTopGeneration(hold) {
  try {
    const entries = fs.readdirSync(hold.dir);
    if (entries.includes(releasedName(hold.generation)))
      return false;
    return topGeneration(entries) === hold.generation;
  } catch {
    return false;
  }
}
function tryAcquireGeneration(dir, staleMs) {
  fs.mkdirSync(dir, { recursive: true });
  const listed = fs.readdirSync(dir);
  const top = topGeneration(listed);
  const free = top === 0 || listed.includes(releasedName(top));
  if (!free && !pidFileIsStale(generationPath(dir, top), staleMs)) {
    return void 0;
  }
  const hold = { dir, generation: top + 1, tookOverStale: !free };
  try {
    fs.writeFileSync(generationPath(dir, hold.generation), `${process.pid} ${Date.now()}
`, { flag: "wx" });
  } catch (error) {
    if (isLockContention(error))
      return void 0;
    throw error;
  }
  let entries;
  try {
    entries = fs.readdirSync(dir);
  } catch (cause) {
    releaseGeneration(hold);
    throw cause;
  }
  if (topGeneration(entries) > hold.generation) {
    releaseGeneration(hold);
    return void 0;
  }
  removeBelowPredecessor(dir, entries, hold.generation);
  return hold;
}
var timedOutHolders = new BoundedFifoMap(16);
function topGenerationHolder(dir) {
  try {
    const top = topGeneration(fs.readdirSync(dir));
    return `lock.${top} ${fs.readFileSync(generationPath(dir, top), "utf8").trim()}`;
  } catch {
    return void 0;
  }
}
function withGenerationLockSync(dir, timing, op) {
  const deadline = Date.now() + timing.waitMs;
  const timedOutHolder = timedOutHolders.get(dir);
  for (; ; ) {
    let hold;
    try {
      hold = tryAcquireGeneration(dir, timing.staleMs);
    } catch (cause) {
      return { held: false, cause };
    }
    if (hold) {
      if (hold.tookOverStale)
        recordGenerationTakeover(hold);
      try {
        return { held: true, value: op() };
      } finally {
        releaseGeneration(hold);
      }
    }
    if (timedOutHolder !== void 0 && topGenerationHolder(dir) === timedOutHolder) {
      recordDegradationOnce({
        kind: "generation-lock-wait-skipped",
        subject: dir,
        reason: `did not wait: ${timedOutHolder} still holds the lock after an earlier wait ran out`
      });
      return { held: false };
    }
    if (Date.now() >= deadline) {
      timedOutHolders.set(dir, topGenerationHolder(dir));
      return { held: false };
    }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, randomInt(5, 26));
  }
}

// dist/clients/bounded-pid-file-lock.js
var waitArray = new Int32Array(new SharedArrayBuffer(4));
var UNREADABLE_LOCK_STALE_MS = 5e3;
function generationDir(lockPath) {
  return `${lockPath}s`;
}
function boundedLockIsStale(lockPath) {
  const [pidText] = fs2.readFileSync(lockPath, "utf8").split(":", 1);
  const pid = Number.parseInt(pidText ?? "", 10);
  if (Number.isSafeInteger(pid) && pid > 0)
    return !ownerPidIsLive(pid);
  return Date.now() - fs2.statSync(lockPath).mtimeMs > UNREADABLE_LOCK_STALE_MS;
}
function ownerPidIsLive(pid) {
  if (!Number.isSafeInteger(pid) || pid <= 0)
    return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === "EPERM";
  }
}
function quarantinePath(lockPath, token) {
  return `${lockPath}.quarantine-${process.pid}-${token}`;
}
async function restoreQuarantinedLock(lockPath, quarantined) {
  try {
    await fsp.rename(quarantined, lockPath);
  } catch {
  }
}
async function releaseQuarantineLock(lockPath, token) {
  const quarantined = quarantinePath(lockPath, `release-${token}`);
  let renamed = false;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await fsp.rename(lockPath, quarantined);
      renamed = true;
      break;
    } catch (error) {
      if (error.code !== "ENOENT" || attempt === 2)
        return;
      await new Promise((resolve6) => setImmediate(resolve6));
    }
  }
  if (!renamed)
    return;
  try {
    const owner = JSON.parse(await fsp.readFile(path2.join(quarantined, "owner.json"), "utf8"));
    if (owner.token === token) {
      await fsp.rm(quarantined, { recursive: true, force: true });
    } else {
      await restoreQuarantinedLock(lockPath, quarantined);
    }
  } catch {
    await restoreQuarantinedLock(lockPath, quarantined);
  }
}
function quarantineOwnerIsStale(owner, staleMs) {
  const pidUsable = Number.isInteger(owner.pid) && owner.pid > 0;
  if (pidUsable && !ownerPidIsLive(owner.pid))
    return true;
  return Number.isFinite(owner.createdAt) && Date.now() - owner.createdAt > staleMs;
}
async function reclaimQuarantineLock(lockPath, staleMs) {
  const quarantined = quarantinePath(lockPath, `reclaim-${Date.now()}-${randomUUID()}`);
  try {
    await fsp.rename(lockPath, quarantined);
  } catch {
    return false;
  }
  let stale = false;
  try {
    const owner = JSON.parse(await fsp.readFile(path2.join(quarantined, "owner.json"), "utf8"));
    stale = quarantineOwnerIsStale(owner, staleMs);
  } catch {
    try {
      stale = Date.now() - (await fsp.stat(quarantined)).mtimeMs > staleMs;
    } catch {
      stale = false;
    }
  }
  if (stale) {
    await fsp.rm(quarantined, { recursive: true, force: true });
    return true;
  }
  await restoreQuarantinedLock(lockPath, quarantined);
  return false;
}
async function tryAcquireQuarantineLock(lockPath, staleMs) {
  const owner = {
    pid: process.pid,
    createdAt: Date.now(),
    token: `${process.pid}-${Date.now()}-${randomUUID()}`
  };
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await fsp.mkdir(lockPath);
      try {
        await fsp.writeFile(path2.join(lockPath, "owner.json"), JSON.stringify(owner), "utf8");
      } catch (error) {
        await fsp.rm(lockPath, { recursive: true, force: true }).catch(() => {
        });
        throw error;
      }
      return () => releaseQuarantineLock(lockPath, owner.token);
    } catch (error) {
      if (error.code !== "EEXIST")
        throw error;
    }
    let stale;
    try {
      const existing = JSON.parse(await fsp.readFile(path2.join(lockPath, "owner.json"), "utf8"));
      stale = quarantineOwnerIsStale(existing, staleMs);
    } catch {
      try {
        stale = Date.now() - (await fsp.stat(lockPath)).mtimeMs > staleMs;
      } catch {
        stale = true;
      }
    }
    if (!stale || !await reclaimQuarantineLock(lockPath, staleMs))
      return null;
  }
  return null;
}
async function tryAcquireQuarantineGeneration(lockPath, staleMs) {
  const hold = tryAcquireGeneration(generationDir(lockPath), staleMs);
  if (!hold)
    return "busy";
  if (hold.tookOverStale)
    recordGenerationTakeover(hold);
  let releaseLegacy;
  try {
    releaseLegacy = await tryAcquireQuarantineLock(lockPath, staleMs);
  } catch (cause) {
    releaseGeneration(hold);
    throw cause;
  }
  if (releaseLegacy) {
    const heartbeat = startGenerationHeartbeat(hold, heartbeatIntervalMs(staleMs));
    return async () => {
      heartbeat.stop();
      await releaseLegacy();
      releaseGeneration(hold);
    };
  }
  releaseGeneration(hold);
  return "legacy-held";
}
async function acquireQuarantinePidFileLock(lockPath, options) {
  const deadline = Date.now() + options.waitMs;
  let legacyHeldRecorded = false;
  for (; ; ) {
    const release2 = await tryAcquireQuarantineGeneration(lockPath, options.staleMs);
    if (typeof release2 === "function")
      return release2;
    if (release2 === "legacy-held" && !legacyHeldRecorded) {
      legacyHeldRecorded = true;
      recordLegacyLockHeld(lockPath);
    }
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      if (options.onContention === "skip-log") {
        options.logContention();
        return null;
      }
      throw new Error(options.timeoutMessage);
    }
    await new Promise((resolve6) => setTimeout(resolve6, Math.min(options.retryMs, remaining)));
  }
}
function createLegacyBoundedLock(lockPath, token) {
  try {
    fs2.writeFileSync(lockPath, token, { encoding: "utf8", flag: "wx" });
    return true;
  } catch (cause) {
    if (isLockContention(cause))
      return false;
    throw cause;
  }
}
function takeLegacyBoundedLock(lockPath, token) {
  if (createLegacyBoundedLock(lockPath, token))
    return true;
  try {
    if (!boundedLockIsStale(lockPath))
      return false;
    fs2.unlinkSync(lockPath);
  } catch {
    return false;
  }
  return createLegacyBoundedLock(lockPath, token);
}
function releaseLegacyBoundedLock(lockPath, token) {
  try {
    if (fs2.readFileSync(lockPath, "utf8") === token)
      fs2.unlinkSync(lockPath);
  } catch {
  }
}
function tryAcquireBoundedLock(lockPath, token) {
  const hold = tryAcquireGeneration(generationDir(lockPath), UNREADABLE_LOCK_STALE_MS);
  if (!hold)
    return "busy";
  if (hold.tookOverStale)
    recordGenerationTakeover(hold);
  let took;
  try {
    took = takeLegacyBoundedLock(lockPath, token);
  } catch (cause) {
    releaseGeneration(hold);
    throw cause;
  }
  if (took)
    return hold;
  releaseGeneration(hold);
  return "legacy-held";
}
var timedOutHolders2 = new BoundedFifoMap(16);
function currentHolderIdentity(dir, lockPath, hold) {
  if (hold === "busy")
    return topGenerationHolder(dir);
  try {
    const content = fs2.readFileSync(lockPath, "utf8");
    return content ? `legacy ${content}` : void 0;
  } catch {
    return void 0;
  }
}
function acquireBoundedPidFileLock(lockPath, options) {
  const token = `${process.pid}:${Date.now()}:${randomUUID()}`;
  const deadline = Date.now() + options.waitMs;
  const dir = generationDir(lockPath);
  const timedOutHolder = timedOutHolders2.get(dir);
  let legacyHeldRecorded = false;
  for (; ; ) {
    const hold = tryAcquireBoundedLock(lockPath, token);
    if (typeof hold === "object") {
      return () => {
        releaseLegacyBoundedLock(lockPath, token);
        releaseGeneration(hold);
      };
    }
    if (hold === "legacy-held" && !legacyHeldRecorded) {
      legacyHeldRecorded = true;
      recordLegacyLockHeld(lockPath);
    }
    if (timedOutHolder !== void 0 && currentHolderIdentity(dir, lockPath, hold) === timedOutHolder) {
      recordDegradationOnce({
        kind: "bounded-pid-lock-wait-skipped",
        subject: path2.resolve(dir),
        reason: `did not wait: ${timedOutHolder} still holds the lock after an earlier wait ran out`
      });
      if (options.onContention === "skip-log") {
        options.logContention();
        return null;
      }
      throw new Error(options.timeoutMessage);
    }
    if (Date.now() >= deadline) {
      timedOutHolders2.set(dir, currentHolderIdentity(dir, lockPath, hold));
      if (options.onContention === "skip-log") {
        options.logContention();
        return null;
      }
      throw new Error(options.timeoutMessage);
    }
    Atomics.wait(waitArray, 0, 0, options.retryMs);
  }
}

// dist/clients/child-unref.js
import { spawn as nodeSpawn } from "node:child_process";
function unrefChildAndPipes(child) {
  try {
    child.unref();
    for (const stream of [child.stdout, child.stderr, child.stdin]) {
      stream?.unref?.();
    }
  } catch {
  }
}
function spawnCollectStdoutResult(command, args, options, collectOptions = {}) {
  return new Promise((resolve6) => {
    let settled = false;
    let timer;
    const settle = (result) => {
      if (settled)
        return;
      settled = true;
      if (timer)
        clearTimeout(timer);
      resolve6(result);
    };
    try {
      const child = nodeSpawn(command, args, options);
      unrefChildAndPipes(child);
      const out = createBoundedOutputSink();
      child.stdout?.on("data", (chunk) => out.append(chunk));
      child.once("error", (error) => settle({ stdout: "", status: "spawn-error", error }));
      child.once("close", (code, signal) => settle(code === 0 && signal === null ? { stdout: out.text, status: "ok" } : {
        stdout: "",
        status: "exit-error",
        exitCode: code,
        exitSignal: signal
      }));
      const timeoutMs = collectOptions.timeoutMs;
      if (typeof timeoutMs === "number" && timeoutMs > 0) {
        timer = setTimeout(() => {
          void terminateTimedOutChild(child, collectOptions.onTimeout).then((timeoutKill) => settle({ stdout: out.text, status: "timeout", timeoutKill }));
        }, timeoutMs);
        timer.unref();
      }
    } catch (error) {
      settle({ stdout: "", status: "spawn-error", error });
    }
  });
}
async function terminateTimedOutChild(child, onTimeout) {
  if (onTimeout) {
    try {
      return await onTimeout(child);
    } catch {
      return "unverified";
    }
  }
  try {
    child.kill();
  } catch {
  }
  return "unverified";
}

// dist/clients/file-utils.js
import * as fs4 from "node:fs";
import { createHash, randomBytes } from "node:crypto";
import * as os2 from "node:os";
import * as path7 from "node:path";

// dist/clients/spawn-timeout-cooldown.js
import path3 from "node:path";
var COOLDOWN_STATE_KEY = /* @__PURE__ */ Symbol.for("pi-lens:spawn-timeout-cooldown");
var _global = globalThis;
if (!_global[COOLDOWN_STATE_KEY]) {
  _global[COOLDOWN_STATE_KEY] = { timedOutByCommand: /* @__PURE__ */ new Map() };
}
var timedOutByCommand = _global[COOLDOWN_STATE_KEY].timedOutByCommand;
function wrapperKindOf(command) {
  const ext = path3.extname(command);
  return ext ? ext.slice(1) : "bare";
}
function cooldownKey(command) {
  return path3.basename(command).replace(/\.[^.]+$/, "").toLowerCase();
}
function noteSpawnTimeout(input) {
  const key = cooldownKey(input.command);
  timedOutByCommand.set(key, {
    tool: input.tool,
    command: input.command,
    phase: input.phase,
    atMs: Date.now()
  });
  logLatency({
    type: "phase",
    toolName: input.tool,
    phase: "spawn_timeout_cooldown",
    filePath: normalizeLoggedPath(input.command),
    durationMs: input.durationMs ?? 0,
    status: "cooldown_armed",
    metadata: {
      command: input.command,
      wrapperKind: wrapperKindOf(input.command),
      timeoutPhase: input.phase,
      ...input.durationMs !== void 0 && {
        timeoutBudgetMs: input.durationMs
      },
      ...input.teardown && {
        teardownMs: input.teardown.ms,
        teardownOutcome: input.teardown.outcome
      }
    }
  });
}
function isInSpawnTimeoutCooldown(command) {
  return timedOutByCommand.has(cooldownKey(command));
}
function resetSpawnTimeoutCooldowns() {
  timedOutByCommand.clear();
}

// dist/clients/git-tracked-ignore.js
import * as path4 from "node:path";
function recordTruncatedLsFiles(parseSite) {
  recordDegradationOnce({
    kind: "git-tracked-ignore-truncated",
    subject: `git-ls-files:${parseSite}`,
    reason: "safeSpawnAsync capped git ls-files stdout"
  });
}
var MAX_LS_FILES_OUTPUT_BYTES = 16 * 1024 * 1024;
function parseUntrackedIgnoredOutput(stdout, cwd) {
  const ids = /* @__PURE__ */ new Set();
  for (const line of stdout.split(/\r?\n/)) {
    const rel = line.trim();
    if (!rel)
      continue;
    const dirSegments = rel.split("/").slice(0, -1);
    if (dirSegments.some((segment) => isExcludedDirName(segment)))
      continue;
    ids.add(normalizeMapKey(path4.join(cwd, rel)));
  }
  return ids;
}
async function fetchUntrackedIgnoredIds(cwd) {
  try {
    const result = await safeSpawnAsync("git", ["ls-files", "--others", "--ignored", "--exclude-standard"], {
      cwd,
      timeout: 1e4,
      maxOutputBytes: MAX_LS_FILES_OUTPUT_BYTES,
      resourceLabel: "git-tracked-ignore"
    });
    if (truncatedByOutputCap(result)) {
      recordTruncatedLsFiles("untracked-ignored");
      return void 0;
    }
    if (result.error || result.status !== 0)
      return void 0;
    return parseUntrackedIgnoredOutput(result.stdout, cwd);
  } catch {
    return void 0;
  }
}
var CACHE_TTL_MS = 3e4;
var _cache = /* @__PURE__ */ new Map();
function collectUntrackedIgnoredIds(cwd) {
  const key = normalizeMapKey(cwd);
  const now = Date.now();
  const cached = _cache.get(key);
  if (cached && now - cached.fetchedAtMs < CACHE_TTL_MS)
    return cached.promise;
  const promise = fetchUntrackedIgnoredIds(cwd);
  _cache.set(key, { promise, fetchedAtMs: now });
  return promise;
}
function parseTrackedFilesOutput(stdout, cwd) {
  const ids = /* @__PURE__ */ new Set();
  const base = normalizeMapKey(cwd);
  for (const line of stdout.split(/\r?\n/)) {
    const rel = line.trim();
    if (!rel)
      continue;
    const dirSegments = rel.split("/").slice(0, -1);
    if (dirSegments.some((segment) => isExcludedDirName(segment)))
      continue;
    ids.add(normalizeEphemeralMapKey(path4.join(base, rel)));
  }
  return ids;
}
async function fetchTrackedFiles(cwd) {
  try {
    const result = await safeSpawnAsync("git", ["ls-files"], {
      cwd,
      timeout: 1e4,
      maxOutputBytes: MAX_LS_FILES_OUTPUT_BYTES,
      resourceLabel: "git-tracked-ignore"
    });
    if (truncatedByOutputCap(result)) {
      recordTruncatedLsFiles("tracked");
      return void 0;
    }
    if (result.error || result.status !== 0)
      return void 0;
    return parseTrackedFilesOutput(result.stdout, cwd);
  } catch {
    return void 0;
  }
}
var _trackedCache = /* @__PURE__ */ new Map();
var _trackedSnapshot = /* @__PURE__ */ new Map();
function collectTrackedFiles(cwd) {
  const key = normalizeEphemeralMapKey(cwd);
  const now = Date.now();
  for (const [snapshotKey, entry] of _trackedCache) {
    if (now - entry.fetchedAtMs >= CACHE_TTL_MS)
      _trackedSnapshot.delete(snapshotKey);
  }
  const cached = _trackedCache.get(key);
  if (cached && now - cached.fetchedAtMs < CACHE_TTL_MS)
    return cached.promise;
  const promise = fetchTrackedFiles(cwd).then((result) => {
    _trackedSnapshot.set(key, result);
    return result;
  });
  _trackedCache.set(key, { promise, fetchedAtMs: now });
  return promise;
}
function getTrackedFilesSnapshot(cwd) {
  return _trackedSnapshot.get(normalizeEphemeralMapKey(cwd));
}

// dist/clients/lens-config.js
import * as path5 from "node:path";
function globalCanonicalLocation() {
  const location = GLOBAL_CONFIG_LOCATIONS.find((candidate) => candidate.relativePath === CANONICAL_GLOBAL_CONFIG_FILE);
  if (!location) {
    throw new Error(`no canonical global config location named ${CANONICAL_GLOBAL_CONFIG_FILE}`);
  }
  return location;
}
function warnInvalidGlobalConfigOnce(configPath, reason, code) {
  warnIgnoredConfigOnce({
    subsystem: "lens-config",
    file: configPath,
    reason,
    ...code === void 0 ? {} : { code }
  });
}
function asConfigObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : void 0;
}
function reportGlobalConfigProbeRetention() {
  const resolution = getProductionGlobalConfigResolution();
  if (resolution.source !== "legacy-default-unprobed" && resolution.source !== "pi-coding-agent-dir-unprobed") {
    return;
  }
  recordDegradationOnce({
    kind: "config-location-probe-failed",
    subject: resolution.path,
    // #3704/#3696: subject already carries the unbounded path; keep the
    // fixed diagnostic ahead of it so the ledger cap cannot erase it.
    reason: `existence probe failed (${resolution.existsProbeFailed?.errorClassName}); the location is retained as the config source and its read failures report through PILENS_CFG_0001`,
    metadata: { subsystem: "lens-config", configPath: resolution.path }
  });
}
function reportGlobalConfigShadowing() {
  const resolution = getProductionGlobalConfigResolution();
  if (resolution.shadowedPath === void 0)
    return;
  const winningPath = canonicalPathIdentity(resolution.path);
  const shadowedPath = canonicalPathIdentity(resolution.shadowedPath);
  recordDegradationOnce({
    kind: "config-location-shadowed",
    subject: winningPath,
    reason: `shadowed global config ${shadowedPath}; winning path is the record subject`,
    metadata: {
      subsystem: "lens-config",
      configPath: winningPath,
      shadowedPath
    },
    code: "PILENS_CFG_0010"
  });
}
function loadPiLensGlobalConfig(configPath) {
  const derivedPath = configPath === void 0;
  if (derivedPath) {
    reportGlobalConfigProbeRetention();
    reportGlobalConfigShadowing();
  }
  const resolvedPath = configPath ?? getPiLensGlobalConfigPath();
  const location = globalCanonicalLocation();
  const outcome = readConfigDocument(resolvedPath);
  if (outcome.status === "missing")
    return void 0;
  if (outcome.status === "error") {
    reportConfigReadFailure({
      file: resolvedPath,
      location,
      tier: "global",
      error: outcome.error,
      sourceText: outcome.sourceText
    });
    return void 0;
  }
  const { note, records: notedRecords } = ignoredRecordCollector(resolvedPath, "global");
  try {
    const parsed = outcome.value;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      note("top-level value must be an object");
      return void 0;
    }
    const document = {
      tier: "global",
      file: resolvedPath,
      location,
      value: parsed
    };
    const resolved = resolveOnePiLensConfigDocument(document);
    reportPiLensConfigRecords(resolved.records);
    const raw = resolved.value;
    const warnInvalid = note;
    const config = {};
    const toolConfig = readToolConfig(raw, warnInvalid);
    if (toolConfig)
      config.tools = toolConfig;
    for (const spec of LENS_FLAGS) {
      if (spec.readGlobal)
        continue;
      assignFlagConfigSection(raw, config, spec.configKey, warnInvalid);
    }
    const ignore = Array.isArray(raw.ignore) ? raw.ignore.filter((p) => typeof p === "string") : void 0;
    if (ignore && ignore.length > 0)
      config.ignore = ignore;
    const startup = asConfigObject(raw.startup);
    if (startup) {
      const startupConfig = {};
      const mode = startup.mode;
      const scans = asConfigObject(startup.scans);
      if (mode === "quick" || mode === "full" || mode === "minimal")
        startupConfig.mode = mode;
      else if ("mode" in startup)
        warnInvalid('startup.mode must be "quick", "full", or "minimal"');
      if (scans) {
        if (typeof scans.enabled === "boolean") {
          startupConfig.scans = { enabled: scans.enabled };
        } else if ("enabled" in scans)
          warnInvalid("startup.scans.enabled must be a boolean");
      }
      if (startupConfig.mode !== void 0 || startupConfig.scans !== void 0)
        config.startup = startupConfig;
    }
    const dispatch = asConfigObject(raw.dispatch);
    if (dispatch) {
      const floor = dispatch.runnerTimeoutFloorMs;
      if (typeof floor === "number" && Number.isFinite(floor) && floor > 0) {
        config.dispatch = { runnerTimeoutFloorMs: floor };
      } else {
        if ("runnerTimeoutFloorMs" in dispatch) {
          warnInvalid("dispatch.runnerTimeoutFloorMs must be a positive finite number");
        }
        config.dispatch = { runnerTimeoutFloorMs: void 0 };
      }
    }
    const autoFix = asConfigObject(asConfigObject(raw.actionableWarnings)?.autoFix);
    if (autoFix && "maxFixes" in autoFix) {
      if (typeof autoFix.maxFixes === "number" && Number.isFinite(autoFix.maxFixes) && autoFix.maxFixes >= 0) {
        config.actionableWarnings ??= {};
        const warnings = config.actionableWarnings;
        warnings.autoFix ??= {};
        warnings.autoFix.maxFixes = Math.floor(autoFix.maxFixes);
      } else {
        warnInvalid("actionableWarnings.autoFix.maxFixes must be a non-negative finite number");
      }
    }
    const contextInjection = asConfigObject(raw.contextInjection);
    if (contextInjection && "requirePreExistingFixes" in contextInjection) {
      if (typeof contextInjection.requirePreExistingFixes === "boolean") {
        config.contextInjection ??= {};
        config.contextInjection.requirePreExistingFixes = contextInjection.requirePreExistingFixes;
      } else {
        warnInvalid("contextInjection.requirePreExistingFixes must be a boolean");
      }
    }
    const widget = asConfigObject(raw.widget);
    if (widget) {
      if (typeof widget.visible === "boolean") {
        config.widget = { visible: widget.visible };
      } else {
        if ("visible" in widget) {
          warnInvalid("widget.visible must be a boolean");
        }
        config.widget = { visible: void 0 };
      }
    }
    const format = asConfigObject(raw.format);
    if (format) {
      config.format ??= {};
      const formatSection = config.format;
      if (format.mode === "immediate" || format.mode === "deferred") {
        formatSection.mode = format.mode;
      } else {
        if ("mode" in format) {
          warnInvalid('format.mode must be "immediate" or "deferred"');
        }
        formatSection.mode = void 0;
      }
    }
    const knownGlobalConfigKeys = /* @__PURE__ */ new Set([
      ...flagConfigSectionKeys(LENS_FLAGS),
      ...GLOBAL_NON_FLAG_CONFIG_SECTIONS,
      ...LEGACY_ROOT_LSP_KEYS
    ]);
    for (const key of Object.keys(raw)) {
      if (!knownGlobalConfigKeys.has(key)) {
        warnInvalid(`unknown key "${key}" is not a recognized pi-lens setting (check for a typo); ignored`);
      }
    }
    return config;
  } catch (error) {
    warnInvalidGlobalConfigOnce(resolvedPath, `global config could not be interpreted (${errorClassName(error)}); configuration ignored`, "PILENS_CFG_0008");
    return void 0;
  } finally {
    reportPiLensConfigRecords(notedRecords());
  }
}
function getGlobalIgnorePatterns(configPath) {
  return loadPiLensGlobalConfig(configPath)?.ignore ?? [];
}
function resolvePiLensFlagWithSource(name, value, config, projectConfig, editedFilePath, projectRoot) {
  const spec = getLensFlagSpec(name);
  if (spec?.env && process.env[spec.env] === "1") {
    return { value: true, source: "env" };
  }
  if (value)
    return { value, source: "cli" };
  if (!spec)
    return { value, source: "default" };
  if (spec.scope === "project") {
    const nested = editedFilePath && projectRoot ? findNestedProjectMutationValue(spec, editedFilePath, projectRoot) : void 0;
    if (nested) {
      return {
        value: flagValueFromConfig(spec, nested.value),
        source: path5.resolve(nested.dir) === path5.resolve(projectRoot) ? "project" : `nested-project:${nested.dir}`
      };
    }
    const projectValue = readFlagConfigValue(projectConfig, spec.configKey);
    if (projectValue !== void 0) {
      return {
        value: flagValueFromConfig(spec, projectValue),
        source: "project"
      };
    }
  }
  const globalValue = spec.readGlobal ? spec.readGlobal(config ?? {}) : readFlagConfigValue(config, spec.configKey);
  if (globalValue !== void 0) {
    return { value: flagValueFromConfig(spec, globalValue), source: "global" };
  }
  return { value: spec.default, source: "default" };
}
function resolvePiLensFlag(name, value, config, projectConfig, editedFilePath, projectRoot) {
  return resolvePiLensFlagWithSource(name, value, config, projectConfig, editedFilePath, projectRoot).value;
}

// dist/clients/ephemeral-root.js
import * as fs3 from "node:fs";
import * as os from "node:os";
import * as path6 from "node:path";
var NOT_EPHEMERAL = { checkout: false };
var classified = new BoundedFifoMap(1024);
function realPathOfNearestExisting(target) {
  const resolved = path6.resolve(target);
  const tail = [];
  for (let current = resolved; ; current = path6.dirname(current)) {
    try {
      return path6.join(fs3.realpathSync.native(current), ...tail.reverse());
    } catch {
      if (path6.dirname(current) === current)
        return resolved;
      tail.push(path6.basename(current));
    }
  }
}
function classifyTmpDir(dir) {
  const tmpSpelling = os.tmpdir();
  const key = `${normalizeEphemeralMapKey(tmpSpelling)}\0${normalizeEphemeralMapKey(path6.resolve(dir))}`;
  const memo = classified.get(key);
  if (memo)
    return memo;
  const tmpRoot = realPathOfNearestExisting(tmpSpelling);
  const real = realPathOfNearestExisting(dir);
  let result = NOT_EPHEMERAL;
  if (isUnderDir(real, tmpRoot)) {
    for (let current = real; current !== tmpRoot && path6.dirname(current) !== current; current = path6.dirname(current)) {
      if (isRealGitMarker(path6.join(current, ".git"))) {
        result = { checkout: true };
        break;
      }
    }
    if (!result.checkout) {
      const segments = path6.relative(tmpRoot, real).split(path6.sep);
      const index = segments.findIndex((segment) => /^pi-agent(?:-|$)/i.test(segment));
      if (index >= 0) {
        result = {
          checkout: false,
          stagingRoot: path6.join(tmpRoot, ...segments.slice(0, index + 1))
        };
      }
    }
  }
  classified.set(key, result);
  return result;
}
function ephemeralStagingRoot(filePath) {
  return classifyTmpDir(path6.dirname(path6.resolve(filePath))).stagingRoot;
}
function isPiOwnedTempPath(filePath) {
  const tmpRoot = realPathOfNearestExisting(os.tmpdir());
  const real = realPathOfNearestExisting(filePath);
  if (!isUnderDir(real, tmpRoot))
    return false;
  const relative3 = path6.relative(tmpRoot, real);
  if (relative3.length === 0 || path6.isAbsolute(relative3))
    return false;
  const segments = relative3.split(path6.sep);
  return segments.length === 1 || /^pi-/i.test(segments[0] ?? "");
}
function isEphemeralCheckoutRoot(dir) {
  return classifyTmpDir(dir).checkout;
}

// dist/clients/file-utils.js
function getProjectDataDir(cwd) {
  const legacyProjectDir = path7.join(cwd, ".pi-lens");
  const configuredBase = process.env.PILENS_DATA_DIR?.trim();
  const resolvedBase = projectDataBase();
  const memoKey = `${resolvedBase}\0${path7.resolve(cwd)}`;
  const cached = settledDataDirs.get(memoKey);
  if (cached !== void 0)
    return cached;
  if (!configuredBase && fs4.existsSync(legacyProjectDir)) {
    return legacyProjectDir;
  }
  const canonical = canonicalProjectRoot(cwd);
  const readable = projectDataDirReadableSlug(canonical.root);
  const hash = projectDataDirRootHash(canonical.root);
  const slug = `${readable || "default"}-${hash}`;
  const base = isEphemeralCheckoutRoot(cwd) ? ephemeralDataBase(resolvedBase) : resolvedBase;
  const dir = path7.join(base, slug);
  if (base !== resolvedBase && pendingDataDirMigrations.length < 32) {
    pendingDataDirMigrations.push({ to: dir, outcome: "ephemeral" });
  }
  const settled = settleProjectDataDir(base, readable || "default", dir, memoKey, canonical.fallback);
  return settled;
}
function projectDataBase() {
  const configuredBase = process.env.PILENS_DATA_DIR?.trim();
  return configuredBase || path7.join(getGlobalPiLensDir(), "projects");
}
var EPHEMERAL_DATA_DIR_NAME = ".ephemeral";
var EPHEMERAL_TOKEN_PATTERN = /^(\d+)-[0-9a-f]{8}$/;
function ephemeralDataToken() {
  return getProcessSingleton("project-data-ephemeral-token", 1, () => ({
    token: `${process.pid}-${randomBytes(4).toString("hex")}`,
    exitHook: false
  }));
}
function ephemeralDataBase(resolvedBase) {
  const state = ephemeralDataToken();
  if (!state.exitHook) {
    state.exitHook = true;
    process.once("exit", removeEphemeralDataDirs);
  }
  return path7.join(resolvedBase, EPHEMERAL_DATA_DIR_NAME, state.token);
}
function removeEphemeralDataDirs() {
  const dir = path7.join(projectDataBase(), EPHEMERAL_DATA_DIR_NAME, ephemeralDataToken().token);
  try {
    fs4.rmSync(dir, { recursive: true, force: true });
  } catch {
  }
}
async function sweepDeadEphemeralDataDirs(options) {
  const parent = path7.join(projectDataBase(), EPHEMERAL_DATA_DIR_NAME);
  let handle;
  try {
    handle = await fs4.promises.opendir(parent);
  } catch {
    return 0;
  }
  let removed = 0;
  try {
    for (let i = 0; i < (options.maxEntries ?? 512); i++) {
      const entry = await handle.read();
      if (entry === null)
        break;
      const pid = entry.isDirectory() ? EPHEMERAL_TOKEN_PATTERN.exec(entry.name)?.[1] : void 0;
      if (pid === void 0 || options.isPidAlive(Number(pid)))
        continue;
      try {
        await fs4.promises.rm(path7.join(parent, entry.name), {
          recursive: true,
          force: true
        });
        removed++;
      } catch {
      }
    }
  } catch {
  } finally {
    await handle.close().catch(() => {
    });
  }
  return removed;
}
function projectDataDirReadableSlug(canonicalRoot) {
  const normalized = normalizeFilePath(canonicalRoot);
  return normalized.replace(/^[a-z]:/i, "").replace(/\/+/g, "-").replace(/[^A-Za-z0-9-]/g, "").replace(/^-+/, "").replace(/-+$/, "");
}
function canonicalProjectRoot(cwd) {
  const resolved = path7.resolve(cwd);
  try {
    fs4.realpathSync(resolved);
  } catch {
    return { root: resolved, fallback: true };
  }
  return { root: resolved, fallback: false };
}
function projectDataDirRootHash(canonicalRoot) {
  return createHash("sha256").update(canonicalRoot).digest("hex").slice(0, 8);
}
var pendingDataDirMigrations = [];
var settledDataDirs = /* @__PURE__ */ new Map();
function resetProjectDataDirSessionState() {
  pendingDataDirMigrations.splice(0);
}
function settleProjectDataDir(base, oldSlug, dir, memoKey, identityFallback) {
  const oldDir = path7.join(base, oldSlug);
  const newExists = fs4.existsSync(dir);
  const oldExists = fs4.existsSync(oldDir);
  if (!oldExists) {
    if (identityFallback && pendingDataDirMigrations.length < 32) {
      pendingDataDirMigrations.push({
        to: dir,
        outcome: "identity-fallback"
      });
    }
    settledDataDirs.set(memoKey, dir);
    return dir;
  }
  if (!newExists) {
    try {
      fs4.renameSync(oldDir, dir);
    } catch (error) {
      if (error.code === "ENOENT") {
        if (fs4.existsSync(dir)) {
          settledDataDirs.set(memoKey, dir);
          return dir;
        }
        if (fs4.existsSync(oldDir))
          return oldDir;
        return dir;
      }
      if (pendingDataDirMigrations.length < 32) {
        pendingDataDirMigrations.push({
          to: dir,
          outcome: "rename-failed"
        });
      }
      settledDataDirs.set(memoKey, oldDir);
      return oldDir;
    }
  }
  settledDataDirs.set(memoKey, dir);
  if (pendingDataDirMigrations.length < 32) {
    pendingDataDirMigrations.push({
      to: dir,
      outcome: newExists ? "coexisting" : "renamed"
    });
  }
  return dir;
}
function drainProjectDataDirMigrations() {
  return pendingDataDirMigrations.splice(0);
}
function displayProjectDataPath(cwd, ...segments) {
  const absolute = path7.resolve(getProjectDataDir(cwd), ...segments);
  const absolutePosix = absolute.replace(/\\/g, "/");
  const relative3 = toProjectRelativePath(absolute, cwd);
  if (relative3 !== absolutePosix) {
    return relative3;
  }
  return homeRelativePath(absolutePosix);
}
function getGlobalPiLensDir() {
  const override = process.env.PI_LENS_HOME?.trim();
  if (override)
    return path7.resolve(override);
  return path7.join(os2.homedir(), ".pi-lens");
}
function isPiLensInternalPath(filePath, projectRoot) {
  const absolute = path7.resolve(filePath);
  const home = path7.resolve(os2.homedir());
  const candidates = [
    getGlobalPiLensDir(),
    getProjectDataDir(projectRoot),
    path7.join(home, ".pi"),
    path7.join(home, ".pi-lens")
  ];
  if (candidates.some((dir) => isUnderDir(absolute, dir)))
    return true;
  if (isPiOwnedTempPath(absolute))
    return true;
  return false;
}
var EXCLUDED_DIRS = [
  "node_modules",
  ".git",
  "dist",
  "build",
  ".turbo",
  ".cache",
  "target",
  "out",
  ".parcel-cache",
  ".svelte-kit",
  ".nuxt",
  ".yarn",
  ".pnpm-store",
  ".gradle",
  ".next",
  ".pi-lens",
  ".pi",
  // pi agent directory
  // The SAME agent, rebranded: pi derives its config-dir name as
  // `pkg.piConfig?.configDir || ".pi"` (pi-coding-agent 0.85.1,
  // `dist/bundle/chunks/chunk-JVUZSMYM.js`), so a redistribution spells its
  // `<configDir>/agent/sessions` history `.omp/agent/sessions` instead.
  // #3112: a project-local one was walked entry-by-entry and spent the whole
  // startup-scan entry budget, so a five-file project reported
  // `too-many-entries` and never warmed its caches.
  ".omp",
  ".ruff_cache",
  // Python linter cache
  ".worktrees",
  ".claude",
  ".codex",
  ".rescue",
  ".agents",
  ".gstack",
  ".superpowers",
  ".guardrails",
  ".playwright-cli",
  ".playwright-mcp",
  ".vscode",
  "venv",
  ".venv",
  "coverage",
  "__pycache__",
  ".tox",
  ".pytest_cache",
  "*.dSYM",
  // Vendored upstream source conventions — universally too large to scan
  "vendor",
  // Go modules, PHP Composer, Ruby Bundler
  "third_party",
  // Chromium/Google convention (llama.cpp, sherpa-onnx, gRPC, TF)
  "third-party",
  "vendors"
];
function resolveGitIgnoreRoot(startDir) {
  const fallback = path7.resolve(startDir);
  let current = fallback;
  while (true) {
    if (fs4.existsSync(path7.join(current, ".git")))
      return current;
    const parent = path7.dirname(current);
    if (parent === current)
      return fallback;
    current = parent;
  }
}
function collapseSlashes(value) {
  let out = "";
  let previousWasSlash = false;
  for (const ch of value) {
    if (ch === "/") {
      if (!previousWasSlash)
        out += ch;
      previousWasSlash = true;
      continue;
    }
    out += ch === "\\" ? "/" : ch;
    previousWasSlash = false;
  }
  return out;
}
function stripLeadingDotSlash(value) {
  return value.startsWith("./") ? value.slice(2) : value;
}
function stripTrailingSlashes(value) {
  let end = value.length;
  while (end > 0 && value[end - 1] === "/")
    end -= 1;
  return value.slice(0, end);
}
function stripLeadingSlashes(value) {
  let start = 0;
  while (start < value.length && value[start] === "/")
    start += 1;
  return value.slice(start);
}
function normalizeIgnorePath(value) {
  return collapseSlashes(stripLeadingDotSlash(value));
}
function stripTrailingSpaces(value) {
  let end = value.length;
  while (end > 0 && value[end - 1] === " " && value[end - 2] !== "\\")
    end -= 1;
  return value.slice(0, end).replace(/\\ /g, " ");
}
function parseGitignoreContent(content, layer) {
  const patterns = [];
  for (const rawLine of content.split(/\r?\n/)) {
    let line = stripTrailingSpaces(rawLine.trimStart());
    if (!line || line.startsWith("#"))
      continue;
    let negated = false;
    if (line.startsWith("!")) {
      negated = true;
      line = line.slice(1);
    }
    line = normalizeIgnorePath(line);
    if (!line)
      continue;
    const directoryOnly = line.endsWith("/");
    if (directoryOnly)
      line = stripTrailingSlashes(line);
    const rooted = line.startsWith("/");
    if (rooted)
      line = stripLeadingSlashes(line);
    if (!line)
      continue;
    patterns.push({
      pattern: line,
      negated,
      directoryOnly,
      rooted,
      hasSlash: line.includes("/"),
      layer
    });
  }
  return patterns;
}
function expandGitignorePattern(pattern) {
  const body = pattern.pattern;
  if (pattern.directoryOnly) {
    if (pattern.rooted || pattern.hasSlash)
      return [body, `${body}/**`];
    return [body, `${body}/**`, `**/${body}`, `**/${body}/**`];
  }
  if (pattern.rooted || pattern.hasSlash)
    return [body];
  return [body, `**/${body}`];
}
function matchesGitignorePattern(pattern, relativePath, isDirectory, matchExpanded) {
  const candidate = stripLeadingSlashes(normalizeIgnorePath(relativePath));
  if (!candidate)
    return false;
  const candidates = isDirectory ? [candidate, `${candidate}/`] : [candidate];
  return expandGitignorePattern(pattern).some((expanded) => {
    if (isDirectory && expanded.endsWith("/**")) {
      const prefix = expanded.slice(0, -3);
      if (candidate === prefix || candidate.startsWith(`${prefix}/`))
        return true;
    }
    return candidates.some((value) => matchExpanded(value, expanded));
  });
}
function readGitignorePatterns(rootDir, layer = "gitignore") {
  const gitignorePath = path7.join(rootDir, ".gitignore");
  try {
    return parseGitignoreContent(fs4.readFileSync(gitignorePath, "utf-8"), layer);
  } catch {
    return [];
  }
}
function ancestorDirsBetween(rootDir, targetDir) {
  const relative3 = path7.relative(rootDir, targetDir);
  if (relative3.startsWith("..") || path7.isAbsolute(relative3))
    return [];
  const dirs = [rootDir];
  if (!relative3)
    return dirs;
  let current = rootDir;
  for (const segment of relative3.split(path7.sep).filter(Boolean)) {
    current = path7.join(current, segment);
    dirs.push(current);
  }
  return dirs;
}
function buildProjectIgnoreMatcher(resolvedRoot, patterns) {
  const consumedIgnoreSources = /* @__PURE__ */ new Map();
  const rememberIgnoreSource = (filePath, signature = fileFreshnessSignature(filePath)) => {
    consumedIgnoreSources.set(filePath, { path: filePath, ...signature });
  };
  rememberIgnoreSource(path7.join(resolvedRoot, ".gitignore"));
  const nestedCache = /* @__PURE__ */ new Map();
  const patternsForDir = (dir) => {
    if (dir === resolvedRoot)
      return patterns;
    const cached = nestedCache.get(dir);
    const now = Date.now();
    if (cached !== void 0 && now - cached.checkedAtMs < PROJECT_IGNORE_FRESHNESS_CADENCE_MS) {
      return cached.patterns;
    }
    const gitignoreSig = gitignoreSignature(dir);
    rememberIgnoreSource(path7.join(dir, ".gitignore"), gitignoreSig);
    const pilensInfo = findPiLensConfigInDir(dir);
    const pilensMtime = pilensInfo?.mtimeMs ?? -1;
    const pilensSize = pilensInfo?.size ?? -1;
    if (cached?.gitignoreMtimeMs === gitignoreSig.mtimeMs && cached?.gitignoreSize === gitignoreSig.size && cached?.pilensMtimeMs === pilensMtime && cached?.pilensSize === pilensSize) {
      cached.checkedAtMs = now;
      return cached.patterns;
    }
    const nestedConfig = loadPiLensConfigInDir(dir);
    const nextPatterns = [
      ...readGitignorePatterns(dir),
      ...parseGitignoreContent(nestedConfig.ignore.join("\n"), "pilens")
    ];
    nestedCache.set(dir, {
      checkedAtMs: now,
      gitignoreMtimeMs: gitignoreSig.mtimeMs,
      gitignoreSize: gitignoreSig.size,
      pilensMtimeMs: pilensMtime,
      pilensSize,
      patterns: nextPatterns
    });
    if (cached !== void 0)
      dropVerdictsUnder(dir);
    return nextPatterns;
  };
  const patternMemo = /* @__PURE__ */ new Map();
  function dropVerdictsUnder(subtree) {
    const resolvedSubtree = path7.resolve(subtree);
    for (const key of patternMemo.keys()) {
      const memoPath = key.slice(2);
      const relative3 = path7.relative(resolvedSubtree, memoPath);
      if (!relative3 || !relative3.startsWith("..") && !path7.isAbsolute(relative3)) {
        patternMemo.delete(key);
      }
    }
  }
  const invalidateSubtree = (subtree) => {
    dropVerdictsUnder(subtree);
    nestedCache.delete(path7.resolve(subtree));
  };
  const gitignoreGlobOptions = {
    dot: true,
    nocase: process.platform === "win32"
  };
  const compiledGlobs = /* @__PURE__ */ new Map();
  const matchExpanded = (value, expanded) => {
    let compiled = compiledGlobs.get(expanded);
    if (compiled === void 0) {
      compiled = new Minimatch(expanded, gitignoreGlobOptions);
      compiledGlobs.set(expanded, compiled);
    }
    return compiled.match(value);
  };
  function isTrackedAndRescued(resolved) {
    const snapshot = getTrackedFilesSnapshot(resolvedRoot);
    if (!snapshot)
      return false;
    return snapshot.has(normalizeEphemeralMapKey(resolved));
  }
  return {
    rootDir: resolvedRoot,
    patterns,
    getConsumedIgnoreSources: () => [...consumedIgnoreSources.values()],
    refreshConsumedIgnoreSource(filePath) {
      if (consumedIgnoreSources.has(filePath))
        rememberIgnoreSource(filePath);
    },
    invalidateSubtree,
    ensureTrackedIndex() {
      return collectTrackedFiles(resolvedRoot).then(() => void 0);
    },
    isIgnored(filePath, isDirectory = false) {
      const resolved = path7.resolve(filePath);
      const memoKey = (isDirectory ? "D:" : "F:") + resolved;
      let verdict = patternMemo.get(memoKey);
      if (verdict === void 0) {
        const rootRelative = path7.relative(resolvedRoot, resolved);
        if (!rootRelative || rootRelative.startsWith("..") || path7.isAbsolute(rootRelative)) {
          verdict = { ignored: false, layer: void 0 };
        } else {
          let ignored = false;
          let layer;
          const patternDirs = ancestorDirsBetween(resolvedRoot, path7.dirname(resolved));
          for (const dir of patternDirs) {
            const dirPatterns = patternsForDir(dir);
            if (dirPatterns.length === 0)
              continue;
            const relative3 = path7.relative(dir, resolved);
            const normalized = normalizeIgnorePath(relative3);
            for (const pattern of dirPatterns) {
              if (!matchesGitignorePattern(pattern, normalized, isDirectory, matchExpanded))
                continue;
              ignored = !pattern.negated;
              layer = pattern.layer;
            }
          }
          verdict = { ignored, layer };
        }
        patternMemo.set(memoKey, verdict);
      }
      if (!verdict.ignored)
        return false;
      if (!isDirectory && verdict.layer !== "pilens" && isTrackedAndRescued(resolved)) {
        return false;
      }
      return true;
    }
  };
}
function createProjectIgnoreMatcher(rootDir, extraPatterns = [], globalPatterns = []) {
  const resolvedRoot = resolveGitIgnoreRoot(rootDir);
  const patterns = [
    ...parseGitignoreContent(globalPatterns.join("\n"), "global"),
    ...readGitignorePatterns(resolvedRoot, "gitignore"),
    ...parseGitignoreContent(extraPatterns.join("\n"), "pilens")
  ];
  return buildProjectIgnoreMatcher(resolvedRoot, patterns);
}
var projectIgnoreMatcherCache = /* @__PURE__ */ new Map();
var PROJECT_IGNORE_FRESHNESS_CADENCE_MS = FRESHNESS_CADENCE_MS;
function fileFreshnessSignature(filePath) {
  try {
    const stat = fs4.statSync(filePath);
    return { mtimeMs: stat.mtimeMs, size: stat.size };
  } catch {
    return { mtimeMs: -1, size: -1 };
  }
}
function globalConfigSignature() {
  return fileFreshnessSignature(getPiLensGlobalConfigPath());
}
function gitignoreSignature(rootDir) {
  return fileFreshnessSignature(path7.join(rootDir, ".gitignore"));
}
function hasIgnoreSourceDrift(sources) {
  return sources.some((source) => {
    const current = fileFreshnessSignature(source.path);
    return current.mtimeMs !== source.mtimeMs || current.size !== source.size;
  });
}
function lensConfigInfo(rootDir) {
  const info = findPiLensProjectConfig(rootDir);
  return info ? { info, path: info.path, mtimeMs: info.mtimeMs, size: info.size } : { info, path: void 0, mtimeMs: -1, size: -1 };
}
function getProjectIgnoreMatcher(rootDir) {
  const resolvedRoot = resolveGitIgnoreRoot(rootDir);
  const gitignoreSig = gitignoreSignature(resolvedRoot);
  const lensConfig = lensConfigInfo(resolvedRoot);
  const globalSig = globalConfigSignature();
  const cached = projectIgnoreMatcherCache.get(resolvedRoot);
  if (cached) {
    const known = new Set(cached.ignoreSources.map((source) => source.path));
    for (const source of cached.matcher.getConsumedIgnoreSources()) {
      if (!known.has(source.path))
        cached.ignoreSources.push(source);
    }
  }
  if (cached && Date.now() - cached.lastIgnoreFreshnessCheckMs >= PROJECT_IGNORE_FRESHNESS_CADENCE_MS) {
    cached.lastIgnoreFreshnessCheckMs = Date.now();
    if (hasIgnoreSourceDrift(cached.ignoreSources)) {
      for (const source of cached.ignoreSources) {
        if (hasIgnoreSourceDrift([source])) {
          const sourceIndex = cached.ignoreSources.findIndex((cachedSource) => cachedSource.path === source.path);
          invalidateProjectIgnoreMatcherForPath(source.path);
          cached.matcher.refreshConsumedIgnoreSource(source.path);
          const refreshedSource = cached.matcher.getConsumedIgnoreSources().find((current) => current.path === source.path);
          if (sourceIndex !== -1 && refreshedSource !== void 0) {
            cached.ignoreSources.splice(sourceIndex, 1, refreshedSource);
          }
        }
      }
    }
  }
  if (cached?.gitignoreMtimeMs === gitignoreSig.mtimeMs && cached?.gitignoreSize === gitignoreSig.size && cached?.lensConfigPath === lensConfig.path && cached?.lensConfigMtimeMs === lensConfig.mtimeMs && cached?.lensConfigSize === lensConfig.size && cached?.globalConfigMtimeMs === globalSig.mtimeMs && cached?.globalConfigSize === globalSig.size) {
    return cached.matcher;
  }
  const projectConfig = loadPiLensProjectConfig(resolvedRoot, lensConfig.info);
  const matcher = createProjectIgnoreMatcher(resolvedRoot, projectConfig.ignore, getGlobalIgnorePatterns());
  projectIgnoreMatcherCache.set(resolvedRoot, {
    ignoreSources: [...matcher.getConsumedIgnoreSources()],
    lastIgnoreFreshnessCheckMs: Date.now(),
    gitignoreMtimeMs: gitignoreSig.mtimeMs,
    gitignoreSize: gitignoreSig.size,
    lensConfigPath: lensConfig.path,
    lensConfigMtimeMs: lensConfig.mtimeMs,
    lensConfigSize: lensConfig.size,
    globalConfigMtimeMs: globalSig.mtimeMs,
    globalConfigSize: globalSig.size,
    matcher
  });
  return matcher;
}
function invalidateProjectIgnoreMatcherForPath(filePath) {
  const resolvedPath = path7.resolve(filePath);
  if (path7.basename(resolvedPath).toLowerCase() !== ".gitignore")
    return;
  for (const [cachedRoot, cached] of projectIgnoreMatcherCache) {
    if (!isUnderDir(resolvedPath, cachedRoot))
      continue;
    if (normalizeFilePath(resolvedPath) === normalizeFilePath(path7.join(cachedRoot, ".gitignore"))) {
      projectIgnoreMatcherCache.delete(cachedRoot);
      continue;
    }
    cached.matcher.invalidateSubtree(path7.dirname(resolvedPath));
  }
}
function isPathIgnoredByProject(filePath, rootDir, isDirectory = false) {
  return getProjectIgnoreMatcher(rootDir).isIgnored(filePath, isDirectory);
}
function isRecordableProjectPath(filePath, projectRoot) {
  if (isPathIgnoredByProject(filePath, projectRoot, false))
    return false;
  if (isExternalOrVendorFile(filePath, projectRoot))
    return false;
  return true;
}
var projectIgnoreGlobsCache = /* @__PURE__ */ new Map();
function getProjectIgnoreGlobs(rootDir) {
  const resolvedRoot = path7.resolve(rootDir);
  const signature = gitignoreSignature(resolvedRoot);
  const cached = projectIgnoreGlobsCache.get(resolvedRoot);
  if (cached && cached.mtimeMs === signature.mtimeMs && cached.size === signature.size) {
    return cached.globs;
  }
  const globs = readGitignorePatterns(resolvedRoot).filter((pattern) => !pattern.negated).flatMap((pattern) => expandGitignorePattern(pattern));
  projectIgnoreGlobsCache.set(resolvedRoot, { ...signature, globs });
  return globs;
}
function globToRegExp(glob) {
  const escaped = glob.replace(/\*+/g, "*").replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".");
  return new RegExp(`^${escaped}$`, "i");
}
function isExcludedDirName(dirName, extraPatterns = []) {
  const candidate = dirName.trim();
  if (!candidate)
    return false;
  const patterns = [...EXCLUDED_DIRS, ...extraPatterns].map((p) => p.trim()).filter((p) => p.length > 0);
  const candidateLower = candidate.toLowerCase();
  for (const pattern of patterns) {
    const patLower = pattern.toLowerCase();
    if (!patLower.includes("*") && !patLower.includes("?")) {
      if (candidateLower === patLower)
        return true;
      continue;
    }
    if (globToRegExp(pattern).test(candidate))
      return true;
  }
  return false;
}
function getExcludedDirGlobs() {
  return EXCLUDED_DIRS.map((dir) => `**/${dir}/**`);
}
function getKnipIgnorePatterns() {
  return [
    ...getExcludedDirGlobs(),
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/*.test.js",
    "**/*.test.jsx",
    "**/*.spec.ts",
    "**/*.spec.tsx",
    "**/*.spec.js",
    "**/*.spec.jsx",
    "**/*.poc.test.ts",
    "**/*.poc.test.tsx",
    "**/__tests__/**",
    "**/tests/**"
  ];
}
function isTestFile(filePath) {
  if (detectFileRole(filePath) === "test")
    return true;
  const normalized = filePath.replace(/\\/g, "/");
  return normalized.includes("test-utils") || normalized.startsWith("test-") || normalized.includes(".fixture.") || normalized.includes(".mock.");
}

// dist/clients/instance-registry.js
import * as fs7 from "node:fs";
import * as path10 from "node:path";

// dist/clients/generation-guard.js
var declaredSources = /* @__PURE__ */ new Set();
var MAX_DECLARED_SOURCES = 128;
function declare(name) {
  if (!name.trim()) {
    throw new Error("generation source needs a non-empty name");
  }
  if (declaredSources.size < MAX_DECLARED_SOURCES)
    declaredSources.add(name);
  return name;
}
var FENCE_TALLY_FAMILY = "generation-guard.fence-tally";
var FENCE_TALLY_VERSION = 1;
var OTHER_SOURCES = "(other)";
function fenceTallies() {
  return getProcessSingleton(FENCE_TALLY_FAMILY, FENCE_TALLY_VERSION, () => /* @__PURE__ */ new Map());
}
function tallyFence(sourceName, dropped) {
  const tallies = fenceTallies();
  const key = declaredSources.has(sourceName) ? sourceName : OTHER_SOURCES;
  let tally = tallies.get(key);
  if (!tally) {
    tally = { guarded: 0, dropped: 0 };
    tallies.set(key, tally);
  }
  tally.guarded += 1;
  if (dropped)
    tally.dropped += 1;
}
function recordStaleWrite(sourceName, subject, captured, observed) {
  incrementDegradationCount({
    kind: "generation-guard-stale-write",
    subject: `${sourceName}:${subject}`,
    reason: `write dropped: captured generation ${captured}, current ${observed}`
  });
}
function makeHandle(sourceName, generation, read, tallyName) {
  return {
    generation,
    isCurrent() {
      return read() === generation;
    },
    guardedWrite(subject, write) {
      const observed = read();
      if (observed !== generation) {
        tallyFence(tallyName, true);
        recordStaleWrite(sourceName, subject, generation, observed);
        return void 0;
      }
      tallyFence(tallyName, false);
      return write();
    }
  };
}
function createGenerationSource(name, store) {
  declare(name);
  const local = { generation: 0 };
  const cell = store ?? (() => local);
  const read = () => cell().generation;
  return {
    name,
    current: read,
    bump() {
      const held = cell();
      held.generation += 1;
      return held.generation;
    },
    capture() {
      return makeHandle(name, read(), read, name);
    }
  };
}
var DEFAULT_MAX_KEYS = 512;
function createGenerationMap(name, options = {}) {
  declare(name);
  const normalize = options.normalizeKey ?? ((key) => key);
  const maxKeys = Math.max(1, options.maxKeys ?? DEFAULT_MAX_KEYS);
  const stamps = new BoundedFifoMap(maxKeys);
  let nextTicket = 0;
  let invalidations = 0;
  const read = (key) => stamps.get(key) ?? 0;
  function issue(key) {
    nextTicket += 1;
    stamps.delete(key);
    const evicted = stamps.set(key, nextTicket);
    invalidations += evicted.length;
    return nextTicket;
  }
  return {
    name,
    current(key) {
      return read(normalize(key));
    },
    bump(key) {
      invalidations += 1;
      return issue(normalize(key));
    },
    capture(key) {
      const normalized = normalize(key);
      const stamp = read(normalized) || issue(normalized);
      const capturedInvalidations = invalidations;
      return makeHandle(`${name}[${normalized}]`, stamp, () => {
        if (invalidations === capturedInvalidations)
          return stamp;
        return read(normalize(key));
      }, name);
    },
    forget(key) {
      invalidations += 1;
      stamps.delete(normalize(key));
    },
    clear() {
      invalidations += 1;
      stamps.clear();
    },
    size() {
      return stamps.size;
    }
  };
}

// dist/clients/instance-registry-lock.js
import * as fs5 from "node:fs";
import { randomInt as randomInt2 } from "node:crypto";
import * as path8 from "node:path";
var OWN_HOLDS_FAMILY = "instance-registry.lock-own-holds";
var OWN_HOLDS_VERSION = 1;
function ownAsyncHolds() {
  return getProcessSingleton(OWN_HOLDS_FAMILY, OWN_HOLDS_VERSION, () => ({
    count: 0
  }));
}
var LOCK_STALE_MS = 5e3;
var LOCK_WAIT_MS = 500;
var LOCK_MIN_BACKOFF_MS = 5;
var LOCK_MAX_BACKOFF_MS = 25;
function generationDir2(target) {
  return `${target}.locks`;
}
function legacyLockPath(target) {
  return `${target}.lock`;
}
function createLegacyLock(lock) {
  try {
    fs5.writeFileSync(lock, `${process.pid} ${Date.now()}
`, { flag: "wx" });
    return true;
  } catch (error) {
    if (isLockContention(error))
      return false;
    throw error;
  }
}
function takeLegacyLock(lock) {
  if (createLegacyLock(lock))
    return true;
  if (!pidFileIsStale(lock, LOCK_STALE_MS))
    return false;
  try {
    fs5.unlinkSync(lock);
  } catch {
  }
  return createLegacyLock(lock);
}
function releaseLegacyLock(lock) {
  if (pidFileOwner(lock) !== process.pid)
    return;
  try {
    fs5.unlinkSync(lock);
  } catch {
  }
}
function tryAcquire(target) {
  let hold;
  try {
    hold = tryAcquireGeneration(generationDir2(target), LOCK_STALE_MS);
    if (!hold)
      return "busy";
    if (hold.tookOverStale)
      recordStaleTakeover(target, hold);
    if (takeLegacyLock(legacyLockPath(target)))
      return hold;
    recordLegacyHeld(target);
    releaseGeneration(hold);
    return "busy";
  } catch (cause) {
    recordLockFailure(target, cause);
    if (hold)
      releaseGeneration(hold);
    return "failed";
  }
}
function release(target, hold) {
  releaseLegacyLock(legacyLockPath(target));
  releaseGeneration(hold);
}
function recordLockFailure(target, cause) {
  const code = cause?.code ?? "unknown";
  incrementDegradationCount({
    kind: "instance-registry-lock-failed",
    subject: path8.resolve(target),
    reason: `lock acquisition failed for ${path8.basename(target)} (${code}); the registry write was skipped`
  });
}
function recordStaleTakeover(target, hold) {
  incrementDegradationCount({
    kind: "instance-registry-lock-stale-takeover",
    subject: path8.resolve(target),
    reason: `took over lock generation ${hold.generation - 1} from a dead or aged-out holder`
  });
}
function recordLegacyHeld(target) {
  const lock = legacyLockPath(target);
  incrementDegradationCount({
    kind: "instance-registry-lock-legacy-held",
    subject: path8.resolve(lock),
    reason: `backed off: ${path8.basename(lock)} is held by pid ${pidFileOwner(lock) ?? "unknown"}, a writer from before #3476`
  });
}
function recordLockTimeout(target) {
  incrementDegradationCount({
    kind: "instance-registry-lock-timeout",
    subject: path8.resolve(target),
    reason: `lock acquisition exhausted for ${path8.basename(target)}`
  });
}
function backoffMs() {
  return randomInt2(LOCK_MIN_BACKOFF_MS, LOCK_MAX_BACKOFF_MS + 1);
}
var LOCK_WAIT_THROUGH_LEASE_MS = LOCK_STALE_MS + LOCK_WAIT_MS;
async function withInstanceRegistryLock(target, op, waitMs = LOCK_WAIT_MS) {
  const deadline = Date.now() + waitMs;
  while (Date.now() <= deadline) {
    const hold = tryAcquire(target);
    if (hold === "failed")
      return void 0;
    if (hold === "busy") {
      if (Date.now() <= deadline)
        await new Promise((resolve6) => setTimeout(resolve6, backoffMs()));
      continue;
    }
    const holds = ownAsyncHolds();
    holds.count += 1;
    try {
      return await op();
    } finally {
      holds.count -= 1;
      release(target, hold);
    }
  }
  recordLockTimeout(target);
  return void 0;
}

// dist/scripts/lib/process-scan.mjs
import fs6 from "node:fs";
import path9 from "node:path";
function runningOnWindows() {
  return process.platform === "win32";
}
var FIELD_COLUMNS = Object.freeze({
  pid: { wmi: "ProcessId", ps: "pid", token: "int" },
  ppid: { wmi: "ParentProcessId", ps: "ppid", token: "int" },
  ageMs: { wmi: "CreationDate", ps: "etime", token: "age" },
  rssBytes: { wmi: "WorkingSetSize", ps: null, token: "int" },
  cpuKernel100ns: { wmi: "KernelModeTime", ps: null, token: "int" },
  cpuUser100ns: { wmi: "UserModeTime", ps: null, token: "int" },
  startedAt: { wmi: "CreationDate", ps: "lstart", token: "lstart" },
  command: { wmi: "CommandLine", ps: "args", token: "tail" }
});
var FIELD_ORDER = Object.freeze(Object.keys(FIELD_COLUMNS));
var ALL_PROCESS_FIELDS = Object.freeze(["pid", "ppid", "command"]);
var FILTERABLE_COLUMNS = /* @__PURE__ */ new Set(["ProcessId", "Name", "CommandLine"]);
function windowsExe(name) {
  return path9.join(process.env.SystemRoot ?? path9.join("C:", "Windows"), "System32", name);
}
function posixPsPath() {
  try {
    if (fs6.existsSync("/bin/ps"))
      return "/bin/ps";
    if (fs6.existsSync("/usr/bin/ps"))
      return "/usr/bin/ps";
  } catch {
  }
  return "/bin/ps";
}
function normalizeProcessFields(fields) {
  const requested = new Set((fields ?? ALL_PROCESS_FIELDS).filter((field) => field in FIELD_COLUMNS));
  requested.add("pid");
  return FIELD_ORDER.filter((field) => requested.has(field));
}
function escapeWqlLikeValue(value) {
  return String(value).replaceAll("'", "''").replaceAll(/[%_]/g, (ch) => `[${ch}]`);
}
function escapeWqlStringValue(value) {
  return String(value).replaceAll("'", "''");
}
function assertPid(value) {
  const pid = Number(value);
  if (!Number.isInteger(pid) || pid <= 0) {
    throw new Error(`process filter: invalid pid ${String(value)}`);
  }
  return pid;
}
function wqlFilterExpression(filter) {
  const { column, op, values } = filter;
  if (!FILTERABLE_COLUMNS.has(column)) {
    throw new Error(`process filter: unsupported column ${String(column)}`);
  }
  const list = [...values];
  if (list.length === 0) {
    throw new Error(`process filter: ${column} filter has no values`);
  }
  if (column === "ProcessId") {
    return list.map((value) => `ProcessId=${assertPid(value)}`).join(" OR ");
  }
  if (op === "like") {
    return list.map((value) => `${column} LIKE '%${escapeWqlLikeValue(value)}%'`).join(" OR ");
  }
  return list.map((value) => `${column} = '${escapeWqlStringValue(value)}'`).join(" OR ");
}
function buildProcessQuery(fields = ALL_PROCESS_FIELDS, options = {}) {
  const layout = normalizeProcessFields(fields);
  const filter = options.filter;
  if (runningOnWindows()) {
    const columns2 = [
      ...new Set(layout.map((field) => FIELD_COLUMNS[field].wmi))
    ];
    const where = filter ? ` WHERE ${wqlFilterExpression(filter)}` : "";
    const excludeSelf = options.excludeSelfPid ? " | Where-Object { $_.ProcessId -ne $PID }" : "";
    const prelude = (layout.includes("ageMs") ? "$age = if ($_.CreationDate -is [datetime]) { [int64]((Get-Date) - $_.CreationDate).TotalMilliseconds } else { '' }; " : "") + (layout.includes("startedAt") ? "$st = if ($_.CreationDate -is [datetime]) { $_.CreationDate.ToUniversalTime().ToString('o') } else { '' }; " : "");
    const row = layout.map((field) => {
      if (field === "ageMs")
        return "$age";
      if (field === "startedAt")
        return "$st";
      return `$($_.${FIELD_COLUMNS[field].wmi})`;
    }).join("`t");
    return {
      command: windowsExe("WindowsPowerShell\\v1.0\\powershell.exe"),
      args: [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        `Get-CimInstance -Query "SELECT ${columns2.join(",")} FROM Win32_Process${where}"${excludeSelf} | ForEach-Object { ${prelude}"${row}" }`
      ],
      tabSeparated: true,
      fields: layout,
      serverSideFiltered: Boolean(filter)
    };
  }
  const unsupported = layout.filter((field) => !FIELD_COLUMNS[field].ps);
  if (unsupported.length > 0) {
    throw new Error(`process query: ${unsupported.join(", ")} has no POSIX ps column`);
  }
  if (layout.includes("startedAt") && process.platform === "linux") {
    throw new Error("process query: startedAt on Linux is read from /proc, not ps");
  }
  const columns = layout.map((field) => `${FIELD_COLUMNS[field].ps}=`).join(",");
  const pidFilter = filter && filter.column === "ProcessId" && filter.op === "eq" ? [...filter.values].map((value) => assertPid(value)) : null;
  return {
    command: posixPsPath(),
    args: pidFilter ? ["-p", pidFilter.join(","), "-o", columns] : ["-eo", columns],
    tabSeparated: false,
    fields: layout,
    serverSideFiltered: Boolean(pidFilter),
    // BSD `ps` formats `lstart` with strftime("%c") in the local zone, so
    // two readers with different locales or zones would print one process
    // two ways. Pinned, every reader prints the same text.
    ...layout.includes("startedAt") ? { env: posixStartEnv() } : {}
  };
}
function posixStartEnv() {
  return { ...process.env, LC_ALL: "C", TZ: "UTC0" };
}
function readLinuxProcessStart(pid) {
  try {
    const ticks = parseLinuxStatStart(fs6.readFileSync(`/proc/${assertPid(pid)}/stat`, "utf8"));
    const boot = fs6.readFileSync("/proc/sys/kernel/random/boot_id", "utf8").trim();
    const offset = readBoottimeOffsetTicks();
    return ticks === void 0 || offset === void 0 || !/^[0-9a-f-]{36}$/.test(boot) ? void 0 : `${Number(ticks) - offset}@${boot}`;
  } catch {
    return void 0;
  }
}
var USER_HZ = 100;
var NSEC_PER_TICK = 1e9 / USER_HZ;
function readBoottimeOffsetTicks() {
  let text;
  try {
    text = fs6.readFileSync("/proc/self/timens_offsets", "utf8");
  } catch (error) {
    return (
      /** @type {NodeJS.ErrnoException} */
      error.code === "ENOENT" ? 0 : void 0
    );
  }
  const match = /^boottime\s+(-?\d+)\s+(\d+)\s*$/m.exec(String(text));
  if (!match)
    return void 0;
  const nsec = Number(match[2]);
  if (nsec % NSEC_PER_TICK !== 0)
    return void 0;
  return Number(match[1]) * USER_HZ + nsec / NSEC_PER_TICK;
}
function parseLinuxStatStart(stat) {
  const fields = String(stat).slice(stat.lastIndexOf(")") + 2).split(" ");
  const start = fields[19];
  return /^\d+$/.test(start ?? "") ? start : void 0;
}
function readLinuxPidNamespace(pid) {
  try {
    return fs6.readlinkSync(`/proc/${assertPid(pid)}/ns/pid`);
  } catch {
    return void 0;
  }
}
function parseNonNegativeInt(raw) {
  const token = String(raw ?? "").trim();
  if (!/^\d+$/.test(token))
    return void 0;
  const value = Number(token);
  return Number.isFinite(value) ? value : void 0;
}
function ageMsFromPosixEtime(raw) {
  const token = String(raw ?? "").trim();
  if (!/^(?:\d+-)?(?:\d+:)?\d+:\d+$/.test(token))
    return void 0;
  let days = 0;
  let rest = token;
  const dash = rest.indexOf("-");
  if (dash >= 0) {
    days = Number(rest.slice(0, dash));
    rest = rest.slice(dash + 1);
  }
  const parts = rest.split(":").map(Number);
  if (parts.some((part) => !Number.isFinite(part)))
    return void 0;
  const [hours, minutes, seconds] = parts.length === 3 ? parts : [0, parts[0], parts[1]];
  return ((days * 24 + hours) * 60 * 60 + minutes * 60 + seconds) * 1e3;
}
function posixTokenPattern(field) {
  const token = FIELD_COLUMNS[field].token;
  if (token === "age")
    return "(\\S+)";
  if (token === "lstart")
    return "(\\S+\\s+\\S+\\s+\\d+\\s+\\d+:\\d+:\\d+\\s+\\d+)";
  return "(\\d+)";
}
var LSTART_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];
function isoFromLstart(raw) {
  const match = /^\w{3}\s+(\w{3})\s+(\d{1,2})\s+(\d{1,2}):(\d{2}):(\d{2})\s+(\d{4})$/.exec(String(raw ?? "").trim());
  if (!match)
    return void 0;
  const month = LSTART_MONTHS.indexOf(match[1]);
  if (month === -1)
    return void 0;
  const [day, hours, minutes, seconds, year] = [2, 3, 4, 5, 6].map((i) => Number(match[i]));
  return new Date(Date.UTC(year, month, day, hours, minutes, seconds)).toISOString();
}
function parseProcessTable(out, tabSeparated, fields = ALL_PROCESS_FIELDS) {
  const layout = normalizeProcessFields(fields);
  const commandIndex = layout.indexOf("command");
  const positional = tabSeparated ? null : new RegExp(`^\\s*${layout.filter((field) => field !== "command").map((field) => posixTokenPattern(field)).join("\\s+")}${commandIndex === -1 ? "\\s*$" : "\\s+(.*)$"}`);
  const rows = [];
  for (const line of String(out ?? "").split(/\r?\n/)) {
    if (!line.trim())
      continue;
    let parts;
    if (tabSeparated) {
      const split = line.split("	");
      if (split.length < layout.length - (commandIndex === -1 ? 0 : 1))
        continue;
      parts = commandIndex === -1 ? split : [
        ...split.slice(0, commandIndex),
        split.slice(commandIndex).join("	")
      ];
    } else {
      const match = positional?.exec(line);
      if (!match)
        continue;
      parts = match.slice(1);
    }
    const value = (field) => {
      const at = layout.indexOf(field);
      return at === -1 ? void 0 : parts[at];
    };
    const pid = Number(value("pid"));
    if (!Number.isInteger(pid) || pid <= 0)
      continue;
    const ppid = Number(value("ppid"));
    const row = {
      pid,
      ppid: Number.isInteger(ppid) && ppid > 0 ? ppid : 0,
      command: value("command") ?? ""
    };
    for (const field of layout) {
      if (field === "pid" || field === "ppid" || field === "command")
        continue;
      const raw = value(field);
      if (field === "ageMs") {
        row.ageMs = tabSeparated ? parseNonNegativeInt(raw) : ageMsFromPosixEtime(raw ?? "");
      } else if (field === "startedAt") {
        row.startedAt = tabSeparated ? String(raw ?? "").trim() : isoFromLstart(raw ?? "");
      } else {
        row[field] = parseNonNegativeInt(raw);
      }
    }
    rows.push(row);
  }
  return rows;
}

// dist/clients/process-snapshot.js
async function queryProcessTable(request, options) {
  let query;
  try {
    query = buildProcessQuery(request.fields, {
      filter: request.filter,
      excludeSelfPid: request.excludeSelfPid
    });
  } catch {
    return { rows: [], status: "spawn-error", serverSideFiltered: false };
  }
  const result = await spawnCollectStdoutResult(query.command, query.args, {
    shell: false,
    windowsHide: true,
    stdio: ["ignore", "pipe", "ignore"],
    env: query.env
  }, { timeoutMs: options.timeoutMs, onTimeout: options.onTimeout });
  return {
    // Whatever the collector kept is parsed rather than discarded here: it
    // drops stdout on a non-zero exit (that output is not evidence of what
    // is NOT running) but KEEPS the partial table from a timed-out child,
    // and the caller decides what a partial table is worth by reading
    // `status`. Re-deciding that here would be a second policy.
    rows: parseProcessTable(result.stdout, query.tabSeparated, query.fields),
    status: result.status,
    exitCode: result.exitCode,
    timeoutKill: result.timeoutKill,
    serverSideFiltered: query.serverSideFiltered
  };
}
function validPids(pids) {
  return [...new Set(pids.filter((p) => Number.isInteger(p) && p > 0))];
}
async function queryProcessIdentities(pids, options) {
  const valid = validPids(pids);
  const identities = /* @__PURE__ */ new Map();
  if (valid.length === 0)
    return { identities, status: "ok" };
  const linux = process.platform === "linux";
  const result = await queryProcessTable({
    fields: linux ? ["pid", "command"] : ["pid", "startedAt", "command"],
    filter: { column: "ProcessId", op: "eq", values: valid }
  }, options);
  for (const row of result.rows) {
    const start = linux ? readLinuxProcessStart(row.pid) : row.startedAt;
    identities.set(row.pid, {
      command: row.command,
      start: start ? start : void 0
    });
  }
  return { identities, status: result.status };
}
var OWNER_TAG_ENV = "PI_LENS_OWNER";
function formatOwnerTag(tag) {
  return `${tag.pid}:${tag.start}`;
}
async function ownerTagForChildren(options) {
  if (process.platform === "win32")
    return void 0;
  const start = await ownProcessStart(options);
  return start === void 0 ? void 0 : formatOwnerTag({ pid: process.pid, start });
}
function isInPidNamespace(entry, namespace) {
  return entry.pidNamespace === void 0 || entry.pidNamespace === namespace;
}
function ownPidNamespace() {
  return process.platform === "linux" ? readLinuxPidNamespace(process.pid) : void 0;
}
var ownStart = null;
function ownProcessStart(options) {
  if (process.platform === "linux")
    return Promise.resolve(readLinuxProcessStart(process.pid));
  if (ownStart)
    return ownStart.promise;
  const cell = {
    promise: readProcessStart(process.pid, options).then((start) => {
      if (start === void 0)
        ownStart = null;
      else
        cell.value = start;
      return start;
    })
  };
  ownStart = cell;
  return cell.promise;
}
async function readProcessStart(pid, options) {
  if (process.platform === "linux")
    return readLinuxProcessStart(pid);
  return (await queryProcessIdentities([pid], options)).identities.get(pid)?.start;
}

// dist/clients/instance-registry-tail.js
var REGISTRY_TAIL_FAMILY = "instance-registry.mutation-tail";
var REGISTRY_TAIL_VERSION = 1;
function registryTailState() {
  return getProcessSingleton(REGISTRY_TAIL_FAMILY, REGISTRY_TAIL_VERSION, () => ({
    tail: Promise.resolve()
  }));
}
function queueRegistryMutation(op) {
  const state = registryTailState();
  const run = state.tail.then(op);
  state.tail = run.catch(() => {
  });
  return run;
}

// dist/clients/subagent-mode.js
var cachedClassification;
function classifySubagentSession() {
  if (cachedClassification !== void 0)
    return cachedClassification;
  if (process.env.PI_SUBAGENT_CHILD === "1") {
    cachedClassification = { isSubagent: true, marker: "pi-subagents" };
    return cachedClassification;
  }
  const childAgent = process.env.PI_SUBAGENT_CHILD_AGENT || void 0;
  const parentPid = process.env.PI_SUBAGENT_PARENT_PID || void 0;
  if (childAgent !== void 0 && parentPid !== void 0) {
    cachedClassification = { isSubagent: true, marker: "avtc-pi-subagent" };
    return cachedClassification;
  }
  cachedClassification = { isSubagent: false };
  return cachedClassification;
}
function isSubagentSession() {
  if (process.env.PI_LENS_SUBAGENT_FULL === "1")
    return false;
  return classifySubagentSession().isSubagent;
}
function getSubagentIdentity() {
  const runId = process.env.PI_SUBAGENT_RUN_ID || void 0;
  const agentName = process.env.PI_SUBAGENT_CHILD_AGENT || void 0;
  const parentPidRaw = process.env.PI_SUBAGENT_PARENT_PID || void 0;
  const parsedParentPid = parentPidRaw === void 0 ? void 0 : Number(parentPidRaw);
  const parentPid = parsedParentPid !== void 0 && Number.isSafeInteger(parsedParentPid) && parsedParentPid > 0 ? parsedParentPid : void 0;
  const classification = classifySubagentSession();
  if (runId === void 0 && agentName === void 0 && parentPid === void 0 && !classification.isSubagent) {
    return void 0;
  }
  return { runId, agentName, marker: classification.marker, parentPid };
}
function subagentLightModeNotice() {
  return "subagent session \u2014 skipped background code-quality scans (set PI_LENS_SUBAGENT_FULL=1 to override)";
}

// dist/clients/instance-registry.js
function registryPath() {
  return path10.join(getGlobalPiLensDir(), "instances.json");
}
function startReadOptions() {
  return {
    timeoutMs: BACKSTOP_SCAN_TIMEOUT_MS,
    onTimeout: (child) => terminateScannerChild(child, {
      kind: "orphan-backstop-scanner-escalated",
      timeoutMs: BACKSTOP_SCAN_TIMEOUT_MS
    })
  };
}
function isOwnEntry(entry, selfStart) {
  return entry.pid === process.pid && (entry.processStart === void 0 || entry.processStart === selfStart);
}
var _enabledCache;
function isInstanceRegistryEnabled() {
  if (_enabledCache !== void 0)
    return _enabledCache;
  _enabledCache = process.env.PI_LENS_INSTANCE_REGISTRY !== "0";
  return _enabledCache;
}
function recordCorruptRegistryRead(reasonCode) {
  recordDegradationOnce({
    kind: "instance-registry-corrupt",
    subject: "instances.json",
    reason: `read failed (${reasonCode}); treating as empty`
  });
}
async function readRegistryAsync() {
  try {
    const raw = await fs7.promises.readFile(registryPath(), "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.instances)) {
      return parsed;
    }
    recordCorruptRegistryRead("invalid shape");
    return { instances: [] };
  } catch (err) {
    const code = err?.code;
    if (code !== "ENOENT")
      recordCorruptRegistryRead(code ?? "invalid");
    return { instances: [] };
  }
}
async function readInstanceRegistry() {
  const file = await readRegistryAsync();
  return file.instances;
}
async function writeRegistryAsync(file) {
  const dir = getGlobalPiLensDir();
  const target = registryPath();
  try {
    await fs7.promises.mkdir(dir, { recursive: true });
  } catch {
    return;
  }
  await writeFileAtomicAsync(target, JSON.stringify(file));
}
var REGISTRY_WRITE_RETRIES = 3;
async function writeRegistryWithRetry(mutate, isCommitted) {
  await withInstanceRegistryLock(registryPath(), async () => {
    for (let attempt = 0; attempt < REGISTRY_WRITE_RETRIES; attempt++) {
      const next = mutate(await readRegistryAsync());
      if (next === void 0)
        return;
      await writeRegistryAsync(next);
      if (isCommitted(await readRegistryAsync()))
        return;
    }
  });
}
function getInstanceRoots(entry) {
  const listed = Array.isArray(entry.projectRoots) ? entry.projectRoots.filter((root) => typeof root === "string" && root.length > 0) : [];
  if (listed.length > 0)
    return listed;
  return typeof entry.projectRoot === "string" && entry.projectRoot.length > 0 ? [entry.projectRoot] : [];
}
var INSTANCE_ROOT_CAP = 32;
function mergeInstanceRoots(priorRoots, normalizedRoot) {
  const roots = priorRoots.includes(normalizedRoot) ? [...priorRoots] : [...priorRoots, normalizedRoot];
  while (roots.length > INSTANCE_ROOT_CAP)
    roots.splice(1, 1);
  return roots;
}
var HOST_ROOT_HOLDER = "host";
var ROOT_HOLDER_CAP = 2 * INSTANCE_ROOT_CAP;
function readRootHolders(entry) {
  const raw = entry.projectRootHolders;
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { [HOST_ROOT_HOLDER]: getInstanceRoots(entry) };
  }
  const holders = {};
  for (const [holder, listed] of Object.entries(raw)) {
    if (!Array.isArray(listed))
      continue;
    holders[holder] = listed.filter((root) => typeof root === "string" && root.length > 0);
  }
  return holders;
}
function settleRootHolders(roots, holders) {
  const primary = roots[0];
  const settled = {};
  for (const [holder, listed2] of Object.entries(holders)) {
    const kept = roots.filter((root) => listed2.includes(root));
    if (kept.length > 0)
      settled[holder] = kept;
  }
  if (primary !== void 0) {
    settled[HOST_ROOT_HOLDER] = roots.filter((root) => root === primary || holders[HOST_ROOT_HOLDER]?.includes(root) === true);
  }
  const secondaries = Object.keys(settled).filter((holder) => holder !== HOST_ROOT_HOLDER);
  for (const holder of secondaries.slice(0, Math.max(0, secondaries.length - ROOT_HOLDER_CAP))) {
    delete settled[holder];
  }
  const listed = new Set(Object.values(settled).flat());
  return { roots: roots.filter((root) => listed.has(root)), holders: settled };
}
function registerInstance(projectRoot) {
  const generation = registrationGeneration().capture();
  return queueRegistryMutation(() => registerInstanceNow(projectRoot, generation));
}
async function registerInstanceNow(projectRoot, generation) {
  if (!isInstanceRegistryEnabled())
    return;
  const normalizedRoot = normalizeFilePath(projectRoot);
  if (!registrationIsCurrent(generation, normalizedRoot))
    return;
  rememberRegistrationRoot(projectRoot);
  const pid = process.pid;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const identity = isSubagentSession() ? getSubagentIdentity() : void 0;
  const selfStart = await ownProcessStart(startReadOptions());
  const subagent = identity ? {
    marker: identity.marker,
    agentType: identity.agentName,
    parentPid: identity.parentPid,
    runId: identity.runId
  } : void 0;
  await writeRegistryWithRetry((file) => {
    if (!registrationIsCurrent(generation, normalizedRoot))
      return void 0;
    const others = file.instances.filter((entry) => !isOwnEntry(entry, selfStart));
    const existing = file.instances.find((entry) => isOwnEntry(entry, selfStart));
    const existingRoots = existing ? getInstanceRoots(existing) : [];
    const roots = existing?.rootSource === "lsp-fallback" ? existingRoots.slice(1).reduce((acc, root) => mergeInstanceRoots(acc, root), [normalizedRoot]) : mergeInstanceRoots(existingRoots, normalizedRoot);
    const holders = existing ? readRootHolders(existing) : {};
    const settled = settleRootHolders(roots, {
      ...holders,
      [HOST_ROOT_HOLDER]: [
        ...holders[HOST_ROOT_HOLDER] ?? [],
        normalizedRoot
      ]
    });
    const namespace = ownPidNamespace();
    others.push({
      pid,
      ...selfStart === void 0 ? {} : { processStart: selfStart },
      ...namespace === void 0 ? {} : { pidNamespace: namespace },
      startedAt: existing?.startedAt ?? now,
      projectRoot: settled.roots[0] ?? normalizedRoot,
      projectRoots: settled.roots,
      projectRootHolders: settled.holders,
      lspChildren: existing?.lspChildren ?? [],
      lspChildCount: existing?.lspChildren?.length ?? 0,
      rssBytes: process.memoryUsage().rss,
      heartbeatAt: now,
      ...subagent ? { subagent } : {}
    });
    return { instances: others };
  }, (file) => file.instances.some((entry) => isOwnEntry(entry, selfStart)));
}
async function updateHeartbeat(patch = {}) {
  return queueRegistryMutation(() => updateHeartbeatNow(patch));
}
async function updateHeartbeatNow(patch) {
  if (!isInstanceRegistryEnabled())
    return;
  const pid = process.pid;
  const selfStart = await ownProcessStart(startReadOptions());
  let missing = false;
  await withInstanceRegistryLock(registryPath(), async () => {
    const file = await readRegistryAsync();
    const idx = file.instances.findIndex((entry) => isOwnEntry(entry, selfStart));
    if (idx === -1) {
      missing = true;
      return;
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const current = file.instances[idx];
    const lspChildren = patch.childUsage ? current.lspChildren.map((child) => {
      const usage = patch.childUsage?.[child.pid];
      if (!usage)
        return child;
      return {
        ...child,
        rssBytes: usage.rssBytes ?? child.rssBytes,
        cpuPercent: usage.cpuPercent ?? child.cpuPercent
      };
    }) : current.lspChildren;
    file.instances[idx] = {
      ...current,
      rssBytes: patch.rssBytes ?? process.memoryUsage().rss,
      cpuPercent: patch.cpuPercent ?? current.cpuPercent,
      lspChildren,
      lspChildCount: lspChildren.length,
      heartbeatAt: now
    };
    await writeRegistryAsync(file);
  });
  const intent = registrationIntent();
  if (missing && intent.root !== void 0 && intent.target === registryPath()) {
    incrementDegradationCount({
      kind: "instance-registry-registration-missing",
      subject: String(pid),
      reason: "entry missing at heartbeat; re-registering from the session root"
    });
    void registerInstance(intent.root);
  }
}
var REGISTRATION_INTENT_FAMILY = "instance-registry.registration-intent";
var REGISTRATION_INTENT_VERSION = 1;
function registrationIntent() {
  return getProcessSingleton(REGISTRATION_INTENT_FAMILY, REGISTRATION_INTENT_VERSION, () => ({ root: void 0, target: void 0 }));
}
var REGISTRATION_GENERATION_FAMILY = "instance-registry.registration-generation";
var REGISTRATION_GENERATION_VERSION = 1;
function registrationGeneration() {
  return getProcessSingleton(REGISTRATION_GENERATION_FAMILY, REGISTRATION_GENERATION_VERSION, () => createGenerationSource("instance-registry-registration"));
}
function registrationIsCurrent(generation, normalizedRoot) {
  if (generation.isCurrent())
    return true;
  incrementDegradationCount({
    kind: "instance-registry-registration-superseded",
    subject: normalizedRoot,
    reason: "the session ended before this registration landed; dropped"
  });
  return false;
}
function rememberRegistrationRoot(root) {
  const intent = registrationIntent();
  intent.root = root;
  intent.target = root === void 0 ? void 0 : registryPath();
}
function recordLspChild(entry) {
  const generation = registrationGeneration().capture();
  return queueRegistryMutation(() => recordLspChildNow(entry, generation));
}
async function recordLspChildNow(entry, generation) {
  if (!isInstanceRegistryEnabled())
    return;
  const pid = process.pid;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const [selfStart, childStart] = await Promise.all([
    ownProcessStart(startReadOptions()),
    readProcessStart(entry.pid, startReadOptions())
  ]);
  const childEntry = {
    pid: entry.pid,
    serverId: entry.serverId,
    command: entry.command,
    marker: entry.marker,
    spawnedAt: now,
    ...childStart === void 0 ? {} : { processStart: childStart }
  };
  const hostIdentity = getSubagentIdentity();
  await writeRegistryWithRetry((file) => {
    const idx = file.instances.findIndex((inst) => isOwnEntry(inst, selfStart));
    if (idx === -1) {
      const guessedRoot = normalizeFilePath(entry.sessionIdentity?.projectRoot ?? process.cwd());
      if (!registrationIsCurrent(generation, guessedRoot))
        return void 0;
      recordDegradationOnce({
        kind: "instance-registry-registration-missing",
        subject: String(pid),
        reason: "synthesizing host entry while recording an LSP child"
      });
      const identity = entry.sessionIdentity;
      if (!identity?.projectRoot) {
        recordDegradationOnce({
          kind: "instance-registry-identity-fallback",
          subject: String(pid),
          reason: "session cwd unavailable; using process cwd"
        });
      }
      const projectRoot = normalizeFilePath(identity?.projectRoot ?? process.cwd());
      const namespace = ownPidNamespace();
      file.instances.push({
        pid,
        ...selfStart === void 0 ? {} : { processStart: selfStart },
        ...namespace === void 0 ? {} : { pidNamespace: namespace },
        startedAt: identity?.startedAt ?? now,
        projectRoot,
        rootSource: identity?.rootSource ?? "lsp-fallback",
        projectRoots: [projectRoot],
        lspChildren: [childEntry],
        lspChildCount: 1,
        rssBytes: process.memoryUsage().rss,
        heartbeatAt: now,
        ...hostIdentity ? {
          subagent: {
            marker: hostIdentity.marker,
            agentType: hostIdentity.agentName,
            parentPid: hostIdentity.parentPid,
            runId: hostIdentity.runId
          }
        } : {}
      });
    } else {
      const current = file.instances[idx];
      const filtered = current.lspChildren.filter((child) => child.pid !== entry.pid);
      filtered.push(childEntry);
      file.instances[idx] = {
        ...current,
        lspChildren: filtered,
        lspChildCount: filtered.length
      };
    }
    return file;
  }, (file) => file.instances.some((instance) => isOwnEntry(instance, selfStart) && instance.lspChildren.some((child) => child.pid === entry.pid)));
}
function removeLspChild(pid, expectedMarker) {
  return queueRegistryMutation(() => removeLspChildNow(pid, expectedMarker));
}
async function removeLspChildNow(pid, expectedMarker) {
  if (!isInstanceRegistryEnabled())
    return;
  const selfStart = await ownProcessStart(startReadOptions());
  await withInstanceRegistryLock(registryPath(), async () => {
    const file = await readRegistryAsync();
    const idx = file.instances.findIndex((inst) => isOwnEntry(inst, selfStart));
    if (idx === -1)
      return;
    const current = file.instances[idx];
    const filtered = current.lspChildren.filter((child) => {
      if (child.pid !== pid)
        return true;
      if (expectedMarker && child.marker && child.marker !== expectedMarker) {
        return true;
      }
      return false;
    });
    if (filtered.length === current.lspChildren.length)
      return;
    file.instances[idx] = {
      ...current,
      lspChildren: filtered,
      lspChildCount: filtered.length
    };
    await writeRegistryAsync(file);
  });
}
function rootsOverlap(a, b) {
  if (a === b)
    return true;
  const [shorter, longer] = a.length < b.length ? [a, b] : [b, a];
  return longer.startsWith(shorter.endsWith("/") ? shorter : `${shorter}/`);
}
function selectLivePeerInstances(entries, root, now = Date.now(), isPidAlive2 = realIsPidAlive, match = "exact") {
  const normalizedRoot = normalizeFilePath(root);
  return entries.filter((entry) => entry.pid !== process.pid && // #2130: a host serves a SET of roots. Matching only
  // `entry.projectRoot` made every secondary root invisible, so a peer
  // working in the same checkout under its second root read as "no
  // peer" — and the shared-checkout guard then allowed the destructive
  // command it exists to block.
  getInstanceRoots(entry).some((entryRoot) => match === "exact" ? entryRoot === normalizedRoot : rootsOverlap(entryRoot, normalizedRoot)) && isPidAlive2(entry.pid) && Number.isFinite(Date.parse(entry.heartbeatAt)) && now - Date.parse(entry.heartbeatAt) <= STALE_HEARTBEAT_MS).sort((a, b) => Date.parse(a.startedAt) - Date.parse(b.startedAt));
}
function computeResourceFootprint(instances, isPidAlive2) {
  const liveInstances = isPidAlive2 ? instances.filter((instance) => isPidAlive2(instance.pid)) : instances;
  const perInstance = liveInstances.map((instance) => {
    const lspChildRssBytes = instance.lspChildren.reduce((sum, child) => sum + (child.rssBytes ?? 0), 0);
    const lspChildCpuPercent = instance.lspChildren.reduce((sum, child) => sum + (child.cpuPercent ?? 0), 0);
    const roots = getInstanceRoots(instance);
    return {
      pid: instance.pid,
      projectRoot: roots[0] ?? instance.projectRoot,
      projectRoots: roots,
      rssBytes: instance.rssBytes ?? 0,
      cpuPercent: instance.cpuPercent ?? 0,
      lspChildCount: instance.lspChildren.length,
      lspChildRssBytes,
      lspChildCpuPercent
    };
  });
  let totalRssBytes = 0;
  let totalCpuPercent = 0;
  let totalLspChildCount = 0;
  for (const inst of perInstance) {
    totalRssBytes += inst.rssBytes + inst.lspChildRssBytes;
    totalCpuPercent += inst.cpuPercent + inst.lspChildCpuPercent;
    totalLspChildCount += inst.lspChildCount;
  }
  return {
    instanceCount: perInstance.length,
    totalRssBytes,
    totalCpuPercent,
    totalLspChildCount,
    perInstance
  };
}
async function getResourceFootprint(isPidAlive2 = realIsPidAlive) {
  const instances = await readInstanceRegistry();
  const namespace = ownPidNamespace();
  const dead = instances.filter((instance) => !isPidAlive2(instance.pid) && instance.lspChildren.length === 0 && isInPidNamespace(instance, namespace)).map((instance) => ({
    pid: instance.pid,
    processStart: instance.processStart,
    pidNamespace: instance.pidNamespace
  }));
  if (dead.length > 0) {
    queueRegistryMutation(() => prunePids(dead)).catch(() => {
    });
  }
  return computeResourceFootprint(instances, isPidAlive2);
}
async function pruneDeadInstances(dead) {
  const result = await withInstanceRegistryLock(registryPath(), async () => {
    const file = await readRegistryAsync();
    const key = (identity) => `${identity.pid}:${identity.processStart ?? ""}:${identity.pidNamespace ?? ""}`;
    const targets = new Set(dead.map(key));
    const remaining = file.instances.filter((entry) => !targets.has(key(entry)));
    if (remaining.length === file.instances.length)
      return "no-match";
    await writeRegistryAsync({ instances: remaining });
    return "pruned";
  });
  return result ?? "could-not-acquire";
}
async function prunePids(dead) {
  await pruneDeadInstances(dead);
}

// dist/clients/instance-reaper.js
var STALE_HEARTBEAT_MS = 6 * 60 * 60 * 1e3;
var isWindows = process.platform === "win32";
function realIsPidAlive(pid) {
  if (!Number.isFinite(pid) || pid <= 0)
    return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    const code = err?.code;
    if (code === "ESRCH")
      return false;
    return true;
  }
}
var STAGE_PID_PATTERN = /\.stage-(\d+)-/;
function isStaleStageFile(entry, artifactPrefix) {
  if (!entry.startsWith(artifactPrefix))
    return false;
  const match = STAGE_PID_PATTERN.exec(entry);
  if (!match)
    return false;
  return !realIsPidAlive(Number(match[1]));
}
var ATOMIC_STAGE_SWEEP_MAX_ENTRIES = 512;
async function sweepAtomicWriteStages(directories, options = {}) {
  const requestedMax = options.maxEntries ?? ATOMIC_STAGE_SWEEP_MAX_ENTRIES;
  const maxEntries = Number.isFinite(requestedMax) ? Math.max(1, Math.floor(requestedMax)) : ATOMIC_STAGE_SWEEP_MAX_ENTRIES;
  const isPidAlive2 = options.isPidAlive ?? realIsPidAlive;
  return sweepOwnStagingFiles(directories, { maxEntries, isPidAlive: isPidAlive2 });
}
var KILL_VERIFY_ATTEMPTS = 5;
var KILL_VERIFY_INTERVAL_MS = 100;
function sleepUnref(ms) {
  return new Promise((resolve6) => {
    const timer = setTimeout(resolve6, ms);
    timer.unref();
  });
}
async function killPidTree(pid, options = {}) {
  if (!Number.isFinite(pid) || pid <= 0)
    return "invalid";
  if (options.confirmIdentity && !await options.confirmIdentity())
    return "changed";
  if (isWindows) {
    try {
      const taskkill = windowsExe("taskkill.exe");
      const killer = nodeSpawn2(taskkill, ["/F", "/T", "/PID", String(pid)], {
        shell: false,
        windowsHide: true,
        stdio: "ignore"
      });
      unrefChildAndPipes(killer);
      await new Promise((resolve6) => {
        killer.once("close", () => resolve6());
        killer.once("error", () => resolve6());
      });
    } catch {
    }
  } else {
    try {
      process.kill(-pid, "SIGKILL");
    } catch {
      try {
        process.kill(pid, "SIGKILL");
      } catch {
      }
    }
  }
  return await verifyPidGone(pid, options);
}
async function verifyPidGone(pid, options = {}) {
  const isPidAlive2 = options.isPidAlive ?? realIsPidAlive;
  const attempts = Math.max(1, options.verifyAttempts ?? KILL_VERIFY_ATTEMPTS);
  const intervalMs = Math.max(0, options.verifyIntervalMs ?? KILL_VERIFY_INTERVAL_MS);
  for (let attempt = 0; attempt < attempts; attempt++) {
    let alive;
    try {
      alive = isPidAlive2(pid);
    } catch {
      alive = true;
    }
    if (!alive)
      return "gone";
    if (attempt < attempts - 1)
      await sleepUnref(intervalMs);
  }
  return "alive";
}
var MANAGED_BINARIES = [
  { name: "ast-grep", launcher: "native" },
  { name: "opengrep-core", launcher: "native" },
  { name: "opengrep", launcher: "native" },
  { name: "marksman", launcher: "native" },
  { name: "zizmor", launcher: "native" },
  { name: "typos-lsp", launcher: "native" },
  { name: "yaml-language-server", launcher: "node" },
  { name: "typescript-language-server", launcher: "node" }
];
var MANAGED_BINARY_NAMES = MANAGED_BINARIES.map((binary) => binary.name);
var MANAGED_IMAGE_NAMES = [
  ...new Set(MANAGED_BINARIES.map((binary) => binary.launcher === "node" ? "node.exe" : `${binary.name}.exe`))
];
async function terminateScannerChild(child, options) {
  const pid = child.pid;
  const outcome = typeof pid === "number" && pid > 0 ? await killPidTree(pid, {
    verifyAttempts: options.verifyAttempts,
    verifyIntervalMs: options.verifyIntervalMs
  }) : "invalid";
  incrementDegradationCount({
    kind: options.kind,
    subject: `${isWindows ? "win32-cim" : "posix-ps"}#${pid ?? "no-pid"}`,
    reason: `scan exceeded its ${options.timeoutMs}ms timeout; tree kill reported ${outcome}`
  });
  return outcome;
}
var BACKSTOP_SCAN_TIMEOUT_MS = 5e3;
var BACKSTOP_COOLDOWN_MS = 30 * 60 * 1e3;

// dist/clients/resource-sampler.js
var RESOURCE_SAMPLE_QUERY_TIMEOUT_MS = 2e3;
var SPAWN_SAMPLER_LEDGER_SUBJECT = "spawn-usage-sampler";
function recordQueryFailure(subject, status, exitCode) {
  const exitReason = status === "exit-error" ? ` (exit code ${exitCode ?? "unknown"})` : "";
  recordDegradationOnce({
    kind: "resource-sampler-query-failed",
    subject,
    reason: `process-table query ${status}${exitReason}`
  });
}
function runningOnWindows2() {
  return process.platform === "win32";
}
function walkDescendantPids(rootPid, pairs) {
  const childrenByParent = /* @__PURE__ */ new Map();
  for (const [pid, ppid] of pairs) {
    const list = childrenByParent.get(ppid);
    if (list)
      list.push(pid);
    else
      childrenByParent.set(ppid, [pid]);
  }
  const descendants = [];
  const queue = [rootPid];
  const visited = /* @__PURE__ */ new Set([rootPid]);
  while (queue.length > 0) {
    const current = queue.shift();
    for (const child of childrenByParent.get(current) ?? []) {
      if (visited.has(child))
        continue;
      visited.add(child);
      descendants.push(child);
      queue.push(child);
    }
  }
  return descendants;
}
async function findDescendantPidsWindows(rootPid) {
  if (!runningOnWindows2() || !Number.isFinite(rootPid) || rootPid <= 0)
    return [];
  const result = await queryProcessTable({ fields: ["pid", "ppid"] }, {
    timeoutMs: RESOURCE_SAMPLE_QUERY_TIMEOUT_MS,
    onTimeout: (child) => terminateScannerChild(child, {
      kind: "resource-sampler-scanner-escalated",
      timeoutMs: RESOURCE_SAMPLE_QUERY_TIMEOUT_MS
    })
  });
  if (result.status !== "ok") {
    recordQueryFailure("windows-descendant-process-table", result.status, result.exitCode);
    return null;
  }
  return walkDescendantPids(rootPid, result.rows.map((row) => [row.pid, row.ppid]));
}
var windowsCpuHistory = /* @__PURE__ */ new Map();
var CPU_HISTORY_MAX_AGE_MS = 6e4;
var CPU_HISTORY_MAX_ENTRIES = 4096;
async function sampleProcessesWindows(valid) {
  const samples = /* @__PURE__ */ new Map();
  if (valid.length === 0)
    return samples;
  const query = await queryProcessTable({
    fields: [
      "pid",
      "rssBytes",
      "cpuKernel100ns",
      "cpuUser100ns",
      "startedAt"
    ],
    filter: { column: "ProcessId", op: "eq", values: valid }
  }, {
    timeoutMs: RESOURCE_SAMPLE_QUERY_TIMEOUT_MS,
    onTimeout: (child) => terminateScannerChild(child, {
      kind: "resource-sampler-scanner-escalated",
      timeoutMs: RESOURCE_SAMPLE_QUERY_TIMEOUT_MS
    })
  });
  if (query.status !== "ok") {
    recordQueryFailure("windows-process-table", query.status, query.exitCode);
    return null;
  }
  try {
    const now = Date.now();
    const seen = /* @__PURE__ */ new Set();
    for (const row of query.rows) {
      const pid = row.pid;
      const workingSet = row.rssBytes;
      const kernel100ns = row.cpuKernel100ns;
      const user100ns = row.cpuUser100ns;
      const processIdentity = row.startedAt ?? "";
      if (workingSet === void 0 || kernel100ns === void 0 || user100ns === void 0 || processIdentity.length === 0)
        continue;
      const cpuMs = Math.round(kernel100ns / 1e4) + Math.round(user100ns / 1e4);
      const historyKey = `${pid}:${processIdentity}`;
      for (const [key, prior] of windowsCpuHistory) {
        if (prior.processIdentity !== processIdentity && key.startsWith(`${pid}:`)) {
          windowsCpuHistory.delete(key);
        }
      }
      const prev = windowsCpuHistory.get(historyKey);
      if (prev && cpuMs < prev.cpuMs) {
        windowsCpuHistory.delete(historyKey);
        continue;
      }
      let cpuPercent = 0;
      if (prev) {
        const wallMs = now - prev.ts;
        if (wallMs > 0) {
          cpuPercent = (cpuMs - prev.cpuMs) / wallMs * 100;
          if (!Number.isFinite(cpuPercent) || cpuPercent < 0)
            cpuPercent = 0;
        }
      }
      windowsCpuHistory.set(historyKey, { processIdentity, cpuMs, ts: now });
      seen.add(pid);
      samples.set(pid, { rssBytes: workingSet, cpuPercent });
    }
    for (const [key, entry] of windowsCpuHistory) {
      const pid = Number(key.slice(0, key.indexOf(":")));
      if (!seen.has(pid) && now - entry.ts > CPU_HISTORY_MAX_AGE_MS) {
        windowsCpuHistory.delete(key);
      }
    }
    while (windowsCpuHistory.size > CPU_HISTORY_MAX_ENTRIES) {
      let oldestKey;
      let oldestTs = Number.POSITIVE_INFINITY;
      for (const [key, entry] of windowsCpuHistory) {
        if (entry.ts < oldestTs) {
          oldestKey = key;
          oldestTs = entry.ts;
        }
      }
      if (oldestKey === void 0)
        break;
      windowsCpuHistory.delete(oldestKey);
    }
  } catch {
  }
  return samples;
}
async function sampleProcesses(pids) {
  const result = /* @__PURE__ */ new Map();
  const valid = [...new Set(pids.filter((p) => Number.isFinite(p) && p > 0))];
  if (valid.length === 0)
    return result;
  if (runningOnWindows2()) {
    return await sampleProcessesWindows(valid);
  }
  try {
    const stats = await (0, import_pidusage.default)(valid);
    for (const pid of valid) {
      const stat = stats[String(pid)];
      if (!stat)
        continue;
      if (!Number.isFinite(stat.cpu) || stat.cpu < 0 || !Number.isFinite(stat.memory) || stat.memory < 0)
        continue;
      result.set(pid, {
        rssBytes: stat.memory,
        cpuPercent: stat.cpu
      });
    }
  } catch {
    recordQueryFailure("posix-pidusage-process-table", "spawn-error");
    return null;
  }
  return result;
}
var UsageAccumulator = class {
  sampleCount = 0;
  cpuSum = 0;
  rssSum = 0;
  cpuPeak = 0;
  rssPeak = 0;
  addSample(usage) {
    this.sampleCount++;
    this.cpuSum += usage.cpuPercent;
    this.rssSum += usage.rssBytes;
    if (usage.cpuPercent > this.cpuPeak)
      this.cpuPeak = usage.cpuPercent;
    if (usage.rssBytes > this.rssPeak)
      this.rssPeak = usage.rssBytes;
  }
  get count() {
    return this.sampleCount;
  }
  summarize() {
    if (this.sampleCount === 0)
      return null;
    return {
      sampleCount: this.sampleCount,
      avgCpuPercent: this.cpuSum / this.sampleCount,
      peakCpuPercent: this.cpuPeak,
      avgRssBytes: this.rssSum / this.sampleCount,
      peakRssBytes: this.rssPeak
    };
  }
};
async function sampleProcessTreeCpuPercent(pid, windowMs = 1200, floorPercent = 10) {
  if (!Number.isFinite(pid) || pid <= 0) {
    return { busy: false, measured: false, cpuPercent: null };
  }
  const targetPid = pid;
  const readOnce = async () => {
    try {
      const descendants = runningOnWindows2() ? await findDescendantPidsWindows(targetPid) : [];
      if (descendants === null)
        return null;
      const pids = runningOnWindows2() ? [targetPid, ...descendants] : [targetPid];
      const usageByPid = await sampleProcesses(pids);
      if (usageByPid === null)
        return null;
      const targetUsage = usageByPid.get(targetPid);
      if (!targetUsage)
        return { cpuPercent: 0, measured: false };
      let cpuPercent = 0;
      for (const usage of usageByPid.values())
        cpuPercent += usage.cpuPercent;
      return { cpuPercent, measured: true };
    } catch {
      return null;
    }
  };
  const first = await readOnce();
  const second = await new Promise((resolve6) => {
    const timer = setTimeout(() => {
      void readOnce().then(resolve6);
    }, windowMs);
    timer.unref?.();
  });
  if (first === null && second === null) {
    return { busy: false, measured: false, cpuPercent: null };
  }
  if (first === null || second === null || !first.measured || !second.measured) {
    return { busy: false, measured: false, cpuPercent: null };
  }
  const observed = second.cpuPercent;
  return {
    busy: observed > floorPercent,
    measured: true,
    cpuPercent: observed
  };
}
var SPAWN_SAMPLE_INTERVAL_MS = 750;
var SPAWN_SAMPLE_FULL_RATE_TICKS = 8;
var SPAWN_SAMPLE_MAX_INTERVAL_MULTIPLIER = 16;
function startSpawnUsageSampler(pid, intervalMs = SPAWN_SAMPLE_INTERVAL_MS, lifetimeCapMs) {
  if (!Number.isFinite(pid) || pid <= 0) {
    return { stop: () => null };
  }
  const targetPid = pid;
  const accumulator = new UsageAccumulator();
  const startedAt = Date.now();
  let stopped = false;
  let inFlight = false;
  let tickCount = 0;
  let timer;
  const tick = async () => {
    if (stopped)
      return;
    try {
      const descendants = runningOnWindows2() ? await findDescendantPidsWindows(targetPid) : [];
      if (descendants === null)
        return;
      const pids = runningOnWindows2() ? [targetPid, ...descendants] : [targetPid];
      const usageByPid = await sampleProcesses(pids);
      if (usageByPid === null)
        return;
      if (stopped || usageByPid.size === 0)
        return;
      let rssBytes = 0;
      let cpuPercent = 0;
      for (const usage of usageByPid.values()) {
        rssBytes += usage.rssBytes;
        cpuPercent += usage.cpuPercent;
      }
      accumulator.addSample({ rssBytes, cpuPercent });
    } catch {
    }
  };
  const releaseInFlight = () => {
    inFlight = false;
  };
  const nextDelayMs = () => {
    if (tickCount <= SPAWN_SAMPLE_FULL_RATE_TICKS)
      return intervalMs;
    const grown = intervalMs * 2 ** (tickCount - SPAWN_SAMPLE_FULL_RATE_TICKS);
    return Math.min(grown, intervalMs * SPAWN_SAMPLE_MAX_INTERVAL_MULTIPLIER);
  };
  const arm = (delayMs) => {
    timer = setTimeout(runTick, delayMs);
    timer.unref?.();
  };
  function runTick() {
    timer = void 0;
    if (stopped)
      return;
    if (Date.now() - startedAt >= lifetimeCapMs) {
      incrementDegradationCount({
        kind: "resource-sampler-lifetime-capped",
        subject: SPAWN_SAMPLER_LEDGER_SUBJECT,
        reason: `spawn sampler stopped polling at its ${lifetimeCapMs}ms lifetime cap; the child was still running`
      });
      return;
    }
    tickCount++;
    if (inFlight) {
      incrementDegradationCount({
        kind: "resource-sampler-tick-overlapped",
        subject: SPAWN_SAMPLER_LEDGER_SUBJECT,
        reason: `spawn sampler skipped a poll tick: the previous sample was still in flight after ${intervalMs}ms`
      });
    } else {
      inFlight = true;
      void tick().then(releaseInFlight, releaseInFlight);
    }
    arm(nextDelayMs());
  }
  tickCount = 1;
  inFlight = true;
  void tick().then(releaseInFlight, releaseInFlight);
  arm(nextDelayMs());
  return {
    stop() {
      if (stopped)
        return accumulator.summarize();
      stopped = true;
      if (timer !== void 0)
        clearTimeout(timer);
      timer = void 0;
      return accumulator.summarize();
    }
  };
}

// dist/clients/safe-spawn.js
var SpawnFailureError = class extends Error {
  kind;
  cause;
  name = "SpawnFailureError";
  constructor(kind, message, cause) {
    super(message, { cause });
    this.kind = kind;
    this.cause = cause;
  }
};
function hasSpawnFailureKind(error, kind) {
  return error instanceof Error && "kind" in error && error.kind === kind;
}
function resolveTeardownOutcome(input) {
  if (input.killStartedAtMs === void 0 || input.deathObservedAtMs === void 0) {
    return void 0;
  }
  if (input.deathObservedAtMs <= input.killStartedAtMs) {
    return { ms: 0, outcome: "exited" };
  }
  return {
    ms: Math.max(0, input.deathObservedAtMs - input.killStartedAtMs),
    outcome: input.escalated ? "escalate-kill" : "killed-by-signal"
  };
}
function toError(error) {
  return error instanceof Error ? error : new Error(String(error));
}
function errorCode(error) {
  return error.code;
}
async function cwdIsUnresolvable(cwd) {
  if (cwd === void 0)
    return false;
  try {
    return !(await fs8.promises.stat(cwd)).isDirectory();
  } catch {
    return true;
  }
}
function cwdIsUnresolvableSync(cwd) {
  if (cwd === void 0)
    return false;
  try {
    return !fs8.statSync(cwd).isDirectory();
  } catch {
    return true;
  }
}
function commandProbablyPresent(command) {
  const exts = process.platform === "win32" ? [
    "",
    ...(process.env.PATHEXT ?? ".COM;.EXE;.BAT;.CMD").split(";").filter(Boolean)
  ] : [""];
  const existsWithExt = (base) => {
    for (const ext of exts) {
      try {
        if (fs8.existsSync(base + ext))
          return true;
      } catch {
      }
    }
    return false;
  };
  if (path11.isAbsolute(command))
    return existsWithExt(command);
  if (command.includes("/") || command.includes("\\"))
    return "ambiguous";
  for (const dir of (process.env.PATH ?? "").split(path11.delimiter)) {
    if (dir && existsWithExt(path11.join(dir, command)))
      return true;
  }
  return false;
}
function classifyWithCwdFlag(cause, options, cwdUnresolvable) {
  const code = errorCode(cause);
  let failure;
  if (code === "ENOENT" && cwdUnresolvable && commandProbablyPresent(options.command) !== false) {
    failure = new SpawnFailureError("cwd-unresolvable", `Cannot spawn ${options.command}: working directory is unresolvable (${options.cwd})`, cause);
  } else if (code === "ENOENT") {
    failure = new SpawnFailureError("tool-not-found", `Cannot spawn ${options.command}: tool not found (${cause.message})`, cause);
  } else if (code === "EACCES" || code === "EPERM") {
    failure = new SpawnFailureError("permission-denied", `Cannot spawn ${options.command}: permission denied`, cause);
  } else {
    failure = new SpawnFailureError("spawn-failed", `Cannot spawn ${options.command}: ${cause.message}`, cause);
  }
  recordSpawnClassification(failure, options);
  return failure;
}
var loggedSpawnClassifications = /* @__PURE__ */ new Set();
var SPAWN_CLASSIFICATION_LOG_CAP = 200;
function recordSpawnClassification(failure, options) {
  const pair = `${failure.kind}\0${options.command}`;
  if (!loggedSpawnClassifications.has(pair)) {
    if (loggedSpawnClassifications.size >= SPAWN_CLASSIFICATION_LOG_CAP) {
      loggedSpawnClassifications.clear();
    }
    loggedSpawnClassifications.add(pair);
    logExtension({
      subsystem: "safe-spawn",
      level: "debug",
      message: "spawn failure classified",
      metadata: {
        kind: failure.kind,
        command: options.command,
        cwd: options.cwd
      }
    });
  }
  if (failure.kind !== "tool-not-found") {
    recordDegradation({
      kind: "spawn-failure",
      subject: options.command,
      reason: `${failure.kind}${options.cwd ? ` in ${options.cwd}` : ""}`
    });
  }
}
async function classifySpawnFailure(error, options) {
  const cause = toError(error);
  const needsCwdProbe = errorCode(cause) === "ENOENT";
  const cwdUnresolvable = needsCwdProbe && await cwdIsUnresolvable(options.cwd);
  return classifyWithCwdFlag(cause, options, cwdUnresolvable);
}
function classifySpawnFailureSync(error, options) {
  const cause = toError(error);
  const needsCwdProbe = errorCode(cause) === "ENOENT";
  const cwdUnresolvable = needsCwdProbe && cwdIsUnresolvableSync(options.cwd);
  return classifyWithCwdFlag(cause, options, cwdUnresolvable);
}
var lifetimeStateKey = /* @__PURE__ */ Symbol.for("pi-lens.safe-spawn.lifetime-state");
var processWithLifetimeState = process;
var lifetimeState = processWithLifetimeState[lifetimeStateKey] ?? (processWithLifetimeState[lifetimeStateKey] = {
  pids: /* @__PURE__ */ new Set(),
  installed: false
});
var PROC_PPID_READABLE = (() => {
  if (process.platform !== "linux")
    return false;
  try {
    return /^PPid:\s*\d+$/m.test(fs8.readFileSync("/proc/self/status", "utf8"));
  } catch {
    return false;
  }
})();
var VERIFIED_OWN_PID_CAP = 512;
var verifiedOwnPids = new BoundedFifoMap(VERIFIED_OWN_PID_CAP);
var HELD_OWN_PID_SWEEP_AT = 256;
var heldOwnPids = new BoundedSet(HELD_OWN_PID_SWEEP_AT);
function groupIsGone(pid) {
  try {
    process.kill(-pid, 0);
    return false;
  } catch (error) {
    return errorCode(error) === "ESRCH";
  }
}
function sweepHeldOwnPids() {
  if (heldOwnPids.size < HELD_OWN_PID_SWEEP_AT)
    return;
  for (const pid of heldOwnPids) {
    if (groupIsGone(pid))
      heldOwnPids.delete(pid);
  }
}
function holdOwnChildPid(pid, site) {
  const owned = isOwnLiveChild(pid, site);
  if (!owned || !PROC_PPID_READABLE || typeof pid !== "number")
    return owned;
  verifiedOwnPids.delete(pid);
  sweepHeldOwnPids();
  heldOwnPids.add(pid);
  return true;
}
function releaseOwnChildPid(pid) {
  if (typeof pid === "number")
    heldOwnPids.delete(pid);
}
function recordProcUnavailable(site) {
  if (process.platform !== "linux")
    return;
  recordDegradationOnce({
    kind: "kill-ownership-unverifiable",
    subject: site,
    reason: "/proc/self/status is unreadable on this Linux host; kill-by-pid ownership falls back to best-effort"
  });
}
function isOwnLiveChild(pid, site, handle) {
  if (typeof pid !== "number" || !Number.isInteger(pid) || pid <= 0)
    return false;
  if (!PROC_PPID_READABLE) {
    if (handle && (handle.exitCode != null || handle.signalCode != null))
      return false;
    recordProcUnavailable(site);
    return true;
  }
  let status;
  try {
    status = fs8.readFileSync(`/proc/${pid}/status`, "utf8");
  } catch {
    return heldOwnPids.has(pid) || verifiedOwnPids.has(pid);
  }
  const parent = /^PPid:\s*(\d+)$/m.exec(status);
  if (!parent)
    return true;
  if (Number(parent[1]) === process.pid) {
    if (!heldOwnPids.has(pid))
      verifiedOwnPids.set(pid, true);
    return true;
  }
  incrementDegradationCount({
    kind: "kill-foreign-pid-refused",
    subject: site,
    reason: `pid ${pid} has parent ${parent[1]}, not this process \u2014 signal refused`
  });
  return false;
}
function killPidTreeSync(pid) {
  if (process.platform === "win32") {
    try {
      const taskkill = `${process.env.SystemRoot ?? "C:\\Windows"}\\System32\\taskkill.exe`;
      spawnSync(taskkill, ["/F", "/T", "/PID", String(pid)], {
        shell: false,
        windowsHide: true,
        stdio: "ignore"
      });
    } catch {
    }
    return;
  }
  try {
    try {
      process.kill(-pid, "SIGKILL");
    } catch {
      process.kill(pid, "SIGKILL");
    }
  } catch {
  }
}
function installLifetimeCleanup() {
  if (lifetimeState.installed)
    return;
  lifetimeState.installed = true;
  process.once("exit", () => {
    for (const pid of lifetimeState.pids)
      killPidTreeSync(pid);
  });
  for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
    process.once(signal, () => {
      for (const pid of lifetimeState.pids)
        killPidTreeSync(pid);
      if (process.platform === "win32" && signal === "SIGHUP") {
        recordDegradationOnce({
          kind: "safe-spawn-signal-reraise-unsupported",
          subject: `${process.platform}:${signal}`,
          reason: `${process.platform} ${signal}: self signal re-raise is unsupported by the Windows libuv signal capability`,
          metadata: {
            platform: process.platform,
            signal,
            reason: "unsupported"
          }
        });
        return;
      }
      try {
        process.kill(process.pid, signal);
      } catch (error) {
        recordDegradationOnce({
          kind: "safe-spawn-signal-reraise-unsupported",
          subject: `${process.platform}:${signal}`,
          reason: `${process.platform} ${signal}: self signal re-raise was refused (${error.code ?? error.message})`,
          metadata: {
            platform: process.platform,
            signal,
            reason: "refused",
            code: error.code ?? null
          }
        });
      }
    });
  }
}
var ambientAbortSignal;
function setAmbientAbortSignal(signal) {
  ambientAbortSignal = signal;
}
function getAmbientAbortSignal() {
  return ambientAbortSignal;
}
function cmdEscapeArg(arg) {
  if (!/[\s"&|<>^()]/.test(arg))
    return arg;
  return `"${arg.replace(/"/g, '""')}"`;
}
function buildWindowsShellCommand(command, args) {
  const chcp = `${process.env.SystemRoot ?? "C:\\Windows"}\\System32\\chcp.com`;
  return `${chcp} 65001 >nul 2>&1 & ${[command, ...args].map(cmdEscapeArg).join(" ")}`;
}
var WINDOWS_DIRECT_RESOLVABLE_EXTS = /* @__PURE__ */ new Set([
  ".exe",
  ".com",
  ".cmd",
  ".bat"
]);
function mergeWindowsEnvironment(base, overrides) {
  const entries = /* @__PURE__ */ new Map();
  const assign = (source) => {
    if (!source)
      return;
    for (const [key, value] of Object.entries(source)) {
      const folded = key.toLowerCase();
      entries.delete(folded);
      if (value !== void 0)
        entries.set(folded, { key, value });
    }
  };
  assign(base);
  assign(overrides);
  const merged = {};
  for (const { key, value } of entries.values())
    merged[key] = value;
  return merged;
}
function getWindowsEnvironmentValue(env, name) {
  let value;
  for (const [key, entry] of Object.entries(env)) {
    if (key.toLowerCase() === name.toLowerCase())
      value = entry;
  }
  return value;
}
function driveLetter(value) {
  const match = /^([A-Za-z]):/.exec(value);
  return match?.[1]?.toUpperCase();
}
function isDriveAbsolute(value, drive) {
  return value.length >= 3 && value[0]?.toUpperCase() === drive.toUpperCase() && value[1] === ":" && (value[2] === "\\" || value[2] === "/");
}
function isDriveAbsoluteAnyDrive(value) {
  const drive = driveLetter(value);
  return drive !== void 0 && isDriveAbsolute(value, drive);
}
function isUncWindowsPath(value) {
  return (value[0] === "\\" || value[0] === "/") && (value[1] === "\\" || value[1] === "/") && value[2] !== "\\" && value[2] !== "/";
}
function isFullyQualifiedWindowsPath(value) {
  return isFullyQualifiedWin32(value) && !isRootedWindowsPath(value);
}
function isRootedWindowsPath(value) {
  return (value[0] === "\\" || value[0] === "/") && driveLetter(value) === void 0 && !isUncWindowsPath(value);
}
function resolveRootedWindowsPath(value, driveSource) {
  const drive = driveLetter(driveSource);
  if (drive === void 0)
    return path11.win32.normalize(value);
  return path11.win32.normalize(path11.win32.resolve(`${drive}:\\`, value));
}
function getValidatedPerDriveCwd(env, drive) {
  const value = getWindowsEnvironmentValue(env, `=${drive}:`);
  if (value === void 0 || !isDriveAbsolute(value, drive))
    return void 0;
  return path11.win32.normalize(value);
}
function resolveEffectiveWindowsCwd(cwd, env) {
  if (cwd === void 0) {
    return path11.win32.normalize(process.cwd());
  }
  const requestedDrive = driveLetter(cwd);
  if (requestedDrive !== void 0 && !isDriveAbsoluteAnyDrive(cwd)) {
    const base = getValidatedPerDriveCwd(env, requestedDrive);
    return base === void 0 ? void 0 : path11.win32.normalize(path11.win32.resolve(base, cwd));
  }
  if (isFullyQualifiedWindowsPath(cwd))
    return path11.win32.normalize(cwd);
  if (isRootedWindowsPath(cwd)) {
    return resolveRootedWindowsPath(cwd, process.cwd());
  }
  return path11.win32.normalize(path11.win32.resolve(process.cwd(), cwd));
}
function resolveDriveRelativeWindowsPath(value, effectiveCwd, env) {
  const drive = driveLetter(value);
  if (drive === void 0)
    return void 0;
  const cwdDrive = effectiveCwd === void 0 ? void 0 : driveLetter(effectiveCwd);
  const base = cwdDrive?.toUpperCase() === drive ? effectiveCwd : getValidatedPerDriveCwd(env, drive);
  if (base === void 0)
    return void 0;
  return path11.win32.normalize(path11.win32.resolve(base, value));
}
function resolveWindowsPathEntry(entry, effectiveCwd, env) {
  if (driveLetter(entry) !== void 0 && !isDriveAbsoluteAnyDrive(entry)) {
    return resolveDriveRelativeWindowsPath(entry, effectiveCwd, env);
  }
  if (isFullyQualifiedWindowsPath(entry))
    return path11.win32.normalize(entry);
  if (isRootedWindowsPath(entry)) {
    return effectiveCwd === void 0 ? void 0 : resolveRootedWindowsPath(entry, effectiveCwd);
  }
  if (effectiveCwd === void 0)
    return void 0;
  return path11.win32.normalize(path11.win32.resolve(effectiveCwd, entry));
}
var WINDOWS_COMMAND_CACHE_MAX_ENTRIES = 256;
var WINDOWS_COMMAND_NEGATIVE_CACHE_TTL_MS = 1e3;
var windowsCommandCache = new BoundedFifoMap(WINDOWS_COMMAND_CACHE_MAX_ENTRIES);
function resetSafeSpawnWindowsCommandCache() {
  windowsCommandCache.clear();
  loggedSpawnClassifications.clear();
}
function cacheWindowsCommandResult(key, resolved) {
  windowsCommandCache.set(key, { resolved, checkedAt: Date.now() });
}
function getPathExts(env) {
  const raw = getWindowsEnvironmentValue(env, "PATHEXT") ?? ".COM;.EXE;.BAT;.CMD";
  return raw.split(";").map((ext) => ext.trim().toLowerCase()).filter(Boolean);
}
function statIsFile(candidate) {
  try {
    return fs8.statSync(candidate).isFile();
  } catch {
    return false;
  }
}
function resolveWindowsCommandUncached(command, effectiveCwd, env) {
  const pathExts = getPathExts(env);
  const existingExt = path11.win32.extname(command).toLowerCase();
  const hasExplicitExt = existingExt.length > 0;
  const isKnownExecutableExt = (ext) => WINDOWS_DIRECT_RESOLVABLE_EXTS.has(ext) || pathExts.includes(ext);
  const tryBase = (base) => {
    if (hasExplicitExt && isKnownExecutableExt(existingExt) && statIsFile(base)) {
      return { resolvedPath: base, ext: existingExt };
    }
    if (!hasExplicitExt || !pathExts.includes(existingExt)) {
      for (const ext of pathExts) {
        const candidate = base + ext;
        if (statIsFile(candidate))
          return { resolvedPath: candidate, ext };
      }
    }
    return null;
  };
  const hasPathSep = /[\\/]/.test(command);
  const hasDrivePrefix = driveLetter(command) !== void 0;
  if (hasPathSep || hasDrivePrefix || isFullyQualifiedWindowsPath(command)) {
    let base;
    if (isFullyQualifiedWindowsPath(command)) {
      base = path11.win32.normalize(command);
    } else if (hasDrivePrefix) {
      base = resolveDriveRelativeWindowsPath(command, effectiveCwd, env);
    } else if (isRootedWindowsPath(command)) {
      base = effectiveCwd === void 0 ? void 0 : resolveRootedWindowsPath(command, effectiveCwd);
    } else if (effectiveCwd !== void 0) {
      base = path11.win32.normalize(path11.win32.resolve(effectiveCwd, command));
    }
    return base === void 0 ? null : tryBase(base);
  }
  const pathValue = getWindowsEnvironmentValue(env, "PATH") ?? "";
  const pathDirs = pathValue.split(path11.win32.delimiter);
  for (const dir of pathDirs) {
    if (!dir)
      continue;
    const resolvedDir = resolveWindowsPathEntry(dir, effectiveCwd, env);
    if (resolvedDir === void 0)
      continue;
    const found = tryBase(path11.win32.join(resolvedDir, command));
    if (found)
      return found;
  }
  return null;
}
function resolveWindowsCommandForEnvironment(command, cwd, env) {
  const effectiveCwd = resolveEffectiveWindowsCwd(cwd, env);
  const pathValue = getWindowsEnvironmentValue(env, "PATH");
  const pathExtValue = getWindowsEnvironmentValue(env, "PATHEXT");
  const perDriveCwds = Object.entries(env).flatMap(([key, value]) => /^=[A-Za-z]:$/.test(key) ? [[key.toLowerCase(), value]] : []).sort(([left], [right]) => compareOrdinal(left, right));
  const cacheKey = JSON.stringify([
    "win32",
    command,
    pathValue === void 0 ? ["absent"] : ["present", pathValue],
    pathExtValue === void 0 ? ["absent"] : ["present", pathExtValue],
    effectiveCwd === void 0 ? ["unresolved"] : ["resolved", effectiveCwd],
    perDriveCwds
  ]);
  const cached = windowsCommandCache.get(cacheKey);
  if (cached) {
    if (cached.resolved && statIsFile(cached.resolved.resolvedPath)) {
      return cached.resolved;
    }
    if (!cached.resolved && Date.now() - cached.checkedAt <= WINDOWS_COMMAND_NEGATIVE_CACHE_TTL_MS) {
      return null;
    }
    windowsCommandCache.delete(cacheKey);
  }
  const resolved = resolveWindowsCommandUncached(command, effectiveCwd, env);
  cacheWindowsCommandResult(cacheKey, resolved);
  return resolved;
}
function resolveWindowsCommand(command, cwd, env) {
  return resolveWindowsCommandForEnvironment(command, cwd, env);
}
function getSpawnEnvironment(overrides, stripNpmConfig) {
  const merged = process.platform === "win32" ? mergeWindowsEnvironment(process.env, overrides) : { ...process.env, ...overrides };
  if (!stripNpmConfig)
    return merged;
  const stripped = {};
  for (const [key, value] of Object.entries(merged)) {
    if (!/^npm_config_/i.test(key))
      stripped[key] = value;
  }
  return stripped;
}
var CMD_UNSAFE_CHARS = /["%!\r\n]/;
function findCmdUnsafeValue(command, args) {
  if (CMD_UNSAFE_CHARS.test(command))
    return command;
  return args.find((arg) => CMD_UNSAFE_CHARS.test(arg));
}
function synthesizeEnoentError(command) {
  const err = new Error(`spawn ${command} ENOENT`);
  err.code = "ENOENT";
  err.syscall = "spawn";
  err.path = command;
  return err;
}
var utf8ConsoleCodePageApplied = false;
function ensureUtf8ConsoleCodePageOnce() {
  if (utf8ConsoleCodePageApplied)
    return;
  utf8ConsoleCodePageApplied = true;
  try {
    const cmdExe = `${process.env.SystemRoot ?? "C:\\Windows"}\\System32\\cmd.exe`;
    spawnSync(cmdExe, ["/d", "/s", "/c", "chcp 65001 >nul 2>&1"], {
      shell: false,
      windowsHide: true,
      // #1980 population sweep: a synchronous spawn with no timeout parks
      // the event loop for as long as the child takes, and nothing here
      // bounds that. `chcp` is normally instant, but this runs before the
      // FIRST real spawn of the process, which is exactly when a cold or
      // antivirus-throttled cmd.exe is slowest. Matches the 5s bound every
      // other synchronous child-process site in this repo already carries.
      timeout: 5e3
    });
  } catch {
  }
}
function resetUtf8ConsoleCodePageStateForTests() {
  utf8ConsoleCodePageApplied = false;
}
var EXIT_PIPE_IDLE_GRACE_MS = 100;
var EXIT_PIPE_IDLE_MAX_WAIT_MS = 2e3;
var SPAWN_SAMPLER_TEARDOWN_GRACE_MS = 5e3;
async function safeSpawnAsync(command, args, options) {
  const configuredTimeout = options?.timeout !== void 0 && Number.isFinite(options.timeout) && options.timeout >= 0 ? options.timeout : 3e4;
  const deadlineRemaining = options?.deadlineAt !== void 0 && Number.isFinite(options.deadlineAt) ? options.deadlineAt - Date.now() : Number.POSITIVE_INFINITY;
  const timeout = Math.max(0, Math.min(configuredTimeout, deadlineRemaining));
  const abortSignal = options?.signal ?? (options?.ignoreAmbientSignal ? void 0 : ambientAbortSignal);
  return new Promise((resolve6) => {
    if (abortSignal?.aborted) {
      const cause = new Error("Spawn aborted before start");
      resolve6({
        stdout: "",
        stderr: "",
        status: null,
        error: cause,
        failure: "aborted",
        spawnFailure: new SpawnFailureError("killed", cause.message, cause)
      });
      return;
    }
    if (timeout <= 0) {
      const cause = new Error(`Process timed out after ${timeout}ms`);
      resolve6({
        stdout: "",
        stderr: "",
        status: null,
        error: cause,
        failure: "timeout",
        spawnFailure: new SpawnFailureError("timeout", cause.message, cause)
      });
      return;
    }
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let aborted = false;
    let killed = false;
    let outputTruncated = false;
    let killedForOutputCap = false;
    let observedOutputBytes = 0;
    let retainedOutputBytes = 0;
    let outputHandlerFailed = false;
    let streamingMatch = false;
    let resolved = false;
    let pendingSpawnError;
    let escalationTimer;
    let teardownStartedAtMs;
    let teardownEscalated = false;
    let closed = false;
    let rearmIdleGrace;
    const callerCap = options?.maxOutputBytes;
    const capFromCaller = callerCap !== void 0 && Number.isFinite(callerCap) && callerCap > 0;
    const maxOutputBytes = capFromCaller ? Math.floor(callerCap) : DEFAULT_MAX_OUTPUT_BYTES;
    const outputTruncationMarker = "\n...[output truncated]...\n";
    let retainedHead = [];
    let retainedTail = [];
    let retainedTailBytes = 0;
    let retainedTailLimit = 0;
    let truncationStream = "stderr";
    const streamingMatcher = options?.matchWhileStreaming;
    const streamingCarryBytes = streamingMatcher ? Math.max(0, streamingMatcher.source.length - 1) : 0;
    const streamingCarry = {
      stdout: "",
      stderr: ""
    };
    const bytePrefix = (text, bytes) => Buffer.from(text).subarray(0, bytes).toString();
    const byteSuffix = (text, bytes) => {
      const buffer = Buffer.from(text);
      return buffer.subarray(Math.max(0, buffer.byteLength - bytes)).toString();
    };
    const appendTail = (part, maxBytes) => {
      if (maxBytes <= 0)
        return;
      retainedTail.push({ stream: part.stream, text: part.text });
      retainedTailBytes += Buffer.byteLength(part.text);
      while (retainedTailBytes > maxBytes && retainedTail.length > 0) {
        const first = retainedTail[0];
        const excess = retainedTailBytes - maxBytes;
        const firstBytes = Buffer.byteLength(first.text);
        if (firstBytes <= excess) {
          retainedTail.shift();
          retainedTailBytes -= firstBytes;
        } else {
          first.text = byteSuffix(first.text, firstBytes - excess);
          retainedTailBytes -= excess;
        }
      }
    };
    const renderOutput = (stream) => {
      const head = retainedHead.filter((part) => part.stream === stream).map((part) => part.text).join("");
      const tail = retainedTail.filter((part) => part.stream === stream).map((part) => part.text).join("");
      const marker = stream === truncationStream ? outputTruncationMarker : "";
      return head + marker + tail;
    };
    const refreshRetainedOutputs = () => {
      stdout = renderOutput("stdout");
      stderr = renderOutput("stderr");
    };
    const appendOutput = (stream, current, chunk) => {
      const text = typeof chunk === "string" ? chunk : chunk.toString();
      if (outputTruncated) {
        appendTail({ stream, text }, retainedTailLimit);
        truncationStream = stream;
        return renderOutput(stream);
      }
      const bytes = Buffer.byteLength(text);
      if (retainedOutputBytes + bytes <= maxOutputBytes) {
        retainedOutputBytes += bytes;
        return current + text;
      }
      outputTruncated = true;
      truncationStream = stream;
      const available = Math.max(0, maxOutputBytes - Buffer.byteLength(outputTruncationMarker));
      const headBytes = Math.floor(available / 2);
      const tailBytes = available - headBytes;
      retainedTailLimit = tailBytes;
      const parts = [
        { stream: "stdout", text: stdout },
        { stream: "stderr", text: stderr },
        { stream, text }
      ];
      let headRemaining = headBytes;
      for (const part of parts) {
        if (headRemaining <= 0)
          break;
        const kept = bytePrefix(part.text, headRemaining);
        if (kept)
          retainedHead.push({ stream: part.stream, text: kept });
        headRemaining -= Buffer.byteLength(kept);
      }
      let tailRemaining = tailBytes;
      for (let index = parts.length - 1; index >= 0 && tailRemaining > 0; index--) {
        const part = parts[index];
        const kept = byteSuffix(part.text, tailRemaining);
        if (kept) {
          retainedTail.unshift({ stream: part.stream, text: kept });
          tailRemaining -= Buffer.byteLength(kept);
        }
      }
      retainedTailBytes = tailBytes - tailRemaining;
      return renderOutput(stream);
    };
    const matchStreamingChunk = (stream, chunk) => {
      if (streamingMatch || !streamingMatcher)
        return;
      const text = typeof chunk === "string" ? chunk : chunk.toString();
      streamingMatcher.lastIndex = 0;
      streamingMatch = streamingMatcher.test(streamingCarry[stream] + text);
      if (streamingCarryBytes > 0) {
        streamingCarry[stream] = Buffer.from(streamingCarry[stream] + text).subarray(-streamingCarryBytes).toString();
      }
    };
    const isWindows2 = process.platform === "win32";
    const spawnEnv = getSpawnEnvironment(options?.env, options?.stripNpmConfig);
    const spawnCwd = isWindows2 ? resolveEffectiveWindowsCwd(options?.cwd, spawnEnv) ?? options?.cwd : options?.cwd;
    let spawnCmd = command;
    let spawnArgs = args;
    let windowsVerbatimArguments = false;
    let resolutionError;
    if (isWindows2) {
      const resolved2 = resolveWindowsCommand(command, options?.cwd, spawnEnv);
      if (!resolved2) {
        resolutionError = synthesizeEnoentError(command);
      } else if (resolved2.ext === ".cmd" || resolved2.ext === ".bat") {
        const unsafeValue = findCmdUnsafeValue(resolved2.resolvedPath, args);
        if (unsafeValue !== void 0) {
          resolutionError = new Error(`Refusing to spawn "${resolved2.resolvedPath}" via cmd.exe: ${JSON.stringify(unsafeValue)} contains a character (", %, !, or CR/LF) that cannot be safely escaped on a cmd.exe /c command line (CWE-78, #817). Rename/quote the value or invoke the tool without going through cmd.exe.`);
        } else {
          spawnCmd = `${process.env.SystemRoot ?? "C:\\Windows"}\\System32\\cmd.exe`;
          spawnArgs = [
            "/d",
            "/s",
            "/c",
            buildWindowsShellCommand(resolved2.resolvedPath, args)
          ];
          windowsVerbatimArguments = true;
        }
      } else {
        ensureUtf8ConsoleCodePageOnce();
        spawnCmd = resolved2.resolvedPath;
        spawnArgs = args;
      }
    }
    if (resolutionError) {
      void classifySpawnFailure(resolutionError, {
        command,
        cwd: options?.cwd
      }).then((spawnFailure) => resolve6({
        stdout: "",
        stderr: "",
        status: null,
        error: resolutionError,
        failure: "spawn",
        spawnFailure
      }));
      return;
    }
    let child;
    const posixProcessGroup = process.platform !== "win32";
    try {
      child = spawn(spawnCmd, spawnArgs, {
        cwd: spawnCwd,
        env: spawnEnv,
        windowsHide: true,
        shell: false,
        windowsVerbatimArguments,
        detached: posixProcessGroup
      });
    } catch (err) {
      const cause = toError(err);
      void classifySpawnFailure(cause, { command, cwd: options?.cwd }).then((spawnFailure) => resolve6({
        stdout: "",
        stderr: "",
        status: null,
        error: cause,
        failure: "spawn",
        spawnFailure
      }));
      return;
    }
    if (options?.input !== void 0) {
      child.stdin?.on("error", () => {
      });
      child.stdin?.end(options.input);
    }
    const ownsChildPid = isOwnLiveChild(child.pid, "safe-spawn-register");
    if (ownsChildPid && (posixProcessGroup || options?.lifetimeCoupled)) {
      installLifetimeCleanup();
      lifetimeState.pids.add(child.pid);
    }
    let usageSampler;
    try {
      usageSampler = startSpawnUsageSampler(
        // The poll CADENCE is the sampler's own policy (it owns the backoff
        // too); the DEADLINE is this function's. Passing `undefined` rather
        // than importing the cadence constant keeps this module's view of
        // the sampler at one export, which is also what every existing
        // `vi.mock` of it provides.
        child.pid,
        void 0,
        timeout + SPAWN_SAMPLER_TEARDOWN_GRACE_MS
      );
    } catch {
      usageSampler = { stop: () => null };
    }
    const resourceLabel = options?.resourceLabel ?? command;
    let killFailed = false;
    const trySend = (send) => {
      try {
        send();
        return true;
      } catch {
        return false;
      }
    };
    const noteKillFailure = (phase) => {
      if (killFailed)
        return;
      killFailed = true;
      incrementDegradationCount({
        kind: "spawn-kill-failed",
        subject: resourceLabel,
        reason: `every signal available for the ${phase} teardown was refused; the child may still be running`,
        metadata: { phase, pid: child.pid }
      });
    };
    const killTree = async (phase) => {
      if (isWindows2 && child.pid && child.pid > 0) {
        const taskkill = `${process.env.SystemRoot ?? "C:\\Windows"}\\System32\\taskkill.exe`;
        try {
          await new Promise((done) => {
            const killer = spawn(taskkill, ["/F", "/T", "/PID", String(child.pid)], {
              shell: false,
              windowsHide: true,
              stdio: "ignore"
            });
            killer.once("close", () => done());
            killer.once("error", () => {
              if (!trySend(() => child.kill("SIGKILL")))
                noteKillFailure(phase);
              done();
            });
          });
        } catch {
          if (!trySend(() => child.kill("SIGKILL")))
            noteKillFailure(phase);
        }
      } else if (posixProcessGroup && ownsChildPid) {
        const pgid = -child.pid;
        if (!trySend(() => process.kill(pgid, "SIGTERM"))) {
          if (!trySend(() => child.kill("SIGTERM")))
            noteKillFailure(phase);
        }
        escalationTimer = setTimeout(() => {
          const escalated = trySend(() => {
            let groupAlive = true;
            try {
              process.kill(pgid, 0);
            } catch {
              groupAlive = false;
            }
            if (!groupAlive)
              return;
            teardownEscalated = true;
            logLatency({
              type: "phase",
              phase: "spawn_group_kill_escalation",
              filePath: "",
              durationMs: 0,
              metadata: { pgid: child.pid }
            });
            trySend(() => process.kill(pgid, "SIGKILL"));
          });
          if (!escalated)
            noteKillFailure(phase);
        }, 1e3);
      } else {
        if (!trySend(() => child.kill("SIGTERM")))
          noteKillFailure(phase);
        escalationTimer = setTimeout(() => {
          if (closed)
            return;
          teardownEscalated = true;
          if (!trySend(() => child.kill("SIGKILL")))
            noteKillFailure(phase);
        }, 1e3);
      }
    };
    const onAbort = () => {
      aborted = true;
      if (!killed && !child.killed) {
        killed = true;
        void killTree("abort");
      }
    };
    abortSignal?.addEventListener("abort", onAbort, { once: true });
    let killPromise;
    const stopForOutputLimit = () => {
      const waitingForStreamingMatch = streamingMatcher !== void 0 && !streamingMatch;
      if (outputTruncated && !waitingForStreamingMatch && !killed && !child.killed) {
        killedForOutputCap = true;
        killed = true;
        killPromise = killTree("output-cap");
      }
    };
    const recordOutputCapTrip = () => {
      incrementDegradationCount({
        kind: "spawn-output-cap-truncated",
        subject: resourceLabel,
        reason: `retained output reached the ${maxOutputBytes}-byte ${capFromCaller ? "caller" : "default"} cap after ${observedOutputBytes} bytes; child ${killedForOutputCap ? "terminated" : "left running"}`,
        metadata: {
          capBytes: maxOutputBytes,
          capSource: capFromCaller ? "caller" : "default",
          observedBytes: observedOutputBytes,
          killed: killedForOutputCap
        }
      });
    };
    const failOutputHandler = (stream, error) => {
      outputHandlerFailed = true;
      outputTruncated = true;
      incrementDegradationCount({
        kind: "spawn-output-handler-fault",
        subject: resourceLabel,
        reason: `${stream} chunk handling threw ${error.name} after ${observedOutputBytes} bytes; retention stopped and the child was terminated`,
        metadata: {
          stream,
          error: error.name,
          capBytes: maxOutputBytes,
          observedBytes: observedOutputBytes
        }
      });
      if (!killed && !child.killed) {
        killedForOutputCap = true;
        killed = true;
        killPromise = killTree("handler-fault");
      }
    };
    child.stdout?.setEncoding("utf-8");
    child.stderr?.setEncoding("utf-8");
    const onOutputChunk = (stream, data) => {
      if (outputHandlerFailed)
        return;
      try {
        observedOutputBytes += Buffer.byteLength(data);
        const wasTruncated = outputTruncated;
        matchStreamingChunk(stream, data);
        if (stream === "stdout")
          stdout = appendOutput(stream, stdout, data);
        else
          stderr = appendOutput(stream, stderr, data);
        if (outputTruncated)
          refreshRetainedOutputs();
        stopForOutputLimit();
        if (!wasTruncated && outputTruncated)
          recordOutputCapTrip();
        rearmIdleGrace?.();
      } catch (error) {
        failOutputHandler(stream, toError(error));
      }
    };
    child.stdout?.on("data", (data) => onOutputChunk("stdout", data));
    child.stderr?.on("data", (data) => onOutputChunk("stderr", data));
    let closeSeen = false;
    let closedAtMs;
    child.on("close", () => {
      closeSeen = true;
      closedAtMs ??= Date.now();
    });
    const timeoutId = setTimeout(() => {
      timedOut = true;
      if (!killed && !child.killed) {
        killed = true;
        teardownStartedAtMs = Date.now();
        killPromise = killTree("timeout");
      }
    }, timeout);
    const finishResourceUsage = () => {
      const summary = usageSampler.stop();
      if (!summary)
        return void 0;
      try {
        logLatency({
          type: "phase",
          phase: "spawn_resource_usage",
          filePath: "",
          durationMs: 0,
          metadata: {
            command: resourceLabel,
            ...summary
          }
        });
      } catch {
      }
      return summary;
    };
    const waitForPipeIdle = () => {
      if (!child.stdout && !child.stderr)
        return Promise.resolve();
      if (closeSeen)
        return Promise.resolve();
      return new Promise((finishIdleWait) => {
        let settled2 = false;
        let graceTimer;
        const capTimer = setTimeout(() => {
          finish();
        }, EXIT_PIPE_IDLE_MAX_WAIT_MS);
        const finish = () => {
          if (settled2)
            return;
          settled2 = true;
          rearmIdleGrace = void 0;
          if (graceTimer)
            clearTimeout(graceTimer);
          clearTimeout(capTimer);
          child.removeListener?.("close", finish);
          finishIdleWait();
        };
        child.on("close", finish);
        rearmIdleGrace = () => {
          if (graceTimer)
            clearTimeout(graceTimer);
          graceTimer = setTimeout(finish, EXIT_PIPE_IDLE_GRACE_MS);
        };
        rearmIdleGrace();
      });
    };
    let settled = false;
    const onChildSettle = (code, signal) => {
      if (settled || resolved)
        return;
      settled = true;
      closed = true;
      clearTimeout(timeoutId);
      abortSignal?.removeEventListener("abort", onAbort);
      if (child.pid)
        lifetimeState.pids.delete(child.pid);
      void finalize(code, signal);
    };
    const finalize = async (code, signal) => {
      await killPromise;
      if (resolved)
        return;
      if (escalationTimer && !posixProcessGroup) {
        clearTimeout(escalationTimer);
      }
      resolved = true;
      await waitForPipeIdle();
      const resourceUsage = finishResourceUsage();
      const outputInfo = {
        ...outputTruncated ? { outputTruncated: true } : {},
        ...killedForOutputCap ? { killedForOutputCap: true } : {},
        ...killFailed ? { killFailed: true } : {}
      };
      const streamingMatchInfo = streamingMatch ? { streamingMatch: true } : {};
      const signalInfo = signal ? { signal } : {};
      if (timedOut) {
        const cause = new Error(`Process timed out after ${timeout}ms (killed with ${signal || "SIGTERM"})`);
        const timeoutTeardown = resolveTeardownOutcome({
          killStartedAtMs: teardownStartedAtMs,
          deathObservedAtMs: closedAtMs,
          escalated: teardownEscalated
        });
        resolve6({
          stdout,
          stderr,
          status: null,
          error: cause,
          failure: "timeout",
          ...signalInfo,
          ...timeoutTeardown && { timeoutTeardown },
          spawnFailure: new SpawnFailureError("timeout", cause.message, cause),
          ...outputInfo,
          ...streamingMatchInfo,
          resourceUsage
        });
      } else if (aborted) {
        const cause = new Error("Spawn aborted");
        resolve6({
          stdout,
          stderr,
          status: null,
          error: cause,
          failure: "aborted",
          ...signalInfo,
          spawnFailure: new SpawnFailureError("killed", cause.message, cause),
          ...outputInfo,
          ...streamingMatchInfo,
          resourceUsage
        });
      } else if (signal) {
        const cause = new Error(`Process killed by signal: ${signal}`);
        resolve6({
          stdout,
          stderr,
          status: null,
          error: cause,
          failure: "signal",
          ...signalInfo,
          spawnFailure: new SpawnFailureError("killed", cause.message, cause),
          ...outputInfo,
          ...streamingMatchInfo,
          resourceUsage
        });
      } else if (code === null || code < 0) {
        const cause = pendingSpawnError ?? synthesizeEnoentError(command);
        const spawnFailure = await classifySpawnFailure(cause, {
          command,
          cwd: options?.cwd
        });
        resolve6({
          stdout,
          stderr,
          status: code,
          error: cause,
          failure: "spawn",
          spawnFailure,
          ...outputInfo,
          ...streamingMatchInfo,
          resourceUsage
        });
      } else {
        resolve6({
          stdout,
          stderr,
          status: code,
          ...outputInfo,
          ...streamingMatchInfo,
          resourceUsage
        });
      }
    };
    child.on("exit", onChildSettle);
    child.on("close", onChildSettle);
    child.on("error", (err) => {
      pendingSpawnError = err;
      if (resolved)
        return;
      resolved = true;
      closed = true;
      clearTimeout(timeoutId);
      abortSignal?.removeEventListener("abort", onAbort);
      if (escalationTimer && !posixProcessGroup) {
        clearTimeout(escalationTimer);
      }
      if (child.pid)
        lifetimeState.pids.delete(child.pid);
      const resourceUsage = finishResourceUsage();
      let failure = "spawn";
      if (aborted)
        failure = "aborted";
      else if (timedOut)
        failure = "timeout";
      const controlFailure = aborted ? new SpawnFailureError("killed", err.message, err) : timedOut ? new SpawnFailureError("timeout", err.message, err) : void 0;
      const finish = (spawnFailure) => resolve6({
        stdout,
        stderr,
        status: null,
        error: err,
        failure,
        spawnFailure,
        ...outputTruncated ? { outputTruncated: true } : {},
        ...killedForOutputCap ? { killedForOutputCap: true } : {},
        ...killFailed ? { killFailed: true } : {},
        ...streamingMatch ? { streamingMatch: true } : {},
        resourceUsage
      });
      if (controlFailure)
        finish(controlFailure);
      else {
        void classifySpawnFailure(err, { command, cwd: options?.cwd }).then(finish);
      }
    });
  });
}
async function safeSpawnBatch(commands, concurrency = 3) {
  const results = [];
  for (let i = 0; i < commands.length; i += concurrency) {
    const batch = commands.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(({ command, args, options }) => safeSpawnAsync(command, args, options)));
    results.push(...batchResults);
  }
  return results;
}
async function isCommandAvailableAsync(command) {
  const finder = process.platform === "win32" ? "where" : "which";
  const result = await safeSpawnAsync(finder, [command], { timeout: 5e3 });
  return result.status === 0 && !result.error;
}
async function findCommandAsync(command) {
  const finder = process.platform === "win32" ? "where" : "which";
  const result = await safeSpawnAsync(finder, [command], { timeout: 5e3 });
  if (result.status !== 0 || result.error)
    return null;
  return result.stdout.trim().split("\n")[0] || null;
}
function safeSpawn(command, args, options) {
  const spawnEnv = getSpawnEnvironment(options?.env, options?.stripNpmConfig);
  if (process.platform === "win32") {
    const spawnCwd = resolveEffectiveWindowsCwd(options?.cwd, spawnEnv) ?? options?.cwd;
    const resolved = resolveWindowsCommand(command, options?.cwd, spawnEnv);
    if (!resolved) {
      const error = synthesizeEnoentError(command);
      return {
        stdout: "",
        stderr: "",
        status: null,
        error,
        failure: "spawn",
        spawnFailure: classifySpawnFailureSync(error, {
          command,
          cwd: options?.cwd
        })
      };
    }
    let spawnCmd;
    let spawnArgs;
    let windowsVerbatimArguments = false;
    if (resolved.ext === ".cmd" || resolved.ext === ".bat") {
      const unsafeValue = findCmdUnsafeValue(resolved.resolvedPath, args);
      if (unsafeValue !== void 0) {
        const error = new Error(`Refusing to spawn "${resolved.resolvedPath}" via cmd.exe: ${JSON.stringify(unsafeValue)} contains a character (", %, !, or CR/LF) that cannot be safely escaped on a cmd.exe /c command line (CWE-78, #817). Rename/quote the value or invoke the tool without going through cmd.exe.`);
        return {
          stdout: "",
          stderr: "",
          status: null,
          error,
          failure: "spawn",
          spawnFailure: classifySpawnFailureSync(error, {
            command,
            cwd: options?.cwd
          })
        };
      }
      spawnCmd = `${process.env.SystemRoot ?? "C:\\Windows"}\\System32\\cmd.exe`;
      spawnArgs = [
        "/d",
        "/s",
        "/c",
        buildWindowsShellCommand(resolved.resolvedPath, args)
      ];
      windowsVerbatimArguments = true;
    } else {
      ensureUtf8ConsoleCodePageOnce();
      spawnCmd = resolved.resolvedPath;
      spawnArgs = args;
    }
    const result2 = spawnSync(spawnCmd, spawnArgs, {
      ...options,
      cwd: spawnCwd,
      env: spawnEnv,
      encoding: "utf-8",
      shell: false,
      windowsHide: true,
      windowsVerbatimArguments
    });
    const spawnFailure2 = result2.error ? classifySpawnFailureSync(result2.error, { command, cwd: options?.cwd }) : void 0;
    return {
      stdout: result2.stdout?.toString() || "",
      stderr: result2.stderr?.toString() || "",
      status: result2.status,
      error: result2.error,
      ...spawnFailure2 ? { failure: "spawn", spawnFailure: spawnFailure2 } : {}
    };
  }
  const result = spawnSync(command, args, {
    ...options,
    // Explicit override, not just the spread above: `options.env` alone
    // would otherwise reach the child as a full replacement (no
    // process.env merge, no PATH) instead of the merged environment the
    // resolver/Windows branch above both use (#1201) — the module's
    // "resolver and child receive the same merged environment" invariant
    // must hold on every platform, not just Windows.
    env: spawnEnv,
    encoding: "utf-8",
    shell: false,
    windowsHide: true
  });
  const spawnFailure = result.error ? classifySpawnFailureSync(result.error, { command, cwd: options?.cwd }) : void 0;
  return {
    stdout: result.stdout?.toString() || "",
    stderr: result.stderr?.toString() || "",
    status: result.status,
    error: result.error,
    ...spawnFailure ? { failure: "spawn", spawnFailure } : {}
  };
}
function isCommandAvailable(command) {
  const result = safeSpawn(process.platform === "win32" ? "where" : "which", [command], { timeout: 5e3 });
  return result.status === 0;
}
function findCommand(command) {
  const finder = process.platform === "win32" ? "where" : "which";
  const result = safeSpawn(finder, [command], { timeout: 5e3 });
  if (result.status !== 0)
    return null;
  return result.stdout.trim().split("\n")[0] || null;
}

export {
  noteSpawnTimeout,
  isInSpawnTimeoutCooldown,
  resetSpawnTimeoutCooldowns,
  isLockContention,
  recordGenerationTakeover,
  recordLegacyLockHeld,
  releaseGeneration,
  heartbeatIntervalMs,
  startGenerationHeartbeat,
  ownsTopGeneration,
  tryAcquireGeneration,
  withGenerationLockSync,
  acquireQuarantinePidFileLock,
  acquireBoundedPidFileLock,
  createGenerationSource,
  createGenerationMap,
  OWNER_TAG_ENV,
  ownerTagForChildren,
  isSubagentSession,
  getSubagentIdentity,
  subagentLightModeNotice,
  readInstanceRegistry,
  updateHeartbeat,
  recordLspChild,
  removeLspChild,
  selectLivePeerInstances,
  getResourceFootprint,
  realIsPidAlive,
  isStaleStageFile,
  sweepAtomicWriteStages,
  sampleProcessTreeCpuPercent,
  SpawnFailureError,
  hasSpawnFailureKind,
  resolveTeardownOutcome,
  classifySpawnFailure,
  VERIFIED_OWN_PID_CAP,
  holdOwnChildPid,
  releaseOwnChildPid,
  isOwnLiveChild,
  setAmbientAbortSignal,
  getAmbientAbortSignal,
  buildWindowsShellCommand,
  mergeWindowsEnvironment,
  WINDOWS_COMMAND_CACHE_MAX_ENTRIES,
  resetSafeSpawnWindowsCommandCache,
  resolveWindowsCommandForEnvironment,
  resetUtf8ConsoleCodePageStateForTests,
  safeSpawnAsync,
  safeSpawnBatch,
  isCommandAvailableAsync,
  findCommandAsync,
  safeSpawn,
  isCommandAvailable,
  findCommand,
  collectUntrackedIgnoredIds,
  collectTrackedFiles,
  loadPiLensGlobalConfig,
  resolvePiLensFlag,
  ephemeralStagingRoot,
  isEphemeralCheckoutRoot,
  getProjectDataDir,
  sweepDeadEphemeralDataDirs,
  resetProjectDataDirSessionState,
  drainProjectDataDirMigrations,
  displayProjectDataPath,
  getGlobalPiLensDir,
  isPiLensInternalPath,
  EXCLUDED_DIRS,
  getProjectIgnoreMatcher,
  isPathIgnoredByProject,
  isRecordableProjectPath,
  getProjectIgnoreGlobs,
  isExcludedDirName,
  getExcludedDirGlobs,
  getKnipIgnorePatterns,
  isTestFile
};
/*! Bundled license information:

safe-buffer/index.js:
  (*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> *)
*/
