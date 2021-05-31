(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/common'), require('@angular/core'), require('@angular/forms'), require('@zxing/browser'), require('@zxing/library'), require('rxjs')) :
    typeof define === 'function' && define.amd ? define('@zxing/ngx-scanner', ['exports', '@angular/common', '@angular/core', '@angular/forms', '@zxing/browser', '@zxing/library', 'rxjs'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.zxing = global.zxing || {}, global.zxing['ngx-scanner'] = {}), global.ng.common, global.ng.core, global.ng.forms, global.browser, global.library, global.rxjs));
}(this, (function (exports, common, core, forms, browser, library, rxjs) { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise */
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b)
                if (Object.prototype.hasOwnProperty.call(b, p))
                    d[p] = b[p]; };
        return extendStatics(d, b);
    };
    function __extends(d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }
    var __assign = function () {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s)
                    if (Object.prototype.hasOwnProperty.call(s, p))
                        t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };
    function __rest(s, e) {
        var t = {};
        for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
                t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    }
    function __decorate(decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
            r = Reflect.decorate(decorators, target, key, desc);
        else
            for (var i = decorators.length - 1; i >= 0; i--)
                if (d = decorators[i])
                    r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function __param(paramIndex, decorator) {
        return function (target, key) { decorator(target, key, paramIndex); };
    }
    function __metadata(metadataKey, metadataValue) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
            return Reflect.metadata(metadataKey, metadataValue);
    }
    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try {
                step(generator.next(value));
            }
            catch (e) {
                reject(e);
            } }
            function rejected(value) { try {
                step(generator["throw"](value));
            }
            catch (e) {
                reject(e);
            } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }
    function __generator(thisArg, body) {
        var _ = { label: 0, sent: function () { if (t[0] & 1)
                throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function () { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f)
                throw new TypeError("Generator is already executing.");
            while (_)
                try {
                    if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done)
                        return t;
                    if (y = 0, t)
                        op = [op[0] & 2, t.value];
                    switch (op[0]) {
                        case 0:
                        case 1:
                            t = op;
                            break;
                        case 4:
                            _.label++;
                            return { value: op[1], done: false };
                        case 5:
                            _.label++;
                            y = op[1];
                            op = [0];
                            continue;
                        case 7:
                            op = _.ops.pop();
                            _.trys.pop();
                            continue;
                        default:
                            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                                _ = 0;
                                continue;
                            }
                            if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                                _.label = op[1];
                                break;
                            }
                            if (op[0] === 6 && _.label < t[1]) {
                                _.label = t[1];
                                t = op;
                                break;
                            }
                            if (t && _.label < t[2]) {
                                _.label = t[2];
                                _.ops.push(op);
                                break;
                            }
                            if (t[2])
                                _.ops.pop();
                            _.trys.pop();
                            continue;
                    }
                    op = body.call(thisArg, _);
                }
                catch (e) {
                    op = [6, e];
                    y = 0;
                }
                finally {
                    f = t = 0;
                }
            if (op[0] & 5)
                throw op[1];
            return { value: op[0] ? op[1] : void 0, done: true };
        }
    }
    var __createBinding = Object.create ? (function (o, m, k, k2) {
        if (k2 === undefined)
            k2 = k;
        Object.defineProperty(o, k2, { enumerable: true, get: function () { return m[k]; } });
    }) : (function (o, m, k, k2) {
        if (k2 === undefined)
            k2 = k;
        o[k2] = m[k];
    });
    function __exportStar(m, o) {
        for (var p in m)
            if (p !== "default" && !Object.prototype.hasOwnProperty.call(o, p))
                __createBinding(o, m, p);
    }
    function __values(o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m)
            return m.call(o);
        if (o && typeof o.length === "number")
            return {
                next: function () {
                    if (o && i >= o.length)
                        o = void 0;
                    return { value: o && o[i++], done: !o };
                }
            };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }
    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m)
            return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done)
                ar.push(r.value);
        }
        catch (error) {
            e = { error: error };
        }
        finally {
            try {
                if (r && !r.done && (m = i["return"]))
                    m.call(i);
            }
            finally {
                if (e)
                    throw e.error;
            }
        }
        return ar;
    }
    /** @deprecated */
    function __spread() {
        for (var ar = [], i = 0; i < arguments.length; i++)
            ar = ar.concat(__read(arguments[i]));
        return ar;
    }
    /** @deprecated */
    function __spreadArrays() {
        for (var s = 0, i = 0, il = arguments.length; i < il; i++)
            s += arguments[i].length;
        for (var r = Array(s), k = 0, i = 0; i < il; i++)
            for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
                r[k] = a[j];
        return r;
    }
    function __spreadArray(to, from) {
        for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
            to[j] = from[i];
        return to;
    }
    function __await(v) {
        return this instanceof __await ? (this.v = v, this) : new __await(v);
    }
    function __asyncGenerator(thisArg, _arguments, generator) {
        if (!Symbol.asyncIterator)
            throw new TypeError("Symbol.asyncIterator is not defined.");
        var g = generator.apply(thisArg, _arguments || []), i, q = [];
        return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
        function verb(n) { if (g[n])
            i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
        function resume(n, v) { try {
            step(g[n](v));
        }
        catch (e) {
            settle(q[0][3], e);
        } }
        function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
        function fulfill(value) { resume("next", value); }
        function reject(value) { resume("throw", value); }
        function settle(f, v) { if (f(v), q.shift(), q.length)
            resume(q[0][0], q[0][1]); }
    }
    function __asyncDelegator(o) {
        var i, p;
        return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
        function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
    }
    function __asyncValues(o) {
        if (!Symbol.asyncIterator)
            throw new TypeError("Symbol.asyncIterator is not defined.");
        var m = o[Symbol.asyncIterator], i;
        return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
        function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
        function settle(resolve, reject, d, v) { Promise.resolve(v).then(function (v) { resolve({ value: v, done: d }); }, reject); }
    }
    function __makeTemplateObject(cooked, raw) {
        if (Object.defineProperty) {
            Object.defineProperty(cooked, "raw", { value: raw });
        }
        else {
            cooked.raw = raw;
        }
        return cooked;
    }
    ;
    var __setModuleDefault = Object.create ? (function (o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function (o, v) {
        o["default"] = v;
    };
    function __importStar(mod) {
        if (mod && mod.__esModule)
            return mod;
        var result = {};
        if (mod != null)
            for (var k in mod)
                if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
                    __createBinding(result, mod, k);
        __setModuleDefault(result, mod);
        return result;
    }
    function __importDefault(mod) {
        return (mod && mod.__esModule) ? mod : { default: mod };
    }
    function __classPrivateFieldGet(receiver, state, kind, f) {
        if (kind === "a" && !f)
            throw new TypeError("Private accessor was defined without a getter");
        if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
            throw new TypeError("Cannot read private member from an object whose class did not declare it");
        return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
    }
    function __classPrivateFieldSet(receiver, state, value, kind, f) {
        if (kind === "m")
            throw new TypeError("Private method is not writable");
        if (kind === "a" && !f)
            throw new TypeError("Private accessor was defined without a setter");
        if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
            throw new TypeError("Cannot write private member to an object whose class did not declare it");
        return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
    }

    /**
     * Based on zxing-typescript BrowserCodeReader
     */
    var BrowserMultiFormatContinuousReader = /** @class */ (function (_super) {
        __extends(BrowserMultiFormatContinuousReader, _super);
        function BrowserMultiFormatContinuousReader() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        /**
         * Returns the code reader scanner controls.
         */
        BrowserMultiFormatContinuousReader.prototype.getScannerControls = function () {
            if (!this.scannerControls) {
                throw new Error('No scanning is running at the time.');
            }
            return this.scannerControls;
        };
        /**
         * Starts the decoding from the current or a new video element.
         *
         * @param deviceId The device's to be used Id
         * @param previewEl A new video element
         */
        BrowserMultiFormatContinuousReader.prototype.scanFromDeviceObservable = function (deviceId, previewEl) {
            var _a;
            return __awaiter(this, void 0, void 0, function () {
                var scan$, ctrls, e_1;
                var _this = this;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            scan$ = new rxjs.BehaviorSubject({});
                            _b.label = 1;
                        case 1:
                            _b.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, this.decodeFromVideoDevice(deviceId, previewEl, function (result, error) {
                                    if (!error) {
                                        scan$.next({ result: result });
                                        return;
                                    }
                                    var errorName = error.name;
                                    // stream cannot stop on fails.
                                    if (
                                    // scan Failure - found nothing, no error
                                    errorName === library.NotFoundException.name ||
                                        // scan Error - found the QR but got error on decoding
                                        errorName === library.ChecksumException.name ||
                                        errorName === library.FormatException.name ||
                                        error.message.includes('No MultiFormat Readers were able to detect the code.')) {
                                        scan$.next({ error: error });
                                        return;
                                    }
                                    // probably fatal error
                                    scan$.error(error);
                                    _this.scannerControls.stop();
                                    _this.scannerControls = undefined;
                                    return;
                                })];
                        case 2:
                            ctrls = _b.sent();
                            this.scannerControls = Object.assign(Object.assign({}, ctrls), { stop: function () {
                                    ctrls.stop();
                                    scan$.complete();
                                } });
                            return [3 /*break*/, 4];
                        case 3:
                            e_1 = _b.sent();
                            scan$.error(e_1);
                            (_a = this.scannerControls) === null || _a === void 0 ? void 0 : _a.stop();
                            this.scannerControls = undefined;
                            return [3 /*break*/, 4];
                        case 4: return [2 /*return*/, scan$.asObservable()];
                    }
                });
            });
        };
        return BrowserMultiFormatContinuousReader;
    }(browser.BrowserMultiFormatReader));

    var ZXingScannerComponent = /** @class */ (function () {
        /**
         * Constructor to build the object and do some DI.
         */
        function ZXingScannerComponent() {
            /**
             * Delay between attempts to decode (default is 500ms)
             */
            this.timeBetweenScans = 500;
            /**
             * Delay between successful decode (default is 500ms)
             */
            this.delayBetweenScanSuccess = 500;
            /**
             * How the preview element shoud be fit inside the :host container.
             */
            this.previewFitMode = 'cover';
            this._ready = false;
            // instance based emitters
            this.autostarted = new core.EventEmitter();
            this.autostarting = new core.EventEmitter();
            this.torchCompatible = new core.EventEmitter(false);
            this.scanSuccess = new core.EventEmitter();
            this.scanFailure = new core.EventEmitter();
            this.scanError = new core.EventEmitter();
            this.scanComplete = new core.EventEmitter();
            this.camerasFound = new core.EventEmitter();
            this.camerasNotFound = new core.EventEmitter();
            this.permissionResponse = new core.EventEmitter(true);
            this.hasDevices = new core.EventEmitter();
            this.deviceChange = new core.EventEmitter();
            this._enabled = true;
            this._hints = new Map();
            this.autofocusEnabled = true;
            this.autostart = true;
            this.formats = [library.BarcodeFormat.QR_CODE];
            // computed data
            this.hasNavigator = typeof navigator !== 'undefined';
            this.isMediaDevicesSupported = this.hasNavigator && !!navigator.mediaDevices;
        }
        Object.defineProperty(ZXingScannerComponent.prototype, "codeReader", {
            /**
             * Exposes the current code reader, so the user can use it's APIs.
             */
            get: function () {
                return this._codeReader;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ZXingScannerComponent.prototype, "device", {
            /**
             * User device acessor.
             */
            get: function () {
                return this._device;
            },
            /**
             * User device input
             */
            set: function (device) {
                if (!this._ready) {
                    this._devicePreStart = device;
                    // let's ignore silently, users don't liek logs
                    return;
                }
                if (this.isAutostarting) {
                    // do not allow setting devices during auto-start, since it will set one and emit it.
                    console.warn('Avoid setting a device during auto-start.');
                    return;
                }
                if (this.isCurrentDevice(device)) {
                    console.warn('Setting the same device is not allowed.');
                    return;
                }
                if (!this.hasPermission) {
                    console.warn('Permissions not set yet, waiting for them to be set to apply device change.');
                    // this.permissionResponse
                    //   .pipe(
                    //     take(1),
                    //     tap(() => console.log(`Permissions set, applying device change${device ? ` (${device.deviceId})` : ''}.`))
                    //   )
                    //   .subscribe(() => this.device = device);
                    return;
                }
                this.setDevice(device);
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ZXingScannerComponent.prototype, "formats", {
            /**
             * Returns all the registered formats.
             */
            get: function () {
                return this.hints.get(library.DecodeHintType.POSSIBLE_FORMATS);
            },
            /**
             * Registers formats the scanner should support.
             *
             * @param input BarcodeFormat or case-insensitive string array.
             */
            set: function (input) {
                var _this = this;
                if (typeof input === 'string') {
                    throw new Error('Invalid formats, make sure the [formats] input is a binding.');
                }
                // formats may be set from html template as BarcodeFormat or string array
                var formats = input.map(function (f) { return _this.getBarcodeFormatOrFail(f); });
                var hints = this.hints;
                // updates the hints
                hints.set(library.DecodeHintType.POSSIBLE_FORMATS, formats);
                // handles updating the codeReader
                this.hints = hints;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ZXingScannerComponent.prototype, "hints", {
            /**
             * Returns all the registered hints.
             */
            get: function () {
                return this._hints;
            },
            /**
             * Does what it takes to set the hints.
             */
            set: function (hints) {
                var _a;
                this._hints = hints;
                // new instance with new hints.
                (_a = this.codeReader) === null || _a === void 0 ? void 0 : _a.setHints(this._hints);
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ZXingScannerComponent.prototype, "videoConstraints", {
            /**
             * Sets the desired constraints in all video tracks.
             * @experimental
             */
            set: function (constraints) {
                var _a;
                // new instance with new hints.
                var controls = (_a = this.codeReader) === null || _a === void 0 ? void 0 : _a.getScannerControls();
                if (!controls) {
                    // fails silently
                    return;
                }
                controls === null || controls === void 0 ? void 0 : controls.streamVideoConstraintsApply(constraints);
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ZXingScannerComponent.prototype, "isAutostarting", {
            /**
             *
             */
            get: function () {
                return this._isAutostarting;
            },
            /**
             *
             */
            set: function (state) {
                this._isAutostarting = state;
                this.autostarting.next(state);
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ZXingScannerComponent.prototype, "torch", {
            /**
             * Can turn on/off the device flashlight.
             *
             * @experimental Torch/Flash APIs are not stable in all browsers, it may be buggy!
             */
            set: function (onOff) {
                try {
                    var controls = this.getCodeReader().getScannerControls();
                    controls.switchTorch(onOff);
                }
                catch (error) {
                    // ignore error
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ZXingScannerComponent.prototype, "enable", {
            /**
             * Starts and Stops the scanning.
             */
            set: function (enabled) {
                this._enabled = Boolean(enabled);
                if (!this._enabled) {
                    this.reset();
                }
                else {
                    if (this.device) {
                        this.scanFromDevice(this.device.deviceId);
                    }
                    else {
                        this.init();
                    }
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ZXingScannerComponent.prototype, "enabled", {
            /**
             * Tells if the scanner is enabled or not.
             */
            get: function () {
                return this._enabled;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ZXingScannerComponent.prototype, "tryHarder", {
            /**
             * If is `tryHarder` enabled.
             */
            get: function () {
                return this.hints.get(library.DecodeHintType.TRY_HARDER);
            },
            /**
             * Enable/disable tryHarder hint.
             */
            set: function (enable) {
                var hints = this.hints;
                if (enable) {
                    hints.set(library.DecodeHintType.TRY_HARDER, true);
                }
                else {
                    hints.delete(library.DecodeHintType.TRY_HARDER);
                }
                this.hints = hints;
            },
            enumerable: false,
            configurable: true
        });
        /**
         * Gets and registers all cammeras.
         */
        ZXingScannerComponent.prototype.askForPermission = function () {
            return __awaiter(this, void 0, void 0, function () {
                var stream, permission, err_1;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            if (!this.hasNavigator) {
                                console.error('@zxing/ngx-scanner', 'Can\'t ask permission, navigator is not present.');
                                this.setPermission(null);
                                return [2 /*return*/, this.hasPermission];
                            }
                            if (!this.isMediaDevicesSupported) {
                                console.error('@zxing/ngx-scanner', 'Can\'t get user media, this is not supported.');
                                this.setPermission(null);
                                return [2 /*return*/, this.hasPermission];
                            }
                            _c.label = 1;
                        case 1:
                            _c.trys.push([1, 3, 4, 5]);
                            return [4 /*yield*/, this.getAnyVideoDevice()];
                        case 2:
                            // Will try to ask for permission
                            stream = _c.sent();
                            permission = !!stream;
                            return [3 /*break*/, 5];
                        case 3:
                            err_1 = _c.sent();
                            return [2 /*return*/, this.handlePermissionException(err_1)];
                        case 4:
                            this.terminateStream(stream);
                            return [7 /*endfinally*/];
                        case 5:
                            this.setPermission(permission);
                            // Returns the permission
                            return [2 /*return*/, permission];
                    }
                });
            });
        };
        /**
         *
         */
        ZXingScannerComponent.prototype.getAnyVideoDevice = function () {
            return navigator.mediaDevices.getUserMedia({ video: true });
        };
        /**
         * Terminates a stream and it's tracks.
         */
        ZXingScannerComponent.prototype.terminateStream = function (stream) {
            if (stream) {
                stream.getTracks().forEach(function (t) { return t.stop(); });
            }
            stream = undefined;
        };
        ZXingScannerComponent.prototype.init = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            if (!this.autostart) {
                                console.warn('Feature \'autostart\' disabled. Permissions and devices recovery has to be run manually.');
                                // does the necessary configuration without autostarting
                                this.initAutostartOff();
                                this._ready = true;
                                return [2 /*return*/];
                            }
                            // configurates the component and starts the scanner
                            return [4 /*yield*/, this.initAutostartOn()];
                        case 1:
                            // configurates the component and starts the scanner
                            _c.sent();
                            this._ready = true;
                            return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Initializes the component without starting the scanner.
         */
        ZXingScannerComponent.prototype.initAutostartOff = function () {
            // do not ask for permission when autostart is off
            this.isAutostarting = false;
            // just update devices information
            this.updateVideoInputDevices();
            if (this._device && this._devicePreStart) {
                this.setDevice(this._devicePreStart);
            }
        };
        /**
         * Initializes the component and starts the scanner.
         * Permissions are asked to accomplish that.
         */
        ZXingScannerComponent.prototype.initAutostartOn = function () {
            return __awaiter(this, void 0, void 0, function () {
                var hasPermission, e_1, devices;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            this.isAutostarting = true;
                            _c.label = 1;
                        case 1:
                            _c.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, this.askForPermission()];
                        case 2:
                            // Asks for permission before enumerating devices so it can get all the device's info
                            hasPermission = _c.sent();
                            return [3 /*break*/, 4];
                        case 3:
                            e_1 = _c.sent();
                            console.error('Exception occurred while asking for permission:', e_1);
                            return [2 /*return*/];
                        case 4:
                            if (!hasPermission) return [3 /*break*/, 7];
                            return [4 /*yield*/, this.updateVideoInputDevices()];
                        case 5:
                            devices = _c.sent();
                            return [4 /*yield*/, this.autostartScanner(__spread(devices))];
                        case 6:
                            _c.sent();
                            _c.label = 7;
                        case 7:
                            this.isAutostarting = false;
                            this.autostarted.next();
                            return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Checks if the given device is the current defined one.
         */
        ZXingScannerComponent.prototype.isCurrentDevice = function (device) {
            var _a;
            return (device === null || device === void 0 ? void 0 : device.deviceId) === ((_a = this._device) === null || _a === void 0 ? void 0 : _a.deviceId);
        };
        /**
         * Executes some actions before destroy the component.
         */
        ZXingScannerComponent.prototype.ngOnDestroy = function () {
            this.reset();
        };
        /**
         *
         */
        ZXingScannerComponent.prototype.ngOnInit = function () {
            this.init();
        };
        /**
         * Stops the scanning, if any.
         */
        ZXingScannerComponent.prototype.scanStop = function () {
            var _a, _b;
            if (this._scanSubscription) {
                (_a = this.codeReader) === null || _a === void 0 ? void 0 : _a.getScannerControls().stop();
                (_b = this._scanSubscription) === null || _b === void 0 ? void 0 : _b.unsubscribe();
                this._scanSubscription = undefined;
            }
            this.torchCompatible.next(false);
        };
        /**
         * Stops the scanning, if any.
         */
        ZXingScannerComponent.prototype.scanStart = function () {
            if (this._scanSubscription) {
                throw new Error('There is already a scan proccess running.');
            }
            if (!this._device) {
                throw new Error('No device defined, cannot start scan, please define a device.');
            }
            this.scanFromDevice(this._device.deviceId);
        };
        /**
         * Stops old `codeReader` and starts scanning in a new one.
         */
        ZXingScannerComponent.prototype.restart = function () {
            // @note apenas necessario por enquanto causa da Torch
            this._codeReader = undefined;
            var prevDevice = this._reset();
            if (!prevDevice) {
                return;
            }
            this.device = prevDevice;
        };
        /**
         * Discovers and updates known video input devices.
         */
        ZXingScannerComponent.prototype.updateVideoInputDevices = function () {
            return __awaiter(this, void 0, void 0, function () {
                var devices, hasDevices;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, browser.BrowserCodeReader.listVideoInputDevices()];
                        case 1:
                            devices = (_c.sent()) || [];
                            hasDevices = devices && devices.length > 0;
                            // stores discovered devices and updates information
                            this.hasDevices.next(hasDevices);
                            this.camerasFound.next(__spread(devices));
                            if (!hasDevices) {
                                this.camerasNotFound.next();
                            }
                            return [2 /*return*/, devices];
                    }
                });
            });
        };
        /**
         * Starts the scanner with the back camera otherwise take the last
         * available device.
         */
        ZXingScannerComponent.prototype.autostartScanner = function (devices) {
            return __awaiter(this, void 0, void 0, function () {
                var matcher, device;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            matcher = function (_c) {
                                var label = _c.label;
                                return /back|trás|rear|traseira|environment|ambiente/gi.test(label);
                            };
                            device = devices.find(matcher) || devices.pop();
                            if (!device) {
                                throw new Error('Impossible to autostart, no input devices available.');
                            }
                            return [4 /*yield*/, this.setDevice(device)];
                        case 1:
                            _c.sent();
                            this.deviceChange.next(device);
                            return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Dispatches the scan success event.
         *
         * @param result the scan result.
         */
        ZXingScannerComponent.prototype.dispatchScanSuccess = function (result) {
            this.scanSuccess.next(result.getText());
        };
        /**
         * Dispatches the scan failure event.
         */
        ZXingScannerComponent.prototype.dispatchScanFailure = function (reason) {
            this.scanFailure.next(reason);
        };
        /**
         * Dispatches the scan error event.
         *
         * @param error the error thing.
         */
        ZXingScannerComponent.prototype.dispatchScanError = function (error) {
            if (!this.scanError.observers.some(function (x) { return Boolean(x); })) {
                console.error("zxing scanner component: " + error.name, error);
                console.warn('Use the `(scanError)` property to handle errors like this!');
            }
            this.scanError.next(error);
        };
        /**
         * Dispatches the scan event.
         *
         * @param result the scan result.
         */
        ZXingScannerComponent.prototype.dispatchScanComplete = function (result) {
            this.scanComplete.next(result);
        };
        /**
         * Returns the filtered permission.
         */
        ZXingScannerComponent.prototype.handlePermissionException = function (err) {
            // failed to grant permission to video input
            console.error('@zxing/ngx-scanner', 'Error when asking for permission.', err);
            var permission;
            switch (err.name) {
                // usually caused by not secure origins
                case 'NotSupportedError':
                    console.warn('@zxing/ngx-scanner', err.message);
                    // could not claim
                    permission = null;
                    // can't check devices
                    this.hasDevices.next(null);
                    break;
                // user denied permission
                case 'NotAllowedError':
                    console.warn('@zxing/ngx-scanner', err.message);
                    // claimed and denied permission
                    permission = false;
                    // this means that input devices exists
                    this.hasDevices.next(true);
                    break;
                // the device has no attached input devices
                case 'NotFoundError':
                    console.warn('@zxing/ngx-scanner', err.message);
                    // no permissions claimed
                    permission = null;
                    // because there was no devices
                    this.hasDevices.next(false);
                    // tells the listener about the error
                    this.camerasNotFound.next(err);
                    break;
                case 'NotReadableError':
                    console.warn('@zxing/ngx-scanner', 'Couldn\'t read the device(s)\'s stream, it\'s probably in use by another app.');
                    // no permissions claimed
                    permission = null;
                    // there are devices, which I couldn't use
                    this.hasDevices.next(false);
                    // tells the listener about the error
                    this.camerasNotFound.next(err);
                    break;
                default:
                    console.warn('@zxing/ngx-scanner', 'I was not able to define if I have permissions for camera or not.', err);
                    // unknown
                    permission = null;
                    // this.hasDevices.next(undefined;
                    break;
            }
            this.setPermission(permission);
            // tells the listener about the error
            this.permissionResponse.error(err);
            return permission;
        };
        /**
         * Returns a valid BarcodeFormat or fails.
         */
        ZXingScannerComponent.prototype.getBarcodeFormatOrFail = function (format) {
            return typeof format === 'string'
                ? library.BarcodeFormat[format.trim().toUpperCase()]
                : format;
        };
        /**
         * Retorna um code reader, cria um se nenhume existe.
         */
        ZXingScannerComponent.prototype.getCodeReader = function () {
            if (!this._codeReader) {
                var options = {
                    delayBetweenScanAttempts: this.timeBetweenScans,
                    delayBetweenScanSuccess: this.delayBetweenScanSuccess,
                };
                this._codeReader = new BrowserMultiFormatContinuousReader(this.hints, options);
            }
            return this._codeReader;
        };
        /**
         * Starts the continuous scanning for the given device.
         *
         * @param deviceId The deviceId from the device.
         */
        ZXingScannerComponent.prototype.scanFromDevice = function (deviceId) {
            return __awaiter(this, void 0, void 0, function () {
                var videoElement, codeReader, scanStream, next, error, complete, controls, hasTorchControl;
                var _this = this;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            videoElement = this.previewElemRef.nativeElement;
                            codeReader = this.getCodeReader();
                            return [4 /*yield*/, codeReader.scanFromDeviceObservable(deviceId, videoElement)];
                        case 1:
                            scanStream = _c.sent();
                            if (!scanStream) {
                                throw new Error('Undefined decoding stream, aborting.');
                            }
                            next = function (x) { return _this._onDecodeResult(x.result, x.error); };
                            error = function (err) { return _this._onDecodeError(err); };
                            complete = function () { };
                            this._scanSubscription = scanStream.subscribe(next, error, complete);
                            if (this._scanSubscription.closed) {
                                return [2 /*return*/];
                            }
                            controls = codeReader.getScannerControls();
                            hasTorchControl = typeof controls.switchTorch !== 'undefined';
                            this.torchCompatible.next(hasTorchControl);
                            return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Handles decode errors.
         */
        ZXingScannerComponent.prototype._onDecodeError = function (err) {
            this.dispatchScanError(err);
            // this.reset();
        };
        /**
         * Handles decode results.
         */
        ZXingScannerComponent.prototype._onDecodeResult = function (result, error) {
            if (result) {
                this.dispatchScanSuccess(result);
            }
            else {
                this.dispatchScanFailure(error);
            }
            this.dispatchScanComplete(result);
        };
        /**
         * Stops the code reader and returns the previous selected device.
         */
        ZXingScannerComponent.prototype._reset = function () {
            if (!this._codeReader) {
                return;
            }
            var device = this._device;
            // do not set this.device inside this method, it would create a recursive loop
            this.device = undefined;
            this._codeReader = undefined;
            return device;
        };
        /**
         * Resets the scanner and emits device change.
         */
        ZXingScannerComponent.prototype.reset = function () {
            this._reset();
            this.deviceChange.emit(null);
        };
        /**
         * Sets the current device.
         */
        ZXingScannerComponent.prototype.setDevice = function (device) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            // instantly stops the scan before changing devices
                            this.scanStop();
                            // correctly sets the new (or none) device
                            this._device = device || undefined;
                            if (!this._device) {
                                // cleans the video because user removed the device
                                browser.BrowserCodeReader.cleanVideoSource(this.previewElemRef.nativeElement);
                            }
                            if (!(this._enabled && device)) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.scanFromDevice(device.deviceId)];
                        case 1:
                            _c.sent();
                            _c.label = 2;
                        case 2: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Sets the permission value and emmits the event.
         */
        ZXingScannerComponent.prototype.setPermission = function (hasPermission) {
            this.hasPermission = hasPermission;
            this.permissionResponse.next(hasPermission);
        };
        return ZXingScannerComponent;
    }());
    ZXingScannerComponent.decorators = [
        { type: core.Component, args: [{
                    selector: 'zxing-scanner',
                    template: "<video #preview [style.object-fit]=\"previewFitMode\">\n  <p>\n    Your browser does not support this feature, please try to upgrade it.\n  </p>\n  <p>\n    Seu navegador n\u00E3o suporta este recurso, por favor tente atualiz\u00E1-lo.\n  </p>\n</video>\n",
                    changeDetection: core.ChangeDetectionStrategy.OnPush,
                    styles: [":host{display:block}video{width:100%;height:auto;-o-object-fit:contain;object-fit:contain}"]
                },] }
    ];
    ZXingScannerComponent.ctorParameters = function () { return []; };
    ZXingScannerComponent.propDecorators = {
        previewElemRef: [{ type: core.ViewChild, args: ['preview', { static: true },] }],
        autofocusEnabled: [{ type: core.Input }],
        timeBetweenScans: [{ type: core.Input }],
        delayBetweenScanSuccess: [{ type: core.Input }],
        autostarted: [{ type: core.Output }],
        autostarting: [{ type: core.Output }],
        autostart: [{ type: core.Input }],
        previewFitMode: [{ type: core.Input }],
        torchCompatible: [{ type: core.Output }],
        scanSuccess: [{ type: core.Output }],
        scanFailure: [{ type: core.Output }],
        scanError: [{ type: core.Output }],
        scanComplete: [{ type: core.Output }],
        camerasFound: [{ type: core.Output }],
        camerasNotFound: [{ type: core.Output }],
        permissionResponse: [{ type: core.Output }],
        hasDevices: [{ type: core.Output }],
        device: [{ type: core.Input }],
        deviceChange: [{ type: core.Output }],
        formats: [{ type: core.Input }],
        videoConstraints: [{ type: core.Input }],
        torch: [{ type: core.Input }],
        enable: [{ type: core.Input }],
        tryHarder: [{ type: core.Input }]
    };

    var ZXingScannerModule = /** @class */ (function () {
        function ZXingScannerModule() {
        }
        return ZXingScannerModule;
    }());
    ZXingScannerModule.decorators = [
        { type: core.NgModule, args: [{
                    imports: [
                        common.CommonModule,
                        forms.FormsModule
                    ],
                    declarations: [ZXingScannerComponent],
                    exports: [ZXingScannerComponent],
                },] }
    ];

    /*
     * Public API Surface of zxing-scanner
     */

    /**
     * Generated bundle index. Do not edit.
     */

    exports.ZXingScannerComponent = ZXingScannerComponent;
    exports.ZXingScannerModule = ZXingScannerModule;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=zxing-ngx-scanner.umd.js.map
