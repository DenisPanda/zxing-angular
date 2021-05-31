import { __awaiter } from "tslib";
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { BrowserCodeReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { BrowserMultiFormatContinuousReader } from './browser-multi-format-continuous-reader';
export class ZXingScannerComponent {
    /**
     * Constructor to build the object and do some DI.
     */
    constructor() {
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
        this.autostarted = new EventEmitter();
        this.autostarting = new EventEmitter();
        this.torchCompatible = new EventEmitter(false);
        this.scanSuccess = new EventEmitter();
        this.scanFailure = new EventEmitter();
        this.scanError = new EventEmitter();
        this.scanComplete = new EventEmitter();
        this.camerasFound = new EventEmitter();
        this.camerasNotFound = new EventEmitter();
        this.permissionResponse = new EventEmitter(true);
        this.hasDevices = new EventEmitter();
        this.deviceChange = new EventEmitter();
        this._enabled = true;
        this._hints = new Map();
        this.autofocusEnabled = true;
        this.autostart = true;
        this.formats = [BarcodeFormat.QR_CODE];
        // computed data
        this.hasNavigator = typeof navigator !== 'undefined';
        this.isMediaDevicesSupported = this.hasNavigator && !!navigator.mediaDevices;
    }
    /**
     * Exposes the current code reader, so the user can use it's APIs.
     */
    get codeReader() {
        return this._codeReader;
    }
    /**
     * User device input
     */
    set device(device) {
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
    }
    /**
     * User device acessor.
     */
    get device() {
        return this._device;
    }
    /**
     * Returns all the registered formats.
     */
    get formats() {
        return this.hints.get(DecodeHintType.POSSIBLE_FORMATS);
    }
    /**
     * Registers formats the scanner should support.
     *
     * @param input BarcodeFormat or case-insensitive string array.
     */
    set formats(input) {
        if (typeof input === 'string') {
            throw new Error('Invalid formats, make sure the [formats] input is a binding.');
        }
        // formats may be set from html template as BarcodeFormat or string array
        const formats = input.map(f => this.getBarcodeFormatOrFail(f));
        const hints = this.hints;
        // updates the hints
        hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
        // handles updating the codeReader
        this.hints = hints;
    }
    /**
     * Returns all the registered hints.
     */
    get hints() {
        return this._hints;
    }
    /**
     * Does what it takes to set the hints.
     */
    set hints(hints) {
        var _a;
        this._hints = hints;
        // new instance with new hints.
        (_a = this.codeReader) === null || _a === void 0 ? void 0 : _a.setHints(this._hints);
    }
    /**
     * Sets the desired constraints in all video tracks.
     * @experimental
     */
    set videoConstraints(constraints) {
        var _a;
        // new instance with new hints.
        const controls = (_a = this.codeReader) === null || _a === void 0 ? void 0 : _a.getScannerControls();
        if (!controls) {
            // fails silently
            return;
        }
        controls === null || controls === void 0 ? void 0 : controls.streamVideoConstraintsApply(constraints);
    }
    /**
     *
     */
    set isAutostarting(state) {
        this._isAutostarting = state;
        this.autostarting.next(state);
    }
    /**
     *
     */
    get isAutostarting() {
        return this._isAutostarting;
    }
    /**
     * Can turn on/off the device flashlight.
     *
     * @experimental Torch/Flash APIs are not stable in all browsers, it may be buggy!
     */
    set torch(onOff) {
        try {
            const controls = this.getCodeReader().getScannerControls();
            controls.switchTorch(onOff);
        }
        catch (error) {
            // ignore error
        }
    }
    /**
     * Starts and Stops the scanning.
     */
    set enable(enabled) {
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
    }
    /**
     * Tells if the scanner is enabled or not.
     */
    get enabled() {
        return this._enabled;
    }
    /**
     * If is `tryHarder` enabled.
     */
    get tryHarder() {
        return this.hints.get(DecodeHintType.TRY_HARDER);
    }
    /**
     * Enable/disable tryHarder hint.
     */
    set tryHarder(enable) {
        const hints = this.hints;
        if (enable) {
            hints.set(DecodeHintType.TRY_HARDER, true);
        }
        else {
            hints.delete(DecodeHintType.TRY_HARDER);
        }
        this.hints = hints;
    }
    /**
     * Gets and registers all cammeras.
     */
    askForPermission() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.hasNavigator) {
                console.error('@zxing/ngx-scanner', 'Can\'t ask permission, navigator is not present.');
                this.setPermission(null);
                return this.hasPermission;
            }
            if (!this.isMediaDevicesSupported) {
                console.error('@zxing/ngx-scanner', 'Can\'t get user media, this is not supported.');
                this.setPermission(null);
                return this.hasPermission;
            }
            let stream;
            let permission;
            try {
                // Will try to ask for permission
                stream = yield this.getAnyVideoDevice();
                permission = !!stream;
            }
            catch (err) {
                return this.handlePermissionException(err);
            }
            finally {
                this.terminateStream(stream);
            }
            this.setPermission(permission);
            // Returns the permission
            return permission;
        });
    }
    /**
     *
     */
    getAnyVideoDevice() {
        return navigator.mediaDevices.getUserMedia({ video: true });
    }
    /**
     * Terminates a stream and it's tracks.
     */
    terminateStream(stream) {
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
        }
        stream = undefined;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.autostart) {
                console.warn('Feature \'autostart\' disabled. Permissions and devices recovery has to be run manually.');
                // does the necessary configuration without autostarting
                this.initAutostartOff();
                this._ready = true;
                return;
            }
            // configurates the component and starts the scanner
            yield this.initAutostartOn();
            this._ready = true;
        });
    }
    /**
     * Initializes the component without starting the scanner.
     */
    initAutostartOff() {
        // do not ask for permission when autostart is off
        this.isAutostarting = false;
        // just update devices information
        this.updateVideoInputDevices();
        if (this._device && this._devicePreStart) {
            this.setDevice(this._devicePreStart);
        }
    }
    /**
     * Initializes the component and starts the scanner.
     * Permissions are asked to accomplish that.
     */
    initAutostartOn() {
        return __awaiter(this, void 0, void 0, function* () {
            this.isAutostarting = true;
            let hasPermission;
            try {
                // Asks for permission before enumerating devices so it can get all the device's info
                hasPermission = yield this.askForPermission();
            }
            catch (e) {
                console.error('Exception occurred while asking for permission:', e);
                return;
            }
            // from this point, things gonna need permissions
            if (hasPermission) {
                const devices = yield this.updateVideoInputDevices();
                yield this.autostartScanner([...devices]);
            }
            this.isAutostarting = false;
            this.autostarted.next();
        });
    }
    /**
     * Checks if the given device is the current defined one.
     */
    isCurrentDevice(device) {
        var _a;
        return (device === null || device === void 0 ? void 0 : device.deviceId) === ((_a = this._device) === null || _a === void 0 ? void 0 : _a.deviceId);
    }
    /**
     * Executes some actions before destroy the component.
     */
    ngOnDestroy() {
        this.reset();
    }
    /**
     *
     */
    ngOnInit() {
        this.init();
    }
    /**
     * Stops the scanning, if any.
     */
    scanStop() {
        var _a, _b;
        if (this._scanSubscription) {
            (_a = this.codeReader) === null || _a === void 0 ? void 0 : _a.getScannerControls().stop();
            (_b = this._scanSubscription) === null || _b === void 0 ? void 0 : _b.unsubscribe();
            this._scanSubscription = undefined;
        }
        this.torchCompatible.next(false);
    }
    /**
     * Stops the scanning, if any.
     */
    scanStart() {
        if (this._scanSubscription) {
            throw new Error('There is already a scan proccess running.');
        }
        if (!this._device) {
            throw new Error('No device defined, cannot start scan, please define a device.');
        }
        this.scanFromDevice(this._device.deviceId);
    }
    /**
     * Stops old `codeReader` and starts scanning in a new one.
     */
    restart() {
        // @note apenas necessario por enquanto causa da Torch
        this._codeReader = undefined;
        const prevDevice = this._reset();
        if (!prevDevice) {
            return;
        }
        this.device = prevDevice;
    }
    /**
     * Discovers and updates known video input devices.
     */
    updateVideoInputDevices() {
        return __awaiter(this, void 0, void 0, function* () {
            // permissions aren't needed to get devices, but to access them and their info
            const devices = (yield BrowserCodeReader.listVideoInputDevices()) || [];
            const hasDevices = devices && devices.length > 0;
            // stores discovered devices and updates information
            this.hasDevices.next(hasDevices);
            this.camerasFound.next([...devices]);
            if (!hasDevices) {
                this.camerasNotFound.next();
            }
            return devices;
        });
    }
    /**
     * Starts the scanner with the back camera otherwise take the last
     * available device.
     */
    autostartScanner(devices) {
        return __awaiter(this, void 0, void 0, function* () {
            const matcher = ({ label }) => /back|trás|rear|traseira|environment|ambiente/gi.test(label);
            // select the rear camera by default, otherwise take the last camera.
            const device = devices.find(matcher) || devices.pop();
            if (!device) {
                throw new Error('Impossible to autostart, no input devices available.');
            }
            yield this.setDevice(device);
            this.deviceChange.next(device);
        });
    }
    /**
     * Dispatches the scan success event.
     *
     * @param result the scan result.
     */
    dispatchScanSuccess(result) {
        this.scanSuccess.next(result.getText());
    }
    /**
     * Dispatches the scan failure event.
     */
    dispatchScanFailure(reason) {
        this.scanFailure.next(reason);
    }
    /**
     * Dispatches the scan error event.
     *
     * @param error the error thing.
     */
    dispatchScanError(error) {
        if (!this.scanError.observers.some(x => Boolean(x))) {
            console.error(`zxing scanner component: ${error.name}`, error);
            console.warn('Use the `(scanError)` property to handle errors like this!');
        }
        this.scanError.next(error);
    }
    /**
     * Dispatches the scan event.
     *
     * @param result the scan result.
     */
    dispatchScanComplete(result) {
        this.scanComplete.next(result);
    }
    /**
     * Returns the filtered permission.
     */
    handlePermissionException(err) {
        // failed to grant permission to video input
        console.error('@zxing/ngx-scanner', 'Error when asking for permission.', err);
        let permission;
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
    }
    /**
     * Returns a valid BarcodeFormat or fails.
     */
    getBarcodeFormatOrFail(format) {
        return typeof format === 'string'
            ? BarcodeFormat[format.trim().toUpperCase()]
            : format;
    }
    /**
     * Retorna um code reader, cria um se nenhume existe.
     */
    getCodeReader() {
        if (!this._codeReader) {
            const options = {
                delayBetweenScanAttempts: this.timeBetweenScans,
                delayBetweenScanSuccess: this.delayBetweenScanSuccess,
            };
            this._codeReader = new BrowserMultiFormatContinuousReader(this.hints, options);
        }
        return this._codeReader;
    }
    /**
     * Starts the continuous scanning for the given device.
     *
     * @param deviceId The deviceId from the device.
     */
    scanFromDevice(deviceId) {
        return __awaiter(this, void 0, void 0, function* () {
            const videoElement = this.previewElemRef.nativeElement;
            const codeReader = this.getCodeReader();
            const scanStream = yield codeReader.scanFromDeviceObservable(deviceId, videoElement);
            if (!scanStream) {
                throw new Error('Undefined decoding stream, aborting.');
            }
            const next = (x) => this._onDecodeResult(x.result, x.error);
            const error = (err) => this._onDecodeError(err);
            const complete = () => { };
            this._scanSubscription = scanStream.subscribe(next, error, complete);
            if (this._scanSubscription.closed) {
                return;
            }
            const controls = codeReader.getScannerControls();
            const hasTorchControl = typeof controls.switchTorch !== 'undefined';
            this.torchCompatible.next(hasTorchControl);
        });
    }
    /**
     * Handles decode errors.
     */
    _onDecodeError(err) {
        this.dispatchScanError(err);
        // this.reset();
    }
    /**
     * Handles decode results.
     */
    _onDecodeResult(result, error) {
        if (result) {
            this.dispatchScanSuccess(result);
        }
        else {
            this.dispatchScanFailure(error);
        }
        this.dispatchScanComplete(result);
    }
    /**
     * Stops the code reader and returns the previous selected device.
     */
    _reset() {
        if (!this._codeReader) {
            return;
        }
        const device = this._device;
        // do not set this.device inside this method, it would create a recursive loop
        this.device = undefined;
        this._codeReader = undefined;
        return device;
    }
    /**
     * Resets the scanner and emits device change.
     */
    reset() {
        this._reset();
        this.deviceChange.emit(null);
    }
    /**
     * Sets the current device.
     */
    setDevice(device) {
        return __awaiter(this, void 0, void 0, function* () {
            // instantly stops the scan before changing devices
            this.scanStop();
            // correctly sets the new (or none) device
            this._device = device || undefined;
            if (!this._device) {
                // cleans the video because user removed the device
                BrowserCodeReader.cleanVideoSource(this.previewElemRef.nativeElement);
            }
            // if enabled, starts scanning
            if (this._enabled && device) {
                yield this.scanFromDevice(device.deviceId);
            }
        });
    }
    /**
     * Sets the permission value and emmits the event.
     */
    setPermission(hasPermission) {
        this.hasPermission = hasPermission;
        this.permissionResponse.next(hasPermission);
    }
}
ZXingScannerComponent.decorators = [
    { type: Component, args: [{
                selector: 'zxing-scanner',
                template: "<video #preview [style.object-fit]=\"previewFitMode\">\n  <p>\n    Your browser does not support this feature, please try to upgrade it.\n  </p>\n  <p>\n    Seu navegador n\u00E3o suporta este recurso, por favor tente atualiz\u00E1-lo.\n  </p>\n</video>\n",
                changeDetection: ChangeDetectionStrategy.OnPush,
                styles: [":host{display:block}video{width:100%;height:auto;-o-object-fit:contain;object-fit:contain}"]
            },] }
];
ZXingScannerComponent.ctorParameters = () => [];
ZXingScannerComponent.propDecorators = {
    previewElemRef: [{ type: ViewChild, args: ['preview', { static: true },] }],
    autofocusEnabled: [{ type: Input }],
    timeBetweenScans: [{ type: Input }],
    delayBetweenScanSuccess: [{ type: Input }],
    autostarted: [{ type: Output }],
    autostarting: [{ type: Output }],
    autostart: [{ type: Input }],
    previewFitMode: [{ type: Input }],
    torchCompatible: [{ type: Output }],
    scanSuccess: [{ type: Output }],
    scanFailure: [{ type: Output }],
    scanError: [{ type: Output }],
    scanComplete: [{ type: Output }],
    camerasFound: [{ type: Output }],
    camerasNotFound: [{ type: Output }],
    permissionResponse: [{ type: Output }],
    hasDevices: [{ type: Output }],
    device: [{ type: Input }],
    deviceChange: [{ type: Output }],
    formats: [{ type: Input }],
    videoConstraints: [{ type: Input }],
    torch: [{ type: Input }],
    enable: [{ type: Input }],
    tryHarder: [{ type: Input }]
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoienhpbmctc2Nhbm5lci5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wcm9qZWN0cy96eGluZy1zY2FubmVyL3NyYy9saWIvenhpbmctc2Nhbm5lci5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFDTCx1QkFBdUIsRUFDdkIsU0FBUyxFQUNULFVBQVUsRUFDVixZQUFZLEVBQ1osS0FBSyxFQUdMLE1BQU0sRUFDTixTQUFTLEVBQ1YsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFDbkQsT0FBTyxFQUNMLGFBQWEsRUFDYixjQUFjLEVBR2YsTUFBTSxnQkFBZ0IsQ0FBQztBQUV4QixPQUFPLEVBQUUsa0NBQWtDLEVBQUUsTUFBTSwwQ0FBMEMsQ0FBQztBQVU5RixNQUFNLE9BQU8scUJBQXFCO0lBa1doQzs7T0FFRztJQUNIO1FBMVNBOztXQUVHO1FBRUgscUJBQWdCLEdBQUcsR0FBRyxDQUFDO1FBRXZCOztXQUVHO1FBRUgsNEJBQXVCLEdBQUcsR0FBRyxDQUFDO1FBb0I5Qjs7V0FFRztRQUVILG1CQUFjLEdBQXlELE9BQU8sQ0FBQztRQXdEdkUsV0FBTSxHQUFHLEtBQUssQ0FBQztRQWlOckIsMEJBQTBCO1FBQzFCLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxZQUFZLEVBQUUsQ0FBQztRQUN0QyxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksWUFBWSxFQUFFLENBQUM7UUFDdkMsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMvQyxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksWUFBWSxFQUFFLENBQUM7UUFDdEMsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLFlBQVksRUFBRSxDQUFDO1FBQ3RDLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxZQUFZLEVBQUUs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QUM1QztRQUNILENBQUM7S0FBQTtJQUVEOztPQUVHO0lBQ0ssYUFBYSxDQUFDLGFBQTZCO1FBQ2pELElBQUksQ0FBQyxhQUFhLEdBQUcsYUFBYSxDQUFDO1FBQ25DLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDOUMsQ0FBQzs7O1lBbjFCRixTQUFTLFNBQUM7Z0JBQ1QsUUFBUSxFQUFFLGVBQWU7Z0JBQ3pCLDJRQUE2QztnQkFFN0MsZUFBZSxFQUFFLHVCQUF1QixDQUFDLE1BQU07O2FBQ2hEOzs7OzZCQW1ERSxTQUFTLFNBQUMsU0FBUyxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRTsrQkFNckMsS0FBSzsrQkFNTCxLQUFLO3NDQU1MLEtBQUs7MEJBTUwsTUFBTTsyQkFNTixNQUFNO3dCQU1OLEtBQUs7NkJBTUwsS0FBSzs4QkFNTCxNQUFNOzBCQU1OLE1BQU07MEJBTU4sTUFBTTt3QkFNTixNQUFNOzJCQU1OLE1BQU07MkJBTU4sTUFBTTs4QkFNTixNQUFNO2lDQU1OLE1BQU07eUJBTU4sTUFBTTtxQkFpQk4sS0FBSzsyQkFxQ0wsTUFBTTtzQkFzQk4sS0FBSzsrQkF1Q0wsS0FBSztvQkFpQ0wsS0FBSztxQkFhTCxLQUFLO3dCQWlDTCxLQUFLIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksXG4gIENvbXBvbmVudCxcbiAgRWxlbWVudFJlZixcbiAgRXZlbnRFbWl0dGVyLFxuICBJbnB1dCxcbiAgT25EZXN0cm95LFxuICBPbkluaXQsXG4gIE91dHB1dCxcbiAgVmlld0NoaWxkXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgQnJvd3NlckNvZGVSZWFkZXIgfSBmcm9tICdAenhpbmcvYnJvd3Nlcic7XG5pbXBvcnQge1xuICBCYXJjb2RlRm9ybWF0LFxuICBEZWNvZGVIaW50VHlwZSxcbiAgRXhjZXB0aW9uLFxuICBSZXN1bHRcbn0gZnJvbSAnQHp4aW5nL2xpYnJhcnknO1xuaW1wb3J0IHsgU3Vic2NyaXB0aW9uIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBCcm93c2VyTXVsdGlGb3JtYXRDb250aW51b3VzUmVhZGVyIH0gZnJvbSAnLi9icm93c2VyLW11bHRpLWZvcm1hdC1jb250aW51b3VzLXJlYWRlcic7XG5pbXBvcnQgeyBSZXN1bHRBbmRFcnJvciB9IGZyb20gJy4vUmVzdWx0QW5kRXJyb3InO1xuXG5cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogJ3p4aW5nLXNjYW5uZXInLFxuICB0ZW1wbGF0ZVVybDogJy4venhpbmctc2Nhbm5lci5jb21wb25lbnQuaHRtbCcsXG4gIHN0eWxlVXJsczogWycuL3p4aW5nLXNjYW5uZXIuY29tcG9uZW50LnNjc3MnXSxcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2hcbn0pXG5leHBvcnQgY2xhc3MgWlhpbmdTY2FubmVyQ29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0LCBPbkRlc3Ryb3kge1xuXG4gIC8qKlxuICAgKiBTdXBwb3J0ZWQgSGludHMgbWFwLlxuICAgKi9cbiAgcHJpdmF0ZSBfaGludHM6IE1hcDxEZWNvZGVIaW50VHlwZSwgYW55PiB8IG51bGw7XG5cbiAgLyoqXG4gICAqIFRoZSBaWGluZyBjb2RlIHJlYWRlci5cbiAgICovXG4gIHByaXZhdGUgX2NvZGVSZWFkZXI6IEJyb3dzZXJNdWx0aUZvcm1hdENvbnRpbnVvdXNSZWFkZXI7XG5cbiAgLyoqXG4gICAqIFRoZSBkZXZpY2UgdGhhdCBzaG91bGQgYmUgdXNlZCB0byBzY2FuIHRoaW5ncy5cbiAgICovXG4gIHByaXZhdGUgX2RldmljZTogTWVkaWFEZXZpY2VJbmZvO1xuXG4gIC8qKlxuICAgKiBUaGUgZGV2aWNlIHRoYXQgc2hvdWxkIGJlIHVzZWQgdG8gc2NhbiB0aGluZ3MuXG4gICAqL1xuICBwcml2YXRlIF9lbmFibGVkOiBib29sZWFuO1xuXG4gIC8qKlxuICAgKlxuICAgKi9cbiAgcHJpdmF0ZSBfaXNBdXRvc3RhcnRpbmc6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIEhhcyBgbmF2aWdhdG9yYCBhY2Nlc3MuXG4gICAqL1xuICBwcml2YXRlIGhhc05hdmlnYXRvcjogYm9vbGVhbjtcblxuICAvKipcbiAgICogU2F5cyBpZiBzb21lIG5hdGl2ZSBBUEkgaXMgc3VwcG9ydGVkLlxuICAgKi9cbiAgcHJpdmF0ZSBpc01lZGlhRGV2aWNlc1N1cHBvcnRlZDogYm9vbGVhbjtcblxuICAvKipcbiAgICogSWYgdGhlIHVzZXItYWdlbnQgYWxsb3dlZCB0aGUgdXNlIG9mIHRoZSBjYW1lcmEgb3Igbm90LlxuICAgKi9cbiAgcHJpdmF0ZSBoYXNQZXJtaXNzaW9uOiBib29sZWFuIHwgbnVsbDtcblxuICAvKipcbiAgICogVW5zdWJzY3JpYmUgdG8gc3RvcCBzY2FubmluZy5cbiAgICovXG4gIHByaXZhdGUgX3NjYW5TdWJzY3JpcHRpb24/OiBTdWJzY3JpcHRpb247XG5cbiAgLyoqXG4gICAqIFJlZmVyZW5jZSB0byB0aGUgcHJldmlldyBlbGVtZW50LCBzaG91bGQgYmUgdGhlIGB2aWRlb2AgdGFnLlxuICAgKi9cbiAgQFZpZXdDaGlsZCgncHJldmlldycsIHsgc3RhdGljOiB0cnVlIH0pXG4gIHByZXZpZXdFbGVtUmVmOiBFbGVtZW50UmVmPEhUTUxWaWRlb0VsZW1lbnQ+O1xuXG4gIC8qKlxuICAgKiBFbmFibGUgb3IgZGlzYWJsZSBhdXRvZm9jdXMgb2YgdGhlIGNhbWVyYSAobWlnaHQgaGF2ZSBhbiBpbXBhY3Qgb24gcGVyZm9ybWFuY2UpXG4gICAqL1xuICBASW5wdXQoKVxuICBhdXRvZm9jdXNFbmFibGVkOiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBEZWxheSBiZXR3ZWVuIGF0dGVtcHRzIHRvIGRlY29kZSAoZGVmYXVsdCBpcyA1MDBtcylcbiAgICovXG4gIEBJbnB1dCgpXG4gIHRpbWVCZXR3ZWVuU2NhbnMgPSA1MDA7XG5cbiAgLyoqXG4gICAqIERlbGF5IGJldHdlZW4gc3VjY2Vzc2Z1bCBkZWNvZGUgKGRlZmF1bHQgaXMgNTAwbXMpXG4gICAqL1xuICBASW5wdXQoKVxuICBkZWxheUJldHdlZW5TY2FuU3VjY2VzcyA9IDUwMDtcblxuICAvKipcbiAgICogRW1pdHMgd2hlbiBhbmQgaWYgdGhlIHNjYW5uZXIgaXMgYXV0b3N0YXJ0ZWQuXG4gICAqL1xuICBAT3V0cHV0KClcbiAgYXV0b3N0YXJ0ZWQ6IEV2ZW50RW1pdHRlcjx2b2lkPjtcblxuICAvKipcbiAgICogVHJ1ZSBkdXJpbmcgYXV0b3N0YXJ0IGFuZCBmYWxzZSBhZnRlci4gSXQgd2lsbCBiZSBudWxsIGlmIHdvbid0IGF1dG9zdGFydCBhdCBhbGwuXG4gICAqL1xuICBAT3V0cHV0KClcbiAgYXV0b3N0YXJ0aW5nOiBFdmVudEVtaXR0ZXI8Ym9vbGVhbj47XG5cbiAgLyoqXG4gICAqIElmIHRoZSBzY2FubmVyIHNob3VsZCBhdXRvc3RhcnQgd2l0aCB0aGUgZmlyc3QgYXZhaWxhYmxlIGRldmljZS5cbiAgICovXG4gIEBJbnB1dCgpXG4gIGF1dG9zdGFydDogYm9vbGVhbjtcblxuICAvKipcbiAgICogSG93IHRoZSBwcmV2aWV3IGVsZW1lbnQgc2hvdWQgYmUgZml0IGluc2lkZSB0aGUgOmhvc3QgY29udGFpbmVyLlxuICAgKi9cbiAgQElucHV0KClcbiAgcHJldmlld0ZpdE1vZGU6ICdmaWxsJyB8ICdjb250YWluJyB8ICdjb3ZlcicgfCAnc2NhbGUtZG93bicgfCAnbm9uZScgPSAnY292ZXInO1xuXG4gIC8qKlxuICAgKiBFbWl0dHMgZXZlbnRzIHdoZW4gdGhlIHRvcmNoIGNvbXBhdGliaWxpdHkgaXMgY2hhbmdlZC5cbiAgICovXG4gIEBPdXRwdXQoKVxuICB0b3JjaENvbXBhdGlibGU6IEV2ZW50RW1pdHRlcjxib29sZWFuPjtcblxuICAvKipcbiAgICogRW1pdHRzIGV2ZW50cyB3aGVuIGEgc2NhbiBpcyBzdWNjZXNzZnVsIHBlcmZvcm1lZCwgd2lsbCBpbmplY3QgdGhlIHN0cmluZyB2YWx1ZSBvZiB0aGUgUVItY29kZSB0byB0aGUgY2FsbGJhY2suXG4gICAqL1xuICBAT3V0cHV0KClcbiAgc2NhblN1Y2Nlc3M6IEV2ZW50RW1pdHRlcjxzdHJpbmc+O1xuXG4gIC8qKlxuICAgKiBFbWl0dHMgZXZlbnRzIHdoZW4gYSBzY2FuIGZhaWxzIHdpdGhvdXQgZXJyb3JzLCB1c2VmdWxsIHRvIGtub3cgaG93IG11Y2ggc2NhbiB0cmllcyB3aGVyZSBtYWRlLlxuICAgKi9cbiAgQE91dHB1dCgpXG4gIHNjYW5GYWlsdXJlOiBFdmVudEVtaXR0ZXI8RXhjZXB0aW9uIHwgdW5kZWZpbmVkPjtcblxuICAvKipcbiAgICogRW1pdHRzIGV2ZW50cyB3aGVuIGEgc2NhbiB0aHJvd3Mgc29tZSBlcnJvciwgd2lsbCBpbmplY3QgdGhlIGVycm9yIHRvIHRoZSBjYWxsYmFjay5cbiAgICovXG4gIEBPdXRwdXQoKVxuICBzY2FuRXJyb3I6IEV2ZW50RW1pdHRlcjxFcnJvcj47XG5cbiAgLyoqXG4gICAqIEVtaXR0cyBldmVudHMgd2hlbiBhIHNjYW4gaXMgcGVyZm9ybWVkLCB3aWxsIGluamVjdCB0aGUgUmVzdWx0IHZhbHVlIG9mIHRoZSBRUi1jb2RlIHNjYW4gKGlmIGF2YWlsYWJsZSkgdG8gdGhlIGNhbGxiYWNrLlxuICAgKi9cbiAgQE91dHB1dCgpXG4gIHNjYW5Db21wbGV0ZTogRXZlbnRFbWl0dGVyPFJlc3VsdD47XG5cbiAgLyoqXG4gICAqIEVtaXR0cyBldmVudHMgd2hlbiBubyBjYW1lcmFzIGFyZSBmb3VuZCwgd2lsbCBpbmplY3QgYW4gZXhjZXB0aW9uIChpZiBhdmFpbGFibGUpIHRvIHRoZSBjYWxsYmFjay5cbiAgICovXG4gIEBPdXRwdXQoKVxuICBjYW1lcmFzRm91bmQ6IEV2ZW50RW1pdHRlcjxNZWRpYURldmljZUluZm9bXT47XG5cbiAgLyoqXG4gICAqIEVtaXR0cyBldmVudHMgd2hlbiBubyBjYW1lcmFzIGFyZSBmb3VuZCwgd2lsbCBpbmplY3QgYW4gZXhjZXB0aW9uIChpZiBhdmFpbGFibGUpIHRvIHRoZSBjYWxsYmFjay5cbiAgICovXG4gIEBPdXRwdXQoKVxuICBjYW1lcmFzTm90Rm91bmQ6IEV2ZW50RW1pdHRlcjxhbnk+O1xuXG4gIC8qKlxuICAgKiBFbWl0dHMgZXZlbnRzIHdoZW4gdGhlIHVzZXJzIGFuc3dlcnMgZm9yIHBlcm1pc3Npb24uXG4gICAqL1xuICBAT3V0cHV0KClcbiAgcGVybWlzc2lvblJlc3BvbnNlOiBFdmVudEVtaXR0ZXI8Ym9vbGVhbj47XG5cbiAgLyoqXG4gICAqIEVtaXR0cyBldmVudHMgd2hlbiBoYXMgZGV2aWNlcyBzdGF0dXMgaXMgdXBkYXRlLlxuICAgKi9cbiAgQE91dHB1dCgpXG4gIGhhc0RldmljZXM6IEV2ZW50RW1pdHRlcjxib29sZWFuPjtcblxuICBwcml2YXRlIF9yZWFkeSA9IGZhbHNlO1xuXG4gIHByaXZhdGUgX2RldmljZVByZVN0YXJ0OiBNZWRpYURldmljZUluZm87XG5cbiAgLyoqXG4gICAqIEV4cG9zZXMgdGhlIGN1cnJlbnQgY29kZSByZWFkZXIsIHNvIHRoZSB1c2VyIGNhbiB1c2UgaXQncyBBUElzLlxuICAgKi9cbiAgZ2V0IGNvZGVSZWFkZXIoKTogQnJvd3Nlck11bHRpRm9ybWF0Q29udGludW91c1JlYWRlciB7XG4gICAgcmV0dXJuIHRoaXMuX2NvZGVSZWFkZXI7XG4gIH1cblxuICAvKipcbiAgICogVXNlciBkZXZpY2UgaW5wdXRcbiAgICovXG4gIEBJbnB1dCgpXG4gIHNldCBkZXZpY2UoZGV2aWNlOiBNZWRpYURldmljZUluZm8gfCB1bmRlZmluZWQpIHtcblxuICAgIGlmICghdGhpcy5fcmVhZHkpIHtcbiAgICAgIHRoaXMuX2RldmljZVByZVN0YXJ0ID0gZGV2aWNlO1xuICAgICAgLy8gbGV0J3MgaWdub3JlIHNpbGVudGx5LCB1c2VycyBkb24ndCBsaWVrIGxvZ3NcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5pc0F1dG9zdGFydGluZykge1xuICAgICAgLy8gZG8gbm90IGFsbG93IHNldHRpbmcgZGV2aWNlcyBkdXJpbmcgYXV0by1zdGFydCwgc2luY2UgaXQgd2lsbCBzZXQgb25lIGFuZCBlbWl0IGl0LlxuICAgICAgY29uc29sZS53YXJuKCdBdm9pZCBzZXR0aW5nIGEgZGV2aWNlIGR1cmluZyBhdXRvLXN0YXJ0LicpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmlzQ3VycmVudERldmljZShkZXZpY2UpKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ1NldHRpbmcgdGhlIHNhbWUgZGV2aWNlIGlzIG5vdCBhbGxvd2VkLicpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5oYXNQZXJtaXNzaW9uKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ1Blcm1pc3Npb25zIG5vdCBzZXQgeWV0LCB3YWl0aW5nIGZvciB0aGVtIHRvIGJlIHNldCB0byBhcHBseSBkZXZpY2UgY2hhbmdlLicpO1xuICAgICAgLy8gdGhpcy5wZXJtaXNzaW9uUmVzcG9uc2VcbiAgICAgIC8vICAgLnBpcGUoXG4gICAgICAvLyAgICAgdGFrZSgxKSxcbiAgICAgIC8vICAgICB0YXAoKCkgPT4gY29uc29sZS5sb2coYFBlcm1pc3Npb25zIHNldCwgYXBwbHlpbmcgZGV2aWNlIGNoYW5nZSR7ZGV2aWNlID8gYCAoJHtkZXZpY2UuZGV2aWNlSWR9KWAgOiAnJ30uYCkpXG4gICAgICAvLyAgIClcbiAgICAgIC8vICAgLnN1YnNjcmliZSgoKSA9PiB0aGlzLmRldmljZSA9IGRldmljZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5zZXREZXZpY2UoZGV2aWNlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbWl0cyB3aGVuIHRoZSBjdXJyZW50IGRldmljZSBpcyBjaGFuZ2VkLlxuICAgKi9cbiAgQE91dHB1dCgpXG4gIGRldmljZUNoYW5nZTogRXZlbnRFbWl0dGVyPE1lZGlhRGV2aWNlSW5mbz47XG5cbiAgLyoqXG4gICAqIFVzZXIgZGV2aWNlIGFjZXNzb3IuXG4gICAqL1xuICBnZXQgZGV2aWNlKCkge1xuICAgIHJldHVybiB0aGlzLl9kZXZpY2U7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbGwgdGhlIHJlZ2lzdGVyZWQgZm9ybWF0cy5cbiAgICovXG4gIGdldCBmb3JtYXRzKCk6IEJhcmNvZGVGb3JtYXRbXSB7XG4gICAgcmV0dXJuIHRoaXMuaGludHMuZ2V0KERlY29kZUhpbnRUeXBlLlBPU1NJQkxFX0ZPUk1BVFMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVycyBmb3JtYXRzIHRoZSBzY2FubmVyIHNob3VsZCBzdXBwb3J0LlxuICAgKlxuICAgKiBAcGFyYW0gaW5wdXQgQmFyY29kZUZvcm1hdCBvciBjYXNlLWluc2Vuc2l0aXZlIHN0cmluZyBhcnJheS5cbiAgICovXG4gIEBJbnB1dCgpXG4gIHNldCBmb3JtYXRzKGlucHV0OiBCYXJjb2RlRm9ybWF0W10pIHtcblxuICAgIGlmICh0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgZm9ybWF0cywgbWFrZSBzdXJlIHRoZSBbZm9ybWF0c10gaW5wdXQgaXMgYSBiaW5kaW5nLicpO1xuICAgIH1cblxuICAgIC8vIGZvcm1hdHMgbWF5IGJlIHNldCBmcm9tIGh0bWwgdGVtcGxhdGUgYXMgQmFyY29kZUZvcm1hdCBvciBzdHJpbmcgYXJyYXlcbiAgICBjb25zdCBmb3JtYXRzID0gaW5wdXQubWFwKGYgPT4gdGhpcy5nZXRCYXJjb2RlRm9ybWF0T3JGYWlsKGYpKTtcblxuICAgIGNvbnN0IGhpbnRzID0gdGhpcy5oaW50cztcblxuICAgIC8vIHVwZGF0ZXMgdGhlIGhpbnRzXG4gICAgaGludHMuc2V0KERlY29kZUhpbnRUeXBlLlBPU1NJQkxFX0ZPUk1BVFMsIGZvcm1hdHMpO1xuXG4gICAgLy8gaGFuZGxlcyB1cGRhdGluZyB0aGUgY29kZVJlYWRlclxuICAgIHRoaXMuaGludHMgPSBoaW50cztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFsbCB0aGUgcmVnaXN0ZXJlZCBoaW50cy5cbiAgICovXG4gIGdldCBoaW50cygpIHtcbiAgICByZXR1cm4gdGhpcy5faGludHM7XG4gIH1cblxuICAvKipcbiAgICogRG9lcyB3aGF0IGl0IHRha2VzIHRvIHNldCB0aGUgaGludHMuXG4gICAqL1xuICBzZXQgaGludHMoaGludHM6IE1hcDxEZWNvZGVIaW50VHlwZSwgYW55Pikge1xuICAgIHRoaXMuX2hpbnRzID0gaGludHM7XG4gICAgLy8gbmV3IGluc3RhbmNlIHdpdGggbmV3IGhpbnRzLlxuICAgIHRoaXMuY29kZVJlYWRlcj8uc2V0SGludHModGhpcy5faGludHMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGRlc2lyZWQgY29uc3RyYWludHMgaW4gYWxsIHZpZGVvIHRyYWNrcy5cbiAgICogQGV4cGVyaW1lbnRhbFxuICAgKi9cbiAgQElucHV0KClcbiAgc2V0IHZpZGVvQ29uc3RyYWludHMoY29uc3RyYWludHM6IE1lZGlhVHJhY2tDb25zdHJhaW50cykge1xuICAgIC8vIG5ldyBpbnN0YW5jZSB3aXRoIG5ldyBoaW50cy5cbiAgICBjb25zdCBjb250cm9scyA9IHRoaXMuY29kZVJlYWRlcj8uZ2V0U2Nhbm5lckNvbnRyb2xzKCk7XG5cbiAgICBpZiAoIWNvbnRyb2xzKSB7XG4gICAgICAvLyBmYWlscyBzaWxlbnRseVxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnRyb2xzPy5zdHJlYW1WaWRlb0NvbnN0cmFpbnRzQXBwbHkoY29uc3RyYWludHMpO1xuICB9XG5cbiAgLyoqXG4gICAqXG4gICAqL1xuICBzZXQgaXNBdXRvc3RhcnRpbmcoc3RhdGU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9pc0F1dG9zdGFydGluZyA9IHN0YXRlO1xuICAgIHRoaXMuYXV0b3N0YXJ0aW5nLm5leHQoc3RhdGUpO1xuICB9XG5cbiAgLyoqXG4gICAqXG4gICAqL1xuICBnZXQgaXNBdXRvc3RhcnRpbmcoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2lzQXV0b3N0YXJ0aW5nO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbiB0dXJuIG9uL29mZiB0aGUgZGV2aWNlIGZsYXNobGlnaHQuXG4gICAqXG4gICAqIEBleHBlcmltZW50YWwgVG9yY2gvRmxhc2ggQVBJcyBhcmUgbm90IHN0YWJsZSBpbiBhbGwgYnJvd3NlcnMsIGl0IG1heSBiZSBidWdneSFcbiAgICovXG4gIEBJbnB1dCgpXG4gIHNldCB0b3JjaChvbk9mZjogYm9vbGVhbikge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBjb250cm9scyA9IHRoaXMuZ2V0Q29kZVJlYWRlcigpLmdldFNjYW5uZXJDb250cm9scygpO1xuICAgICAgY29udHJvbHMuc3dpdGNoVG9yY2gob25PZmYpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAvLyBpZ25vcmUgZXJyb3JcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU3RhcnRzIGFuZCBTdG9wcyB0aGUgc2Nhbm5pbmcuXG4gICAqL1xuICBASW5wdXQoKVxuICBzZXQgZW5hYmxlKGVuYWJsZWQ6IGJvb2xlYW4pIHtcblxuICAgIHRoaXMuX2VuYWJsZWQgPSBCb29sZWFuKGVuYWJsZWQpO1xuXG4gICAgaWYgKCF0aGlzLl9lbmFibGVkKSB7XG4gICAgICB0aGlzLnJlc2V0KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0aGlzLmRldmljZSkge1xuICAgICAgICB0aGlzLnNjYW5Gcm9tRGV2aWNlKHRoaXMuZGV2aWNlLmRldmljZUlkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuaW5pdCgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUZWxscyBpZiB0aGUgc2Nhbm5lciBpcyBlbmFibGVkIG9yIG5vdC5cbiAgICovXG4gIGdldCBlbmFibGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9lbmFibGVkO1xuICB9XG5cbiAgLyoqXG4gICAqIElmIGlzIGB0cnlIYXJkZXJgIGVuYWJsZWQuXG4gICAqL1xuICBnZXQgdHJ5SGFyZGVyKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmhpbnRzLmdldChEZWNvZGVIaW50VHlwZS5UUllfSEFSREVSKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbmFibGUvZGlzYWJsZSB0cnlIYXJkZXIgaGludC5cbiAgICovXG4gIEBJbnB1dCgpXG4gIHNldCB0cnlIYXJkZXIoZW5hYmxlOiBib29sZWFuKSB7XG5cbiAgICBjb25zdCBoaW50cyA9IHRoaXMuaGludHM7XG5cbiAgICBpZiAoZW5hYmxlKSB7XG4gICAgICBoaW50cy5zZXQoRGVjb2RlSGludFR5cGUuVFJZX0hBUkRFUiwgdHJ1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGhpbnRzLmRlbGV0ZShEZWNvZGVIaW50VHlwZS5UUllfSEFSREVSKTtcbiAgICB9XG5cbiAgICB0aGlzLmhpbnRzID0gaGludHM7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IgdG8gYnVpbGQgdGhlIG9iamVjdCBhbmQgZG8gc29tZSBESS5cbiAgICovXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIC8vIGluc3RhbmNlIGJhc2VkIGVtaXR0ZXJzXG4gICAgdGhpcy5hdXRvc3RhcnRlZCA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcbiAgICB0aGlzLmF1dG9zdGFydGluZyA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcbiAgICB0aGlzLnRvcmNoQ29tcGF0aWJsZSA9IG5ldyBFdmVudEVtaXR0ZXIoZmFsc2UpO1xuICAgIHRoaXMuc2NhblN1Y2Nlc3MgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gICAgdGhpcy5zY2FuRmFpbHVyZSA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcbiAgICB0aGlzLnNjYW5FcnJvciA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcbiAgICB0aGlzLnNjYW5Db21wbGV0ZSA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcbiAgICB0aGlzLmNhbWVyYXNGb3VuZCA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcbiAgICB0aGlzLmNhbWVyYXNOb3RGb3VuZCA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcbiAgICB0aGlzLnBlcm1pc3Npb25SZXNwb25zZSA9IG5ldyBFdmVudEVtaXR0ZXIodHJ1ZSk7XG4gICAgdGhpcy5oYXNEZXZpY2VzID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuICAgIHRoaXMuZGV2aWNlQ2hhbmdlID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuXG4gICAgdGhpcy5fZW5hYmxlZCA9IHRydWU7XG4gICAgdGhpcy5faGludHMgPSBuZXcgTWFwPERlY29kZUhpbnRUeXBlLCBhbnk+KCk7XG4gICAgdGhpcy5hdXRvZm9jdXNFbmFibGVkID0gdHJ1ZTtcbiAgICB0aGlzLmF1dG9zdGFydCA9IHRydWU7XG4gICAgdGhpcy5mb3JtYXRzID0gW0JhcmNvZGVGb3JtYXQuUVJfQ09ERV07XG5cbiAgICAvLyBjb21wdXRlZCBkYXRhXG4gICAgdGhpcy5oYXNOYXZpZ2F0b3IgPSB0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJztcbiAgICB0aGlzLmlzTWVkaWFEZXZpY2VzU3VwcG9ydGVkID0gdGhpcy5oYXNOYXZpZ2F0b3IgJiYgISFuYXZpZ2F0b3IubWVkaWFEZXZpY2VzO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYW5kIHJlZ2lzdGVycyBhbGwgY2FtbWVyYXMuXG4gICAqL1xuICBhc3luYyBhc2tGb3JQZXJtaXNzaW9uKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXG4gICAgaWYgKCF0aGlzLmhhc05hdmlnYXRvcikge1xuICAgICAgY29uc29sZS5lcnJvcignQHp4aW5nL25neC1zY2FubmVyJywgJ0NhblxcJ3QgYXNrIHBlcm1pc3Npb24sIG5hdmlnYXRvciBpcyBub3QgcHJlc2VudC4nKTtcbiAgICAgIHRoaXMuc2V0UGVybWlzc2lvbihudWxsKTtcbiAgICAgIHJldHVybiB0aGlzLmhhc1Blcm1pc3Npb247XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmlzTWVkaWFEZXZpY2VzU3VwcG9ydGVkKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdAenhpbmcvbmd4LXNjYW5uZXInLCAnQ2FuXFwndCBnZXQgdXNlciBtZWRpYSwgdGhpcyBpcyBub3Qgc3VwcG9ydGVkLicpO1xuICAgICAgdGhpcy5zZXRQZXJtaXNzaW9uKG51bGwpO1xuICAgICAgcmV0dXJuIHRoaXMuaGFzUGVybWlzc2lvbjtcbiAgICB9XG5cbiAgICBsZXQgc3RyZWFtOiBNZWRpYVN0cmVhbTtcbiAgICBsZXQgcGVybWlzc2lvbjogYm9vbGVhbjtcblxuICAgIHRyeSB7XG4gICAgICAvLyBXaWxsIHRyeSB0byBhc2sgZm9yIHBlcm1pc3Npb25cbiAgICAgIHN0cmVhbSA9IGF3YWl0IHRoaXMuZ2V0QW55VmlkZW9EZXZpY2UoKTtcbiAgICAgIHBlcm1pc3Npb24gPSAhIXN0cmVhbTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHJldHVybiB0aGlzLmhhbmRsZVBlcm1pc3Npb25FeGNlcHRpb24oZXJyKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy50ZXJtaW5hdGVTdHJlYW0oc3RyZWFtKTtcbiAgICB9XG5cbiAgICB0aGlzLnNldFBlcm1pc3Npb24ocGVybWlzc2lvbik7XG5cbiAgICAvLyBSZXR1cm5zIHRoZSBwZXJtaXNzaW9uXG4gICAgcmV0dXJuIHBlcm1pc3Npb247XG4gIH1cblxuICAvKipcbiAgICpcbiAgICovXG4gIGdldEFueVZpZGVvRGV2aWNlKCk6IFByb21pc2U8TWVkaWFTdHJlYW0+IHtcbiAgICByZXR1cm4gbmF2aWdhdG9yLm1lZGlhRGV2aWNlcy5nZXRVc2VyTWVkaWEoeyB2aWRlbzogdHJ1ZSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUZXJtaW5hdGVzIGEgc3RyZWFtIGFuZCBpdCdzIHRyYWNrcy5cbiAgICovXG4gIHByaXZhdGUgdGVybWluYXRlU3RyZWFtKHN0cmVhbTogTWVkaWFTdHJlYW0pIHtcblxuICAgIGlmIChzdHJlYW0pIHtcbiAgICAgIHN0cmVhbS5nZXRUcmFja3MoKS5mb3JFYWNoKHQgPT4gdC5zdG9wKCkpO1xuICAgIH1cblxuICAgIHN0cmVhbSA9IHVuZGVmaW5lZDtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgaW5pdCgpIHtcbiAgICBpZiAoIXRoaXMuYXV0b3N0YXJ0KSB7XG4gICAgICBjb25zb2xlLndhcm4oJ0ZlYXR1cmUgXFwnYXV0b3N0YXJ0XFwnIGRpc2FibGVkLiBQZXJtaXNzaW9ucyBhbmQgZGV2aWNlcyByZWNvdmVyeSBoYXMgdG8gYmUgcnVuIG1hbnVhbGx5LicpO1xuXG4gICAgICAvLyBkb2VzIHRoZSBuZWNlc3NhcnkgY29uZmlndXJhdGlvbiB3aXRob3V0IGF1dG9zdGFydGluZ1xuICAgICAgdGhpcy5pbml0QXV0b3N0YXJ0T2ZmKCk7XG5cbiAgICAgIHRoaXMuX3JlYWR5ID0gdHJ1ZTtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIGNvbmZpZ3VyYXRlcyB0aGUgY29tcG9uZW50IGFuZCBzdGFydHMgdGhlIHNjYW5uZXJcbiAgICBhd2FpdCB0aGlzLmluaXRBdXRvc3RhcnRPbigpO1xuXG4gICAgdGhpcy5fcmVhZHkgPSB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoZSBjb21wb25lbnQgd2l0aG91dCBzdGFydGluZyB0aGUgc2Nhbm5lci5cbiAgICovXG4gIHByaXZhdGUgaW5pdEF1dG9zdGFydE9mZigpOiB2b2lkIHtcblxuICAgIC8vIGRvIG5vdCBhc2sgZm9yIHBlcm1pc3Npb24gd2hlbiBhdXRvc3RhcnQgaXMgb2ZmXG4gICAgdGhpcy5pc0F1dG9zdGFydGluZyA9IGZhbHNlO1xuXG4gICAgLy8ganVzdCB1cGRhdGUgZGV2aWNlcyBpbmZvcm1hdGlvblxuICAgIHRoaXMudXBkYXRlVmlkZW9JbnB1dERldmljZXMoKTtcblxuICAgIGlmICh0aGlzLl9kZXZpY2UgJiYgdGhpcy5fZGV2aWNlUHJlU3RhcnQpIHtcbiAgICAgIHRoaXMuc2V0RGV2aWNlKHRoaXMuX2RldmljZVByZVN0YXJ0KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIGNvbXBvbmVudCBhbmQgc3RhcnRzIHRoZSBzY2FubmVyLlxuICAgKiBQZXJtaXNzaW9ucyBhcmUgYXNrZWQgdG8gYWNjb21wbGlzaCB0aGF0LlxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBpbml0QXV0b3N0YXJ0T24oKTogUHJvbWlzZTx2b2lkPiB7XG5cbiAgICB0aGlzLmlzQXV0b3N0YXJ0aW5nID0gdHJ1ZTtcblxuICAgIGxldCBoYXNQZXJtaXNzaW9uOiBib29sZWFuO1xuXG4gICAgdHJ5IHtcbiAgICAgIC8vIEFza3MgZm9yIHBlcm1pc3Npb24gYmVmb3JlIGVudW1lcmF0aW5nIGRldmljZXMgc28gaXQgY2FuIGdldCBhbGwgdGhlIGRldmljZSdzIGluZm9cbiAgICAgIGhhc1Blcm1pc3Npb24gPSBhd2FpdCB0aGlzLmFza0ZvclBlcm1pc3Npb24oKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFeGNlcHRpb24gb2NjdXJyZWQgd2hpbGUgYXNraW5nIGZvciBwZXJtaXNzaW9uOicsIGUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIGZyb20gdGhpcyBwb2ludCwgdGhpbmdzIGdvbm5hIG5lZWQgcGVybWlzc2lvbnNcbiAgICBpZiAoaGFzUGVybWlzc2lvbikge1xuICAgICAgY29uc3QgZGV2aWNlcyA9IGF3YWl0IHRoaXMudXBkYXRlVmlkZW9JbnB1dERldmljZXMoKTtcbiAgICAgIGF3YWl0IHRoaXMuYXV0b3N0YXJ0U2Nhbm5lcihbLi4uZGV2aWNlc10pO1xuICAgIH1cblxuICAgIHRoaXMuaXNBdXRvc3RhcnRpbmcgPSBmYWxzZTtcbiAgICB0aGlzLmF1dG9zdGFydGVkLm5leHQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhlIGdpdmVuIGRldmljZSBpcyB0aGUgY3VycmVudCBkZWZpbmVkIG9uZS5cbiAgICovXG4gIGlzQ3VycmVudERldmljZShkZXZpY2U/OiBNZWRpYURldmljZUluZm8pIHtcbiAgICByZXR1cm4gZGV2aWNlPy5kZXZpY2VJZCA9PT0gdGhpcy5fZGV2aWNlPy5kZXZpY2VJZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeGVjdXRlcyBzb21lIGFjdGlvbnMgYmVmb3JlIGRlc3Ryb3kgdGhlIGNvbXBvbmVudC5cbiAgICovXG4gIG5nT25EZXN0cm95KCk6IHZvaWQge1xuICAgIHRoaXMucmVzZXQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKlxuICAgKi9cbiAgbmdPbkluaXQoKTogdm9pZCB7XG4gICAgdGhpcy5pbml0KCk7XG4gIH1cblxuICAvKipcbiAgICogU3RvcHMgdGhlIHNjYW5uaW5nLCBpZiBhbnkuXG4gICAqL1xuICBwdWJsaWMgc2NhblN0b3AoKSB7XG4gICAgaWYgKHRoaXMuX3NjYW5TdWJzY3JpcHRpb24pIHtcbiAgICAgIHRoaXMuY29kZVJlYWRlcj8uZ2V0U2Nhbm5lckNvbnRyb2xzKCkuc3RvcCgpO1xuICAgICAgdGhpcy5fc2NhblN1YnNjcmlwdGlvbj8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMuX3NjYW5TdWJzY3JpcHRpb24gPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHRoaXMudG9yY2hDb21wYXRpYmxlLm5leHQoZmFsc2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIFN0b3BzIHRoZSBzY2FubmluZywgaWYgYW55LlxuICAgKi9cbiAgcHVibGljIHNjYW5TdGFydCgpIHtcblxuICAgIGlmICh0aGlzLl9zY2FuU3Vic2NyaXB0aW9uKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZXJlIGlzIGFscmVhZHkgYSBzY2FuIHByb2NjZXNzIHJ1bm5pbmcuJyk7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLl9kZXZpY2UpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gZGV2aWNlIGRlZmluZWQsIGNhbm5vdCBzdGFydCBzY2FuLCBwbGVhc2UgZGVmaW5lIGEgZGV2aWNlLicpO1xuICAgIH1cblxuICAgIHRoaXMuc2NhbkZyb21EZXZpY2UodGhpcy5fZGV2aWNlLmRldmljZUlkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdG9wcyBvbGQgYGNvZGVSZWFkZXJgIGFuZCBzdGFydHMgc2Nhbm5pbmcgaW4gYSBuZXcgb25lLlxuICAgKi9cbiAgcmVzdGFydCgpOiB2b2lkIHtcbiAgICAvLyBAbm90ZSBhcGVuYXMgbmVjZXNzYXJpbyBwb3IgZW5xdWFudG8gY2F1c2EgZGEgVG9yY2hcbiAgICB0aGlzLl9jb2RlUmVhZGVyID0gdW5kZWZpbmVkO1xuXG4gICAgY29uc3QgcHJldkRldmljZSA9IHRoaXMuX3Jlc2V0KCk7XG5cbiAgICBpZiAoIXByZXZEZXZpY2UpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmRldmljZSA9IHByZXZEZXZpY2U7XG4gIH1cblxuICAvKipcbiAgICogRGlzY292ZXJzIGFuZCB1cGRhdGVzIGtub3duIHZpZGVvIGlucHV0IGRldmljZXMuXG4gICAqL1xuICBhc3luYyB1cGRhdGVWaWRlb0lucHV0RGV2aWNlcygpOiBQcm9taXNlPE1lZGlhRGV2aWNlSW5mb1tdPiB7XG5cbiAgICAvLyBwZXJtaXNzaW9ucyBhcmVuJ3QgbmVlZGVkIHRvIGdldCBkZXZpY2VzLCBidXQgdG8gYWNjZXNzIHRoZW0gYW5kIHRoZWlyIGluZm9cbiAgICBjb25zdCBkZXZpY2VzID0gYXdhaXQgQnJvd3NlckNvZGVSZWFkZXIubGlzdFZpZGVvSW5wdXREZXZpY2VzKCkgfHwgW107XG4gICAgY29uc3QgaGFzRGV2aWNlcyA9IGRldmljZXMgJiYgZGV2aWNlcy5sZW5ndGggPiAwO1xuXG4gICAgLy8gc3RvcmVzIGRpc2NvdmVyZWQgZGV2aWNlcyBhbmQgdXBkYXRlcyBpbmZvcm1hdGlvblxuICAgIHRoaXMuaGFzRGV2aWNlcy5uZXh0KGhhc0RldmljZXMpO1xuICAgIHRoaXMuY2FtZXJhc0ZvdW5kLm5leHQoWy4uLmRldmljZXNdKTtcblxuICAgIGlmICghaGFzRGV2aWNlcykge1xuICAgICAgdGhpcy5jYW1lcmFzTm90Rm91bmQubmV4dCgpO1xuICAgIH1cblxuICAgIHJldHVybiBkZXZpY2VzO1xuICB9XG5cbiAgLyoqXG4gICAqIFN0YXJ0cyB0aGUgc2Nhbm5lciB3aXRoIHRoZSBiYWNrIGNhbWVyYSBvdGhlcndpc2UgdGFrZSB0aGUgbGFzdFxuICAgKiBhdmFpbGFibGUgZGV2aWNlLlxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBhdXRvc3RhcnRTY2FubmVyKGRldmljZXM6IE1lZGlhRGV2aWNlSW5mb1tdKTogUHJvbWlzZTx2b2lkPiB7XG5cbiAgICBjb25zdCBtYXRjaGVyID0gKHsgbGFiZWwgfSkgPT4gL2JhY2t8dHLDoXN8cmVhcnx0cmFzZWlyYXxlbnZpcm9ubWVudHxhbWJpZW50ZS9naS50ZXN0KGxhYmVsKTtcblxuICAgIC8vIHNlbGVjdCB0aGUgcmVhciBjYW1lcmEgYnkgZGVmYXVsdCwgb3RoZXJ3aXNlIHRha2UgdGhlIGxhc3QgY2FtZXJhLlxuICAgIGNvbnN0IGRldmljZSA9IGRldmljZXMuZmluZChtYXRjaGVyKSB8fCBkZXZpY2VzLnBvcCgpO1xuXG4gICAgaWYgKCFkZXZpY2UpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW1wb3NzaWJsZSB0byBhdXRvc3RhcnQsIG5vIGlucHV0IGRldmljZXMgYXZhaWxhYmxlLicpO1xuICAgIH1cblxuICAgIGF3YWl0IHRoaXMuc2V0RGV2aWNlKGRldmljZSk7XG5cbiAgICB0aGlzLmRldmljZUNoYW5nZS5uZXh0KGRldmljZSk7XG4gIH1cblxuICAvKipcbiAgICogRGlzcGF0Y2hlcyB0aGUgc2NhbiBzdWNjZXNzIGV2ZW50LlxuICAgKlxuICAgKiBAcGFyYW0gcmVzdWx0IHRoZSBzY2FuIHJlc3VsdC5cbiAgICovXG4gIHByaXZhdGUgZGlzcGF0Y2hTY2FuU3VjY2VzcyhyZXN1bHQ6IFJlc3VsdCk6IHZvaWQge1xuICAgIHRoaXMuc2NhblN1Y2Nlc3MubmV4dChyZXN1bHQuZ2V0VGV4dCgpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEaXNwYXRjaGVzIHRoZSBzY2FuIGZhaWx1cmUgZXZlbnQuXG4gICAqL1xuICBwcml2YXRlIGRpc3BhdGNoU2NhbkZhaWx1cmUocmVhc29uPzogRXhjZXB0aW9uKTogdm9pZCB7XG4gICAgdGhpcy5zY2FuRmFpbHVyZS5uZXh0KHJlYXNvbik7XG4gIH1cblxuICAvKipcbiAgICogRGlzcGF0Y2hlcyB0aGUgc2NhbiBlcnJvciBldmVudC5cbiAgICpcbiAgICogQHBhcmFtIGVycm9yIHRoZSBlcnJvciB0aGluZy5cbiAgICovXG4gIHByaXZhdGUgZGlzcGF0Y2hTY2FuRXJyb3IoZXJyb3I6IGFueSk6IHZvaWQge1xuICAgIGlmICghdGhpcy5zY2FuRXJyb3Iub2JzZXJ2ZXJzLnNvbWUoeCA9PiBCb29sZWFuKHgpKSkge1xuICAgICAgY29uc29sZS5lcnJvcihgenhpbmcgc2Nhbm5lciBjb21wb25lbnQ6ICR7ZXJyb3IubmFtZX1gLCBlcnJvcik7XG4gICAgICBjb25zb2xlLndhcm4oJ1VzZSB0aGUgYChzY2FuRXJyb3IpYCBwcm9wZXJ0eSB0byBoYW5kbGUgZXJyb3JzIGxpa2UgdGhpcyEnKTtcbiAgICB9XG4gICAgdGhpcy5zY2FuRXJyb3IubmV4dChlcnJvcik7XG4gIH1cblxuICAvKipcbiAgICogRGlzcGF0Y2hlcyB0aGUgc2NhbiBldmVudC5cbiAgICpcbiAgICogQHBhcmFtIHJlc3VsdCB0aGUgc2NhbiByZXN1bHQuXG4gICAqL1xuICBwcml2YXRlIGRpc3BhdGNoU2NhbkNvbXBsZXRlKHJlc3VsdDogUmVzdWx0KTogdm9pZCB7XG4gICAgdGhpcy5zY2FuQ29tcGxldGUubmV4dChyZXN1bHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGZpbHRlcmVkIHBlcm1pc3Npb24uXG4gICAqL1xuICBwcml2YXRlIGhhbmRsZVBlcm1pc3Npb25FeGNlcHRpb24oZXJyOiBET01FeGNlcHRpb24pOiBib29sZWFuIHtcblxuICAgIC8vIGZhaWxlZCB0byBncmFudCBwZXJtaXNzaW9uIHRvIHZpZGVvIGlucHV0XG4gICAgY29uc29sZS5lcnJvcignQHp4aW5nL25neC1zY2FubmVyJywgJ0Vycm9yIHdoZW4gYXNraW5nIGZvciBwZXJtaXNzaW9uLicsIGVycik7XG5cbiAgICBsZXQgcGVybWlzc2lvbjogYm9vbGVhbjtcblxuICAgIHN3aXRjaCAoZXJyLm5hbWUpIHtcblxuICAgICAgLy8gdXN1YWxseSBjYXVzZWQgYnkgbm90IHNlY3VyZSBvcmlnaW5zXG4gICAgICBjYXNlICdOb3RTdXBwb3J0ZWRFcnJvcic6XG4gICAgICAgIGNvbnNvbGUud2FybignQHp4aW5nL25neC1zY2FubmVyJywgZXJyLm1lc3NhZ2UpO1xuICAgICAgICAvLyBjb3VsZCBub3QgY2xhaW1cbiAgICAgICAgcGVybWlzc2lvbiA9IG51bGw7XG4gICAgICAgIC8vIGNhbid0IGNoZWNrIGRldmljZXNcbiAgICAgICAgdGhpcy5oYXNEZXZpY2VzLm5leHQobnVsbCk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICAvLyB1c2VyIGRlbmllZCBwZXJtaXNzaW9uXG4gICAgICBjYXNlICdOb3RBbGxvd2VkRXJyb3InOlxuICAgICAgICBjb25zb2xlLndhcm4oJ0B6eGluZy9uZ3gtc2Nhbm5lcicsIGVyci5tZXNzYWdlKTtcbiAgICAgICAgLy8gY2xhaW1lZCBhbmQgZGVuaWVkIHBlcm1pc3Npb25cbiAgICAgICAgcGVybWlzc2lvbiA9IGZhbHNlO1xuICAgICAgICAvLyB0aGlzIG1lYW5zIHRoYXQgaW5wdXQgZGV2aWNlcyBleGlzdHNcbiAgICAgICAgdGhpcy5oYXNEZXZpY2VzLm5leHQodHJ1ZSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICAvLyB0aGUgZGV2aWNlIGhhcyBubyBhdHRhY2hlZCBpbnB1dCBkZXZpY2VzXG4gICAgICBjYXNlICdOb3RGb3VuZEVycm9yJzpcbiAgICAgICAgY29uc29sZS53YXJuKCdAenhpbmcvbmd4LXNjYW5uZXInLCBlcnIubWVzc2FnZSk7XG4gICAgICAgIC8vIG5vIHBlcm1pc3Npb25zIGNsYWltZWRcbiAgICAgICAgcGVybWlzc2lvbiA9IG51bGw7XG4gICAgICAgIC8vIGJlY2F1c2UgdGhlcmUgd2FzIG5vIGRldmljZXNcbiAgICAgICAgdGhpcy5oYXNEZXZpY2VzLm5leHQoZmFsc2UpO1xuICAgICAgICAvLyB0ZWxscyB0aGUgbGlzdGVuZXIgYWJvdXQgdGhlIGVycm9yXG4gICAgICAgIHRoaXMuY2FtZXJhc05vdEZvdW5kLm5leHQoZXJyKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ05vdFJlYWRhYmxlRXJyb3InOlxuICAgICAgICBjb25zb2xlLndhcm4oJ0B6eGluZy9uZ3gtc2Nhbm5lcicsICdDb3VsZG5cXCd0IHJlYWQgdGhlIGRldmljZShzKVxcJ3Mgc3RyZWFtLCBpdFxcJ3MgcHJvYmFibHkgaW4gdXNlIGJ5IGFub3RoZXIgYXBwLicpO1xuICAgICAgICAvLyBubyBwZXJtaXNzaW9ucyBjbGFpbWVkXG4gICAgICAgIHBlcm1pc3Npb24gPSBudWxsO1xuICAgICAgICAvLyB0aGVyZSBhcmUgZGV2aWNlcywgd2hpY2ggSSBjb3VsZG4ndCB1c2VcbiAgICAgICAgdGhpcy5oYXNEZXZpY2VzLm5leHQoZmFsc2UpO1xuICAgICAgICAvLyB0ZWxscyB0aGUgbGlzdGVuZXIgYWJvdXQgdGhlIGVycm9yXG4gICAgICAgIHRoaXMuY2FtZXJhc05vdEZvdW5kLm5leHQoZXJyKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGNvbnNvbGUud2FybignQHp4aW5nL25neC1zY2FubmVyJywgJ0kgd2FzIG5vdCBhYmxlIHRvIGRlZmluZSBpZiBJIGhhdmUgcGVybWlzc2lvbnMgZm9yIGNhbWVyYSBvciBub3QuJywgZXJyKTtcbiAgICAgICAgLy8gdW5rbm93blxuICAgICAgICBwZXJtaXNzaW9uID0gbnVsbDtcbiAgICAgICAgLy8gdGhpcy5oYXNEZXZpY2VzLm5leHQodW5kZWZpbmVkO1xuICAgICAgICBicmVhaztcblxuICAgIH1cblxuICAgIHRoaXMuc2V0UGVybWlzc2lvbihwZXJtaXNzaW9uKTtcblxuICAgIC8vIHRlbGxzIHRoZSBsaXN0ZW5lciBhYm91dCB0aGUgZXJyb3JcbiAgICB0aGlzLnBlcm1pc3Npb25SZXNwb25zZS5lcnJvcihlcnIpO1xuXG4gICAgcmV0dXJuIHBlcm1pc3Npb247XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIHZhbGlkIEJhcmNvZGVGb3JtYXQgb3IgZmFpbHMuXG4gICAqL1xuICBwcml2YXRlIGdldEJhcmNvZGVGb3JtYXRPckZhaWwoZm9ybWF0OiBzdHJpbmcgfCBCYXJjb2RlRm9ybWF0KTogQmFyY29kZUZvcm1hdCB7XG4gICAgcmV0dXJuIHR5cGVvZiBmb3JtYXQgPT09ICdzdHJpbmcnXG4gICAgICA/IEJhcmNvZGVGb3JtYXRbZm9ybWF0LnRyaW0oKS50b1VwcGVyQ2FzZSgpXVxuICAgICAgOiBmb3JtYXQ7XG4gIH1cblxuICAvKipcbiAgICogUmV0b3JuYSB1bSBjb2RlIHJlYWRlciwgY3JpYSB1bSBzZSBuZW5odW1lIGV4aXN0ZS5cbiAgICovXG4gIHByaXZhdGUgZ2V0Q29kZVJlYWRlcigpOiBCcm93c2VyTXVsdGlGb3JtYXRDb250aW51b3VzUmVhZGVyIHtcblxuICAgIGlmICghdGhpcy5fY29kZVJlYWRlcikge1xuICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgICAgZGVsYXlCZXR3ZWVuU2NhbkF0dGVtcHRzOiB0aGlzLnRpbWVCZXR3ZWVuU2NhbnMsXG4gICAgICAgIGRlbGF5QmV0d2VlblNjYW5TdWNjZXNzOiB0aGlzLmRlbGF5QmV0d2VlblNjYW5TdWNjZXNzLFxuICAgICAgfTtcbiAgICAgIHRoaXMuX2NvZGVSZWFkZXIgPSBuZXcgQnJvd3Nlck11bHRpRm9ybWF0Q29udGludW91c1JlYWRlcih0aGlzLmhpbnRzLCBvcHRpb25zKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fY29kZVJlYWRlcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdGFydHMgdGhlIGNvbnRpbnVvdXMgc2Nhbm5pbmcgZm9yIHRoZSBnaXZlbiBkZXZpY2UuXG4gICAqXG4gICAqIEBwYXJhbSBkZXZpY2VJZCBUaGUgZGV2aWNlSWQgZnJvbSB0aGUgZGV2aWNlLlxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBzY2FuRnJvbURldmljZShkZXZpY2VJZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG5cbiAgICBjb25zdCB2aWRlb0VsZW1lbnQgPSB0aGlzLnByZXZpZXdFbGVtUmVmLm5hdGl2ZUVsZW1lbnQ7XG5cbiAgICBjb25zdCBjb2RlUmVhZGVyID0gdGhpcy5nZXRDb2RlUmVhZGVyKCk7XG5cbiAgICBjb25zdCBzY2FuU3RyZWFtID0gYXdhaXQgY29kZVJlYWRlci5zY2FuRnJvbURldmljZU9ic2VydmFibGUoZGV2aWNlSWQsIHZpZGVvRWxlbWVudCk7XG5cbiAgICBpZiAoIXNjYW5TdHJlYW0pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5kZWZpbmVkIGRlY29kaW5nIHN0cmVhbSwgYWJvcnRpbmcuJyk7XG4gICAgfVxuXG4gICAgY29uc3QgbmV4dCA9ICh4OiBSZXN1bHRBbmRFcnJvcikgPT4gdGhpcy5fb25EZWNvZGVSZXN1bHQoeC5yZXN1bHQsIHguZXJyb3IpO1xuICAgIGNvbnN0IGVycm9yID0gKGVycjogYW55KSA9PiB0aGlzLl9vbkRlY29kZUVycm9yKGVycik7XG4gICAgY29uc3QgY29tcGxldGUgPSAoKSA9PiB7IH07XG5cbiAgICB0aGlzLl9zY2FuU3Vic2NyaXB0aW9uID0gc2NhblN0cmVhbS5zdWJzY3JpYmUobmV4dCwgZXJyb3IsIGNvbXBsZXRlKTtcblxuICAgIGlmICh0aGlzLl9zY2FuU3Vic2NyaXB0aW9uLmNsb3NlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbnRyb2xzID0gY29kZVJlYWRlci5nZXRTY2FubmVyQ29udHJvbHMoKTtcbiAgICBjb25zdCBoYXNUb3JjaENvbnRyb2wgPSB0eXBlb2YgY29udHJvbHMuc3dpdGNoVG9yY2ggIT09ICd1bmRlZmluZWQnO1xuXG4gICAgdGhpcy50b3JjaENvbXBhdGlibGUubmV4dChoYXNUb3JjaENvbnRyb2wpO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgZGVjb2RlIGVycm9ycy5cbiAgICovXG4gIHByaXZhdGUgX29uRGVjb2RlRXJyb3IoZXJyOiBhbnkpIHtcbiAgICB0aGlzLmRpc3BhdGNoU2NhbkVycm9yKGVycik7XG4gICAgLy8gdGhpcy5yZXNldCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgZGVjb2RlIHJlc3VsdHMuXG4gICAqL1xuICBwcml2YXRlIF9vbkRlY29kZVJlc3VsdChyZXN1bHQ6IFJlc3VsdCwgZXJyb3I6IEV4Y2VwdGlvbik6IHZvaWQge1xuXG4gICAgaWYgKHJlc3VsdCkge1xuICAgICAgdGhpcy5kaXNwYXRjaFNjYW5TdWNjZXNzKHJlc3VsdCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZGlzcGF0Y2hTY2FuRmFpbHVyZShlcnJvcik7XG4gICAgfVxuXG4gICAgdGhpcy5kaXNwYXRjaFNjYW5Db21wbGV0ZShyZXN1bHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFN0b3BzIHRoZSBjb2RlIHJlYWRlciBhbmQgcmV0dXJucyB0aGUgcHJldmlvdXMgc2VsZWN0ZWQgZGV2aWNlLlxuICAgKi9cbiAgcHJpdmF0ZSBfcmVzZXQoKTogTWVkaWFEZXZpY2VJbmZvIHtcblxuICAgIGlmICghdGhpcy5fY29kZVJlYWRlcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGRldmljZSA9IHRoaXMuX2RldmljZTtcbiAgICAvLyBkbyBub3Qgc2V0IHRoaXMuZGV2aWNlIGluc2lkZSB0aGlzIG1ldGhvZCwgaXQgd291bGQgY3JlYXRlIGEgcmVjdXJzaXZlIGxvb3BcbiAgICB0aGlzLmRldmljZSA9IHVuZGVmaW5lZDtcblxuICAgIHRoaXMuX2NvZGVSZWFkZXIgPSB1bmRlZmluZWQ7XG5cbiAgICByZXR1cm4gZGV2aWNlO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc2V0cyB0aGUgc2Nhbm5lciBhbmQgZW1pdHMgZGV2aWNlIGNoYW5nZS5cbiAgICovXG4gIHB1YmxpYyByZXNldCgpOiB2b2lkIHtcbiAgICB0aGlzLl9yZXNldCgpO1xuICAgIHRoaXMuZGV2aWNlQ2hhbmdlLmVtaXQobnVsbCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgY3VycmVudCBkZXZpY2UuXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHNldERldmljZShkZXZpY2U6IE1lZGlhRGV2aWNlSW5mbyk6IFByb21pc2U8dm9pZD4ge1xuXG4gICAgLy8gaW5zdGFudGx5IHN0b3BzIHRoZSBzY2FuIGJlZm9yZSBjaGFuZ2luZyBkZXZpY2VzXG4gICAgdGhpcy5zY2FuU3RvcCgpO1xuXG4gICAgLy8gY29ycmVjdGx5IHNldHMgdGhlIG5ldyAob3Igbm9uZSkgZGV2aWNlXG4gICAgdGhpcy5fZGV2aWNlID0gZGV2aWNlIHx8IHVuZGVmaW5lZDtcblxuICAgIGlmICghdGhpcy5fZGV2aWNlKSB7XG4gICAgICAvLyBjbGVhbnMgdGhlIHZpZGVvIGJlY2F1c2UgdXNlciByZW1vdmVkIHRoZSBkZXZpY2VcbiAgICAgIEJyb3dzZXJDb2RlUmVhZGVyLmNsZWFuVmlkZW9Tb3VyY2UodGhpcy5wcmV2aWV3RWxlbVJlZi5uYXRpdmVFbGVtZW50KTtcbiAgICB9XG5cbiAgICAvLyBpZiBlbmFibGVkLCBzdGFydHMgc2Nhbm5pbmdcbiAgICBpZiAodGhpcy5fZW5hYmxlZCAmJiBkZXZpY2UpIHtcbiAgICAgIGF3YWl0IHRoaXMuc2NhbkZyb21EZXZpY2UoZGV2aWNlLmRldmljZUlkKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgcGVybWlzc2lvbiB2YWx1ZSBhbmQgZW1taXRzIHRoZSBldmVudC5cbiAgICovXG4gIHByaXZhdGUgc2V0UGVybWlzc2lvbihoYXNQZXJtaXNzaW9uOiBib29sZWFuIHwgbnVsbCk6IHZvaWQge1xuICAgIHRoaXMuaGFzUGVybWlzc2lvbiA9IGhhc1Blcm1pc3Npb247XG4gICAgdGhpcy5wZXJtaXNzaW9uUmVzcG9uc2UubmV4dChoYXNQZXJtaXNzaW9uKTtcbiAgfVxuXG59XG4iXX0=